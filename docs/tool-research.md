# Comparative analysis: tool research (November 2026)

Basis for the map in the Devsign case. Vendor pages unless noted; not tried hands-on.
Columns: make or hand off / find and approve / merge by branch or prompt / pick areas on screen.
Rows: change history / approvals and comments / decision and reason.

The site now shows this as coverage by step (make or hand off, find differences, approve or comment, combine, record why), grouped by tool type. The placement tables below use the earlier map's names but are the evidence for it.

Fourth pass, looking only for tools that combine selectively (the site now shows the two-row comparison):

- Webflow page branching: conflicts on classes, components and the like are resolved one by one before merging; other changes merge as a whole ([Help](https://help.webflow.com/hc/en-us/articles/46651751861139-Page-branching)). "Choosing only where it conflicts".
- Penpot: per-element conflict resolution is described in an open GitHub issue, so planned, not shipped ([#12214](https://github.com/penpot/penpot/issues/12214)). Not listed.
- Cursor: accept or reject per file, code only; per-hunk comments are a feature request (forum, staff replies) ([Forum](https://forum.cursor.com/t/allow-commenting-diffs-when-reviewing-changes/163482)). Not listed.
- Google Stitch: up to five variants; annotate a region to change it. Changes one output, does not combine variants (secondary guides). Not listed.
- Banani: regenerate a section; Superdesign: pick a whole variant; Figma agent: variations side by side. No combining across variants found.
- Abstract, Kactus, Plant: Sketch version control, sources dated 2018 and later; merges resolve conflicts, not areas across drafts.
- Prototype-level ways of mixing by prompt exist (Magic Patterns, community Claude Code skills).

"None of the 20+ reviewed" is a claim about this set, from docs and product pages. It is not a claim about the whole market, and most were not tried hands-on.

Third pass:

- Magic Patterns inline comments: confirmed in official docs ([Inline Comments](https://www.magicpatterns.com/docs/documentation/collaboration/inline-comments)).
- Chromatic UI Review: threaded discussions on changes, assigned reviewers must approve ([Review](https://www.chromatic.com/docs/review/)).
- GitHub: comment, approve, request changes, required reviews ([Docs](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/reviewing-changes-in-pull-requests/about-pull-request-reviews)).
- Framer: Review Changes then Apply; no partial apply documented, only advice to keep branches narrow ([Help](https://www.framer.com/help/articles/how-to-use-branches-in-framer/)).
- Lovable: version history, element comments and annotations; no branching found ([History](https://docs.lovable.dev/features/projects/history), [Changelog](https://docs.lovable.dev/changelog)). Its AI-builder row marks merging as partial because of Magic Patterns, not Lovable.
- Figma Make: versions, point and edit, annotate for agent; no compare or merge found ([Edit](https://help.figma.com/hc/en-us/articles/42009840449175-Edit-a-Figma-Make-file)). Not on the table.
- Bolt: version history; points to GitHub for branching and review ([Support](https://support.bolt.new/concepts/version-history-github)). Not on the table.
- Claude Design: only a community guide describes remixing the strongest parts of variations; no official source, so not on the table ([XDA](https://www.xda-developers.com/set-up-claude-design-the-way-its-creator-does/)). Prompt-based mixing exists, so Devsign's difference is picking on screen and keeping the reason.

Second pass (official docs), which changed these:

| Tool | Now | Why | Source |
|---|---|---|---|
| Framer | Merge, Approvals and comments | Review Changes shows a diff, then the branch is applied to main; pinned threaded comments that resolve. Partial apply not documented. | [Branches](https://www.framer.com/help/articles/how-to-use-branches-in-framer/), [Collaborate](https://www.framer.com/collaborate/) |
| v0 | Merge, Approvals and comments | Each chat gets a working branch; publishing creates and merges a pull request; required GitHub reviews still apply. Comments inside v0 not found. | [GitHub docs](https://v0.app/docs/github) |
| Magic Patterns | Merge, Approvals and comments | Official "Merging Designs": reference other designs with @ in a prompt. So it combines designs by prompt, without picking areas on screen. Version history is official; inline comments come from vendor pages and Liveblocks. | [Merging](https://www.magicpatterns.com/docs/documentation/editor/merging-designs) |
| OverlayQA | Find and approve, Approvals and comments | Issue statuses, comments, client approve or request changes. | [Bulk actions](https://overlayqa.com/docs/bulk-actions/), [Site](https://overlayqa.com/) |
| Uiprobe | Find and approve, Change history (confirmed) | Docs say probe versions are not a task history or approval flow; markers carry no status. | [Probe versions](https://www.uiprobe.io/help-articles/probe-versions), [Markers](https://www.uiprobe.io/help-articles/markers) |

A search for picking regions from several generated variants found no mainstream design tool doing it (Midjourney Vary Region edits one output). This is still "not found", not proof.

First pass:

Columns: what the tool does with a change. Rows: what it keeps about the decision.

| Tool | Column | Row | What the source says | Source |
|---|---|---|---|---|
| Figma Dev Mode | Make or hand off | Approvals and comments | Ready for dev status, annotated version history per design, compare changes, annotations | [Guide](https://help.figma.com/hc/en-us/articles/15023124644247) |
| Zeplin | Make or hand off | Approvals and comments | Version diff, commit messages, approvals with history per screen, pinned annotations | [Approvals](https://blog.zeplin.io/approvals-in-zeplin), [Version diff](https://support.zeplin.io/en/articles/7064453-spotting-changes-with-version-diff) |
| Magic Patterns | Make or hand off | Approvals and comments | Branch and compare versions, inline comments. No merge feature found. No official docs found. | [Vendor comparison](https://www.magicpatterns.com/blog/claude-design-vs-magic-patterns), [Liveblocks](https://liveblocks.io/blog/how-magic-patterns-powers-its-collaborative-experience) |
| Design Log, UX Decision Logger, Decision Trackr (Figma plugins) | Make or hand off | Decision and reason | Decision, reason or trade-offs attached to a frame or element | [Design Log](https://www.figma.com/community/plugin/1607384158885693996/design-log), [UX Decision Logger](https://www.figma.com/community/plugin/1594687906930605563/ux-decision-logger), [Decision Trackr](https://www.figma.com/community/plugin/1432332696794120370/decision-trackr) |
| Chromatic | Find and approve | Approvals and comments | Accept or deny against baselines, baseline history shows who accepted | [Docs](https://www.chromatic.com/docs/test) |
| Percy | Find and approve | Approvals and comments | Approve per build or snapshot, threaded comments | [Approval](https://www.browserstack.com/docs/percy/visual-testing-workflows/view-percy-build-results/approval) |
| Applitools | Find and approve | Approvals and comments | Approve diffs in dashboard with remarks | [Code reviews](https://applitools.com/docs/eyes/playwright/guides/code-reviews) |
| OverlayQA | Find and approve | Change history | Figma over the live page, differences sent to issue trackers | [Docs](https://overlayqa.com/docs/) |
| Uiprobe | Find and approve | Change history | Property-level Figma vs live; each run saved as a version | [Probe versions](https://www.uiprobe.io/help-articles/probe-versions) |
| GitHub | Merge a whole branch | Approvals and comments | Pull request reviews and comments | general knowledge; no source pulled |
| Figma branching | Merge a whole branch | Approvals and comments | Review applies to all changes; no partial approval or partial merge | [Review](https://help.figma.com/hc/en-us/articles/5693123873687), [Merge](https://help.figma.com/hc/en-us/articles/5691189138839/) |
| Framer | Merge a whole branch | Change history | Branches and merge, auto-branching for review. Docs on comments per branch not found; partial merge not stated. | [Academy](https://www.framer.com/academy/lessons/branching-explore-variations-safely), [Auto-branching](https://www.framer.com/dictionary/auto-branching) |
| v0 | Merge a whole branch | Change history | Branch per chat, merges through pull requests. Third-party sources only. | [Comparison](https://www.heyuan110.com/posts/ai/2026-07-08-lovable-vs-v0-vs-bolt/) |

Also looked at, not on the map: Subframe, Builder.io Visual Copilot (design to code, no review or merge found), Onlook (too little found), Lovable, Bolt (Git workflow, third-party only), FigLog, Dcyde, ADR/Assist (more decision loggers).

Least certain now: Magic Patterns comments (vendor sources), whether Framer can apply part of a branch (not documented either way). The first-pass rows below for Framer, v0, Magic Patterns and OverlayQA are replaced by the second-pass table.
The "Pick by area" column stays empty as "not found", not proof that none exists.

Icons in public/images/tools come from each product's own site icon (favicon or touch icon).
