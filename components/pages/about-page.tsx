import fs from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { CopyButton } from "@/components/copy-button";
import { Emphasis } from "@/components/emphasis";
import { ArrowIcon } from "@/components/arrow-icon";
import { CaseMedia, CaseMediaPair } from "@/components/case-story";
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
  },
  ko: {
    label: "소개", portrait: "노트북으로 작업하는 김민연",
    experience: "경력",
    skills: "역량",
    photos: ["출력한 화면과 포스트잇이 놓인 테이블에서 이야기하는 김민연", "출력한 화면과 스케치, 포스트잇이 놓인 테이블에 모인 손"],
    open: "프로덕트 디자이너와 디자인 엔지니어 포지션을 찾고 있습니다.",
    work: "작업", resume: "이력서 (PDF)", email: "이메일", copyEmail: "이메일 복사",
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
          <div className="about-bridge-head" aria-hidden="true">
            <span>{bridge.then}</span>
            <span>{bridge.now}</span>
          </div>
          <ol className="about-bridge-rows">
            {bridge.rows.map((row) => (
              <li key={row.title} className="reveal">
                <div>
                  <p className="about-bridge-tag">{bridge.then}</p>
                  <p className="about-bridge-then">{row.then}</p>
                  {row.note && <p className="about-bridge-text">{row.note}</p>}
                </div>
                <ArrowIcon />
                <div>
                  <p className="about-bridge-tag">{bridge.now}</p>
                  <h3>{row.title}</h3>
                  <p className="about-bridge-text">{row.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

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
              <li className="reveal">
                <p className="about-timeline-label">{c.skills}</p>
                <p>{[...skills.research, ...skills.build].join(" · ")}</p>
              </li>
            </ol>
          </div>
        </section>

        {(hasOutside || drafting) && (
          <section className="about-photos reveal">
            <CaseMediaPair>
              {outsidePhotos.map((src, i) => (
                <CaseMedia key={src} variant="screen" label={c.photos[i]} src={hasOutside ? src : undefined} width={1600} height={1067} />
              ))}
            </CaseMediaPair>
          </section>
        )}

        <section className="about-close">
          <h2 className="about-statement reveal">{c.open}</h2>
          <div className="about-actions reveal">
            {site.email && <a href={`mailto:${site.email}`} className="press" data-primary="">{c.email}<ArrowIcon /></a>}
            {site.email && <CopyButton value={site.email} label={c.copyEmail} />}
            {site.linkedinUrl && <a href={site.linkedinUrl} className="press">LinkedIn</a>}
            {hasResume
              ? <a href={withBase(site.resumeUrl)} className="press">{c.resume}</a>
              : <Todo>add public/resume.pdf; the link appears once it exists</Todo>}
          </div>
          <h2 className="sr-only">{c.work}</h2>
          <ul className="about-work">
            {work.map((entry) => (
              <li key={entry.slug} className="reveal">
                <Link href={localize(`/work/${entry.slug}/`, locale)} className="lift" data-project={entry.slug}>
                  <h3>{entry.meta.short ?? entry.meta.title}</h3>
                  <p>{entry.meta.hook ?? entry.tldr.problem}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
        <SiteFooter />
      </article>
    </div>
  );
}
