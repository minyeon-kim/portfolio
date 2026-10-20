# Portfolio — Minyeon Kim

## Who this is for
Personal portfolio of a product designer with a computer science + IT security
background, applying to product designer / design engineer roles in English-speaking
countries. Target readers: hiring managers at privacy/security companies and
developer-tools companies (Linear, Vercel, Proton, Bitwarden). They scan for 6–8
seconds, then read case studies for judgment, not decoration.

Positioning line (hero): "Product designer with a background in security —
connecting research, design, and engineering to bring ideas to life with AI."

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
Type scale: 13 / 15 / 18 / 24 / 36 / 64 px. 64px is only for the landing page: the name
on the intro, and the selected case name.
Weights: 64px is Light (300); 36px is Regular (400); 24px and below may use Medium.
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
- Content first: the landing intro must show the name, positioning line, and the list
  of featured case studies without scrolling on a 1440x900 screen.
- Header: Menu button at the left screen edge, the name (Minyeon Kim) centered, resume
  link and theme toggle at the right screen edge (full width, not the content width).
  The Menu button is icon only (lines that turn into an X, labelled "Open menu" /
  "Close menu"), the same 32px circle as the theme toggle. Page links live in the
  menu. On md+ the header is sticky and folds into one compact floating pill (Menu,
  name, toggle) after a little scroll; inside it the buttons drop their own pill
  backgrounds (never a pill inside a pill). On the landing page it is transparent
  over the stage.
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
- The landing page has two states (Metalab-style home):
  - Intro (on load, nothing picked): the name (64px Light) and the positioning line
    (36px Medium, Decrypted scramble on load) are the emphasis, with the case picker
    and a "Select a project" hint. Nothing is rendered below it, so there is nothing
    to scroll yet (no content exists, the page is never scroll-locked). The header
    name returns to this state.
  - Selected (like Metalab's home with a case picked): the case's screen appears as
    a small card at the top right (54% from the left, 14% down, 37% x 42% of the
    screen, 24px radius) over a blurred, darkened backdrop of the same image. Role ·
    Timeline sit at the left, the [CONCEPT] label and name (64px Light) at the bottom,
    the problem at the bottom right. Scrolling grows the card from that spot to the
    whole screen (scroll-linked position and size over the first 70vh, with the stage
    pinned meanwhile; see the exception below) while the text fades, then the case
    content follows. Without scroll timelines it
    simply stays a card. No footer on this page.
  - Case picker (lg+): separate frosted pills stacked with a gap (Metalab-style),
    always in the dark media palette, fixed at the left edge over the middle of the
    screen (62% down). An outline ring slides to the selected pill. It belongs to
    the stage: it fades out once you scroll past half a screen and returns at the top; while
    it's hidden, Menu opens the full-screen menu instead of the inline links.
    Below lg an iOS-style segmented control sits under the cover card instead.
    Tabs: arrows / Home / End switch.
  - Picking or switching a case replays the selected state's enter animation (role
    line at 0ms, card and name at 150ms, problem at 250ms).
  - The selected case's content follows the stage (meta row, then the MDX body). Its
    end offers "Next case", which selects the next case and glides back up.
  - The content is built by scrolling, not laid out all at once: every block
    (paragraphs, list items, subheadings, meta items) rises in as it enters the
    screen, one by one; quotes fill in word by word with scroll; a rule above each
    section heading grows in. Same on the full case pages.
  - Inline menu (lg+): Menu opens the page links (Work, Playground, About, Contact)
    as frosted pills just above the left case picker, sliding in one by one (50ms
    apart, 250ms each). Menu again, Esc, or following a link folds them away;
    focus returns to the Menu button.
  - On phones it stacks: intro or case name, the cover as a 24px-rounded card, then
    the segmented control, so text never sits on the image.
  - Full case pages (/work/[slug]) still exist for direct links and the Menu.
- Scroll interactions follow the user's scroll and never take it over: no scroll
  hijacking, snapping, smooth-scroll libraries, or blocked scrolling, and no preloader.
  In-page links scroll smoothly. Reveals and parallax use CSS scroll-driven
  animations, so browsers without support just show the static page.
- One exception, and only this one: the landing stage may pin (sticky) for 70vh of
  normal native scrolling while the selected case's card grows to the full screen.
  Desktop only, only where scroll timelines are supported and motion is allowed;
  otherwise there is no pin and no extra scroll length.
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
## Project opener update
Selected projects and direct case pages use a pure black (#000) background with
white (#FFF) text and gray (#999) metadata. The opener shows the short project
name in an editorial serif (Didot/Bodoni/Times fallback), responsive 64–176px
(clamp with 9.5vw), followed by Project Type, Role, Timeline and a full-width
cover in its natural aspect ratio. This replaces the selected state's floating
card, blurred backdrop and pinned growth sequence. The home project picker
remains available; its space is reserved to the left of the title on desktop.

## Selected project interaction correction
The home selected state retains its sticky 70vh native scroll expansion: a small
cover object at the right grows to fill the viewport, then the case body follows.
The background is black; the short project name is oversized serif type
(clamp 80–208px, 12vw). Metadata sits to the left of the object. On phones it
stacks without pinning; reduced motion preserves the static layout.
On the home page the header name is hidden at the top and becomes visible once
scroll passes 64px and the header compacts. Other routes keep the header name.

## Reference layout refinement
Selected project titles use 9.5vw (64–176px) serif type with 24px left inset
and a top inset of clamp(128px, 10vw, 176px). Metadata follows the title with
64–96px of space and three aligned columns (2fr / .65fr / 1.25fr), white
labels and gray values. The small object sits below that information on the
right and retains the existing scroll expansion.

## Intro emphasis and pointer light
The intro name uses responsive 56–112px medium sans type and the positioning
uses 28–56px medium type, with a wider 28ch measure and centered vertical
placement. An ambient 640px white radial glow follows the mouse behind the
copy (pointer-events none); it fades out on exit and is disabled on touch
and for reduced motion. Intro text remains readable without the effect.

## Devsign canvas treatment
Devsign (workflow-app) alone uses a dark editor canvas (#1C1C1C) with a subtle
24px dot grid (#353535) behind its project opener. Its preview has square
frame corners and a thin accent selection outline, retaining native scroll
expansion. Direct case links use the same canvas background.

## Gemini project treatment
Reference: https://design.google/library/gemini-ai-visual-design (Google Design).
Gemini alone uses a near-black blue surface (#0C0F16), diffuse blue (#4285F4)
and lavender (#A78BFA) radial glows, a pale blue–lavender title gradient
(#D6E2FF / #9DBEFF / #D5C5FF), and 32px rounded preview containers with
a faint cool outline. This is an original concept presentation inspired by
the official gradient and rounded-container language, with no Google logos.
Existing project typography, metadata layout and scroll expansion remain.

## Devsign color and shared alignment refinement
Devsign's background is #1C1C1C and its accent is #3DD491, as supplied by
the user. Use the mint accent for titles, frame outlines and preview controls;
keep the canvas dot grid subtle and neutral, without a colored background bloom. Project headings and
metadata align with the sidebar's 32px desktop left inset (16px on phones).
The intro now uses a prompt-style local project search and project-name chips.
The input filters projects, Enter opens a single match, and chips open their
project directly. No AI service is implied. The sidebar project picker is
shown only after selection. Exact project name: Gemini privacy revamp.
Prompt: 24px rounded translucent surface, 56px minimum height; chips are
pills with project names only. Intro type: 56–96px name, 28–48px positioning.

## Prompt selection motion
Clicking a project chip types its name into the real input (maximum ~700ms),
then animates send for 420ms and fades the intro for 280ms. The case reveals
its title, metadata and preview in sequence; preview animation is on an inner
layer so it cannot conflict with native scroll expansion. Enter submission
skips simulated typing. Escape or Cancel stops the transition; timers clean
up on unmount, repeated selection is guarded. Reduced motion opens directly.

## Sequential project construction
After prompt submission, reveal title at 0ms, metadata columns at 650/950/1250ms,
empty preview frame at 1550ms and image at 1900ms (complete at 2600ms).
Frame entrance runs on a separate inner layer; its background and outline
are hidden until its turn, while the outer layer retains scroll expansion.
The sequence replays on every project switch and skips for reduced motion.

## Ambient intro gradient
Main intro has three decorative radial light fields behind its copy: blue
(#5578C4 at 22%), violet (#8070B7 at 18%) and pearl (#CAD7E4 at 8%).
They drift and gently change shape over independent 18/23/27-second cycles,
using transform and opacity only. They do not intercept input or affect
project screens. Reduced motion keeps them static; the mouse light remains.

## Site identity and circular cursor
Header identity is the full Minyeon Kim wordmark in medium Geist, preserving
its home-at-top hiding rule. Browser icon is an abstract orbit: an ivory crescent and small detached dot
on a charcoal rounded square, without letterforms.
Fine-pointer devices use a native
24px circular cursor asset, a larger filled 32px circle on links/buttons, preserving
text selection cursors on editable fields and native cursors in forced colors.

## Cursor and project alignment correction
Both cursor assets are solid white circles with no stroke. Project title
and metadata left inset is shared with the project selector text: 32px on
desktop, 16px on phones. The rail itself begins 16px from the desktop edge
so its 16px button padding places labels on the 32px text baseline.

## Theme and spacing correction
Project left inset is clamp(40px, 6vw, 112px), 24px on phones; selector text
shares that baseline. Gemini title is two lines: Gemini / privacy revamp,
with the official Gemini sparkle downloaded from gemini.google.com beside
its first line, as explicitly requested. The case remains marked Concept.
All presentation surfaces now inherit light/dark tokens, including intro,
header, sidebar, prompts and case bodies. Devsign dark retains #1C1C1C and
#3DD491; light uses #F1F3F2 and accessible #087A4C text. Gemini light uses
#F4F7FF with deep blue/lavender type; dark keeps its existing palette.
Native circular cursor switches to charcoal in light mode for visibility.

## Shared horizontal alignment
Expanded header Menu/X and theme controls, menu overlay top bar and content,
intro copy and project opener all use --project-text-inset symmetrically.
The compact floating header alone uses its own 24px inner padding.
Intro copy no longer adds a separate 200px left indent or centered max-width.

## Horizontal inset refinement
Shared horizontal inset is now clamp(32px, 4vw, 72px), with 20px on phones.
Keep headers, menu, project text and selector labels on this same grid.

## Centered intro and tighter edges
Shared page inset is clamp(24px, 2.5vw, 48px), 16px on phones.
Intro name, positioning and prompt form one centered composition (max 960px);
project chips are centered below it. Project screens retain left alignment.

## Chat-to-case transition
On submit, replace the composer with a right-aligned user speech bubble
containing the submitted text. After 400ms, show a left-aligned processing
indicator with three orbiting dots and shimmering preview lines for 1200ms.
Then dissolve the conversation for 360ms into the existing sequential case
construction. Chip typing, manual submission, cancellation and timer cleanup
share the same path. Theme-aware fills and text work in both modes; reduced
motion skips simulated waiting. This is a local project-navigation animation.

## Softer positioning and chat pop transition
Positioning line is now light 300 weight, 22–36px responsive size and 1.35
leading. After processing, chat elements condense over 480ms, resolving into
a central dot which swells and pops away over 760ms total. Intro copy fades
independently so chat gathering stays visible. The case materializes with a
450ms fade, followed by existing staged element reveals. Reduced motion skips.

## Physical chat transition revision
Processing UI shows only the orbiting dots (no text or skeleton lines).
The user bubble visibly anticipates, travels to the measured center, squashes
and joins the accelerating orbit. A springy dot pops out in 980ms, then the
project opens as a circular reveal from that exact viewport location.
No blur or early fade on gathering elements; accessible status is screen-reader
only while the conversation is shown. Reduced-motion bypass remains.

## Calm conversation-to-result motion (current)
Supersedes magnet/pop/circular reveal: sent user bubble rises into place,
three inline dots pulse in sequence, then conversation clears upward over
260ms and the case unfolds (title, metadata, frame, image) over ~1100ms.
Processing lasts 480ms after a 180ms sent state. No spinning, skeleton lines,
squashing, pop or expanding circle. Programmatic heading focus has no ring.

## Full-screen vertical handoff (current)
After chat processing, native View Transitions capture the full intro and
project stage as a shared named region. Intro moves up -100svh as the project
enters from +100svh over 720ms; header remains stationary. Internal result
reveals start late in the slide. Fallback slides the project in; reduced
motion swaps directly. No isolated bubble fade during this handoff.

## Stable prompt and Gemini phone preview
Intro picker reserves 220px in all states so submission cannot shift the
centered name/positioning. Gemini two-line project title uses .87 line-height with no extra gap. Gemini cover now uses mobile-preview.svg: an original tall phone mockup
of the existing source-management concept, with no new product claims.
Preview uses contain rather than crop, transparent frame and 90svh maximum
height on direct case pages. Original desktop storyboard remains in the body.

## Editorial case-study layout
Case bodies now span the shared page inset instead of the 680px article with
side navigation. Text remains readable in split heading/body columns; large
statements alternate with wide media and paired comparison slots. Responsive
single-column layout on phones. Placeholder figures explicitly label the
planned image and its purpose, with no stock imagery or invented screenshots.
Devsign's working story is selected from the user's pasted project overview:
overview, challenge, research, role-based direction, Merge Studio, change review,
workspace/history, initial testing, co-design, reflection. Omit performance
claims and keep revised-design validation limits explicit. Draft label remains.
Its metadata follows the supplied two-person team and Aug–Oct timeline.

## Body statement leading
Large blockquote statements use responsive 28–48px type with explicit 1.3
line-height; never inherit the fixed 32px text-lg leading at the larger size.
This is separate from the compact two-line project title.

## Image sequence galleries
BeforeAfter is a static labeled two-up comparison, with no drag slider.
CaseGallery pins a desktop viewport while native vertical scrolling advances
an image strip; the final image releases into the following body content.
No wheel interception or scroll locking. ResizeObserver recalculates travel;
passive scroll is batched via requestAnimationFrame. A Continue reading anchor
skips the sequence. Mobile, reduced motion and no-JS show a vertical stack.
Placeholder sequences cover Devsign Merge Studio (4), change review (3), and
Gemini mobile flows (3). Items accept optional src/alt for later real images.

## Compact galleries and stable live handoff
Pinned galleries are min(62svh, 640px) tall (340px floor), slides are min(66%,
880px) wide, with 45svh travel per extra slide. The intro-to-case handoff now
uses two live DOM layers, not resized snapshots. Intro stays mounted with
its chat state as it slides away; selected case is fixed during 680ms entry
then becomes its normal sticky stage without remounting. Desktop header offset
is 64px consistently. Stable scrollbar gutter prevents horizontal shifts.

## Header edge placement
Expanded header and menu overlay top controls use 24px horizontal inset on
desktop and 12px on phones, independently of the wider body content grid.
Compact floating header retains 24px inner spacing.

## Subtle spotlight and clean preview
Next.js development indicator is disabled via devIndicators: false. Cursor
spotlight is 320px across with 5.5% peak white opacity and 1.8% mid-falloff,
keeping the existing ambient gradient and pointer movement.

## More visible ambient movement
Main background light fields sit closer to the composition and drift over
14/18/22-second alternating cycles, with offset starting phases. Maintain
low opacity and static reduced-motion fallback; cursor light stays small.

## Return to intro with top overscroll
On an active home project or /work case page, an additional upward wheel
gesture at the top returns to the main intro. It requires a fresh gesture
after 300ms at top and 120px accumulated delta, with a 1s entry grace period,
so scrolling up through the case or inertial scrolling cannot exit by accident.
Touch supports a 100px downward pull starting at top. Modal menus, editable
fields and nested scroll surfaces are excluded; native scroll is never blocked.

## Return direction correction
Top-overscroll return preserves an inert, aria-hidden outgoing detail layer
while the intro mounts behind it, then moves that layer downward by 100svh
over 700ms. It does not move the detail upward. Header stays above the layer.
Direct routes wait for the intro DOM before animating; reduced motion swaps
directly. The temporary layer is removed after animation or a 4s timeout.

## Next project upward entrance
Bottom Next project buttons and direct-page links preserve the current reading
position in an inert temporary layer. Next content mounts at scroll top and
rises from +100svh over the previous page in 720ms; header remains above both.
Avoid smooth scrolling through the old article. Shared helper guards repeated
clicks, honors reduced motion, waits for the destination DOM, and cleans up.
Draft/template cases are excluded from direct-page next-project ordering.

Next-project navigation moves the outgoing viewport up by one screen while the incoming viewport moves from below to zero, with matching 850ms easing. Separate fixed layers avoid transforming the live scroll container and disable route crossfade during the slide.

Next-project slides hold scroll at zero through layout commits and the slide, with router automatic scrolling disabled; the incoming viewport always starts at the large project title.

Dark intro ambient gradients sit outside the viewport edges and drift gently along the perimeter. A radial mask keeps ambient light away from the centered name, positioning, and prompt. Light mode and pointer spotlight remain unchanged.

Dark ambient mask now excludes the entire middle rectangle (horizontal 16–84%, vertical 12–88%); only the outer edge strips receive the moving gradients. Home stage resets scroll after its active-case React commit as well as during the next-case slide, preventing scroll anchoring from keeping the previous detail offset. Verified Gemini-to-Devsign home transition at scrollY 0 with title at 166px.

Next-project vertical slide uses synchronized 28-step timing over 850ms and a 32px-wide pixelated leading edge (0/16/32px depths), settling flat at the end. Reduced motion continues to bypass the effect, and the incoming view remains anchored at its project title.

Superseding the stepped slide: next-project navigation now uses a stationary pixel dissolve. The outgoing viewport loses scattered square cells (40px desktop, 24px mobile) over 850ms, exposing the next project at its title behind it. No translation or pixelated text scaling; reduced motion bypasses the dissolve.

Final project transition combines continuous synchronized upward slide (950ms) with the outgoing viewport square-cell dissolve during that slide. The next project title rises from below. An opaque base prevents the live destination flashing through the disappearing cells before its entering layer reaches that position.

Chat-to-project and next-project now share revealNextProject (1100ms continuous slide + pixel dissolve). Removed the separate 680ms intro handoff state/timer. Masks are prepared before either slide starts, keeping clocks synchronized. The destination suppresses duplicate generated entrance animations, and scroll resets before and after the React stage commit. Browser verified chat→Gemini and Gemini bottom→Devsign: scrollY 0, title top 166px, no leftover transition layers.

Pixel dissolve is now restricted to the meeting seam: outgoing bottom 64px / incoming top 64px (48px mobile), with 16px / 12px cells. Both page interiors stay opaque and slide continuously. Seam intensity rises then settles to zero before the title-view handoff.

Transition pixel layers now inherit the outgoing/incoming project canvas colors instead of global gray --bg. Navigation blurs the old Next control, clears stale section hashes, focuses the new title with preventScroll, and resets scroll after layer-removal frames; reduced-motion navigation also waits for destination readiness before resetting. Verified anchored Gemini direct detail→Devsign: hash empty, scrollY 0, H1 focused at top 192px.

Replaced pixel effects with a curved slide + subtle parallax in the shared chat/next-project transition. Incoming top edge is a shallow convex curve (max96px / 10vh), flattening before arrival. The outgoing viewport drifts up24%, incoming content settles28px while the page rises a full viewport over1100ms. All pixel mask generation is removed. Title scroll/focus handling and reduced motion remain in place.

Project transition now fixes the document body at scroll zero while viewport layers animate, blocks wheel/touch scroll only during the transition, restores body layout beneath the incoming layer, then removes layers after two layout frames. Browser overflow anchoring is disabled for html/body/main. Browser verified home chat→Gemini, Gemini bottom→Devsign, and Devsign bottom→Gemini: scrollY 0, title top166px, body unlocked; Devsign remained at zero after the transition.

Incoming project transition now animates the real main element in a fixed viewport instead of cloning the incoming document. This removes the incoming-clone/live-layout handoff. Only outgoing reading position is snapshotted. On finish all animations are canceled, original main/body inline styles restored, then title focus/scroll zero finalized under the outgoing cover. Browser checked home Gemini→Devsign and Devsign→Gemini after bottom scrolling: title top166px, scrollY0, no remaining fixed main style.

Next-project arrows point down on both home detail and direct routes, with downward hover movement. Main chat project suggestions include18px decorative brand icons: Gemini sparkle and a mint Devsign code mark in an8px icon/text gap.

Main chat now includes an About me suggestion with a small person icon. It uses the same typed request, thinking feedback, and shared curved slide as projects, then opens /about/ at the top. Typed About queries also match. Browser confirmed /about/, scrollY0, no remaining transition lock.

Chat suggestion pills do not shrink or wrap their labels, so About me stays on one line. Icon/text gap reduced to6px and horizontal padding16px. Both button and label use theme-aware --ink for light-mode contrast, removing the hardcoded pale label color.

About uses the same top overscroll return-to-main interaction as projects. Return is suppressed while a page transition is active. Chat suggestion pills have a staggered, low-contrast glint every7s, using theme-aware ink, clipped to the pill, disabled for reduced motion and busy controls.

Suggestion sheen visibility improved: starts immediately, stronger34% theme-ink center, 3.8s cycle with staggered starts, and a900ms sweep on hover/focus plus subtle edge glow. Replaces the prior7s mostly-idle glint.

Pill sheen softened to13% theme-ink center,5.5s cycle and1.4s hover sweep; hover glow removed. Root scrollbar hidden via scrollbar-width:none / WebKit scrollbar while normal scrolling remains enabled; removed reserved scrollbar gutter.

Pill surface sheen removed. A1px masked conic highlight now travels only along the rounded border over9s, with28% theme-ink peak and offset phases. No interior sweep or hover flash. Reduced motion leaves a static border highlight.

Pill highlight now uses an actual SVG rounded-rectangle stroke with12/88 dash pattern and12s perimeter travel. Previous pseudo-element/conic/surface effects removed and pseudo-elements explicitly disabled. Restarted dev cache and visually verified short highlights only on pill borders.

Removed the traveling SVG dash. Pill borders now have a stationary, diffused upper-edge glint that slowly fades in/out with long pauses; peak contrast is under10% theme ink. No perimeter crawling or surface sweep.

Main prompt now enters after the introduction with a700ms soft fade/rise (16px,2% scale,3px blur) starting280ms after mount. Suggestions follow at580ms with an8px fade/rise. CSS animations leave final layout unchanged and respect reduced motion.

Main chat composition narrowed from820px to640px maximum width, retaining centered alignment and responsive full width on small screens.

Intro now uses a quiet one-time sequence: name resolves from blur in place700ms; positioning fades/rises6px after150ms; prompt follows at400ms, suggestions at680ms. Removed ScrambleHeadline from home and old rise-in utilities on name/positioning. Text remains still after entrance; reduced motion renders immediately.

Restored home ScrambleHeadline at user request, including load scramble and local cursor interaction. Retained the intro sequence wrapper. Name sizing unchanged pending discussion.

Name reduced to clamp44px/5vw/72px. Positioning width now matches the centered chat max-width640px for a unified column; scramble remains enabled.

Positioning and chat now share --intro-content-width640px. Positioning type reduced from36px maximum to30px (20px mobile minimum) for calmer wrapping within the same column.

Chat pills now have destination-tinted backgrounds and faint matching borders to distinguish them from the neutral prompt: Gemini blue, Devsign mint, About lavender. Colors blend with --intro-canvas for both themes, with theme-aware text unchanged.

Intro simplified into a640px left-aligned column: name, positioning, prompt, and suggestion row share a left edge instead of centered text. Destination-colored pill fills removed; suggestions use transparent surfaces and14% theme-ink inset borders, retaining only the small brand icon colors.

Intro composition starts higher in the viewport (top clamp112px/16svh/176px,96px mobile) rather than vertically centered. Name and positioning remain together; chat has56px breathing room below them (40px mobile).

Reverted the high-position intro composition at user request. Restored vertical centering and previous40px desktop /32px mobile chat spacing, retaining left-aligned text. Font alternatives discussed without changing typefaces.

Applied softer serif name (Iowan Old Style / Palatino / Georgia,400 weight,72px max) with sans-serif positioning unchanged. Intro has explicit vertical centering and symmetric80px desktop /48px mobile padding; name, positioning and chat retain their shared640px left-aligned column. Removed obsolete intro-copy utility width/padding classes.

Reference font identified from Metalab official brand article as PP Eiko. No licensed Eiko asset exists in repo, so the name now uses actual Cormorant Garamond500 via next/font/google as a similar open-source display-serif alternative; removed synthetic text stroke. Project title fonts remain unchanged.

Font audit found stale dev CSS: browser still computed Bodoni600 despite new font variable. Restarted clean dev cache; browser now computes Cormorant Garamond500. Name translate=no prevents automatic browser translation into Korean fallback glyphs.

Name Cormorant Garamond now uses actual600 webfont weight, browser verified. Added procedural WebGL hero sculpture: a softly squared, twisted loop with blue/violet metallic shading (pearl in light mode), spring-smoothed cursor tilt and subtle time deformation. Edge placement preserves640px reading column; mobile quieter. No external model/runtime. Caps DPR1.25 and30fps, pauses offscreen/hidden, respects reduced motion, cleans GPU resources. Transition snapshots copy canvas pixels so the sculpture remains visible as the intro leaves. Dark/light views visually verified.

Replaced literal cards/frames with an oversized continuous folded ribbon cropped by viewport. Full-surface procedural canvas frames the central copy, with restrained cursor tilt and slow flexing. Gemini subtly changes to four-way curvature and blue/violet, Devsign three-way curvature and mint; selection morphs via smoothed uniforms without reinitializing WebGL. Matching quieter canvas is also in selected/direct project title screens. DPR/render width capped1280px for full background. Browser visually verified main crop and Devsign mint title background; scroll remains0.

Sculpture is main-only per user correction: removed from selected project stage and direct ProjectHero. Main selection can still morph color/curvature while the typed prompt runs, then leaves with the intro. Main sculpture softened to42% opacity,2.5px blur, corner masks. Rendering capped960px/24fps and pauses during data-project-navigation; scene clock resumes without jumps. Curved slide uses simple animated rounded clipping instead of33-point polygon, with a smoother1050ms deceleration.

User preferred Suno-like diffused color motion over a recognizable object. Replaced all raymarched geometry with lightweight noise-warped color pools (blue/violet/teal default; Gemini blue/violet; Devsign mint). No solid silhouette, normals, or specular highlights. Cursor gently displaces the fields; old ambient/spotlight layers removed to avoid competing effects. Main-only, center-protected, theme-aware, paused during page transitions. Browser visually verified no object outline.

Main idle appearance restored to the previous restrained edge ambient gradients. Flowing color canvas stays invisible and does not loop while variant=default. Clicking a suggestion fades in its colored flow over850ms, with stronger visible movement during typing/thinking, then it leaves with the main. Escape resets to the original idle background.

Selection flow made clearly visible: while a suggestion runs (typing → thinking), the color canvas fades in over 500ms, flows ~6x faster with stronger warp, pulls its pools inward, and its mask opens toward the copy; the idle edge ambient fades out meanwhile. About me gets a lavender flavor. Idle main unchanged (canvas hidden, not looping). Verified Devsign mint (light) and Gemini blue/violet (dark).

GitHub Pages deploy: .github/workflows/deploy.yml builds on push to main and passes configure-pages' base_path as PAGES_BASE_PATH (→ next basePath + NEXT_PUBLIC_BASE_PATH). /public paths in next/image and plain <a> go through withBase() in lib/site.ts; cursor SVGs are inlined as data URIs so CSS has no root paths. Repo minyeon-kim/portfolio serves at /portfolio; renaming to minyeon-kim.github.io or adding a custom domain needs no code change.

Selected project title raised (desktop top padding clamp(88px, 7vw, 120px)). The home project rail is anchored 48px from the bottom instead of 62% down, so the inline menu that opens above it clears the title and metadata (verified ~100px gap at 1432px wide).

Project slide easing revised: cubic-bezier(0.45, 0, 0.12, 1) over 1200ms (was a fast-burst 0.22,1,0.36,1 over 1050ms that crawled and then appeared to cut off). The curved top edge flattens across the whole slide. The outgoing page starts drifting up on click (1400ms) instead of waiting for the next page to render.

Project slide follow-through: as the incoming page lands, its title, metadata columns and preview trail by 64/96/140px and settle 300–500ms after the page stops (WAAPI `translate`, staggered), so the motion eases out instead of stopping as one slab. Applies to chat→project, Next project, and direct-page links.

Fixed the end-of-slide cut: the fixed incoming main now starts at the viewport top (top 0, padding-top + header offset, full innerHeight). Previously it was clipped at main's top (64px), but the home stage sits under the header via negative margin, so the old page stayed visible in the top strip until cleanup swapped it in one frame.
