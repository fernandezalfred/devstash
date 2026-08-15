# Homepage

## Overview

Replace the placeholder `/` route (`src/app/page.tsx`) with a real marketing homepage, built from the static mockup at `prototypes/homepage/` (`index.html`, `styles.css`, `script.js` — reference for layout, copy, and visual/animation intent only, not to be linked to or served).

## Requirements

- Sections, in order: Nav, Hero (headline + chaos/arrow/dashboard-preview visual), Features (6 cards), AI (Pro checklist + code editor mock), Pricing (Free/Pro + monthly/yearly toggle), CTA, Footer
- Server components by default. Only what truly needs interactivity is a client component: the chaos-icon animation, scroll-reveal, navbar-opacity-on-scroll, and the pricing monthly/yearly toggle — isolate each into its own small client component rather than making a whole section client
- Use Tailwind CSS v4 (existing `@theme` tokens in `src/app/globals.css`) and shadcn/ui primitives (`Button`, etc.) consistent with the rest of the app — not the mockup's standalone CSS
- Reuse real app data instead of the mockup's hardcoded placeholders: item-type colors/icons from `src/lib/item-icons.ts` and the seeded `ItemType` colors, not a second copy of the hex values
- Keep it DRY: shared bits (buttons, section wrapper, gradient-text headline) as small reusable components, not copy-pasted per section
- Port the mockup's animations as React/TypeScript (same tuned behavior, not literally the same file): chaos-icon drift/wall-bounce/rotate/scale-pulse/cursor-repel via `requestAnimationFrame`, arrow pulse (CSS), scroll-triggered fade-in (`IntersectionObserver`), navbar opacity-on-scroll
- Footer copyright year computed at render, not hardcoded

## Links

- Nav: "Sign In" → `/sign-in`, "Get Started" → `/register`, "Features"/"Pricing" → in-page anchors (`#features`, `#pricing`)
- Hero: "Get Started Free" → `/register`, "See Features" → `#features`
- Pricing: Free card "Get Started" → `/register`; Pro card "Start Free Trial" → `/register` (no billing integration yet)
- CTA section button → `/register`
- If the visitor is already signed in (check with `getCurrentUser()` from `src/lib/db/users.ts`), primary CTAs should point to `/dashboard` instead of `/register`
- Footer: Features/Pricing are real anchors; About/Blog/Privacy/Terms have no pages yet — leave as non-navigating placeholders rather than broken links

## Technical

- New `src/app/page.tsx` (server component) composes section components from a new `src/components/homepage/` directory
- Client components: `ChaosVisual` (icon physics), a scroll-reveal wrapper/hook, `Navbar` (scroll opacity), `PricingToggle` (local state only, no persistence)
- No new npm dependencies — CSS handles the arrow pulse and gradient text; the chaos animation stays a plain `requestAnimationFrame` loop inside a `useEffect`
- `/` stays public — it's already outside `src/proxy.ts`'s matcher, no auth/middleware changes needed beyond the optional signed-in-CTA check above
