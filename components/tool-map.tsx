// Comparative analysis as one table read across (owner: two separate panels made you match rows
// by eye): what each row checks, what tools do today, and what we didn't find, on one line.
// Sources: docs/tool-research.md (Devsign); the Gemini FigJam "Benchmarking" section.
type Row = { name: string; now: string; self: string };
export type CoverageData = { today: string; selfName: string; rows: Row[] };

export function ToolMap({ map }: { map: CoverageData }) {
  return (
    <figure className="dv-cmpt reveal">
      <table>
        <thead>
          <tr>
            <th scope="col"><span className="sr-only">—</span></th>
            <th scope="col">{map.today}</th>
            <th scope="col" data-self="">{map.selfName}</th>
          </tr>
        </thead>
        <tbody>
          {map.rows.map((row) => (
            <tr key={row.name}>
              <th scope="row">{row.name}</th>
              <td><span className="dv-cmpt-tag" aria-hidden="true">{map.today}</span>{row.now}</td>
              <td data-self=""><span className="dv-cmpt-tag" aria-hidden="true">{map.selfName}</span>{row.self}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
