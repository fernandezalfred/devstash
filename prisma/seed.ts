// Seeds the database with the immutable system item types plus sample demo data
// (a demo user, collections, and items) for development and demos.
// See context/features/seed-spec.md.
// Run with `npx prisma db seed` (configured in prisma.config.ts) or `tsx prisma/seed.ts`.
import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

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

const DEMO_USER = {
  email: "demo@devstash.io",
  name: "Demo User",
  password: "12345678",
} as const;

async function seedSystemItemTypes() {
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

async function seedDemoUser() {
  const passwordHash = await bcrypt.hash(DEMO_USER.password, 12);

  const user = await prisma.user.upsert({
    where: { email: DEMO_USER.email },
    update: { name: DEMO_USER.name, passwordHash, emailVerified: new Date() },
    create: {
      email: DEMO_USER.email,
      name: DEMO_USER.name,
      passwordHash,
      isPro: false,
      emailVerified: new Date(),
    },
  });

  console.log(`Seeded demo user (${user.email}).`);
  return user;
}

// A text item belonging to one of the system text types (snippet/prompt/command/note).
type TextItem = {
  type: "snippet" | "prompt" | "command" | "note";
  title: string;
  content: string;
  description?: string;
  language?: string;
  isPinned?: boolean;
};

// A link item (url type).
type LinkItem = {
  type: "link";
  title: string;
  url: string;
  description?: string;
  isPinned?: boolean;
};

type SeedItem = TextItem | LinkItem;

type SeedCollection = {
  name: string;
  description: string;
  isFavorite?: boolean;
  items: SeedItem[];
};

const COLLECTIONS: SeedCollection[] = [
  {
    name: "React Patterns",
    description: "Reusable React patterns and hooks",
    isFavorite: true,
    items: [
      {
        type: "snippet",
        title: "useDebounce hook",
        description: "Debounce a fast-changing value (search inputs, etc.)",
        language: "typescript",
        isPinned: true,
        content: `import { useEffect, useState } from "react";

export function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);

  return debounced;
}`,
      },
      {
        type: "snippet",
        title: "Typed Context provider",
        description: "Create a context + hook pair that throws if used outside its provider",
        language: "typescript",
        content: `import { createContext, useContext, type ReactNode } from "react";

export function createSafeContext<T>(name: string) {
  const Context = createContext<T | null>(null);

  function Provider({ value, children }: { value: T; children: ReactNode }) {
    return <Context.Provider value={value}>{children}</Context.Provider>;
  }

  function useSafeContext(): T {
    const ctx = useContext(Context);
    if (ctx === null) {
      throw new Error(\`use\${name} must be used within \${name}Provider\`);
    }
    return ctx;
  }

  return [Provider, useSafeContext] as const;
}`,
      },
      {
        type: "snippet",
        title: "cn() class merge utility",
        description: "Merge Tailwind classes with clsx + tailwind-merge",
        language: "typescript",
        content: `import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}`,
      },
    ],
  },
  {
    name: "AI Workflows",
    description: "AI prompts and workflow automations",
    items: [
      {
        type: "prompt",
        title: "Code review prompt",
        description: "Ask an LLM for a focused pull-request review",
        isPinned: true,
        content: `You are a senior engineer reviewing a pull request. Review the diff below for:

1. Correctness bugs and edge cases
2. Security issues (auth, input validation, injection)
3. Performance (N+1 queries, unnecessary re-renders)
4. Readability and adherence to existing patterns

Respond with a short summary, then a prioritized list of findings. Cite file and line for each. Be concise; skip nits unless they affect correctness.

DIFF:
{{diff}}`,
      },
      {
        type: "prompt",
        title: "Documentation generator",
        description: "Generate reference docs from a code module",
        content: `Generate clear reference documentation for the code below.

For each exported function/component/type include:
- A one-line summary
- Parameters (name, type, description)
- Return value
- A minimal usage example

Use Markdown. Keep examples runnable. Do not invent behavior that isn't in the code.

CODE:
{{code}}`,
      },
      {
        type: "prompt",
        title: "Refactoring assistant",
        description: "Suggest safe, incremental refactors",
        content: `You are helping refactor the code below. Propose changes that:

- Preserve existing behavior (no functional changes unless asked)
- Reduce duplication and improve naming
- Keep functions small and single-purpose
- Match the surrounding style

Return the refactored code plus a short bullet list explaining each change and why it's safe.

CODE:
{{code}}`,
      },
    ],
  },
  {
    name: "DevOps",
    description: "Infrastructure and deployment resources",
    items: [
      {
        type: "snippet",
        title: "Multi-stage Node Dockerfile",
        description: "Slim production image for a Next.js / Node app",
        language: "dockerfile",
        content: `FROM node:24-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:24-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/.next ./.next
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
EXPOSE 3000
CMD ["npm", "start"]`,
      },
      {
        type: "command",
        title: "Deploy to production",
        description: "Run migrations then start the app",
        language: "bash",
        content: `npx prisma migrate deploy && npm run build && npm start`,
      },
      {
        type: "link",
        title: "Docker — Dockerfile reference",
        description: "Official Dockerfile instruction reference",
        url: "https://docs.docker.com/reference/dockerfile/",
      },
      {
        type: "link",
        title: "GitHub Actions documentation",
        description: "CI/CD workflows and syntax",
        url: "https://docs.github.com/en/actions",
      },
    ],
  },
  {
    name: "Terminal Commands",
    description: "Useful shell commands for everyday development",
    items: [
      {
        type: "command",
        title: "Undo last commit (keep changes)",
        description: "Soft reset to the previous commit",
        language: "bash",
        content: `git reset --soft HEAD~1`,
      },
      {
        type: "command",
        title: "Remove stopped containers & dangling images",
        description: "Reclaim Docker disk space",
        language: "bash",
        content: `docker system prune -f`,
      },
      {
        type: "command",
        title: "Find and kill process on a port",
        description: "Free up a port held by a stray process",
        language: "bash",
        isPinned: true,
        content: `lsof -ti tcp:3000 | xargs kill -9`,
      },
      {
        type: "command",
        title: "List globally installed npm packages",
        description: "Top-level global packages only",
        language: "bash",
        content: `npm list -g --depth=0`,
      },
    ],
  },
  {
    name: "Design Resources",
    description: "UI/UX resources and references",
    isFavorite: true,
    items: [
      {
        type: "link",
        title: "Tailwind CSS Documentation",
        description: "Utility-first CSS framework reference",
        url: "https://tailwindcss.com/docs",
        isPinned: true,
      },
      {
        type: "link",
        title: "shadcn/ui",
        description: "Accessible component library built on Radix",
        url: "https://ui.shadcn.com",
      },
      {
        type: "link",
        title: "Radix UI Primitives",
        description: "Unstyled, accessible component primitives",
        url: "https://www.radix-ui.com/primitives",
      },
      {
        type: "link",
        title: "Lucide Icons",
        description: "Open-source icon library used across DevStash",
        url: "https://lucide.dev/icons",
      },
    ],
  },
];

async function seedCollectionsAndItems(userId: string) {
  // Map system type name -> ItemType id, so items can reference the right type.
  const systemTypes = await prisma.itemType.findMany({
    where: { isSystem: true, userId: null },
  });
  const typeIdByName = new Map(systemTypes.map((t) => [t.name, t.id]));

  // Keep the demo data idempotent: wipe this user's existing collections and
  // items before recreating them (ItemCollection rows cascade away with both).
  await prisma.collection.deleteMany({ where: { userId } });
  await prisma.item.deleteMany({ where: { userId } });

  let itemCount = 0;

  for (const col of COLLECTIONS) {
    const collection = await prisma.collection.create({
      data: {
        name: col.name,
        description: col.description,
        isFavorite: col.isFavorite ?? false,
        userId,
      },
    });

    for (const item of col.items) {
      const itemTypeId = typeIdByName.get(item.type);
      if (!itemTypeId) {
        throw new Error(`Missing system item type "${item.type}" — seed system types first.`);
      }

      const isLink = item.type === "link";

      await prisma.item.create({
        data: {
          title: item.title,
          description: item.description,
          contentType: "TEXT",
          content: isLink ? null : item.content,
          url: isLink ? item.url : null,
          language: isLink ? null : item.language,
          isPinned: item.isPinned ?? false,
          userId,
          itemTypeId,
          collections: { create: { collectionId: collection.id } },
        },
      });
      itemCount += 1;
    }
  }

  console.log(`Seeded ${COLLECTIONS.length} collections and ${itemCount} items.`);
}

async function main() {
  await seedSystemItemTypes();
  const user = await seedDemoUser();
  await seedCollectionsAndItems(user.id);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
