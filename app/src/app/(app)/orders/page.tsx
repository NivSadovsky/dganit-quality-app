import Link from "next/link";
import { db } from "@/lib/db";

export default async function OrdersPage() {
  const orders = await db.purchaseOrder.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { items: true } } },
  });

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-brand">הזמנות</h1>
        <Link
          href="/orders/import"
          className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white"
        >
          + ייבוא הזמנה
        </Link>
      </div>

      {orders.length === 0 && (
        <p className="rounded-2xl bg-white p-6 text-center text-sm text-zinc-500 ring-1 ring-zinc-200">
          אין עדיין הזמנות במערכת. ניתן לייבא הזמנת רכש חדשה.
        </p>
      )}

      <div className="flex flex-col gap-2">
        {orders.map((order) => (
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
            </div>
            <span className="text-xs text-zinc-400">{order._count.items} פריטים</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
