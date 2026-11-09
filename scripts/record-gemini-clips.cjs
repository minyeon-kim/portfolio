// Records the two flows of the Gemini privacy prototype (minyeon-kim.github.io/gemini_privacy)
// as phone clips: A = check where an answer's personal info came from and stop it in place,
// B = ask in chat to clear it and see the result. 2x device pixels via the CDP screencast,
// cropped to the phone, with a soft touch dot showing each tap.
// Usage: node scripts/record-gemini-clips.cjs en|ko [A|B]
const { chromium } = require('/Users/minyeon/Projects/devsign/node_modules/playwright');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const lang = process.argv[2] || 'en';
const only = process.argv[3];
const OUT = path.join(require('os').tmpdir(), 'gemini-clips');
const REQUEST = { en: 'Stop using anything about Jeongmin in answers', ko: '앞으로 정민 관련 정보는 답변에 쓰지 말아 줘' }[lang];
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
// The phone frame on a 1440x900 page.
const PHONE = { x: 525, y: 38, w: 390, h: 822 };

let at = { x: 1200, y: 1300 };
async function move(page, x, y, n = 16) {
  const from = at;
  for (let i = 1; i <= n; i++) {
    const t = i / n, e = t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2;
    await page.mouse.move(from.x + (x - from.x) * e, from.y + (y - from.y) * e);
    await wait(14);
  }
  at = { x, y };
}
async function tap(page, tag, after = 700) {
  const el = page.locator(`[data-tag="${tag}"]:visible`).first();
  await el.evaluate((e) => e.scrollIntoView({ block: 'nearest', behavior: 'smooth' }));
  await wait(450);
  const b = await el.boundingBox();
  if (!b) throw new Error(`not found: ${tag}`);
  await move(page, b.x + b.width / 2, b.y + b.height / 2);
  await wait(160);
  await page.mouse.down(); await wait(90); await page.mouse.up();
  await wait(after);
}

const FLOWS = {
  async A(page, mark) {
    await tap(page, '상황1 시작', 500);
    mark();
    await tap(page, 'A1 입력창', 600);
    await tap(page, 'A1B 전송', 300);
    await wait(3600);
    mark();
    await tap(page, '출처 확인', 1100);
    mark();
    await tap(page, 'A3 주제 jm', 700);
    await tap(page, 'A3 선택 처리', 1600);
  },
  async B(page, mark) {
    await tap(page, '상황2 시작', 500);
    mark();
    await tap(page, 'B1 입력창', 300);
    await page.keyboard.type(REQUEST, { delay: 35 });
    await wait(300);
    await tap(page, 'B1 전송', 300);
    await wait(1900);
    mark();
    await wait(900);
    await tap(page, 'B2 선택 처리', 1400);
    mark();
    await wait(2400);
  },
};

async function record(browser, name) {
  const ctx = await browser.newContext({ viewport: { width: 1800, height: 1500 } });
  const page = await ctx.newPage();
  const order = name === 'B' ? '&order=ba' : '';
  await page.goto(`https://minyeon-kim.github.io/gemini_privacy/?mode=participant&lang=${lang}${order}`, { waitUntil: 'networkidle' });
  await page.evaluate(() => { document.documentElement.style.zoom = '1.5'; });
  await wait(300);
  await page.click('input[type=checkbox]');
  await page.click('#startBtn');
  await wait(600);
  // A soft touch dot that follows the mouse and pulses on press.
  await page.evaluate(() => {
    const d = document.createElement('div');
    d.style.cssText = 'position:fixed;left:0;top:0;width:34px;height:34px;margin:-17px 0 0 -17px;border-radius:50%;background:rgba(66,133,244,.28);box-shadow:0 0 0 2px rgba(66,133,244,.55);pointer-events:none;z-index:2147483647;transition:transform 120ms ease,background 120ms ease;';
    document.documentElement.appendChild(d);
    addEventListener('mousemove', (e) => { d.style.left = e.clientX / 1.5 + 'px'; d.style.top = e.clientY / 1.5 + 'px'; }, true);
    addEventListener('mousedown', () => { d.style.transform = 'scale(.78)'; d.style.background = 'rgba(66,133,244,.45)'; }, true);
    addEventListener('mouseup', () => { d.style.transform = ''; d.style.background = 'rgba(66,133,244,.28)'; }, true);
  });
  const phone = await page.locator('#phone').boundingBox();
  const pad = 0;
  const crop = { x: Math.round(phone.x - pad), y: Math.round(phone.y - pad), w: Math.round(phone.width + pad * 2), h: Math.round(phone.height + pad * 2) };
  crop.w -= crop.w % 2; crop.h -= crop.h % 2;
  console.error("crop", JSON.stringify(crop), JSON.stringify(phone));
  await page.mouse.move(at.x, at.y);
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
  await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 100, maxWidth: 3600, maxHeight: 3000, everyNthFrame: 1 });
  const marks = [];
  await wait(300);
  try {
    await FLOWS[name](page, () => marks.push(+(Date.now() / 1000 - t0).toFixed(2)));
  } catch (e) {
    console.error(name, e.message);
    await page.screenshot({ path: path.join(OUT, `${lang}-${name}-error.png`) });
  }
  await wait(500);
  await cdp.send('Page.stopScreencast');
  await Promise.all(writes);
  await ctx.close();
  const start = frames[0].t;
  const list = frames.map((f, i) => `file '${f.file}'\nduration ${Math.max(0.001, ((frames[i + 1]?.t ?? f.t + 0.5) - f.t)).toFixed(4)}`).join('\n') + `\nfile '${frames[frames.length - 1].file}'\n`;
  const listFile = path.join(dir, 'list.txt');
  fs.writeFileSync(listFile, list);
  const s = frames.length ? 2 : 2;
  const vf = `fps=30,crop=${crop.w * 2}:${crop.h * 2}:${crop.x * 2}:${crop.y * 2},scale=1200:-2:flags=lanczos:in_range=pc:out_range=tv,format=yuv420p`;
  const base = path.join(OUT, `${lang}-${name}`);
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', listFile, '-vf', vf, '-c:v', 'libx264', '-crf', '14', '-preset', 'slow', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709', '-color_range', 'tv', '-movflags', '+faststart', '-an', `${base}.mp4`]);
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-sseof', '-0.6', '-i', `${base}.mp4`, '-frames:v', '1', '-q:v', '4', `${base}-poster.jpg`]);
  const duration = +(frames[frames.length - 1].t - start + 0.5).toFixed(2);
  console.log(JSON.stringify({ name, lang, frames: frames.length, duration, marks: marks.map((m) => +(m - (start - t0)).toFixed(2)), size: fs.statSync(`${base}.mp4`).size }));
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ channel: 'chrome', args: ['--force-device-scale-factor=2'] });
  for (const name of Object.keys(FLOWS)) {
    if (only && only !== name) continue;
    await record(browser, name);
  }
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
