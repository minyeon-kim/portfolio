const PAGE_ID = "__PAGE__", SECTION_ID = "__SECTION__";
const DATA = __DATA__;
const page = await figma.getNodeByIdAsync(PAGE_ID);
await figma.setCurrentPageAsync(page);
const sec = await figma.getNodeByIdAsync(SECTION_ID);
const near = (a, b, t = 1.6) => Math.abs(a - b) < t;
const hit = (n, b) => near(n.x, b[0]) && near(n.y, b[1]) && near(n.width, b[2]) && near(n.height, b[3]);
const report = [];
for (const fr of sec.children) {
  const P = DATA.frames[fr.name]; if (!P) { report.push([fr.name, "no data"]); continue; }
  const r = { name: fr.name, fills: 0, dash: 0, dots: 0, glow: 0, tick: 0, pills: 0, pct: 0, arrows: 0, miss: [] };
  const rects = () => fr.children.filter((n) => n.type === "RECTANGLE");
  for (const f of P.f || []) { const n = rects().find((n) => n.name !== "Image" && hit(n, f)); if (n) { n.fills = DATA.paints[f[4]]; r.fills++; } else r.miss.push("fill " + f.slice(0, 2).join(",")); }
  for (const d of P.d || []) { const n = rects().find((n) => n.strokes.length && hit(n, d)); if (n) { n.dashPattern = [6, 5]; r.dash++; } else r.miss.push("dash " + d.slice(0, 2).join(",")); }
  for (const o of P.o || []) {
    if (fr.children.some((n) => n.name === "Legend dot" && near(n.x, o[0]) && near(n.y, o[1]))) continue;
    const pill = rects().filter((n) => n.x <= o[0] && n.y <= o[1] && n.x + n.width >= o[0] + o[2] && n.y + n.height >= o[1] + o[2]).sort((a, b) => a.width * a.height - b.width * b.height)[0];
    const e = figma.createEllipse(); e.name = "Legend dot"; e.resize(o[2], o[2]); e.fills = [{ type: "SOLID", color: { r: o[3], g: o[4], b: o[5] } }];
    fr.insertChild(pill ? fr.children.indexOf(pill) + 1 : fr.children.length, e); e.x = o[0]; e.y = o[1]; r.dots++;
  }
  if (P.g && !fr.children.some((n) => n.name === "Footer glow")) {
    const g = P.g; const wide = rects().filter((n) => n.width >= fr.width - 2 && n.name !== "Image" && n.y < g[1] + g[3] && n.y + n.height > g[1]);
    const band = wide.filter((n) => n.y <= g[1] + 1).sort((a, b) => fr.children.indexOf(b) - fr.children.indexOf(a))[0];
    for (const n of wide) if (n !== band && n.y >= g[1] && n.name === "Shape" && n.fills !== figma.mixed && n.fills.every((p) => p.type === "SOLID")) n.visible = false;
    const q = figma.createRectangle(); q.name = "Footer glow"; q.resize(g[2], g[3]); q.fills = [DATA.paints[g[4]][0]];
    fr.insertChild(band ? fr.children.indexOf(band) + 1 : 1, q); q.x = g[0]; q.y = g[1]; r.glow++;
  }
  if (P.t && !fr.children.some((n) => n.name === "Ticker dot")) {
    const em = P.t[0], spans = P.t.slice(1);
    const t = fr.children.find((n) => n.type === "TEXT" && /^Next project/.test(n.characters) && Math.abs(n.y - spans[0][1]) < 80);
    if (t) {
      await figma.loadFontAsync(t.fontName);
      const target = spans[0][2] - 0.75 * em; const ls0 = t.letterSpacing.unit === "PIXELS" ? t.letterSpacing.value : 0;
      t.letterSpacing = { unit: "PIXELS", value: ls0 + (target - t.width) / t.characters.length };
      const idx = fr.children.indexOf(t);
      spans.forEach((s, i) => {
        const n = i === 0 ? t : t.clone(); if (i) fr.insertChild(idx + 1, n); n.x = s[0]; n.y = t.y;
        const e = figma.createEllipse(); e.name = "Ticker dot"; e.resize(0.19 * em, 0.19 * em); e.fills = t.fills; fr.insertChild(idx + 1, e); e.x = s[0] + target + 0.28 * em; e.y = s[1] + (s[3] - 0.19 * em) / 2; r.tick++;
      });
    } else r.miss.push("ticker");
  }
  for (const p of P.p || []) {
    const n = rects().find((n) => hit(n, p, 2.5)); if (!n) { r.miss.push("pill " + p.slice(0, 2).join(",")); continue; }
    let st = p[6].map(([a, c]) => ({ position: (((a - 90) % 360) + 360) % 360 / 360, color: { r: c[0], g: c[1], b: c[2], a: c[3] * p[5] } })).sort((a, b) => a.position - b.position);
    const solid = st.find((s) => s.color.a > 0); st.forEach((s, i) => { if (s.color.a === 0) { const nb = [st[(i + 1) % st.length], st[(i - 1 + st.length) % st.length]].find((x) => x.color.a > 0) || solid; s.color = { r: nb.color.r, g: nb.color.g, b: nb.color.b, a: 0 }; } });
    const first = st[0], last = st[st.length - 1]; const span = first.position + 1 - last.position; const k = span ? (1 - last.position) / span : 0;
    const mix = { r: last.color.r + (first.color.r - last.color.r) * k, g: last.color.g + (first.color.g - last.color.g) * k, b: last.color.b + (first.color.b - last.color.b) * k, a: last.color.a + (first.color.a - last.color.a) * k };
    if (first.position > 0.001) st.unshift({ position: 0, color: mix }); if (last.position < 0.999) st.push({ position: 1, color: mix });
    n.strokes = [{ type: "GRADIENT_ANGULAR", gradientTransform: [[1, 0, 0], [0, 1, 0]], gradientStops: st }]; n.strokeWeight = p[4]; n.strokeAlign = "INSIDE"; r.pills++;
  }
  const kids = [...fr.children];
  for (let i = 1; i < kids.length; i++) { const n = kids[i], p = kids[i - 1]; if (n.type === "TEXT" && n.characters === "%" && p.type === "TEXT" && /^[\d.]+$/.test(p.characters) && Math.abs(n.y - p.y) < 6 && Math.abs(n.x - (p.x + p.width)) > 0.6) { n.x = p.x + p.width; r.pct++; } }
  for (const n of kids) {
    if (n.type !== "TEXT" || !/^[→←↑↓↗]$/.test(n.characters) || n.fontName === figma.mixed || /Geist/.test(n.fontName.family)) continue;
    const style = /Medium|Semi|Bold/.test(n.fontName.style) ? "Medium" : "Regular"; await figma.loadFontAsync({ family: "Geist", style });
    const t = figma.createText(); t.fontName = { family: "Geist", style }; t.characters = n.characters; t.fontSize = n.fontSize; t.fills = n.fills; t.opacity = n.opacity; t.name = n.characters;
    fr.insertChild(fr.children.indexOf(n) + 1, t); t.x = n.x + (n.width - t.width) / 2; t.y = n.y + (n.height - t.height) / 2; n.remove(); r.arrows++;
  }
  report.push(r);
}
return report;
