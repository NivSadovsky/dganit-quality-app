import { db } from "@/lib/db";
import { DEFAULT_CHECK_ROWS } from "@/lib/inspectionTemplate";

export const inspectionInclude = {
  checkItems: { orderBy: { order: "asc" as const } },
  measurements: { orderBy: { order: "asc" as const } },
  findings: { orderBy: { order: "asc" as const } },
  photos: { orderBy: { order: "asc" as const } },
  orderItem: { include: { purchaseOrder: true, productMaster: true } },
  inspector: true,
};

export async function getOrCreateInspectionForItem(orderItemId: string, inspectorId: string) {
  const existing = await db.inspection.findFirst({
    where: { orderItemId, status: "OPEN" },
    include: inspectionInclude,
  });
  if (existing) return existing;

  const item = await db.orderItem.findUniqueOrThrow({
    where: { id: orderItemId },
    include: { purchaseOrder: true, productMaster: true },
  });

  const inspection = await db.$transaction(async (tx) => {
    const counter = await tx.inspectionCounter.upsert({
      where: { id: 1 },
      update: { nextSerial: { increment: 1 } },
      create: { id: 1, nextSerial: 23457 },
    });
    const serialNumber = counter.nextSerial - 1;

    return tx.inspection.create({
      data: {
        serialNumber,
        orderItemId: item.id,
        inspectorId,
        productDescription: item.description,
        itemCodeSadovsky: item.productMaster?.itemCodeSadovsky ?? null,
        specDimensions: item.productMaster?.specDimensions ?? null,
        specWeight: item.productMaster?.specWeight ?? null,
        orderOrContainer: item.purchaseOrder.containerNumber ?? item.purchaseOrder.orderNumber,
        qtyInOrder: item.quantity,
        customerItemCode: item.productMaster?.customerItemCode ?? null,
        checkItems: {
          create: DEFAULT_CHECK_ROWS.map((row, i) => ({
            order: i,
            section: row.section,
            label: row.label,
          })),
        },
      },
    });
  });

  return db.inspection.findUniqueOrThrow({ where: { id: inspection.id }, include: inspectionInclude });
}

export type InspectionFull = Awaited<ReturnType<typeof getOrCreateInspectionForItem>>;
