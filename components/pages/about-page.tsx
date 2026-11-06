import fs from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowIcon } from "@/components/arrow-icon";
import { AboutBridge, AboutEmail } from "@/components/about-interactive";
import { SiteFooter } from "@/components/site-footer";
import { Todo } from "@/components/todo";
import * as en from "@/content/about.mdx";
import * as ko from "@/content/ko/about.mdx";
import { localize, type Locale } from "@/lib/i18n";
import { getCases } from "@/lib/cases";
import { shareMeta, site, withBase } from "@/lib/site";

// Page labels around the copy in content/about.mdx (content/ko/about.mdx).
const copy = {
  en: {
    label: "About", portrait: "Minyeon placing sticky notes on a wall during a workshop",
    experience: "Experience",
    skills: "Skills",
    atWork: "At work",
    photos: {
      "board-wide": "Minyeon and a teammate sorting sticky notes on a glass wall",
      side: "Minyeon laughing during a team discussion",
      talk: "Minyeon talking at a table with printed screens and sticky notes",
      "board-bw": "Minyeon at the sticky-note wall with a teammate, in black and white",
      laptop: "Minyeon going through a design on a laptop with a teammate",
      hands: "Hands around a table covered in printed screens, sketches and sticky notes",
      desk: "Minyeon working on a laptop",
      screen: "Minyeon typing on her laptop at a meeting table, this portfolio site on a large screen behind",
    } as Record<string, string>,
    open: "Open to product designer and design engineer roles.",
    work: "Selected work", contact: "Contact", resume: "Resume (PDF)", email: "Email", copyEmail: "Copy email",
    steps: "Then and now", research: "Research", build: "Design and build", copyHint: "Press to copy", copied: "Copied", read: "Read the case",
  },
  ko: {
    label: "소개", portrait: "워크숍에서 벽에 포스트잇을 붙이는 김민연",
    experience: "경력",
    skills: "역량",
    atWork: "일하는 모습",
    photos: {
      "board-wide": "유리벽에 붙인 포스트잇을 팀원과 정리하는 김민연",
      side: "팀 논의 중에 웃고 있는 김민연",
      talk: "출력한 화면과 포스트잇이 놓인 테이블에서 이야기하는 김민연",
      "board-bw": "포스트잇 벽 앞에서 팀원과 이야기하는 김민연, 흑백",
      laptop: "노트북으로 팀원과 디자인을 함께 보는 김민연",
      hands: "출력한 화면과 스케치, 포스트잇이 놓인 테이블에 모인 손",
      desk: "노트북으로 작업하는 김민연",
      screen: "회의 테이블에서 노트북을 치는 김민연과, 큰 화면에 띄운 이 포트폴리오",
    } as Record<string, string>,
    open: "프로덕트 디자이너와 디자인 엔지니어 포지션을 찾고 있습니다.",
    work: "작업", contact: "Contact", resume: "이력서 (PDF)", email: "이메일", copyEmail: "이메일 복사",
    steps: "그때와 지금", research: "리서치", build: "디자인과 제작", copyHint: "눌러서 복사", copied: "복사했습니다", read: "케이스 보기",
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
  const { bio, bridge, experience, headline, skills } = locale === "ko" ? ko : en;
  const c = copy[locale];
  // Only link the resume once the PDF actually exists in /public.
  const hasResume = fs.existsSync(path.join(process.cwd(), "public", site.resumeUrl));
  // Photo spots show labelled boxes while writing; the live site leaves them out
  // until the real files are in /public/images/about/.
  const inPublic = (file: string) => fs.existsSync(path.join(process.cwd(), "public", file));
  const heroPhoto = "/images/about/hero.webp";
  // Photos from the Figma Photo page, in justified rows: each row keeps every photo
  // whole at one height ([name, width, height]).
  const photoRows: [string, number, number][][] = [
    [["side", 1800, 1547], ["talk", 1800, 1200], ["screen", 1280, 1600]],
    [["board-wide", 1800, 962], ["board-bw", 1800, 1200]],
    [["laptop", 1800, 1200], ["hands", 1800, 1200], ["desk", 2400, 1500]],
  ];
  const photos = photoRows.map((row) => row.filter(([name]) => inPublic(`/images/about/${name}.webp`))).filter((row) => row.length);
  const work = (await getCases(locale)).filter((entry) => entry.meta.featured && !entry.meta.draft);
  // The security years, as one glass card on the hero.
  const then = experience.find((item) => /SK/.test(item.title));
  const total = 5;

  return (
    <div data-about-page className="project-detail">
      {/* After superhuman.com's hero: the photo fills the screen, the headline and actions
          sit centred over it, and a few glass cards float on the plain wall at the right.
          The photo's crop is mirrored in lib/about-entrance.ts (aboutHeroPosition). */}
      <header className="about-hero">
        <div className="about-hero-photo">
          <Image src={withBase(heroPhoto)} alt={c.portrait} fill sizes="100vw" priority />
        </div>
        <div className="about-hero-copy">
          <h1 tabIndex={-1} className="about-hero-title">
            {headline.map((line) => <span key={line} className="about-hero-line">{line} </span>)}
          </h1>
          <p className="about-hero-subtitle">{bio[0]}</p>
          <p className="about-hero-actions">
            {site.email && <a href={`mailto:${site.email}`} className="press" data-primary="">{c.email}<ArrowIcon /></a>}
            {site.linkedinUrl && <a href={site.linkedinUrl} className="press">LinkedIn</a>}
            {hasResume && <a href={withBase(site.resumeUrl)} className="press">{c.resume}</a>}
          </p>
        </div>
        <div className="about-floats">
          {then && (
            <div className="about-float" data-spot="then">
              <p className="about-float-label">{then.label}</p>
              <p className="about-float-title">{then.title}</p>
            </div>
          )}
          {work.map((entry, index) => (
            <Link key={entry.slug} href={localize(`/work/${entry.slug}/`, locale)} className="about-float about-float-case" data-spot={index ? "case-2" : "case-1"} data-project={entry.slug}>
              <span className="about-float-label">{c.work}</span>
              <span className="about-float-title">{entry.meta.short ?? entry.meta.title}<ArrowIcon /></span>
            </Link>
          ))}
        </div>
      </header>
      <article className="about-body">
        <Todo>add where you are based and whether you are open to relocation or remote roles</Todo>

        <section className="about-bridge">
          <StageHead n={1} total={total} title={c.steps} />
          <p className="about-statement reveal">{bridge.statement}</p>
          <AboutBridge rows={bridge.rows} then={bridge.then} now={bridge.now} label={c.steps} />
        </section>

        {photos.length > 0 && (
          <section className="about-gallery" aria-labelledby="about-at-work">
            <StageHead n={2} total={total} title={c.atWork} id="about-at-work" />
            {photos.map((row) => (
              <div key={row[0][0]} className="about-gallery-row">
                {row.map(([name, width, height]) => (
                  <figure key={name} className="about-gallery-photo reveal" style={{ flexGrow: width / height }}>
                    <Image src={withBase(`/images/about/${name}.webp`)} alt={c.photos[name]} width={width} height={height}
                      sizes={row.length > 1 ? "(max-width: 767px) 100vw, 50vw" : "100vw"} />
                  </figure>
                ))}
              </div>
            ))}
          </section>
        )}

        <section className="about-band">
          <div className="about-band-inner">
            <StageHead n={3} total={total} title={c.experience} />
            <ol className="about-timeline">
              {experience.map((item) => (
                <li key={item.title} className="reveal">
                  <p className="about-timeline-label">{item.label}</p>
                  <div>
                    <h3>{item.title}</h3>
                    <p>{item.body}</p>
                  </div>
                </li>
              ))}
            </ol>
            <div className="about-skills reveal">
              <h3 className="about-timeline-label">{c.skills}</h3>
              <div className="about-skill-groups">
                {([[c.research, skills.research], [c.build, skills.build]] as const).map(([name, list]) => (
                  <div key={name}>
                    <p>{name}</p>
                    <ul>{list.map((skill) => <li key={skill}>{skill}</li>)}</ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="about-close">
          <StageHead n={4} total={total} title={c.work} />
          <ul className="about-work">
            {work.map((entry) => (
              <li key={entry.slug} className="reveal">
                <Link href={localize(`/work/${entry.slug}/`, locale)} className="about-work-card" data-project={entry.slug}>
                  <div className="about-work-cover">
                    <Image src={withBase(`/og/${entry.slug}.png`)} alt="" width={1200} height={630} sizes="(max-width: 767px) 100vw, 600px" />
                  </div>
                  <div className="about-work-text">
                    <h3>{entry.meta.short ?? entry.meta.title}</h3>
                    <p>{entry.meta.hook ?? entry.tldr.problem}</p>
                    <span className="about-work-more">{c.read}<ArrowIcon /></span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>

          <div className="about-contact">
            <StageHead n={5} total={total} title={c.contact} />
            <p className="about-statement reveal">{c.open}</p>
            {site.email && <div className="reveal"><AboutEmail email={site.email} copied={c.copied} hint={c.copyHint} /></div>}
            <div className="about-actions reveal">
              {site.email && <a href={`mailto:${site.email}`} className="press" data-primary="">{c.email}<ArrowIcon /></a>}
              {site.linkedinUrl && <a href={site.linkedinUrl} className="press">LinkedIn</a>}
              {hasResume
                ? <a href={withBase(site.resumeUrl)} className="press">{c.resume}</a>
                : <Todo>add public/resume.pdf; the link appears once it exists</Todo>}
            </div>
          </div>
        </section>
        <SiteFooter />
      </article>
    </div>
  );
}

// A section title in the case pages' form: display size, light, with its n / total counter.
function StageHead({ n, total, title, id }: { n: number; total: number; title: string; id?: string }) {
  return (
    <div className="about-stage-head reveal">
      <h2 id={id}>{title}</h2>
      <span aria-hidden="true">{String(n).padStart(2, "0")} / {String(total).padStart(2, "0")}</span>
    </div>
  );
}
