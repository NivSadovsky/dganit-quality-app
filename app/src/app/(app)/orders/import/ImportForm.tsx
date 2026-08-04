"use client";

import { useActionState, useState } from "react";
import { importPurchaseOrder } from "./actions";

export function ImportForm() {
  const [state, formAction, pending] = useActionState(importPurchaseOrder, undefined);
  const [fileName, setFileName] = useState<string | null>(null);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <label
        htmlFor="file"
        className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-zinc-300 bg-white p-10 text-center hover:border-brand"
      >
        <span className="text-4xl">📄</span>
        <span className="font-medium">
          {fileName ?? "לחצו לבחירת קובץ PDF, או גררו אותו לכאן"}
        </span>
        <input
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
