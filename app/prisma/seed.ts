import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { INSPECTION_COUNTER_START } from "../src/lib/constants";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

async function main() {
  await db.user.upsert({
    where: { code: "066716259" },
    update: {},
    create: { name: "דגנית", code: "066716259", role: "INSPECTOR" },
  });

  await db.user.upsert({
    where: { code: "100000001" },
    update: {},
    create: { name: "מנהל/ת ייבוא", code: "100000001", role: "ADMIN" },
  });

  await db.inspectionCounter.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, nextSerial: INSPECTION_COUNTER_START },
  });

  // A couple of placeholder product-master rows matching codes that appear
  // in the sample POs, so the auto-fill flow is demoable before the real
  // Excel import exists.
  await db.productMaster.upsert({
    where: { itemCode: "7290019611677" },
    update: {},
    create: {
      itemCode: "7290019611677",
      description: "שניב X80 - טנקס זוג סחבה פרימיום 50",
      itemCodeSadovsky: "SDV-1001",
      customerItemCode: "CUST-1001",
      specDimensions: "80x50 ס\"מ",
      specWeight: "120 גרם",
    },
  });

  await db.productMaster.upsert({
    where: { itemCode: "9909500000002" },
    update: {},
    create: {
      itemCode: "9909500000002",
      description: "פלסטו שיווק - פלטינום סחבה לרצפה 3 יח",
      itemCodeSadovsky: "SDV-1003",
      customerItemCode: "CUST-1003",
      specDimensions: "40x60 ס\"מ",
      specWeight: "95 גרם",
    },
  });

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
