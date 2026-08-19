"use client";

import { useState, useTransition } from "react";
import { deletePurchaseOrder } from "./actions";

export function DeleteOrderButton({ purchaseOrderId }: { purchaseOrderId: string }) {
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-red-200">
      {confirming && (
        <p className="mb-3 text-sm font-medium text-red-700">
          פעולה זו תמחק לצמיתות את ההזמנה, כל הפריטים בה, וכל הבדיקות שנעשו — כולל בדיקות
          שכבר נסגרו ודוחות שכבר הופקו. לא ניתן לשחזר. להמשיך?
        </p>
      )}
      <div className="flex gap-2">
        {confirming && (
          <button
            disabled={pending}
            onClick={() => setConfirming(false)}
            className="rounded-xl bg-zinc-100 px-4 py-2.5 text-sm font-semibold text-zinc-700 disabled:opacity-60"
          >
            ביטול
          </button>
        )}
        <button
          disabled={pending}
          onClick={() =>
            confirming
              ? startTransition(() => deletePurchaseOrder(purchaseOrderId))
              : setConfirming(true)
          }
          className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {pending ? "מוחק..." : confirming ? "אישור מחיקת ההזמנה" : "מחיקת ההזמנה"}
        </button>
      </div>
    </div>
  );
}
