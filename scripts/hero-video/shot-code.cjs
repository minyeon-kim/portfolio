// Second monitor: the prototype's Code view (the developer's side), W x H logical at 2x.
const { chromium } = require('/Users/minyeon/Projects/devsign/node_modules/playwright');
const W = +process.env.W || 1920, H = +process.env.H || 1080, OUT = process.argv[2];
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const loc = (page, name) => page.evaluate((n) => {
  const hits = [...document.querySelectorAll('button,a,[role=button],[role=tab],div[tabindex]')].map((e) => ({ e, r: e.getBoundingClientRect() })).filter(({ e, r }) => {
    if (!r.width || r.x > innerWidth || r.y > innerHeight || r.bottom < 0) return false;
    const t = (e.innerText || e.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim();
    return t === n || (e.getAttribute('aria-label') || '') === n;
  });
  const h = hits[0]; return h ? { x: h.r.x + h.r.width / 2, y: h.r.y + h.r.height / 2 } : null;
}, name);
const tap = async (page, name, after = 500) => { const p = await loc(page, name); console.log(name, p); if (!p) return false; await page.mouse.move(p.x, p.y, { steps: 6 }); await page.mouse.click(p.x, p.y); await wait(after); return true; };
(async () => {
  const browser = await chromium.launch({ channel: 'chrome' });
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 2, colorScheme: 'dark' });
  const page = await ctx.newPage();
  await page.goto('https://minyeon-kim.github.io/devsign/?lang=' + (process.env.UI || 'en') + '', { waitUntil: 'networkidle' });
  await wait(1500);
  for (let i = 0; i < 4; i++) { if (!(await tap(page, process.env.UI === 'ko' ? '알림 닫기' : 'Close notification', 200))) break; }
  await tap(page, process.env.UI === 'ko' ? '코드' : 'Code', 1500);
  await page.mouse.move(Math.round(W * 0.42), Math.round(H * 0.55), { steps: 12 }); await wait(700);
  await page.screenshot({ path: `${OUT}/${process.env.NAME || 'shot-code'}.png` });
  await ctx.close(); await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
