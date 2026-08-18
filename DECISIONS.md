# DECISIONS.md

## 1. Why this strategy over the obvious alternative I rejected?

The obvious alternative was to add a flashy marketing section with animated counters,
testimonial carousels, and a big hero image pulled from Unsplash. I rejected it because
the brief explicitly penalises fabricated social proof — and because a fake "10,000+
happy guests" counter on a portfolio project is immediately identifiable as fiction,
which tanks credibility in a grading context.

Instead I kept the hero honest: a clear value proposition ("find your place to stay,
anywhere"), copy that describes exactly what the product does (OTP sign-in, dual host/
guest roles, live booking calendar), and a CTA that scrolls directly to the real listing
grid. The product sells itself through what's actually there, not through invented
metrics.

For motion I chose a single CSS `@keyframes fadeInUp` on the hero content block — 500ms,
ease-out, plays once on load. The alternative was a JS-driven IntersectionObserver scroll
reveal on every card. I rejected that because: (a) it's harder to explain line-by-line
in an interview, (b) it adds bundle weight, and (c) seven animations firing as you scroll
is noise, not craft. One animation, earned.

## 2. One trade-off I made under the time limit

The hero has no real cover image. A well-resourced version would include a curated
photograph from the actual listed properties (fetched from the API and used as a
background). Under time pressure I used a pure CSS dot-grid pattern and a gradient
accent instead — both render instantly, work in both light and dark mode, and require
zero extra network requests or new assets.

With a real week I would fetch the first cover image from the listings API on the
server, use it as a blurred full-width hero background (via Next.js `<Image priority />`),
and layer the text over it with a dark scrim. This gives a genuine "this is a real
product" feeling that abstract patterns cannot fully match.

## 3. Where I used AI tools, and what I personally verified afterward

AI (Antigravity / Claude) was used to:
- Generate the initial structure of `HeroSection.tsx` and `EasterEgg.tsx`.
- Identify the invalid Tailwind class names (`bg-gray-150`, `text-gray-505`,
  `text-gray-905`) that were silently failing in the existing codebase.
- Write the globals.css `@keyframes fadeInUp` block.

What I personally verified:
- Read every generated file line-by-line before accepting it.
- Confirmed the Konami sequence in `EasterEgg.tsx` is correct (↑↑↓↓←→←→BA) and
  that the reset logic handles mid-sequence wrong keys correctly.
- Verified the `scroll-behavior: smooth` + `id="listings"` anchor wiring by reading
  both files together, not just assuming the AI connected them.
- Ran `npm run build` and confirmed exit code 0, TypeScript clean, all 10 pages
  generated successfully.
- Checked that `HeroSection` is a server-compatible import (it uses `'use client'`
  only because of the `onClick` scroll handler — correct) and that `EasterEgg` uses
  `'use client'` because it relies on `window` — also correct.
- Confirmed no new npm packages were added; `react-hot-toast` was already a
  dependency before this change.
