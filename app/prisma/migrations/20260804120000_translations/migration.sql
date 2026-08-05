-- AlterTable
ALTER TABLE "Inspection" ADD COLUMN "inspectorNameEn" TEXT,
ADD COLUMN "conclusionsEn" TEXT,
ADD COLUMN "pdfUrlEn" TEXT;

-- AlterTable
ALTER TABLE "InspectionCheckItem" ADD COLUMN "noteEn" TEXT;

-- AlterTable
ALTER TABLE "InspectionFinding" ADD COLUMN "textEn" TEXT;
