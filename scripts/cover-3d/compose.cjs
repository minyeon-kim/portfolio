// Lays the Blender render over the backdrop and cuts the screen hole: node compose.cjs in.png out.png [webp]
const sharp = require('/Users/minyeon/Projects/portfolio/node_modules/sharp');
const [, , input, out] = process.argv;
const CORNERS = [[431.1, 86.3], [1071.2, 89.5], [1036.4, 596.4], [397.1, 553.2]];
const GLOWS = [[120, -40, 1000, 720, '92,66,188', 1], [1460, 860, 900, 600, '106,76,214', 1]];
(async () => {
  const { width: W, height: H } = await sharp(input).metadata();
  const k = W / 1440;
  const grads = GLOWS.map(([x, y, rx, ry, c], i) => `<radialGradient id="g${i}" gradientUnits="userSpaceOnUse" cx="0" cy="0" r="1" gradientTransform="translate(${x} ${y}) scale(${rx} ${ry})"><stop offset="0" stop-color="rgb(${c})"/><stop offset=".35" stop-color="rgb(${c})" stop-opacity=".68"/><stop offset=".7" stop-color="rgb(${c})" stop-opacity=".18"/><stop offset="1" stop-color="rgb(${c})" stop-opacity="0"/></radialGradient>`).join('');
  const bg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 1440 838"><defs>${grads}<linearGradient id="f" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000"/><stop offset=".2" stop-color="#fff"/><stop offset=".84" stop-color="#fff"/><stop offset="1" stop-color="#000"/></linearGradient><mask id="edge"><rect width="1440" height="838" fill="url(#f)"/></mask></defs><rect width="1440" height="838" fill="#0c0c0e"/><g mask="url(#edge)">${GLOWS.map((_, i) => `<rect width="1440" height="838" fill="url(#g${i})"/>`).join('')}</g></svg>`);
  const hole = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 1440 838"><polygon fill="#000" points="${CORNERS.map((p) => p.join(',')).join(' ')}"/></svg>`);
  const noise = await sharp({ create: { width: W, height: H, channels: 3, background: '#808080', noise: { type: 'gaussian', mean: 128, sigma: 2.2 } } }).png().toBuffer();
  const base = await sharp(bg).png().toBuffer();
  const render = await sharp(input).toColourspace('srgb').png().toBuffer();
  const full = await sharp(base).composite([{ input: render }, { input: noise, blend: 'soft-light' }]).png().toBuffer();
  await sharp(full).ensureAlpha().composite([{ input: hole, blend: 'dest-out' }]).png().toFile(out);
})().catch((e) => { console.error(e); process.exit(1); });
