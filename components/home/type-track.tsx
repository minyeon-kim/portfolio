// Two rows of large type that slide in opposite directions as the band
// scrolls past (CSS scroll-driven, see .track-* in globals.css). Decorative:
// the words echo the positioning line and are hidden from assistive tech.
const ROWS = [
  ["Privacy", "Trust", "Tools for builders", "Security engineering", "Product design"],
  ["Design systems", "Usable security", "Developer tools", "Clear consent", "Research"],
];

export function TypeTrack() {
  return (
    <div aria-hidden="true" className="full-bleed overflow-clip border-t border-line py-8 select-none">
      {ROWS.map((row, r) => (
        <div
          key={r}
          className={`${r === 0 ? "track-left" : "track-right text-muted"} flex w-max gap-4 py-1 text-xl font-medium tracking-tight whitespace-nowrap md:gap-6 md:text-display md:tracking-[-0.02em]`}
        >
          {[...row, ...row].map((word, i) => (
            <span key={i} className="flex items-center gap-4 md:gap-6">
              {word}
              <span className="text-accent">·</span>
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}
