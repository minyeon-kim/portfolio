import Image from "next/image";
import type { ReactNode } from "react";
import { CaseGallery } from "@/components/case-gallery";
import { DevsignCompare } from "@/components/devsign-compare";
import { DevsignNav } from "@/components/devsign-nav";
import { DeliverShow, IterationStory, PrototypeLink } from "@/components/devsign-story";
import { DoubleDiamond } from "@/components/double-diamond";
import { withBase } from "@/lib/site";

// Case body in the Devsign layout, after the Figma case study frames
// ("Devsign · Case study · 1920", "Gemini · Case study · 1920"). All copy comes
// from the case's MDX `study` object. Where the two cases differ, the shape of
// the data picks the variant: community boards or paper cards, a tool matrix
// or service cards, the Devsign develop steps or a list of blocks, a gallery
// or change cards, measured scores and iterations or a test plan.

// `fit`: show the whole image inside a box of that aspect ratio (a portrait
// board in a landscape frame, as the Figma frame does).
type Img = { src: string; width: number; height: number; alt?: string; caption?: string; fit?: number };
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
  "/images/devsign/codesign-session.webp": [720 / 472, 108.84, 118.47, -4.38, -13.12],
};

function Figure({ img, sizes = "(max-width: 767px) 100vw, 80vw", className = "" }: { img: Img; sizes?: string; className?: string }) {
  const crop = CROPS[img.src];
  // Eager: a lazy image fetched only once its row scrolls in arrived after the
  // reveal had already played, and popped in late.
  const image = <Image src={withBase(img.src)} alt={img.alt ?? ""} width={img.width} height={img.height} sizes={sizes} loading="eager" />;
  return (
    <figure className={`dv-figure reveal ${className}`}>
      {crop ? (
        <div className="dv-crop" style={{ aspectRatio: crop[0], "--w": `${crop[1]}%`, "--h": `${crop[2]}%`, "--l": `${crop[3]}%`, "--t": `${crop[4]}%` } as React.CSSProperties}>{image}</div>
      ) : img.fit ? <div className="dv-fit" style={{ aspectRatio: img.fit }}>{image}</div> : image}
      {img.caption && <figcaption>{img.caption}</figcaption>}
    </figure>
  );
}

// Method label, uppercase block title, then a bold lead sentence running into muted text.
// Findings first (`ff`, the Devsign case): the method's name as a small label,
// the finding or decision as the heading, then the text; `label` overrides the
// label (Iteration 1 · Split by role) and `feature` tags the feature it changed.
function Block({ method, title, lead, text, id, label, feature, ff }: Lead & { id?: string; label?: string; feature?: string; ff?: boolean }) {
  if (ff) return (
    <div className="dv-block">
      <p className="dv-label reveal">{label ?? title}</p>
      <h3 id={id} className="dv-finding reveal">{lead}</h3>
      {feature && <p className="dv-tag reveal">{feature}</p>}
      {text && <p className="dv-body reveal">{text}</p>}
    </div>
  );
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

// Developer handoff as a numbered wireflow (class feedback): the screens in
// flow order, each element numbered "screen-element" (2-3) so a developer can
// point at it, a note on what moves the user to the next screen, then the
// annotations screen by screen.
function Handoff({ handoff, features, ff }: { handoff: Study; features: Study[]; ff?: boolean }) {
  const screens = handoff.order.map((i: number) => features[i]);
  return (
    <div className="dv-gap-96">
      <Block {...(handoff as Lead)} ff={ff} />
      <ol className="dv-wireflow dv-gap-40 reveal" data-reveal-group>
        {screens.map((f: Study, s: number) => (
          <li key={f.title}>
            <p className="dv-wireflow-name"><b>{s + 1}</b>{f.title}</p>
            <div className="dv-wireflow-screen">
              <Image src={withBase(f.src)} alt={f.alt ?? ""} width={f.width ?? 1280} height={f.height ?? 800} sizes="(max-width: 1023px) 100vw, 280px" />
              {f.areas.map((b: number[], e: number) => (
                <span key={e} className="dv-wireflow-area" style={{ left: `${b[0]}%`, top: `${b[1]}%`, width: `${b[2]}%`, height: `${b[3]}%` }}><b>{s + 1}-{e + 1}</b></span>
              ))}
            </div>
            {handoff.flows[s] && <p className="dv-wireflow-flow"><span aria-hidden="true">→</span>{handoff.flows[s]}</p>}
          </li>
        ))}
      </ol>
      <div className="dv-annotations dv-gap-40">
        {screens.map((f: Study, s: number) => (
          <section key={f.title} className="reveal" data-reveal-group>
            <h4><b>{s + 1}</b>{f.title}</h4>
            <ol>
              {f.points.map((p: string, e: number) => <li key={p}><b>{s + 1}-{e + 1}</b>{p}</li>)}
            </ol>
          </section>
        ))}
      </div>
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


function Journey({ journey, wide }: { journey: Study; wide?: boolean }) {
  // Coordinates from the Figma emotion curve (1376 x 340 inside the journey panel).
  // The wide version stretches the curve towards the panel edges (first and
  // last step at 40 / 1336), keeping text and stroke widths unscaled.
  const k = wide ? 1296 / 1196 : 1;
  const sx = (x: number) => 688 + (x - 688) * k;
  const xs = [90, 329, 568, 808, 1047, 1286].map(sx);
  return (
    <div className="dv-journey dv-scroll reveal">
      <svg viewBox="0 0 1376 340" role="img" aria-label={`${journey.steps.join(" → ")}. ${journey.developer}: ${journey.developerLow}. ${journey.designer}: ${journey.designerLow}.`}>
        {xs.map((x, i) => (
          <g key={x}>
            <path d={`M${x + 0.5} 52V322`} className="dv-journey-grid" />
            <text x={x} y="17" textAnchor="middle" fontSize="18" className="dv-svg-strong">{journey.steps[i]}</text>
          </g>
        ))}
        <g transform={`matrix(${k} 0 0 1 ${688 * (1 - k)} 0)`}>
          <path transform="translate(87.5 125.23)" vectorEffect="non-scaling-stroke" className="dv-journey-line dv-journey-designer" d="M2.5 112.774C42.3 112.774 161.8 131.074 241.5 112.774C321.2 94.4739 400.7 7.57393 480.5 2.77393C560.3 -2.02607 640.7 57.4739 720.5 83.7739C800.3 110.074 879.8 159.074 959.5 160.774C1039.2 162.474 1158.7 104.974 1198.5 93.7739" />
          <path transform="translate(87.5 157.52)" vectorEffect="non-scaling-stroke" className="dv-journey-line dv-journey-developer" d="M2.50068 46.4758C42.3007 60.1758 161.801 135.676 241.501 128.476C321.201 121.276 400.701 13.1758 480.501 3.47581C560.301 -6.22419 640.701 59.2758 720.501 70.4758C800.301 81.6758 879.801 70.4758 959.501 70.4758H1198.5" />
        </g>
        <text x={sx(584)} y="115" fontSize="18" className="dv-svg-accent dv-svg-caps">{journey.designer.toUpperCase()}</text>
        <text x={sx(1071)} y="211" fontSize="18" className="dv-svg-second dv-svg-caps">{journey.developer.toUpperCase()}</text>
        <image href={withBase("/images/devsign/emoji-angry.svg")} x={sx(329) - 17} y="269" width="34" height="34" />
        <text x={sx(329)} y="325" textAnchor="middle" fontSize="18" className="dv-svg-second dv-svg-caps">{journey.developerLow.toUpperCase()}</text>
        <image href={withBase("/images/devsign/emoji-angry.svg")} x={sx(1047) - 17} y="269" width="34" height="34" />
        <text x={sx(1047)} y="325" textAnchor="middle" fontSize="18" className="dv-svg-accent dv-svg-caps">{journey.designerLow.toUpperCase()}</text>
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

// Findings as rows: a bold name, then its detail.
function Groups({ groups, numbered }: { groups: { name: string; detail: string }[]; numbered?: boolean }) {
  return (
    <dl className={numbered ? "dv-groups dv-groups-numbered" : "dv-groups"}>
      {groups.map((g, i) => <div key={g.name} className="reveal">{numbered && <span aria-hidden="true">{pad(i + 1)}</span>}<dt>{g.name}</dt><dd>{g.detail}</dd></div>)}
    </dl>
  );
}

// A develop step: its text, then an image, a pair of images, a row of screens
// or a list of features. `rule` starts a new subsection (Structure).
function DevelopBlock({ block }: { block: Study }) {
  return (
    <div className={block.rule ? "dv-subsection" : "dv-gap-96"}>
      <Block {...(block as Lead)} />
      {block.image && <Figure img={block.image} className="dv-cover dv-gap-40" />}
      {block.images && (
        <div className={block.images.length > 2 ? "dv-screens dv-gap-40" : "dv-two dv-gap-40"} style={{ "--n": block.images.length } as React.CSSProperties}>
          {block.images.map((img: Img) => <Figure key={img.src} img={img} sizes="(max-width: 767px) 100vw, 40vw" className={block.images.length > 2 ? "dv-screen" : "dv-photo"} />)}
        </div>
      )}
      {block.features && (
        <>
          <p className="dv-caps dv-accent dv-gap-40 reveal">{block.featuresLabel}</p>
          <ul className="dv-features" style={{ "--n": block.features.length } as React.CSSProperties}>
            {block.features.map((f: { name: string; solves: string }) => (
              <li key={f.name} className="reveal"><strong>{f.name}</strong><span>{f.solves}</span></li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

export function DevsignCase({ study, children }: { study: Study; children: ReactNode }) {
  const { overview, discover, define, develop, deliver, testing, takeaway, labels } = study;
  const ff = Boolean(study.findings);
  const nav = [
    { id: "overview", label: "Overview" },
    { id: "discover", label: "Discover" },
    { id: "define", label: "Define" },
    { id: "develop", label: "Develop" },
    { id: "deliver", label: "Deliver" },
    ...(ff ? [{ id: "testing", label: "Testing" }] : []),
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
        {/* With a problem → feature selection in Develop, the feature cards live there instead. */}
        {overview.features && !(ff && develop.selection) && (
          <div className="dv-main-features">
            {ff ? <Block title={overview.features.method} lead={overview.features.title} ff={ff} /> : <Block method={overview.features.method} title={overview.features.title} />}
            <ul className={`dv-features dv-gap-40${ff ? " dv-features-shots" : ""}`} style={{ "--n": overview.features.items.length } as React.CSSProperties}>
              {overview.features.items.map((f: { kicker: string; name: string; body: string; src?: string }) => (
                <li key={f.name} className="reveal">
                  {f.src && <Image src={withBase(f.src)} alt="" width={1280} height={800} sizes="(max-width: 767px) 100vw, 300px" className="dv-feature-shot" />}
                  <span className="dv-caps dv-accent">{f.kicker}</span><strong>{f.name}</strong><span>{f.body}</span>
                </li>
              ))}
            </ul>
            <p className="dv-link reveal"><a href="#deliver">{overview.features.link}</a></p>
          </div>
        )}
      </Section>

      <Section id="discover" title="Discover">
        <Block {...discover.desk} ff={ff} />

        <div className="dv-question">
          <p className="dv-caps dv-question-label reveal">{discover.q1.label}</p>
          <p className="dv-answer reveal">{discover.q1.answer}</p>
          {/* With quotes: the two kinds of evidence side by side, survey numbers
              (scale) | the problems people kept posting, each with one real quote. */}
          {discover.q1.groups[0]?.quote ? (
            <div className="dv-evidence dv-gap-40">
              <div>
                <p className="dv-caps reveal">{discover.q1.surveyLabel}</p>
                <div className="dv-evidence-stats">
                  {discover.q1.stats.map((stat: { value: string; text: string }) => (
                    <p key={stat.value} className="dv-stat reveal"><strong>{stat.value}</strong><span>{stat.text}</span></p>
                  ))}
                </div>
              </div>
              <div>
                <p className="dv-caps reveal">{discover.q1.communityLabel}</p>
                <ol className="dv-voices">
                  {discover.q1.groups.map((g: { name: string; quote: string; source: string }, i: number) => (
                    <li key={g.name} className="reveal">
                      <span>{pad(i + 1)}</span>
                      <div>
                        <strong>{g.name}</strong>
                        <blockquote>“{g.quote}”</blockquote>
                        <cite>{g.source}</cite>
                      </div>
                    </li>
                  ))}
                </ol>
                {discover.q1.boards && <p className="dv-boards-link reveal"><a href={withBase(discover.q1.boards.src)} target="_blank" rel="noreferrer">{discover.q1.boardsLink}</a></p>}
              </div>
            </div>
          ) : <>
          <p className="dv-caps dv-gap-40 reveal">{discover.q1.surveyLabel}</p>
          <div className="dv-stats">
            {discover.q1.stats.map((stat: { value: string; text: string }) => (
              <p key={stat.value} className="dv-stat reveal"><strong>{stat.value}</strong><span>{stat.text}</span></p>
            ))}
          </div>
          {/* Each finding as a row with its detail; with boards, numbered and
              followed by a strip of the boards they came from. */}
          <div className="dv-gap-56">
            <p className="dv-caps reveal">{discover.q1.communityLabel}</p>
            <Groups groups={discover.q1.groups} numbered={Boolean(discover.q1.boards)} />
            {discover.q1.boards && <Figure img={{ ...discover.q1.boards, alt: "Research boards with community posts grouped by pattern" }} sizes="(max-width: 767px) 100vw, 1200px" className="dv-boards dv-strip dv-gap-24" />}
          </div>
          </>}
        </div>

        <div className="dv-question">
          <p className="dv-caps dv-question-label reveal">{discover.q2.label}</p>
          <p className="dv-answer reveal">{discover.q2.answer}</p>
          {discover.q2.groups ? (
            <div className="dv-gap-48">
              <p className="dv-caps reveal">{discover.q2.auditLabel}</p>
              <Groups groups={discover.q2.groups} />
            </div>
          ) : (
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
          )}
        </div>

        <div className="dv-question">
          <p className="dv-caps reveal">{discover.synthesis.label}</p>
          <p className="dv-answer reveal">{discover.synthesis.title}</p>
          {discover.synthesis.text && <p className="dv-body reveal">{discover.synthesis.text}</p>}
          {/* Gap only (class feedback): one card per stage with the gap in a
              plain sentence, instead of With AI → Gap rows read across. */}
          {discover.synthesis.rows[0]?.withAi === undefined ? (
            <ol className="dv-gaps dv-gap-40">
              {discover.synthesis.rows.map((row: { stage: string; gap: string }) => (
                <li key={row.stage} className="reveal"><span>{row.stage}</span><p>{row.gap}</p></li>
              ))}
            </ol>
          ) : <div className="dv-stages dv-gap-24">
            <div className="dv-stages-head" aria-hidden="true"><span /><span>{discover.synthesis.withAi}</span><span /><span>{discover.synthesis.gap}</span></div>
            {discover.synthesis.rows.map((row: { stage: string; withAi: string; gap: string }) => (
              <div key={row.stage} className="dv-stage-row reveal">
                <strong>{row.stage}</strong>
                <p className="dv-stage-box"><span className="sr-only">{discover.synthesis.withAi}: </span>{row.withAi}</p>
                <span className="dv-stage-arrow" aria-hidden="true">→</span>
                <p className="dv-stage-box dv-stage-gap"><span className="sr-only">{discover.synthesis.gap}: </span>{row.gap}</p>
              </div>
            ))}
          </div>}
        </div>

        {ff ? (
        <div className="dv-subsection dv-rule">
          <Block {...discover.interview} ff={ff} />
          {/* What we asked comes first, as its own row; then the session photo
              with the four participants stacked beside it. */}
          <div className="dv-gap-40">
            <p className="dv-caps reveal">{discover.interview.questionsLabel}</p>
            <ol className="dv-numbered dv-numbered-row">
              {discover.interview.questions.map((q: string) => <li key={q} className="reveal">{q}</li>)}
            </ol>
          </div>
          <div className="dv-media-row dv-media-row-stretch dv-gap-48">
            <Figure img={discover.interview.photo} sizes="(max-width: 1023px) 100vw, 720px" className="dv-photo" />
            <ul className="dv-people dv-people-stack">
              {discover.interview.participants.map((p: string[]) => (
                <li key={p[0]} className="reveal">
                  <span>{p[0]}</span>
                  <strong>{p[1]}</strong>
                  <span>{discover.interview.participantColumns[2]} {p[2]} · {p[3]}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        ) : (
        <div className="dv-subsection dv-rule">
          <Block {...discover.interview} />
          <div className={discover.interview.photo ? "dv-two dv-gap-40 dv-center" : "dv-gap-40"}>
            {discover.interview.photo && <Figure img={discover.interview.photo} sizes="(max-width: 767px) 100vw, 50vw" className="dv-photo" />}
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
        )}
      </Section>

      <Section id="define" title="Define">
        {/* Findings first: affinity and key problems come straight after the
            interviews, then the personas and journey drawn from them. */}
        {ff ? <>
        <div>
          <Block {...define.affinity} ff={ff} />
          <Figure img={define.affinity.board} className="dv-board dv-gap-72" />
        </div>

        <div className="dv-subsection">
          <Block {...define.problems} ff={ff} />
          <ol className="dv-problems dv-gap-40">
            {define.problems.items.map((item: Study, index: number) => (
              <li key={item.title} className="reveal">
                <div className="dv-problem-top">
                  <span className="dv-problem-number">{pad(index + 1)}</span>
                  <span className="dv-problem-role">{item.role}</span>
                </div>
                <h4>{item.title}</h4>
                <p>{item.body}</p>
                {/* The affinity themes this problem was grouped from. */}
                {define.affinity.themes?.[index] && (
                  <p className="dv-problem-themes">
                    {define.affinity.themesLabel} · {define.affinity.themes[index].map(([name]: [string, number]) => name).join(", ")}
                  </p>
                )}
              </li>
            ))}
          </ol>
        </div>

        {/* Where it breaks first (the journey and its two low points), then who. */}
        <div className="dv-subsection">
        <Block {...define.personas} ff={ff} />
        <Journey journey={define.personas.journey} wide />
        <p className="dv-summary reveal">{define.personas.summary}</p>
        <div className="dv-personas dv-personas-short dv-gap-64">
          {define.personas.people.map((person: Study, index: number) => (
            <article key={person.name} className="dv-persona reveal" data-variant={index === 0 ? "designer" : "developer"}>
              <div className="dv-persona-id">
                {person.avatar ? <Image src={withBase(person.avatar)} alt="" width={88} height={88} className="dv-avatar" /> : <span className="dv-avatar dv-avatar-blank" aria-hidden="true" />}
                <p className="dv-caps dv-persona-role">{person.role}</p>
                <h3 className="dv-persona-name">{person.name}</h3>
                <p className="dv-persona-bio">{person.bio}</p>
                <p className="dv-persona-quote">{person.quote}</p>
              </div>
              <div className="dv-persona-details">
                <div>
                  <p className="dv-caps dv-persona-role">{labels.context}</p>
                  <p className="dv-persona-context">{person.context} {person.contextLead}</p>
                </div>
                <table className="dv-needs">
                  <thead>
                    <tr><th scope="col">{labels.painPoint}</th><td aria-hidden="true" /><th scope="col">{labels.need}</th></tr>
                  </thead>
                  <tbody>
                    {person.pairs.map(([pain, need]: string[]) => (
                      <tr key={pain}><td>{pain}</td><td aria-hidden="true">→</td><td>{need}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>
          ))}
        </div>
        </div>

        </> : <>
        <Block {...define.personas} ff={ff} />
        <div className="dv-personas dv-gap-64">
          {define.personas.people.map((person: Study, index: number) => (
            <article key={person.name} className="dv-persona reveal" data-variant={index === 0 ? "designer" : "developer"}>
              <div className="dv-persona-id">
                {person.avatar ? <Image src={withBase(person.avatar)} alt="" width={88} height={88} className="dv-avatar" /> : <span className="dv-avatar dv-avatar-blank" aria-hidden="true" />}
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
          <Block {...define.affinity} ff={ff} />
          <Figure img={define.affinity.board} className="dv-board dv-gap-72" />
        </div>

        <div className="dv-subsection">
          <Block {...define.problems} ff={ff} />
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

        </>}

        <div className="dv-core">
          {!ff && <p className="dv-method reveal">{define.core.method}</p>}
          <h3 className="dv-block-title reveal">{define.core.title}</h3>
          <p className="dv-core-text reveal">{define.core.lead} <span>{define.core.text}</span></p>
        </div>

        {/* Findings first (class feedback): no HMW block after the problems;
            the ideation rules carry the thinking, the success goals move there. */}
        {!ff && <div className="dv-hmw">
          <p className="dv-method reveal">{define.hmw.method}</p>
          {!ff && <h3 className="dv-block-title reveal">{define.hmw.title}</h3>}
          <p className="dv-hmw-question reveal">{define.hmw.question}</p>
          <p className="dv-caps dv-accent dv-gap-24 reveal">{define.hmw.successLabel}</p>
          <ol className="dv-checks">
            {define.hmw.success.map((s: string, i: number) => <li key={s} className="reveal"><span>{i + 1}</span>{s}</li>)}
          </ol>
        </div>}
      </Section>

      <Section id="develop" title="Develop">
        <div>
          <Block {...develop.ideation} ff={ff} />
          {ff && <>
            <p className="dv-caps dv-accent dv-gap-24 reveal">{define.hmw.successLabel}</p>
            <ol className="dv-checks">
              {define.hmw.success.map((s: string, i: number) => <li key={s} className="reveal"><span>{i + 1}</span>{s}</li>)}
            </ol>
          </>}
        </div>
        {/* Prioritization: how 26 ideas were ranked (DVF + team vote), each
            criterion as its own row so it reads top to bottom. */}
        {develop.priority && <div className="dv-gap-96">
          <Block {...develop.priority} ff={ff} />
          <ol className="dv-criteria dv-gap-24">
            {develop.priority.criteria.map(([name, question]: [string, string]) => (
              <li key={name} className="reveal"><strong>{name}</strong><span>{question}</span></li>
            ))}
          </ol>
        </div>}
        {develop.blocks ? develop.blocks.map((block: Study) => <DevelopBlock key={block.title} block={block} />) : <>
        {develop.matrix && <div className="dv-split dv-gap-80">
          <Figure img={develop.matrix.image} sizes="(max-width: 767px) 100vw, 400px" className="dv-matrix-img" />
          <Block {...develop.matrix} />
        </div>}
        {/* Findings first: text on top, the canvas across the whole column. */}
        {ff ? <div className="dv-gap-96">
          <Block {...develop.canvas} ff={ff} />
          <Figure img={develop.canvas.image} className="dv-canvas-full dv-gap-40" />
          {develop.canvas.candidates && <div className="dv-gap-40">
            <p className="dv-caps reveal">{develop.canvas.candidatesLabel}</p>
            <ol className="dv-candidates">
              {develop.canvas.candidates.map((c: { id: string; name: string; kind: string; pain: string; to: string }) => (
                <li key={c.id} className="reveal">
                  <span className="dv-candidate-id">{c.id}</span>
                  <strong>{c.name}</strong>
                  <p className="dv-candidate-pain"><span>{c.kind}</span>{c.pain}</p>
                  <p className="dv-candidate-to">→ {c.to}</p>
                </li>
              ))}
            </ol>
          </div>}
        </div> : <div className="dv-split dv-gap-96">
          <Figure img={develop.canvas.image} sizes="(max-width: 767px) 100vw, 55vw" className="dv-canvas-img" />
          <Block {...develop.canvas} ff={ff} />
        </div>}
        {develop.dvf && <div className="dv-gap-96">
          <Block {...develop.dvf} />
          <p className="dv-caps dv-accent dv-gap-40 reveal">{develop.dvf.featuresLabel}</p>
          <ul className="dv-features" style={{ "--n": develop.dvf.features.length } as React.CSSProperties}>
            {develop.dvf.features.map((f: { name: string; solves: string }) => (
              <li key={f.name} className="reveal"><strong>{f.name}</strong><span>{f.solves}</span></li>
            ))}
          </ul>
        </div>}
        <div className="dv-gap-96">
          <Block {...develop.sketching} ff={ff} />
          <Figure img={develop.sketching.image} className="dv-cover dv-gap-40" />
        </div>
        {/* Findings first: the four features as cards with their screens, each
            closing on the problem it answers and the direction it came from. */}
        {develop.selection && ff && overview.features ? (
          <div className="dv-main-features">
            <Block title={develop.selection.label} lead={overview.features.title} ff />
            <ul className="dv-features dv-features-shots dv-gap-40" style={{ "--n": overview.features.items.length } as React.CSSProperties}>
              {overview.features.items.map((f: { kicker: string; name: string; body: string; src?: string }) => {
                const pick = develop.selection.items.find((item: { feature: string }) => item.feature === f.name);
                return (
                  <li key={f.name} className="reveal">
                    {f.src && <Image src={withBase(f.src)} alt="" width={1280} height={800} sizes="(max-width: 767px) 100vw, 300px" className="dv-feature-shot" />}
                    <span className="dv-caps dv-accent">{f.kicker}</span><strong>{f.name}</strong><span>{f.body}</span>
                    {pick && (
                      <p className="dv-feature-origin">
                        <span><b>{develop.selection.solves}</b>{pick.problem}</span>
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
            <p className="dv-link reveal"><a href="#deliver">{overview.features.link}</a></p>
          </div>
        ) : develop.selection && (
          <div className="dv-gap-96">
            <p className="dv-caps dv-accent reveal">{develop.selection.label}</p>
            <ol className="dv-selection">
              {develop.selection.items.map((item: { problem: string; feature: string; from: string }, i: number) => (
                <li key={item.feature} className="reveal">
                  <span className="dv-selection-problem">{item.problem}</span>
                  <span className="dv-selection-arrow" aria-hidden="true">→</span>
                  <span className="dv-selection-feature"><strong><b>{pad(i + 1)}</b>{item.feature}</strong><span>{item.from}</span></span>
                </li>
              ))}
            </ol>
          </div>
        )}
        <div className="dv-subsection">
          <Block {...develop.ia} ff={ff} />
          <Figure img={develop.ia.image} className="dv-board dv-gap-40" />
          <div className="dv-gap-96">
            <Block {...develop.flow} ff={ff} />
            <Figure img={develop.flow.image} className="dv-board dv-gap-40" />
          </div>
          {/* Shown once its capture is added (`develop.system.image`). */}
          {develop.system?.image && (
            <div className="dv-gap-96">
              <Block {...develop.system} ff={ff} />
              <Figure img={develop.system.image} className="dv-board dv-system dv-gap-40" />
            </div>
          )}
        </div>
        </>}
      </Section>

      <Section id="deliver" title="Deliver" band={!ff}>
        <Block {...deliver} ff={ff} />
        {ff && deliver.openLabel && <p className="dv-gap-24 reveal"><PrototypeLink label={deliver.openLabel} /></p>}
        <div className="dv-gap-64">
          {deliver.changes ? (
            <ol className="dv-points dv-changes" style={{ "--n": deliver.changes.length } as React.CSSProperties}>
              {deliver.changes.map((c: Study, n: number) => (
                <li key={c.title} className="dv-point reveal">
                  <div className="dv-point-media dv-point-phone"><Image src={withBase(c.src)} alt={c.alt ?? ""} width={c.width ?? 720} height={c.height ?? 1560} sizes="200px" /></div>
                  <p className="dv-point-title"><b aria-hidden="true">{n + 1}</b>{c.title}</p>
                  <p className="dv-point-change"><span className="dv-point-before">{c.before}</span><span className="dv-point-after">{c.after}</span></p>
                </li>
              ))}
            </ol>
          ) : ff ? <DeliverShow features={deliver.features} labels={{ play: deliver.playLabel ?? "Play", pause: deliver.pauseLabel ?? "Pause" }} />
            : <CaseGallery title={deliver.title} items={deliver.features.map((f: Study) => ({ ...f, label: f.title }))} />}
        </div>
        {deliver.handoff && <Handoff handoff={deliver.handoff} features={deliver.features} ff={ff} />}
      </Section>

      {/* Findings first: Testing is a stage of its own (title, band, nav item),
          so it no longer reads as the tail of Deliver. */}
      <section id={ff ? "testing" : undefined} className="dv-section dv-testing" aria-labelledby="testing-title">
        {ff ? <>
          <div className="dv-section-head">
            <h2 id="testing-title" className="dv-section-title reveal">Testing</h2>
          </div>
          <p className="dv-headline dv-headline-plain reveal">{testing.lead}</p>
        </> : <Block {...testing} id="testing-title" />}
        <div className={ff ? "dv-gap-96" : "dv-gap-72"}>
          {/* With a `protocol`: how the test ran beside the photo, the scenarios
              as cards, then the four scores in one row with what they meant. */}
          {testing.usability.protocol ? <>
          <Block {...testing.usability} text={undefined} ff={ff} />
          <div className="dv-media-row dv-gap-40">
            <Figure img={testing.usability.photo} sizes="(max-width: 1023px) 100vw, 720px" className="dv-photo dv-photo-ut" />
            <div>
              <p className="dv-caps reveal">{testing.usability.processLabel}</p>
              <dl className="dv-protocol">
                {testing.usability.protocol.map((row: { label: string; value: string }) => (
                  <div key={row.label} className="reveal"><dt>{row.label}</dt><dd>{row.value}</dd></div>
                ))}
              </dl>
            </div>
          </div>
          {testing.usability.scenarios && (
            <div className="dv-gap-48">
              <p className="dv-caps reveal">{testing.usability.scenariosLabel}</p>
              <ol className="dv-scenarios">
                {testing.usability.scenarios.map((sc: { role: string; feature: string; task: string; actions: string }, i: number) => (
                  <li key={sc.task} className="reveal">
                    <span className="dv-scenario-kicker">{testing.usability.scenarioWord} {pad(i + 1)}</span>
                    <strong>{sc.task}</strong>
                    <span className="dv-scenario-who">{sc.role} · {sc.feature}</span>
                    <span className="dv-scenario-actions">{sc.actions}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
          <div className="dv-gap-64">
            <p className="dv-caps reveal">{testing.usability.resultLabel}</p>
            {testing.usability.resultLead && <p className="dv-finding dv-result-lead reveal">{testing.usability.resultLead}</p>}
            {/* What the scores meant sits under the finding, before the numbers. */}
            <p className="dv-body dv-result reveal">{testing.usability.result}</p>
            <ul className="dv-scores dv-scores-row">
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
          </> : <>
          <Block {...testing.usability} ff={ff} />
          <div className={ff ? "dv-media-row dv-gap-40" : testing.usability.photo ? "dv-two dv-gap-40 dv-center" : "dv-gap-40"}>
            {testing.usability.photo && <Figure img={testing.usability.photo} sizes="(max-width: 1023px) 100vw, 720px" className="dv-photo dv-photo-ut" />}
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
          </>}
        </div>
        {testing.iteration1 && <div className="dv-subsection-120">
          <Block {...testing.iteration1} ff={ff} />
          <div className="dv-gap-40">{ff
            ? <IterationStory before={testing.iteration1.before} after={testing.iteration1.after} changes={testing.iteration1.changes} labels={labels} />
            : <DevsignCompare before={testing.iteration1.before} after={testing.iteration1.after} changes={testing.iteration1.changes} labels={labels} />}</div>
        </div>}
        {testing.iteration2 && <div className="dv-subsection-120">
          <Block {...testing.iteration2} ff={ff} />
          <div className={ff ? "dv-media-row dv-gap-40" : "dv-two dv-gap-40 dv-center"}>
            <Figure img={testing.iteration2.photo} sizes="(max-width: 1023px) 100vw, 720px" className="dv-photo" />
            <div>
              <p className="dv-caps dv-accent reveal">{testing.iteration2.agreedLabel}</p>
              <ol className="dv-numbered">
                {testing.iteration2.agreed.map((a: string) => <li key={a} className="reveal">{a}</li>)}
              </ol>
            </div>
          </div>
          <div className={ff ? "dv-gap-96" : "dv-gap-40"}>{ff
            ? <IterationStory before={testing.iteration2.before} after={testing.iteration2.after} changes={testing.iteration2.changes} labels={labels} />
            : <DevsignCompare before={testing.iteration2.before} after={testing.iteration2.after} changes={testing.iteration2.changes} labels={labels} />}</div>
        </div>}
      </section>

      <Section id="takeaway" title="Takeaway">
        {ff ? <>
        {/* Findings first: the statement, three review cards, then the next
            step as a two-column row (what, then why and what it checks). */}
        <p className="dv-headline dv-headline-plain reveal">{takeaway.headline}</p>
        <p className="dv-body reveal">{takeaway.text}</p>
        <div className="dv-gap-80">
          <p className="dv-caps reveal">{takeaway.reviewTitle}</p>
          <ol className="dv-review-lines">
            {takeaway.review.map((item: { title: string; body: string }, i: number) => (
              <li key={item.title} className="reveal">
                <span>{pad(i + 1)}</span>
                <strong>{item.title}</strong>
                <span>{item.body}</span>
              </li>
            ))}
          </ol>
        </div>
        <div className="dv-next-row dv-gap-80 reveal">
          <p className="dv-caps dv-accent">{takeaway.next.label}</p>
          <p className="dv-finding">{takeaway.next.title}</p>
        </div>
        </> : <>
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
        {takeaway.limitations && <div className="dv-gap-64">
          <h3 className="dv-limit-title reveal">{takeaway.limitationsTitle}</h3>
          <ul className="dv-limits">
            {takeaway.limitations.map((l: { lead: string; text: string }) => (
              <li key={l.lead} className="reveal"><strong>{l.lead}</strong>{l.text}</li>
            ))}
          </ul>
        </div>}
        <div className="dv-next dv-gap-80 reveal">
          <p className="dv-caps">{takeaway.next.label}</p>
          <p className="dv-next-title">{takeaway.next.title}</p>
          <p className="dv-body dv-muted">{takeaway.next.text}</p>
          <ul className="dv-chips">
            {takeaway.next.chips.map((chip: string) => <li key={chip}><span aria-hidden="true">→</span>{chip}</li>)}
          </ul>
        </div>
        </>}
      </Section>
    </div>
  );
}
