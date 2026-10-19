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
Type scale: 13 / 15 / 18 / 24 / 36 / 48 / 64 px. 48px is only the landing positioning line;
64px only the landing case title.
Weights: 64px is Light (300); 48px positioning line is Medium (500); 36px is Regular (400);
24px and below may use Medium.
Geist for text, Geist Mono for labels, metadata, and scramble text.
Layout: max-width 1200px; case body 680px; 16px min side padding; 8px spacing grid.
Shape (Metalab-like, soft rather than wireframe):
- Controls, chips, tags, toggles and the compact header are full pills (rounded-full).
- Cards and panels are 16px (rounded-md); large media and previews are 24px (rounded-lg).
- Surfaces are soft fills, not outlines: --fill (ink 7%) and --fill-strong (ink 12%,
  hover/selected), or --surface for cards. Overlay chips on media use bg 70% + blur.
- Borders (1px var(--line)) only for dividers and text inputs. No drop shadows.
Motion: 150/250/400ms, ease cubic-bezier(0.2,0.8,0.2,1).
Interaction states (nothing interactive is static; utilities in app/globals.css):
- press: buttons and tiles scale to 0.97 while pressed.
- lift: cards rise 4px on hover or focus-within.
- link: text links keep a 40% underline that firms up and tightens on hover/focus.
- Inputs: border goes muted on hover, accent on focus.
- Toggles and icons swap with a 250ms fade + quarter turn (theme toggle, Menu/Close),
  never a hard cut. Theme changes crossfade the page (View Transitions).
- Disclosure (<details>) opens and closes by height, 250ms.
- Selection lists (side menu cases, landing case pills) mark the current item with an
  accent dot that scales in; their large previews crossfade 400ms.
- Route changes crossfade; a case cover morphs from the landing screen into
  the case page cover (React <ViewTransition>).
All of it is off with prefers-reduced-motion.

## Signature motif: "Decrypted"
Text scramble (encrypted -> readable) is the single expressive motif. Use it ONLY in:
- the hero headline: once on load (max 1.2s, chars "01#$%&"), the line types out
  left to right and only a short front of glyphs (~6) is scrambled at any moment,
  each for 0.1s. After load, only glyphs within 56px of the mouse cursor briefly
  re-scramble (max 0.35s; mouse only, never touch; must not reflow the line).
  Keep it light: scramble the letters less, never dim or fade them;
- side menu page links, on hover or keyboard focus (Geist Mono, 0.4s).
Nowhere else. With prefers-reduced-motion, none of it runs.

## Rules
- Content first: the landing screen must show name, positioning line, and the list of
  featured case studies without scrolling on a 1440x900 screen.
- Header: Menu button at the left screen edge, resume link and theme toggle at the
  right screen edge (full width, not the content width). The Menu button is icon
  only (lines that turn into an X, labelled "Open menu" / "Close menu"), the same
  32px circle as the theme toggle. No name or page title.
  Page links live in the menu. On md+ the header is sticky and folds into one compact
  floating pill after a little scroll; inside it the buttons drop their own pill
  backgrounds (never a pill inside a pill). On the landing page it is transparent
  over the cover.
- Menu button (turns into Close). On the landing page (md+) it opens the page links
  inline at the left edge (see below). Everywhere else, and on phones, it opens the
  full-screen side menu:
  - Full-screen panel with three columns that slide in one after another: (1) page
    links (Work, Playground, About, Contact) and case-study pills; (2) a large cover
    preview with caption that crossfades to the hovered or focused case; (3)
    Playground and contact.
  - A dot marks the previewed case pill.
  - It is a modal dialog: Esc closes it, Tab stays inside it, and focus returns to
    the Menu button. Following a link closes it.
  - Page scroll is never locked; the panel scrolls on its own if it's taller than
    the screen.
- The landing page is a full-screen stage for the selected case, followed by that
  case's content (Metalab-style home):
  - Stage (md+), laid out like a Metalab case header: a solid dark head block
    (running up under the transparent header) holds the positioning line and the
    selected case's facts (Role / Timeline / Tools, crossfading on change); the
    cover fills the rest of the screen below it. Only the case title sits on the
    image, with a fade under it.
  - Intro at the top: the positioning line only (48px Medium, 36px on phones, with
    the Decrypted scramble). No name label, no counter, no footer on this page.
  - Case picker (lg+): separate frosted pills stacked with a gap (Metalab-style),
    always in the dark media palette, fixed at the left edge over the middle of the
    cover area (62% down the screen). An outline ring slides to the selected pill. It belongs to the stage:
    it fades out once you scroll past half a screen and returns at the top; while
    it's hidden, Menu opens the full-screen menu instead of the inline links.
    Below lg an iOS-style segmented control sits under the cover card instead.
    Tabs: arrows / Home / End switch.
  - On the cover's lower part: the [CONCEPT] label, title (64px Light) and one-line
    problem, plus a "Scroll to read" hint. No "View case" button.
  - Picking a case crossfades the cover (settling from a 1.04 zoom). The old title
    block slides out upward and the new one rises in, staggered 0 / 150 / 250ms.
  - Scrolling down hands off to the case: the stage text drifts up and fades, the
    tint deepens and the cover zooms slightly (scroll-linked), and the selected
    case's content follows (meta row, then the MDX body). Its end offers "Next
    case", which selects the next case and glides back up.
  - The content is built by scrolling, not laid out all at once: every block
    (paragraphs, list items, subheadings, meta items) rises in as it enters the
    screen, one by one; quotes fill in word by word with scroll; a rule above each
    section heading grows in. Same on the full case pages.
  - Inline menu (lg+): Menu opens the page links (Work, Playground, About, Contact)
    as frosted pills just above the left case picker, sliding in one by one (50ms
    apart, 250ms each). Menu again, Esc, or following a link folds them away;
    focus returns to the Menu button.
  - On phones it stacks: intro, the cover as a 24px-rounded card, the segmented
    control, then the title, so text never sits on the image.
  - Full case pages (/work/[slug]) still exist for direct links and the Menu.
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