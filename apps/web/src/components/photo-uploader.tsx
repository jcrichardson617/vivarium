"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const MAX_SIDE = 1600;

// Shrink to at most 1600px on the long side and re-encode as WebP (~200-400 KB).
async function shrink(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Could not process image"))), "image/webp", 0.85),
  );
}

export function PhotoUploader({ animalId, remaining, hasPrimary }: { animalId: string; remaining: number; hasPrimary: boolean }) {
  const router = useRouter();
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const busy = progress !== null;

  if (remaining <= 0) {
    return <p className="text-sm text-muted">Photo limit reached for your plan.</p>;
  }

  // Uploads the chosen photos one after another, up to the plan's remaining slots.
  async function upload(event: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (!picked.length) return;
    const files = picked.slice(0, remaining);
    setError(null);
    setProgress({ done: 0, total: files.length });
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    let primaryTaken = hasPrimary;
    try {
      for (const [i, file] of files.entries()) {
        const blob = await shrink(file);
        const path = `${animalId}/${crypto.randomUUID()}.webp`;
        const { error: uploadError } = await supabase.storage
          .from("animal-photos")
          .upload(path, blob, { contentType: "image/webp" });
        if (uploadError) throw uploadError;
        const { error: rowError } = await supabase.from("animal_photos").insert({
          animal_id: animalId,
          storage_path: path,
          is_primary: !primaryTaken,
          uploaded_by: userData.user?.id,
        });
        if (rowError) {
          await supabase.storage.from("animal-photos").remove([path]);
          throw rowError;
        }
        primaryTaken = true;
        setProgress({ done: i + 1, total: files.length });
      }
      if (picked.length > files.length) {
        setError(`Only ${files.length} of ${picked.length} photos were added: your plan allows ${remaining} more.`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setProgress(null);
      router.refresh();
    }
  }

  return (
    <div>
      <label className={`btn-secondary inline-block cursor-pointer text-sm ${busy ? "opacity-60" : ""}`}>
        {progress ? `Uploading ${Math.min(progress.done + 1, progress.total)} of ${progress.total}…` : remaining > 1 ? "Add photos" : "Add photo"}
        <input type="file" accept="image/*" multiple={remaining > 1} className="sr-only" disabled={busy} onChange={upload} />
      </label>
      <span className="ml-2 text-xs text-muted">{remaining} left on your plan</span>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
