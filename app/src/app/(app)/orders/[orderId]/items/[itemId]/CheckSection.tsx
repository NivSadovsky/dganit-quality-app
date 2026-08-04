"use client";

import { useTransition } from "react";
import type { InspectionCheckItem } from "@/generated/prisma/client";
import { updateCheckItem } from "./actions";
import type { CheckSection as CheckSectionType } from "@/lib/constants";

export function CheckSection({
  title,
  rows,
}: {
  inspectionId: string;
  section: CheckSectionType;
  title: string;
  rows: InspectionCheckItem[];
}) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-200">
      <h2 className="mb-3 font-bold text-brand">{title}</h2>
      <div className="flex flex-col gap-2">
        {rows.map((row) => (
          <CheckRow key={row.id} row={row} />
        ))}
      </div>
    </div>
  );
}

function CheckRow({ row }: { row: InspectionCheckItem }) {
  const [pending, startTransition] = useTransition();

  const setResult = (result: "OK" | "NOT_OK") => {
    startTransition(() =>
      updateCheckItem(row.id, { result: result === row.result ? "NA" : result })
    );
  };

  return (
    <div className="flex flex-col gap-2 border-b border-zinc-100 pb-2 last:border-0 last:pb-0">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium">{row.label}</span>
        <div className="flex gap-1.5">
          <button
            disabled={pending}
            onClick={() => setResult("OK")}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium disabled:opacity-50 ${
              row.result === "OK" ? "bg-green-600 text-white" : "bg-zinc-100 text-zinc-700"
            }`}
          >
            תקין
          </button>
          <button
            disabled={pending}
            onClick={() => setResult("NOT_OK")}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium disabled:opacity-50 ${
              row.result === "NOT_OK" ? "bg-red-600 text-white" : "bg-zinc-100 text-zinc-700"
            }`}
          >
            לא תקין
          </button>
        </div>
      </div>
      <input
        placeholder="הערה (אופציונלי)"
        defaultValue={row.note ?? ""}
        onBlur={(e) => startTransition(() => updateCheckItem(row.id, { note: e.target.value }))}
        className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs"
      />
    </div>
  );
}
