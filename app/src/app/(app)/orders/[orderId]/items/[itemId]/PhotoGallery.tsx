"use client";

import { useRef, useState, useTransition } from "react";
import type { InspectionPhoto } from "@/generated/prisma/client";
import { fileUrl } from "@/lib/fileUrl";
import { uploadPhoto, updatePhotoNote, deletePhoto } from "./actions";

export function PhotoGallery({
  inspectionId,
  photos,
}: {
  inspectionId: string;
  photos: InspectionPhoto[];
}) {
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const onFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.set("file", file);
    await uploadPhoto(inspectionId, fd);
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-200">
      <h2 className="mb-3 font-bold text-brand">תמונות</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {photos.map((photo) => (
          <div key={photo.id} className="flex flex-col gap-1">
            <div className="relative overflow-hidden rounded-xl bg-zinc-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={fileUrl(photo.url)} alt="" className="aspect-square w-full object-cover" />
              {photo.isPrimary && (
                <span className="absolute right-1 top-1 rounded bg-brand px-1.5 py-0.5 text-[10px] text-white">
                  ראשית
                </span>
              )}
            </div>
            <input
              placeholder="הערה"
              defaultValue={photo.note ?? ""}
              onBlur={(e) =>
                startTransition(() => updatePhotoNote(photo.id, e.target.value))
              }
              className="rounded-lg border border-zinc-200 px-2 py-1 text-xs"
            />
            <button
              disabled={pending}
              onClick={() => startTransition(() => deletePhoto(photo.id))}
              className="text-xs text-zinc-400 underline"
            >
              מחיקה
            </button>
          </div>
        ))}

        <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-zinc-300 text-zinc-400 hover:border-brand hover:text-brand">
          <span className="text-2xl">{uploading ? "…" : "+"}</span>
          <span className="text-xs">
            {photos.length === 0 ? "צילום ראשי" : "הוספת תמונה"}
          </span>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            disabled={uploading}
            onChange={onFileSelected}
          />
        </label>
      </div>
    </div>
  );
}
