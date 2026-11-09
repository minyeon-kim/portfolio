import Image from "next/image";
import { withBase } from "@/lib/site";

// Comparative analysis as coverage across the steps of the work, so an empty cell always means
// the same thing: that kind of tool doesn't do that step. Grouped by tool type. Marks are a
// classification from official docs, not a score. Sources: docs/tool-research.md.
// Colour marks are each product's own icon, from its official site.
type Tool = { name: string; icon?: string };
type Group = { name: string; tools: Tool[]; cells: number[]; notes?: Record<string, string> };
export type CoverageData = {
  label: string; steps: string[]; full: string; partial: string; none: string;
  groups: Group[]; self: Omit<Group, "tools"> & { tag: string };
  summary: string; note: string;
};

function Mark({ value, labels }: { value: number; labels: string[] }) {
  return <><i className="dv-cv-mark" data-v={value} aria-hidden="true" /><span className="sr-only">{labels[value]}</span></>;
}

export function ToolMap({ map }: { map: CoverageData }) {
  const labels = [map.none, map.partial, map.full];
  const cell = (group: Pick<Group, "cells" | "notes">, i: number) => (
    <td key={i}><Mark value={group.cells[i]} labels={labels} />{group.notes?.[i] && <small>{group.notes[i]}</small>}</td>
  );
  return (
    <figure className="dv-cv reveal">
      <div className="dv-cv-scroll">
        <table>
          <caption className="sr-only">{map.label}</caption>
          <thead>
            <tr><td />{map.steps.map((step) => <th key={step} scope="col">{step}</th>)}</tr>
          </thead>
          <tbody>
            {map.groups.map((group) => (
              <tr key={group.name}>
                <th scope="row">
                  <b>{group.name}</b>
                  <ul>{group.tools.map((t) => (
                    <li key={t.name}>
                      <span className="dv-tm-icon" aria-hidden="true">{t.icon && <Image src={withBase(`/images/tools/${t.icon}.webp`)} alt="" width={24} height={24} />}</span>
                      {t.name}
                    </li>
                  ))}</ul>
                </th>
                {map.steps.map((_, i) => cell(group, i))}
              </tr>
            ))}
            <tr data-self="">
              <th scope="row"><b>{map.self.name}</b><em>{map.self.tag}</em></th>
              {map.steps.map((_, i) => cell(map.self, i))}
            </tr>
          </tbody>
        </table>
      </div>
      <figcaption>
        <p className="dv-cv-legend" aria-hidden="true"><span><i className="dv-cv-mark" data-v={2} />{map.full}</span><span><i className="dv-cv-mark" data-v={1} />{map.partial}</span></p>
        <p className="dv-cv-summary">{map.summary}</p>
        <p className="dv-cv-note">{map.note}</p>
      </figcaption>
    </figure>
  );
}
