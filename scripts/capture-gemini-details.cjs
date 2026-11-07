// Captures the four UI details of the Gemini privacy prototype as crisp element shots
// (page zoomed 2x): the sources badge under an answer, the topic sheet, the found-items card
// and the result card. Usage: node scripts/capture-gemini-details.cjs en|ko
const { chromium } = require('/Users/minyeon/Projects/devsign/node_modules/playwright');
const path = require('path');
const { execFileSync } = require('child_process');

const lang = process.argv[2] || 'en';
const OUT = path.join(__dirname, '..', 'public/images/cases/gemini-privacy');
const TMP = require('os').tmpdir();
const REQUEST = { en: 'Stop using anything about Jeongmin in answers', ko: '앞으로 정민 관련 정보는 답변에 쓰지 말아 줘' }[lang];
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const tap = async (page, tag) => { const el = page.locator(`[data-tag="${tag}"]:visible`).first(); await el.scrollIntoViewIfNeeded(); await el.click(); await wait(700); };

async function open(browser, order) {
  const ctx = await browser.newContext({ viewport: { width: 2400, height: 2000 } });
  const page = await ctx.newPage();
  await page.goto(`https://minyeon-kim.github.io/gemini_privacy/?mode=participant&lang=${lang}${order}`, { waitUntil: 'networkidle' });
  await page.evaluate(() => { document.documentElement.style.zoom = '2'; });
  await page.click('input[type=checkbox]');
  await page.click('#startBtn');
  await wait(500);
  return { ctx, page };
}
async function shot(page, locator, name, pad = 16) {
  const b = await locator.boundingBox();
  const file = path.join(TMP, `${name}.png`);
  await page.screenshot({ path: file, clip: { x: b.x - pad, y: b.y - pad, width: b.width + pad * 2, height: b.height + pad * 2 } });
  execFileSync('cwebp', ['-quiet', '-q', '86', file, '-o', path.join(OUT, `${name}.webp`)]);
  console.log(name, Math.round(b.width + pad * 2), Math.round(b.height + pad * 2));
}

(async () => {
  const browser = await chromium.launch();
  {
    const { ctx, page } = await open(browser, '');
    await tap(page, '상황1 시작');
    await tap(page, 'A1 입력창');
    await tap(page, 'A1B 전송');
    await wait(4000);
    const badge = page.locator('.screen.active .msg-icons').first();
    await badge.scrollIntoViewIfNeeded();
    await wait(300);
    const para = page.locator('.screen.active .msg-icons').first().locator('xpath=preceding-sibling::p[1]');
    const a = await para.boundingBox(), c = await badge.boundingBox();
    const file = path.join(TMP, `detail-badge-${lang}.png`);
    await page.screenshot({ path: file, clip: { x: Math.min(a.x, c.x) - 24, y: a.y - 24, width: Math.max(a.width, c.width) + 48, height: c.y + c.height - a.y + 48 } });
    execFileSync('cwebp', ['-quiet', '-q', '86', file, '-o', path.join(OUT, `detail-badge-${lang}.webp`)]);
    console.log('badge', Math.round(Math.max(a.width, c.width) + 48), Math.round(c.y + c.height - a.y + 48));
    await tap(page, '출처 확인');
    await wait(600);
    await shot(page, page.locator('#sheetOverlay .sheet'), `detail-sheet-${lang}`, 0);
    await ctx.close();
  }
  {
    const { ctx, page } = await open(browser, '&order=ba');
    await tap(page, '상황2 시작');
    await tap(page, 'B1 입력창');
    await page.keyboard.type(REQUEST, { delay: 10 });
    await tap(page, 'B1 전송');
    await wait(2000);
    const card = page.locator('.screen.active .ai-card').first();
    await card.scrollIntoViewIfNeeded();
    await wait(300);
    await shot(page, card, `detail-found-${lang}`);
    await tap(page, 'B2 선택 처리');
    await wait(1500);
    await shot(page, page.locator('.screen.active .complete-card').first(), `detail-result-${lang}`);
    await ctx.close();
  }
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
