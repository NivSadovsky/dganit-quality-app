-- AlterTable
ALTER TABLE "Inspection" ADD COLUMN "productType" TEXT NOT NULL DEFAULT 'MICROFIBER',
ADD COLUMN "productDescriptionEn" TEXT,
ADD COLUMN "supplierName" TEXT,
ADD COLUMN "inspectionDate" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "InspectionMeasurement" ADD COLUMN "clothWeightG" DOUBLE PRECISION,
ADD COLUMN "padWeightG" DOUBLE PRECISION,
ADD COLUMN "thicknessCm" DOUBLE PRECISION,
ADD COLUMN "rollWeightG" DOUBLE PRECISION,
ADD COLUMN "threadThicknessMicron" DOUBLE PRECISION,
ADD COLUMN "fabricType" TEXT;
