"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { saveFile } from "@/lib/storage";
import { parsePurchaseOrderPdf, PoParseError } from "@/lib/poParser";

export async function importPurchaseOrder(
  _prevState: { error?: string } | undefined,
  formData: FormData
) {
  const user = await requireUser();

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "יש לבחור קובץ PDF של הזמנת רכש" };
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  let parsed;
  try {
    parsed = await parsePurchaseOrderPdf(buffer);
  } catch (e) {
    if (e instanceof PoParseError) return { error: e.message };
    throw e;
  }

  if (parsed.orderNumber) {
    const existing = await db.purchaseOrder.findUnique({
      where: { orderNumber: parsed.orderNumber },
    });
    if (existing) {
      return { error: `הזמנה ${parsed.orderNumber} כבר יובאה בעבר` };
    }
  }

  const orderNumber = parsed.orderNumber ?? `UNKNOWN-${Date.now()}`;
  const relPath = await saveFile(`po-pdfs/${orderNumber}-${Date.now()}.pdf`, buffer);

  const codes = parsed.items.map((i) => i.itemCode).filter((c): c is string => !!c);
  const masters = codes.length
    ? await db.productMaster.findMany({ where: { itemCode: { in: codes } } })
    : [];
  const masterByCode = new Map(masters.map((m) => [m.itemCode, m]));

  const order = await db.purchaseOrder.create({
    data: {
      orderNumber,
      containerNumber: parsed.containerNumber,
      sourceFileName: relPath,
      createdById: user.id,
      items: {
        create: parsed.items.map((item) => ({
          rowIndex: item.rowIndex,
          itemCode: item.itemCode,
          description: item.description,
          quantity: item.quantity ?? 0,
          needsCodeAssignment: !item.itemCode,
          productMasterId: item.itemCode ? masterByCode.get(item.itemCode)?.id : undefined,
        })),
      },
    },
  });

  const warningsParam = parsed.warnings.length
    ? `?warnings=${encodeURIComponent(parsed.warnings.join("|"))}`
    : "";
  redirect(`/orders/${order.id}${warningsParam}`);
}
