"use client";

import { useTransition } from "react";
import type { InspectionMeasurement } from "@/generated/prisma/client";
import { addMeasurementRow, updateMeasurementRow, deleteMeasurementRow } from "./actions";

export function MeasurementsTable({
  inspectionId,
  rows,
}: {
  inspectionId: string;
  rows: InspectionMeasurement[];
}) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-200">
      <h2 className="mb-3 font-bold text-brand">מידות ומשקלים</h2>
      <div className="flex flex-col gap-2">
        {rows.map((row) => (
          <div key={row.id} className="grid grid-cols-5 items-center gap-1.5">
            <NumInput
              placeholder="משקל (g)"
              defaultValue={row.unitWeightG}
              onSave={(v) => updateMeasurementRow(row.id, { unitWeightG: v })}
            />
            <NumInput
              placeholder="רוחב (cm)"
              defaultValue={row.widthCm}
              onSave={(v) => updateMeasurementRow(row.id, { widthCm: v })}
            />
            <NumInput
              placeholder="אורך (cm)"
              defaultValue={row.lengthCm}
              onSave={(v) => updateMeasurementRow(row.id, { lengthCm: v })}
            />
            <input
              placeholder="צבע"
              defaultValue={row.color ?? ""}
              onBlur={(e) =>
                startTransition(() => updateMeasurementRow(row.id, { color: e.target.value }))
              }
              className="rounded-lg border border-zinc-300 px-2 py-1.5 text-xs"
            />
            <button
              disabled={pending}
              onClick={() => startTransition(() => deleteMeasurementRow(row.id))}
              className="rounded-lg bg-zinc-100 px-2 py-1.5 text-xs text-zinc-500"
            >
              מחיקה
            </button>
          </div>
        ))}
      </div>
      <button
        disabled={pending}
        onClick={() => startTransition(() => addMeasurementRow(inspectionId))}
        className="mt-3 w-full rounded-lg bg-zinc-100 px-3 py-2 text-sm font-medium text-brand"
      >
        + הוספת שורה
      </button>
    </div>
  );
}

function NumInput({
  placeholder,
  defaultValue,
  onSave,
}: {
  placeholder: string;
  defaultValue: number | null;
  onSave: (v: number | null) => void;
}) {
  return (
    <input
      type="number"
      placeholder={placeholder}
      defaultValue={defaultValue ?? ""}
      onBlur={(e) => onSave(e.target.value === "" ? null : Number(e.target.value))}
      className="rounded-lg border border-zinc-300 px-2 py-1.5 text-xs"
    />
  );
}
