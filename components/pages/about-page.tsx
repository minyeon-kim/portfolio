import fs from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import Image from "next/image";
import { CopyButton } from "@/components/copy-button";
import { Emphasis } from "@/components/emphasis";
import { ArrowIcon } from "@/components/arrow-icon";
import { CaseMedia, CaseMediaPair } from "@/components/case-story";
import { Section } from "@/components/devsign-case";
import { DevsignNav } from "@/components/devsign-nav";
import { MoreWork } from "@/components/more-work";
import { SiteFooter } from "@/components/site-footer";
import { Todo } from "@/components/todo";
import * as en from "@/content/about.mdx";
import * as ko from "@/content/ko/about.mdx";
import type { Locale } from "@/lib/i18n";
import { getCases } from "@/lib/cases";
import { site, withBase } from "@/lib/site";

// Page labels around the copy in content/about.mdx (content/ko/about.mdx).
const copy = {
  en: {
    label: "About", portrait: "Portrait",
    facts: [["Background", "Four years of security consulting at SK shieldus"], ["Focus", "Privacy, security and developer tools"], ["Role", "User research, UX/UI design, working prototypes"], ["Tools", "Figma, FigJam, Dovetail, Claude Code, Codex"]],
    stages: { approach: "What I bring", experience: "Experience", toolkit: "Toolkit", outside: "Outside work", contact: "Contact" },
    experienceLead: "From cybersecurity to design",
    columns: ["Research", "Design & build", "Background"],
    photos: ["Photo of Minyeon at work", "Workshop, study group or talk"],
    open: "Open to product designer and design engineer roles, especially in privacy, security and developer tools.",
    work: "Selected work", resume: "Resume (PDF)", email: "Email", copyEmail: "Copy email",
  },
  ko: {
    label: "소개", portrait: "프로필 사진",
    facts: [["배경", "SK쉴더스 보안 컨설팅 4년"], ["관심 분야", "프라이버시, 보안, 개발자 도구"], ["역할", "사용자 리서치, UX/UI 디자인, 동작하는 프로토타입"], ["도구", "Figma, FigJam, Dovetail, Claude Code, Codex"]],
    stages: { approach: "강점", experience: "경력", toolkit: "도구", outside: "일 밖에서", contact: "연락" },
    experienceLead: "보안에서 디자인으로",
    columns: ["리서치", "디자인과 구현", "배경"],
    photos: ["일하는 모습", "워크숍, 스터디 또는 발표"],
    open: "프로덕트 디자이너와 디자인 엔지니어 포지션을 찾고 있습니다. 특히 프라이버시, 보안, 개발자 도구 분야에 관심이 있습니다.",
    work: "작업", resume: "이력서 (PDF)", email: "이메일", copyEmail: "이메일 복사",
  },
};

export function aboutMetadata(locale: Locale): Metadata {
  return { title: copy[locale].label, description: (locale === "ko" ? ko : en).bio[0] ?? site.positioning };
}

// Built like a case page: the panel opener (name as the brand line, headline,
// the short bio, the ways to get in touch, the portrait once it exists) and four
// facts, then the case body's stages with the same stage nav, bands and scroll
// motion, and the projects as the closing deck. Photo spots are labelled
// placeholders until real photos exist.
export async function AboutPage({ locale = "en" }: { locale?: Locale }) {
  const { default: Story, bio, headline, headlineEmphasis, principles, skills } = locale === "ko" ? ko : en;
  const c = copy[locale];
  const columns = [
    { title: c.columns[0], items: skills.research },
    { title: c.columns[1], items: skills.build },
    { title: c.columns[2], items: skills.background },
  ];
  // Only link the resume once the PDF actually exists in /public.
  const hasResume = fs.existsSync(path.join(process.cwd(), "public", site.resumeUrl));
  // Labelled photo placeholders until the real photos are in /public/images/about/.
  const portrait = "/images/about/portrait.webp";
  const hasPortrait = fs.existsSync(path.join(process.cwd(), "public", portrait));
  const work = (await getCases(locale)).filter((entry) => entry.meta.featured && !entry.meta.draft);
  const nav = (Object.keys(c.stages) as (keyof typeof c.stages)[]).map((id) => ({ id, label: c.stages[id] }));

  return (
    <div data-about-page className="project-detail">
      <header className="project-hero devsign-hero-page">
        <div className="devsign-hero" data-project="about">
          <div className="devsign-hero-panel">
            <div className="devsign-hero-intro">
              <p className="devsign-hero-brand"><span className="about-hero-mark" aria-hidden="true">{site.name.split(" ").map((w) => w[0]).join("")}</span><span>{site.name}</span></p>
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
            {hasPortrait && (
              <div className="about-hero-portrait">
                <Image src={withBase(portrait)} alt={c.portrait} width={1200} height={1500} />
              </div>
            )}
          </div>
          <dl className="devsign-hero-details">
            {c.facts.map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </header>
      <article className="case-study" data-project="about">
        <div className="case-content">
          <div className="dv">
            <DevsignNav items={nav} />
            <Todo>add a portrait at public/images/about/portrait.webp (it appears in the opener); add where you are based and whether you are open to relocation or remote roles</Todo>

            <Section id="approach" title={c.stages.approach}>
              <p className="dv-headline reveal">{bio[1]}</p>
              <ul className="dv-features dv-gap-40 reveal" style={{ "--n": principles.length } as React.CSSProperties}>
                {principles.map((item, i) => (
                  <li key={item.title}>
                    <span className="dv-caps">{String(i + 1).padStart(2, "0")}</span>
                    <strong>{item.title}</strong>
                    <span>{item.body}</span>
                  </li>
                ))}
              </ul>
            </Section>

            <Section id="experience" title={c.stages.experience}>
              <div className="dv-block">
                <h3 className="dv-finding reveal">{c.experienceLead}</h3>
              </div>
              <div className="about-story"><Story /></div>
            </Section>

            <Section id="toolkit" title={c.stages.toolkit}>
              <ul className="dv-features reveal" style={{ "--n": columns.length } as React.CSSProperties}>
                {columns.map((col) => (
                  <li key={col.title}>
                    <strong>{col.title}</strong>
                    <ul className="about-tools">
                      {col.items.map((item) => <li key={item}>{item}</li>)}
                    </ul>
                  </li>
                ))}
              </ul>
            </Section>

            <Section id="outside" title={c.stages.outside}>
              <Todo>a line or two about what you do outside work, in your own words</Todo>
              {/* TODO: replace with real photos (public/images/about/), e.g. at work and a workshop or talk. */}
              <CaseMediaPair>
                <CaseMedia variant="screen" label={c.photos[0]} />
                <CaseMedia variant="screen" label={c.photos[1]} />
              </CaseMediaPair>
            </Section>

            <Section id="contact" title={c.stages.contact}>
              <p className="dv-headline reveal">{c.open}</p>
              <div className="about-contact reveal">
                {site.email && <a href={`mailto:${site.email}`} className="dv-prototype-link press">{c.email}</a>}
                {site.email && <CopyButton value={site.email} label={c.copyEmail} />}
                {site.linkedinUrl && <a href={site.linkedinUrl} className="dv-prototype-link press">LinkedIn</a>}
                {hasResume
                  ? <a href={withBase(site.resumeUrl)} className="dv-prototype-link press">{c.resume}</a>
                  : <Todo>add public/resume.pdf; the link appears once it exists</Todo>}
              </div>
            </Section>
          </div>
        </div>
        <MoreWork label={c.work} items={work.map((entry) => ({ slug: entry.slug, name: entry.meta.short ?? entry.meta.title, description: entry.tldr.problem, cover: entry.meta.cover }))} />
        <SiteFooter />
      </article>
    </div>
  );
}
