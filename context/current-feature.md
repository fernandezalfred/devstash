# Current Feature

None in progress.

## Notes

## History

<!-- Keep this updated. Earliest to latest -->

- 2026-05-06: Initial Next.js setup (created via `create-next-app`); pushed to `git@github.com:fernandezalfred/devstash.git`.
- 2026-05-29: Dashboard UI Phase 1 complete. Initialized shadcn/ui (radix base, nova preset, Tailwind v4 CSS theme), added Button + Input components. Root layout set to dark mode by default with Geist fonts wired to `--font-sans`/`--font-mono`. Added `/dashboard` route with shell layout (`TopBar` + placeholder `Sidebar` + main area). Top bar is display-only (brand, disabled search field, New Collection / New Item buttons). Build passes; verified in browser.
- 2026-05-29: Dashboard UI Phase 2 complete. Built out the `Sidebar` against the reference screenshot: collapsible Types section linking to `/items/[slug]` with colored icons + item counts, a Favorites collections section (name + right-aligned star), an "All Collections" section (non-favorites, most-recent-first, with counts), and a bottom user/avatar area with a Settings link. Sidebar collapses inline on desktop and slides in as an overlay drawer on mobile, both driven by the top bar's panel toggle (`DashboardShell` + `useIsMobile`). Added `item-icons.ts` (lucide name → component map). Mock data: added `itemCount` to `ItemType` and reordered types so Links is last, to match the screenshot. Note: the second collections section is labeled "All Collections" (screenshot wording) rather than "Most recent" (spec wording); item type order follows the screenshot (Links last) over `project-overview.md`. Build passes.
