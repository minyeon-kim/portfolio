"use client";

import { localize } from "@/lib/i18n";
import { useLocale, useStrings } from "@/lib/use-locale";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { revealNextProject } from "@/lib/project-transition";
import { DevsignLoop } from "@/components/devsign-loop";
import { GeminiPhone } from "@/components/gemini-phone";
import { SiteFooter } from "@/components/site-footer";
import type { StageProject } from "./project-stage";

type Props = { intro: ReactNode; projects: StageProject[]; onSelect: (index: number) => void };
type Phase = "idle" | "typing" | "sending" | "leaving";

// The landing intro, after the Figma draft "Main · redesign (draft v1)": the
// positioning line, a slim composer with question chips, the featured work as
// full-width tiles, then the closing block. The chat is local: a chip types its
// question into the composer, a pre-written one-line answer appears, the
// matching tile highlights, and the case opens with the shared transition.
export function HomeIntro({ intro, projects, onSelect }: Props) {
  const t = useStrings();
  const locale = useLocale();
  const router = useRouter();
  const surface = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const trigger = useRef<HTMLElement | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const running = useRef(false);
  const [query, setQuery] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [asked, setAsked] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const busy = phase !== "idle";
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const questions = t.homeQuestions;
  const target = asked === null ? null : questions[asked].slug;
  const filter = query.trim().toLowerCase();
  const matches = (p: StageProject) => !filter || `${p.name} ${p.title} ${p.slug}`.toLowerCase().includes(filter);

  const finish = (slug: string) => {
    if (slug === "about") {
      revealNextProject(
        () => router.push(localize("/about/", locale), { scroll: false }),
        () => Boolean(document.querySelector("main [data-about-page]")),
      );
      return;
    }
    const index = projects.findIndex((p) => p.slug === slug);
    if (index >= 0) onSelect(index);
  };
  const cancel = () => {
    if (timer.current) clearTimeout(timer.current);
    running.current = false;
    setPhase("idle");
    setAsked(null);
    setQuery("");
    setMessage("");
    requestAnimationFrame(() => trigger.current?.focus({ preventScroll: true }));
  };
  // A chip: type the question (≤700ms), send, show the answer and highlight the
  // tile (1.2s), then open. Reduced motion opens at once.
  const ask = (index: number) => {
    if (running.current) return;
    const question = questions[index];
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { finish(question.slug); return; }
    running.current = true;
    trigger.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setAsked(index);
    setMessage("");
    setQuery("");
    requestAnimationFrame(() => input.current?.focus({ preventScroll: true }));
    const text = question.q;
    let character = 0;
    const type = () => {
      setPhase("typing");
      character += 1;
      setQuery(text.slice(0, character));
      if (character < text.length) timer.current = setTimeout(type, Math.min(40, 700 / text.length));
      else timer.current = setTimeout(() => {
        setPhase("sending");
        timer.current = setTimeout(() => {
          setPhase("leaving");
          timer.current = setTimeout(() => finish(question.slug), 180);
        }, 1200);
      }, 120);
    };
    timer.current = setTimeout(type, 120);
  };
  const submit = () => {
    if (busy) return;
    const hits = projects.filter(matches);
    if (filter && hits.length === 1) { onSelect(projects.indexOf(hits[0])); return; }
    setMessage(filter ? t.chooseBelow : t.typeName);
  };

  return (
    <section id="work" aria-label={t.introduction} className="intro-stage home-stage full-bleed md:-mt-[64px] bg-bg">
      <div ref={surface} data-phase={phase} aria-busy={busy} onKeyDown={(event) => { if (event.key === "Escape" && busy) cancel(); }} className="intro-surface home-intro">
        <div aria-hidden="true" className="intro-ambient">
          <span className="intro-ambient-blue" />
          <span className="intro-ambient-violet" />
          <span className="intro-ambient-pearl" />
        </div>
        <div className="intro-copy home-hero">
          <div className="intro-positioning home-positioning">{intro}</div>
          <form className="home-composer" data-has-query={query.trim() ? "" : undefined} aria-label={t.exploreProjects} onSubmit={(event) => { event.preventDefault(); submit(); }}>
            <label htmlFor="project-query" className="sr-only">{t.askWork}</label>
            <input ref={input} id="project-query" type="text" readOnly={busy} value={query} onChange={(event) => { setQuery(event.target.value); setMessage(""); }} autoComplete="off" placeholder={t.askWork} aria-describedby="project-search-status" />
            <button type="submit" disabled={busy || !query.trim()} className="press home-composer-send" data-ready={query.trim() || busy ? "" : undefined} aria-label={busy ? t.openingProject : t.openMatching}>
              <svg className="prompt-send-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none"><path d="M12 19V5M6 11l6-6 6 6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
          </form>
          {asked !== null && (phase === "sending" || phase === "leaving") ? (
            <div className="home-answer" role="status">
              <span className="home-answer-dot" aria-hidden="true" />
              <p>{questions[asked].answer}</p>
              <div className="home-answer-actions">
                <span className="home-answer-opening">{t.opening} {questions[asked].slug === "about" ? t.about : projects.find((p) => p.slug === questions[asked].slug)?.name} →</span>
                <button type="button" className="link home-answer-another" onClick={cancel}>{t.askAnother}</button>
              </div>
            </div>
          ) : (
            <ul className="home-chips" aria-label={t.questions}>
              {questions.map((question, index) => (
                <li key={question.q}><button type="button" disabled={busy} className="press home-chip" onClick={() => ask(index)}>{question.q}</button></li>
              ))}
            </ul>
          )}
          <p id="project-search-status" role="status" className={message ? "home-status" : "sr-only"}>{message}</p>
          <p className="home-hint" aria-hidden="true">{t.scrollHint}</p>
        </div>
        <div className="home-work" aria-label={t.selectedWork}>
          <div className="home-work-label"><span>{t.selectedWork} · 2026</span><span>{t.caseStudies.replace("{n}", String(projects.length))}</span></div>
          {projects.map((p, index) => (
            <button
              key={p.slug}
              type="button"
              className="press lift home-tile"
              data-project={p.slug}
              data-highlight={target === p.slug || undefined}
              data-dim={(target !== null && target !== p.slug) || (!busy && !matches(p)) || undefined}
              disabled={busy}
              onClick={() => onSelect(index)}
            >
              <span className="home-tile-media" aria-hidden="true">
                {p.slug === "workflow-app"
                  ? <DevsignLoop alt="" />
                  : p.slug === "gemini-privacy"
                    ? <span className="home-tile-phone"><GeminiPhone alt="" /></span>
                    : null}
              </span>
              <span className="home-tile-kicker">{String(index + 1).padStart(2, "0")} · {p.name}{p.concept ? ` · ${t.conceptProject}` : ""}</span>
              <span className="home-tile-copy">
                <span className="home-tile-title">{p.name}</span>
                <span className="home-tile-problem">{p.problem}</span>
              </span>
            </button>
          ))}
        </div>
        <SiteFooter />
      </div>
    </section>
  );
}
