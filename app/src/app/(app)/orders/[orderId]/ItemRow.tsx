"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import type { OrderItem } from "@/generated/prisma/client";
import { setItemDecision, updateOrderItem, deleteOrderItem } from "./actions";
import type { ItemDecision } from "@/lib/constants";

export function ItemRow({ item, orderId }: { item: OrderItem; orderId: string }) {
  const [editing, setEditing] = useState(item.needsCodeAssignment);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const decide = (decision: ItemDecision) => {
    startTransition(() => {
      setItemDecision(item.id, decision === item.decision ? "PENDING" : decision);
    });
  };

  const onDelete = () => {
    setDeleteError(null);
    startTransition(async () => {
      try {
        await deleteOrderItem(item.id);
      } catch (e) {
        setDeleteError(e instanceof Error ? e.message : "מחיקה נכשלה");
        setConfirmingDelete(false);
      }
    });
  };

  if (confirmingDelete) {
    return (
      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-red-300">
        <p className="text-sm font-medium">למחוק את הפריט &quot;{item.description}&quot;?</p>
        <div className="mt-3 flex gap-2">
          <button
            disabled={pending}
            onClick={onDelete}
            className="flex-1 rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            אישור מחיקה
          </button>
          <button
            disabled={pending}
            onClick={() => setConfirmingDelete(false)}
            className="rounded-lg bg-zinc-100 px-3 py-2 text-sm"
          >
            ביטול
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`rounded-2xl bg-white p-4 shadow-sm ring-1 ${
        item.needsCodeAssignment ? "ring-amber-300" : "ring-zinc-200"
      }`}
    >
      {editing ? (
        <form
          action={(fd) =>
            startTransition(async () => {
              await updateOrderItem(item.id, fd);
              setEditing(false);
            })
          }
          className="flex flex-col gap-2"
        >
          {item.needsCodeAssignment && (
            <p className="text-xs font-medium text-amber-700">
              לא נמצא קוד פריט בהזמנה — יש להשלים ידנית
            </p>
          )}
          <input
            name="itemCode"
            defaultValue={item.itemCode ?? ""}
            placeholder="קוד פריט"
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          />
          <input
            name="description"
            defaultValue={item.description}
            placeholder="תיאור"
            required
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          />
          <input
            name="quantity"
            type="number"
            defaultValue={item.quantity}
            placeholder="כמות"
            required
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 rounded-lg bg-brand px-3 py-2 text-sm font-medium text-white"
            >
              שמירה
            </button>
            {!item.needsCodeAssignment && (
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="rounded-lg bg-zinc-100 px-3 py-2 text-sm"
              >
                ביטול
              </button>
            )}
          </div>
        </form>
      ) : (
        <>
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-medium leading-snug">{item.description}</p>
              <p className="mt-0.5 text-xs text-zinc-500">
                {item.itemCode ?? "ללא קוד פריט"} · כמות: {item.quantity}
              </p>
            </div>
            <div className="flex shrink-0 gap-2 text-xs">
              <button onClick={() => setEditing(true)} className="text-brand underline">
                עריכה
              </button>
              <button onClick={() => setConfirmingDelete(true)} className="text-red-600 underline">
                מחיקה
              </button>
            </div>
          </div>

          {deleteError && <p className="mt-2 text-xs text-red-600">{deleteError}</p>}

          <div className="mt-3 flex gap-2">
            <button
              disabled={pending}
              onClick={() => decide("INSPECT")}
              className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition disabled:opacity-50 ${
                item.decision === "INSPECT"
                  ? "bg-brand text-white"
                  : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
              }`}
            >
              לבדוק
            </button>
            <button
              disabled={pending}
              onClick={() => decide("SKIP")}
              className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition disabled:opacity-50 ${
                item.decision === "SKIP"
                  ? "bg-zinc-700 text-white"
                  : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
              }`}
            >
              לא לבדוק
            </button>
          </div>

          {item.decision === "INSPECT" && (
            <Link
              href={`/orders/${orderId}/items/${item.id}`}
              className="mt-2 block rounded-lg bg-brand/10 px-3 py-2 text-center text-sm font-medium text-brand"
            >
              פתיחת בדיקה ←
            </Link>
          )}
        </>
      )}
    </div>
  );
}
