# Portfolio — Minyeon Kim

## Who this is for
Personal portfolio of a product designer with a computer science + cybersecurity
background, applying to product designer / design engineer roles in English-speaking
countries. Target readers: hiring managers at privacy/security companies and
developer-tools companies (Linear, Vercel, Proton, Bitwarden). They scan for 6–8
seconds, then read case studies for judgment, not decoration.

Positioning line (hero): "Product designer with a background in cybersecurity —
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
Case and About pages are one centered column: section label, title and text at
680px, images, stats and cards a step wider (880px, centered). Images keep their
own aspect ratio and hug their caption; tall boards cap at 600px.
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
- Product logos are fine when the case is a revamp of that real product (the Gemini
  case uses the Gemini logo and real Gemini UI). Still mark it as a self-initiated
  concept, not affiliated with the company.
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
a faint cool outline. This is a revamp concept of the real product, so the Gemini logo and Gemini UI
appear as they do in the product, labelled as a self-initiated concept.
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

Case body rhythm loosened on desktop (phones unchanged): sections clamp(80–144px) top / clamp(72–120px) bottom, statements and blockquotes clamp(96–176px), media bottom clamp(96–160px), eyebrow-to-title 40–64px, paired media gap 24–48px.

About uses the project frame: ProjectHero (serif "About"; Role / Background / Focus), then a portrait placeholder (4:5) beside a short first-person bio, the positioning as a statement, and numbered CaseSections: 01 How I work (three principles, each backed by a case fact), 02 Selected work (featured cases with timeline, problem, role), 03 Background (Story timeline: Computer science TODO; Security Consultant at SK shieldus, Mar 2022 – Mar 2026, Seongnam, full-time, as supplied by Minyeon; 2026 projects), 04 Toolkit (Design / Engineering / Security rows), 05 Outside work (TODO line + two 16:9 photo placeholders), 06 Contact (resume, LinkedIn, email; each shows once set). Copy lives in content/about.mdx (bio, principles, skills exports + Story) and was drafted only from facts already on the site; no schools, employers, years or metrics are invented. site.email and site.linkedinUrl are set (supplied by Minyeon); only the resume PDF is still missing. ProjectHero accepts an optional `details` list.

Project openers raised: home selected title top padding clamp(76px, 5vw, 96px); direct page heading top padding clamp(40px, 4vw, 72px); title-to-metadata gap clamp(40px, 4vw, 72px) on both.

About intro statement uses the project section-title scale (clamp 32–64px, weight 400, balanced wrap) instead of the 36–80px pull-statement size.

Hero emphasis (Decrypted exception, approved by the user): in the positioning line the word "cybersecurity" stays scrambled from the moment it types in and resolves last, left to right, between ~0.95s and 1.2s (load cap unchanged). The rest of the line types out by 0.85s with per-glyph scramble scaled down so the scrambled front stays ~6 glyphs. ScrambleHeadline takes an `emphasis` word. Cursor re-scramble and reduced-motion behavior are unchanged.

Next-project/chat transitions hold the new page at the top while momentum from the click-time scroll is still arriving: Chrome's momentum wheel events are non-cancelable, so the root gets overflow: hidden (and is reset to the top) until 220ms pass without wheel events (max 2.5s). Leftover trackpad inertia never scrolls the new page; a fresh gesture scrolls normally.

Route changes under the project slide (direct /work Next, chat → About) still start a React view transition (~30ms). With ::view-transition hidden, captured elements (root, .project-detail) blanked for those frames — a visible flicker. During data-project-navigation every view-transition-name is forced to none, so nothing is captured.

Main chat composer is now a 56px full pill (radius 999px, padding 7px around the 40px send button, 24px text inset), matching the pill language of the suggestions; suggestions themselves unchanged for now.

Chat send button: 1.75px line up-arrow SVG (no text glyph). Quiet soft-fill circle with ink icon while empty; solid ink circle once there is text or a selection is running (250ms crossfade). Send animation lifts the arrow straight up.

Gemini mockup turn: GeminiDevice wraps the phone art in a 3D box (kept at the art's 1000:1100 ratio via container units) with a metal side strip on the body's right edge. On home it starts large (2.3x) and lying diagonally (screen-space rotateZ 18° applied after rotateY -64°, rotateX 26°, rotateZ -38°), cropped by the stage's bottom edge like a product shot and scroll cue; on the case cover the same slant at 90% size. Frame overflow is visible so the pose isn't clipped by its own frame. It then swings to face the viewer with an ease-in-out over the first 85% of 70vh of native scroll, on the home stage and the case cover. Where scroll timelines run, the turned pose is also the base style, so it never flashes upright while the page slide holds scroll. md+ with motion allowed only; otherwise flat and upright.

Project transitions (current, supersedes the strip/bridge/curve/feather notes): sequenced, never showing both pages' content at once. Opening a project, Next and About: the old view's content (text, pills, media) lifts 2vh and blurs away in 140ms while its canvas stays as the ground; from 160ms the new page rises 10vh and fades in (800ms, ease cubic-bezier(0.2,0.8,0.2,1)); opener parts still follow through slightly. Returning to the intro: the detail's content drops and blurs away in 140ms, its canvas clears 120–360ms, and the intro settles from -5vh and fades in from 200ms. On cleanup the old layers are hidden before animations are cancelled, so a cancelled fade can't snap the old view back over the new page. Scroll lock, momentum hold, focus and reduced-motion handling are unchanged.

End of a case (home stage and direct pages): "More work" — the other projects as three equal cards (MoreWork). Real cases come first in display order (opener serif name in project colour, TL;DR problem line, arrow; same page transition; home cards select the case). Empty slots up to three show "In progress / A new case study is being written." (not links, fainter fill) and fill automatically as cases are added. The single big Next CTA is removed.
Intro copy stays dimmed (35%) through the leaving phase too. The outgoing snapshot pins every element that is mid-animation/transition (and everything inside the intro's data-phase surface) at its on-screen opacity/transform/filter, since animations are disabled inside the snapshot and would otherwise snap to their end state (the "Product designer…" line flashing to full before fading).
The fixed home project rail (pills) is hidden during data-project-navigation and eases in (250ms) once the new page has landed, instead of popping in above the transition layers.

Chat welcome: the AI light sits alone in the welcome slot, then pops away (220ms swell to 1.18x, then shrink to 0) and "What would you like to explore?" types in letter by letter in that same slot. The "Ask me anything" placeholder is removed. Suggestions sit below the chat bar as a quiet left-aligned vertical list (icon + text rows, 44px tall, muted text that turns ink with a soft fill on hover/focus), outside the capsule, visible while typing. The welcome question rests at the bottom of its slot, 20px above the bar (16px on phones). The empty chat input shows the placeholder "Ask about a project" in --muted.

Intro middle step: scrolling from the name brings in a 24px-rounded card (IntroShowcase). At ≥1200px the name and positioning slide to the left inset (clamp 48–112px) and the card sits at the right; below that (tablets, phones) the copy rises and the card stacks under it, sized to fit the screen height. The card cycles every 4.2s: first a profile photo slot (labeled placeholder, TODO until Minyeon supplies a portrait or work photo), then the featured covers. The next image slides in from the right with blur while the current one drifts left and blurs away (900ms). Only dots below the card, no caption or pause button; hover or keyboard focus holds the slide. Then card, name and positioning leave and the chat enters as before. Intro stage is 300svh (260svh on phones). With reduced motion there is no card.

End of a case (home stage and direct pages) is now a fanned "Next project" deck (MoreWork), replacing the three equal cards. The next real case is the front card (4:5, 24px radius, project-tinted cover) and opens with the shared page transition; up to two cards peek out behind it (scaled 0.84, offset left/right) and fan out with a slight tilt on hover/focus. Clicking a back card brings it forward. Empty spots up to three are "In progress" back cards (never links). The front project's serif name (project colour) with an arrow and its problem line sit centered below. The deck rotates every 4.2s only once there are 3+ real other cases; hover/focus holds it, reduced motion never rotates.

Devsign case body (EN and /ko) follows the Figma frames "Devsign · Case study · 1920" (node 312:19) and "Devsign · 케이스 스터디 · KO · 1920" (node 270:2), below the opener only, including their colors: white surfaces, purple accent #5B3FD6, persona orange, gap red, gray Deliver band, lavender core-problem band (light theme uses the frame values exactly; dark theme keeps the roles on dark surfaces with a lighter purple). Sticky stage nav (Overview, Discover, Define, Develop, Deliver, Takeaway; Testing counts as Deliver), then Overview (headline, Problem/Solution/Impact rows from the TL;DR, labels without colons), Discover, Define (journey low points use the Figma emoji), Develop, Deliver (three feature screens on the pinned CaseGallery, feature variant), Testing (As-is/To-be as a drag slider with a keyboard range control, per the Figma annotation), Takeaway. Copy and UI labels live as a `study` export in content/cases/workflow-app.mdx and content/ko/cases/workflow-app.mdx; layout in components/devsign-case.tsx. TL;DR labels may omit the colon, and Korean cases may use the English labels (lib/cases.ts falls back). Images are WebP in public/images/devsign.

Devsign color is now the Figma purple everywhere (--devsign-title #5B3FD6 light / #A594FF dark: opener title, home picks and icon, next-project name, case body). The Devsign body uses Figma's margins (12.5% sides, 240px max, 1440px column) and Figma's fixed image frames and crops. The stage nav is a vertical list in the left margin on screens 1200px and wider (starts beside the Overview title, then stays vertically centered; no "Devsign · Case study" title), and a horizontal bar pinned to the top below that. Figma frames 312:19 and 270:2 match. As-is/To-be sliders sit at Figma's panel height with captions beside them.

Devsign opener (direct page and the home selected stage) follows the Figma "Hero" frame instead of the serif title + growing cover: #F5F5F5 stage, logo + Space Grotesk "Devsign" wordmark, centered 84px Medium question, the prototype loop (DevsignLoop) center-cropped in Figma's 1440x759 window (1px line, 14px radius, soft shadow), then Duration / Team / Role / Tools. Copy lives in each locale's meta.hero. The Devsign home stage no longer pins or grows (no stage-pin); Gemini keeps its stage. The core-problem band bleeds full width.

Devsign "Main features" (Figma frames 312:158 / 270:121, previously hidden) is shown again, restyled in the case body language: method label, uppercase title, four equal feature cards (kicker in Devsign purple, 28px name, muted description) and a "See them in action in Deliver" link. On the site it sits at the end of Overview (study.overview.features in both locales).

Figma: the pre-redesign main (name + photo intro) and the AI chat step are archived on the "Archive · Templates" page as two sections ("Archive · Main …" and "Archive · AI chat step …", 2026-10-29) with Korean interaction notes, the original Home · 1920/1440/KO frames, the Home flow 1–4 frames, and 1440×900 live captures. The new main draft lives on the Layout page in the section "Main · redesign (draft v1)": default and answer-state frames (Metalab-style first screen: positioning line, slim composer, question chips, two full-width work tiles, closing block) with interaction notes on each block. Not built on the site yet.

Landing page (current; the chat version, the tile version and the name + photo intro are archived in Figma): one dark screen that never scrolls, after metalab.com's home. Always the dark media palette whatever the theme; over it the header reads light, the Menu button and theme toggle get frosted pill fills, and a 140px scrim fades from the top. Behind everything a glossy twisted loop turns slowly (components/home/hero-object.tsx: raymarched in a fragment shader, tilts toward the cursor, DPR 1 / 1280px / 30fps cap, pauses offscreen or during the page transition, hidden with reduced motion) over the dark ambient light fields. Default (nothing or About me hovered): local Seoul time top right (mono, 30s tick), the case picker as frosted pills pinned left-center (01 Gemini privacy revamp, 02 Devsign, About me), the second half of the positioning bottom left (ui.heroParagraph), the first half bottom right as the big display statement (ui.heroLine, Decrypted scramble with "cybersecurity" resolving last, --font-display). Hovering or focusing a case pill recolours the object to that case (Gemini blue/lavender, Devsign purple), raises its device at the right (Devsign: the workspace loop as a tilted window; Gemini: the 3D phone loop, turned) and swaps the statement and paragraph to its name and TL;DR problem line (250ms). Click opens the case or About with the shared transition. No chat on the landing any more; the question chips and answers (ui.homeQuestions) are unused. Phones stack: time, statement, paragraph, pills row; the device sits low right.

Gemini case now uses the Devsign opener (DevsignHero with the Gemini sparkle, the phone loop on the Gemini surface, meta.hero per locale) and the Devsign body skin over its generic MDX blocks (.case-study[data-skin="dv"]: Devsign margins, stage titles drawn by ::before on #overview/#discover/#define/#develop/#deliver/#review, a DevsignNav with those six stages, cards, stats, compare tables and the TL;DR as Problem / My role / Outcome rows). No Figma frame exists for Gemini yet; this mirrors the Devsign one.

Figma: the Layout page section "Main · redesign v2 (Metalab structure, as built 2026-10-29)" holds the matching frames (default / About me, hover 02 Devsign, hover 01 Gemini, phone) with interaction notes; the object is a gradient-ring stand-in for the WebGL loop. Two live captures are marked reference only. The earlier tile draft is archived on the Archive page ("Archive · Main draft v1 (tiles) · superseded").

Landing object (current, supersedes the glossy twisted loop and the three-strand braid tried in between): after metalab.com's own home object, an oversized black chrome loop on a softly squared path that crosses the whole stage, lit by two long white softbox streaks and violet/blue reflections, with film grain (components/home/hero-object.tsx, raymarched; camera close so the loop runs past the edges). The loop stands for the research-design-engineering line closing on itself. Hovering a case recolours the reflections (Gemini blue/lavender, Devsign purple) and changes the loop's weight. The Seoul clock is gone. About me hover shows "Minyeon Kim" as the statement with the whole positioning line as the paragraph. Pills after Metalab: the hovered/active pill turns into a 1px white outline ring with no fill, the others stay filled and dim slightly; no translate. The dark stage and the header over it use a white circular cursor (--cursor-base/--cursor-action overridden on .intro-stage.home-stage and header[data-home]).

Devsign iteration (Testing): the As-is/To-be drag slider is replaced by a segmented As-is | To-be toggle (DevsignCompare, role=tablist, arrow keys) that crossfades the two screens and captions (400ms); when the block scrolls into view it plays As-is → To-be once after 1.4s, reduced motion starts on To-be. Figma annotations still say "drag the divider" and need updating.

Double Diamond is shared: components/double-diamond.tsx holds the Devsign Figma geometry (1440x520, Problem/Solution, core problem at the waist, Research/Design, `current` stage tinted, optional `pivot` note under it). The Devsign body uses it with study.labels; MDX cases use CaseDiamond (components/case-diamond.tsx, client, labels from ui.problem/solution/coreProblem/research/design) which draws it and then one card per phase (title and handed-on output; Devsign skin cards, current phase tinted). The Gemini case marks Define as current with the pivot "Warn while typing → Control what's connected". The old diverge/converge polygon drawing is removed.

Opening a case from a home pill (after metalab.com): the hovered device is copied into a fixed layer (.project-zoom) at its on-screen box and grows to the full viewport over 650ms, flattening its 3D pose, while the old view blurs away; the Devsign window shows the whole prototype screen fitted and centred (width min(100%, 160vh)) on a dark ground, Gemini the phone on its blue/lavender surface. Once the case stage is mounted, the new page fades in (750ms) while the layer shrinks into the opener's media frame (.devsign-hero-media, measured live) and blends out over the last quarter. revealNextProject takes an optional third argument { from, to, project }; HomeIntro passes the active .home-device child, ProjectStage only when the project has a Figma-style hero. Segmented control, More work and direct pages keep the plain rise-in. Reduced motion skips the layer.

Landing follows the theme now (no forced dark palette): dark is near-black (#080909) with the black chrome loop; light is #eef0ee with a pearl chrome loop (shader `light` uniform, eased, from html[data-theme] or prefers-color-scheme; darker room, dark seam streak, stronger violet). Pills, vignette, top scrim and the frosted header buttons are ink-based (color-mix) so the Menu button is never white on a light stage; the home-only white cursor override is gone (the root cursor already switches with the theme). The header's light-ink override over the stage is removed too.

Devsign/Gemini opener fits one screen (1440x900): padding-top clamp(96px, 10svh, 128px), title clamp(36px, min(4.375vw, 7.5svh), 84px), media width min(100%, (100svh - 640px) * 1440/759) centred (min 560px), media and facts margins clamp(32px, 4svh, 64/56px). The fixed home project rail (SideRail / CasePills) is no longer rendered on the selected stage: it overlapped the opener media; switching cases is the Menu and the More work deck.

Figma (2026-10-29, after the landing rebuild): the Layout page section "Main · redesign v2" now matches the site — local time removed from every frame; the hovered pill is a 1px white outline ring with no fill and the other pills dim; the object stand-in is an oversized rounded loop with a black-chrome gradient stroke and white streak highlights (named as the WebGL stand-in); new frames "hover About me" (Minyeon Kim as the statement, the whole positioning line as the paragraph, About pill active) and "default · light theme" (page grey, dark ink, pearl chrome loop); the draft note describes the click transition (device grows to the screen, settles into the opener media) and the theme behaviour. The Devsign compare component set (615:199 / 615:221, "State=As-is/To-be") has its drag handles hidden, a toggle hint and a description of the segmented toggle; the KO case's two As-is/To-be panels keep their static pair with a Noto Sans KR note describing the site's toggle.

Header controls are pills in the case picker's language (ink 8% fill, blur, outline ring on hover/active): Menu is a 40px pill with the two-line icon and a visible "Menu" / "Close" label (ui.menu / ui.close), the theme toggle a 40px round pill, and EN | KO sits beside it as a small segmented pill (components/lang-toggle.tsx: links to the same page in the other language, current marked with the ring). In the compact floating bar they drop their fills; the bar is 560px wide to fit. On a project opener (home selected stage and /work pages, not compact) the centered wordmark is hidden so the opener starts right under the controls.

Project opener (Devsign/Gemini): starts higher (home clamp(80px, 8svh, 104px), direct pages 40px under the header), with a soft project-coloured wash behind the media (two blurred radial gradients, --dh-glow / --dh-glow-2: Devsign #5b3fd6/#a594ff, Gemini #4285f4/#a78bfa; 24–30% dark, 20–24% light). The media is a dark 20px-rounded window with a deep shadow; Devsign's loop sits under a browser chrome bar (three dots, empty address pill), Gemini keeps the phone on its blue/lavender surface. Media width is min(100%, (100svh - 600px) * 1440/759) so the facts row stays on the first screen at 1440x900.

Devsign As-is / To-be (DevsignCompare) is compared by scrolling, not pressed: one frame on desktop where the To-be screen wipes in from the right over As-is as the block rises through the viewport (CSS view timeline named --dv-wipe on the figure, range cover 20%–62%; a 2px accent line leads the wipe; tags AS-IS / TO-BE; the caption crossfades from the As-is text to the To-be text). Without scroll timelines, on phones or with reduced motion the two screens sit side by side with their tags and both captions. The segmented toggle and the earlier drag slider are gone; labels.compare reads "Scroll to compare…".

Opening a case from a pill: the grown device now holds full screen for 700ms before the page fades in and it shrinks into the opener (Metalab); inside the grown Devsign window the loop runs with a -2.1s animation delay so the review panel is sliding in while the screen holds.

Figma (same day, second pass): the five 1920 "Main · v2" frames carry the new header — Menu pill (icon + "Menu", 40px, ink 8% fill, blur), a "Right controls" group with the EN | KO segmented pill (EN ringed) and a round theme pill with a crescent — in each frame's own ink (the light-theme frame uses dark ink). The Devsign case Hero (EN 312:20, KO 270:3) hides the wordmark in its nav, tightens the gap to 56px, has a "Glow · project colour" layer (two blurred purple/lavender ellipses spilling past the window) behind the 20px-rounded window with a "Browser chrome" bar (three dots, address pill, divider). The compare component set is now Scroll=Mid / Scroll=End: toggle hidden, the Reveal frame at 55% / 12% with a 2px purple "Wipe line", hint and description describe the scroll wipe. The v2 draft note mentions the header pills and the hidden wordmark on openers.

Header bar is 64px again (py-[12px] around the 40px pills; Tailwind's py-3 was 24px here), so the landing stage's -64px margin leaves no strip above it and the page has no scroll (verified scrollHeight = viewport at 1024–1920 wide). EN | KO is a knob toggle: two 34px round faces in the pill and a filled round knob (ink 14%) that slides behind the current language, no rings. The Menu panel no longer lists the language link.

Footer (SiteFooter, end of cases and the playground) after metalab.com: a big display question (ui.footerHeadline, clamp 32–64px) on the left, large ways onward on the right (Say hello → mailto, More about me → /about, LinkedIn ↗) as rows with hairlines, then a quiet bottom row: © year name · Work / About / Email · Back to top ↑ (smooth, instant with reduced motion). Replaces the centered "More about how I work" pills.

Devsign As-is / To-be (v3): one dark browser window (same chrome as the opener), the To-be screen wiping in from the right as the block rises (view timeline --dv-wipe, cover 15%–60%), a white hairline edge with AS-IS / TO-BE chips riding it, and both captions always present below (hairline tops, To-be in the accent) trading emphasis (1 → 0.4 / 0.4 → 1). Static form (phones, reduced motion, no scroll timelines): the two screens side by side inside the window with tags.

Live Devsign prototype: components/devsign-live.tsx frames https://minyeon-kim.github.io/devsign/ (repo minyeon-kim/devsign, Vite + React, GitHub Pages) laid out at 1440 wide and scaled to its box (ResizeObserver sets --live-scale / --live-h), with the image loop underneath until the frame has loaded; not interactive, the opener's address pill links to it. Used in the home Devsign window (mounted on first hover of the pill, so it is loading by the click), the opener media, and the case transition: for Devsign the zoom layer holds the loop copy as a poster plus a fresh iframe at the real viewport size that scales up from the device box to 1:1 (so the prototype shows its true responsive layout at any browser size) and back down into the opener media.

Light-mode chrome loop: wider, softer streaks and a faint seam (the narrow dark seam read as a crease). Responsive pass: landing statement clamp(44px, min(6.5vw, 10.5svh), 112px); opener padding clamp(56px, 8svh, 104px) (direct pages clamp(16px, 4svh, 40px) under the header), title clamp(32px, min(4.375vw, 6.5svh), 84px), media height clamp(180px, 100svh − 620px, 720px) (direct: 172 / −690), facts margin clamp(24px, 4svh, 56px), smaller facts/brand under 760px tall. Verified the facts row stays on the first screen at 1024×768, 1280×720, 1440×900, 1680×1050 and 1920×1080 (home and direct).

Footer is a dark full-bleed band (light: #0e1111, dark: surface; ink #e8ecea, muted #8e9895, hairlines white 14%), aligned to the Devsign margins on dv pages, with a larger headline (clamp 40–88px); the Devsign side nav marks the current stage in the case colour with a 6px dot and keeps a real 204px box (the first section climbs back over it) so sticky positioning stops it at the end of the case instead of hanging beside Next project.

Devsign zoom, prepared: the first hover of the Devsign pill builds a hidden full-screen .project-zoom[data-prepared] with the live prototype (prepareDevsignZoom) and hands it to revealNextProject on click, so the zoom shows the already-loaded prototype from the first frame — no loop poster, no reload flicker; it is removed with the stage if unused. The prototype's language follows the site: DevsignLive and the prepared layer write {version:1, language} to localStorage "devsign:preferences:v1" (the key the devsign repo's src/i18n/language.js reads, with a storage listener), which works on GitHub Pages where both sites share the origin; on localhost the prototype keeps its own default (Korean).

Opener top: the brand row now sits about 16px under the header (home padding-top clamp(48px, 5.5svh, 80px) including the header strip; direct pages clamp(8px, 2svh, 16px) under the 64px header); the media gained the saved height (100svh − 600 / − 664).

Hovered case media on the landing is a flat card at the top right (top 13%, right at the page inset, min(36vw, 560px) wide, 16:10, 20px radius, hairline, deep shadow; rises 16px and fades in), after metalab.com's project photo — no 3D pose. Devsign: the browser chrome bar over the live prototype (or the loop before it loads); Gemini: the upright phone (128% of the card's height, cropped at the bottom) on its blue/lavender surface, with the scroll turn and side strip off. The zoom grows this card. Phones: the card spans the inset, 26vh from the bottom. Opener top padding is clamp(72px, 8svh, 96px) on home (the brand row clears the 64px header strip) and clamp(8px, 2svh, 16px) under the header on direct pages.

Figma: the v2 hover frames carry the flat cards (Devsign browser window with the workspace image, Gemini phone on the blue surface, both 36% wide 16:10 at the top right) and the knob EN | KO; both compare sets are Scroll=Mid / Scroll=End in the dark browser window with chips on the wipe edge and two captions (instance texts from the case copy); the case footers are the dark band; the sticky nav marks Overview in purple with a dot; the hero chrome carries the prototype address; a note beside the Devsign frame explains the live prototype frame.

Landing hover is a world switch (metalab.com's Uber / Robinhood / Midjourney states): hovering a case pill fades the chrome loop out and fades in that case's full-bleed surface (.home-world: Devsign = #1c1c1c with the 24px dot grid and a purple glow; Gemini = #0c0f16 with blue and lavender glows); the stage and the header read light-on-dark whatever the theme ([data-world] overrides --ink/--muted). The case's media sits in a large card at the top right (min(44vw, 680px), 16:10, 20px radius); its role line sits top centre, its name large at 26% from the left and 60% down (clamp 56–128px, --font-display), its problem line bottom right (30ch). The default statement and paragraph fade out meanwhile; About me keeps the plain stage and the in-place name/positioning swap. Below lg the world copy is hidden and the in-place swap is used.

Figma v2 hover frames mirror the world switch: a "World ·" surface behind the backdrop (Devsign dot-grid canvas with a 48px dot stand-in and purple glow, Gemini blue night), the loop stand-in hidden, the media card at 44% top right, the name at 128px left of centre, the role line top centre, the problem bottom right; the draft note describes it.

Each landing world has its own composition (metalab.com lays every project out differently): Devsign like the Uber state (card top right 44%, role top centre, name at 26%/60%, problem bottom right); Gemini like Robinhood (portrait 4:5 card min(34vw, 520px) cropped past the bottom-right edge with the upright phone, name at 18%/44% at clamp 48–104px, the role line under it, the problem top centre-right); About like Midjourney (a facts card top right — "About", the three principle titles from content/about.mdx numbered, "More about me →" — the About headline top left as the role line, "Minyeon Kim" bottom centre, the first bio sentence bottom right) on a charcoal surface (#121415 with pearl and violet glows). HomePage passes about = { headline, bio[0], principle titles } through ProjectStage to HomeIntro.

World switches are sequenced (metalab.com): the stage surface and the loop crossfade over 700ms, the card of the new world arrives 120ms later (fade 600ms, 28px rise 800ms, scale 1.02 → 1 over 1s) while the old card leaves in 320ms, and the copy changes in two beats — the current role / name / paragraph leave in 220ms (up 16px) before the next world's lines arrive staggered (0 / 80 / 180ms; 500ms fade, 650ms rise). In code `displayed` trails `world` by 220ms (a timer) and the lines are hidden while the two differ; leaving the pills fades everything out and the default copy returns over 400ms.

Prototype language and smoothness: DevsignLive and the prepared zoom layer load https://minyeon-kim.github.io/devsign/?lang=en|ko (devsignUrl(locale)); the devsign repo's src/i18n/language.js honours ?lang for that load (change prepared in a local clone, to be pushed by Minyeon — the deploy is hers), and the localStorage key still switches loaded frames live on the shared origin. Only one live frame runs on the landing: the small Devsign card shows the image loop, the hidden full-screen frame (prepared on hover) is the live one; the chrome loop stops drawing 800ms after a world covers it (HeroObject `active`), and the scaling frame has will-change: transform.

Case pill numbers (01, 02) are set in Geist Medium 13px, tabular figures, muted — the same face as the label, not Geist Mono.  The devsign repo honours ?lang=en|ko (commit 1fc6ef5, deployed): verified document lang en/ko on minyeon-kim.github.io/devsign.

About world, revised: no card (a project photo there read as a project). The site's own chrome loop stays visible over a near-black surface (#0b0d0e) as the image for the person; the About headline sits top left with the three principle titles listed under it (.home-world-list, numbered in Geist, staggered 140ms), "Minyeon Kim" bottom centre, the first bio sentence bottom right. A portrait can join later.

Case pills, hovered or active, are fully see-through: background transparent and backdrop-filter none (the frosted blur read as a fill), only the 1px ink-70% ring remains.

Merged from the parallel session (PR #1, 2f33239): the case pills are the menu's page-link pill (44px, hairline var(--line) border, 88% --bg surface); the Devsign home card lost its chrome bar; the About world drops the principles list and sets the About headline as the statement with "End-to-end" set apart (Emphasis). On top of that, hovered/active pills are see-through: background transparent, no blur, border in ink 70%, no inset ring.

Dark theme case sheet: the Devsign body and the Gemini skin use the surface tone (#151918, --dv-bg) instead of the page near-black, matching the opener, and the whole .case-study (body, Next project) sits on that surface; bands and tints mix from the surface; the footer band goes darker (#0a0c0c) for contrast. Light theme unchanged.

Devsign As-is / To-be (v4, replaces the scroll wipe): the two iteration layouts differ, so a wipe mixed unrelated halves. DevsignCompare is now an As-is | To-be toggle (To-be selected first, accent knob) above the same dark browser window; the screens crossfade (240ms), numbered boxes (study.testing.iterationN.changes, [x, y, w, h] in % of the 960×540 screenshot; a = As-is, b = To-be) fade in after it, and a numbered list below gives each change as title + As-is line + To-be line (the current side's line in ink). Hovering/focusing a list item emphasises its box. Figma: "Compare · Iteration 1/2" sets are View=Side by side (two 700px shots + callouts, for the static file) and View=Toggle, State=As-is/To-be; the old Scroll=Mid/End sets are on the Archive page.

Landing worlds, overlap fix: Devsign's role line sits just above the name (left 26%, bottom 40% + 16px), no longer under the card; Gemini's name and role start at max(18%, inset + 300px) so they clear the pill column, the name stops 48px short of the card (min(68vw, 102vw − 520px)) at clamp(44px, 5.4vw, 104px), and its role sits above it. Checked at 1280/1440/1920 with no box overlaps. Devsign scores: the donut rings fill (stroke-dasharray from 0, 1.4s) when their row is revealed. Side stage nav (≥75rem): no dot, active item is the accent colour only; --dv-pad is at least 224px there so the list keeps ~100px from the column.

Devsign As-is / To-be (v5, replaces the toggle): DevsignCompare is static now. Two small whole-screen thumbnails (As-is / To-be with their summary lines) on top, then one row per change: numbered title, then a close-up of that area before → after. Each close-up is the change box from study.testing.iterationN.changes plus 28px context, widened to 16:10 (at least 340px of the 960 source wide) and clamped inside the image; the box itself is outlined (white before, accent after) with the rest dimmed, an AS-IS / TO-BE tag top left and one line under it. Phones stack the pair with a down arrow.

Devsign As-is / To-be (v6): screenshots recaptured from the prototype repo (minyeon-kim/devsign) at 1440×810, DPR 2 (2880×1620 webp): iteration 1 As-is = commit 2842823^ (cc-11 conflict page, opened from the request toast), iteration 1 To-be = 02700c4^ (?change=CON-014), iteration 2 As-is = 2842823^ workspace (four panels), iteration 2 To-be = HEAD workspace (toasts closed, board fitted). Change boxes are in % of 1440×810. Layout: the two whole screens side by side, then three key points per iteration, one row each, alternating sides: number, title (24–32px), As-is / To-be lines; the To-be close-up large with the As-is close-up small on its outer lower corner. Main features: card kickers are number · role only (the heading already says see, merge, decide, record). [v7: the rows became three cards in one row under the two whole screens: To-be close-up on a light padded tile with the change outlined (no As-is inset, no dim, no tags), numbered title, the As-is line struck through and the To-be line after an arrow. Close-up class is .dv-zoom — .dv-crop belongs to the Figure crops.]

Footer on Devsign-skinned cases: --dv-pad is also defined on .case-study:has(.dv) (the Devsign article has no data-skin; its footer sits outside .dv and had no --dv-pad, so its padding fell to 0), and the Gemini (data-skin="dv") footer bleeds with margin-inline −dv-pad. Gemini Deliver: the As-is/To-be CaseCompare was folded into the prototype steps (CasePrototype step `before`): each step card is the screen on a light tile, a numbered title, the old way struck through and the new way after an arrow, like the Devsign key-change cards. Home → case zoom: the case renders only after the device has filled the screen (render was a long task during the grow); the layer stays viewport-sized and animates a clip-path box plus a transform on .project-zoom-stage (cover-fit to the box), no top/left/width/height animation; the hold before settling is 600ms from the end of the grow.

Devsign Discover, community posts: each of the three problems carries a close-up of the research board behind it (boards-decisions / boards-roles / boards-checks.webp, cropped from the 4096px board export in Figma: lavender "scattered info", blue "roles blur", pink "AI misses nuance"), in a third column of the list; the close-ups open full size. The full research-boards.webp (now 4096×1310) opens from "See all 7 boards ↗" under the list; the half-width strip is gone.

Devsign case (later): content column max 1200px (was 1440; --dv-max and every --dv-pad / --dh-pad formula use 1200), section padding 120/160 (band 160, phones 72/96), questions 96px apart. Community posts: no per-problem list or click-through close-ups — the three problem names as chips in one row, then the full research board image (4096px) across the column.

Reading measures (Devsign-skinned cases): --dv-measure 740px for body copy (.dv-lead/.dv-body, section copy, review, limits, PSI/TL;DR text columns, plain paragraphs in .case-content), --dv-measure-wide 900px for headline-size lines (.dv-headline, .dv-answer, .dv-summary, .dv-core-text, .dv-hmw-question, case section titles). The 1200 column is for images, cards and tables. The column caps use :where(...) so these measures win on direct children.

## Case zoom: case content mounts after the transition
- `CasePanels` (components/home/case-panels.tsx) no longer mounts the picked case during the intro → case zoom. While `data-project-navigation` is on `<html>`, it renders nothing; once the flag is removed it mounts in an idle callback. Mounting the full case mid-zoom was a 120–320ms long task that froze the hold/settle frames (Devsign: layout alone ~160ms). Now ~58ms (opener only).

## Case zoom: transform-only grow and settle
- The zoom layer no longer animates `clip-path` (repainted on the main thread every frame → stutter while the click-time snapshot / case render ran). `morph()` in lib/project-transition.ts moves the viewport-sized layer with `translate + scale(sx, sy)` and counter-scales `.project-zoom-stage` so content covers the box; both sampled as 40 keyframes along cubic-bezier(0.2,0.8,0.2,1) with linear easing. Corner radius is a separate (main-thread) animation so the transforms stay on the compositor. `.project-zoom` has `transform-origin: 0 0`.
- Local builds: Turbopack's `.next` cache once served stale CSS; `rm -rf .next` if a CSS change doesn't show up.

## Case zoom: continuous with the hover preview
- The Devsign zoom no longer uses a prepared live-prototype iframe (it opened on the prototype's loading screen). `prepareDevsignZoom` and the `live`/`prepared` zoom options are gone. The layer is a copy of the hovered device; `syncAnimations(source, copy)` carries each CSS loop over at the same `currentTime`, and at settle the opener's own loop is synced to the layer's.
- The copy is appended straight into `.project-zoom-stage` (moving nodes later restarts CSS animations).
- The copy's media (`.devsign-loop, .gemini-phone`) starts exactly on the card's media rect via `translate`/`scale` and eases to none over the grow.

## Header and home picker share one edge and one pill
- `.site-header-bar` / `.site-menu-bar` no longer override the inset to 24px/12px; they use `--project-text-inset` like the page copy, so Menu, the home case picker and the bottom-left note line up (48px at 1920, 36 at 1440, 16 mobile). Compact header keeps 24px.
- `.home-pick` now matches `.header-menu-trigger`: 40px tall, 0 16px padding, no border, ink 8% tint, 15px/500; hover/active = transparent with 1px inset ink 70%.

## Edge inset and one pill height
- `--edge-inset` (24px, 16 mobile): `.site-header-bar`/`.site-menu-bar` padding, and `.intro-stage.home-stage` sets `--project-text-inset: var(--edge-inset)` so picker, note, headline and worlds sit at the same edge as the Menu. Case pages keep `--project-text-inset` for their copy.
- All header controls and home picks are 36px tall (Menu 0 14px, theme 36×36, lang toggle 36 with 30px knob/options, `.home-pick` 0 14px).

## Hero object: particle-love dust (GPU simulation) + Lusion-style cards
- components/home/hero-object.tsx is a WebGL 2 particle simulation (256² = 65,536 points; positions and velocities in RGBA32F textures, ping-ponged; needs EXT_color_buffer_float, else nothing is drawn and the CSS ambient shows). Each frame: velocity pass (pull toward a loose home `gather` 0.8, ABC swirl flow and a shifting "valley" field ×`stir` 0.65, cursor sweep/swirl from the mouse delta, damping), position pass, then additive points (light theme: over-blending, darker ink).
- States (OBJECT_STATES): default = a loop, Gemini (blue) = the Gemini constellation (Castor/Pollux and the twins' lines), Devsign (purple) = two groups joined by streams with a bolt between, About (teal) = a hexagonal lattice. Homes are loose clouds with a wide dust halo, so the form is only hinted (the user rejected crisp shapes, blobs, rings, beams, coaster, crystals).
- Cards: plate backgrounds per case (Devsign violet gradient with the window set in at 9% 7% and cropped at the bottom; Gemini sky-to-indigo plate with the phone). A caption block (`.home-device-caption`, ≥64rem) overlaps a corner: `meta.caption` (new CaseMeta field, EN/KO in the case MDX) and role · timeline with ↘.

## Pills after metalab.com (from the user's screenshot)
- Header: Menu is the word alone (`.header-menu-icon` hidden), 24px tall, 12px/500, 0 14px, ink 16% frosted; theme toggle 24px round (12px icon); lang toggle 24px with 20px knob/options (9px mono).
- Home case list: 30px pills, 0 16px, 15px/400, ink 16% frosted, 8px gap, no index numbers (`.home-pick-index` hidden); hover/active stays the 1px outline ring.
- Hero object: one softbox streak only (the second crossed it at the tube's edge and read as the chrome folding over itself); streak width 0.12; backdrop tint ×0.4.
- Sizes bumped a step (user: "a little bigger"): header controls 28px (13px text; lang knob/options 24px, 10px mono; theme icon 13px); list pills 34px.
- The opened Menu's links (`.header-menu-panel a`) use the same list pill as the home case list: 34px, 0 16px, 15px/400, frosted grey, 1px ring on hover / current page. Panel offset -2px so the pills line up with the Menu pill.

## Case stage nav: quiet, only where the margin has room
- The vertical stage list in the left margin now needs ≥100rem (1600px); below that the sticky top bar is used. In the margin it is 12px/500 muted (80%), the current stage in full ink at 600, 10px gap, box height 172px (first section climbs back -172px).
- Header bar is 64px tall again (py 18px around the 28px controls): the home stage and openers pull up by exactly 64px (`md:-mt-[64px]`), and a shorter header left a strip at the bottom of the landing.
- Dust spread wider (homes ×1.6, halo up to 4.2, x stretched ×1.6), cursor reach σ² 0.16. Three slowly drifting light pools (`pools()`) modulate point alpha/size, plus a cursor glow and per-point twinkle; a full-screen glow pass paints the pools faintly behind (dark only). Point sizes vary: fine dust, grains, and rare big soft out-of-focus motes (faint, blurred).
- Points are now even, crisp sparkles (no varied grain sizes or big soft motes — read as "virus-like"): size 1.6–2.8 by depth; each breathes, and ~25% flare briefly (pow(sin,16)) into a white core with a thin four-point glint (point grows +12px while flaring).
- No more growing cross-glint flares (big particles read badly): all points stay 1.4–2.4px; flaring only brightens. Brightness comes from dense gathering (valley strength 0.6).
- Glow pass adds a wide diagonal band of violet-navy light (lower left → upper right, drifting), tinted by the state colours (after a flowty-style hero gradient). Dark theme only.
- Hover gathers the form: uniform `focus` (eased τ0.6s, 1 when a case/About is hovered) tightens 2/3 of the dust (loose ×0.22) and triples gather; the widest third stays as haze. Dust spreads lower (y ×1.35). Cursor sweep stronger.
- Burst: a quick flick (clip-space speed > 2.2/s, ≤ once per 0.7s) sets off an expanding ring (1.4 units/s) that throws dust outward like a firework. It dispatches `window` event `hero-burst` {x, y, pxPerSecond, power}; ScrambleHeadline re-scrambles each letter when the ring reaches it (delay = distance / pxPerSecond, reach 260–480px).
- The extra corner colour lights were tried and reverted (user preferred the single diagonal band).
- Glass pills (Menu, lang toggle, theme, home picks, menu links): ink 9% fill, blur(18px) saturate(1.7), 1px ink-12% inner ring and a 1px top highlight (Apple/metalab-like see-through).
- Pills back to metalab: no rim or highlight lines, ink 15% fill, blur(24px) saturate(1.2).
- Sparkle restored but small: points 1.6–2.8px, ~25% flare (+5px) with a crisp core and a thin four-point glint.
- Pills matched to the metalab screenshot: fill light-dark(rgb(14 17 17/.08), rgb(255 255 255/.14)) + blur(30px), no rim, no saturate (the backdrop colour shows through); home picks 30px tall, 0 16px, 15px/400, 8px gap.
- The margin stage list sits at `--edge-inset` (24px), the same edge as the header's Menu pill.

## Gemini case in the Devsign layout (from Figma 657:254 / 733:3)
- Gemini EN/KO now render through `DevsignCase` with a `study` object in content/(ko/)cases/gemini-privacy.mdx; copy is verbatim from the Figma frames. The old CaseSection body is gone; CaseBody no longer adds `data-skin="dv"` or a separate GEMINI_NAV.
- DevsignCase variants chosen by data shape: q1 `boards` → chips + board, else `Groups` rows (papers); q2 `groups` → rows instead of the tool matrix; interview/usability `photo` optional; `develop.blocks` → generic `DevelopBlock`s (text + image | images pair | 4-screen row `.dv-screens` | features), `rule` starts a subsection; `deliver.changes` → 4 change cards (`.dv-points.dv-changes`, phone screens) instead of CaseGallery; iterations optional; persona avatar optional (`.dv-avatar-blank`). Images with `fit` sit whole inside a box of that aspect (`.dv-fit`). Feature grids use `--n` columns.
- Devsign copy synced to Figma: feature kickers "01 See/02 Merge/03 Decide/04 Record" with short bodies, stat texts, group details, review bodies, next-step title (EN + KO).
- Figma: case stage lists moved to 24px; Main pills set to white 14% + background blur 30, case pills 30px.
- Devsign prioritization matrix is 38.2% of its column, so it is as tall as the value proposition canvas below and left-aligned with it.
- Case hero: background fades from #f5f5f5 (45%) to the white page below (no edge); the colour wash behind the media is lighter (13%/11% light, 20%/16% dark), blurred 40px, masked out toward the bottom.
- Home backdrop: the Gemini state forms the Gemini sparkle (four-point star with concave sides, dense edge + lighter fill) instead of a constellation. Cursor sweep and burst are softer: sweep 1.0/4.0/1.2, burst push 2.6+4j, burst triggers above speed 2.8 with power ≤1.2.
- Home backdrop dust is finer, like the Milky Way rather than beads: 320² (102k) points, dust 1.0–1.4px with a soft core, ~3.5% stars at 1.5–2.1px, and only stars flare (fainter, shorter glint). Light theme ink keeps more of its colour (c·0.7) at alpha ×1.1.
- Light theme dust is darker: ink c·0.55, alpha ×1.6 (dark theme unchanged).
- Figma Main frames: the chrome-loop stand-ins, the vignette, the Gemini 'World · Gemini night' fill and the phone Ellipse are hidden. Each Backdrop now holds a 'Dust · WebGL stand-in' image: a live capture of the current dust (default, Devsign, Gemini sparkle, About, light, phone).
- Home backdrop: default dust forms one Milky Way band rising to the right (was a loop). Devsign form moved up-left (+(-0.6,0.3)) so the bolt sits above the title, clear of the project window; the bolt is 1.3× larger, holds 28% of the dust and is drawn tighter. Figma: hidden old backdrop layers deleted.
- Home: the Gemini sparkle takes the logo's colours by angle (blue right, coral up, yellow left, green down), blue at its heart, faded in with a lerped `spectrum` uniform. Bottom fade over the backdrop lightened (55% over the lower 30%, was 85% over 45%) so the dust reaches the bottom.
- Home backdrop forms: default = slanted two-arm spiral galaxy, slowly turning (loose ×0.5 so it reads); Devsign bolt = filled bolt (two thick slanted bars + crossbar, 34% of the dust); About = shield with a keyhole (dense outline + keyhole, light fill), replacing the unreadable hex lattice.
- Home hover transitions, Metalab-like and slower (`--ease-out-soft: cubic-bezier(0.16,1,0.3,1)`): the project card wipes up from below (clip-path inset 100%→0, 1.4s) while its contents settle from scale 1.12 (1.8s); role/name/problem fade up from blur(6px), staggered 160/260/420ms over ~1.2s; the caption follows at 700ms. Exits are quick (≈0.4–0.5s).
- Home pills: white 16% + blur(30px) saturate(1.8); the other pills no longer dim while one is active.
- Dark theme background is #050506 (was #0c0e0e), also for `--media-bg`.
- Light theme home backdrop: dust alpha ×2.3 and a faint tinted haze along the glow band. A hovered project's world is always dark, so the dust switches to its dark (glowing) rendering on hover even in the light theme; the stage background fades over 700ms.
- Devsign form is now the Devsign logo bolt (9-point polygon `BOLT`, filled by rejection sampling + dense outline), violet with cyan towards the lower right and a soft white sheen (`bolt` uniform). About form is a fingerprint (broken ridges around a core), replacing the shield.
- Devsign bolt is loose like the Gemini sparkle (outline loose ×0.5, body ×0.75), a hint rather than a crisp shape.
- Case pages (dark): background is the page `--bg` (#050506) instead of `--surface`, hero gradient included.
- Case images reveal Metalab-like: each `.dv-figure` image (img/.dv-crop/.dv-fit) and `.dv-point-media` arrives at scale 1.14 inside a clip-path window inset 9%/7%, then settles to scale 1 / full window (1.6s/1.4s, ease-out-soft) when its `.reveal` gets `data-shown`.
- About form: three stars (research, design, engineering) joined by faint lines, loose like the Gemini sparkle; replaces the fingerprint.
- Dark subpages unified on `--bg` (#050506): footer (`--ft-bg`), `--dv-band` / `--dv-tint` / `--dv-tint-core` now mix over `--bg` instead of `--surface`.
- Home hover keeps the page theme: the `[data-world]` dark override on the stage and header is gone, so in light mode a hovered project stays on the light page; the dust keeps its light rendering. Light-mode dust ink is saturated (pow(c, 1.7)·0.95) instead of greyed (c·0.55).
- Devsign bolt is slimmer: x scaled ×0.75.
- Default galaxy looser (arm spread ×1.8, loose ×0.85). Light theme dust: points ×1.4 larger and alpha ×2.8 so the pale page doesn't feel empty.
- About form: a rolling landscape of dots (regular grid from the particle's own uv, slow waves, ridges at the sides) with faint streams of data falling behind it, after a reference the owner liked; carries its own light (vLight ≥ 0.85). Replaces the constellation/orbits.
- Theme switch: the glow layer flips its theme at once (`step(0.5, light)`); half-way values left low-alpha pixels under bright colour that composited as hard-edged blobs during a light→dark switch.
- About data streams are loose (×0.6 plus x jitter) instead of crisp columns.
- Devsign card opens horizontally from its centre (clip-path inset 0 50% → 0, no rise); Gemini keeps the wipe up. Cards and captions sit above the backdrop vignette (z-index 1), so the light theme's pale edge no longer washes over them.
- The landing galaxy is the richest state (`galaxy` uniform): arms tinted blue/violet/teal with touches of pink round a warm white core, more stars and flares, ×1.7 brighter in the dark, loose ×0.75.
- Landing galaxy reads as a spiral: logarithmic two-arm spiral (tilt 0.62, core 16%), arm jitter small, and `focus` rests at 0.85 on the landing (1 on a case) so it gathers like a case's form instead of the full loose haze. Light theme tints are deepened (×0.62) so the colours read on the pale page.
- Devsign card opens from the right edge towards the left (clip-path inset left 100% → 0).
- Figma Main synced (2026-10-30): all six backdrops re-captured (spiral galaxy, Gemini sparkle, Devsign bolt, About dot landscape, light, phone); hover copy moved to the site layout (role above the name for Devsign/Gemini, About headline 44px at top left, problem/bio 303px wide bottom right); About principles removed (not on the site); pills white 16%, labels undimmed.
- Phone landing (<64rem): the focused case card sits under the pills instead of floating 26vh from the bottom over the pills and the note. The grid reserves the card's height + 32px at the bottom (--phone-card-w = min(100vw - 2 inset, 560px), 16:10) and the card (both cases, Gemini no longer keeps its desktop portrait box) is bottom: 40px. Figma Main has matching 390 frames "phone · focus 02 Devsign" / "phone · focus 01 Gemini privacy revamp"; the 1920 hover frames carry the plate cards and corner captions.
- Figma Devsign case frames replaced (2026-10-30): the main frames are now 789:96 (EN, "Devsign · Case study · 1920") and 789:2442 (KO) — the findings-first version: method name as the small label and the finding/decision as the title, Develop without the Prioritization matrix and DVF (Value proposition canvas → Sketching → 4 core features), Main features as 2x2 cards with product screens, the site's light header (Menu / EN|KO / theme, wordmark hidden), no window shadow or colour glow, Role facts as one paragraph. The old frames 312:19 / 270:2 are on the Archive page. The site body does not follow this version yet.
- Figma Devsign case (789:96 / 789:2442), features told once per role: Overview = four compact cards (promise), Develop = problem → feature rows with their VPC direction (why), Deliver = the screens (how) with History added as Feature 04 (its copy drafted from the History screen, to be checked) and the panels 588px wide with a step smaller type; order everywhere 01 Live Workspace → 02 Merge Studio → 03 Conflict Points → 04 History. Testing iterations carry a feature tag, mapped from the devsign repo history: Iteration 1 (2842823^ → 02700c4^, the change-detail/decision screen) = 03 Conflict Points; Iteration 2 (workspace layout, AI Chat folded) = 01 Live Workspace.
- Dust grain: the canvas renders at DPR up to 2 and point sizes scale by `dpr`, so the finest dust is about one device pixel on retina (sub-pixel points fade instead of shrinking). 448² = 200,704 points on desktop, 256² on phones/coarse pointers. Grains (CSS px): 58% fine 0.55–0.7, coarser dust 0.8–1.0, ~3–4.5% stars 1.2–1.6 (×0.7 in light, smaller flares there). Light theme points ×1.1 (was ×1.4), alpha ×3.2.
- Figma Devsign Deliver scroll story (section "Deliver · scroll story (draft, 2026-10-30)" on the Devsign page): EN and KO rows of four states (one feature active each): a sticky 720×450 screen with numbered pins and boxes for the active feature's three points (active point purple 2px + 12% fill, others white dashed), a 4-step progress bar, and the feature list at the right (active item expanded: kicker, name, description, points ↔ pins, "Open in the prototype ↗"). Live Workspace uses the iteration 2 To-be workspace capture so its third pin (requests first, tabs) points at the top tab row; KO History uses the Korean capture cropped from the top. The main case frames' Deliver shows state 01 (section height ~1,085px); the 2×2 grid stays hidden as the static fallback for phones / reduced motion.
- Shine: a bloom pass draws one point in twelve again as a 12 CSS-px soft halo of its own colour (alpha 6% dark / 9% light) before the dust, so dense parts glow. Light theme ink is vivid rather than darkened: saturation ×1.8, darkened by mix(0.9, 0.55, luminance); project tints are no longer dimmed in light (the Gemini logo colours were turning brown).
- Figma Devsign Testing iteration story (section "Testing · iteration story (draft, 2026-10-30)"): same pattern as the Deliver scroll story. Per iteration one sticky 16:9 screen with the three change areas boxed (active purple, others white dashed), an As-is | To-be switch on the screen (To-be first; pressing it crossfades to As-is and moves the boxes to the As-is coordinates, the caption under the screen follows), a 3-step progress bar, and the changes list at the right (active item: old way struck through, → new way). EN/KO × 2 iterations × To-be / As-is frames + notes. In the main frames the two whole screens + three change cards are hidden (static fallback) and the To-be stage sits in their place (Testing ~3,630 → ~2,910px). How might we: the duplicate 24px 'How might we' title is hidden, the question is the heading under the 'Design challenge' label.
- Figma Devsign Testing media share one grid (EN/KO): every row is 720 media | 64 | 416 text — UT photo 720×486 with the four score donuts stacked in the 416 column, co-design capture 720×472 with "What we agreed" beside it, iteration screens 720×405. Images keep their own aspect ratio. Removed leftovers beside the main frame: the old Compare · Iteration 1/2 component sets (instances detached first, in the hidden fallback and the archived frame) and the old keyword-colour feedback note; "Note · live prototype" stays.
- Bloom halos are light-theme only (on a real GPU in dark they showed as solid discs); dark is back to the plain dust. Light ink is fluorescent: saturation ×2.4, normalised so the strongest channel is full, ×0.95–0.8; halos 11%.
- Figma Devsign v3 draft (819:2, "Devsign · Case study · 1920 · v3 draft (less document)", beside the EN main frame, EN only): affinity board cropped to the Shared context column with an outline and a "48 cards, the biggest theme" chip; IA cropped to the Workspace branch; the user-flow image moved into a "Process artifacts" row of five full-board thumbnails at the end of Develop; Discover's 29% / 66% in a grey panel with purple numbers; the Takeaway headline as a dark full-bleed band (48px) before the section; each Key problem card ends with "Became → 0X feature" and a small screen, so the Develop problem→feature table is hidden in v3. Length ~20,990px (main 20,784).
- Bloom is a real post-process now (replaces the per-point halos): glow + dust render to a full-size RGBA16F scene; bright parts (dark: luminance threshold; light: dense ink in its own colour) go to a quarter-size target, are blurred twice each way (9-tap Gaussian) and laid back over (strength 1.1 dark / 0.35 light). The composite writes alpha ≥ max(rgb), since premultiplied colour above alpha is what browsers drew as hard discs.

Figma (2026-10-30): the v3 draft (819:2) was rejected — moved to the Archive page section 803:1669; the main EN/KO frames (789:96 / 789:2442) stay the reference. Testing in both: the "We tested once, then iterated twice." opener is a 36px Regular section headline (was 24px, same as the subheadings); the usability-test photo and the four score rings are top-aligned at the same 480px height (720 | 64 | 416), rings 96px with 24px to their text, spread evenly down the column. KO body keeps words whole (word joiners).
Figma usability-test block, second pass (EN/KO): two columns instead of text-over-row — left 720 (title, body, photo), right 416 the four scores filling the whole height from the title to the photo bottom, as equal rows divided by hairlines (#DADFDC). This removes the empty top-right corner. The old "UT · photo + results" row is hidden and still holds the hidden alt grid.
- Dark theme back to its earlier look: no bloom (strength 0), the earlier grain (1.0–1.4px dust, stars 1.5–2.1px at the earlier rate, no extra-fine grains) and every other point hidden on desktop so the count matches the earlier ~100k. Light keeps the fine grain, fluorescent ink and bloom 0.35.
Figma usability-test block, third pass (EN/KO, replaces the two-column version): title and body back on top, then the 720px photo | 64 | the four scores as a 2x2 grid in the 416 column (two 240px rows split by a hairline; each cell ring 96 → 16 → label → 4 → note, top-aligned). Score labels keep words whole (nbsp in EN, word joiners in KO).
Usability-test scores, fine pass: the number and unit inside each ring sit in a 96×96 centred auto-layout ("value"), so they are centred both ways; the two rows hug their content and the score column is space-between around a 1px divider, so the top row starts at the photo top, the bottom row ends at the photo bottom, and the gaps above and below the divider are equal. Left alignment stays (the whole case reads from one left edge; cells align ring and text to the cell's left).
- Dark theme draws straight to the page again (no offscreen/composite), so its glow is added light as before and the background stays near-black; only light goes through the bloom targets. Points: 512² = 262,144 on desktop, 320² on phones, all drawn in both themes.
Synthesis "Where each stage breaks" (EN 789:923 / KO 789:3269) sits on the centre line: stage label 120 | 16 | With AI card 432 (ends at 568) | arrow 64 centred on 600 | Gap card 568 (632–1200), so the left group and the Gap card are equal halves. Column headers lost a hidden 28px paragraph indent and start on the card text (159 / 655).
Stage summary, equal boxes: the stage name moved inside the With AI card as a 96px label (bold, before the text), so the rows are With AI card 568 | arrow 64 | Gap card 568 with the arrow on the centre line; headers start on the card texts (127 / 655).
Stage summary as a light table (supersedes the boxed rows): label "Analysis" / "분석" (was Synthesis / 종합); no card fills, rows divided by hairlines (#DADFDC) under a hairlined header; stage name 120 | 16 | With AI text to 568 | arrow centred on 600 | Gap text in red from 632. Headers start on their column text (136 / 632).
Stage summary, Gap emphasis: the row hairlines are gone; the Gap column is one highlighted panel (red #C7383D at 8%, 16px radius, from x 616 to 1200, header to last row; "Gap · highlight", absolute behind the rows) with the "Gap" / "빈틈" header in that red, like a highlighted column in a pricing table. With AI stays plain text; arrow on the centre line.
- Landing galaxy is a near face-on spiral (y ×0.9, tilt 0.2 rad): bright core 14%, three logarithmic arms (66%, r 0.16–1.51) and 20% disc dust between them; set 0.22 above centre so it clears the headline. Galaxy tint centre moved to match (0.35, 0.49).
Stage summary as four equal stage cards (supersedes the table / highlighted Gap column; the table "Stage rows" stays hidden): "Stage cards · 4 up", 4 × 282 with 24 gaps across 1200. Each card (grey, 16px radius): top "0N  Stage" + the With AI line; bottom band in red 8% with "↓ Gap" (13px, red) and the gap sentence in red. Top parts and bands are equalised so the red bands line up across the row. KO keeps words whole.
Stage summary, final: back to the row grid with boxes (the four-card and Gap-panel tries were removed): stage name 120 | 16 | With AI box 500 (grey) | arrow 64 | Gap box 500 (red 8%, red text), so both boxes are the same width; 16px radius, 24px padding, 10px between rows, no hairlines; headers start on their box text (160 / 724). Label stays Analysis / 분석.
Figma in-depth interview block (EN 789:1125 / KO 789:3471): photo 720 (16px radius, own aspect) | 64 | "What we wanted to know" 416, top-aligned, questions 16px apart (KO words kept whole). The participant table moved out of the right column: "Participants · cards" below the row (48px gap), four equal grey cards across 1200 — P0N (13px muted), role, "Team size ≤5 · experience" (15px muted). The old table stays hidden inside the column.
- Landing galaxy is round: core 16% (r ≤ 0.22), soft disc 64% thinning outwards (r 0.12–1.12, loose 0.22), faint three-arm swirl 20%; stir eased on the landing (0.65 − 0.35·galaxy) so the flow doesn't tear it into wisps. Particle randomness in homeOf uses an integer PCG hash `hq(n, k)`: the sin() hash lost precision at 262k points and drew radial spokes. Devsign bolt is a 7-point polygon, narrow at the top, gathered tighter (outline 0.3, body 0.4).

## Devsign case body follows the findings-first Figma frames (branch worktree-devsign-case-figma)
- The body now follows Figma 789:96 / KO 789:2442. `study.findings: true` turns on findings-first blocks: Block shows the method name as a small label (`label` overrides it, e.g. "Iteration 1 · Split by role"), the finding (`lead`) as a 24px heading, an optional `feature` tag, then the text. Gemini (no `findings`) keeps the old block shape but shares the new type scale.
- Type: stage titles 64px Light (clamp 40–64), statements and the Testing / Core problem lines 36px Regular, findings and answers 24px Medium, labels 13px Medium sentence case, stats 64px Light.
- Discover: community findings are numbered rows plus a 1200×180 strip of the research boards. The stage summary is 136 | box | 64 arrow | box (equal boxes). Interview: photo 720 | 64 | questions 416, then four participant cards (P0N, role, "Team size … · experience").
- Develop has no prioritization matrix or DVF any more: Ideation → Value proposition canvas (image | text) → Sketching → "4 core features" problem → feature rows (`develop.selection`) → IA → User flow.
- Deliver is a scroll story (components/devsign-story.tsx `DeliverStory`). The screen (16:10, sticky) crossfades 400ms to the feature that crosses the middle of the viewport; that feature's three areas are boxed and numbered (`areas` in %, from the Figma "Deliver · scroll story" frames). The active list item shows its kicker, body, points ↔ boxes (hover) and "Open in the prototype ↗". It has four features now, History included (screen-history.webp / -ko.webp exported from Figma; Live Workspace uses iter2-to-be). Below 64rem every item is open with its own screen.
- Testing: label + 36px line; usability photo 720 | 2×2 scores; each iteration has a label, finding, feature tag and an `IterationStory`: a sticky 16:9 screen with an As-is | To-be switch (To-be first, 240ms crossfade, the boxes follow the view), a caption, three-step progress and the changes list (old way struck through → new way). Iteration 2 keeps the co-design photo | agreed list above it.
- `.dv-figure` clips its content so images waiting at reveal scale 1.14 no longer widen the page on phones.
- Devsign bolt traced from the logo again (9-point `BOLT`, 659×625 artwork, width ×0.9, scale 1.6/625), sampled with the integer hash; replaces the narrow-top 7-point bolt, which no longer read as the logo.
- The four feature cards moved from Overview into Develop, replacing the problem → feature rows (site and Figma 789:96 / 789:2442, "Block · 4 core features (cards)"): label "4 core features" / "핵심 기능 4개", the "See, merge, decide…" heading, the screen cards, each closing under a hairline on "Solves" + the problem and the direction it came from (`develop.selection.solves`), then "See them in action in Deliver ↓". Overview no longer shows Main features; the Figma "Main features" frame and the hidden Idea selection rows are gone from the flow.
- Define order (site, findings first, and Figma 789:96 / 789:2442): Affinity mapping → Key problems → Persona & user journey map → Core problem → How might we. In Figma the "Define" stage label moved to the top of the affinity section; the personas section now follows Key problems (top padding 136).
- Korean opener question stays the original ("AI로 모두가 빨라졌는데, 왜 함께 일하기는 더 어려워졌을까?"); only the English one is shortened. Core problem band is tighter: site padding 64px (48 on phones), Figma section padding 96 with the trailing gap/divider hidden.
- HMW label: "HMW" (EN/KO, site and Figma) — the English question already starts with "How might we", so the label stays short. Usability test is split: photo | "Process" (participants and tasks), then "Results": the four scores in one row between hairlines, and what they meant below (`usability.process` / `result`, labels Process / Results, 진행 / 결과). Takeaway no longer shows Limitations (removed from both MDX files; hidden in Figma).
- Figma: a Design system slot sits at the end of Develop, after User flow (EN 854:10 / KO 854:20 box): label "Design system", red TODO heading and body, then a 16px-rounded grey box 1200×600 to replace with the capture. Not on the site yet (no image or copy).
- Usability "Process" lists the three test scenarios from the FigJam scenario table under the participants line (`usability.scenarios`: role · feature, task, actions; hairline rows, site and Figma). The site still says 7 tasks; the scenarios are the three situations they were built on.
- Usability "Protocol" beside the photo is three labelled facts (Participants / Tasks / Measures, `usability.protocol`), then the three scenarios as cards across the column (`scenarios`, "Scenario 0N", role · feature, task, actions), then Results with the four scores centred in one row. Deliver band padding 112 (80 on phones), story items 50vh (iterations 40vh). One "Try the live prototype ↗" / "프로토타입 직접 써 보기 ↗" pill sits under the Deliver heading (`PrototypeLink`); the per-feature links are gone. Overview TL;DR and process copy rewritten in plainer sentences (no em-dash lists). Design system copy written from the devsign repo design.md (one token file, mint primary, 32px controls, 12px gaps, 8/12px corners, shadcn/ui, panels open beside the work); the site shows the block once `develop.system.image` is set, Figma has it with the box placeholder.
- Landing galaxy dust as fine strands: particles share 3000 seeds over the form and lie along a short strand from their seed that winds round the core (orbit + a soft curl field), so it reads as silky threads with dark gaps instead of sprayed powder. Case forms (Gemini, Devsign, About) keep their own dust (formOf) so the shapes read. Bloom pipeline removed; light ink deeper (×0.78–0.6). Devsign bolt is soft like the Gemini sparkle (outline 10% loose 0.55, body loose 0.65). Galaxy centred on the stage (q −0.2 x, tint centre (0, 0.1)).
- Strands removed (the owner found the thread look creepy): every particle leans to its own point of the form again (homeOf → formOf(n)). Kept: centred round galaxy, no bloom, deeper light ink, soft Devsign bolt.
- Copy and hierarchy pass: Discover reads as one chain (desk research says what we checked and why; Q1 "Is this common?" / Q2 "Do existing tools solve it?" answers in plain words; stat lines explain the number; community label "the same three problems kept coming up"; the stage summary gets a one-line "Put together…" text). Interview heading bridges from the posts ("Posts showed what hurts. We needed to see how teams decide."), its text names the questions and the answer. Scenario cards lead with the task in plain words, then role · feature, then the steps (A → B → C). Type scale: stage 64 Light / statement 36 / heading 24 Medium / item title 18 SemiBold / body 18 (cards 16) / meta 13–14. Takeaway (findings first): statement + text, three review cards, next step as a two-column row (label + 24px title | goal text + → checks). Figma mirrors all of it (Takeaway "Review · cards" and "Next step · row"; old list/box hidden).
- Shorter pass: scenario cards say the task in a few words plus the steps; Takeaway review is one line per point (number · title · note), the next step is label + title only (goal text and checks dropped). Core problem split into two plain sentences; Develop opens from the HMW question (Ideation) and says why the value proposition canvas came next; design system copy rewritten ("We set the visual rules once, so every screen matched."). Figma mirrors it.
- Core problem is general now (who decided what and why gets buried in chat; design and build drift apart), not "designers lose their say before release". IA, user flow and design system copy rewritten in plain words: IA = one workspace, four tabs, why Merge moved into a tab, decisions saved in History; user flow = three people, three jobs, one change request; design system = one file of rules every screen follows (same mint main button, 32px controls). Site and Figma.
- Next project (MoreWork) is compact: no rule above, "Next project" label in 13px sentence case, deck card clamp(150–190px), 16px corners, 22–28px name, 14px description. The case sheet (`.case-study:has(.dv)`) is white in light down to the footer, so the Next project block no longer sits on a grey strip.
- Figma: Next project is the first row of the dark footer band (EN 861:2 / KO 861:10): label, "Gemini privacy revamp →" (Bricolage 48, pale blue), the problem line | a 360×225 16px cover card (Gemini phone on a blue night gradient), then the hairline and the existing footer. Proposal only; the site still shows the compact deck above the footer.
- Depth of field: the galaxy disc is thicker (z ±0.3); dust in front of the form's plane (vNear, vDepth 0.62→0.8) is drawn up to 1.7× larger, softer and at 25% opacity, dust behind it slightly smaller and crisp. Light theme: the galaxy keeps only 2% in its core and puts the disc dust towards the rim (r 0.35–1.1), so no dark blot in the middle (sim uniform `lightTheme`). Devsign bolt gathered tighter (loose 0.45) and moved left (−0.78, 0.4).
- Discover Q1 (site + Figma): survey numbers | community voices side by side. The three problems each carry one real quote from the FigJam research board (r/cscareerquestions, r/DesignSystems, Medium), the board strip is replaced by a "See all research boards ↗" link (`q1.groups[].quote/source`, `q1.boardsLink`).
- Case end zone: the Next project deck opens the dark footer band (`.case-study .more-work` takes the footer colour and switches --bg/--ink/--muted and the project title colours locally), and the footer after it is centred: a 32–56px headline and the three ways onward as pills, then the quiet bottom row. Figma footers mirror it (deck 863:2 / 863:12).
- Gemini sparkle filled with a thick band (60% of the dust between 0.62 and 1.0 of the edge radius, loose 0.6) instead of a thin dense outline, so its arms read as strokes; slightly larger (×1.15).
- Discover Q1 stacked instead of two columns (the side-by-side read as cramped): the two survey numbers in one row, then the three problems as grey quote cards in a row (number, problem, quote, source at the bottom), then the boards link. Site and Figma.
- Discover hierarchy and wording: quote cards keep the problem as the 18px title and set the quote quieter (15px italic, muted, thin accent rule) with a 12px source. KO Q2 label "이미 해결한 도구가 있는가" so "아직 없다." answers it; audit label says 9 tools in 4 types (the rows are types, not tools); the stage summary heading states the finding ("Every stage got faster, and every stage left a gap." / "모든 단계가 빨라졌고, 단계마다 빈틈이 생겼다.") with "laid both answers out stage by stage" as its line. Site and Figma.
- Devsign bolt sheared to lean like a slash (x += y·0.45, width ×0.8), so it isn't upright.
- Discover answers no longer open with "Yes." / "Not yet." (그렇다./아직 없다.); they state the finding. Key problems heading: "Four problems came out, and each one hits a different role hardest." / "문제는 네 가지로 좁혀졌고, 문제마다 가장 크게 막히는 직군이 다르다." The "Problem definition" label above Core problem is gone (findings first, site and Figma). Closing zone tighter: last section bottom 72–104, deck band 64–96 top / 48–64 bottom, footer ask 28–44px with 48–64 spacing; Figma footer 96 top, 64 gaps, 44px ask.
- Devsign bolt reads whole: body sampled within the bolt's own bounds (x −0.56…0.85, y ±0.81), gathered tighter (loose 0.3), and lit to at least vLight 0.75 so the upper slab, where the room light is darkest, isn't faint.
- Footer after the Next project deck is only its bottom row under a hairline (© · Work / About / Email / LinkedIn · Back to top); the big ask and the pill actions are hidden there (`.more-work + .site-footer .site-footer-top`). The playground footer keeps the full version. LinkedIn joined the bottom-row links. Figma footers match.
- Fewer rules in the case body: questions (.dv-question) and the survey row have no top line any more, only space; the stage title keeps its rule. Figma Discover matches (interview row rule and question rules removed).
- Text on the case accent (prototype pill, active numbered badges, the As-is/To-be switch, success checks) is white in light and near-black #120f24 in dark, where the accent is the pale #a594ff and white text failed contrast.
- Feature cards drop the "From direction X" line (only "Solves" + the problem); their heading is "One feature for each of the four problems." / "네 가지 문제에, 기능 하나씩으로 답했다." The prototype link is a quiet outline pill (14px, accent text). Usability heading now says what was tested ("…with one designer and one developer"); the finding "Both saw the value. Neither could finish alone." opens Results (`usability.resultLead`). Closing zone: last section 56–80 bottom, deck band 48–64 top; the footer rule spans the full band (border on the footer, not the bottom row). Figma mirrors all of it.
- Stages alternate backgrounds so each reads as its own chapter: Discover, Develop and Takeaway sit on a soft band (#f6f6f8 light, ink 4% over the page in dark); Overview, Define, Deliver and Testing stay on the page (Deliver no longer has its own grey band in findings-first). Cards on banded stages turn white. Also fixed the deck band overflowing by ~190px on Devsign pages (it bled by the Devsign margin instead of the page inset). Figma section fills match.
