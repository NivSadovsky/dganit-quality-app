import { db } from "@/lib/db";
import { CHECK_ROWS_BY_TYPE } from "@/lib/inspectionTemplate";
import type { ProductType } from "@/lib/constants";

export const inspectionInclude = {
  checkItems: { orderBy: { order: "asc" as const } },
  measurements: { orderBy: { order: "asc" as const } },
  findings: { orderBy: { order: "asc" as const } },
  photos: { orderBy: { order: "asc" as const } },
  orderItem: { include: { purchaseOrder: true, productMaster: true } },
  inspector: true,
};

// Returns the item's existing open/closed inspection, or null if the
// inspector still needs to pick a product type (see startInspection).
export async function getExistingInspectionForItem(orderItemId: string) {
  return db.inspection.findFirst({
    where: { orderItemId },
    orderBy: { createdAt: "desc" },
    include: inspectionInclude,
  });
}

// Creates the inspection once the inspector has chosen which product-type
// template applies (microfiber/fabric/scrubber) — see
// src/lib/inspectionTemplate.ts for the row sets this seeds.
export async function startInspection(
  orderItemId: string,
  inspectorId: string,
  productType: ProductType
) {
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
        productType,
        inspectionDate: new Date(),
        productDescription: item.description,
        itemCodeSadovsky: item.productMaster?.itemCodeSadovsky ?? null,
        specDimensions: item.productMaster?.specDimensions ?? null,
        specWeight: item.productMaster?.specWeight ?? null,
        orderOrContainer: item.purchaseOrder.containerNumber ?? item.purchaseOrder.orderNumber,
        qtyInOrder: item.quantity,
        customerItemCode: item.productMaster?.customerItemCode ?? null,
        checkItems: {
          create: CHECK_ROWS_BY_TYPE[productType].map((row, i) => ({
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

export type InspectionFull = Awaited<ReturnType<typeof startInspection>>;
