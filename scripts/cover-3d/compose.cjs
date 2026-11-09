// Lays the Blender render over the backdrop and cuts the screen hole: node compose.cjs in.png out.png [webp]
const sharp = require('/Users/minyeon/Projects/portfolio/node_modules/sharp');
const [, , input, out] = process.argv;
const CORNERS = [[431.7, 69.4], [1071.8, 71.1], [1035.8, 596.4], [396.5, 553.2]];
const GLOWS = [[120, -40, 1000, 720, '70,56,118', 1], [1460, 860, 900, 600, '84,66,142', 1]];
(async () => {
  const { width: W, height: H } = await sharp(input).metadata();
  const k = W / 1440;
  const grads = GLOWS.map(([x, y, rx, ry, c], i) => `<radialGradient id="g${i}" gradientUnits="userSpaceOnUse" cx="0" cy="0" r="1" gradientTransform="translate(${x} ${y}) scale(${rx} ${ry})"><stop offset="0" stop-color="rgb(${c})"/><stop offset=".35" stop-color="rgb(${c})" stop-opacity=".68"/><stop offset=".7" stop-color="rgb(${c})" stop-opacity=".18"/><stop offset="1" stop-color="rgb(${c})" stop-opacity="0"/></radialGradient>`).join('');
  const bg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 1440 838"><defs>${grads}</defs><rect width="1440" height="838" fill="#0c0c0e"/>${GLOWS.map((_, i) => `<rect width="1440" height="838" fill="url(#g${i})"/>`).join('')}</svg>`);
  const hole = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 1440 838"><polygon fill="#000" points="${CORNERS.map((p) => p.join(',')).join(' ')}"/></svg>`);
  const noise = await sharp({ create: { width: W, height: H, channels: 3, background: '#808080', noise: { type: 'gaussian', mean: 128, sigma: 2.2 } } }).png().toBuffer();
  const base = await sharp(bg).png().toBuffer();
  const render = await sharp(input).toColourspace('srgb').png().toBuffer();
  const full = await sharp(base).composite([{ input: render }, { input: noise, blend: 'soft-light' }]).png().toBuffer();
  await sharp(full).ensureAlpha().composite([{ input: hole, blend: 'dest-out' }]).png().toFile(out);
})().catch((e) => { console.error(e); process.exit(1); });
