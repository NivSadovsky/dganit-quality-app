"use client";

import { useState } from "react";
import Link from "next/link";

export type OrderListRow = {
  id: string;
  orderNumber: string;
  containerNumber: string | null;
  itemCount: number;
  inspectionDate: string | null; // pre-formatted, he-IL
};

export function OrdersList({ orders }: { orders: OrderListRow[] }) {
  const [query, setQuery] = useState("");

  const q = query.trim().toLowerCase();
  const filtered = q
    ? orders.filter((o) =>
        [o.orderNumber, o.containerNumber ?? "", o.inspectionDate ?? ""].some((f) =>
          f.toLowerCase().includes(q)
        )
      )
    : orders;

  return (
    <div className="flex flex-col gap-3">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="חיפוש לפי מספר הזמנה, מכולה, או תאריך"
        className="rounded-xl border border-zinc-300 px-4 py-2.5 text-sm"
      />

      {filtered.length === 0 && (
        <p className="rounded-2xl bg-white p-6 text-center text-sm text-zinc-500 ring-1 ring-zinc-200">
          לא נמצאו הזמנות תואמות.
        </p>
      )}

      <div className="flex flex-col gap-2">
        {filtered.map((order) => (
          <Link
            key={order.id}
            href={`/orders/${order.id}`}
            className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-200 hover:ring-brand"
          >
            <div>
              <p className="font-medium">הזמנה {order.orderNumber}</p>
              {order.containerNumber && (
                <p className="text-xs text-zinc-500">מכולה: {order.containerNumber}</p>
              )}
              {order.inspectionDate && (
                <p className="text-xs text-zinc-500">תאריך בדיקה: {order.inspectionDate}</p>
              )}
            </div>
            <span className="text-xs text-zinc-400">{order.itemCount} פריטים</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
