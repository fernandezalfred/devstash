# DevStash — Project Overview

> A developer knowledge hub for snippets, commands, prompts, notes, files, images, links, and custom types.

---

## 🎯 Problem

Developers keep their essentials scattered across too many tools:

- 💻 Code snippets in VS Code or Notion
- 🤖 AI prompts in chat histories
- 📁 Context files buried in random projects
- 🔖 Useful links in browser bookmarks
- 📚 Docs in random folders
- ⌨️ Commands in `.txt` files
- 🧩 Project templates in GitHub gists
- 🖥️ Terminal commands lost in bash history

This causes **context switching**, **lost knowledge**, and **inconsistent workflows**.

**DevStash** is ONE fast, searchable, AI-enhanced hub for all dev knowledge & resources.

---

## 👥 Target Users

| Persona | Needs |
| --- | --- |
| **Everyday Developer** | Fast access to snippets, prompts, commands, and links |
| **AI-first Developer** | Store prompts, contexts, workflows, system messages |
| **Content Creator / Educator** | Code blocks, explanations, course notes |
| **Full-stack Builder** | Patterns, boilerplates, API examples |

---

## ✨ Features

### A. Items & Item Types

Every saved resource is an **Item**. Items have a **Type** that determines how they render and behave. Users can create **custom types** (Pro), but the following **system types** ship by default and are immutable:

| Type | Kind | Icon | Color | Free Tier |
| --- | --- | --- | --- | --- |
| `snippet` | text | `Code` | `#3b82f6` blue | ✅ |
| `prompt` | text | `Sparkles` | `#8b5cf6` purple | ✅ |
| `command` | text | `Terminal` | `#f97316` orange | ✅ |
| `note` | text | `StickyNote` | `#fde047` yellow | ✅ |
| `link` | url | `Link` | `#10b981` emerald | ✅ |
| `file` | file | `File` | `#6b7280` gray | 💎 Pro |
| `image` | file | `Image` | `#ec4899` pink | 💎 Pro |

Type kinds:

- **text** — markdown body (snippet, prompt, command, note)
- **url** — external link (link)
- **file** — uploaded asset stored in R2 (file, image)

Items route pattern: `/items/snippets`, `/items/prompts`, etc.

Items open in a **quick-access drawer** for fast reading/editing.

### B. Collections

Users group items into **Collections**. An item can belong to **multiple collections** via a join table (many-to-many).

Examples:

- *React Patterns* — snippets + notes
- *Context Files* — files
- *Python Snippets* — snippets

### C. Search

Unified search across:

- Content (full-text)
- Tags
- Titles
- Types

### D. Authentication

- Email / password
- GitHub OAuth
- Built on **NextAuth v5**

### E. Core UX Features

- ⭐ Favorites for collections and items
- 📌 Pin items to the top
- 🕒 Recently used
- 📥 Import code from a file
- ✍️ Markdown editor for text types
- ⬆️ File upload for `file` / `image` types
- 📤 Export data in multiple formats
- 🌙 Dark mode (default for devs)
- 🔁 Add/remove items to/from multiple collections
- 👁️ View which collections an item belongs to

### F. AI Features (💎 Pro)

- 🏷️ AI auto-tag suggestions
- 📝 AI summaries
- 💡 AI "Explain this code"
- ⚡ Prompt optimizer

---

## 🗄️ Data Model (Prisma)

> Draft schema — not final. Adjust field names and relations during implementation.

```prisma
// ---------- Auth ----------

model User {
  id                   String    @id @default(cuid())
  email                String    @unique
  name                 String?
  image                String?
  emailVerified        DateTime?

  // Pro / billing
  isPro                Boolean   @default(false)
  stripeCustomerId     String?   @unique
  stripeSubscriptionId String?   @unique

  // Relations
  accounts    Account[]
  sessions    Session[]
  items       Item[]
  collections Collection[]
  itemTypes   ItemType[]  // custom (user-scoped) types

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

// ---------- Types ----------

model ItemType {
  id       String  @id @default(cuid())
  name     String
  icon     String  // lucide icon name
  color    String  // hex
  isSystem Boolean @default(false)

  userId String?
  user   User?   @relation(fields: [userId], references: [id], onDelete: Cascade)

  items Item[]

  @@unique([userId, name])
}

// ---------- Items ----------

enum ContentType {
  TEXT
  FILE
}

model Item {
  id          String      @id @default(cuid())
  title       String
  contentType ContentType
  content     String?     // text body (null when file)
  fileUrl     String?     // R2 URL (null when text)
  fileName    String?
  fileSize    Int?
  url         String?     // for link type
  description String?
  language    String?     // syntax highlighting hint
  isFavorite  Boolean     @default(false)
  isPinned    Boolean     @default(false)

  userId     String
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  itemTypeId String
  itemType   ItemType @relation(fields: [itemTypeId], references: [id])

  collections ItemCollection[]
  tags        Tag[]            @relation("ItemTags")

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([userId])
  @@index([itemTypeId])
}

// ---------- Collections ----------

model Collection {
  id            String  @id @default(cuid())
  name          String
  description   String?
  isFavorite    Boolean @default(false)
  defaultTypeId String? // used when collection has no items yet

  userId String
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)

  items ItemCollection[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([userId])
}

model ItemCollection {
  itemId       String
  collectionId String
  addedAt      DateTime @default(now())

  item       Item       @relation(fields: [itemId], references: [id], onDelete: Cascade)
  collection Collection @relation(fields: [collectionId], references: [id], onDelete: Cascade)

  @@id([itemId, collectionId])
  @@index([collectionId])
}

// ---------- Tags ----------

model Tag {
  id    String @id @default(cuid())
  name  String @unique
  items Item[] @relation("ItemTags")
}
```

### Entity Relationships

```
User ─┬─< Item >──┬─< ItemCollection >──> Collection
      │           │
      │           └─< Tag (M:N)
      │
      ├─< Collection
      └─< ItemType (custom)

ItemType ─< Item
```

---

## 🧱 Tech Stack

### Framework

- **Next.js 16** / **React 19**
- SSR pages with dynamic components
- API routes for backend (items, uploads, AI)
- Single repo / single codebase
- **TypeScript** for type safety

### Database & ORM

- **Neon** (PostgreSQL in the cloud)
- **Prisma 7** (latest — fetch latest docs before schema work)
- **Redis** for caching (optional / later)
- ⚠️ **NEVER** use `prisma db push` or directly mutate DB structure. **Always create migrations** and run them in dev → prod.

### Storage

- **Cloudflare R2** for file uploads

### Authentication

- **NextAuth v5**
  - Email/password
  - GitHub OAuth

### AI

- **OpenAI** — `gpt-5-nano`

### UI

- **Tailwind CSS v4**
- **shadcn/ui** components

---

## 💰 Monetization (Freemium)

### Free

- 50 items total
- 3 collections
- All system types **except** `file` / `image`
- Basic search
- No file or image uploads
- No AI features

### 💎 Pro — $8/mo or $72/yr

- Unlimited items
- Unlimited collections
- File & image uploads
- Custom types *(later)*
- AI auto-tagging
- AI code explanation
- AI prompt optimizer
- Export data (JSON / ZIP)
- Priority support

> **During development**, all users can access everything. The Pro gating foundation (flags, Stripe hooks) should still be wired up from day one.

---

## 🎨 UI / UX

### Style

- Modern, minimal, developer-focused
- Dark mode by default, light mode optional
- Clean typography, generous whitespace
- Subtle borders and shadows
- Syntax highlighting for code blocks
- **References:** [Notion](https://notion.so), [Linear](https://linear.app), [Raycast](https://raycast.com)

### Layout

```
┌──────────────┬─────────────────────────────────────┐
│              │                                     │
│   Sidebar    │   Collections grid (color-coded)    │
│              │   ────────────────────────────────  │
│  • Snippets  │   Items grid (border-color coded)   │
│  • Prompts   │                                     │
│  • Commands  │   ┌────────────────────────────┐    │
│  • Notes     │   │  Item detail drawer        │    │
│  • Files     │   │  (opens on click)          │    │
│  • Images    │   └────────────────────────────┘    │
│  • Links     │                                     │
│              │                                     │
│  Recent      │                                     │
│  Collections │                                     │
│              │                                     │
└──────────────┴─────────────────────────────────────┘
```

- **Sidebar** (collapsible): item types → links to item lists; recent collections
- **Main**:
  - Grid of **collection cards** — background color reflects the dominant item type inside
  - Items beneath — color-coded **border** by their type
- **Item drawer** — individual items open in a fast drawer, not a full page

### Responsive

- Desktop-first but fully mobile usable
- Sidebar collapses into a drawer on mobile

### Micro-interactions

- Smooth transitions
- Hover states on cards
- Toast notifications for actions
- Loading skeletons

---

## 📍 Routes (initial sketch)

| Route | Purpose |
| --- | --- |
| `/` | Dashboard — collections + recent items |
| `/items/snippets` | Snippet list |
| `/items/prompts` | Prompt list |
| `/items/commands` | Command list |
| `/items/notes` | Note list |
| `/items/links` | Link list |
| `/items/files` | File list (Pro) |
| `/items/images` | Image list (Pro) |
| `/collections` | All collections |
| `/collections/[id]` | Single collection |
| `/settings` | Profile, billing, preferences |
| `/api/*` | Items, uploads, AI, auth |
