import fs from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import Link from "next/link";
import { CopyButton } from "@/components/copy-button";
import { CaseMedia, CaseMediaPair, CaseSection } from "@/components/case-story";
import { Todo } from "@/components/todo";
import * as en from "@/content/about.mdx";
import * as ko from "@/content/ko/about.mdx";
import { localize, type Locale } from "@/lib/i18n";
import { getCases } from "@/lib/cases";
import { site, withBase } from "@/lib/site";

// Page labels around the copy in content/about.mdx (content/ko/about.mdx).
const copy = {
  en: {
    label: "About", portrait: "Portrait", concept: "Concept",
    sections: [["01 / What I bring", "What I bring to a team"], ["02 / Selected work", "Recent projects"], ["03 / Experience", "From cybersecurity to design"], ["04 / Toolkit", "What I work with"], ["05 / Outside work", "Off the screen"], ["06 / Contact", "Get in touch"]],
    columns: ["Research", "Design & build", "Background"],
    photos: ["Photo of Minyeon at work", "Workshop, study group or talk"],
    open: "Open to product designer and design engineer roles, especially in privacy, security and developer tools.",
    resume: "Resume (PDF)", email: "Email", copyEmail: "Copy email",
  },
  ko: {
    label: "소개", portrait: "프로필 사진", concept: "컨셉",
    sections: [["01 / 강점", "팀에 더할 수 있는 것"], ["02 / 작업", "최근 프로젝트"], ["03 / 경력", "보안에서 디자인으로"], ["04 / 도구", "주로 쓰는 것"], ["05 / 일 밖에서", "화면 밖의 저"], ["06 / 연락", "연락하기"]],
    columns: ["리서치", "디자인과 구현", "배경"],
    photos: ["일하는 모습", "워크숍, 스터디 또는 발표"],
    open: "프로덕트 디자이너와 디자인 엔지니어 포지션을 찾고 있습니다. 특히 프라이버시, 보안, 개발자 도구 분야에 관심이 있습니다.",
    resume: "이력서 (PDF)", email: "이메일", copyEmail: "이메일 복사",
  },
};

export function aboutMetadata(locale: Locale): Metadata {
  return { title: copy[locale].label, description: (locale === "ko" ? ko : en).bio[0] ?? site.positioning };
}

// Headline as the page title, a portrait beside a short bio,
// then numbered sections. Photo spots are labelled placeholders until real
// photos exist.
export async function AboutPage({ locale = "en" }: { locale?: Locale }) {
  const { default: Story, bio, headline, principles, skills } = locale === "ko" ? ko : en;
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
  const work = (await getCases(locale)).filter((c) => c.meta.featured);

  return (
    <div data-about-page className="project-detail">
      {/* The headline is the page title; "About" is only a label above it. */}
      <header className="about-hero">
        <p className="about-hero-label">{c.label}</p>
        <h1 className="about-hero-title">{headline.map((line) => <span key={line}>{line} </span>)}</h1>
      </header>
      <article className="case-study" data-project="about">
        <div className="case-content">
          <div className="about-intro" data-portrait>
            {hasPortrait
              ? <CaseMedia variant="portrait" src={portrait} width={1200} height={1500} label={c.portrait} />
              : <CaseMedia variant="portrait" label={c.portrait} />}
            <div className="about-bio">
              {bio.map((paragraph) => <p key={paragraph} className="reveal">{paragraph}</p>)}
              <Todo>add where you are based and whether you are open to relocation or remote roles</Todo>
            </div>
          </div>

          <CaseSection id="approach" label={c.sections[0][0]} title={c.sections[0][1]}>
            <ol className="about-rows">
              {principles.map((item, i) => (
                <li key={item.title} className="reveal">
                  <span className="about-rows-index">{String(i + 1).padStart(2, "0")}</span>
                  <div>
                    <h3 className="about-rows-title">{item.title}</h3>
                    <p>{item.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </CaseSection>

          <CaseSection id="work" label={c.sections[1][0]} title={c.sections[1][1]}>
            <ul className="about-rows about-rows-plain">
              {work.map(({ slug, meta, tldr }) => (
                <li key={slug} className="reveal">
                  <div>
                    <h3 className="about-rows-title">
                      <Link href={localize(`/work/${slug}/`, locale)} className="link">{meta.short ?? meta.title}</Link>
                    </h3>
                    <p>{tldr.problem}</p>
                    <p className="about-rows-meta">{[meta.concept ? c.concept : null, meta.role, meta.timeline].filter(Boolean).join(" · ")}</p>
                  </div>
                </li>
              ))}
            </ul>
          </CaseSection>

          <CaseSection id="background" label={c.sections[2][0]} title={c.sections[2][1]}>
            <Story />
          </CaseSection>

          <CaseSection id="toolkit" label={c.sections[3][0]} title={c.sections[3][1]}>
            <div className="about-skills">
              {columns.map((col) => (
                <div key={col.title} className="reveal">
                  <h3 className="about-skills-title">{col.title}</h3>
                  <ul>
                    {col.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </CaseSection>


          <CaseSection id="outside" label={c.sections[4][0]} title={c.sections[4][1]}>
            <Todo>a line or two about what you do outside work, in your own words</Todo>
          </CaseSection>
          {/* TODO: replace with real photos (public/images/about/), e.g. at work and a workshop or talk. */}
          <CaseMediaPair>
            <CaseMedia variant="screen" label={c.photos[0]} />
            <CaseMedia variant="screen" label={c.photos[1]} />
          </CaseMediaPair>

          <CaseSection id="contact" label={c.sections[5][0]} title={c.sections[5][1]}>
            <p className="reveal">{c.open}</p>
            <div className="flex flex-wrap items-center gap-2">
              {hasResume ? (
                <a
                  href={withBase(site.resumeUrl)}
                  className="press inline-flex h-4 items-center rounded-full bg-fill px-1.5 font-mono text-xs transition-colors duration-150 ease-standard hover:bg-fill-strong"
                >
                  {c.resume}
                </a>
              ) : (
                <Todo>add public/resume.pdf; the link appears once it exists</Todo>
              )}
              {site.linkedinUrl ? (
                <a href={site.linkedinUrl} className="press inline-flex h-4 items-center rounded-full bg-fill px-1.5 font-mono text-xs transition-colors duration-150 ease-standard hover:bg-fill-strong">
                  LinkedIn
                </a>
              ) : (
                <Todo>set site.linkedinUrl in lib/site.ts</Todo>
              )}
              {site.email ? (
                <div className="flex items-center gap-1">
                  <a href={`mailto:${site.email}`} className="press inline-flex h-4 items-center rounded-full bg-fill px-1.5 font-mono text-xs transition-colors duration-150 ease-standard hover:bg-fill-strong">
                    {c.email}
                  </a>
                  <CopyButton value={site.email} label={c.copyEmail} />
                </div>
              ) : (
                <Todo>set site.email in lib/site.ts; the copy button appears once it&apos;s set</Todo>
              )}
            </div>
          </CaseSection>
        </div>
      </article>
    </div>
  );
}
