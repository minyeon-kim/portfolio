// Run through the Figma MCP `use_figma` tool after uploading the SVGs from figma-frames.cjs.
// Replace PAGE_ID, SECTION and FRAMES, then run once per page. For each uploaded frame it:
// sets every text layer's real weight and letter-spacing (the SVG importer rounds weights),
// turns the imported vectors back into rectangles with corner radius and an inside stroke,
// names the layers, and moves the frame into a dated section.
const PAGE_ID = "__PAGE_ID__";
const SECTION = "__SECTION_NAME__";
const FRAMES = __FRAMES__; // [[nodeId, x], ...] in the order they sit in the section
const START = __START__, END = __END__; // text layers [START, END) of the frame FRAMES[0] only, when chunking

const page = await figma.getNodeByIdAsync(PAGE_ID);
await figma.setCurrentPageAsync(page);
const available = await figma.listAvailableFontsAsync();
const stylesOf = (family) => available.filter((f) => f.fontName.family === family).map((f) => f.fontName.style);
const NAMES = { 100: ["Thin"], 200: ["ExtraLight", "Extra Light"], 300: ["Light"], 400: ["Regular"], 500: ["Medium"], 600: ["SemiBold", "Semi Bold", "DemiBold"], 700: ["Bold"], 800: ["ExtraBold", "Extra Bold"], 900: ["Black"] };
const fontCache = new Map();
const fontFor = async (family, weight, italic) => {
  const key = `${family}|${weight}|${italic}`;
  if (fontCache.has(key)) return fontCache.get(key);
  const have = stylesOf(family);
  let found = null;
  for (const w of [weight, weight - 100, weight + 100, 400]) {
    for (const base of NAMES[w] || []) {
      const want = italic ? [`${base} Italic`, base === "Regular" ? "Italic" : null, base] : [base];
      found = want.find((s) => s && have.includes(s));
      if (found) break;
    }
    if (found) break;
  }
  const fontName = found ? { family, style: found } : null;
  if (fontName) await figma.loadFontAsync(fontName);
  fontCache.set(key, fontName);
  return fontName;
};

const report = [];
let section = page.children.find((n) => n.type === "SECTION" && n.name === SECTION);
if (!section) { section = figma.createSection(); section.name = SECTION; page.appendChild(section); section.x = 0; section.y = 0; }

for (const [id, x] of FRAMES) {
  const frame = await figma.getNodeByIdAsync(id);
  if (!frame) { report.push({ id, missing: true }); continue; }
  const out = { id, name: frame.name, text: 0, rect: 0, missingFonts: new Set() };
  const kids = [...frame.children];
  let t = -1;
  for (const node of kids) {
    if (node.type === "TEXT") {
      t++;
      if (t < START || t >= END) continue;
      const m = node.name.match(/^T\d+__(.+?)__(\d+)(i?)__(-?[\d.]+)$/);
      if (!m) continue;
      const family = m[1].replace(/_/g, " ");
      const fontName = await fontFor(family, +m[2], m[3] === "i");
      for (const seg of node.getStyledTextSegments(["fontName"])) await figma.loadFontAsync(seg.fontName);
      if (fontName) node.fontName = fontName; else out.missingFonts.add(family);
      if (+m[4]) node.letterSpacing = { unit: "PIXELS", value: +m[4] };
      node.name = node.characters.slice(0, 40);
      out.text++;
    } else if (START === 0 && node.type === "VECTOR" && /^(R\d+__[\d.]+|L\d+|Background)$/.test(node.name)) {
      const radius = node.name.startsWith("R") ? +node.name.split("__")[1] : 0;
      const sw = node.strokes.length ? node.strokeWeight : 0;
      const rect = figma.createRectangle();
      frame.insertChild(frame.children.indexOf(node), rect);
      rect.x = node.x - sw / 2; rect.y = node.y - sw / 2;
      rect.resize(Math.max(0.01, node.width + sw), Math.max(0.01, node.height + sw));
      rect.fills = node.fills;
      if (sw) { rect.strokes = node.strokes; rect.strokeWeight = sw; rect.strokeAlign = "INSIDE"; }
      if (radius) rect.cornerRadius = radius;
      rect.opacity = node.opacity;
      rect.name = node.name === "Background" ? "Background" : node.name.startsWith("L") ? "Line" : "Shape";
      node.remove();
      out.rect++;
    } else if (START === 0 && /^I\d+$/.test(node.name)) node.name = "Image";
  }
  if (START === 0) {
    frame.fills = [];
    frame.clipsContent = true;
    section.appendChild(frame);
    frame.x = x; frame.y = 80;
  }
  out.missingFonts = [...out.missingFonts];
  out.textTotal = t + 1;
  report.push(out);
}
if (START === 0) {
  const right = Math.max(...section.children.map((c) => c.x + c.width)), bottom = Math.max(...section.children.map((c) => c.y + c.height));
  section.resizeWithoutConstraints(right + 80, bottom + 80);
}
return { sectionId: section.id, report };
