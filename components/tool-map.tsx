// Comparative analysis in two rows: how tools handle the two things the finding is about, against
// Devsign. The tools reviewed are named in the note. Sources: docs/tool-research.md.
type Row = { name: string; now: string; self: string };
export type CoverageData = { today: string; selfName: string; selfTag: string; rows: Row[]; note: string };

export function ToolMap({ map }: { map: CoverageData }) {
  return (
    <figure className="dv-cmp reveal">
      <table>
        <thead>
          <tr><td /><th scope="col">{map.today}</th><th scope="col" data-self="">{map.selfName}<small>{map.selfTag}</small></th></tr>
        </thead>
        <tbody>
          {map.rows.map((row) => (
            <tr key={row.name}>
              <th scope="row">{row.name}</th>
              <td data-label={map.today}><p>{row.now}</p></td>
              <td data-self="" data-label={map.selfName}><p>{row.self}</p></td>
            </tr>
          ))}
        </tbody>
      </table>
      <figcaption className="dv-cv-note">{map.note}</figcaption>
    </figure>
  );
}
