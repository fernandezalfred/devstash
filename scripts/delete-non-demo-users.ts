// Deletes every user EXCEPT the demo user (demo@devstash.io) along with all of
// their content. Deleting a User cascades to their items, collections,
// item-collection joins, custom item types, accounts, and sessions (see the
// onDelete: Cascade relations in prisma/schema.prisma). System item types
// (userId = null) and globally-shared tags are left untouched. VerificationToken
// rows aren't FK-linked to User, so they're cleaned up by email separately.
//
// Safety: DRY RUN by default — it only reports what it would delete. Pass --yes
// to actually perform the deletion.
//
//   tsx scripts/delete-non-demo-users.ts          # preview
//   tsx scripts/delete-non-demo-users.ts --yes     # execute
import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../src/generated/prisma/client";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set. Check your .env file.");
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const DEMO_EMAIL = "demo@devstash.io";
const CONFIRMED = process.argv.includes("--yes");

function targetHost(): string {
  try {
    return new URL(process.env.DATABASE_URL!).host;
  } catch {
    return "(unparseable DATABASE_URL)";
  }
}

async function main() {
  console.log(`Target database host: ${targetHost()}`);
  console.log(`Keeping: ${DEMO_EMAIL}\n`);

  // Abort if the demo user is missing, so a misconfigured DB can't wipe everyone.
  const demo = await prisma.user.findUnique({ where: { email: DEMO_EMAIL } });
  if (!demo) {
    throw new Error(
      `Demo user (${DEMO_EMAIL}) not found — aborting to avoid deleting all users. ` +
        `Run \`npm run db:seed\` first if this is unexpected.`,
    );
  }

  const where = { email: { not: DEMO_EMAIL } } as const;

  const [userCount, itemCount, collectionCount, customTypeCount, tokenCount] =
    await Promise.all([
      prisma.user.count({ where }),
      prisma.item.count({ where: { user: where } }),
      prisma.collection.count({ where: { user: where } }),
      prisma.itemType.count({ where: { user: where } }),
      prisma.verificationToken.count({
        where: { identifier: { not: DEMO_EMAIL } },
      }),
    ]);

  if (userCount === 0) {
    console.log("Nothing to delete — only the demo user exists.");
    return;
  }

  const usersToDelete = await prisma.user.findMany({
    where,
    select: { email: true },
    orderBy: { email: "asc" },
  });

  console.log(`Will delete ${userCount} user(s):`);
  for (const u of usersToDelete) console.log(`  • ${u.email}`);
  console.log("\nCascading content to be removed:");
  console.log(`  items:              ${itemCount}`);
  console.log(`  collections:        ${collectionCount}`);
  console.log(`  custom item types:  ${customTypeCount}`);
  console.log(`  verification tokens:${tokenCount} (by email)`);

  if (!CONFIRMED) {
    console.log("\n🔍 Dry run. Re-run with --yes to actually delete.");
    return;
  }

  console.log("\nDeleting…");
  // Tokens first (no cascade), then users (cascades their content).
  const tokens = await prisma.verificationToken.deleteMany({
    where: { identifier: { not: DEMO_EMAIL } },
  });
  const users = await prisma.user.deleteMany({ where });

  console.log(`✅ Deleted ${users.count} user(s) and ${tokens.count} token(s).`);
  console.log(`Remaining users: ${await prisma.user.count()}`);
}

main()
  .catch((error) => {
    console.error("❌ Deletion failed:");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
