"use client";

import { useActionState, useRef, useState } from "react";
import { importPurchaseOrder } from "./actions";

export function ImportForm() {
  const [state, formAction, pending] = useActionState(importPurchaseOrder, undefined);
  const [fileName, setFileName] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const onDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file || !inputRef.current) return;
    const dt = new DataTransfer();
    dt.items.add(file);
    inputRef.current.files = dt.files;
    setFileName(file.name);
  };

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <label
        htmlFor="file"
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-10 text-center transition ${
          dragging ? "border-brand bg-brand/5" : "border-zinc-300 bg-white hover:border-brand"
        }`}
      >
        <span className="text-4xl">📄</span>
        <span className="font-medium">
          {fileName ?? "לחצו לבחירת קובץ PDF, או גררו אותו לכאן"}
        </span>
        <input
          ref={inputRef}
          id="file"
          name="file"
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
        />
      </label>
      {state?.error && <p className="text-center text-sm text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending || !fileName}
        className="w-full rounded-xl bg-brand px-4 py-3 font-semibold text-white transition hover:bg-brand-dark disabled:opacity-50"
      >
        {pending ? "מייבא..." : "ייבוא"}
      </button>
    </form>
  );
}
