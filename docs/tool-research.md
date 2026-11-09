# Comparative analysis: tool research (November 2026)

Basis for the map in the Devsign case. Vendor pages unless noted; not tried hands-on.
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

Least certain: Framer and v0 rows, Magic Patterns column, OverlayQA row (its issues live in other trackers).
The "Pick by area" column stays empty as "not found", not proof that none exists.

Icons in public/images/tools come from each product's own site icon (favicon or touch icon).
