// Reads from the built site what the SVG export can't carry (radial and conic gradients, dashed
// outlines, ::before dots and glows, ticker copies) and writes one patch list per Figma frame.
const { chromium } = require('/Users/minyeon/Projects/devsign/node_modules/playwright') // same Playwright as figma-frames.cjs;
const fs = require('fs');
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const FR = [];
for (const lang of ['KO', 'EN']) {
  const pre = lang === 'KO' ? '/ko' : '';
  FR.push([`Main · ${lang} · Dark · 1920`, pre + '/', 1920, 'dark']);
  if (lang === 'KO') { FR.push(['Main · KO · Light · 1920', pre + '/', 1920, 'light'], ['Main · KO · Dark · hover Devsign · 1920', pre + '/', 1920, 'dark'], ['Main · KO · Dark · hover Gemini · 1920', pre + '/', 1920, 'dark'], ['Main · KO · Light · hover Devsign · 1920', pre + '/', 1920, 'light']); }
  FR.push([`Main · ${lang} · Dark · 390`, pre + '/', 390, 'dark']);
  for (const [p, u] of [['Devsign', '/work/devsign/'], ['Gemini', '/work/gemini-privacy/'], ['About', '/about/']]) {
    FR.push([`${p} · ${lang} · Dark · 1920`, pre + u, 1920, 'dark'], [`${p} · ${lang} · Light · 1920`, pre + u, 1920, 'light'], [`${p} · ${lang} · Dark · 390`, pre + u, 390, 'dark']);
  }
}
const inPage = () => {
  const col = (s) => { s = s.trim(); if (s === 'transparent') return [0, 0, 0, 0]; let m = s.match(/^rgba?\(([^)]+)\)/); if (m) { const p = m[1].split(/[,/ ]+/).filter(Boolean).map(Number); return [p[0] / 255, p[1] / 255, p[2] / 255, p[3] === undefined ? 1 : p[3]]; } m = s.match(/^color\(srgb ([^)]+)\)/); if (m) { const [a, b] = m[1].split('/'); const p = a.trim().split(/\s+/).map(Number); return [p[0], p[1], p[2], b === undefined ? 1 : Number(b)]; } return null; };
  const split = (s) => { const out = []; let d = 0, cur = ''; for (const ch of s) { if (ch === '(') d++; if (ch === ')') d--; if (ch === ',' && d === 0) { out.push(cur.trim()); cur = ''; } else cur += ch; } if (cur.trim()) out.push(cur.trim()); return out; };
  const inv = (a, b, o) => { const det = a[0] * b[1] - b[0] * a[1]; const ia = [b[1] / det, -b[0] / det], ib = [-a[1] / det, a[0] / det]; return [[ia[0], ia[1], -(ia[0] * o[0] + ia[1] * o[1])], [ib[0], ib[1], -(ib[0] * o[0] + ib[1] * o[1])]]; };
  const stops = (parts) => { let st = parts.map((p) => { const m = p.match(/^(.*?)(?:\s+(-?[\d.]+)%)?$/); const c = col(m[1]); return c ? { c, pos: m[2] === undefined ? null : Number(m[2]) / 100 } : null; }); if (st.includes(null)) return null; if (st[0].pos === null) st[0].pos = 0; if (st[st.length - 1].pos === null) st[st.length - 1].pos = 1; for (let i = 1; i < st.length - 1; i++) if (st[i].pos === null) { let j = i; while (st[j].pos === null) j++; const a = st[i - 1].pos, b = st[j].pos; for (let k = i; k < j; k++) st[k].pos = a + (b - a) * (k - i + 1) / (j - i + 1); }
    st.forEach((s, i) => { if (s.c[3] === 0) { const n = st[i - 1] && st[i - 1].c[3] > 0 ? st[i - 1] : st[i + 1]; if (n) s.c = [n.c[0], n.c[1], n.c[2], 0]; } });
    return st.map((s) => ({ position: Math.max(0, Math.min(1, s.pos)), color: { r: s.c[0], g: s.c[1], b: s.c[2], a: s.c[3] } })); };
  const len = (v, size) => v.endsWith('%') ? parseFloat(v) / 100 : parseFloat(v) / size;
  const layer = (s, w, h) => {
    let m = s.match(/^radial-gradient\((.*)\)$/s);
    if (m) { const parts = split(m[1]); const g = parts[0].match(/^(\S+) (\S+) at (\S+) (\S+)$/); if (!g) return null; const rx = len(g[1], w), ry = len(g[2], h), cx = len(g[3], w), cy = len(g[4], h); const st = stops(parts.slice(1)); if (!st) return null; return { type: 'GRADIENT_RADIAL', gradientTransform: inv([2 * rx, 0], [0, 2 * ry], [cx - rx, cy - ry]), gradientStops: st }; }
    m = s.match(/^linear-gradient\((.*)\)$/s);
    if (m) { const parts = split(m[1]); let deg = 180, rest = parts; const a = parts[0].match(/^(-?[\d.]+)deg$/); if (a) { deg = Number(a[1]); rest = parts.slice(1); } else if (/^to /.test(parts[0])) { deg = { 'to top': 0, 'to right': 90, 'to bottom': 180, 'to left': 270 }[parts[0]] ?? 180; rest = parts.slice(1); }
      const t = deg * Math.PI / 180, dx = Math.sin(t), dy = -Math.cos(t), L = Math.abs(w * dx) + Math.abs(h * dy); const S = [w / 2 - dx * L / 2, h / 2 - dy * L / 2]; const a2 = [dx * L / w, dy * L / h], b2 = [-dy * L / w, dx * L / h]; const o = [S[0] / w - b2[0] / 2, S[1] / h - b2[1] / 2]; const st = stops(rest); if (!st) return null; return { type: 'GRADIENT_LINEAR', gradientTransform: inv(a2, b2, o), gradientStops: st }; }
    return null;
  };
  const paints = (cs, w, h) => { const out = []; const bc = col(cs.backgroundColor); if (bc && bc[3] > 0) out.push({ type: 'SOLID', color: { r: bc[0], g: bc[1], b: bc[2] }, opacity: bc[3] }); const ls = split(cs.backgroundImage).filter((l) => l !== 'none'); for (const l of ls.reverse()) { const p = layer(l, w, h); if (!p) return null; out.push(p); } return out; };
  const R = (el) => { const r = el.getBoundingClientRect(); return { x: r.left + scrollX, y: r.top + scrollY, w: r.width, h: r.height }; };
  const P = { fills: [], dash: [], dots: [], glow: null, ticker: null, pills: [] };
  for (const el of document.querySelectorAll('main *')) {
    const r = el.getBoundingClientRect(); if (r.width < 8 || r.height < 8) continue; const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') continue;
    if (/radial-gradient/.test(cs.backgroundImage) && !/^(more-work-cover|home-)/.test(el.className.toString())) { const p = paints(cs, r.width, r.height); if (p) P.fills.push({ ...R(el), paints: p, cls: el.className.toString().slice(0, 30) }); }
    if (cs.borderTopStyle === 'dashed') P.dash.push({ ...R(el), sw: parseFloat(cs.borderTopWidth) });
  }
  for (const b of document.querySelectorAll('.dv-journey-legend button')) { const cs = getComputedStyle(b, '::before'); const r = R(b); const d = parseFloat(cs.width); const c = col(cs.backgroundColor); if (r.w && c) P.dots.push({ x: r.x + parseFloat(getComputedStyle(b).paddingLeft), y: r.y + (r.h - d) / 2, d, color: { r: c[0], g: c[1], b: c[2] } }); }
  const ft = document.querySelector('.case-study .more-work + .site-footer'); if (ft) { const cs = getComputedStyle(ft, '::before'); if (cs.content !== 'none' && /radial/.test(cs.backgroundImage)) { const r = R(ft); const h = parseFloat(cs.height); const p = layer(split(cs.backgroundImage)[0], r.w, h); if (p) P.glow = { x: r.x, y: r.y + r.h - h, w: r.w, h, paint: p }; } }
  const tk = document.querySelector('.more-work-ticker'); if (tk) { const em = parseFloat(getComputedStyle(tk).fontSize); P.ticker = { em, spans: [...tk.querySelectorAll('.more-work-ticker-track > span')].map(R).filter((s) => s.x < innerWidth) }; }
  for (const a of document.querySelectorAll('.home-pick[data-slug]')) { const cs = getComputedStyle(a, '::before'); const m = cs.backgroundImage.match(/conic-gradient\(from ([\d.]+)deg, (.*)\)$/s); if (!m) continue; const parts = split(m[2]).map((p) => { const q = p.match(/^(.*?)\s+([\d.]+)deg$/); return { c: col(q[1]), a: Number(q[2]) + Number(m[1]) }; }); P.pills.push({ ...R(a), sw: parseFloat(cs.paddingTop), op: 0.9, parts }); }
  return P;
};
(async () => {
  const browser = await chromium.launch({ channel: 'chrome' });
  const all = {};
  for (const [name, url, w, scheme] of FR) {
    const ctx = await browser.newContext({ viewport: { width: w, height: w > 1000 ? 1080 : 844 }, colorScheme: scheme, reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    await page.goto('http://localhost:4180' + url, { waitUntil: 'networkidle' });
    const height = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < height; y += 700) { await page.evaluate((v) => window.scrollTo(0, v), y); await wait(30); }
    await page.evaluate(() => window.scrollTo(0, 0)); await wait(400);
    const P = await page.evaluate(inPage);
    all[name] = P;
    console.log(name, 'fills', P.fills.length, [...new Set(P.fills.map((f) => f.cls))].join('|'), 'dash', P.dash.length, 'dots', P.dots.length, 'glow', !!P.glow, 'tick', P.ticker ? P.ticker.spans.length : 0, 'pills', P.pills.length);
    await ctx.close();
  }
  fs.writeFileSync('patches.json', JSON.stringify(all));
  await browser.close();
})();
