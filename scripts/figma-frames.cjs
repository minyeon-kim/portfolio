// Builds one SVG per site state for the Figma file (FIGMA_FILE): text stays text
// (one layer per line), boxes become rects, photos, recordings, canvases and drawn diagrams are
// embedded as images. Upload each SVG with the Figma MCP `upload_assets` tool (the file name
// becomes the frame name), then run the fix-up in scripts/figma-fixup.js through `use_figma`
// (weights, letter-spacing, real rounded rectangles, layer names).
//
// Usage: node scripts/figma-frames.cjs <outDir> [nameFilter]      (dev server on :3000, or BASE=…)
// Ids in the SVG carry what the importer drops: T<n>__<family>__<weight>[i]__<letter-spacing>,
// R<n>__<radius>, L<n> (hairline), I<n> (image).
const { chromium } = require('/Users/minyeon/Projects/devsign/node_modules/playwright');
const fs = require('fs');
const path = require('path');

const BASE = process.env.BASE || 'http://localhost:3000';
const out = process.argv[2];
const filter = process.argv[3];
if (!out) { console.error('usage: node scripts/figma-frames.cjs <outDir> [nameFilter]'); process.exit(1); }
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const FRAMES = [];
for (const [lang, prefix] of [['KO', '/ko'], ['EN', '']]) {
  // The landing keeps its motion (the dust is a canvas); hover states show a case's card and copy.
  const home = { page: 'Main', url: `${prefix}/`, motion: true };
  FRAMES.push({ ...home, name: `Main · ${lang} · Dark · 1920`, w: 1920, h: 1080, scheme: 'dark' });
  if (lang === 'KO') {
    FRAMES.push({ ...home, name: 'Main · KO · Light · 1920', w: 1920, h: 1080, scheme: 'light' });
    FRAMES.push({ ...home, name: 'Main · KO · Dark · hover Devsign · 1920', w: 1920, h: 1080, scheme: 'dark', hover: 'devsign' });
    FRAMES.push({ ...home, name: 'Main · KO · Dark · hover Gemini · 1920', w: 1920, h: 1080, scheme: 'dark', hover: 'gemini-privacy' });
    FRAMES.push({ ...home, name: 'Main · KO · Light · hover Devsign · 1920', w: 1920, h: 1080, scheme: 'light', hover: 'devsign' });
  }
  FRAMES.push({ ...home, name: `Main · ${lang} · Dark · 390`, w: 390, h: 844, scheme: 'dark' });
  for (const [page, p] of [['Devsign', '/work/devsign/'], ['Gemini', '/work/gemini-privacy/'], ['About', '/about/']]) {
    const url = prefix + p;
    FRAMES.push({ page, url, name: `${page} · ${lang} · Dark · 1920`, w: 1920, h: 1080, scheme: 'dark' });
    FRAMES.push({ page, url, name: `${page} · ${lang} · Light · 1920`, w: 1920, h: 1080, scheme: 'light' });
    FRAMES.push({ page, url, name: `${page} · ${lang} · Dark · 390`, w: 390, h: 844, scheme: 'dark' });
  }
}

// Runs in the page: returns the frame size, background and the list of items in paint order.
function extract() {
  const W = document.documentElement.clientWidth;
  const H = Math.max(document.documentElement.scrollHeight, innerHeight);
  const sx = scrollX, sy = scrollY;
  const cv = document.createElement('canvas');
  const ctx = cv.getContext('2d');
  const colorCache = new Map();
  const rgba = (c) => {
    if (!c) return [0, 0, 0, 0];
    if (colorCache.has(c)) return colorCache.get(c);
    let v = [0, 0, 0, 0];
    let m = c.match(/^rgba?\(([^)]+)\)$/);
    if (m) {
      const p = m[1].split(/[,/\s]+/).filter(Boolean).map(parseFloat);
      v = [p[0], p[1], p[2], p.length > 3 ? p[3] : 1];
    } else if ((m = c.match(/^color\(srgb\s+([^)]+)\)$/))) {
      const p = m[1].split(/[\s/]+/).filter(Boolean).map(parseFloat);
      v = [p[0] * 255, p[1] * 255, p[2] * 255, p.length > 3 ? p[3] : 1];
    } else if (c !== 'transparent') {
      ctx.fillStyle = '#000'; ctx.fillStyle = c;
      const s = ctx.fillStyle;
      if (s.startsWith('#')) v = [parseInt(s.slice(1, 3), 16), parseInt(s.slice(3, 5), 16), parseInt(s.slice(5, 7), 16), 1];
      else if (s !== c) v = rgba(s);
    }
    v = [Math.round(v[0]), Math.round(v[1]), Math.round(v[2]), Math.round(v[3] * 1000) / 1000];
    colorCache.set(c, v);
    return v;
  };
  const px = (s) => { const n = parseFloat(s); return Number.isFinite(n) ? n : 0; };
  const round = (n) => Math.round(n * 100) / 100;
  const metricCache = new Map();
  const ascentRatio = (cs) => {
    const key = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontFamily}`;
    if (!metricCache.has(key)) {
      ctx.font = `${cs.fontStyle} ${cs.fontWeight} 100px ${cs.fontFamily}`;
      const m = ctx.measureText('Hg');
      const a = m.fontBoundingBoxAscent || 80, d = m.fontBoundingBoxDescent || 20;
      metricCache.set(key, a / (a + d));
    }
    return metricCache.get(key);
  };

  const SKIP = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE', 'HEAD', 'META', 'LINK', 'TITLE', 'BR', 'WBR', 'SOURCE', 'TRACK', 'NEXT-ROUTE-ANNOUNCER']);
  const MEDIA = 'img, video, canvas, svg, picture, .dh-shot, .home-device, .more-work-cover, .devsign-loop, .gemini-phone';
  const BLOCK = '.page-curtain, .menu-sheet, .project-zoom, .about-entrance, [hidden]';
  const items = [];
  const late = [];
  const counters = new Map();
  let n = 0;
  const full = { x: 0, y: 0, w: W, h: H };
  const cut = (a, b) => {
    const x = Math.max(a.x, b.x), y = Math.max(a.y, b.y);
    const r = Math.min(a.x + a.w, b.x + b.w), bt = Math.min(a.y + a.h, b.y + b.h);
    return { x, y, w: Math.max(0, r - x), h: Math.max(0, bt - y) };
  };
  const radiusOf = (cs, r) => {
    const raw = cs.borderTopLeftRadius || '0';
    let v = raw.includes('%') ? (parseFloat(raw) / 100) * Math.min(r.w, r.h) : px(raw);
    return round(Math.max(0, Math.min(v, r.w / 2, r.h / 2)));
  };
  const splitTop = (s) => {
    const parts = []; let depth = 0, cur = '';
    for (const ch of s) {
      if (ch === '(') depth++; if (ch === ')') depth--;
      if (ch === ',' && depth === 0) { parts.push(cur.trim()); cur = ''; } else cur += ch;
    }
    if (cur.trim()) parts.push(cur.trim());
    return parts;
  };
  // The bottom-most linear-gradient layer, as absolute start and end points.
  const linear = (image, r) => {
    const layers = splitTop(image).filter((l) => l.startsWith('linear-gradient('));
    if (!layers.length) return null;
    const args = splitTop(layers[layers.length - 1].slice('linear-gradient('.length, -1));
    let angle = 180;
    const first = args[0];
    if (/^-?[\d.]+deg$/.test(first)) { angle = parseFloat(first); args.shift(); }
    else if (first.startsWith('to ')) {
      const t = first;
      angle = t === 'to top' ? 0 : t === 'to right' ? 90 : t === 'to bottom' ? 180 : t === 'to left' ? 270
        : t.includes('top') && t.includes('right') ? 45 : t.includes('bottom') && t.includes('right') ? 135
        : t.includes('bottom') && t.includes('left') ? 225 : 315;
      args.shift();
    }
    const rad = (angle * Math.PI) / 180, dx = Math.sin(rad), dy = -Math.cos(rad);
    const len = Math.abs(r.w * dx) + Math.abs(r.h * dy);
    // Stop positions come in % or px (a 140px scrim); anything else isn't drawn.
    const stops = args.map((a) => {
      const m = a.match(/^(.*?)(?:\s+(-?[\d.]+)(%|px))?$/);
      const pos = m && m[2] !== undefined ? (m[3] === 'px' ? parseFloat(m[2]) / (len || 1) : parseFloat(m[2]) / 100) : null;
      return { color: rgba((m ? m[1] : a).trim()), pos, raw: (m ? m[1] : a).trim() };
    });
    if (stops.length < 2 || stops.some((s) => !/^(rgba?\(|color\(|transparent$|#)/.test(s.raw))) return null;
    stops.forEach((s, i) => { if (s.pos === null) s.pos = i / (stops.length - 1); s.pos = Math.max(0, Math.min(1, s.pos)); });
    if (stops.every((s) => s.color[3] < 0.02)) return null;
    // "transparent" is transparent black: without premultiplied blending it greys the fade, so a
    // clear stop takes its neighbour's colour.
    stops.forEach((s, i) => {
      if (s.color[3] > 0.004) return;
      const near = [stops[i - 1], stops[i + 1]].find((o) => o && o.color[3] > 0.004);
      if (near) s.color = [near.color[0], near.color[1], near.color[2], 0];
    });
    const cx = r.x + r.w / 2, cy = r.y + r.h / 2;
    return { x1: round(cx - (len / 2) * dx), y1: round(cy - (len / 2) * dy), x2: round(cx + (len / 2) * dx), y2: round(cy + (len / 2) * dy), stops };
  };
  const box = (cs, r, o, clip, tag) => {
    const v = cut(r, clip);
    if (v.w < 0.5 || v.h < 0.5) return;
    const clipped = v.w < r.w - 0.5 || v.h < r.h - 0.5;
    const rad = clipped ? 0 : radiusOf(cs, r);
    const bg = rgba(cs.backgroundColor);
    const image = cs.backgroundImage && cs.backgroundImage !== 'none' ? cs.backgroundImage : '';
    const grad = image && !image.includes('url(') ? linear(image, r) : null;
    const bw = [px(cs.borderTopWidth), px(cs.borderRightWidth), px(cs.borderBottomWidth), px(cs.borderLeftWidth)];
    const bc = [rgba(cs.borderTopColor), rgba(cs.borderRightColor), rgba(cs.borderBottomColor), rgba(cs.borderLeftColor)];
    const bs = [cs.borderTopStyle, cs.borderRightStyle, cs.borderBottomStyle, cs.borderLeftStyle];
    const on = bw.map((w, i) => w > 0 && bs[i] !== 'none' && bs[i] !== 'hidden' && bc[i][3] > 0.02);
    let stroke = null;
    if (on.every(Boolean) && bw.every((w) => w === bw[0]) && bc.every((c) => c.join() === bc[0].join())) stroke = { color: bc[0], w: bw[0] };
    const ring = (cs.boxShadow || '').match(/(rgba?\([^)]+\)|color\([^)]+\))\s+0px\s+0px\s+0px\s+([\d.]+)px\s+inset/);
    if (!stroke && ring && rgba(ring[1])[3] > 0.02) stroke = { color: rgba(ring[1]), w: parseFloat(ring[2]) };
    const fill = grad ? { grad } : bg[3] > 0.01 ? { color: bg } : null;
    if (fill || stroke) items.push({ k: 'rect', id: `R${++n}__${rad}`, x: round(v.x), y: round(v.y), w: round(v.w), h: round(v.h), r: rad, fill, stroke, o, tag });
    if (!stroke && !clipped) {
      const side = [[r.x, r.y, r.w, bw[0]], [r.x + r.w - bw[1], r.y, bw[1], r.h], [r.x, r.y + r.h - bw[2], r.w, bw[2]], [r.x, r.y, bw[3], r.h]];
      on.forEach((yes, i) => {
        if (!yes) return;
        const [x, y, w, h] = side[i];
        items.push({ k: 'rect', id: `L${++n}`, x: round(x), y: round(y), w: round(w), h: round(h), r: 0, fill: { color: bc[i] }, o });
      });
    }
  };
  const inside = (x, y, c) => x >= c.x - 1 && x <= c.x + c.w + 1 && y >= c.y - 1 && y <= c.y + c.h + 1;
  const familyOf = (cs, text) => {
    if (/[ᄀ-ᇿ㄰-㆏가-힯]/.test(text)) return 'Noto Sans KR';
    return cs.fontFamily.split(',')[0].trim().replace(/^["']|["']$/g, '');
  };
  const textItem = (text, cs, left, top, bottom, o) => {
    const size = px(cs.fontSize);
    if (!size || !text.trim()) return null;
    let color = rgba(cs.getPropertyValue('-webkit-text-fill-color'));
    if (color[3] < 0.03) color = rgba(cs.color);
    if (color[3] < 0.03) return null;
    const tt = cs.textTransform;
    if (tt === 'uppercase') text = text.toUpperCase(); else if (tt === 'lowercase') text = text.toLowerCase();
    const family = familyOf(cs, text);
    const weight = Math.round(px(cs.fontWeight) / 100) * 100 || 400;
    const ls = cs.letterSpacing === 'normal' ? 0 : round(px(cs.letterSpacing));
    const it = { k: 'text', id: `T${++n}__${family.replace(/\s+/g, '_')}__${weight}${cs.fontStyle === 'italic' ? 'i' : ''}__${ls}`, x: round(left), y: round(top + (bottom - top) * ascentRatio(cs)), top: round(top), text, family, size: round(size), weight, color, o };
    items.push(it);
    return it;
  };
  const textNode = (node, cs, o, clip) => {
    const raw = node.nodeValue;
    if (!raw || !raw.trim()) return;
    const range = document.createRange();
    const lines = [];
    const push = (rect, str, space) => {
      if (rect.width <= 0 || rect.height <= 0) return;
      const last = lines[lines.length - 1];
      if (last && Math.abs(last.top - rect.top) < Math.max(3, rect.height * 0.4) && rect.left >= last.right - 2) {
        last.text += (space ? ' ' : '') + str; last.right = Math.max(last.right, rect.right);
      } else lines.push({ top: rect.top, bottom: rect.bottom, left: rect.left, right: rect.right, text: str });
    };
    const re = /\S+/g; let m; let prevEnd = -1;
    while ((m = re.exec(raw))) {
      const space = prevEnd >= 0 && m.index > prevEnd;
      range.setStart(node, m.index); range.setEnd(node, m.index + m[0].length);
      const rects = [...range.getClientRects()].filter((r) => r.width > 0);
      if (rects.length === 1) push(rects[0], m[0], space);
      else if (rects.length > 1) {
        let at = m.index, first = true;
        for (const ch of Array.from(m[0])) {
          range.setStart(node, at); range.setEnd(node, at + ch.length);
          const rr = [...range.getClientRects()].find((r) => r.width > 0);
          if (rr) push(rr, ch, first && space);
          first = false; at += ch.length;
        }
      }
      prevEnd = m.index + m[0].length;
    }
    for (const l of lines) {
      const x = l.left + sx, top = l.top + sy, bottom = l.bottom + sy;
      if (!inside((x + l.right + sx) / 2, (top + bottom) / 2, clip)) continue;
      textItem(l.text, cs, x, top, bottom, o);
    }
  };
  const content = (el, ps) => {
    let s = '';
    const re = /"((?:[^"\\]|\\.)*)"|counter\(\s*([\w-]+)\s*(?:,\s*([\w-]+)\s*)?\)|attr\(\s*([\w-]+)\s*\)/g; let m;
    while ((m = re.exec(ps.content))) {
      if (m[1] !== undefined) s += m[1].replace(/\\([0-9a-fA-F]{1,6})\s?/g, (_, h) => String.fromCodePoint(parseInt(h, 16))).replace(/\\(.)/g, '$1');
      else if (m[2]) { const v = String(counters.get(m[2]) ?? 0); s += m[3] === 'decimal-leading-zero' ? v.padStart(2, '0') : v; }
      else if (m[4]) s += el.getAttribute(m[4]) || '';
    }
    return s;
  };
  const count = (cs) => {
    for (const [prop, set] of [['counterReset', true], ['counterIncrement', false]]) {
      const v = cs[prop];
      if (!v || v === 'none') continue;
      const t = v.split(/\s+/);
      for (let i = 0; i < t.length; i += 2) {
        const amount = parseInt(t[i + 1], 10) || 0;
        counters.set(t[i], set ? amount : (counters.get(t[i]) ?? 0) + amount);
      }
    }
  };
  // ::before / ::after: generated text sits at the start or end of the element's own text;
  // an absolutely placed box with a fill or border becomes a rect.
  const pseudo = (el, which, cs, r, o, clip, from) => {
    const ps = getComputedStyle(el, which);
    if (!ps.content || ps.content === 'none' || ps.content === 'normal' || ps.display === 'none') return;
    const po = o * px(ps.opacity || '1');
    if (po < 0.03 || ps.visibility !== 'visible') return;
    count(ps);
    const str = content(el, ps);
    const abs = ps.position === 'absolute' || ps.position === 'fixed';
    if (str.trim()) {
      const own = items.slice(from).filter((i) => i.k === 'text');
      const ref = which === '::before' ? own[0] : own[own.length - 1];
      const size = px(ps.fontSize);
      let left = r.x + px(cs.borderLeftWidth) + px(cs.paddingLeft), top;
      if (abs && ps.left !== 'auto' && ps.top !== 'auto') { left = r.x + px(cs.borderLeftWidth) + px(ps.left); top = r.y + px(cs.borderTopWidth) + px(ps.top); }
      else if (ref) {
        top = ref.top + (ref.size - size) * 0.8;
        if (which === '::after') left = ref.x + ref.width + px(ps.marginLeft);
      } else top = r.y + px(cs.borderTopWidth) + px(cs.paddingTop);
      if (inside(left + 2, top + size / 2, clip)) textItem(str, ps, left, top, top + size * 1.3, po);
      return;
    }
    if (!abs) return;
    const w = px(ps.width), h = px(ps.height);
    if (!(w > 0 && h > 0) || ps.left === 'auto' || ps.top === 'auto') return;
    let host = el;
    while (host && host !== document.body && getComputedStyle(host).position === 'static') host = host.parentElement;
    const hr = host.getBoundingClientRect(), hs = getComputedStyle(host);
    let x = hr.left + sx + px(hs.borderLeftWidth) + px(ps.left), y = hr.top + sy + px(hs.borderTopWidth) + px(ps.top), bw = w, bh = h;
    const t = (ps.transform || '').match(/^matrix\(([^)]+)\)$/);
    if (t) {
      const p = t[1].split(',').map(parseFloat);
      const [ox, oy] = (ps.transformOrigin || '0 0').split(' ').map(px);
      if (Math.abs(p[1]) > 0.01 || Math.abs(p[2]) > 0.01) return;
      x += ox - ox * p[0] + p[4]; y += oy - oy * p[3] + p[5]; bw *= Math.abs(p[0]); bh *= Math.abs(p[3]);
    }
    if (bw < 0.5 && bh < 0.5) return;
    box(ps, { x, y, w: bw, h: bh }, po, clip, 'pseudo');
  };

  const walk = (el, op, clip) => {
    if (SKIP.has(el.tagName) || el.matches(BLOCK)) return;
    const cs = getComputedStyle(el);
    if (cs.display === 'none') return;
    const o = op * px(cs.opacity || '1');
    if (o < 0.03) return;
    count(cs);
    const hidden = cs.visibility !== 'visible';
    const b = el.getBoundingClientRect();
    const r = { x: b.left + sx, y: b.top + sy, w: b.width, h: b.height };
    if (el.matches(MEDIA)) {
      const v = cut(r, clip);
      if (!hidden && v.w >= 2 && v.h >= 2) {
        const id = `I${++n}`;
        el.setAttribute('data-fx', id);
        items.push({ k: 'img', id, x: round(v.x), y: round(v.y), w: round(v.w), h: round(v.h), o, png: el.tagName.toLowerCase() === 'svg', canvas: el.tagName === 'CANVAS' });
      }
      return;
    }
    if (el.hasAttribute('data-scramble') && el.querySelector('div')) {
      // The decoding headline is split into glyph boxes: one text per line.
      if (hidden) return;
      const rows = el.querySelectorAll('.scramble-line');
      for (const row of rows.length ? rows : [el]) {
        const walker = document.createTreeWalker(row, NodeFilter.SHOW_TEXT);
        const first = walker.nextNode();
        if (!first) continue;
        const range = document.createRange(); range.selectNodeContents(first);
        const fr = range.getClientRects()[0]; if (!fr) continue;
        textItem(row.textContent.replace(/\s+/g, ' ').trim(), getComputedStyle(first.parentElement), fr.left + sx, fr.top + sy, fr.bottom + sy, o);
      }
      return;
    }
    const isRoot = el === document.body || el === document.documentElement;
    const from = items.length;
    // The site header floats over the page (sticky, high z-index): its layers go on top.
    if (el.tagName === 'HEADER' && (cs.position === 'sticky' || cs.position === 'fixed') && !el.hasAttribute('data-fx-late')) {
      el.setAttribute('data-fx-late', '');
      walk(el, op, clip);
      late.push(...items.splice(from));
      return;
    }
    if (!hidden && !isRoot && r.w > 0 && r.h > 0 && cs.display !== 'contents') {
      if (cs.backgroundImage.includes('url(')) {
        const v = cut(r, clip);
        if (v.w >= 2 && v.h >= 2) {
          const id = `I${++n}`;
          el.setAttribute('data-fx', id); el.setAttribute('data-fx-self', '');
          items.push({ k: 'img', id, x: round(v.x), y: round(v.y), w: round(v.w), h: round(v.h), o });
        }
      } else box(cs, r, o, clip);
    }
    const afterOwn = items.length;
    let inner = clip;
    if (!isRoot && cs.display !== 'contents' && (cs.overflowX !== 'visible' || cs.overflowY !== 'visible')) inner = cut(clip, r);
    const kids = [...el.childNodes];
    for (const child of kids) {
      if (child.nodeType === 1) walk(child, o, inner);
      else if (child.nodeType === 3 && !hidden) textNode(child, cs, o, inner);
    }
    // A text item's width isn't known here; estimate it for ::after from the canvas.
    for (const it of items.slice(from)) if (it.k === 'text' && it.width === undefined) { ctx.font = `${it.weight} ${it.size}px ${cs.fontFamily}`; it.width = ctx.measureText(it.text).width; }
    if (!hidden && !isRoot) {
      // Generated boxes are usually a shade over the element's media (a scrim on a photo) with the
      // copy above them by z-index: they go right after the last image inside, or under everything.
      const mark = items.length;
      pseudo(el, '::before', cs, r, o, inner, from); pseudo(el, '::after', cs, r, o, inner, from);
      const added = items.splice(mark);
      const shades = added.filter((i) => i.k === 'rect'), words = added.filter((i) => i.k !== 'rect');
      let at = afterOwn;
      for (let i = items.length - 1; i >= afterOwn; i--) if (items[i].k === 'img') { at = i + 1; break; }
      items.splice(at, 0, ...shades);
      items.push(...words);
    }
  };

  const bodyBg = rgba(getComputedStyle(document.body).backgroundColor);
  const htmlBg = rgba(getComputedStyle(document.documentElement).backgroundColor);
  walk(document.body, 1, full);
  items.push(...late);
  return { W, H, bg: bodyBg[3] > 0.5 ? bodyBg : htmlBg[3] > 0.5 ? htmlBg : [255, 255, 255, 1], items };
}

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');
const hex = (c) => '#' + c.slice(0, 3).map((v) => Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0')).join('');
const alpha = (a) => (a < 0.999 ? ` fill-opacity="${Math.round(a * 1000) / 1000}"` : '');

function toSvg(data, images) {
  const defs = [];
  const body = [`<rect id="Background" x="0" y="0" width="${data.W}" height="${data.H}" fill="${hex(data.bg)}"/>`];
  let g = 0;
  for (const it of data.items) {
    if (it.k === 'rect') {
      let fill = 'none', fo = '';
      if (it.fill?.grad) {
        const gr = it.fill.grad, id = `g${++g}`;
        defs.push(`<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${gr.x1}" y1="${gr.y1}" x2="${gr.x2}" y2="${gr.y2}">${gr.stops.map((s) => `<stop offset="${Math.round(s.pos * 1000) / 1000}" stop-color="${hex(s.color)}"${s.color[3] * it.o < 0.999 ? ` stop-opacity="${Math.round(s.color[3] * it.o * 1000) / 1000}"` : ''}/>`).join('')}</linearGradient>`);
        fill = `url(#${id})`;
      } else if (it.fill?.color) { fill = hex(it.fill.color); fo = alpha(it.fill.color[3] * it.o); }
      let stroke = '', x = it.x, y = it.y, w = it.w, h = it.h;
      if (it.stroke) {
        const sw = it.stroke.w;
        x += sw / 2; y += sw / 2; w = Math.max(0.1, w - sw); h = Math.max(0.1, h - sw);
        const so = it.stroke.color[3] * it.o;
        stroke = ` stroke="${hex(it.stroke.color)}" stroke-width="${sw}"${so < 0.999 ? ` stroke-opacity="${Math.round(so * 1000) / 1000}"` : ''}`;
      }
      body.push(`<rect id="${it.id}" x="${x}" y="${y}" width="${w}" height="${h}"${it.r ? ` rx="${it.r}"` : ''} fill="${fill}"${fo}${stroke}/>`);
    } else if (it.k === 'text') {
      body.push(`<text id="${it.id}" x="${it.x}" y="${it.y}" font-family="${it.family}" font-size="${it.size}" font-weight="${it.weight}" fill="${hex(it.color)}"${alpha(it.color[3] * it.o)}>${esc(it.text)}</text>`);
    } else if (it.k === 'img' && images[it.id]) {
      const im = images[it.id];
      body.push(`<image id="${it.id}" x="${it.x}" y="${it.y}" width="${it.w}" height="${it.h}" preserveAspectRatio="none"${it.o < 0.999 ? ` opacity="${Math.round(it.o * 1000) / 1000}"` : ''} xlink:href="data:image/${im.type};base64,${im.data}"/>`);
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${data.W}" height="${data.H}" viewBox="0 0 ${data.W} ${data.H}">\n<defs>${defs.join('')}</defs>\n${body.join('\n')}\n</svg>\n`;
}

async function build(browser, frame) {
  const ctx = await browser.newContext({ viewport: { width: frame.w, height: frame.h }, deviceScaleFactor: frame.w > 1000 ? 1.5 : 2, colorScheme: frame.scheme, reducedMotion: frame.motion ? 'no-preference' : 'reduce' });
  const page = await ctx.newPage();
  await page.goto(BASE + frame.url, { waitUntil: 'networkidle' });
  await wait(frame.motion ? 4500 : 1500);
  if (!frame.motion) {
    // Walk the page once so lazy images and observers have run, then come back to the top.
    const height = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < height; y += 700) { await page.evaluate((v) => window.scrollTo(0, v), y); await wait(60); }
    await page.evaluate(() => window.scrollTo(0, 0));
    await wait(600);
  }
  if (frame.hover) { await page.hover(`.home-picks [data-slug="${frame.hover}"]`); await wait(3000); }
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all([...document.images].map((i) => i.complete ? 0 : new Promise((r) => { i.onload = i.onerror = r; setTimeout(r, 4000); })));
  });
  const data = await page.evaluate(extract);
  // Each image is shot alone: everything beside it (and its ancestors' other children) is hidden,
  // so text and controls drawn over a photo don't get baked into it.
  await page.addStyleTag({ content: '*,*::before,*::after{transition:none!important}[data-fx-off]{opacity:0!important;animation:none!important}[data-fx-self][data-fx-on]>*{opacity:0!important}' });
  const cdp = await ctx.newCDPSession(page);
  const shots = data.items.filter((i) => i.k === 'img');
  const capture = async (scale, quality) => {
    const images = {}; let bytes = 0;
    for (const it of shots) {
      await page.evaluate((id) => {
        const el = document.querySelector(`[data-fx="${id}"]`);
        const off = []; let node = el;
        el.setAttribute('data-fx-on', '');
        while (node && node !== document.body) {
          const parent = node.parentElement; if (!parent) break;
          for (const s of parent.children) if (s !== node && s.tagName !== 'SCRIPT' && s.tagName !== 'STYLE') { s.setAttribute('data-fx-off', ''); off.push(s); }
          node = parent;
        }
        window.__fxOff = off;
      }, it.id);
      // A WebGL canvas only shows in an ordinary viewport screenshot (it sits at the top of the page).
      const shot = it.canvas
        ? { data: (await page.screenshot({ type: 'jpeg', quality, clip: { x: it.x, y: it.y, width: it.w, height: it.h } })).toString('base64') }
        : await cdp.send('Page.captureScreenshot', { format: it.png ? 'png' : 'jpeg', quality, captureBeyondViewport: true, clip: { x: it.x, y: it.y, width: it.w, height: it.h, scale: it.png ? 1 : scale } });
      await page.evaluate((id) => { for (const s of window.__fxOff) s.removeAttribute('data-fx-off'); document.querySelector(`[data-fx="${id}"]`).removeAttribute('data-fx-on'); }, it.id);
      images[it.id] = { type: it.png ? 'png' : 'jpeg', data: shot.data };
      bytes += shot.data.length;
    }
    return { images, bytes };
  };
  let shot = await capture(1, 88);
  if (shot.bytes > 8.6e6) shot = await capture(0.7, 84);
  if (shot.bytes > 8.6e6) shot = await capture(0.5, 80);
  const svg = toSvg(data, shot.images);
  const file = path.join(out, `${frame.name}.svg`);
  fs.writeFileSync(file, svg);
  const kinds = data.items.reduce((a, i) => { a[i.k] = (a[i.k] || 0) + 1; return a; }, {});
  console.log(JSON.stringify({ name: frame.name, w: data.W, h: data.H, ...kinds, mb: +(svg.length / 1e6).toFixed(2) }));
  await ctx.close();
}

(async () => {
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({ channel: 'chrome', args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
  for (const frame of FRAMES) {
    if (filter && !frame.name.includes(filter)) continue;
    try { await build(browser, frame); } catch (e) { console.error(frame.name, e.message); }
  }
  await browser.close();
})();
