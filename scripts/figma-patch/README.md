# Figma patches

`scripts/figma-frames.cjs` turns each page into an SVG, and SVG import drops a few things the site
draws with CSS. Run these after uploading new frames and `figma-fixup.js`, then run the
`figma-pretendard` plugin in the desktop app.

1. Serve the built site (`npm run build`, `python3 -m http.server 4180 -d out`).
2. `node extract.cjs` writes `patches.json`: per frame, the radial gradients, dashed outlines,
   journey legend dots, footer glow, Next project ticker copies and landing pill borders, read from
   the DOM.
3. Set the page and section ids in `gen.cjs` (`PAGES`), then `node gen.cjs` writes one
   `apply-<Page>.js` per Figma page. Run each through the Figma MCP `use_figma`. It also puts each
   "%" right after its number and redraws arrow glyphs in Geist.
4. Run `about-shades.js` on the About page (ids filled in).

The apply scripts skip what is already there (legend dots, glow, ticker dots), so they can be run
again.
