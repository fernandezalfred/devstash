// Smoke-tests the database connection and reports current row counts.
// Run with `tsx scripts/test-db.ts`.
import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set. Check your .env file.");
  }

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
