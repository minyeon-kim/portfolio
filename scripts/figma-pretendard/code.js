// Run once in the Figma desktop app (Plugins → Development → Import plugin from manifest…).
// The frames made by scripts/figma-frames.cjs come out with Hangul in Noto Sans KR, because the
// Figma MCP runs on Figma's servers, where Pretendard doesn't exist. The desktop app sees the fonts
// installed on this Mac, so this swaps every Noto Sans KR run for Pretendard at the same weight.
// SECTION_MARK limits it to the generated sections; set it to "" to cover whole pages.
const SECTION_MARK = "사이트 기준";
const FROM = "Noto Sans KR";
const TO = "Pretendard";

(async () => {
  const available = await figma.listAvailableFontsAsync();
  const styles = new Set(available.filter((f) => f.fontName.family === TO).map((f) => f.fontName.style));
  if (!styles.size) {
    figma.closePlugin("Pretendard isn't installed on this computer, so nothing was changed.");
    return;
  }
  const styleFor = (s) => (styles.has(s) ? s : styles.has(s.replace(" ", "")) ? s.replace(" ", "") : "Regular");
  let changed = 0;
  let sections = 0;
  for (const page of figma.root.children) {
    await page.loadAsync();
    const roots = SECTION_MARK
      ? page.children.filter((n) => n.type === "SECTION" && n.name.includes(SECTION_MARK))
      : [page];
    for (const root of roots) {
      sections++;
      const texts = root.findAllWithCriteria({ types: ["TEXT"] });
      for (const node of texts) {
        const segs = node.getStyledTextSegments(["fontName"]);
        if (!segs.some((s) => s.fontName.family === FROM)) continue;
        for (const seg of segs) {
          await figma.loadFontAsync(seg.fontName);
          if (seg.fontName.family !== FROM) continue;
          const next = { family: TO, style: styleFor(seg.fontName.style) };
          await figma.loadFontAsync(next);
          node.setRangeFontName(seg.start, seg.end, next);
        }
        changed++;
      }
    }
  }
  figma.closePlugin(`Pretendard: ${changed} text layers changed in ${sections} sections.`);
})().catch((e) => figma.closePlugin("Stopped: " + (e && e.message ? e.message : e)));
