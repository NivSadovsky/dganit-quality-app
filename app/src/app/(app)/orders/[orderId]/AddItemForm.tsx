"use client";

import { useRef, useState, useTransition } from "react";
import { addOrderItem } from "./actions";

export function AddItemForm({ purchaseOrderId }: { purchaseOrderId: string }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-2xl border-2 border-dashed border-zinc-300 p-3 text-center text-sm font-medium text-zinc-500 hover:border-brand hover:text-brand"
      >
        + הוספת פריט שחסר בהזמנה
      </button>
    );
  }

  return (
    <form
      ref={formRef}
      action={(fd) =>
        startTransition(async () => {
          await addOrderItem(purchaseOrderId, fd);
          formRef.current?.reset();
          setOpen(false);
        })
      }
      className="flex flex-col gap-2 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-200"
    >
      <p className="text-sm font-medium text-brand">הוספת פריט</p>
      <input
        name="itemCode"
        placeholder="קוד פריט (אופציונלי)"
        className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
      />
      <input
        name="description"
        placeholder="תיאור"
        required
        className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
      />
      <input
        name="quantity"
        type="number"
        placeholder="כמות"
        required
        className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
      />
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="flex-1 rounded-lg bg-brand px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {pending ? "מוסיף..." : "הוספה"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-lg bg-zinc-100 px-3 py-2 text-sm"
        >
          ביטול
        </button>
      </div>
    </form>
  );
}
