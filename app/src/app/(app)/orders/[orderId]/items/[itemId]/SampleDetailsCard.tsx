"use client";

import { useRef, useTransition } from "react";
import type { InspectionFull } from "@/lib/inspections";
import { updateSampleDetails } from "./actions";

export function SampleDetailsCard({ inspection }: { inspection: InspectionFull }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [, startTransition] = useTransition();

  const save = () => {
    if (!formRef.current) return;
    const fd = new FormData(formRef.current);
    startTransition(() => updateSampleDetails(inspection.id, fd));
  };

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-200">
      <h2 className="mb-3 font-bold text-brand">פרטי המדגם</h2>
      <form ref={formRef} onBlur={save} className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-zinc-500">כמות לבדיקה</span>
          <input
            name="qtyToInspect"
            type="number"
            defaultValue={inspection.qtyToInspect ?? ""}
            className="rounded-lg border border-zinc-300 px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-zinc-500">כמות קרטונים לבדיקה</span>
          <input
            name="cartonsToInspect"
            type="number"
            defaultValue={inspection.cartonsToInspect ?? ""}
            className="rounded-lg border border-zinc-300 px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-zinc-500">כמות בהזמנה</span>
          <input
            name="qtyInOrder"
            type="number"
            defaultValue={inspection.qtyInOrder ?? ""}
            className="rounded-lg border border-zinc-300 px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-zinc-500">קוד פריט לקוח</span>
          <input
            name="customerItemCode"
            defaultValue={inspection.customerItemCode ?? ""}
            className="rounded-lg border border-zinc-300 px-3 py-2"
          />
        </label>
      </form>
    </div>
  );
}
