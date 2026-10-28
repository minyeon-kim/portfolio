"use client";

import { localize } from "@/lib/i18n";
import { useLocale, useStrings } from "@/lib/use-locale";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { revealNextProject } from "@/lib/project-transition";
import { ScrambleHeadline } from "@/components/scramble-headline";
import { DevsignLoop } from "@/components/devsign-loop";
import { GeminiPhone } from "@/components/gemini-phone";
import type { StageProject } from "./project-stage";

type Props = { projects: StageProject[]; onSelect: (index: number) => void };
type Phase = "idle" | "typing" | "sending" | "leaving";

// The landing stage, after metalab.com's home: one dark screen, no scroll.
// Left: the case picker as pills (hover previews the case behind the copy,
// click opens it). Top right: the second half of the positioning line. Bottom
// right: the first half as the big serif statement (Decrypted on load). Bottom
// left: the local chat, a slim composer with three question chips; a chip types
// its question, shows a pre-written one-line answer while the matching pill
// and backdrop highlight, then the case opens with the shared transition.
export function HomeIntro({ projects, onSelect }: Props) {
  const t = useStrings();
  const locale = useLocale();
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const trigger = useRef<HTMLElement | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const running = useRef(false);
  const [query, setQuery] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [asked, setAsked] = useState<number | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const busy = phase !== "idle";
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const questions = t.homeQuestions;
  const choices = [...projects, { slug: "about", name: t.aboutMe }];
  const target = asked === null ? null : questions[asked].slug;
  // The backdrop shows the asked case, else the hovered one, else the first.
  const active = projects.some((p) => p.slug === (target ?? hover)) ? (target ?? hover) : projects[0]?.slug;
  const filter = query.trim().toLowerCase();
  const matches = (p: { slug: string; name: string }) => `${p.name} ${p.slug}`.toLowerCase().includes(filter);

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
  // A chip: type the question (≤700ms), send, show the answer with the case
  // highlighted (1.2s), then open. Reduced motion opens at once.
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
    const hits = filter ? choices.filter(matches) : [];
    if (hits.length === 1) { finish(hits[0].slug); return; }
    setMessage(filter ? t.chooseBelow : t.typeName);
  };
  const answerTarget = asked === null ? "" : questions[asked].slug === "about" ? t.about : projects.find((p) => p.slug === questions[asked].slug)?.name ?? "";

  return (
    <section id="work" aria-label={t.introduction} className="intro-stage home-stage full-bleed md:-mt-[64px]">
      <div className="home-backdrop" aria-hidden="true">
        {projects.map((p) => (
          <div key={p.slug} className="home-backdrop-layer" data-project={p.slug} data-active={active === p.slug || undefined}>
            {p.slug === "workflow-app" ? <DevsignLoop alt="" /> : p.slug === "gemini-privacy" ? <span className="home-backdrop-phone"><GeminiPhone alt="" /></span> : null}
          </div>
        ))}
      </div>
      <div data-phase={phase} aria-busy={busy} onKeyDown={(event) => { if (event.key === "Escape" && busy) cancel(); }} className="intro-surface home-grid">
        <p className="home-note">{t.heroParagraph}</p>
        <nav className="home-picks" aria-label={t.projects}>
          <ol>
            {choices.map((c, i) => (
              <li key={c.slug}>
                <button
                  type="button"
                  className="press home-pick"
                  data-slug={c.slug}
                  data-active={(target ?? hover) === c.slug || undefined}
                  data-dim={(target !== null && target !== c.slug) || (!busy && filter !== "" && !matches(c)) || undefined}
                  disabled={busy}
                  onMouseEnter={() => setHover(c.slug)}
                  onMouseLeave={() => setHover(null)}
                  onFocus={() => setHover(c.slug)}
                  onBlur={() => setHover(null)}
                  onClick={() => finish(c.slug)}
                >
                  {c.slug !== "about" && <span className="home-pick-index" aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>}
                  {c.name}
                </button>
              </li>
            ))}
          </ol>
        </nav>
        <ScrambleHeadline className="home-tagline" text={t.heroLine} emphasis={t.heroEmphasis} />
        <div className="home-ask">
          <form className="home-composer" aria-label={t.exploreProjects} onSubmit={(event) => { event.preventDefault(); submit(); }}>
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
                <span className="home-answer-opening">{t.opening} {answerTarget} →</span>
                <button type="button" className="home-answer-another" onClick={cancel}>{t.askAnother}</button>
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
        </div>
      </div>
    </section>
  );
}
