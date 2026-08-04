"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { ITEM_DECISIONS } from "@/lib/constants";

const decisionSchema = z.enum(ITEM_DECISIONS);

export async function setItemDecision(itemId: string, decision: (typeof ITEM_DECISIONS)[number]) {
  await requireUser();
  const value = decisionSchema.parse(decision);
  const item = await db.orderItem.update({
    where: { id: itemId },
    data: { decision: value },
  });
  revalidatePath(`/orders/${item.purchaseOrderId}`);
}

const editSchema = z.object({
  itemCode: z.string().trim().min(1).nullable(),
  description: z.string().trim().min(1),
  quantity: z.coerce.number().int().min(0),
});

export async function updateOrderItem(itemId: string, formData: FormData) {
  await requireUser();
  const parsed = editSchema.parse({
    itemCode: (formData.get("itemCode") as string)?.trim() || null,
    description: formData.get("description"),
    quantity: formData.get("quantity"),
  });

  let productMasterId: string | null = null;
  if (parsed.itemCode) {
    const master = await db.productMaster.findUnique({ where: { itemCode: parsed.itemCode } });
    productMasterId = master?.id ?? null;
  }

  const item = await db.orderItem.update({
    where: { id: itemId },
    data: {
      itemCode: parsed.itemCode,
      description: parsed.description,
      quantity: parsed.quantity,
      needsCodeAssignment: !parsed.itemCode,
      productMasterId,
    },
  });
  revalidatePath(`/orders/${item.purchaseOrderId}`);
}

// Manually add a line item that's missing from the imported PO (e.g. the
// supplier forgot it, or it's not on the purchase order at all).
export async function addOrderItem(purchaseOrderId: string, formData: FormData) {
  await requireUser();
  const parsed = editSchema.parse({
    itemCode: (formData.get("itemCode") as string)?.trim() || null,
    description: formData.get("description"),
    quantity: formData.get("quantity"),
  });

  let productMasterId: string | null = null;
  if (parsed.itemCode) {
    const master = await db.productMaster.findUnique({ where: { itemCode: parsed.itemCode } });
    productMasterId = master?.id ?? null;
  }

  const maxRow = await db.orderItem.aggregate({
    where: { purchaseOrderId },
    _max: { rowIndex: true },
  });

  await db.orderItem.create({
    data: {
      purchaseOrderId,
      rowIndex: (maxRow._max.rowIndex ?? 0) + 1,
      itemCode: parsed.itemCode,
      description: parsed.description,
      quantity: parsed.quantity,
      needsCodeAssignment: !parsed.itemCode,
      productMasterId,
    },
  });
  revalidatePath(`/orders/${purchaseOrderId}`);
}

// Remove a line item that shouldn't be in the order (duplicate, mis-parsed,
// or simply doesn't belong). Blocked once a report has been finalized for
// it — deleting a closed inspection would destroy a record that's already
// been handed out as a PDF.
export async function deleteOrderItem(itemId: string) {
  await requireUser();

  const item = await db.orderItem.findUniqueOrThrow({
    where: { id: itemId },
    include: { inspections: { where: { status: "CLOSED" } } },
  });

  if (item.inspections.length > 0) {
    throw new Error("לא ניתן למחוק פריט עם בדיקה שכבר נסגרה");
  }

  await db.orderItem.delete({ where: { id: itemId } });
  revalidatePath(`/orders/${item.purchaseOrderId}`);
}
