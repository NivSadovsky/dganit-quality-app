import { notFound } from "next/navigation";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getOrCreateInspectionForItem, inspectionInclude } from "@/lib/inspections";
import { db } from "@/lib/db";
import { fileUrl } from "@/lib/storage";
import { GeneralDetailsCard } from "./GeneralDetailsCard";
import { SampleDetailsCard } from "./SampleDetailsCard";
import { CheckSection } from "./CheckSection";
import { MeasurementsTable } from "./MeasurementsTable";
import { FindingsList } from "./FindingsList";
import { PhotoGallery } from "./PhotoGallery";
import { ConclusionsCard } from "./ConclusionsCard";
import { CloseInspectionButton } from "./CloseInspectionButton";

export default async function InspectionItemPage({
  params,
}: PageProps<"/orders/[orderId]/items/[itemId]">) {
  const { itemId } = await params;
  const user = await requireUser();

  const orderItem = await db.orderItem.findUnique({ where: { id: itemId } });
  if (!orderItem) notFound();

  // Prefer an already-closed inspection for this item if one exists, so a
  // second visit shows the final report instead of silently opening a new one.
  const closed = await db.inspection.findFirst({
    where: { orderItemId: itemId, status: "CLOSED" },
    orderBy: { createdAt: "desc" },
    include: inspectionInclude,
  });

  const inspection = closed ?? (await getOrCreateInspectionForItem(itemId, user.id));

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

      <CheckSection
        inspectionId={inspection.id}
        section="PACKAGING"
        title="אריזה"
        rows={inspection.checkItems.filter((c) => c.section === "PACKAGING")}
      />
      <CheckSection
        inspectionId={inspection.id}
        section="VISUAL"
        title="בדיקה ויזואלית מארז"
        rows={inspection.checkItems.filter((c) => c.section === "VISUAL")}
      />
      <CheckSection
        inspectionId={inspection.id}
        section="PRODUCT"
        title="תוצאות בדיקת המוצר"
        rows={inspection.checkItems.filter((c) => c.section === "PRODUCT")}
      />

      <MeasurementsTable inspectionId={inspection.id} rows={inspection.measurements} />
      <FindingsList inspectionId={inspection.id} findings={inspection.findings} />
      <PhotoGallery inspectionId={inspection.id} photos={inspection.photos} />
      <ConclusionsCard inspectionId={inspection.id} conclusions={inspection.conclusions} />

      <CloseInspectionButton inspectionId={inspection.id} uncheckedCount={uncheckedCount} />
    </div>
  );
}
