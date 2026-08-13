"use server";

import { createClient } from "@/lib/db/server";
import { createServiceClient } from "@/lib/db/service";
import { requireRole } from "@/lib/auth/session";
import { logAdminAction } from "@/lib/auth/audit";

const BUCKET = "product-media";

function pathFromPublicUrl(url: string): string | null {
  const marker = `/object/public/${BUCKET}/`;
  const index = url.indexOf(marker);
  return index === -1 ? null : url.slice(index + marker.length);
}

// Metadata-only insert — the file itself is already in Storage by the
// time this runs (uploaded client-side with the admin's own session,
// same direct-to-storage pattern as Phase 10's return-evidence uploads,
// just to a public bucket this time since product photography is a
// marketing asset). Optimization/serving is handled by next/image at
// request time (next.config.ts already allows **.supabase.co) rather
// than a separate processing step here.
export async function addProductImageAction(
  productId: string,
  url: string,
  sortOrder: number,
): Promise<void> {
  await requireRole(["SUPER_ADMIN", "ADMIN", "PRODUCT_MANAGER"]);
  const supabase = await createClient();
  await supabase.from("product_images").insert({
    product_id: productId,
    url,
    sort_order: sortOrder,
    is_primary: sortOrder === 0,
  });
}

export async function deleteProductImageAction(imageId: string): Promise<void> {
  const membership = await requireRole(["SUPER_ADMIN", "ADMIN", "PRODUCT_MANAGER"]);
  const supabase = await createClient();

  const { data: image } = await supabase
    .from("product_images")
    .select("url")
    .eq("id", imageId)
    .maybeSingle();
  await supabase.from("product_images").delete().eq("id", imageId);

  if (image) {
    const path = pathFromPublicUrl(image.url);
    if (path) {
      const service = createServiceClient();
      await service.storage.from(BUCKET).remove([path]);
    }
  }

  await logAdminAction({
    adminUserId: membership.id,
    action: "PRODUCT_IMAGE_DELETED",
    entityType: "product_images",
    entityId: imageId,
  });
}

export async function setPrimaryImageAction(productId: string, imageId: string): Promise<void> {
  await requireRole(["SUPER_ADMIN", "ADMIN", "PRODUCT_MANAGER"]);
  const supabase = await createClient();
  await supabase.from("product_images").update({ is_primary: false }).eq("product_id", productId);
  await supabase.from("product_images").update({ is_primary: true }).eq("id", imageId);
}

export async function reorderProductImagesAction(orderedImageIds: string[]): Promise<void> {
  await requireRole(["SUPER_ADMIN", "ADMIN", "PRODUCT_MANAGER"]);
  const supabase = await createClient();
  await Promise.all(
    orderedImageIds.map((id, index) =>
      supabase.from("product_images").update({ sort_order: index }).eq("id", id),
    ),
  );
}

// One video per product keeps this simple — replaces any existing one
// rather than managing a list, matching how saree listings realistically
// use video (a single turntable/drape demo, not a gallery of clips).
export async function setProductVideoAction(productId: string, url: string): Promise<void> {
  await requireRole(["SUPER_ADMIN", "ADMIN", "PRODUCT_MANAGER"]);
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("product_videos")
    .select("id, url")
    .eq("product_id", productId);

  if (existing && existing.length > 0) {
    const service = createServiceClient();
    for (const video of existing) {
      const path = pathFromPublicUrl(video.url);
      if (path) await service.storage.from(BUCKET).remove([path]);
    }
    await supabase.from("product_videos").delete().eq("product_id", productId);
  }

  await supabase.from("product_videos").insert({ product_id: productId, url, sort_order: 0 });
}

export async function deleteProductVideoAction(videoId: string): Promise<void> {
  await requireRole(["SUPER_ADMIN", "ADMIN", "PRODUCT_MANAGER"]);
  const supabase = await createClient();
  const { data: video } = await supabase
    .from("product_videos")
    .select("url")
    .eq("id", videoId)
    .maybeSingle();
  await supabase.from("product_videos").delete().eq("id", videoId);

  if (video) {
    const path = pathFromPublicUrl(video.url);
    if (path) {
      const service = createServiceClient();
      await service.storage.from(BUCKET).remove([path]);
    }
  }
}
