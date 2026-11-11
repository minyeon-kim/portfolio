import Image from "next/image";
import { GlanceSteps } from "./glance-steps";
import type { CSSProperties, ReactNode } from "react";
import { SurveyCharts } from "@/components/devsign-survey-charts";
import { InterviewCards } from "@/components/interview-cards";
import { ArrowIcon } from "@/components/arrow-icon";
import { CaseGallery } from "@/components/case-gallery";
import { DevsignCompare } from "@/components/devsign-compare";
import { Wireflow } from "@/components/devsign-wireflow";
import { FlowChart, IaFocusTree } from "@/components/devsign-diagrams";
import { FlowPlay } from "@/components/flow-play";
import { AffinityExplorer } from "@/components/affinity-explorer";
import { DetailScroll } from "@/components/detail-scroll";
import { AffinityThemes } from "@/components/affinity-themes";
import { CountUp, AffinityMotion, AffinityWall, AffinityMap, FeatureList, ScreenSteps, IterationCompare, IterationPair, CanvasZoom, OpenFrame, ProblemPanels, HandoffTabs, HeldFlow } from "@/components/devsign-story";
import { DoubleDiamond } from "@/components/double-diamond";
import { ToolMap } from "@/components/tool-map";
import { withBase } from "@/lib/site";

// Card colour by who the card is about: designers in the case colour, developers
// in the persona orange, anyone else in blue.
const toneOf = (role: string) => (/design|디자인/i.test(role) ? "accent" : /develop|개발/i.test(role) ? "second" : "blue");
const VOICE_TONES = ["accent", "blue", "second"];

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
  "/images/devsign/value-effort-matrix.webp": [376 / 440, 103.73, 107.53, -1.87, -5.91],
  "/images/devsign/codesign-session.webp": [720 / 472, 108.84, 118.47, -4.38, -13.12],
};

function Figure({ img, sizes = "(max-width: 767px) 100vw, 80vw", className = "", open }: { img: Img; sizes?: string; className?: string; open?: boolean }) {
  const crop = CROPS[img.src];
  // Eager: a lazy image fetched only once its row scrolls in arrived after the
  // reveal had already played, and popped in late.
  const image = <Image src={withBase(img.src)} alt={img.alt ?? ""} width={img.width} height={img.height} sizes={sizes} loading="eager" />;
  const frame = crop ? (
    <div className="dv-crop" style={{ aspectRatio: crop[0], "--w": `${crop[1]}%`, "--h": `${crop[2]}%`, "--l": `${crop[3]}%`, "--t": `${crop[4]}%` } as CSSProperties}>{image}</div>
  ) : img.fit ? <div className="dv-fit" style={{ aspectRatio: img.fit }}>{image}</div> : image;
  return (
    <figure className={`dv-figure reveal ${className}`}>
      {open ? <OpenFrame href={withBase(img.src)}>{frame}</OpenFrame> : frame}
      {img.caption && <figcaption>{img.caption}</figcaption>}
    </figure>
  );
}

// Method label, uppercase block title, then a bold lead sentence running into muted text.
// Findings first (`ff`, the Devsign case): the method's name as a small label,
// the finding or decision as the heading, then the text; `label` overrides the
// label (Iteration 1 · Split by role) and `feature` tags the feature it changed.
// Discover, findings first: the scale of the research in one line, then a block per
// method. Each block leads with what it found, large; primary research comes last,
// and runs from why it was done to what it found.
function Insights({ discover }: { discover: Study }) {
  const { q1, q2, synthesis, interview } = discover;
  return (
    <div className="dv-insights">
      <div>
        {/* The block's heading rides in the held chart stage, so it stays with the chart. The
            community posts are the stage's last tab when the case has `communityTab` (owner). */}
        <section className="dv-cycle-card">
          <SurveyCharts
            charts={q1.communityTab ? [...q1.charts, {
              type: "quotes", tab: q1.communityTab, title: `${q1.communityCount} ${q1.communityLead}`,
              source: { label: q1.boardsLink.replace(/ ↗$/, ""), url: withBase(q1.boards.src) },
              items: q1.groups,
            }] : q1.charts}
            labels={q1.chartLabels}
            head={<><ChapterHead id="discover" title="Discover" /><Block {...discover.desk} ff /></>}
          />
        </section>
        {!q1.communityTab && !q1.hideCommunity && <section className="dv-posts">
          <div className="dv-posts-head reveal">
            <p className="dv-posts-lead"><CountUp value={q1.communityCount} /> {q1.communityLead}</p>
            <a className="dv-source-link" href={withBase(q1.boards.src)} target="_blank" rel="noreferrer">{q1.boardsLink}</a>
          </div>
          <ul className="dv-posts-list">
            {q1.groups.map((g: { name: string; quote: string; source: string; sourceUrl?: string }) => (
              <li key={g.name} className="reveal">
                <strong>{g.name}</strong>
                <blockquote>“{g.quote}”</blockquote>
                <cite>{g.sourceUrl ? <a className="dv-source-link" href={g.sourceUrl} target="_blank" rel="noreferrer">{g.source}</a> : g.source}</cite>
              </li>
            ))}
          </ul>
        </section>}
      </div>

      <div className="dv-subsection">
        {q2.map ? <div className="dv-tm">
          <Block title={q2.title} lead={q2.answer} ff />
          <ToolMap map={q2.map} />
        </div> : <>
        <Block title={q2.title} lead={q2.answer} ff />
        <p className="dv-caps dv-gap-40 reveal">{q2.auditLabel}</p>
        <table className="dv-tool-gaps dv-gap-16 reveal">
          <caption className="sr-only">{q2.auditLabel}</caption>
          <thead>
            <tr>{q2.headers.map((header: string) => <th key={header} scope="col">{header}</th>)}</tr>
          </thead>
          <tbody>
            {q2.rows.map((row: Study) => (
              <tr key={row.type}>
                <th scope="row">{row.type}</th>
                <td>{row.tools}</td>
                <td>{row.solves}</td>
                <td data-gap="" data-label={q2.headers[3]}>{row.gap}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </>}
      </div>

      <div className="dv-subsection">
        <HeldFlow count={synthesis.rows.length}>
        <Block title={synthesis.label} lead={synthesis.title} text={synthesis.text} ff />
        {synthesis.rows[0]?.kept ? (
        <KeptLost synthesis={synthesis} />
        ) : (
        <FlowPlay className="dv-flow-play dv-gap-40 reveal"><ol className="dv-flow">
          {synthesis.rows.map((row: { stage: string; before?: string; lost?: string; gap: string }, i: number) => (
            <li key={row.stage} style={{ "--i": i } as CSSProperties}><span className="dv-flow-stage">{row.stage}</span>{row.lost ? <p className="dv-flow-pair"><strong>{row.lost}</strong><span>{row.gap}</span></p> : <p>{row.before && <>{row.before} </>}<b>{row.gap}</b></p>}</li>
          ))}
        </ol></FlowPlay>
        )}
        </HeldFlow>
      </div>

      <div className="dv-subsection">
        <div className="dv-iv-top">
          <div>
            <Block {...interview} ff />
          </div>
          <figure className="reveal">
            <div className="dv-iv-tiles">
              {interview.photo.tiles.map((t: { src: string; alt: string }) => (
                <Image key={t.src} src={withBase(t.src)} alt={t.alt} width={816} height={544} sizes="(max-width: 767px) 33vw, 240px" />
              ))}
            </div>
          </figure>
        </div>
        {interview.answers ? (
          <InterviewCards questions={interview.questions} keys={interview.questionKeys} participants={interview.participants} peopleLabel={interview.peopleLabel} questionsLabel={interview.questionsLabel} />
        ) : (
        <div className="dv-iv-rows">
          <section className="dv-iv-row reveal">
            <h4 className="dv-iv-rowlabel">{interview.questionsLabel}</h4>
            <ol className="dv-ivq">
              {interview.questions.map((q: string, i: number) => (
                <li key={q}><b>{interview.questionKeys[i]}</b><span>{q}</span></li>
              ))}
            </ol>
          </section>
          <section className="dv-iv-row reveal">
            <h4 className="dv-iv-rowlabel">{interview.peopleLabel}</h4>
            <ul className="dv-ivp">
              {interview.participants.map(([id, role, team, exp]: string[]) => (
                <li key={id}><b>{id}</b><strong>{role}</strong><span>{team} · {exp}</span></li>
              ))}
            </ul>
          </section>
        </div>
        )}
      </div>
    </div>
  );
}

function Block({ method, title, lead, text, id, label, ff, meta }: Lead & { id?: string; label?: string; ff?: boolean; meta?: string }) {
  if (ff || lead) return (
    <div className="dv-block">
      <p className="dv-label reveal">{label ?? title}{meta && <span className="dv-label-meta">{meta}</span>}</p>
      {lead && <h3 id={id} className="dv-finding reveal">{lead}</h3>}
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

// Discover for a case whose evidence is papers and a service audit rather than posts
// and a tool table: same order and same boxes as `Insights`.
function EvidenceColumns({ label, link, groups }: { label: string; link?: ReactNode; groups: { name: string; detail: string }[] }) {
  return (
    <section className="dv-evbox dv-evbox-voices">
      <div className="dv-evbox-head reveal"><p>{label}</p>{link}</div>
      <ul className="dv-insight-voices">
        {groups.map((g) => (
          <li key={g.name} className="reveal">
            <strong>{g.name}</strong>
            {g.detail.split(" · ").map((line) => <p key={line}>{line}</p>)}
          </li>
        ))}
      </ul>
    </section>
  );
}

// An analysis as stage rows: what stays (or happens now) → what's lost (or missing).
function KeptLost({ synthesis }: { synthesis: Study }) {
  return (
    <FlowPlay className="dv-flow-play dv-gap-40 reveal">
      <p className="dv-kl-head" aria-hidden="true"><span /><span>{synthesis.keptLabel}</span><span /><span>{synthesis.lostLabel}</span></p>
      <ol className="dv-flow dv-kl">
      {synthesis.rows.map((row: { stage: string; kept: string; lost: string }, i: number) => (
        <li key={row.stage} style={{ "--i": i } as CSSProperties}>
          <span className="dv-kl-stage">{row.stage}</span>
          <span className="dv-kl-kept"><span className="sr-only">{synthesis.keptLabel}: </span>{row.kept}</span>
          <svg className="dv-kl-arrow" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
          <span className="dv-kl-lost"><span className="sr-only">{synthesis.lostLabel}: </span>{row.lost}</span>
        </li>
      ))}
      </ol>
    </FlowPlay>
  );
}

function SourceInsights({ discover }: { discover: Study }) {
  const { q1, q2, synthesis, interview, desk } = discover;
  return (
    <div className="dv-insights">
      <div>
        <section className="dv-cycle-card">
          <SurveyCharts charts={q1.charts} labels={q1.chartLabels} head={<><ChapterHead id="discover" title="Discover" /><Block title={desk.title} lead={q1.answer} text={desk.text} ff /></>} />
        </section>
        <EvidenceColumns label={q1.communityLabel} groups={q1.groups} />
      </div>

      <div className="dv-subsection">
        <Block title={q2.title} lead={q2.answer} ff />
        {q2.map ? <ToolMap map={q2.map} /> : <div className="dv-gap-40"><EvidenceColumns label={q2.auditLabel} groups={q2.groups} /></div>}
      </div>

      <div className="dv-subsection">
        <HeldFlow count={synthesis.rows.length}>
        <Block title={synthesis.label} lead={synthesis.title} ff />
        {synthesis.rows[0]?.kept ? <KeptLost synthesis={synthesis} /> : <FlowPlay className="dv-flow-play dv-gap-40 reveal"><ol className="dv-flow">
          {synthesis.rows.map((row: { stage: string; withAi: string; gap: string }, i: number) => (
            <li key={row.stage} style={{ "--i": i } as CSSProperties}><span className="dv-flow-stage">{row.stage}</span><p>{row.withAi} <b>{row.gap}</b></p></li>
          ))}
        </ol></FlowPlay>}
        </HeldFlow>
      </div>

      <div className="dv-subsection">
        <Block {...interview} ff />
        {/* Questions and people as the same read-down rows Devsign uses. */}
        <div className="dv-iv-rows">
          <section className="dv-iv-row reveal">
            <h4 className="dv-iv-rowlabel">{interview.questionsLabel}</h4>
            <ol className="dv-ivq">
              {interview.questions.map((q: string, i: number) => (
                <li key={q}><b>{interview.questionKeys?.[i] ?? i + 1}</b><span>{q}</span></li>
              ))}
            </ol>
          </section>
          <section className="dv-iv-row reveal">
            <h4 className="dv-iv-rowlabel">{interview.peopleLabel}</h4>
            <ul className="dv-ivp">
              {interview.participants.map(([id, role, why, kind]: string[]) => (
                <li key={id}><b>{id}</b><strong>{role}</strong><span>{why} · {kind}</span></li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}

// The chapter title, for a chapter whose first block holds on the scroll: it rides in the held
// stage so it stays with the block instead of scrolling away first (owner).
function ChapterHead({ id, title }: { id: string; title: string }) {
  return <div className="dv-section-head"><h2 id={`${id}-title`} className="dv-section-title reveal">{title}</h2></div>;
}

export function Section({ id, title, band, noHead, children }: { id: string; title: string; band?: boolean; noHead?: boolean; children: ReactNode }) {
  return (
    <section id={id} className={band ? "dv-section dv-band" : "dv-section"} aria-labelledby={`${id}-title`}>
      {!noHead && <div className="dv-section-head">
        <h2 id={`${id}-title`} className="dv-section-title reveal">{title}</h2>
      </div>}
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
    <FlowPlay className="dv-journey dv-journey-play dv-scroll reveal" from={0.85} to={0.3}>
      <div className="dv-journey-legend">
        <button type="button" data-line="designer">{journey.designer}</button>
        <button type="button" data-line="developer">{journey.developer}</button>
        {/* What up and down mean, so the curve reads without guessing (review: no axis). */}
        {journey.axis && <span className="dv-journey-axis">{journey.axis}</span>}
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
                        <image href={withBase("/images/devsign/emoji-angry.svg")} x={sx(329) - 17} y="269" width="34" height="34" className="dv-journey-low" data-seq="" style={{ "--i": 9 } as CSSProperties} data-line="developer" />
        <text x={sx(329)} y="325" textAnchor="middle" fontSize="18" className="dv-svg-second dv-svg-caps dv-journey-low" data-seq="" style={{ "--i": 9 } as CSSProperties} data-line="developer">{journey.developerLow.toUpperCase()}</text>
        <image href={withBase("/images/devsign/emoji-angry.svg")} x={sx(1047) - 17} y="269" width="34" height="34" className="dv-journey-low" data-seq="" style={{ "--i": 9 } as CSSProperties} data-line="designer" />
        <text x={sx(1047)} y="325" textAnchor="middle" fontSize="18" className="dv-svg-accent dv-svg-caps dv-journey-low" data-seq="" style={{ "--i": 9 } as CSSProperties} data-line="designer">{journey.designerLow.toUpperCase()}</text>
      </svg>
    </FlowPlay>
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
      {block.image && <Figure img={block.image} className="dv-cover dv-gap-40" open={Boolean(block.image.fit)} />}
      {block.images && (
        <div className={block.images.length > 2 ? "dv-screens dv-gap-40" : "dv-two dv-gap-40"} style={{ "--n": block.images.length } as CSSProperties}>
          {block.images.map((img: Img) => <Figure key={img.src} img={img} sizes="(max-width: 767px) 100vw, 40vw" className={block.images.length > 2 ? "dv-screen" : "dv-photo"} />)}
        </div>
      )}
      {/* Directions narrowed with the scroll: all of them come in one by one, then the
          ones the reframed problem dropped fall back to muted and the kept ones stay lit. */}
      {block.directions && (
        <FlowPlay className="dv-dirs-play dv-gap-40" from={0.85} to={0.3}>
          <ol className="dv-dirs">
            {block.directions.map((d: { name: string; kept?: boolean }, i: number) => (
              <li key={d.name} data-seq="" data-kept={d.kept ? "" : undefined} style={{ "--i": i } as CSSProperties}>
                <span aria-hidden="true">{pad(i + 1)}</span>{d.name}
                {d.kept && <b className="dv-dirs-tag">{block.keptTag}</b>}
              </li>
            ))}
          </ol>
          <span className="dv-dirs-cut" data-seq="" aria-hidden="true" style={{ "--i": block.directions.length + 0.6 } as CSSProperties} />
        </FlowPlay>
      )}
      {/* What the feedback kept and dropped, as the two panels the tool review uses. */}
      {block.verdict && (
        <figure className="dv-cmp2 dv-cmp2-named dv-gap-40 reveal">
          <div className="dv-cmp2-panels">
            {[block.verdict.dropped, block.verdict.kept].map((side: { title: string; items: string[][] }, k: number) => (
              <section key={side.title} data-self={k === 1 ? "" : undefined}>
                <h4>{side.title}</h4>
                <dl>{side.items.map(([name, note]) => <div key={name}><dt>{name}</dt><dd>{note}</dd></div>)}</dl>
              </section>
            ))}
          </div>
        </figure>
      )}
      {block.features && (
        <>
          <p className="dv-caps dv-accent dv-gap-40 reveal">{block.featuresLabel}</p>
          <ul className="dv-features" style={{ "--n": block.features.length } as CSSProperties}>
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

  // The tool review reads capability by capability, with Devsign's column first.

  const deliverIntro = (
    <div className="dv-deliver-intro">
      {/* The chapter title rides in the held stage, so it stays while the features step. */}
      <ChapterHead id="deliver" title="Deliver" />
      {/* With no finding under the label, the label and the link share one line. */}
      <div className={deliver.lead || deliver.text ? undefined : "dv-deliver-row"}>
        <Block {...deliver} ff={ff} />
        {deliver.link && <p id="try" className="dv-try-link reveal"><a className="press" href={deliver.link.href} target="_blank" rel="noreferrer">{deliver.link.label}</a></p>}
      </div>
    </div>
  );
  return (
    <div className="dv">

      <Section id="overview" title="Overview">
        {!overview.summary && (
        <p className="dv-headline reveal">
          {overview.headline} <span>{overview.headlineAccent}</span>{overview.headlineAfter}
        </p>
        )}
        {overview.summary ? (
          <section className="dv-glance-block" aria-labelledby="tldr">
            <h3 id="tldr" className="sr-only">{overview.summary.label}</h3>
            <div className="reveal"><GlanceSteps items={overview.summary.items} label={overview.summary.label} /></div>
          </section>
        ) : <div className="dv-psi">{children}</div>}
        {/* The photo follows the summary (owner: under the content, not between headline and summary). */}
        {overview.photo && <Figure img={overview.photo} sizes="(max-width: 1023px) 100vw, 1200px" className="dv-me-photo" />}
        <div className="dv-process">
          <h3 className="dv-block-title reveal">{overview.process.title}</h3>
          <DoubleDiamond stages={overview.process.stages} pivot={overview.process.pivot} waist={overview.process.waist} end={overview.process.end} />
        </div>
        {/* With a problem → feature selection in Develop, the feature cards live there instead. */}
        {overview.features && !(ff && develop.selection) && !deliver.flows && (
          <div className="dv-main-features">
            <Block title={overview.features.method} lead={overview.features.title} ff />
            <ul className={`dv-features dv-gap-40${ff ? " dv-features-shots" : ""}`} style={{ "--n": overview.features.items.length } as CSSProperties}>
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

      <Section id="discover" title="Discover" noHead>
        {ff ? <Insights discover={discover} /> : <SourceInsights discover={discover} />}
      </Section>

      <Section id="define" title="Define">
        {/* Findings first: affinity and key problems come straight after the
            interviews, then the personas and journey drawn from them. */}
        {ff ? <>
        <div>
          <Block {...define.affinity} ff={ff} />
          {/* The process first: how many statements became how many problems, and the board itself. */}
          {define.affinity.explorer
            ? <AffinityExplorer locale={define.affinity.explorer} boardHref={withBase(define.affinity.board.src)} />
            : define.affinity.wall
            ? <AffinityMap wall={define.affinity.wall} problems={define.problems.items} people={discover.interview?.participants ?? []} funnel={define.affinity.funnel} />
            : <ol className="dv-funnel dv-gap-40 reveal">
            {define.affinity.funnel.map(([n, label]: [string, string]) => <li key={label}><strong>{n}</strong><span>{label}</span></li>)}
          </ol>}
          {define.affinity.explorer ? null : define.affinity.wall ? <p className="dv-aff-foot"><a className="link" href={withBase(define.affinity.board.src)} target="_blank" rel="noreferrer">{define.affinity.boardLabel}</a></p> : define.affinity.groups
            ? <AffinityMotion groups={define.affinity.groups} replay={define.affinity.replay} board={{ href: withBase(define.affinity.board.src), label: define.affinity.boardLabel }} />
            : <Figure img={define.affinity.board} sizes="(max-width: 767px) 100vw, 1200px" className="dv-board" open />}
        </div>

        <div className="dv-subsection">
          <ProblemPanels items={define.problems.items}>
            <Block {...define.problems} ff={ff} />
          </ProblemPanels>
        </div>

        {/* Where it breaks first (the journey and its two low points), then who. */}
        <div className="dv-subsection">
        <Block {...define.personas} ff={ff} />
        <div className="dv-cast dv-gap-40">
          {define.personas.people.map((person: Study, index: number) => (
            <article key={person.name} className="reveal" data-line={index === 0 ? "designer" : "developer"}>
              <div className="dv-cast-head">
                {person.avatar && <Image src={withBase(person.avatar)} alt="" width={96} height={96} className="dv-cast-photo" />}
                <div>
                  <h4>{person.name}</h4>
                  <p className="dv-cast-bio">{person.bio}</p>
                </div>
              </div>
              <p className="dv-cast-quote">{person.quote}</p>
            </article>
          ))}
        </div>
        <Journey journey={define.personas.journey} wide />
        </div>

        </> : <>
        <div>
          <Block {...define.affinity} ff />
          {define.affinity.funnel && (
            <ol className="dv-funnel dv-gap-40 reveal">
              {define.affinity.funnel.map(([n, label]: [string, string]) => <li key={label}><strong>{n}</strong><span>{label}</span></li>)}
            </ol>
          )}
          {define.affinity.themes
            ? <AffinityThemes board={{ ...define.affinity.board, src: withBase(define.affinity.board.src) }} rows={define.affinity.rows} themes={define.affinity.themes} label={define.affinity.themesLabel} />
            : <Figure img={define.affinity.board} className="dv-board dv-gap-24" open />}
        </div>

        {define.problems.panels ? (
        <div className="dv-subsection">
          <ProblemPanels items={define.problems.items}>
            <Block {...define.problems} ff />
          </ProblemPanels>
        </div>
        ) : (
        <div className="dv-subsection">
          <Block {...define.problems} ff />
          <table className="dv-found dv-found-pair dv-gap-40 reveal">
            <thead>
              <tr>{define.problems.columns.map((label: string) => <th key={label} scope="col">{label}</th>)}</tr>
            </thead>
            <tbody>
              {define.problems.items.map((item: Study) => (
                <tr key={item.title} data-key={item.lowest || undefined}>
                  <th scope="row">{item.title}{item.lowest && <span className="dv-pill dv-pill-accent">{define.problems.lowest}</span>}</th>
                  <td>{item.body}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}

        <div className="dv-subsection">
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
                    <tr><th scope="col">{labels.painPoint}</th><th scope="col"><span className="sr-only">→</span></th><th scope="col">{labels.need}</th></tr>
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
        </div>

        </>}

        <div className="dv-core">
          <p className="dv-core-kicker reveal">{define.core.title}</p>
          <p className="dv-core-text reveal">{define.core.lead}{define.core.text && <> <span>{define.core.text}</span></>}</p>
        </div>

        {!ff && define.hmw && <div className="dv-hmw">
          {define.hmw.question && <p className="dv-label reveal">{define.hmw.title}</p>}
          {define.hmw.question && <p className="dv-hmw-question reveal">{define.hmw.question}</p>}
          <p className="dv-caps dv-accent dv-gap-24 reveal">{define.hmw.successLabel}</p>
          <ol className="dv-checks">
            {define.hmw.success.map((s: string, i: number) => <li key={s} className="reveal"><span>{i + 1}</span>{s}</li>)}
          </ol>
        </div>}
      </Section>

      <Section id="develop" title="Develop">
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
            <CanvasZoom art={develop.canvas.zoom} candidates={develop.canvas.candidates} keyPairs={develop.canvas.keyPairs} painLabel={develop.canvas.painLabel} reliefLabel={develop.canvas.reliefLabel} featureLabel={develop.canvas.featureLabel} overviewLabel={develop.canvas.candidatesLabel} caption={develop.canvas.pairsCaption} />
          </div>
        </div> : <div className="dv-split dv-gap-96">
          <Figure img={develop.canvas.image} sizes="(max-width: 767px) 100vw, 55vw" className="dv-canvas-img" />
          <Block {...develop.canvas} ff={ff} />
        </div>}
        {develop.dvf && <div className="dv-gap-96">
          <Block {...develop.dvf} />
          <p className="dv-caps dv-accent dv-gap-40 reveal">{develop.dvf.featuresLabel}</p>
          <ul className="dv-features" style={{ "--n": develop.dvf.features.length } as CSSProperties}>
            {develop.dvf.features.map((f: { name: string; solves: string }) => (
              <li key={f.name} className="reveal"><strong>{f.name}</strong><span>{f.solves}</span></li>
            ))}
          </ul>
        </div>}
        {!develop.sketching.placeholder && (
        <div className="dv-gap-96">
          <Block {...develop.sketching} ff={ff} />
          {/* TODO: the photo here was only an example; an empty box until Minyeon adds the real sketches. */}
          {/* Until then the block is text only (no empty box on the page). */}
          {!develop.sketching.placeholder && <Figure img={develop.sketching.image} className="dv-cover dv-gap-40" />}
        </div>
        )}
        {develop.selection && !ff && (
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
          <Block {...develop.ia} text={ff ? undefined : develop.ia.text} ff={ff} />
          <IaFocusTree tree={develop.ia.tree} />
          <div className="dv-gap-96">
            <Block {...develop.flow} text={ff ? undefined : develop.flow.text} ff={ff} />
            <FlowChart chart={develop.flow.chart} />
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

      <Section id="deliver" title="Deliver" noHead>
        {/* The prototype heading and link ride in the core features' held stage when there is one. */}
        {!((ff && develop.selection && overview.features) || deliver.flows) && deliverIntro}
        {/* Findings first: the four features one at a time, large, each playing
            its prototype clip and closing on the problem it answers. */}
        {ff && develop.selection && overview.features && (
          <div className="dv-main-features dv-main-features-joined">
            {/* One block with the prototype heading above (owner): the features are what the prototype holds. */}
            <FeatureList
              open
              head={deliverIntro}
              reels={overview.features.items.map((f: { kicker: string; name: string; body: string; hook?: string; flow?: string }) => {
                const pick = develop.selection.items.find((item: { feature: string }) => item.feature === f.name);
                const shown = deliver.features?.find((item: Study) => item.title === f.name);
                return {
                  id: `feature-${slugOf(f.name)}`,
                  kicker: f.kicker,
                  name: f.name,
                  body: f.body,
                  hook: f.hook,
                  flow: f.flow,
                  alt: shown?.alt,
                  points: shown?.points ?? [],
                  clip: shown?.clip,
                  solves: pick && <span><b>{develop.selection.solves}</b>{pick.problem}</span>,
                };
              })}
            />
          </div>
        )}
        {/* Gemini: the prototype's two flows as recorded phone clips, in the core-features form. */}
        {deliver.flows && (
          <div className="dv-main-features dv-main-features-joined">
            <FeatureList
              open
              phone
              head={deliverIntro}
              reels={deliver.flows.map((f: { id: string; kicker: string; name: string; hook?: string; solves?: string; solvesLabel?: string; alt?: string; clip: { src: string; poster: string } }) => ({
                id: `flow-${f.id}`,
                kicker: f.kicker,
                name: f.name,
                body: "",
                hook: f.hook,
                alt: f.alt,
                points: [],
                clip: { ...f.clip, marks: [] },
                solves: f.solves && <span><b>{f.solvesLabel}</b>{f.solves}</span>,
              }))}
            />
          </div>
        )}
        {/* UI details: the small parts of a screen where a decision happens, cut out
            and set on a soft case-colour card, one per row, text beside it. */}
        {deliver.details && (
          <div className="dv-details">
            <Block title={deliver.details.label} lead={deliver.details.lead} ff={ff} />
            <DetailScroll items={deliver.details.items} asIs={labels.asIs ?? "As-is"} />
          </div>
        )}
        {!ff && !deliver.details && (
          <div className="dv-gap-64">
            {deliver.changes ? (
              <ScreenSteps changes={deliver.changes} labels={labels} />
            ) : <CaseGallery title={deliver.title} items={deliver.features.map((f: Study) => ({ ...f, label: f.title }))} />}
          </div>
        )}
        {deliver.handoff && !deliver.spec && (
          <div className="dv-gap-96">
            <Block {...deliver.handoff} ff={ff} />
            <Wireflow nodes={deliver.handoff.nodes} label={deliver.handoff.lead} />
          </div>
        )}
        {deliver.spec && (
          <div className="dv-gap-96">
            <Block method={deliver.spec.label} title={deliver.spec.label} lead={deliver.spec.lead} ff={ff} />
            <HandoffTabs spec={deliver.spec} />
          </div>
        )}
      </Section>

      {/* Findings first: Testing is a stage of its own (title, band, nav item),
          so it no longer reads as the tail of Deliver. */}
      <section id="testing" className="dv-section dv-testing" aria-labelledby="testing-title">
        {/* No stage line under the title: the usability finding opens the stage (owner: the text
            read as too many separate pieces). `testing.lead` still feeds the diamond. */}
        <div>
          {/* With a `protocol`: the result first (finding, who and how much, the
              scores, what they meant). */}
          {testing.usability.protocol ? <>
          {/* The finding is the block's heading; each chart's own sentence is a smaller caption
              (owner: without the heading the block had no hierarchy). */}
          <section className="dv-cycle-card"><SurveyCharts charts={testing.usability.facts ? testing.usability.charts.slice(0, 1) : testing.usability.charts} labels={testing.usability.chartLabels} head={<><ChapterHead id="testing" title="Testing" /><Block {...testing.usability} lead={testing.usability.resultLead ?? testing.usability.lead} text={undefined} ff={ff} /></>} below={testing.usability.facts && <dl className="dv-ut-rows">
            {testing.usability.facts.map((fact: { value: string; label: string; hint?: string }) => <div key={fact.label}><dt>{fact.label}{fact.hint && <span>{fact.hint}</span>}</dt><dd>{fact.value}</dd></div>)}
          </dl>} /></section>
          {testing.usability.result && <p className="dv-body dv-ut-meaning-text dv-gap-40 reveal">{testing.usability.result}</p>}
          {testing.usability.sheet && <p className="dv-aff-foot dv-gap-40 reveal"><a className="link" href={withBase(testing.usability.sheet.src)} target="_blank" rel="noreferrer">{testing.usability.sheet.label}</a></p>}
          </> : <>
          <section className="dv-cycle-card"><SurveyCharts charts={testing.usability.charts} labels={testing.usability.chartLabels} head={<><ChapterHead id="testing" title="Testing" /><Block {...testing.usability} ff={ff} /></>} /></section>
          {/* The success criteria the test measures, moved here from Define so the Problem
              statement can close Define as a full sheet (as on Devsign). */}
          {testing.goals && <div className="dv-goals dv-gap-64">
            <p className="dv-caps dv-accent reveal">{testing.goals.label}</p>
            <ol className="dv-checks">
              {testing.goals.items.map((s: string, i: number) => <li key={s} className="reveal"><span>{i + 1}</span>{s}</li>)}
            </ol>
          </div>}
          </>}
        </div>
        {testing.iteration1 && <div className="dv-subsection-120">
          <Block {...testing.iteration1} text={ff ? undefined : testing.iteration1.text} ff={ff} />
          {ff && <p className="dv-iter-why reveal">{testing.iteration1.text}</p>}
          <div className="dv-gap-40">{ff
            ? <IterationPair before={testing.iteration1.before} after={testing.iteration1.after} labels={labels} />
            : <DevsignCompare before={testing.iteration1.before} after={testing.iteration1.after} changes={testing.iteration1.changes} labels={labels} />}</div>
        </div>}
        {testing.iteration2 && <div className="dv-subsection-120">
          {ff ? <>
            <IterationCompare changes={testing.iteration2.changes} labels={labels} head={
              <div className="dv-iv-top dv-iter-top">
                <div>
                  <Block {...testing.iteration2} text={undefined} ff={ff} />
                  {testing.iteration2.text && <p className="dv-iter-why reveal">{testing.iteration2.text}</p>}
                </div>
                {testing.iteration2.photo && <Figure img={testing.iteration2.photo} sizes="(max-width: 1023px) 100vw, 480px" className="dv-iter-photo" />}
              </div>
            } />
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
        {/* The conclusion, the learnings as rows that read down, then the next step on its own panel. */}
        <div className="dv-tk">
          <p className="dv-headline dv-headline-plain reveal">{takeaway.headline}</p>
          {takeaway.photo && <Figure img={takeaway.photo} sizes="(max-width: 1023px) 100vw, 520px" className="dv-me-photo dv-me-photo-tk" />}
          <div className="dv-tk-part reveal">
            <h3 className="dv-tk-label">{takeaway.reviewTitle}</h3>
            <ol className="dv-tk-cards">
              {takeaway.review.map((item: { title: string; body?: string }, i: number) => (
                <li key={item.title}>
                  <b aria-hidden="true">{pad(i + 1)}</b>
                  <h4>{item.title}</h4>
                  {item.body && <p>{item.body}</p>}
                </li>
              ))}
            </ol>
          </div>
          {takeaway.limitations && <div className="dv-tk-part reveal">
            <h3 className="dv-tk-label">{takeaway.limitationsTitle}</h3>
            <ul className="dv-tk-limits">
              {takeaway.limitations.map((l: { lead: string; text: string }) => (
                <li key={l.lead}>
                  <h4>{l.lead}</h4>
                  <p>{l.text}</p>
                </li>
              ))}
            </ul>
          </div>}
          <div className="dv-tk-next reveal">
            <h3 className="dv-tk-label">{takeaway.next.label}</h3>
            <div>
              <p className="dv-tk-next-title">{takeaway.next.title}</p>
              {takeaway.next.text && <p className="dv-body">{takeaway.next.text}</p>}
              {!ff && <>
                <ul className="dv-tk-chips">
                  {takeaway.next.chips.map((chip: string) => <li key={chip}>{chip}</li>)}
                </ul>
              </>}
            </div>
          </div>
        </div>
      </Section>
    </div>
  );
}
