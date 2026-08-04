"use client";

import { useTransition } from "react";
import { updateConclusions } from "./actions";

export function ConclusionsCard({
  inspectionId,
  conclusions,
}: {
  inspectionId: string;
  conclusions: string | null;
}) {
  const [, startTransition] = useTransition();

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-200">
      <h2 className="mb-3 font-bold text-brand">מסקנות</h2>
      <textarea
        rows={4}
        placeholder="מלל חופשי..."
        defaultValue={conclusions ?? ""}
        onBlur={(e) => startTransition(() => updateConclusions(inspectionId, e.target.value))}
        className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
      />
    </div>
  );
}
