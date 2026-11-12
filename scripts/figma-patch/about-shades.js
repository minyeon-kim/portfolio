// Run through the Figma MCP `use_figma` on the About page after uploading frames.
// Element screenshots of the About photos already include the shades painted over them (the 35%
// dark-theme dim and the top/bottom fades), and the export also draws those shades as rectangles,
// so the photos come out twice as dark. This removes the dim and hides the fades that lie on a
// full-width photo.
const page = await figma.getNodeByIdAsync("__PAGE_ID__");
await figma.setCurrentPageAsync(page);
const sec = await figma.getNodeByIdAsync("__SECTION_ID__");
const report = [];
for (const fr of sec.children) {
  const imgs = fr.children.filter((n) => n.name === "Image" && Math.abs(n.width - fr.width) < 2);
  let dims = 0, fades = 0;
  for (const n of [...fr.children]) {
    if (n.type !== "RECTANGLE" || n.name === "Image" || n.fills === figma.mixed || n.fills.length !== 1 || Math.abs(n.width - fr.width) > 2) continue;
    const over = imgs.find((im) => n.y >= im.y - 2 && n.y + n.height <= im.y + im.height + 2);
    if (!over) continue;
    const f = n.fills[0];
    if (f.type === "SOLID" && f.color.r + f.color.g + f.color.b < 0.01 && Math.abs((f.opacity ?? 1) - 0.35) < 0.02 && Math.abs(n.height - over.height) < 2) { n.remove(); dims++; }
    else if (f.type.startsWith("GRADIENT") && n.visible) { n.visible = false; fades++; }
  }
  report.push([fr.name, dims, fades]);
}
return report;
