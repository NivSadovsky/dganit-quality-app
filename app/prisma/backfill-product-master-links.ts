// One-off admin script: link already-imported OrderItems to ProductMaster
// rows that didn't exist yet when they were imported (productMasterId was
// set once, at import time — see orders/import/actions.ts — and never
// re-evaluated). Also removes the fake placeholder ProductMaster row from
// prisma/seed.ts (barcode 9909500000002) now that real data covers it.
//
//   npx tsx prisma/backfill-product-master-links.ts             # dry run
//   npx tsx prisma/backfill-product-master-links.ts --apply     # writes

import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const FAKE_PLACEHOLDER_ITEM_CODE = "9909500000002";

async function main() {
  const apply = process.argv.includes("--apply");
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const db = new PrismaClient({ adapter });

  const unlinked = await db.orderItem.findMany({
    where: { productMasterId: null, itemCode: { not: null } },
    select: { id: true, itemCode: true, description: true },
  });

  const codes = [...new Set(unlinked.map((i) => i.itemCode!))];
  const masters = await db.productMaster.findMany({ where: { itemCode: { in: codes } } });
  const byCode = new Map(masters.map((m) => [m.itemCode, m]));

  const toLink = unlinked.filter((i) => byCode.has(i.itemCode!));
  console.log(`Unlinked order items: ${unlinked.length}`);
  console.log(`Now matchable against ProductMaster: ${toLink.length}`);
  for (const i of toLink.slice(0, 5)) console.log(" ", i.itemCode, i.description);

  const fakeRow = await db.productMaster.findUnique({ where: { itemCode: FAKE_PLACEHOLDER_ITEM_CODE } });
  if (fakeRow && fakeRow.itemCodeSadovsky === "SDV-1003") {
    console.log(`\nFake placeholder row found: ${fakeRow.itemCode} (${fakeRow.description}) — will delete.`);
  } else {
    console.log("\nFake placeholder row already gone or changed — nothing to delete.");
  }

  if (!apply) {
    console.log("\nDry run only — pass --apply to write to the database.");
    return;
  }

  for (const item of toLink) {
    await db.orderItem.update({
      where: { id: item.id },
      data: { productMasterId: byCode.get(item.itemCode!)!.id },
    });
  }

  if (fakeRow && fakeRow.itemCodeSadovsky === "SDV-1003") {
    // Any OrderItem still pointing at it (shouldn't be any real ones) keeps
    // working — the FK just goes stale, no cascade needed since nothing
    // references it by barcode elsewhere.
    await db.productMaster.delete({ where: { id: fakeRow.id } });
  }

  console.log(`\nDone. Linked ${toLink.length} order item(s).`);
  await db.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
