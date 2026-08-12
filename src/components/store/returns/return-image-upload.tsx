"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { createClient } from "@/lib/db/client";

const MAX_IMAGES = 5;
const BUCKET = "return-evidence";

type UploadedImage = { path: string; previewUrl: string };

// Uploads directly from the browser to Supabase Storage — RLS on
// storage.objects (Phase 10 migration) scopes writes to a path prefixed
// with the caller's own auth.uid(), so this needs no server round-trip
// for the file bytes. Each uploaded path is submitted with the form via a
// hidden input; the actual return_items.image_urls write happens
// server-side in requestReturnAction alongside the rest of the request.
export function ReturnImageUpload({ userId }: { userId: string }) {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    setError(null);

    const remaining = MAX_IMAGES - images.length;
    if (remaining <= 0) {
      setError(`You can attach up to ${MAX_IMAGES} images`);
      return;
    }

    const files = Array.from(fileList).slice(0, remaining);
    setIsUploading(true);
    const supabase = createClient();

    for (const file of files) {
      const path = `${userId}/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file);
      if (uploadError) {
        setError(`Could not upload ${file.name}`);
        continue;
      }
      setImages((prev) => [...prev, { path, previewUrl: URL.createObjectURL(file) }]);
    }
    setIsUploading(false);
  }

  function removeImage(path: string) {
    setImages((prev) => prev.filter((img) => img.path !== path));
    const supabase = createClient();
    void supabase.storage.from(BUCKET).remove([path]);
  }

  return (
    <div>
      <input
        type="file"
        accept="image/*"
        multiple
        disabled={isUploading || images.length >= MAX_IMAGES}
        onChange={(e) => handleFiles(e.target.files)}
        className="text-sm text-foreground file:mr-3 file:border file:border-border file:bg-background file:px-3 file:py-1.5 file:text-sm file:text-foreground"
      />
      {error ? <p className="text-meta mt-2 text-destructive">{error}</p> : null}

      {images.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-3">
          {images.map((img) => (
            <div key={img.path} className="relative size-20 overflow-hidden rounded-sm border border-border">
              <input type="hidden" name="imagePaths" value={img.path} />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.previewUrl} alt="Return evidence" className="size-full object-cover" />
              <button
                type="button"
                onClick={() => removeImage(img.path)}
                className="absolute top-0.5 right-0.5 flex size-5 items-center justify-center rounded-full bg-background/90 text-foreground"
                aria-label="Remove image"
              >
                <X className="size-3" />
              </button>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
