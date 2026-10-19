# Portfolio — Minyeon Kim

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
Type scale: 13 / 15 / 18 / 24 / 36 / 64 px. 64px is used only in the hero and the sliding type band.
Geist for text, Geist Mono for labels, metadata, and scramble text.
Layout: max-width 1200px; case body 680px; 16px min side padding; 8px spacing grid.
Radius: 6px on cards and controls, nothing larger. Borders 1px var(--line). No drop shadows.
Motion: 150/250/400ms, ease cubic-bezier(0.2,0.8,0.2,1).
Interaction states (nothing interactive is static; utilities in app/globals.css):
- press: buttons and tiles scale to 0.97 while pressed.
- lift: cards rise 4px and their border turns ink on hover or focus-within.
- link: text links keep a 40% underline that firms up and tightens on hover/focus.
- Inputs: border goes muted on hover, accent on focus.
- Toggles and icons swap with a 250ms fade + quarter turn (theme toggle, Menu/Close),
  never a hard cut. Theme changes crossfade the page (View Transitions).
- Disclosure (<details>) opens and closes by height, 250ms.
- Selection lists (side menu cases, Work selector) mark the current item with an
  accent dot that scales in; their large previews crossfade 400ms.
- Route changes crossfade; a case cover morphs from the Work selector preview into
  the case page cover (React <ViewTransition>).
- Floating side nav (wide screens): tiles fixed to the left edge; hover/focus slides
  a label out; the current page or section's tile is filled ink.
All of it is off with prefers-reduced-motion.

## Signature motif: "Decrypted"
Text scramble (encrypted -> readable) is the single expressive motif. Use it ONLY in:
- the hero headline: once on load (max 1.2s, left to right, chars "01#$%&"), then,
  after load, only glyphs within 120px of the mouse cursor briefly re-scramble
  (mouse only, never touch; must not reflow the line);
- side menu page links, on hover or keyboard focus (Geist Mono, 0.4s).
Nowhere else. With prefers-reduced-motion, none of it runs.

## Rules
- Content first: the hero must show name, positioning line, and an index of the two
  featured case studies without scrolling on a 1440x900 screen.
- Header: Menu button on the left, name centered, resume link and theme toggle on the
  right. Page links live in the side menu, not the header. On md+ the header is
  sticky and folds into a compact floating bar after a little scroll, at the same height.
- Side menu (Metalab-style), opened from the Menu button, which turns into Close:
  - Full-screen panel with three columns that slide in one after another: (1) page
    links (Work, Playground, About, Contact) and case-study pills; (2) a large cover
    preview with caption that crossfades to the hovered or focused case; (3)
    Playground and contact.
  - A dot marks the previewed case pill.
  - It is a modal dialog: Esc closes it, Tab stays inside it, and focus returns to
    the Menu button. Following a link closes it.
  - Page scroll is never locked; the panel scrolls on its own if it's taller than
    the screen.
- The landing page is one long scroll, in this order: hero + Work selector, the
  selected case's section, Playground, About, Contact.
  - Work selector: the featured cases as a large vertical list (tabs). A dot marks
    the selected case. On desktop, a large preview beside the list crossfades to the
    hovered case and falls back to the selected one; clicking the preview opens the
    full case.
  - Choosing a case shows only that case's section below, and its pieces reveal one
    by one. Arrow keys / Home / End switch cases.
  - The selected case section has a sticky summary column (number, [CONCEPT] label, title,
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