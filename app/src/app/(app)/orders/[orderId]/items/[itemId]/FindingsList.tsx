"use client";

import { useTransition } from "react";
import type { InspectionFinding } from "@/generated/prisma/client";
import { addFinding, updateFinding, deleteFinding } from "./actions";
import { SEVERITIES, SEVERITY_LABELS_HE, type Severity } from "@/lib/constants";

export function FindingsList({
  inspectionId,
  findings,
}: {
  inspectionId: string;
  findings: InspectionFinding[];
}) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-200">
      <h2 className="mb-3 font-bold text-brand">פירוט ממצאי הבדיקה</h2>
      <div className="flex flex-col gap-3">
        {findings.map((f) => (
          <div key={f.id} className="flex flex-col gap-2 rounded-xl bg-zinc-50 p-3">
            <textarea
              placeholder="תיאור הממצא"
              defaultValue={f.text}
              onBlur={(e) => startTransition(() => updateFinding(f.id, { text: e.target.value }))}
              rows={2}
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
            />
            <div className="flex items-center justify-between gap-2">
              <div className="flex gap-1.5">
                {SEVERITIES.map((sev) => (
                  <button
                    key={sev}
                    disabled={pending}
                    onClick={() => startTransition(() => updateFinding(f.id, { severity: sev as Severity }))}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium disabled:opacity-50 ${
                      f.severity === sev
                        ? severityColor(sev)
                        : "bg-zinc-100 text-zinc-700"
                    }`}
                  >
                    {SEVERITY_LABELS_HE[sev as Severity]}
                  </button>
                ))}
              </div>
              <button
                disabled={pending}
                onClick={() => startTransition(() => deleteFinding(f.id))}
                className="text-xs text-zinc-400 underline"
              >
                מחיקה
              </button>
            </div>
          </div>
        ))}
      </div>
      <button
        disabled={pending}
        onClick={() => startTransition(() => addFinding(inspectionId))}
        className="mt-3 w-full rounded-lg bg-zinc-100 px-3 py-2 text-sm font-medium text-brand"
      >
        + הוספת שורה
      </button>
    </div>
  );
}

function severityColor(sev: string) {
  if (sev === "HIGH") return "bg-red-600 text-white";
  if (sev === "MEDIUM") return "bg-amber-500 text-white";
  return "bg-yellow-300 text-zinc-800";
}
