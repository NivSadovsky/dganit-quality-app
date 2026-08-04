"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { saveFile } from "@/lib/storage";
import { CHECK_RESULTS, SEVERITIES } from "@/lib/constants";
import { renderInspectionPdf } from "@/lib/pdf/renderInspectionPdf";
import { inspectionInclude } from "@/lib/inspections";

async function revalidateInspection(inspectionId: string) {
  const inspection = await db.inspection.findUnique({
    where: { id: inspectionId },
    select: { orderItem: { select: { purchaseOrderId: true, id: true } } },
  });
  if (inspection) {
    revalidatePath(
      `/orders/${inspection.orderItem.purchaseOrderId}/items/${inspection.orderItem.id}`
    );
  }
}

// ---- general / sample details -------------------------------------------

const generalSchema = z.object({
  productDescription: z.string().trim().min(1),
  itemCodeSadovsky: z.string().trim().optional(),
  specDimensions: z.string().trim().optional(),
  specWeight: z.string().trim().optional(),
  orderOrContainer: z.string().trim().optional(),
});

export async function updateGeneralDetails(inspectionId: string, formData: FormData) {
  await requireUser();
  const parsed = generalSchema.parse(Object.fromEntries(formData));
  await db.inspection.update({ where: { id: inspectionId }, data: parsed });
  await revalidateInspection(inspectionId);
}

const sampleSchema = z.object({
  qtyToInspect: z.coerce.number().int().min(0).optional(),
  cartonsToInspect: z.coerce.number().int().min(0).optional(),
  qtyInOrder: z.coerce.number().int().min(0).optional(),
  customerItemCode: z.string().trim().optional(),
});

export async function updateSampleDetails(inspectionId: string, formData: FormData) {
  await requireUser();
  const raw = Object.fromEntries(formData);
  const parsed = sampleSchema.parse({
    qtyToInspect: raw.qtyToInspect || undefined,
    cartonsToInspect: raw.cartonsToInspect || undefined,
    qtyInOrder: raw.qtyInOrder || undefined,
    customerItemCode: raw.customerItemCode,
  });
  await db.inspection.update({ where: { id: inspectionId }, data: parsed });
  await revalidateInspection(inspectionId);
}

export async function updateConclusions(inspectionId: string, conclusions: string) {
  await requireUser();
  await db.inspection.update({ where: { id: inspectionId }, data: { conclusions } });
  await revalidateInspection(inspectionId);
}

// ---- check items (תקין / לא תקין) ----------------------------------------

const resultSchema = z.enum(CHECK_RESULTS);

export async function updateCheckItem(
  checkItemId: string,
  data: { result?: (typeof CHECK_RESULTS)[number]; note?: string }
) {
  await requireUser();
  const item = await db.inspectionCheckItem.update({
    where: { id: checkItemId },
    data: {
      ...(data.result ? { result: resultSchema.parse(data.result) } : {}),
      ...(data.note !== undefined ? { note: data.note } : {}),
    },
  });
  await revalidateInspection(item.inspectionId);
}

// ---- measurements ----------------------------------------------------------

export async function addMeasurementRow(inspectionId: string) {
  await requireUser();
  const count = await db.inspectionMeasurement.count({ where: { inspectionId } });
  await db.inspectionMeasurement.create({ data: { inspectionId, order: count } });
  await revalidateInspection(inspectionId);
}

export async function updateMeasurementRow(
  rowId: string,
  data: { unitWeightG?: number | null; widthCm?: number | null; lengthCm?: number | null; color?: string | null }
) {
  await requireUser();
  const row = await db.inspectionMeasurement.update({ where: { id: rowId }, data });
  await revalidateInspection(row.inspectionId);
}

export async function deleteMeasurementRow(rowId: string) {
  await requireUser();
  const row = await db.inspectionMeasurement.delete({ where: { id: rowId } });
  await revalidateInspection(row.inspectionId);
}

// ---- findings ----------------------------------------------------------

export async function addFinding(inspectionId: string) {
  await requireUser();
  const count = await db.inspectionFinding.count({ where: { inspectionId } });
  await db.inspectionFinding.create({
    data: { inspectionId, order: count, text: "" },
  });
  await revalidateInspection(inspectionId);
}

export async function updateFinding(
  findingId: string,
  data: { text?: string; severity?: (typeof SEVERITIES)[number] }
) {
  await requireUser();
  const finding = await db.inspectionFinding.update({
    where: { id: findingId },
    data: {
      ...(data.text !== undefined ? { text: data.text } : {}),
      ...(data.severity ? { severity: z.enum(SEVERITIES).parse(data.severity) } : {}),
    },
  });
  await revalidateInspection(finding.inspectionId);
}

export async function deleteFinding(findingId: string) {
  await requireUser();
  const finding = await db.inspectionFinding.delete({ where: { id: findingId } });
  await revalidateInspection(finding.inspectionId);
}

// ---- photos ----------------------------------------------------------

export async function uploadPhoto(inspectionId: string, formData: FormData) {
  await requireUser();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return;

  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const relPath = await saveFile(`inspection-photos/${inspectionId}/${Date.now()}.${ext}`, buffer);

  const count = await db.inspectionPhoto.count({ where: { inspectionId } });
  await db.inspectionPhoto.create({
    data: { inspectionId, order: count, url: relPath, isPrimary: count === 0 },
  });
  await revalidateInspection(inspectionId);
}

export async function updatePhotoNote(photoId: string, note: string) {
  await requireUser();
  const photo = await db.inspectionPhoto.update({ where: { id: photoId }, data: { note } });
  await revalidateInspection(photo.inspectionId);
}

export async function deletePhoto(photoId: string) {
  await requireUser();
  const photo = await db.inspectionPhoto.delete({ where: { id: photoId } });
  await revalidateInspection(photo.inspectionId);
}

// ---- close ----------------------------------------------------------

export async function closeInspection(inspectionId: string) {
  await requireUser();
  const inspection = await db.inspection.findUniqueOrThrow({
    where: { id: inspectionId },
    include: inspectionInclude,
  });

  const pdfBuffer = await renderInspectionPdf(inspection);
  const relPath = await saveFile(
    `inspection-reports/${inspection.serialNumber}.pdf`,
    pdfBuffer
  );

  await db.inspection.update({
    where: { id: inspectionId },
    data: { status: "CLOSED", closedAt: new Date(), pdfUrl: relPath },
  });

  revalidatePath(`/orders/${inspection.orderItem.purchaseOrderId}/items/${inspection.orderItemId}`);
}
