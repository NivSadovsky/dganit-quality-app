"use client";

import { useRef, useTransition } from "react";
import type { InspectionFull } from "@/lib/inspections";
import { updateGeneralDetails } from "./actions";

const FIELDS: { name: keyof InspectionFull & string; label: string }[] = [
  { name: "productDescription", label: "תיאור המוצר" },
  { name: "itemCodeSadovsky", label: "קוד פריט סדובסקי" },
  { name: "specDimensions", label: "מידות לפי מפרט" },
  { name: "specWeight", label: "משקל לפי מפרט" },
  { name: "orderOrContainer", label: "מספר הזמנה / מכולה" },
  { name: "supplierName", label: "שם ספק" },
];

function toDateInputValue(d: Date | string | null): string {
  if (!d) return "";
  return new Date(d).toISOString().slice(0, 10);
}

export function GeneralDetailsCard({ inspection }: { inspection: InspectionFull }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [, startTransition] = useTransition();

  const save = () => {
    if (!formRef.current) return;
    const fd = new FormData(formRef.current);
    startTransition(() => updateGeneralDetails(inspection.id, fd));
  };

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-200">
      <h2 className="mb-3 font-bold text-brand">פרטים כלליים</h2>
      <form ref={formRef} onBlur={save} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {FIELDS.map((f) => (
          <label key={f.name} className="flex flex-col gap-1 text-sm">
            <span className="text-zinc-500">{f.label}</span>
            <input
              name={f.name}
              defaultValue={(inspection[f.name] as string) ?? ""}
              className="rounded-lg border border-zinc-300 px-3 py-2"
            />
          </label>
        ))}
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-zinc-500">תאריך בדיקה</span>
          <input
            name="inspectionDate"
            type="date"
            defaultValue={toDateInputValue(inspection.inspectionDate)}
            className="rounded-lg border border-zinc-300 px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-zinc-500">שם הבודק/ת</span>
          <input
            disabled
            value={inspection.inspector.name}
            className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-zinc-500"
          />
        </label>
      </form>
    </div>
  );
}
