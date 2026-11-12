const fs = require('fs');
const all = JSON.parse(fs.readFileSync('patches.json', 'utf8'));
const rd = (v, d = 3) => +v.toFixed(d);
const fixPaint = (p) => p.type === 'SOLID' ? { type: 'SOLID', color: { r: rd(p.color.r), g: rd(p.color.g), b: rd(p.color.b) }, opacity: rd(p.opacity) } : { type: p.type, gradientTransform: p.gradientTransform.map((r) => r.map((v) => rd(v, 4))), gradientStops: p.gradientStops.map((s) => ({ position: rd(s.position), color: { r: rd(s.color.r), g: rd(s.color.g), b: rd(s.color.b), a: rd(s.color.a) } })) };
const PAGES = { Main: ['673:253', '1108:7982'], Devsign: ['673:254', '1109:2'], Gemini: ['673:255', '1109:965'] };
const tpl = fs.readFileSync('apply-template.js', 'utf8');
for (const [pg, [pid, sid]] of Object.entries(PAGES)) {
  const paints = [], key = []; const idx = (stack) => { const s = JSON.stringify(stack); let i = key.indexOf(s); if (i < 0) { key.push(s); paints.push(stack); i = paints.length - 1; } return i; };
  const frames = {};
  for (const [name, P] of Object.entries(all)) {
    if (!name.startsWith(pg)) continue; const o = {};
    if (P.fills.length) o.f = P.fills.map((f) => [rd(f.x, 1), rd(f.y, 1), rd(f.w, 1), rd(f.h, 1), idx(f.paints.map(fixPaint))]);
    if (P.dash.length) o.d = P.dash.map((f) => [rd(f.x, 1), rd(f.y, 1), rd(f.w, 1), rd(f.h, 1)]);
    if (P.dots.length) o.o = P.dots.map((d) => [rd(d.x, 1), rd(d.y, 1), d.d, rd(d.color.r), rd(d.color.g), rd(d.color.b)]);
    if (P.glow) o.g = [rd(P.glow.x, 1), rd(P.glow.y, 1), rd(P.glow.w, 1), rd(P.glow.h, 1), idx([fixPaint(P.glow.paint)])];
    if (P.ticker && P.ticker.spans.length) o.t = [P.ticker.em, ...P.ticker.spans.map((s) => [rd(s.x, 1), rd(s.y, 1), rd(s.w, 1), rd(s.h, 1)])];
    if (P.pills.length) o.p = P.pills.map((p) => [rd(p.x, 1), rd(p.y, 1), rd(p.w, 1), rd(p.h, 1), p.sw, p.op, p.parts.map((q) => [q.a, q.c.map((v) => rd(v))])]);
    frames[name] = o;
  }
  const code = tpl.replace('__PAGE__', pid).replace('__SECTION__', sid).replace('__DATA__', JSON.stringify({ paints, frames }));
  fs.writeFileSync(`apply-${pg}.js`, code); console.log(pg, code.length);
}
