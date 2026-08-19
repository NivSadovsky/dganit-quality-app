import Link from "next/link";
import { db } from "@/lib/db";
import { OrdersList, type OrderListRow } from "./OrdersList";

function formatDate(d: Date) {
  return new Intl.DateTimeFormat("he-IL").format(d);
}

export default async function OrdersPage() {
  const orders = await db.purchaseOrder.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { items: true } },
      items: { select: { inspections: { select: { inspectionDate: true } } } },
    },
  });

  // Per-order inspection date shown on this screen = the day the first
  // inspection in the order was actually started, i.e. the earliest
  // inspectionDate across all of the order's items.
  const rows: OrderListRow[] = orders.map((order) => {
    const dates = order.items
      .flatMap((item) => item.inspections)
      .map((i) => i.inspectionDate)
      .filter((d): d is Date => d !== null);
    const minDate = dates.length > 0 ? new Date(Math.min(...dates.map((d) => d.getTime()))) : null;

    return {
      id: order.id,
      orderNumber: order.orderNumber,
      containerNumber: order.containerNumber,
      itemCount: order._count.items,
      inspectionDate: minDate ? formatDate(minDate) : null,
    };
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

      {orders.length === 0 ? (
        <p className="rounded-2xl bg-white p-6 text-center text-sm text-zinc-500 ring-1 ring-zinc-200">
          אין עדיין הזמנות במערכת. ניתן לייבא הזמנת רכש חדשה.
        </p>
      ) : (
        <OrdersList orders={rows} />
      )}
    </div>
  );
}
