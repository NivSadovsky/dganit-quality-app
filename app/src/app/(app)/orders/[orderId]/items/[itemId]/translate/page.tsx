import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { inspectionInclude } from "@/lib/inspections";
import { TranslateForm } from "./TranslateForm";

export default async function TranslatePage({
  params,
}: PageProps<"/orders/[orderId]/items/[itemId]/translate">) {
  const { orderId, itemId } = await params;

  const inspection = await db.inspection.findFirst({
    where: { orderItemId: itemId, status: "CLOSED" },
    orderBy: { createdAt: "desc" },
    include: inspectionInclude,
  });
  if (!inspection) notFound();

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 p-4 pb-24">
      <Link href={`/orders/${orderId}/items/${itemId}`} className="text-sm text-brand underline">
        חזרה לבדיקה
      </Link>
      <div>
        <h1 className="text-lg font-bold text-brand">תרגום לאנגלית — בדיקה #{inspection.serialNumber}</h1>
        <p className="mt-1 text-sm text-zinc-500">
          יש להשלים תרגום לכל שורה עם תוכן. שדות ריקים יישארו ריקים גם באנגלית.
        </p>
      </div>
      <TranslateForm inspection={inspection} />
    </div>
  );
}
