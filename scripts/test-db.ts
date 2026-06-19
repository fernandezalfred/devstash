// Smoke-tests the database connection, reports row counts, and prints the
// seeded demo data (user, collections, items).
// Run with `tsx scripts/test-db.ts`.
import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../src/generated/prisma/client";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set. Check your .env file.");
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const DEMO_EMAIL = "demo@devstash.io";

async function main() {
  // A trivial query confirms we can actually reach the database.
  await prisma.$queryRaw`SELECT 1`;
  console.log("✅ Connected to the database.\n");

  const [users, itemTypes, items, collections, tags] = await Promise.all([
    prisma.user.count(),
    prisma.itemType.count(),
    prisma.item.count(),
    prisma.collection.count(),
    prisma.tag.count(),
  ]);

  console.log("Row counts:");
  console.log(`  users:        ${users}`);
  console.log(`  itemTypes:    ${itemTypes}`);
  console.log(`  items:        ${items}`);
  console.log(`  collections:  ${collections}`);
  console.log(`  tags:         ${tags}`);

  // --- System item types -------------------------------------------------
  const systemTypes = await prisma.itemType.findMany({
    where: { isSystem: true, userId: null },
    orderBy: { name: "asc" },
  });

  console.log(`\nSystem item types (${systemTypes.length}):`);
  for (const t of systemTypes) {
    console.log(`  ${t.icon.padEnd(10)} ${t.name.padEnd(8)} ${t.color}`);
  }

  // --- Demo user + their collections and items ---------------------------
  const demo = await prisma.user.findUnique({
    where: { email: DEMO_EMAIL },
    include: {
      collections: {
        orderBy: { name: "asc" },
        include: {
          items: {
            orderBy: { item: { createdAt: "asc" } },
            include: { item: { include: { itemType: true } } },
          },
        },
      },
    },
  });

  if (!demo) {
    console.log(`\n⚠️  No demo user found (${DEMO_EMAIL}). Run \`npm run db:seed\`.`);
    return;
  }

  console.log(
    `\nDemo user: ${demo.name ?? "(no name)"} <${demo.email}>  ` +
      `(isPro: ${demo.isPro}, verified: ${demo.emailVerified ? "yes" : "no"})`,
  );
  console.log(`Collections (${demo.collections.length}):`);

  for (const collection of demo.collections) {
    console.log(`\n  📂 ${collection.name} — ${collection.description ?? ""}`);
    for (const { item } of collection.items) {
      const detail = item.url ?? item.language ?? item.itemType.name;
      console.log(`     • [${item.itemType.name}] ${item.title}  (${detail})`);
    }
  }

  console.log("\n✅ Demo data looks good.");
}

main()
  .catch((error) => {
    console.error("❌ Database test failed:");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
