import Image from "next/image";
import type { ReactNode } from "react";
import { CaseGallery } from "@/components/case-gallery";
import { DevsignCompare } from "@/components/devsign-compare";
import { DevsignNav } from "@/components/devsign-nav";
import { withBase } from "@/lib/site";

// Devsign case body, laid out after the Figma case study frame
// ("Devsign · Case study · 1920"). All copy comes from content/cases/workflow-app.mdx.

type Img = { src: string; width: number; height: number; alt?: string; caption?: string };
type Lead = { method?: string; title: string; lead?: string; text?: string };
// The study object is authored in MDX; its exact shape is checked there by eye.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Study = Record<string, any>;

const pad = (n: number) => String(n).padStart(2, "0");

// Frames where the Figma file shows an image at a fixed size with its own crop:
// frame aspect ratio, then the image's width, height, left and top in % of the frame.
const CROPS: Record<string, [number, number, number, number, number]> = {
  "/images/devsign/affinity-board.webp": [1440 / 487, 100.04, 100.97, -0.02, -0.97],
  "/images/devsign/information-architecture.webp": [1440 / 279, 102.77, 115.63, -1.23, -10.74],
  "/images/devsign/user-flow.webp": [1440 / 351, 104.71, 126.42, -2.27, -18.71],
  "/images/devsign/value-effort-matrix.webp": [376 / 440, 103.73, 107.53, -1.87, -5.91],
  "/images/devsign/codesign-session.webp": [700 / 421, 108.84, 118.47, -4.38, -13.12],
};

function Figure({ img, sizes = "(max-width: 767px) 100vw, 80vw", className = "" }: { img: Img; sizes?: string; className?: string }) {
  const crop = CROPS[img.src];
  const image = <Image src={withBase(img.src)} alt={img.alt ?? ""} width={img.width} height={img.height} sizes={sizes} />;
  return (
    <figure className={`dv-figure reveal ${className}`}>
      {crop ? (
        <div className="dv-crop" style={{ aspectRatio: crop[0], "--w": `${crop[1]}%`, "--h": `${crop[2]}%`, "--l": `${crop[3]}%`, "--t": `${crop[4]}%` } as React.CSSProperties}>{image}</div>
      ) : image}
      {img.caption && <figcaption>{img.caption}</figcaption>}
    </figure>
  );
}

// Method label, uppercase block title, then a bold lead sentence running into muted text.
function Block({ method, title, lead, text, id }: Lead & { id?: string }) {
  return (
    <div className="dv-block">
      {method && <p className="dv-method reveal">{method}</p>}
      <h3 id={id} className="dv-block-title reveal">{title}</h3>
      {(lead || text) && (
        <p className="dv-lead reveal">
          {lead && <strong>{lead}</strong>}
          {lead && text && " "}
          {text}
        </p>
      )}
    </div>
  );
}

function Section({ id, title, band, children }: { id: string; title: string; band?: boolean; children: ReactNode }) {
  return (
    <section id={id} className={band ? "dv-section dv-band" : "dv-section"} aria-labelledby={`${id}-title`}>
      <div className="dv-section-head">
        <h2 id={`${id}-title`} className="dv-section-title reveal">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function DoubleDiamond({ stages, pivot, labels }: { stages: { name: string; methods: string[]; current?: boolean }[]; pivot: string; labels: Study }) {
  // Geometry from the Figma frame (1440 x 520): four half-diamonds of 256 x 400.
  const halves = [
    { x: 200, d: "M0 200L256 0V400Z" },
    { x: 464, d: "M0 0L256 200L0 400Z" },
    { x: 720, d: "M0 200L256 0V400Z" },
    { x: 984, d: "M0 0L256 200L0 400Z" },
  ];
  const centers = [373, 547, 888, 1067];
  return (
    <div className="dv-scroll reveal">
      <svg className="dv-diamond" viewBox="0 0 1440 520" role="img" aria-label={`Double diamond: ${stages.map((s) => `${s.name} (${s.methods.join(", ")})`).join("; ")}. ${pivot}`}>
        {halves.map(({ x, d }, i) => (
          <path key={x} d={d} transform={`translate(${x} 30)`} className={stages[i]?.current ? "dv-diamond-current" : `dv-diamond-half dv-diamond-half-${i}`} />
        ))}
        <path d="M199.5 50V410M1240.5 50V410M720.5 170V290" className="dv-diamond-dash" />
        <text x="111" y="238" className="dv-svg-strong" textAnchor="middle" fontSize="20">{labels.problem.toUpperCase()}</text>
        <text x="1331" y="238" className="dv-svg-strong" textAnchor="middle" fontSize="20">{labels.solution.toUpperCase()}</text>
        <text x="720" y="84" className="dv-svg-muted dv-svg-caps" textAnchor="middle" fontSize="14">{labels.coreProblem.toUpperCase()}</text>
        <text x="460" y="477" className="dv-svg-muted dv-svg-caps" textAnchor="middle" fontSize="18">{labels.research.toUpperCase()}</text>
        <text x="980" y="477" className="dv-svg-muted dv-svg-caps" textAnchor="middle" fontSize="18">{labels.design.toUpperCase()}</text>
        {stages.map((stage, i) => (
          <g key={stage.name}>
            <text x={centers[i]} y="200" textAnchor="middle" fontSize="22" className={stage.current ? "dv-svg-accent" : "dv-svg-strong"}>{stage.name.toUpperCase()}</text>
            {stage.methods.map((method, j) => (
              <text key={method} x={centers[i]} y={226 + j * 22.4} textAnchor="middle" fontSize="14" className="dv-svg-muted">{method}</text>
            ))}
          </g>
        ))}
        <path d="M820.5 312V380" className="dv-diamond-callout" />
        <circle cx="820.5" cy="312" r="3" className="dv-svg-dot" />
        <text x="820.5" y="402" textAnchor="middle" fontSize="14" className="dv-svg-accent dv-svg-regular">{pivot}</text>
      </svg>
    </div>
  );
}

function Journey({ journey }: { journey: Study }) {
  // Coordinates from the Figma emotion curve (1376 x 340 inside the journey panel).
  const xs = [90, 329, 568, 808, 1047, 1286];
  return (
    <div className="dv-journey dv-scroll reveal">
      <svg viewBox="0 0 1376 340" role="img" aria-label={`${journey.steps.join(" → ")}. ${journey.developer}: ${journey.developerLow}. ${journey.designer}: ${journey.designerLow}.`}>
        {xs.map((x, i) => (
          <g key={x}>
            <path d={`M${x + 0.5} 52V322`} className="dv-journey-grid" />
            <text x={x} y="14" textAnchor="middle" fontSize="13" className="dv-svg-strong">{journey.steps[i]}</text>
          </g>
        ))}
        <path transform="translate(87.5 125.23)" className="dv-journey-line dv-journey-designer" d="M2.5 112.774C42.3 112.774 161.8 131.074 241.5 112.774C321.2 94.4739 400.7 7.57393 480.5 2.77393C560.3 -2.02607 640.7 57.4739 720.5 83.7739C800.3 110.074 879.8 159.074 959.5 160.774C1039.2 162.474 1158.7 104.974 1198.5 93.7739" />
        <path transform="translate(87.5 157.52)" className="dv-journey-line dv-journey-developer" d="M2.50068 46.4758C42.3007 60.1758 161.801 135.676 241.501 128.476C321.201 121.276 400.701 13.1758 480.501 3.47581C560.301 -6.22419 640.701 59.2758 720.501 70.4758C800.301 81.6758 879.801 70.4758 959.501 70.4758H1198.5" />
        <text x="584" y="115" fontSize="13" className="dv-svg-accent dv-svg-caps">{journey.designer.toUpperCase()}</text>
        <text x="1071" y="211" fontSize="13" className="dv-svg-second dv-svg-caps">{journey.developer.toUpperCase()}</text>
        <image href={withBase("/images/devsign/emoji-angry.svg")} x="312" y="269" width="34" height="34" />
        <text x="329" y="325" textAnchor="middle" fontSize="13" className="dv-svg-second dv-svg-caps">{journey.developerLow.toUpperCase()}</text>
        <image href={withBase("/images/devsign/emoji-angry.svg")} x="1030" y="269" width="34" height="34" />
        <text x="1047" y="325" textAnchor="middle" fontSize="13" className="dv-svg-accent dv-svg-caps">{journey.designerLow.toUpperCase()}</text>
      </svg>
    </div>
  );
}

function Donut({ ratio, missed }: { ratio: number; missed?: boolean }) {
  const r = 55.2;
  const c = 2 * Math.PI * r;
  return (
    <svg className="dv-donut-ring" viewBox="0 0 120 120" aria-hidden="true">
      <circle cx="60" cy="60" r={r} className="dv-donut-track" />
      <circle cx="60" cy="60" r={r} className={missed ? "dv-donut-value dv-donut-missed" : "dv-donut-value"} strokeDasharray={`${c * ratio} ${c}`} transform="rotate(-90 60 60)" />
    </svg>
  );
}

export function DevsignCase({ study, children }: { study: Study; children: ReactNode }) {
  const { overview, discover, define, develop, deliver, testing, takeaway, labels } = study;
  const nav = [
    { id: "overview", label: "Overview" },
    { id: "discover", label: "Discover" },
    { id: "define", label: "Define" },
    { id: "develop", label: "Develop" },
    { id: "deliver", label: "Deliver" },
    { id: "takeaway", label: "Takeaway" },
  ];

  return (
    <div className="dv">
      <DevsignNav items={nav} />

      <Section id="overview" title="Overview">
        <p className="dv-headline reveal">
          {overview.headline} <span>{overview.headlineAccent}</span>
        </p>
        <div className="dv-psi">{children}</div>
        <div className="dv-process">
          <h3 className="dv-block-title reveal">{overview.process.title}</h3>
          <p className="dv-body reveal">{overview.process.body}</p>
          <DoubleDiamond stages={overview.process.stages} pivot={overview.process.pivot} labels={labels} />
        </div>
      </Section>

      <Section id="discover" title="Discover">
        <Block {...discover.desk} />

        <div className="dv-question">
          <p className="dv-caps reveal">{discover.q1.label}</p>
          <p className="dv-answer reveal">{discover.q1.answer}</p>
          <p className="dv-caps dv-gap-40 reveal">{discover.q1.surveyLabel}</p>
          <div className="dv-stats">
            {discover.q1.stats.map((stat: { value: string; text: string }) => (
              <p key={stat.value} className="dv-stat reveal"><strong>{stat.value}</strong><span>{stat.text}</span></p>
            ))}
          </div>
          <div className="dv-two dv-gap-56">
            <div>
              <p className="dv-caps reveal">{discover.q1.communityLabel}</p>
              <dl className="dv-groups">
                {discover.q1.groups.map((group: { name: string; detail: string }) => (
                  <div key={group.name} className="reveal"><dt>{group.name}</dt><dd>{group.detail}</dd></div>
                ))}
              </dl>
            </div>
            <Figure img={{ ...discover.q1.boards, alt: "Research boards with community posts grouped by pattern" }} sizes="(max-width: 767px) 100vw, 50vw" className="dv-boards" />
          </div>
        </div>

        <div className="dv-question">
          <p className="dv-caps reveal">{discover.q2.label}</p>
          <p className="dv-answer reveal">{discover.q2.answer}</p>
          <div className="dv-scroll dv-gap-48 reveal">
            <table className="dv-matrix">
              <caption className="sr-only">{discover.q2.auditLabel}</caption>
              <thead>
                <tr>
                  <th scope="col" className="dv-caps">{discover.q2.auditLabel}</th>
                  {discover.q2.columns.map((col: { name: string; accent?: boolean }) => (
                    <th key={col.name} scope="col" data-accent={col.accent || undefined}>{col.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {discover.q2.rows.map((row: { name: string; marks: number[]; highlight?: boolean }) => (
                  <tr key={row.name} data-highlight={row.highlight || undefined}>
                    <th scope="row">{row.name}</th>
                    {row.marks.map((mark, i) => (
                      <td key={i}>
                        <span className="dv-mark" data-on={mark ? "" : undefined} />
                        <span className="sr-only">{mark ? labels.yes : labels.no}</span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="dv-question">
          <p className="dv-caps reveal">{discover.synthesis.label}</p>
          <p className="dv-answer reveal">{discover.synthesis.title}</p>
          <div className="dv-stages dv-gap-24">
            <div className="dv-stages-head" aria-hidden="true"><span /><span>{discover.synthesis.withAi}</span><span /><span>{discover.synthesis.gap}</span></div>
            {discover.synthesis.rows.map((row: { stage: string; withAi: string; gap: string }) => (
              <div key={row.stage} className="dv-stage-row reveal">
                <strong>{row.stage}</strong>
                <p className="dv-stage-box"><span className="sr-only">{discover.synthesis.withAi}: </span>{row.withAi}</p>
                <span className="dv-stage-arrow" aria-hidden="true">→</span>
                <p className="dv-stage-box dv-stage-gap"><span className="sr-only">{discover.synthesis.gap}: </span>{row.gap}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="dv-subsection dv-rule">
          <Block {...discover.interview} />
          <div className="dv-two dv-gap-40 dv-center">
            <Figure img={discover.interview.photo} sizes="(max-width: 767px) 100vw, 50vw" className="dv-photo" />
            <div className="dv-stack-32">
              <div>
                <p className="dv-caps reveal">{discover.interview.questionsLabel}</p>
                <ol className="dv-numbered">
                  {discover.interview.questions.map((q: string) => <li key={q} className="reveal">{q}</li>)}
                </ol>
              </div>
              <table className="dv-participants reveal">
                <thead>
                  <tr>{discover.interview.participantColumns.map((c: string) => <th key={c} scope="col">{c}</th>)}</tr>
                </thead>
                <tbody>
                  {discover.interview.participants.map((p: string[]) => (
                    <tr key={p[0]}>{p.map((cell, i) => (i === 0 ? <th key={i} scope="row">{cell}</th> : <td key={i}>{cell}</td>))}</tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </Section>

      <Section id="define" title="Define">
        <Block {...define.personas} />
        <div className="dv-personas dv-gap-64">
          {define.personas.people.map((person: Study, index: number) => (
            <article key={person.name} className="dv-persona reveal" data-variant={index === 0 ? "designer" : "developer"}>
              <div className="dv-persona-id">
                <Image src={withBase(person.avatar)} alt="" width={88} height={88} className="dv-avatar" />
                <p className="dv-caps dv-persona-role">{person.role}</p>
                <h3 className="dv-persona-name">{person.name}</h3>
                <p className="dv-persona-bio">{person.bio}</p>
                <p className="dv-persona-quote">{person.quote}</p>
              </div>
              <div className="dv-persona-details">
                <div>
                  <p className="dv-caps dv-persona-role">{labels.context}</p>
                  <p className="dv-persona-context">{person.context} <strong>{person.contextLead}</strong></p>
                </div>
                <table className="dv-needs">
                  <thead>
                    <tr><th scope="col">{labels.painPoint}</th><td aria-hidden="true" /><th scope="col">{labels.need}</th></tr>
                  </thead>
                  <tbody>
                    {person.pairs.map(([pain, need]: string[]) => (
                      <tr key={pain}><td>{pain}</td><td aria-hidden="true">→</td><td><strong>{need}</strong></td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>
          ))}
        </div>
        <Journey journey={define.personas.journey} />
        <p className="dv-summary reveal">{define.personas.summary}</p>

        <div className="dv-subsection">
          <Block {...define.affinity} />
          <Figure img={define.affinity.board} className="dv-board dv-gap-72" />
        </div>

        <div className="dv-subsection">
          <Block {...define.problems} />
          <ol className="dv-problems dv-gap-40">
            {define.problems.items.map((item: Study, index: number) => (
              <li key={item.title} className="reveal">
                <div className="dv-problem-top">
                  <span className="dv-problem-number">{pad(index + 1)}</span>
                  <span className="dv-pill">{item.role}</span>
                  {item.lowest && <span className="dv-pill dv-pill-accent">{define.problems.lowest}</span>}
                </div>
                <h4>{item.title}</h4>
                <p>{item.body}</p>
                <p className="dv-from"><strong>{labels.from} · </strong>{item.from}</p>
              </li>
            ))}
          </ol>
        </div>

        <div className="dv-core">
          <p className="dv-method reveal">{define.core.method}</p>
          <h3 className="dv-block-title reveal">{define.core.title}</h3>
          <p className="dv-core-text reveal">{define.core.lead} <span>{define.core.text}</span></p>
        </div>

        <div className="dv-hmw">
          <p className="dv-method reveal">{define.hmw.method}</p>
          <h3 className="dv-block-title reveal">{define.hmw.title}</h3>
          <p className="dv-hmw-question reveal">{define.hmw.question}</p>
          <p className="dv-caps dv-accent dv-gap-24 reveal">{define.hmw.successLabel}</p>
          <ol className="dv-checks">
            {define.hmw.success.map((s: string, i: number) => <li key={s} className="reveal"><span>{i + 1}</span>{s}</li>)}
          </ol>
        </div>
      </Section>

      <Section id="develop" title="Develop">
        <Block {...develop.ideation} />
        <div className="dv-split dv-gap-80">
          <Figure img={develop.matrix.image} sizes="(max-width: 767px) 100vw, 400px" className="dv-matrix-img" />
          <Block {...develop.matrix} />
        </div>
        <div className="dv-split dv-gap-96">
          <Figure img={develop.canvas.image} sizes="(max-width: 767px) 100vw, 55vw" className="dv-canvas-img" />
          <Block {...develop.canvas} />
        </div>
        <div className="dv-gap-96">
          <Block {...develop.dvf} />
          <p className="dv-caps dv-accent dv-gap-40 reveal">{develop.dvf.featuresLabel}</p>
          <ul className="dv-features">
            {develop.dvf.features.map((f: { name: string; solves: string }) => (
              <li key={f.name} className="reveal"><strong>{f.name}</strong><span>{f.solves}</span></li>
            ))}
          </ul>
        </div>
        <div className="dv-gap-96">
          <Block {...develop.sketching} />
          <Figure img={develop.sketching.image} className="dv-cover dv-gap-40" />
        </div>
        <div className="dv-subsection">
          <Block {...develop.ia} />
          <Figure img={develop.ia.image} className="dv-board dv-gap-40" />
          <div className="dv-gap-96">
            <Block {...develop.flow} />
            <Figure img={develop.flow.image} className="dv-board dv-gap-40" />
          </div>
        </div>
      </Section>

      <Section id="deliver" title="Deliver" band>
        <Block {...deliver} />
        <div className="dv-gap-64">
          <CaseGallery title={deliver.title} items={deliver.features.map((f: Study) => ({ ...f, label: f.title }))} />
        </div>
      </Section>

      <section className="dv-section dv-testing" aria-labelledby="testing-title">
        <Block {...testing} id="testing-title" />
        <div className="dv-gap-72">
          <Block {...testing.usability} />
          <div className="dv-two dv-gap-40 dv-center">
            <Figure img={testing.usability.photo} sizes="(max-width: 767px) 100vw, 50vw" className="dv-photo" />
            <ul className="dv-scores">
              {testing.usability.scores.map((s: Study) => (
                <li key={s.title} className="reveal">
                  <div className="dv-donut">
                    <Donut ratio={s.ratio} missed={s.missed} />
                    <span className="dv-donut-value-text">{s.value}<small>{s.unit}</small></span>
                  </div>
                  <div>
                    <strong>{s.title}</strong>
                    <span data-missed={s.missed || undefined}>{s.note}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="dv-subsection-120">
          <Block {...testing.iteration1} />
          <div className="dv-gap-40"><DevsignCompare before={testing.iteration1.before} after={testing.iteration1.after} labels={labels} /></div>
        </div>
        <div className="dv-subsection-120">
          <Block {...testing.iteration2} />
          <div className="dv-two dv-gap-40 dv-center">
            <Figure img={testing.iteration2.photo} sizes="(max-width: 767px) 100vw, 50vw" className="dv-photo" />
            <div>
              <p className="dv-caps dv-accent reveal">{testing.iteration2.agreedLabel}</p>
              <ol className="dv-numbered">
                {testing.iteration2.agreed.map((a: string) => <li key={a} className="reveal">{a}</li>)}
              </ol>
            </div>
          </div>
          <div className="dv-gap-40"><DevsignCompare before={testing.iteration2.before} after={testing.iteration2.after} labels={labels} /></div>
        </div>
      </section>

      <Section id="takeaway" title="Takeaway">
        <p className="dv-headline dv-headline-plain reveal">{takeaway.headline}</p>
        <p className="dv-body dv-muted reveal">{takeaway.text}</p>
        <div className="dv-gap-64">
          <h3 className="dv-review-title reveal">{takeaway.reviewTitle}</h3>
          <ol className="dv-review">
            {takeaway.review.map((item: { title: string; body: string }, i: number) => (
              <li key={item.title} className="reveal">
                <span>{pad(i + 1)}</span>
                <div><h4>{item.title}</h4><p>{item.body}</p></div>
              </li>
            ))}
          </ol>
        </div>
        <div className="dv-gap-64">
          <h3 className="dv-limit-title reveal">{takeaway.limitationsTitle}</h3>
          <ul className="dv-limits">
            {takeaway.limitations.map((l: { lead: string; text: string }) => (
              <li key={l.lead} className="reveal"><strong>{l.lead}</strong>{l.text}</li>
            ))}
          </ul>
        </div>
        <div className="dv-next dv-gap-80 reveal">
          <p className="dv-caps">{takeaway.next.label}</p>
          <p className="dv-next-title">{takeaway.next.title}</p>
          <p className="dv-body dv-muted">{takeaway.next.text}</p>
          <ul className="dv-chips">
            {takeaway.next.chips.map((chip: string) => <li key={chip}><span aria-hidden="true">→</span>{chip}</li>)}
          </ul>
        </div>
      </Section>
    </div>
  );
}
