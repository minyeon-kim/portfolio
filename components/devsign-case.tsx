import Image from "next/image";
import type { ReactNode } from "react";
import { ArrowIcon } from "@/components/arrow-icon";
import { CaseGallery } from "@/components/case-gallery";
import { DevsignCompare } from "@/components/devsign-compare";
import { DevsignNav } from "@/components/devsign-nav";
import { Wireflow } from "@/components/devsign-wireflow";
import { FeatureReels, IterationCompare, IterationPair, GuidedDemo, DemoDialog, CanvasZoom, AffinityDots } from "@/components/devsign-story";
import { DoubleDiamond } from "@/components/double-diamond";
import { withBase } from "@/lib/site";

// Card colour by who the card is about: designers in the case colour, developers
// in the persona orange, anyone else in blue.
const toneOf = (role: string) => (/design|디자인/i.test(role) ? "accent" : /develop|개발/i.test(role) ? "second" : "blue");
const VOICE_TONES = ["accent", "blue", "second"];
const PROBLEM_TONES = ["accent", "blue", "second", "teal"];

const slugOf = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

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
function Block({ method, title, lead, text, id, label, ff }: Lead & { id?: string; label?: string; ff?: boolean }) {
  if (ff) return (
    <div className="dv-block">
      <p className="dv-label reveal">{label ?? title}</p>
      <h3 id={id} className="dv-finding reveal">{lead}</h3>
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

export function Section({ id, title, band, children }: { id: string; title: string; band?: boolean; children: ReactNode }) {
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
      <div className="dv-journey-legend">
        <button type="button" data-line="designer">{journey.designer}</button>
        <button type="button" data-line="developer">{journey.developer}</button>
      </div>
      <svg viewBox="0 0 1376 340" role="img" aria-label={`${journey.steps.join(" → ")}. ${journey.developer}: ${journey.developerLow}. ${journey.designer}: ${journey.designerLow}.`}>
        {xs.map((x, i) => (
          <g key={x}>
            <rect x={x - (xs[1] - xs[0]) / 2} y="0" width={xs[1] - xs[0]} height="340" className="dv-journey-column" />
            <path d={`M${x + 0.5} 52V322`} className="dv-journey-grid" />
            <text x={x} y="17" textAnchor="middle" fontSize="18" className="dv-svg-strong">{journey.steps[i]}</text>
          </g>
        ))}
        <g transform={`matrix(${k} 0 0 1 ${688 * (1 - k)} 0)`}>
          <path transform="translate(87.5 125.23)" pathLength={1} className="dv-journey-line dv-journey-designer" d="M2.5 112.774C42.3 112.774 161.8 131.074 241.5 112.774C321.2 94.4739 400.7 7.57393 480.5 2.77393C560.3 -2.02607 640.7 57.4739 720.5 83.7739C800.3 110.074 879.8 159.074 959.5 160.774C1039.2 162.474 1158.7 104.974 1198.5 93.7739" />
          <path transform="translate(87.5 157.52)" pathLength={1} className="dv-journey-line dv-journey-developer" d="M2.50068 46.4758C42.3007 60.1758 161.801 135.676 241.501 128.476C321.201 121.276 400.701 13.1758 480.501 3.47581C560.301 -6.22419 640.701 59.2758 720.501 70.4758C800.301 81.6758 879.801 70.4758 959.501 70.4758H1198.5" />
        </g>
                        <image href={withBase("/images/devsign/emoji-angry.svg")} x={sx(329) - 17} y="269" width="34" height="34" className="dv-journey-low" data-line="developer" />
        <text x={sx(329)} y="325" textAnchor="middle" fontSize="18" className="dv-svg-second dv-svg-caps dv-journey-low" data-line="developer">{journey.developerLow.toUpperCase()}</text>
        <image href={withBase("/images/devsign/emoji-angry.svg")} x={sx(1047) - 17} y="269" width="34" height="34" className="dv-journey-low" data-line="designer" />
        <text x={sx(1047)} y="325" textAnchor="middle" fontSize="18" className="dv-svg-accent dv-svg-caps dv-journey-low" data-line="designer">{journey.designerLow.toUpperCase()}</text>
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

  // The tool review reads capability by capability, with Devsign's column first.

  return (
    <div className="dv">
      <DevsignNav items={nav} />

      <Section id="overview" title="Overview">
        <p className="dv-headline reveal">
          {overview.headline} <span>{overview.headlineAccent}</span>
        </p>
        {overview.summary ? (
          <section className="dv-glance-block" aria-labelledby="tldr">
            <h3 id="tldr" className="sr-only">{overview.summary.label}</h3>
            <ul className="dv-glance reveal">
              {overview.summary.items.map((item: { tone: string; label: string; title: string; text: string }) => (
                <li key={item.label} data-tone={item.tone}>
                  <p className="dv-glance-label">{item.label}</p>
                  <p className="dv-glance-title">{item.title}</p>
                  <p className="dv-glance-text">{item.text}</p>
                </li>
              ))}
            </ul>
          </section>
        ) : <div className="dv-psi">{children}</div>}
        <div className="dv-process">
          <h3 className="dv-block-title reveal">{overview.process.title}</h3>
          {!ff && <p className="dv-body reveal">{overview.process.body}</p>}
          <DoubleDiamond stages={overview.process.stages} pivot={overview.process.pivot} />
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

        <div className={ff ? undefined : "dv-question"}>
          {!ff && <>
            <p className="dv-caps dv-question-label reveal">{discover.q1.label}</p>
            <p className="dv-answer reveal">{discover.q1.answer}</p>
          </>}
          {/* Findings first, three sizes: the numbers as large rows, one quote that
              carries the point, the repeated problems small beside the board. */}
          {ff ? (() => {
            const [lead] = discover.q1.groups;
            return <>
              <div className="dv-numbers dv-gap-40">
                {discover.q1.stats.map((stat: { value: string; text: string }) => (
                  <p key={stat.value} className="reveal"><strong>{stat.value}</strong><span>{stat.text}</span></p>
                ))}
                <p className="dv-numbers-source reveal"><a className="dv-source-link" href={discover.q1.surveyUrl} target="_blank" rel="noreferrer">{discover.q1.surveyLabel}</a></p>
              </div>
              <figure className="dv-big-quote-block">
                <blockquote className="dv-big-quote">“{lead.quote}”</blockquote>
                <figcaption className="reveal">{lead.original && <span lang="en">{lead.original}</span>}<span>{lead.source}</span></figcaption>
              </figure>
              <div className="dv-repeated">
                <div>
                  <p className="dv-caps reveal">{discover.q1.problemsLabel}</p>
                  <ul>{discover.q1.groups.map((g: { name: string }) => <li key={g.name} className="reveal">{g.name}</li>)}</ul>
                </div>
                <a className="dv-repeated-board reveal" href={withBase(discover.q1.boards.src)} target="_blank" rel="noreferrer">
                  <Image src={withBase(discover.q1.boards.src)} alt="" width={discover.q1.boards.width} height={discover.q1.boards.height} sizes="(max-width: 1023px) 100vw, 480px" />
                  <span>{discover.q1.boardsLink}</span>
                </a>
              </div>
            </>;
          })() : null}
          {/* With quotes: the two kinds of evidence side by side, survey numbers
              (scale) | the problems people kept posting, each with one real quote. */}
          {ff ? null : discover.q1.groups[0]?.quote ? (
            <div className="dv-evidence dv-gap-40">
              <div>
                <p className="dv-caps reveal">{discover.q1.surveyUrl ? <a className="dv-source-link" href={discover.q1.surveyUrl} target="_blank" rel="noreferrer">{discover.q1.surveyLabel}</a> : discover.q1.surveyLabel}</p>
                <div className="dv-evidence-stats">
                  {discover.q1.stats.map((stat: { value: string; text: string }) => (
                    <div key={stat.value} className="dv-meter reveal">
                      <strong>{stat.value}</strong>
                      <span className="dv-meter-bar" aria-hidden="true"><i style={{ width: stat.value }} /></span>
                      <span>{stat.text}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="dv-caps reveal">{discover.q1.communityLabel}</p>
                <ol className="dv-voices">
                  {discover.q1.groups.map((g: { name: string; quote: string; source: string; sourceUrl?: string }, i: number) => (
                    <li key={g.name} className="reveal" data-tone={VOICE_TONES[i % VOICE_TONES.length]}>
                      <div>
                        <strong>{g.name}</strong>
                        <blockquote>“{g.quote}”</blockquote>
                        <cite>{g.sourceUrl ? <a className="dv-source-link" href={g.sourceUrl} target="_blank" rel="noreferrer">{g.source}</a> : g.source}</cite>
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

        <div className={ff ? "dv-subsection" : "dv-question"}>
          {ff ? <Block title={discover.q2.title} lead={discover.q2.answer} ff /> : <>
            <p className="dv-caps dv-question-label reveal">{discover.q2.label}</p>
            <p className="dv-answer reveal">{discover.q2.answer}</p>
          </>}
          {discover.q2.groups ? (
            <div className="dv-gap-48">
              <p className="dv-caps reveal">{discover.q2.auditLabel}</p>
              <Groups groups={discover.q2.groups} />
            </div>
          ) : (
          <>
          {ff && <p className="dv-caps dv-gap-40 reveal">{discover.q2.auditLabel}</p>}
          <table className="dv-tool-gaps dv-gap-16 reveal">
            <caption className="sr-only">{discover.q2.auditLabel}</caption>
            <thead>
              <tr>{discover.q2.headers.map((header: string) => <th key={header} scope="col">{header}</th>)}</tr>
            </thead>
            <tbody>
              {discover.q2.rows.map((row: Study) => (
                <tr key={row.type}>
                  <th scope="row">{row.type}</th>
                  <td>{row.tools}</td>
                  <td>{row.solves}</td>
                  <td data-gap="" data-label={discover.q2.headers[3]}>{row.gap}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </>

          )}
        </div>

        <div className={ff ? "dv-subsection" : "dv-question"}>
          {ff ? <Block title={discover.synthesis.label} lead={discover.synthesis.title} text={discover.synthesis.text} ff /> : <>
            <p className="dv-caps reveal">{discover.synthesis.label}</p>
            <p className="dv-answer reveal">{discover.synthesis.title}</p>
            {discover.synthesis.text && <p className="dv-body reveal">{discover.synthesis.text}</p>}
          </>}
          {/* Gap only (class feedback): one card per stage with the gap in a
              plain sentence, instead of With AI → Gap rows read across. */}
          {discover.synthesis.rows[0]?.withAi === undefined ? (
            <ol className="dv-flow dv-gap-40 reveal">
              {discover.synthesis.rows.map((row: { stage: string; gap: string }) => (
                <li key={row.stage}><span className="dv-flow-stage">{row.stage}</span><p>{row.gap}</p></li>
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
          {/* What we asked (each question lights up as it reaches the eye line), then the
              session, wide, and who was in it, credited under the picture. */}
          <div className="dv-asks dv-gap-40">
            <p className="dv-caps reveal">{discover.interview.questionsLabel}</p>
            <ol>
              {discover.interview.questions.map((q: string, i: number) => <li key={q}><b>{i + 1}</b>{q}</li>)}
            </ol>
          </div>
          <figure className="dv-meet reveal">
            <div className="dv-meet-photo">
              <Image src={withBase(discover.interview.photo.src)} alt={discover.interview.photo.alt} width={discover.interview.photo.width} height={discover.interview.photo.height} sizes="(max-width: 767px) 180vw, 1600px" />
            </div>
            <ul aria-label={discover.interview.peopleLabel}>
              {discover.interview.participants.map((p: string[]) => (
                <li key={p[0]} data-tone={toneOf(p[1])}>
                  <b>{p[0]}</b>
                  <strong>{p[1]}</strong>
                  <span>{discover.interview.participantColumns[2]} {p[2]} · {p[3]}</span>
                </li>
              ))}
            </ul>
          </figure>
          <div className="dv-interview-result reveal">
            <p className="dv-caps">{discover.interview.resultLabel}</p>
            <p className="dv-finding">{discover.interview.result}</p>
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
          {define.affinity.funnel && (
            <AffinityDots
              funnel={define.affinity.funnel}
              note={define.affinity.otherNote}
              answeredBy={develop.selection?.answeredBy}
              problems={define.problems.items.map((item: Study, i: number) => ({
                title: item.title,
                tone: PROBLEM_TONES[i % PROBLEM_TONES.length],
                insight: define.affinity.insights[i],
                quote: define.affinity.quotes[i][0],
                who: define.affinity.quotes[i][1],
                feature: develop.selection?.items.find((pick: { problem: string }) => pick.problem === item.title)?.feature,
              }))}
              groups={[
                ...define.affinity.themes.flatMap((list: [string, number][], i: number) => list.map(([name, count]) => ({ name, count, problem: i, tone: PROBLEM_TONES[i % PROBLEM_TONES.length] }))),
                { name: define.affinity.otherTheme[0], count: define.affinity.otherTheme[1], problem: -1 },
              ]}
            />
          )}
          {define.affinity.funnel && (
            <div className="dv-dots-static">
              <ol className="dv-funnel dv-gap-40 reveal">
                {define.affinity.funnel.map(([n, label]: [string, string]) => <li key={label}><strong>{n}</strong><span>{label}</span></li>)}
              </ol>
            </div>
          )}
          {define.affinity.funnel && (
            <div className="dv-aff dv-dots-static">
              <ol>
                {define.problems.items.map((item: Study, i: number) => (
                  <li key={item.title} className="reveal" data-tone={PROBLEM_TONES[i % PROBLEM_TONES.length]}>
                    <h4>{item.title}</h4>
                    <blockquote>“{define.affinity.quotes[i][0]}”</blockquote>
                    <p className="dv-aff-who">{define.affinity.quotes[i][1]}</p>
                    <p>{define.affinity.insights[i]}</p>
                  </li>
                ))}
              </ol>
            </div>
          )}
          <a className="dv-board-link reveal" href={withBase(define.affinity.board.src)} target="_blank" rel="noreferrer">
            <Image src={withBase(define.affinity.board.src)} alt={define.affinity.board.alt} width={define.affinity.board.width} height={define.affinity.board.height} sizes="280px" />
            <span>{define.affinity.boardLink}</span>
          </a>
        </div>

        {/* Where it breaks first (the journey and its two low points), then who. */}
        <div className="dv-subsection">
        <Block {...define.personas} ff={ff} />
        <div className="dv-cast dv-gap-40">
          {define.personas.people.map((person: Study, index: number) => (
            <article key={person.name} className="reveal" data-line={index === 0 ? "designer" : "developer"}>
              <h4>{person.name}</h4>
              <p className="dv-cast-bio">{person.bio}</p>
              <p className="dv-cast-quote">{person.quote}</p>
              <p className="dv-cast-context">{person.context}</p>
              <table className="dv-needs">
                <thead>
                  <tr><th scope="col">{labels.painPoint}</th><td aria-hidden="true" /><th scope="col">{labels.need}</th></tr>
                </thead>
                <tbody>
                  {person.pairs.map(([pain, need]: string[]) => (
                    <tr key={pain}><td>{pain}</td><td aria-hidden="true"><ArrowIcon /></td><td><strong>{need}</strong></td></tr>
                  ))}
                </tbody>
              </table>
            </article>
          ))}
        </div>
        <Journey journey={define.personas.journey} wide />
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
                      <tr key={pain}><td>{pain}</td><td aria-hidden="true"><ArrowIcon /></td><td><strong>{need}</strong></td></tr>
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
          {ff && <p className="dv-core-kicker reveal">{define.core.title}</p>}
          {!ff && <p className="dv-method reveal">{define.core.method}</p>}
          {!ff && <h3 className="dv-block-title reveal">{define.core.title}</h3>}
          <p className="dv-core-text reveal">{define.core.lead}{define.core.text && <> <span>{define.core.text}</span></>}</p>
        </div>

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
        {develop.dropped && <div>
          <Block {...develop.dropped} ff={ff} />
          <p className="dv-dropped dv-gap-24 reveal"><s>{develop.dropped.from}</s><ArrowIcon /><b>{develop.dropped.to}</b></p>
        </div>}
        {develop.ideation && <div><Block {...develop.ideation} ff={ff} /></div>}
        {develop.blocks ? develop.blocks.map((block: Study) => <DevelopBlock key={block.title} block={block} />) : <>
        {develop.matrix && <div className="dv-split dv-gap-80">
          <Figure img={develop.matrix.image} sizes="(max-width: 767px) 100vw, 400px" className="dv-matrix-img" />
          <Block {...develop.matrix} />
        </div>}
        {/* Findings first: text on top, the canvas across the whole column. */}
        {ff ? <div className="dv-gap-96">
          <Block {...develop.canvas} ff={ff} />
          <div className="dv-gap-40 reveal">
            <CanvasZoom art={develop.canvas.zoom} candidates={develop.canvas.candidates} keyPairs={develop.canvas.keyPairs} painLabel={develop.canvas.painLabel} reliefLabel={develop.canvas.reliefLabel} featureLabel={develop.canvas.featureLabel} overviewLabel={develop.canvas.candidatesLabel} />
          </div>
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
        {/* Findings first: the four features one at a time, large, each playing
            its prototype clip and closing on the problem it answers. */}
        {develop.selection && ff && overview.features ? (
          <div className="dv-main-features">
            <Block title={develop.selection.label} lead={overview.features.title} ff />
            <FeatureReels
              reels={overview.features.items.map((f: { kicker: string; name: string; body: string }) => {
                const pick = develop.selection.items.find((item: { feature: string }) => item.feature === f.name);
                const shown = deliver.features?.find((item: Study) => item.title === f.name);
                return {
                  id: `feature-${slugOf(f.name)}`,
                  kicker: f.kicker,
                  name: f.name,
                  body: f.body,
                  alt: shown?.alt,
                  points: shown?.points ?? [],
                  clip: shown?.clip,
                  solves: pick && <span><b>{develop.selection.solves}</b>{pick.problem}</span>,
                };
              })}
            />
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
          {ff ? (
            <ul className="dv-artifacts">
              {[develop.ia, develop.flow].map((item: Study) => (
                <li key={item.title} className="reveal">
                  <a href={withBase(item.image.src)} target="_blank" rel="noreferrer">
                    <Image src={withBase(item.image.src)} alt={item.image.alt} width={item.image.width} height={item.image.height} sizes="(max-width: 767px) 100vw, 600px" />
                    <strong>{item.title}<span aria-hidden="true"> ↗</span></strong>
                  </a>
                  <p>{item.lead}</p>
                </li>
              ))}
            </ul>
          ) : <>
            <Block {...develop.ia} ff={ff} />
            <Figure img={develop.ia.image} className="dv-board dv-gap-40" />
            <div className="dv-gap-96">
              <Block {...develop.flow} ff={ff} />
              <Figure img={develop.flow.image} className="dv-board dv-gap-40" />
            </div>
          </>}
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

      {/* The opener's link target sits outside the stage: stages and their blocks
          are mid-rise when the link is pressed, which would throw the landing off. */}
      <Section id="deliver" title="Deliver" band={!ff}>
        <div>
          <Block {...deliver} ff={ff} />
          {deliver.tryIt && <div id="try" className="dv-gap-40 reveal"><GuidedDemo {...deliver.tryIt} /></div>}
          {deliver.tryIt && <DemoDialog {...deliver.tryIt} />}
        </div>
        {!ff && (
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
            ) : <CaseGallery title={deliver.title} items={deliver.features.map((f: Study) => ({ ...f, label: f.title }))} />}
          </div>
        )}
        {deliver.handoff && (
          <div className="dv-gap-96">
            <Block {...deliver.handoff} ff={ff} />
            <Wireflow nodes={deliver.handoff.nodes} label={deliver.handoff.lead} />
          </div>
        )}
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
          {/* With a `protocol`: the result first (finding, who and how much, the
              scores, what they meant); how the test ran is folded underneath. */}
          {testing.usability.protocol ? <>
          <Block {...testing.usability} lead={testing.usability.resultLead ?? testing.usability.lead} text={undefined} ff={ff} />
          <p className="dv-body dv-ut-summary reveal">
            {testing.usability.protocol.filter((row: { value?: string }) => row.value).map((row: { value: string }) => row.value).join(" · ")}
          </p>
          {testing.usability.verdict ? <>
          {/* Each success goal beside its verdict, then the other scores, then what it meant. */}
          {/* One chart: each score against its goal or benchmark, then the goals' verdicts. */}
          <ul className="dv-bars dv-gap-40 reveal">
            {testing.usability.scores.map((item: Study) => (
              <li key={item.title} data-bad={item.missed || item.below || undefined}>
                <div className="dv-bar-label"><strong>{item.title}</strong><span>{item.note}</span></div>
                <div className="dv-bar-track">
                  <i style={{ width: `${item.ratio * 100}%` }} />
                  {item.target && <em style={{ left: `${item.target[0] * 100}%` }}><span>{item.target[1]}</span></em>}
                </div>
                <p className="dv-bar-value">{item.value}<small>{item.unit}</small></p>
              </li>
            ))}
          </ul>
          <ul className="dv-goal-lines reveal">
            {define.hmw.success.map((goal: string, i: number) => (
              <li key={goal} data-missed={i === 0 || undefined}>
                <span>{testing.usability.verdict.goal} {i + 1}</span>
                <p>{goal}</p>
                <b>{i === 0 ? testing.usability.verdict.missed : testing.usability.verdict.pending}</b>
              </li>
            ))}
          </ul>
          <div className="dv-ut-result reveal">
            <p>{testing.usability.resultLabel}</p>
            <p>{testing.usability.result}</p>
          </div>
          </> : <>
          {/* The scores and the next step are judged against these goals. */}
          {ff && (
            <div className="dv-goals reveal">
              <p>{define.hmw.successLabel}</p>
              <ol>
                {define.hmw.success.map((s: string, i: number) => <li key={s}><span>{i + 1}</span>{s}</li>)}
              </ol>
            </div>
          )}
          <ul className="dv-scores dv-scores-row dv-gap-40">
            {testing.usability.scores.map((s: Study) => (
              <li key={s.title} className="reveal">
                <div className="dv-donut">
                  <Donut ratio={s.ratio} missed={s.missed} />
                  <span className="dv-donut-value-text" data-missed={s.missed || undefined}>{s.value}<small>{s.unit}</small></span>
                </div>
                <div>
                  <strong>{s.title}</strong>
                  <span data-missed={s.missed || undefined}>{s.note}</span>
                </div>
              </li>
            ))}
          </ul>
          <p className="dv-body dv-result dv-gap-32 reveal">{testing.usability.result}</p>
          </>}
          {testing.usability.scenarios && (
            <div className="dv-gap-40 reveal">
              <p className="dv-caps">{testing.usability.scenariosLabel}</p>
              <ol className="dv-scenarios">
                {testing.usability.scenarios.map((sc: { role: string; feature: string; task: string }) => (
                  <li key={sc.task}>
                    <strong>{sc.task}</strong>
                    <span className="dv-scenario-who">{sc.role} · {sc.feature}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
          </> : <>
          <Block {...testing.usability} ff={ff} />
          <div className={ff ? "dv-media-row dv-gap-40" : testing.usability.photo ? "dv-two dv-gap-40 dv-center" : "dv-gap-40"}>
            {testing.usability.photo && <Figure img={testing.usability.photo} sizes="(max-width: 1023px) 100vw, 720px" className="dv-photo dv-photo-ut" />}
            <ul className="dv-scores">
              {testing.usability.scores.map((s: Study) => (
                <li key={s.title} className="reveal">
                  <div className="dv-donut">
                    <Donut ratio={s.ratio} missed={s.missed} />
                    <span className="dv-donut-value-text" data-missed={s.missed || undefined}>{s.value}<small>{s.unit}</small></span>
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
          <Block {...testing.iteration1} text={ff ? undefined : testing.iteration1.text} ff={ff} />
          {ff && <p className="dv-iter-why reveal"><b>{testing.iteration1.whyLabel}</b>{testing.iteration1.text}</p>}
          <div className="dv-gap-40">{ff
            ? <IterationPair before={testing.iteration1.before} after={testing.iteration1.after} labels={labels} />
            : <DevsignCompare before={testing.iteration1.before} after={testing.iteration1.after} changes={testing.iteration1.changes} labels={labels} />}</div>
        </div>}
        {testing.iteration2 && <div className="dv-subsection-120">
          {ff ? <>
            <div className="dv-iter-head">
              <div>
                <Block {...testing.iteration2} text={undefined} ff={ff} />
                <p className="dv-iter-why reveal"><b>{testing.iteration2.whyLabel}</b>{testing.iteration2.text}</p>
              </div>
              {testing.iteration2.photo && <Figure img={testing.iteration2.photo} sizes="(max-width: 1023px) 100vw, 400px" className="dv-photo dv-photo-wide" />}
            </div>
            <div className="dv-gap-40"><IterationCompare before={testing.iteration2.before} after={testing.iteration2.after} changes={testing.iteration2.changes} labels={labels} /></div>
          </> : <>
            <Block {...testing.iteration2} ff={ff} />
            <div className="dv-two dv-gap-40 dv-center">
              <Figure img={testing.iteration2.photo} sizes="(max-width: 1023px) 100vw, 720px" className="dv-photo" />
              <div>
                <p className="dv-caps dv-accent reveal">{testing.iteration2.agreedLabel}</p>
                <ol className="dv-numbered">
                  {testing.iteration2.agreed.map((a: string) => <li key={a} className="reveal">{a}</li>)}
                </ol>
              </div>
            </div>
            <div className="dv-gap-40"><DevsignCompare before={testing.iteration2.before} after={testing.iteration2.after} changes={testing.iteration2.changes} labels={labels} /></div>
          </>}
        </div>}
      </section>

      <Section id="takeaway" title="Takeaway">
        {/* The statement, three learning cards, limits if any, then the next step
            as one wide card. */}
        <p className="dv-headline dv-headline-plain reveal">{takeaway.headline}</p>
        <p className="dv-body reveal">{takeaway.text}</p>
        <div className="dv-gap-80">
          <p className="dv-caps reveal">{takeaway.reviewTitle}</p>
          <ol className="dv-learned">
            {takeaway.review.map((item: { title: string; body: string }, i: number) => (
              <li key={item.title} className="reveal" data-tone={["accent", "blue", "teal"][i % 3]}>
                <span className="dv-learned-number">{pad(i + 1)}</span>
                <h4>{item.title}</h4>
                <p>{item.body}</p>
              </li>
            ))}
          </ol>
        </div>
        {takeaway.limitations && <div className="dv-gap-40">
          <p className="dv-caps reveal">{takeaway.limitationsTitle}</p>
          <ul className="dv-learned dv-learned-plain">
            {takeaway.limitations.map((l: { lead: string; text: string }) => (
              <li key={l.lead} className="reveal">
                <h4>{l.lead}</h4>
                <p>{l.text}</p>
              </li>
            ))}
          </ul>
        </div>}
        <div className="dv-next-card reveal" data-after-limits={takeaway.limitations ? "" : undefined}>
          <p className="dv-caps dv-accent">{takeaway.next.label}</p>
          <p className="dv-finding">{takeaway.next.title}</p>
          {!ff && <>
            <p className="dv-body">{takeaway.next.text}</p>
            <ul className="dv-next-chips">
              {takeaway.next.chips.map((chip: string) => <li key={chip}>{chip}</li>)}
            </ul>
          </>}
        </div>
      </Section>
    </div>
  );
}
