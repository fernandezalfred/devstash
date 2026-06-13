// Seeds the immutable system item types (see context/project-overview.md).
// Run with `npx prisma db seed` (configured in prisma.config.ts) or `tsx prisma/seed.ts`.
import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// name -> { icon (lucide), color (hex) }. These ship by default and are global
// (userId = null) and immutable (isSystem = true).
const SYSTEM_ITEM_TYPES = [
  { name: "snippet", icon: "Code", color: "#3b82f6" },
  { name: "prompt", icon: "Sparkles", color: "#8b5cf6" },
  { name: "command", icon: "Terminal", color: "#f97316" },
  { name: "note", icon: "StickyNote", color: "#fde047" },
  { name: "link", icon: "Link", color: "#10b981" },
  { name: "file", icon: "File", color: "#6b7280" },
  { name: "image", icon: "Image", color: "#ec4899" },
] as const;

async function main() {
  for (const type of SYSTEM_ITEM_TYPES) {
    // The @@unique([userId, name]) constraint does not dedupe rows where userId
    // is NULL (Postgres treats NULLs as distinct), so guard with a manual check
    // to keep the seed idempotent for global system types.
    const existing = await prisma.itemType.findFirst({
      where: { name: type.name, userId: null, isSystem: true },
    });

    if (existing) {
      await prisma.itemType.update({
        where: { id: existing.id },
        data: { icon: type.icon, color: type.color },
      });
      continue;
    }

    await prisma.itemType.create({
      data: { ...type, isSystem: true },
    });
  }

  const count = await prisma.itemType.count({ where: { isSystem: true } });
  console.log(`Seeded system item types (${count} total).`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
