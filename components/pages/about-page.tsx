import fs from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Emphasis } from "@/components/emphasis";
import { ArrowIcon } from "@/components/arrow-icon";
import { CaseMedia } from "@/components/case-story";
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
    label: "About", portrait: "Minyeon Kim working on a laptop",
    experience: "Experience",
    skills: "Skills",
    photos: ["Minyeon talking at a table with printed screens and sticky notes", "Hands around a table covered in printed screens, sketches and sticky notes"],
    open: "Open to product designer and design engineer roles.",
    work: "Selected work", resume: "Resume (PDF)", email: "Email", copyEmail: "Copy email",
    steps: "Then and now", research: "Research", build: "Design and build", copyHint: "Press to copy", copied: "Copied", read: "Read the case",
  },
  ko: {
    label: "소개", portrait: "노트북으로 작업하는 김민연",
    experience: "경력",
    skills: "역량",
    photos: ["출력한 화면과 포스트잇이 놓인 테이블에서 이야기하는 김민연", "출력한 화면과 스케치, 포스트잇이 놓인 테이블에 모인 손"],
    open: "프로덕트 디자이너와 디자인 엔지니어 포지션을 찾고 있습니다.",
    work: "작업", resume: "이력서 (PDF)", email: "이메일", copyEmail: "이메일 복사",
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
  const { bio, bridge, experience, headline, headlineEmphasis, skills } = locale === "ko" ? ko : en;
  const c = copy[locale];
  // Only link the resume once the PDF actually exists in /public.
  const hasResume = fs.existsSync(path.join(process.cwd(), "public", site.resumeUrl));
  // Photo spots show labelled boxes while writing; the live site leaves them out
  // until the real files are in /public/images/about/.
  const inPublic = (file: string) => fs.existsSync(path.join(process.cwd(), "public", file));
  const drafting = process.env.NODE_ENV === "development";
  const portrait = "/images/about/portrait.webp";
  const hasPortrait = inPublic(portrait);
  const outsidePhotos = ["/images/about/outside-1.webp", "/images/about/outside-2.webp"];
  const hasOutside = outsidePhotos.every(inPublic);
  const work = (await getCases(locale)).filter((entry) => entry.meta.featured && !entry.meta.draft);

  return (
    <div data-about-page className="project-detail">
      <header className="project-hero devsign-hero-page">
        <div className="devsign-hero" data-project="about">
          <div className="devsign-hero-panel">
            <div className="devsign-hero-intro">
              <h1 tabIndex={-1} className="devsign-hero-title has-emphasis">
                {headline.map((line) => <span key={line} className="about-hero-line"><Emphasis text={line} phrase={headlineEmphasis} /> </span>)}
              </h1>
              <p className="devsign-hero-subtitle">{bio[0]}</p>
              <p className="devsign-hero-actions">
                {site.email && <a href={`mailto:${site.email}`} className="press" data-primary="">{c.email}<ArrowIcon /></a>}
                {site.linkedinUrl && <a href={site.linkedinUrl} className="press">LinkedIn</a>}
                {hasResume && <a href={withBase(site.resumeUrl)} className="press">{c.resume}</a>}
              </p>
            </div>
            {(hasPortrait || drafting) && (
              <div className="about-hero-portrait">
                {hasPortrait
                  ? <Image src={withBase(portrait)} alt={c.portrait} width={2400} height={1500} sizes="(min-width: 1024px) 620px, 100vw" priority />
                  : <CaseMedia variant="portrait" label={c.portrait} />}
              </div>
            )}
          </div>
        </div>
      </header>
      <article className="about-body">
        <Todo>add where you are based and whether you are open to relocation or remote roles</Todo>

        <section className="about-bridge">
          <h2 className="about-statement reveal">{bridge.statement}</h2>
          <AboutBridge rows={bridge.rows} then={bridge.then} now={bridge.now} label={c.steps} />
        </section>

        {(hasOutside || drafting) && (
          <section className="about-photos" aria-label={c.photos.join(" / ")}>
            <div className="about-fan">
              {outsidePhotos.map((src, i) => (
                <figure key={src} className="about-fan-card" data-i={i}>
                  {hasOutside
                    ? <Image src={withBase(src)} alt={c.photos[i]} width={1600} height={1067} sizes="(max-width: 767px) 100vw, 640px" />
                    : <CaseMedia variant="screen" label={c.photos[i]} />}
                </figure>
              ))}
            </div>
          </section>
        )}

        <section className="about-band">
          <div className="about-band-inner">
            <h2 className="about-statement reveal">{c.experience}</h2>
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
          <h2 className="about-statement reveal">{c.work}</h2>
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
            <h2 className="about-statement reveal">{c.open}</h2>
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
