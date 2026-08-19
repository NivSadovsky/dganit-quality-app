import { notFound } from "next/navigation";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getExistingInspectionForItem } from "@/lib/inspections";
import { db } from "@/lib/db";
import { fileUrl } from "@/lib/storage";
import { CHECK_SECTIONS, CHECK_SECTION_LABELS_HE, type ProductType } from "@/lib/constants";
import { GeneralDetailsCard } from "./GeneralDetailsCard";
import { SampleDetailsCard } from "./SampleDetailsCard";
import { CheckSection } from "./CheckSection";
import { MeasurementsTable } from "./MeasurementsTable";
import { FindingsList } from "./FindingsList";
import { PhotoGallery } from "./PhotoGallery";
import { ConclusionsCard } from "./ConclusionsCard";
import { CloseInspectionButton } from "./CloseInspectionButton";
import { ProductTypeSelect } from "./ProductTypeSelect";

export default async function InspectionItemPage({
  params,
}: PageProps<"/orders/[orderId]/items/[itemId]">) {
  const { itemId } = await params;
  await requireUser();

  const orderItem = await db.orderItem.findUnique({ where: { id: itemId } });
  if (!orderItem) notFound();

  const inspection = await getExistingInspectionForItem(itemId);
  if (!inspection) {
    return <ProductTypeSelect itemId={itemId} description={orderItem.description} />;
  }

  if (inspection.status === "CLOSED") {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 p-4">
        <Link href={`/orders/${orderItem.purchaseOrderId}`} className="text-sm text-brand underline">
          חזרה לרשימת הפריטים
        </Link>
        <div className="rounded-2xl bg-white p-6 text-center shadow-sm ring-1 ring-zinc-200">
          <p className="text-lg font-bold text-brand">בדיקה #{inspection.serialNumber} נסגרה</p>
          <p className="mt-1 text-sm text-zinc-500">{inspection.productDescription}</p>
          {inspection.pdfUrl && (
            <a
              href={fileUrl(inspection.pdfUrl, `בדיקת-איכות-${inspection.serialNumber}.pdf`)}
              className="mt-4 inline-block rounded-xl bg-brand px-5 py-2.5 font-semibold text-white"
            >
              הורדת דוח PDF
            </a>
          )}
          <div className="mt-4 flex flex-col items-center gap-2 border-t border-zinc-100 pt-4">
            {inspection.pdfUrlEn && (
              <a
                href={fileUrl(inspection.pdfUrlEn, `quality-report-${inspection.serialNumber}-en.pdf`)}
                className="text-sm font-medium text-brand underline"
              >
                הורדת דוח באנגלית
              </a>
            )}
            <Link
              href={`/orders/${orderItem.purchaseOrderId}/items/${itemId}/translate`}
              className="text-sm text-zinc-500 underline"
            >
              {inspection.pdfUrlEn ? "עריכת תרגום / יצירה מחדש" : "תרגום לאנגלית"}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const uncheckedCount = inspection.checkItems.filter((c) => c.result === "NA").length;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 p-4 pb-24">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-brand">
          בדיקה #{inspection.serialNumber}
        </h1>
        <Link
          href={`/orders/${orderItem.purchaseOrderId}`}
          className="text-sm text-brand underline"
        >
          חזרה לרשימת הפריטים
        </Link>
      </div>

      <GeneralDetailsCard inspection={inspection} />
      <SampleDetailsCard inspection={inspection} />

      {CHECK_SECTIONS.map((section) => {
        const rows = inspection.checkItems.filter((c) => c.section === section);
        if (rows.length === 0) return null;
        return (
          <CheckSection
            key={section}
            inspectionId={inspection.id}
            section={section}
            title={CHECK_SECTION_LABELS_HE[section]}
            rows={rows}
          />
        );
      })}

      <MeasurementsTable
        inspectionId={inspection.id}
        productType={inspection.productType as ProductType}
        rows={inspection.measurements}
      />
      <FindingsList inspectionId={inspection.id} findings={inspection.findings} />
      <PhotoGallery inspectionId={inspection.id} photos={inspection.photos} />
      <ConclusionsCard inspectionId={inspection.id} conclusions={inspection.conclusions} />

      <CloseInspectionButton inspectionId={inspection.id} uncheckedCount={uncheckedCount} />
    </div>
  );
}
