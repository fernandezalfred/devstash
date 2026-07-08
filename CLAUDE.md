# DevStash

A developer knowledge hub for snippets, commands, prompts, notes, files, images, links and custom types.

## Context Files

Read the following to get the full context of the project:

- @context/project-overview.md
- @context/coding-standards.md
- @context/ai-interaction.md
- @context/current-feature.md

## Commands

- **Dev server**: `npm run dev` (runs on http://localhost:3000)
- **Build**: `npm run build`
- **Production server**: `npm run start`
- **Lint**: `npm run lint`
- **Test**: `npm test` (Vitest, single run) / `npm run test:watch` (watch mode). Covers server actions (`src/actions`) and utilities (`src/lib`) only — not components.

**NEVER** run any query, migration, or change against the `production` branch
(id: `br-old-field-atzbvmes`, the default/primary branch) unless I explicitly say
"production" in my request.

- Because `run_sql` defaults to the project's **default branch (production)** when no
  `branchId` is passed, you MUST always pass the `development` branch id explicitly on
  every Neon MCP call.
- The `development` branch is recreated periodically and its id can change. Do not hardcode
  the branch id — resolve it at call time by listing branches and selecting the one named
  `development`, then use that id. (As of 2026-06-20 it is `br-round-lake-atf3chhf`.)
- Never run destructive SQL (DROP, DELETE, TRUNCATE, UPDATE/INSERT) or create/delete
  branches without asking me first.
