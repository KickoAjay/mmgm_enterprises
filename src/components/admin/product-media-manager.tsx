"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/db/client";
import {
  addProductImageAction,
  deleteProductImageAction,
  setPrimaryImageAction,
  reorderProductImagesAction,
  setProductVideoAction,
  deleteProductVideoAction,
} from "@/features/products/admin-media-actions";
import { Button } from "@/components/ui/button";

const BUCKET = "product-media";
const MAX_IMAGE_MB = 5;
const MAX_VIDEO_MB = 50;

type ImageItem = { id: string; url: string; isPrimary: boolean; sortOrder: number };
type VideoItem = { id: string; url: string };

export function ProductMediaManager({
  productId,
  images,
  video,
}: {
  productId: string;
  images: ImageItem[];
  video: VideoItem | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function uploadFile(file: File, kind: "image" | "video"): Promise<string | null> {
    const maxMb = kind === "image" ? MAX_IMAGE_MB : MAX_VIDEO_MB;
    if (file.size > maxMb * 1024 * 1024) {
      setError(`${file.name} is larger than ${maxMb}MB`);
      return null;
    }
    if (kind === "image" && !file.type.startsWith("image/")) {
      setError(`${file.name} is not an image`);
      return null;
    }
    if (kind === "video" && !file.type.startsWith("video/")) {
      setError(`${file.name} is not a video`);
      return null;
    }

    const supabase = createClient();
    const path = `${productId}/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file);
    if (uploadError) {
      setError(`Could not upload ${file.name}`);
      return null;
    }
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    return data.publicUrl;
  }

  function handleImageFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    setError(null);
    startTransition(async () => {
      let nextSort = images.length;
      for (const file of Array.from(fileList)) {
        const url = await uploadFile(file, "image");
        if (url) {
          await addProductImageAction(productId, url, nextSort);
          nextSort += 1;
        }
      }
      router.refresh();
    });
  }

  function handleVideoFile(fileList: FileList | null) {
    const file = fileList?.[0];
    if (!file) return;
    setError(null);
    startTransition(async () => {
      const url = await uploadFile(file, "video");
      if (url) {
        await setProductVideoAction(productId, url);
        router.refresh();
      }
    });
  }

  function deleteImage(imageId: string) {
    startTransition(async () => {
      await deleteProductImageAction(imageId);
      router.refresh();
    });
  }

  function setPrimary(imageId: string) {
    startTransition(async () => {
      await setPrimaryImageAction(productId, imageId);
      router.refresh();
    });
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= images.length) return;
    const reordered = [...images];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    startTransition(async () => {
      await reorderProductImagesAction(reordered.map((img) => img.id));
      router.refresh();
    });
  }

  function deleteVideo(videoId: string) {
    startTransition(async () => {
      await deleteProductVideoAction(videoId);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="text-meta font-semibold tracking-wide text-foreground uppercase">
          Images
        </h2>
        <input
          type="file"
          accept="image/*"
          multiple
          disabled={isPending}
          onChange={(e) => handleImageFiles(e.target.files)}
          className="mt-3 text-sm text-foreground file:mr-3 file:border file:border-border file:bg-background file:px-3 file:py-1.5 file:text-sm"
        />
        {images.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-4">
            {images.map((img, index) => (
              <div key={img.id} className="flex flex-col items-center gap-2">
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.url}
                    alt=""
                    className="size-28 rounded-sm border border-border object-cover"
                  />
                  {img.isPrimary ? (
                    <span className="absolute top-1 left-1 bg-primary px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground">
                      Primary
                    </span>
                  ) : null}
                </div>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => move(index, -1)}
                    disabled={index === 0 || isPending}
                    className="text-meta text-muted-foreground hover:text-foreground disabled:opacity-30"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => move(index, 1)}
                    disabled={index === images.length - 1 || isPending}
                    className="text-meta text-muted-foreground hover:text-foreground disabled:opacity-30"
                  >
                    ↓
                  </button>
                  {!img.isPrimary ? (
                    <button
                      type="button"
                      onClick={() => setPrimary(img.id)}
                      disabled={isPending}
                      className="text-meta text-primary hover:underline"
                    >
                      Set Primary
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => deleteImage(img.id)}
                    disabled={isPending}
                    className="text-meta text-destructive hover:underline"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">No images yet.</p>
        )}
      </div>

      <div>
        <h2 className="text-meta font-semibold tracking-wide text-foreground uppercase">
          Video
        </h2>
        {video ? (
          <div className="mt-3 flex items-center gap-4">
            <video src={video.url} controls className="h-32 border border-border" />
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={() => deleteVideo(video.id)}
              className="uppercase tracking-wide"
            >
              Remove Video
            </Button>
          </div>
        ) : (
          <input
            type="file"
            accept="video/*"
            disabled={isPending}
            onChange={(e) => handleVideoFile(e.target.files)}
            className="mt-3 text-sm text-foreground file:mr-3 file:border file:border-border file:bg-background file:px-3 file:py-1.5 file:text-sm"
          />
        )}
      </div>

      {error ? <p className="text-meta text-destructive">{error}</p> : null}
    </div>
  );
}
