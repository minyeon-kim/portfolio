import fs from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import Image from "next/image";
import { ArrowIcon } from "@/components/arrow-icon";
import { SiteFooter } from "@/components/site-footer";
import { Todo } from "@/components/todo";
import * as en from "@/content/about.mdx";
import * as ko from "@/content/ko/about.mdx";
import { localize, type Locale } from "@/lib/i18n";
import { shareMeta, site, withBase } from "@/lib/site";

// Page labels around the copy in content/about.mdx (content/ko/about.mdx).
const copy = {
  en: {
    label: "About", portrait: "Minyeon placing sticky notes on a wall during a workshop",
    experience: "Experience",
    skills: "Skills",
    atWork: "At work",
    photos: {
      "panel-wall": "Minyeon laughing with a teammate at the table",
      side: "Minyeon laughing during a team discussion",
      talk: "Minyeon looking over a screen with a teammate",
      "panel-talk": "Minyeon smiling as she talks at the table",
      laptop: "Minyeon going through a design on a laptop with a teammate",
      hands: "Hands around a table covered in printed screens, sketches and sticky notes",
      desk: "Minyeon working on a laptop",
      screen: "Minyeon typing on her laptop at a meeting table, this portfolio site on a large screen behind",
    } as Record<string, string>,
    open: "Open to product designer and design engineer roles.",
    work: "Selected work", contact: "Contact", resume: "Resume (PDF)", email: "Email", copyEmail: "Copy",
    steps: "Then and now", research: "Research", build: "Design and build", copyHint: "Press to copy", copied: "Copied", read: "Read the case",
  },
  ko: {
    label: "소개", portrait: "워크숍에서 벽에 포스트잇을 붙이는 김민연",
    experience: "Experience",
    skills: "역량",
    atWork: "At work",
    photos: {
      "panel-wall": "테이블에서 팀원과 함께 웃는 김민연",
      side: "팀 논의 중에 웃고 있는 김민연",
      talk: "팀원과 함께 화면을 살펴보는 김민연",
      "panel-talk": "테이블에서 웃으며 이야기하는 김민연",
      laptop: "노트북으로 팀원과 디자인을 함께 보는 김민연",
      hands: "출력한 화면과 스케치, 포스트잇이 놓인 테이블에 모인 손",
      desk: "노트북으로 작업하는 김민연",
      screen: "회의 테이블에서 노트북을 치는 김민연과, 큰 화면에 띄운 이 포트폴리오",
    } as Record<string, string>,
    open: "프로덕트 디자이너와 디자인 엔지니어 포지션을 찾고 있습니다.",
    work: "Selected work", contact: "Contact", resume: "Resume (PDF)", email: "Email", copyEmail: "복사",
    steps: "Then and now", research: "리서치", build: "디자인과 제작", copyHint: "눌러서 복사", copied: "복사됨", read: "케이스 보기",
  },
};

export function aboutMetadata(locale: Locale): Metadata {
  const description = (locale === "ko" ? ko : en).bio[0] ?? site.positioning;
  return { title: copy[locale].label, description, ...shareMeta(localize("/about/", locale), `${copy[locale].label} — ${site.name}`, description) };
}

// One idea, security to design: the intro and portrait on the first screen, what
// carried over from security consulting (then -> now), experience on a band, photos,
// then the roles and the work. Photo spots are labelled placeholders until real
// photos exist. The portrait's box is mirrored in lib/about-entrance.ts.
export async function AboutPage({ locale = "en" }: { locale?: Locale }) {
  const { bio, bridge, cards, experience, headline, panels } = locale === "ko" ? ko : en;
  // The sheet over the three cards: the first sentence as the title, the rest under it.
  const [statementLead, ...statementRest] = bridge.statement.split(/(?<=\.)\s+/);
  const c = copy[locale];
  // Only link the resume once the PDF actually exists in /public.
  const hasResume = fs.existsSync(path.join(process.cwd(), "public", site.resumeUrl));
  const heroPhoto = "/images/about/hero-tall.webp";
  // The two photos that appear beside the profile photo while scrolling (desktop); the gallery's own row of them hides there.
  const splitPhotos: [string, "left" | "right"][] = [["side", "left"], ["talk", "right"]];

  return (
    <div data-about-page className="project-detail">
      {/* After superhuman.com's hero: the photo fills the screen, the headline and actions
          sit centred over it, and a few glass cards float on the plain wall at the right.
          The photo's crop is mirrored in lib/about-entrance.ts (aboutHeroPosition). */}
      <div className="about-hero-track">
      <header className="about-hero">
        <div className="about-split-sheet" aria-hidden="true" />
        <div className="about-split-title"><p>{statementLead}</p><p>{statementRest.join(" ")}</p></div>
        {splitPhotos.map(([name, side]) => (
          <figure key={name} className="about-split-card" data-side={side}>
            <Image src={withBase(`/images/about/${name}.webp`)} alt={c.photos[name]} fill sizes="34vw" />
            <p className="about-split-tag">{cards[side]}</p>
          </figure>
        ))}
        <div className="about-hero-photo">
          <Image src={withBase(heroPhoto)} alt={c.portrait} fill sizes="100vw" priority />
        </div>
        {/* The part of the photo inside the line: it lifts off the photo and glides to the middle. */}
        <div className="about-split-portrait" aria-hidden="true">
          <Image src={withBase(heroPhoto)} alt="" width={2160} height={1700} sizes="100vw" />
        </div>
        <div className="about-split-frame" aria-hidden="true" />
        <div className="about-hero-copy">
          <h1 tabIndex={-1} className="about-hero-title">
            {headline.map((line, i) => <span key={line} className="about-hero-line">{i === 0 ? line.replace(/,$/, "") : line} </span>)}
          </h1>
          <p className="about-hero-subtitle">{bio[0]}</p>
          <p className="about-hero-actions">
            {site.email && <a href={`mailto:${site.email}`} className="press" data-primary="">{c.email}<ArrowIcon /></a>}
            {site.linkedinUrl && <a href={site.linkedinUrl} className="press">LinkedIn</a>}
            {hasResume && <a href={withBase(site.resumeUrl)} className="press">{c.resume}</a>}
          </p>
        </div>
      </header>
      </div>
      <article className="about-body">
        <Todo>add where you are based and whether you are open to relocation or remote roles</Todo>

        <section className="about-bridge">
          <h2 className="sr-only">{c.steps}</h2>
          <p className="about-statement reveal">{bridge.statement}</p>
          <div className="about-panels">
            {bridge.rows.map((row, i) => (
              <article key={row.title} className="about-panel">
                <Image src={withBase(`/images/about/${panels[i].photo}.webp`)} alt={c.photos[panels[i].photo]} fill sizes="100vw" data-photo={panels[i].photo} />
                <div className="about-panel-copy">
                  <h3>{row.title}</h3>
                  <p className="about-panel-lead">{row.body}</p>
                </div>
              </article>
            ))}
            <article className="about-panel about-panel-sheet">
              <div className="about-panel-copy">
                <h2>{c.experience}</h2>
                <ol className="about-exp">
                  {experience.map((item) => (
                    <li key={item.title}><span>{item.label.split(" · ")[0]}</span><strong>{item.title}</strong></li>
                  ))}
                </ol>
              </div>
            </article>
            <article className="about-panel about-panel-contact" aria-labelledby="about-contact-title">
              <Image src={withBase("/images/about/laptop.webp")} alt={c.photos.laptop} fill sizes="100vw" />
              <div className="about-panel-copy">
                <h2 id="about-contact-title">{c.open}</h2>
                <p className="about-panel-actions">
                  {site.email && <a href={`mailto:${site.email}`} className="press">{c.email}</a>}
                  {site.linkedinUrl && <a href={site.linkedinUrl} target="_blank" rel="noopener noreferrer" className="link">LinkedIn</a>}
                  {hasResume && <a href={withBase(site.resumeUrl)} className="link">{c.resume}</a>}
                </p>
              </div>
            </article>
          </div>
        </section>

        <SiteFooter />
      </article>
    </div>
  );
}

// A section title in the case pages' form: display size, light, without a counter.
function StageHead({ title, id }: { title: string; id?: string }) {
  return (
    <div className="about-stage-head reveal">
      <h2 id={id}>{title}</h2>
    </div>
  );
}
