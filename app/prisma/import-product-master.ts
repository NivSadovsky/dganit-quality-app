// One-off admin script to load the real product master data into
// ProductMaster from the spec spreadsheet (see reference/product-master/,
// kept out of git since it's real business data — see po_document_format
// memory for why reference/ is gitignored).
//
// Run locally with a reachable DATABASE_URL, or via Railway's web Console
// (same way as `npx prisma db seed`):
//
//   npx tsx prisma/import-product-master.ts                 # dry run, no writes
//   npx tsx prisma/import-product-master.ts --apply          # writes to the DB
//   npx tsx prisma/import-product-master.ts --apply --file="reference/product-master/other-file.xlsx"

import { readFileSync } from "fs";
import { resolve } from "path";
import * as XLSX from "xlsx";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const DEFAULT_FILE = "reference/product-master/מפרט מוצרי מיקרופייבר.xlsx";
const SHEET_NAME = "גיליון2";

interface SourceRow {
  SKU: string | number;
  "size (cm)": string;
  "weight(g)": string;
  "שם המוצר": string;
  "ברקוד": string | number;
}

interface Row {
  itemCode: string;
  itemCodeSadovsky: string;
  description: string;
  specDimensions: string;
  specWeight: string;
}

function isValidBarcode(raw: unknown): raw is string | number {
  if (raw === null || raw === undefined) return false;
  const s = String(raw).trim().toLowerCase();
  return s !== "" && s !== "0" && s !== "nan" && s !== "null";
}

// The source sheet has a handful of rows with the literal text "NULL" as
// the product name (not a missing cell — an actual bad string), left over
// from whatever exported this spreadsheet.
function isValidName(raw: unknown): boolean {
  const s = String(raw ?? "").trim();
  return s !== "" && s.toLowerCase() !== "null";
}

function parseRows(filePath: string): { rows: Row[]; skipped: number; total: number } {
  const buf = readFileSync(filePath);
  const wb = XLSX.read(buf, { type: "buffer" });
  const sheet = wb.Sheets[SHEET_NAME];
  if (!sheet) {
    throw new Error(`Sheet "${SHEET_NAME}" not found. Available: ${wb.SheetNames.join(", ")}`);
  }
  const raw = XLSX.utils.sheet_to_json<SourceRow>(sheet, { defval: "" });

  const rows: Row[] = [];
  let skipped = 0;
  for (const r of raw) {
    if (!isValidBarcode(r["ברקוד"]) || !isValidName(r["שם המוצר"])) {
      skipped++;
      continue;
    }
    rows.push({
      itemCode: String(r["ברקוד"]).trim(),
      itemCodeSadovsky: String(r.SKU ?? "").trim(),
      description: String(r["שם המוצר"]).trim(),
      specDimensions: String(r["size (cm)"] ?? "").trim(),
      specWeight: String(r["weight(g)"] ?? "").trim(),
    });
  }

  // A handful of barcodes repeat in the source sheet — keep the last row
  // for each so the import is deterministic (upsert would just overwrite
  // anyway, this just makes the dry-run count accurate).
  const byCode = new Map<string, Row>();
  for (const row of rows) byCode.set(row.itemCode, row);

  return { rows: [...byCode.values()], skipped, total: raw.length };
}

async function main() {
  const args = process.argv.slice(2);
  const apply = args.includes("--apply");
  const fileArg = args.find((a) => a.startsWith("--file="));
  const filePath = resolve(process.cwd(), fileArg ? fileArg.slice("--file=".length) : DEFAULT_FILE);

  console.log(`Reading: ${filePath}`);
  const { rows, skipped, total } = parseRows(filePath);
  console.log(`Total source rows: ${total}`);
  console.log(`Skipped (no usable barcode or name): ${skipped}`);
  console.log(`Unique products to import: ${rows.length}`);
  console.log("Sample:");
  for (const r of rows.slice(0, 3)) console.log(" ", r);

  if (!apply) {
    console.log("\nDry run only — pass --apply to write to the database.");
    return;
  }

  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const db = new PrismaClient({ adapter });

  let created = 0;
  let updated = 0;
  for (const row of rows) {
    const existing = await db.productMaster.findUnique({ where: { itemCode: row.itemCode } });
    await db.productMaster.upsert({
      where: { itemCode: row.itemCode },
      update: {
        description: row.description,
        itemCodeSadovsky: row.itemCodeSadovsky || null,
        specDimensions: row.specDimensions || null,
        specWeight: row.specWeight || null,
      },
      create: {
        itemCode: row.itemCode,
        description: row.description,
        itemCodeSadovsky: row.itemCodeSadovsky || null,
        specDimensions: row.specDimensions || null,
        specWeight: row.specWeight || null,
      },
    });
    if (existing) updated++;
    else created++;
  }

  console.log(`\nDone. Created ${created}, updated ${updated}.`);
  await db.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
