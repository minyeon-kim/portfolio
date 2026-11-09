// Comparative analysis as two panels side by side: how tools handle the two things the finding is
// about, against Devsign, at one text size. The tools reviewed are named in the note.
// Sources: docs/tool-research.md.
type Row = { name: string; now: string; self: string };
export type CoverageData = { today: string; selfName: string; rows: Row[]; note: string };

export function ToolMap({ map }: { map: CoverageData }) {
  return (
    <figure className="dv-cmp2 reveal">
      <div className="dv-cmp2-panels">
        <section>
          <h4>{map.today}</h4>
          <dl>{map.rows.map((row) => <div key={row.name}><dt>{row.name}</dt><dd>{row.now}</dd></div>)}</dl>
        </section>
        <section data-self="">
          <h4>{map.selfName}</h4>
          <dl>{map.rows.map((row) => <div key={row.name}><dt>{row.name}</dt><dd>{row.self}</dd></div>)}</dl>
        </section>
      </div>
      <figcaption className="dv-cv-note">{map.note}</figcaption>
    </figure>
  );
}
