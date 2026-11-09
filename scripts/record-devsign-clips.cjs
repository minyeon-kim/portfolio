// Records short, sharp clips of the live Devsign prototype: 2x device pixels via
// the CDP screencast, the prototype's own named cursor driven by the real mouse, and
// zooms applied in the page so text stays crisp.
const { chromium } = require('/Users/minyeon/Projects/devsign/node_modules/playwright');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const lang = process.argv[2] || 'en';
const only = process.argv[3];
const OUT = path.join(require('os').tmpdir(), 'devsign-clips');
const L = {
  en: { closeNote: 'Close notification', ai: 'AI Chat', merge: 'Merge', mix: 'Mix', draft: 'Checkout draft mix', request: 'Merge request', send: 'Send review request', fix: 'Fix to the design', details: 'Change details', pin: 'PlaceOrderButton', history: 'History', conflict: 'Conflict', impact: 'Impact & evidence', tabs: ['Header', 'Order summary', 'Payment method', 'Checkout bar'] },
  ko: { closeNote: '알림 닫기', merge: 'Merge', send: '검토 요청 보내기', fix: '원안으로 수정', pin: 'PlaceOrderButton', history: '히스토리', conflict: '변경확인', tabs: ['헤더', '주문 요약', '결제 수단', '결제 바'] },
}[lang];

// The cover clip fills the 1.52:1 monitor on the case opener: no camera.
const VH = only === 'cover' ? 948 : 900;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function boot(browser) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: VH }, colorScheme: 'dark' });
  const page = await ctx.newPage();
  await page.goto(`https://minyeon-kim.github.io/devsign/?lang=${lang}`, { waitUntil: 'networkidle' });
  await wait(1200);
  await page.evaluate(() => {
    document.body.style.transformOrigin = '0 0';
    document.body.style.transition = 'transform 520ms cubic-bezier(.4,0,.2,1)';
  });
  return { ctx, page };
}


// Camera: everything is measured in untransformed page space; the current zoom maps
// it to the screen. The camera only moves forward from region to region (no zooming
// back out between steps), so each clip reads as one continuous flow.
let Z = { s: 1, tx: 0, ty: 0 };
const T = 520;
const scr = (x, y) => ({ x: x * Z.s + Z.tx, y: y * Z.s + Z.ty });

const locate = (page, name, i = 0) => page.evaluate(([n, idx, z]) => {
  const hits = [...document.querySelectorAll('button,a,[role=button],[role=tab],div[tabindex]')].map((e) => {
    const b = e.getBoundingClientRect();
    return { e, r: { x: (b.x - z.tx) / z.s, y: (b.y - z.ty) / z.s, w: b.width / z.s, h: b.height / z.s } };
  }).filter(({ e, r }) => {
    if (!r.w || r.x + r.w < 0 || r.y + r.h < 0 || r.x > innerWidth || r.y > innerHeight) return false;
    const t = (e.innerText || e.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim();
    return t.startsWith(n) || (e.getAttribute('aria-label') || '').startsWith(n);
  });
  const list = idx === 'right' ? hits.filter((h) => h.r.x > 940) : hits;
  const k = idx === 'right' ? 0 : idx;
  return list[k] ? list[k].r : null;
}, [name, i, Z]);

const rects = (page, fn) => page.evaluate(([f, z]) => {
  const test = new Function('r', `return (${f})`);
  return [...document.querySelectorAll('button,div[tabindex],[role=button]')].map((e) => {
    const b = e.getBoundingClientRect();
    return { x: (b.x - z.tx) / z.s, y: (b.y - z.ty) / z.s, w: b.width / z.s, h: b.height / z.s };
  }).filter((r) => r.w && test(r));
}, [fn, Z]);

let at = { x: 720, y: 470 };
async function moveScreen(page, x, y, n = 14) {
  const from = at;
  for (let i = 1; i <= n; i++) {
    const t = i / n, e = t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2;
    await page.mouse.move(from.x + (x - from.x) * e, from.y + (y - from.y) * e);
    await wait(12);
  }
  at = { x, y };
}
const moveTo = (page, x, y) => { const p = scr(x, y); return moveScreen(page, p.x, p.y); };
async function clickAt(page, x, y, after = 300) {
  await moveTo(page, x, y);
  await wait(90);
  const p = scr(x, y);
  await page.mouse.click(p.x, p.y);
  await wait(after);
}
async function click(page, name, opts = {}) {
  const r = await locate(page, name, opts.i ?? 0);
  if (!r) throw new Error(`not found: ${name}`);
  await clickAt(page, r.x + r.w / 2, r.y + r.h / 2, opts.after ?? 300);
  return r;
}
// Moves the camera so `rect` fills the frame (null = whole screen). The mouse rides
// along with the content it sits on, so the cursor doesn't slide over the picture.
async function cam(page, rect, hold = 300) {
  const next = await page.evaluate((r) => {
    if (!r) return { s: 1, tx: 0, ty: 0 };
    const pad = 24;
    const s = Math.min(innerWidth / (r.w + pad * 2), innerHeight / (r.h + pad * 2));
    let tx = innerWidth / 2 - (r.x + r.w / 2) * s;
    let ty = innerHeight / 2 - (r.y + r.h / 2) * s;
    tx = Math.min(0, Math.max(innerWidth - innerWidth * s, tx));
    ty = Math.min(0, Math.max(innerHeight - innerHeight * s, ty));
    return { s, tx, ty };
  }, rect);
  const page0 = { x: (at.x - Z.tx) / Z.s, y: (at.y - Z.ty) / Z.s };
  await page.evaluate((z) => { document.body.style.transform = `translate(${z.tx}px,${z.ty}px) scale(${z.s})`; }, next);
  Z = next;
  const p = scr(page0.x, page0.y);
  const m = moveScreen(page, Math.max(4, Math.min(1436, p.x)), Math.max(4, Math.min(VH - 4, p.y)), 30);
  await Promise.all([m, wait(T)]);
  await wait(hold);
}

const screens = (page, row) => page.evaluate((rowIndex) => {
  const all = [...document.querySelectorAll('button')].filter((e) => (e.innerText || '').startsWith('9:41')).map((e) => e.getBoundingClientRect());
  const ys = [...new Set(all.map((r) => Math.round(r.y)))].sort((a, b) => a - b);
  const rs = all.filter((r) => Math.round(r.y) === ys[rowIndex]);
  return rs.map((r) => ({ x: r.x, y: r.y, w: r.width, h: r.height }));
}, row);

async function closeExtras(page) {
  for (let n = 0; n < 4; n++) { const r = await locate(page, L.closeNote); if (!r) break; await page.mouse.click(r.x + r.w / 2, r.y + r.h / 2); await wait(150); }
  at = { x: 720, y: 470 };
  await page.mouse.move(at.x, at.y);
  await wait(200);
  const lifted = await page.evaluate(() => {
    const c = document.querySelector('.z-\\[2147483647\\].fixed');
    if (c) document.documentElement.appendChild(c);
    return !!c;
  });
  if (!lifted) throw new Error('named cursor not found');
}
const box = (rs, pad = 0) => { const x = Math.min(...rs.map((r) => r.x)) - pad, y = Math.min(...rs.map((r) => r.y)) - pad; return { x, y, w: Math.max(...rs.map((r) => r.x + r.w)) + pad - x, h: Math.max(...rs.map((r) => r.y + r.h)) + pad - y }; };

const CLIPS = {
  // See: the whole board, then straight into the row of screens, across it, onto the
  // change mark.
  async workspace(page, mark) {
    const row = await screens(page, 1);
    const plus = await locate(page, '+4');
    await wait(500);
    mark();
    await cam(page, box(row), 500);
    mark();
    await cam(page, { x: plus.x - 140, y: plus.y - 110, w: 300, h: 240 }, 120);
    await moveTo(page, plus.x + plus.w / 2, plus.y + plus.h / 2);
    await wait(500);
    await wait(700);
  },
  // Merge: drafts → pick each region → merge request → send, the camera on each step.
  async merge(page, mark) {
    await click(page, L.merge, { after: 450 });
    mark();
    await cam(page, { x: 952, y: 96, w: 476, h: 790 }, 100);
    await clickAt(page, 1190, 145, 450);
    await clickAt(page, 1389, 863, 450); // Mix
    mark();
    await cam(page, { x: 430, y: 100, w: 1000, h: 700 }, 100);
    const count = () => page.evaluate(() => +((document.body.innerText.match(/(\d)\/4 /) || [0, 0])[1]));
    for (const [tab, pick] of [[L.tabs[0], 1], [L.tabs[1], 0], [L.tabs[2], 1], [L.tabs[3], 0]]) {
      await click(page, tab, { after: 220, i: 'right' });
      const before = await count();
      const opts = await rects(page, 'r.h > 70 && r.x > 700 && r.w > 300 && r.y < innerHeight');
      for (const k of [pick, 1 - pick, 2]) {
        const o = opts[k];
        if (!o) continue;
        await clickAt(page, o.x + o.w / 2, o.y + o.h / 2, 240);
        if ((await count()) > before) break;
      }
    }
    console.error('selected', await count());
    mark();
    await cam(page, { x: 1040, y: 560, w: 400, h: 330 }, 100);
    await clickAt(page, 1348, 863, 650); // Merge request
    if (!(await locate(page, L.send))) console.error('no send dialog');
    const send = await locate(page, L.send);
    if (send) {
      const dlg = (await rects(page, `r.w > 360 && r.w < 900 && r.h > 200 && r.x < ${send.x} && r.x + r.w > ${send.x + send.w} && r.y < ${send.y}`)).sort((a, b) => a.w * a.h - b.w * b.h)[0];
      await cam(page, dlg ? { x: dlg.x, y: dlg.y, w: dlg.w, h: dlg.h } : { x: send.x - 300, y: send.y - 300, w: send.w + 340, h: 360 }, 200);
      await clickAt(page, send.x + send.w / 2, send.y + send.h / 2, 900);
    }
  },
  // Decide: change list → the pin → its details → fix to the design.
  // The whole screen with no camera move, for the case cover's monitor.
  async cover(page, mark) {
    // A second person on the same screen: Jordan's cursor, a copy of the prototype's own
    // cursor in Jordan's colour, moving on a fixed path while the real mouse drives Taylor.
    await page.evaluate(() => {
      const j = document.createElement('div');
      j.dataset.cover = 'jordan';
      j.style.cssText = 'position:fixed;left:420px;top:640px;z-index:2147483646;pointer-events:none;';
      j.innerHTML = `<svg width="19" height="19" viewBox="0 0 24 24" fill="none" style="filter:drop-shadow(0 1px 2px rgba(0,0,0,.5))"><path d="M4.037 4.688a.495.495 0 0 1 .651-.651l16 6.5a.5.5 0 0 1-.063.947l-6.124 1.58a2 2 0 0 0-1.438 1.435l-1.579 6.126a.5.5 0 0 1-.947.063z" fill="#0ea5e9" stroke="rgba(0,0,0,.25)" stroke-width="1" stroke-linejoin="round"/></svg><span style="position:absolute;top:14px;left:14px;display:inline-flex;align-items:center;border-radius:999px;padding:2px 8px;font-size:10px;line-height:1;font-weight:500;color:#fff;white-space:nowrap;background:#0ea5e9">Jordan</span>`;
      document.body.appendChild(j);
      // Time (s), x, y on the 1440x1125 screen.
      const path = [[0, 420, 640], [1.6, 470, 760], [3.2, 520, 640], [5.0, 470, 610], [6.8, 1130, 400], [9.5, 1150, 420]];
      const ease = (t) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2);
      const t0 = performance.now();
      const tick = (now) => {
        const t = (now - t0) / 1000; let i = 0;
        while (i < path.length - 2 && t > path[i + 1][0]) i++;
        const [a, ax, ay] = path[i]; const [b, bx, by] = path[i + 1];
        const k = ease(Math.min(1, Math.max(0, (t - a) / (b - a))));
        j.style.left = `${ax + (bx - ax) * k}px`; j.style.top = `${ay + (by - ay) * k}px`;
        // The prototype's own resting "Jordan" presence would be a second copy.
        document.querySelectorAll('body *').forEach((e) => { if (e.children.length === 0 && e.textContent.trim() === 'Jordan' && !j.contains(e) && e.offsetWidth < 90) { const box = e.parentElement; if (box && getComputedStyle(box).position === 'absolute') box.style.visibility = 'hidden'; } });
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    await wait(900);
    await click(page, '+4', { after: 1100 });
    mark();
    await click(page, L.pin, { after: 2200 });
    mark();
    await click(page, L.fix, { after: 2600 });
  },
  async conflict(page, mark) {
    await click(page, '+4', { after: 700 });
    mark();
    await cam(page, { x: 560, y: 90, w: 340, h: 760 }, 200);
    await click(page, L.pin, { after: 450 });
    mark();
    await cam(page, { x: 960, y: 130, w: 460, h: 320 }, 700);
    mark();
    await cam(page, { x: 960, y: 370, w: 460, h: 520 }, 200);
    await click(page, L.fix, { after: 1000 });
  },
  // Record: History list → open an entry → its header with the decision and reason.
  async history(page, mark) {
    await click(page, '+4', { after: 600 });
    await click(page, L.history, { after: 600 });
    mark();
    await cam(page, { x: 50, y: 44, w: 270, h: 420 }, 200);
    const items = await rects(page, 'r.x > 60 && r.x < 90 && r.h > 40');
    if (items[1]) await clickAt(page, items[1].x + items[1].w / 2, items[1].y + items[1].h / 2, 300);
    mark();
    await cam(page, { x: 340, y: 84, w: 760, h: 300 }, 900);
    mark();
    await cam(page, { x: 340, y: 84, w: 1090, h: 700 }, 1100);
  },
};

async function record(browser, name) {
  const { ctx, page } = await boot(browser);
  await closeExtras(page);
  const dir = path.join(OUT, `${lang}-${name}`);
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  const cdp = await ctx.newCDPSession(page);
  const frames = [];
  const writes = [];
  cdp.on('Page.screencastFrame', async ({ data, metadata, sessionId }) => {
    const file = path.join(dir, `f${String(frames.length).padStart(5, '0')}.jpg`);
    frames.push({ file, t: metadata.timestamp });
    writes.push(fs.promises.writeFile(file, Buffer.from(data, 'base64')));
    cdp.send('Page.screencastFrameAck', { sessionId }).catch(() => {});
  });
  const t0 = Date.now() / 1000;
  await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 100, maxWidth: 2880, maxHeight: VH * 2, everyNthFrame: 1 });
  const marks = [];
  await wait(200);
  try {
    await CLIPS[name](page, () => marks.push(+(Date.now() / 1000 - t0).toFixed(2)));
  } catch (e) {
    console.error(name, e.message);
    await page.screenshot({ path: path.join(OUT, `${lang}-${name}-error.png`) });
  }
  await wait(400);
  await page.screenshot({ path: path.join(OUT, `${lang}-${name}-end.png`) });
  await cdp.send('Page.stopScreencast');
  await Promise.all(writes);
  await ctx.close();
  if (!frames.length) throw new Error('no frames');
  const start = frames[0].t;
  const list = frames.map((f, i) => `file '${f.file}'\nduration ${Math.max(0.001, ((frames[i + 1]?.t ?? f.t + 0.5) - f.t)).toFixed(4)}`).join('\n') + `\nfile '${frames[frames.length - 1].file}'\n`;
  const listFile = path.join(dir, 'list.txt');
  fs.writeFileSync(listFile, list);
  const vf = `fps=30,scale=${only === 'cover' ? '1440:948' : '2400:1500'}:flags=lanczos+accurate_rnd+full_chroma_inp+full_chroma_int:in_range=pc:out_range=tv:in_color_matrix=bt601:out_color_matrix=bt709,format=yuv420p`;
  const base = path.join(OUT, `${lang}-${name}`);
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', listFile, '-vf', vf, '-c:v', 'libx264', '-crf', '14', '-preset', 'slow', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709', '-color_range', 'tv', '-movflags', '+faststart', '-an', `${base}.mp4`]);
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', `${base}.mp4`, '-vf', 'select=eq(n\\,0)', '-frames:v', '1', '-q:v', '2', `${base}-poster.jpg`]);
  const duration = +(frames[frames.length - 1].t - start + 0.5).toFixed(2);
  console.log(JSON.stringify({ name, lang, frames: frames.length, duration, marks: marks.map((m) => +(m - (start - t0)).toFixed(2)), size: fs.statSync(`${base}.mp4`).size }));
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ channel: 'chrome', args: ['--force-device-scale-factor=2'] });
  for (const name of Object.keys(CLIPS)) {
    if (only && only !== name) continue;
    await record(browser, name);
  }
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
