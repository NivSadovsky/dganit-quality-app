import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { fileUrl } from "@/lib/storage";
import { ItemRow } from "./ItemRow";
import { AddItemForm } from "./AddItemForm";

export default async function OrderPage({
  params,
  searchParams,
}: PageProps<"/orders/[orderId]">) {
  const { orderId } = await params;
  const sp = await searchParams;
  const warnings = typeof sp.warnings === "string" ? sp.warnings.split("|") : [];

  const order = await db.purchaseOrder.findUnique({
    where: { id: orderId },
    include: { items: { orderBy: { rowIndex: "asc" } } },
  });
  if (!order) notFound();

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 p-4">
      <Link href="/orders" className="text-sm text-brand underline">
        חזרה לרשימת ההזמנות
      </Link>

      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-200">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold text-brand">הזמנה {order.orderNumber}</h1>
          <a
            href={fileUrl(order.sourceFileName, `הזמנת-רכש-${order.orderNumber}.pdf`)}
            className="text-sm text-brand underline"
          >
            מסמך מקור
          </a>
        </div>
        {order.containerNumber && (
          <p className="mt-1 text-sm text-zinc-500">מכולה: {order.containerNumber}</p>
        )}
      </div>

      {warnings.length > 0 && (
        <div className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800 ring-1 ring-amber-200">
          <p className="mb-1 font-medium">שימו לב לפני שממשיכים:</p>
          <ul className="list-inside list-disc">
            {warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {order.items.map((item) => (
          <ItemRow key={item.id} item={item} orderId={order.id} />
        ))}
        <AddItemForm purchaseOrderId={order.id} />
      </div>
    </div>
  );
}
