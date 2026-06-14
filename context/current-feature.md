# Current Feature

## Dashboard Items — In Progress

Replace the dummy item data in the dashboard main area (right side) — both the pinned items and the recent items — with real data from the Neon database via Prisma. It should look how it does now, but sourced from the database instead of `@src/lib/mock-data.ts`.

If there are no pinned items, the pinned section should not display at all.

### Requirements

- Create `src/lib/db/items.ts` with data fetching functions
- Fetch items directly in the server component
- Item card icon/border derived from the item type
- Display item type tags and anything else currently shown (reference the screenshot if needed)
- Update the (collection) stats display so item stats also come from the DB

### References

- @context/features/dashboard-items-spec.md
- @context/project-overview.md (data models)
- @context/screenshots/dashboard-ui-main.png
- @src/lib/mock-data.ts (current dummy data being replaced)
- @src/lib/db/collections.ts (pattern from the completed Dashboard Collections feature)

## Notes

## History

<!-- Keep this updated. Earliest to latest -->

- 2026-05-06: Initial Next.js setup (created via `create-next-app`); pushed to `git@github.com:fernandezalfred/devstash.git`.
- 2026-05-29: Dashboard UI Phase 1 complete. Initialized shadcn/ui (radix base, nova preset, Tailwind v4 CSS theme), added Button + Input components. Root layout set to dark mode by default with Geist fonts wired to `--font-sans`/`--font-mono`. Added `/dashboard` route with shell layout (`TopBar` + placeholder `Sidebar` + main area). Top bar is display-only (brand, disabled search field, New Collection / New Item buttons). Build passes; verified in browser.
- 2026-05-29: Dashboard UI Phase 2 complete. Built out the `Sidebar` against the reference screenshot: collapsible Types section linking to `/items/[slug]` with colored icons + item counts, a Favorites collections section (name + right-aligned star), an "All Collections" section (non-favorites, most-recent-first, with counts), and a bottom user/avatar area with a Settings link. Sidebar collapses inline on desktop and slides in as an overlay drawer on mobile, both driven by the top bar's panel toggle (`DashboardShell` + `useIsMobile`). Added `item-icons.ts` (lucide name → component map). Mock data: added `itemCount` to `ItemType` and reordered types so Links is last, to match the screenshot. Note: the second collections section is labeled "All Collections" (screenshot wording) rather than "Most recent" (spec wording); item type order follows the screenshot (Links last) over `project-overview.md`. Build passes.
- 2026-06-02: Dashboard UI Phase 3 complete. Built out the main area to the right of the sidebar: 4 stats cards (total items, collections, favorite items, favorite collections), a recent collections grid (`CollectionsGrid` + `CollectionCard`, background tinted by the collection's dominant item type), pinned items (`PinnedItems`), and the 10 most-recent items (`RecentItems`), with a shared `ItemRow` (type-colored left border + icon). Added `src/lib/dashboard.ts` for the dashboard data helpers/derivations over the mock data. Disabled the Next.js dev indicator (`devIndicators: false` in `next.config.ts`). Build passes.
- 2026-06-13: Prisma + Neon PostgreSQL setup complete. Prisma 7 with the `pg` driver adapter (`@prisma/adapter-pg`), client generated to `src/generated/prisma` (gitignored). `prisma.config.ts` drives migrations over a DIRECT (non-pooled) connection while the app runtime uses the pooled `DATABASE_URL` via the adapter in `src/lib/prisma.ts`. Initial schema (`20260608121136_init` migration) covers User/Account/Session/VerificationToken (NextAuth v5), ItemType, Item, Collection, ItemCollection (M:N join), and Tag, with indexes + cascade deletes. `prisma/seed.ts` seeds the 7 immutable system item types. Added `db:*` npm scripts and `.env.example` (DATABASE_URL pooled + DIRECT_URL). Added `scripts/test-db.ts` to smoke-test the connection and print row counts (`tsx scripts/test-db.ts`). Build passes.
- 2026-06-13: Seed data complete. Expanded `prisma/seed.ts` beyond the system item types to seed a demo user (`demo@devstash.io` / "Demo User", password `12345678` hashed with `bcryptjs` at 12 rounds, `isPro: false`, `emailVerified: now()`, upserted by email) plus 5 collections and 18 items owned by that user: React Patterns (3 TS snippets), AI Workflows (3 prompts), DevOps (1 snippet + 1 command + 2 links), Terminal Commands (4 commands), Design Resources (4 links) — real URLs for all link items. Seed is idempotent: the demo user's collections/items are deleted and recreated each run (ItemCollection join rows cascade). Link items use `contentType: TEXT` with `content: null` + `url` set (the `ContentType` enum has no URL variant). Added `bcryptjs` dependency. Build passes; seed verified against the dev DB and confirmed idempotent on re-run.
- 2026-06-13: Dashboard Collections complete. Replaced the mock collections in the dashboard main-area grid with live Neon data via Prisma. Added `src/lib/db/collections.ts` → `getDashboardCollections()` (scoped to the demo user until auth lands; ordered most-recently-updated first), which tallies items per type to derive each collection's distinct types (most-frequent first) and dominant-type accent color. `/dashboard/page.tsx` is now an async server component (`export const dynamic = "force-dynamic"`) that fetches collections and computes collection stats from the DB; item stats still come from mock until items are migrated. `CollectionCard` consumes the DB shape and renders a colored left accent border (`border-l-4` + dominant type color, matching the screenshot) plus per-type icons; `CollectionsGrid` and `StatsCards` now take props instead of importing mock data. Sidebar/pinned/recent sections still use mock data (out of scope). Also fixed the `pg` SSL deprecation warning by switching `sslmode=require` → `sslmode=verify-full` in `.env`/`.env.example`. Build passes; verified against the dev DB (5 seeded collections render with correct counts, accent colors, and type icons; no SSL warning).
