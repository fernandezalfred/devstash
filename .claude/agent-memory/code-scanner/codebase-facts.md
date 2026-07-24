---
name: codebase-facts
description: Confirmed facts about the repo state to prevent false positives
metadata:
  type: project
---

- `.env` is gitignored (verify against `.gitignore` directly if this ever needs re-confirming before a claim — don't assume from memory alone). `.env.example` is committed and documents every env var.
- `src/generated/prisma` is gitignored (Prisma 7 client output).
- No `tailwind.config.*` exists — correct for Tailwind v4 (CSS-based `@theme` config in `globals.css`).
- TypeScript strict mode is enabled.
- Full audit performed 2026-07-24 covering `src/actions`, `src/app/api/*`, `src/lib`, `src/lib/db`, `src/components`, `src/auth.ts`, `src/auth.config.ts`, `src/proxy.ts`. Key confirmed-clean areas: SVG/file upload XSS is mitigated (sandboxed CSP + nosniff on the download proxy route `src/app/api/items/[id]/download/route.ts`); email HTML in `src/lib/email.ts` escapes the user-controlled `name` before interpolation; `react-markdown` (used in `MarkdownEditor.tsx`) is safe by default (its `urlTransform` strips `javascript:`/`vbscript:`/`file:` hrefs) — no XSS there; open-redirect guarded via `src/lib/safe-callback-url.ts` (only same-origin relative paths); password-reset/verification tokens are namespaced (`password-reset:<email>` prefix) so they can't collide/clobber each other, and are single-use via `deleteMany` + count check (race-safe).
- Known real (not stale/false-positive) issues found in that audit, not yet fixed as of 2026-07-24:
  - `z.url()` (Zod) does NOT restrict URL scheme by default — accepts `javascript:` etc. Used unguarded in `src/actions/items.ts` (`createItemSchema`/`updateItemSchema` `url` field) for the `link` item type; the stored value is later rendered as a raw `<a href={item.url}>` in `src/components/items/ItemDrawer.tsx`. Real stored-XSS-via-scheme risk (currently self-XSS only, single-user data model) — fix is `z.url({ protocol: /^https?$/ })` or an explicit allowlist check.
  - `getDashboardCollections()` and `getSidebarItemTypes()` (in `src/lib/db/collections.ts` / `src/lib/db/items.ts`) are NOT wrapped in React `cache()`, and are each called once in a layout (`dashboard/layout.tsx`, `items/layout.tsx`) AND again independently in the corresponding page (`dashboard/page.tsx` calls `getDashboardCollections()` again; `items/[type]/page.tsx` calls `getSidebarItemTypes()` again) — duplicate DB round-trips per request. An older memory entry claimed `getDashboardCollections` was already `cache()`-wrapped — that was **incorrect/stale**, do not trust it; verified false by reading the file directly.
  - `VerificationToken` (`prisma/schema.prisma`) has `@@id([identifier, token])` only; both `consumeVerificationToken` (`src/lib/verification.ts`) and `consumePasswordResetToken` (`src/lib/password-reset.ts`) look up by `token` alone via `findFirst`, which can't use the composite PK index efficiently (token is the non-leading column) — low-impact today (table stays small: at most one outstanding token per identifier due to delete-before-create), but a real scalability nit. Fix: add `@@index([token])` or make `token` its own `@unique`.
