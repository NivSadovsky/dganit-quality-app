// One-off admin script to add a user (see seed.ts for the same upsert
// pattern used for the initial two users).
//
//   npx tsx prisma/add-user.ts --name="שם" --code="123456789" --role=ADMIN

import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

function arg(name: string): string | undefined {
  const found = process.argv.find((a) => a.startsWith(`--${name}=`));
  return found?.slice(name.length + 3);
}

async function main() {
  const name = arg("name");
  const code = arg("code");
  const role = arg("role") ?? "INSPECTOR";

  if (!name || !code) {
    console.error('Usage: --name="..." --code="123456789" [--role=ADMIN|INSPECTOR]');
    process.exit(1);
  }
  if (!/^\d{9}$/.test(code)) {
    console.error("Code must be exactly 9 digits.");
    process.exit(1);
  }
  if (role !== "ADMIN" && role !== "INSPECTOR") {
    console.error("Role must be ADMIN or INSPECTOR.");
    process.exit(1);
  }

  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const db = new PrismaClient({ adapter });

  const user = await db.user.upsert({
    where: { code },
    update: { name, role },
    create: { name, code, role },
  });

  console.log("Saved:", user);
  await db.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
