// Records the main monitor's screen for the hero video: Merge Studio at 1920x1080 (2x capture), the mixed screen at 160% in the
// middle of the canvas, built up part by part (Header, Order summary, Payment method, Checkout bar) with Taylor's cursor.
const { chromium } = require('/Users/minyeon/Projects/devsign/node_modules/playwright');
const fs = require('fs'), path = require('path'); const { execFileSync } = require('child_process');
const W = 1920, H = 1080, OUT = process.argv[2], LEN = +process.env.LEN || 16;
const UI = process.env.UI || 'en';
const L = { en: { close: 'Close notification', tabs: ['Header', 'Order summary', 'Payment method', 'Checkout bar'] }, ko: { close: '알림 닫기', tabs: ['헤더', '주문 요약', '결제 수단', '결제 바'] } }[UI];
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const loc = (page, name, right, exact) => page.evaluate(([n, rt, ex]) => {
  const hits = [...document.querySelectorAll('button,a,[role=button],[role=tab],div[tabindex]')].map((e) => ({ e, r: e.getBoundingClientRect() })).filter(({ e, r }) => {
    if (!r.width || r.x > innerWidth || r.y > innerHeight || r.bottom < 0) return false;
    const t = (e.innerText || e.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim();
    return ex ? t === n : (t.startsWith(n) || (e.getAttribute('aria-label') || '').startsWith(n));
  }).filter(({ r }) => !rt || r.x > innerWidth - 560);
  const h = ex ? hits.sort((a, b) => b.r.y - a.r.y)[0] : hits[0]; return h ? { x: h.r.x + h.r.width / 2, y: h.r.y + h.r.height / 2 } : null;
}, [name, !!right, !!exact]);
let at = { x: 1030, y: 500 };
async function glide(page, x, y, ms = 520) {
  const n = Math.max(8, Math.round(ms / 16)); const from = at;
  for (let i = 1; i <= n; i++) { const t = i / n, e = t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2; await page.mouse.move(from.x + (x - from.x) * e, from.y + (y - from.y) * e); await wait(ms / n); }
  at = { x, y };
}
const tap = async (page, name, right, after = 500, exact = false, ms = 0) => { const p = await loc(page, name, right, exact); if (!p) { console.log('missing', name); return false; } if (ms) await glide(page, p.x, p.y, ms); else await page.mouse.move(p.x, p.y, { steps: 4 }); await wait(90); await page.mouse.click(p.x, p.y); at = p; await wait(after); return true; };
const phone = (page) => page.evaluate(() => { const c = [...document.querySelectorAll('div,section,button,iframe')].map((e) => e.getBoundingClientRect()).filter((r) => r.x > 60 && r.right < innerWidth - 480 && r.width > 180 && r.width < 900 && r.height > r.width * 1.7 && r.height < r.width * 2.4); c.sort((p, q) => q.width * q.height - p.width * p.height); const r = c[0]; return r ? { x: r.x, y: r.y, w: r.width, h: r.height } : null; });
const options = (page) => page.evaluate(() => [...document.querySelectorAll('button,div[tabindex],[role=button]')].map((e) => e.getBoundingClientRect()).filter((r) => r.height > 70 && r.x > innerWidth - 560 && r.width > 300 && r.y < innerHeight).map((r) => ({ x: r.x + r.width / 2, y: r.y + r.height / 2 })));
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', args: ['--force-device-scale-factor=2'] });
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, colorScheme: 'dark' });
  const page = await ctx.newPage();
  await page.goto(`https://minyeon-kim.github.io/devsign/?lang=${UI}`, { waitUntil: 'networkidle' });
  await wait(1500);
  for (let i = 0; i < 4; i++) { if (!(await tap(page, L.close, false, 200))) break; }
  await tap(page, 'Merge'); await page.mouse.click(W - 250, 145); await wait(500); await page.mouse.click(W - 51, H - 37); await wait(900);
  // 160%, centred on the canvas
  const zin = await page.evaluate(() => [...document.querySelectorAll('button')].map((e) => ({ a: e.getAttribute('aria-label') || e.getAttribute('title') || '', r: e.getBoundingClientRect() })).filter((b) => b.r.y > innerHeight - 90 && b.r.x > 500 && b.r.x < innerWidth - 600).map((b) => ({ a: b.a, x: b.r.x + b.r.width / 2, y: b.r.y + b.r.height / 2 })).filter((b) => { const top = document.elementFromPoint(b.x, b.y); const btn = top && top.closest('button'); return btn && (btn.getAttribute('aria-label') || btn.getAttribute('title') || '') === b.a; }));
  const plus = zin.find((b) => /zoom in|확대/i.test(b.a)) || zin[2]; console.log('zoom controls', JSON.stringify(zin.map((b) => b.a)));
  for (let i = 0; i < 6 && plus; i++) { await page.mouse.click(plus.x, plus.y); await wait(350); }
  const panelLeft = W - 495;
  const p = await phone(page); console.log('phone', p);
  if (p) {
    // pan by wheel; the page moves k px per wheel unit (k depends on the device scale), so measure it first
    const cx = (48 + panelLeft) / 2, cy = (96 + H - 70) / 2;
    await page.mouse.move(cx - 300, cy); await page.mouse.wheel(40, 40); await wait(500);
    const p1 = await phone(page); const kx = (p.x - p1.x) / 40 || 1, ky = (p.y - p1.y) / 40 || 1;
    await page.mouse.wheel(((p1.x + p1.w / 2) - cx) / kx, ((p1.y + p1.h / 2) - cy) / ky); await wait(600);
    const p2 = await phone(page); console.log('k', kx, ky, 'phone centred', p2, 'target', cx, cy);
  }
  at = { x: 1030, y: 500 }; await page.mouse.move(at.x, at.y, { steps: 6 }); await wait(900);
  const dir = path.join(OUT, `rec-merge-${UI}`); fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
  const cdp = await ctx.newCDPSession(page); const frames = []; const writes = [];
  cdp.on('Page.screencastFrame', async ({ data, metadata, sessionId }) => { const file = path.join(dir, `f${String(frames.length).padStart(5, '0')}.jpg`); frames.push({ file, t: metadata.timestamp }); writes.push(fs.promises.writeFile(file, Buffer.from(data, 'base64'))); cdp.send('Page.screencastFrameAck', { sessionId }).catch(() => {}); });
  await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 100, maxWidth: W * 2, maxHeight: H * 2, everyNthFrame: 1 });
  const t0 = Date.now();
  await wait(900);
  for (const [tab, pick] of [[L.tabs[0], 1], [L.tabs[1], 0], [L.tabs[2], 1], [L.tabs[3], 1]]) {
    await tap(page, tab, true, 300, false, 440);
    const opts = await options(page); const o = opts[pick] || opts[0];
    if (o) { await glide(page, o.x, o.y, 420); await wait(160); await page.mouse.click(o.x, o.y); await wait(760); }
    console.log(tab, ((Date.now() - t0) / 1000).toFixed(2));
  }
  await glide(page, 1030, 520, 900);                     // back to the canvas, beside the mixed screen
  while ((Date.now() - t0) / 1000 < LEN - 0.3) { await page.mouse.move(at.x + (Math.random() < 0.5 ? 0.5 : 0), at.y); await wait(250); }
  await cdp.send('Page.stopScreencast'); await Promise.all(writes); await ctx.close(); await browser.close();
  const list = frames.map((f, i) => `file '${f.file}'\nduration ${Math.max(0.001, ((frames[i + 1]?.t ?? f.t + 0.6) - f.t)).toFixed(4)}`).join('\n') + `\nfile '${frames[frames.length - 1].file}'\n`;
  fs.writeFileSync(path.join(dir, 'list.txt'), list);
  const vf = `fps=24,tpad=stop_mode=clone:stop_duration=2,scale=${W}:${H}:flags=lanczos+accurate_rnd+full_chroma_inp+full_chroma_int:in_range=pc:out_range=tv:in_color_matrix=bt601:out_color_matrix=bt709,format=yuv420p`;
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', path.join(dir, 'list.txt'), '-vf', vf, '-t', String(LEN), '-c:v', 'libx264', '-crf', '12', '-preset', 'slow', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709', '-color_range', 'tv', '-an', path.join(OUT, `screen-merge16-${UI}.mp4`)]);
  console.log('frames', frames.length, 'span', (frames[frames.length - 1].t - frames[0].t).toFixed(2));
})().catch((e) => { console.error(e); process.exit(1); });
