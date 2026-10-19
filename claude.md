# Portfolio — [Your Name]

## Who this is for
Personal portfolio of a product designer with a computer science + IT security
background, applying to product designer / design engineer roles in English-speaking
countries. Target readers: hiring managers at privacy/security companies and
developer-tools companies (Linear, Vercel, Proton, Bitwarden). They scan for 6–8
seconds, then read case studies for judgment, not decoration.

Positioning line (hero): "Product designer with a security engineering background —
designing privacy, trust, and tools for builders."

## Stack
- Next.js (App Router) + TypeScript, Tailwind CSS
- Case studies as MDX in /content/cases
- Animation: GSAP (ScrambleText, ScrollTrigger) for the hero; Motion for component transitions
- Fonts: Geist and Geist Mono via next/font
- Deploy: GitHub Pages via GitHub Actions (static export: output 'export',
  images.unoptimized true, no server features). Keep it portable so it can move
  to Vercel later. Custom domain will be connected.

## Design system (do not invent new values)
Colors are CSS variables on :root with a dark override via prefers-color-scheme and
[data-theme="dark"]:
- --bg #F5F6F4 / #0C0E0E
- --surface #FFFFFF / #151918
- --ink #0E1111 / #E8ECEA
- --muted #5B6461 / #8E9895
- --line #DADFDC / #262C2A
- --accent #2440F0 / #7F93FF  (the ONLY accent; links, focus, demo states)
Type scale: 13 / 15 / 18 / 24 / 36 / 64 px. 64px is used only in the hero.
Geist for text, Geist Mono for labels, metadata, and scramble text.
Layout: max-width 1200px; case body 680px; 16px min side padding; 8px spacing grid.
Radius: 6px on cards and controls, nothing larger. Borders 1px var(--line). No drop shadows.
Motion: 150/250/400ms, ease cubic-bezier(0.2,0.8,0.2,1).

## Signature motif: "Decrypted"
Text scramble (encrypted -> readable) is the single expressive motif. Use it ONLY in:
- the hero headline: once on load (max 1.2s, left to right, chars "01#$%&"), then,
  after load, only glyphs within 120px of the mouse cursor briefly re-scramble
  (mouse only, never touch; must not reflow the line);
- nav link hover.
Nowhere else. With prefers-reduced-motion, none of it runs.

## Rules
- Content first: the hero must show name, positioning line, and an index of the two
  featured case studies without scrolling on a 1440x900 screen.
- The landing page is one long scroll, in this order: hero + case index, one section
  per featured case, Playground, About, Contact.
  - Clicking a case index row scrolls to that case's section.
  - Each case section has a sticky summary column (number, [CONCEPT] label, title,
    role and timeline, steps, "Read the full case" link). Next to it, the story
    scrolls past: Problem and Outcome from the TL;DR, the Key decisions (each links to
    its heading in the full case), and the case's live demo.
  - The sticky column's steps light up as their blocks scroll past.
  - A section rail on the right edge (desktop) shows the current section; its dots
    are anchor links.
- Scroll interactions follow the user's scroll and never take it over: no scroll
  hijacking, snapping, or scroll-locked sequences, and never block scrolling or add a
  preloader. In-page links scroll smoothly. Reveals and parallax use CSS
  scroll-driven animations, so browsers without support just show the static page.
- Respect prefers-reduced-motion: show final text instantly; disable scramble,
  parallax, reveals, and smooth scrolling.
- Accessibility: WCAG AA contrast, visible focus ring (2px var(--accent)),
  full keyboard support for every interactive demo, semantic headings.
- Performance: Lighthouse 95+ on mobile; images pre-sized WebP via next/image (unoptimized); lazy-load demos.
- Every case study page follows the template: TL;DR (Problem / My role / Outcome),
  Context, Problem, Research, Decisions (with "Why I chose this" toggles),
  Interactive demo, Outcome & learnings. Mark self-initiated work with a [CONCEPT] label.
- No lorem ipsum. Use text from /content. If content is missing, leave a visible
  TODO comment instead of inventing facts or metrics.
- No third-party logos implying affiliation (e.g. no Google logo on the Gemini concept).
- Copy is in English, plain and specific. No emoji in UI.

## Working style
- One feature per task. Run the dev server and check the page before saying done.
- Commit after each completed step with a clear message.