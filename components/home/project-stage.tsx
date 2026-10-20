"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ProjectTitle } from "@/components/project-title";
import { setUi, useUi } from "@/lib/ui-store";
import { revealNextProject } from "@/lib/project-transition";
import { Segmented } from "./segmented";
import { HeroSculpture } from "./hero-sculpture";
import { withBase } from "@/lib/site";

export type StageProject = {
  slug: string;
  name: string;
  title: string;
  problem: string;
  role?: string;
  timeline?: string;
  cover?: string;
  concept?: boolean;
};

type Props = { projects: StageProject[]; name: string; intro: ReactNode };

// Project selection opens an editorial heading and full-width cover.
export function ProjectStage({ projects, name, intro }: Props) {
  const active = useUi((s) => s.activeCase);
  // Reset after React commits the new stage, rather than before its old body
  // unmounts (browser scroll anchoring can otherwise restore the reading offset).
  useLayoutEffect(() => {
    if (active === null) return;
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    const frame = requestAnimationFrame(() => window.scrollTo({ top: 0, left: 0, behavior: "instant" }));
    return () => cancelAnimationFrame(frame);
  }, [active]);
  const select = (index: number) => {
    revealNextProject(
      () => setUi({ activeCase: index }),
      () => Boolean(document.querySelector(`main [data-stage-index="${index}"]`)),
    );
  };
  const p = active !== null ? projects[active] : null;

  return (
    <>
      {active === null && (
    <section id="work" aria-label="Introduction" className="intro-stage full-bleed md:-mt-[64px] bg-bg">
      <div className="relative flex min-h-svh flex-col pt-6 pb-6 md:h-svh md:min-h-[720px] md:pt-0 md:pb-0">
        <IntroState name={name} intro={intro} projects={projects} onSelect={select} />
      </div>
    </section>
      )}
      {p && (
      <section id="work" aria-label={`${p.name}, selected case`} className="project-selected stage-pin full-bleed md:-mt-[64px]">
        <div key={p.slug} id="stage-panel" data-stage-index={active} className="selected-stage" data-canvas={p.slug === "workflow-app" || undefined} data-gemini={p.slug === "gemini-privacy" || undefined}>
          <div className="stage-content selected-stage-copy">
            <h1 tabIndex={-1} className="selected-stage-title generated-title"><ProjectTitle name={p.name} gemini={p.slug === "gemini-privacy"} /></h1>
            <dl className="selected-stage-meta">
              <div><dt>Project Type</dt><dd>{p.concept ? "Concept project" : "Product"}</dd></div>
              {p.role && <div><dt>Role</dt><dd>{p.role}</dd></div>}
              {p.timeline && <div><dt>Timeline</dt><dd>{p.timeline}</dd></div>}
            </dl>
          </div>
          <div className="stage-grow selected-stage-object">
            <div className="generated-frame"><div className="generated-preview">{p.cover && <Image src={withBase(p.cover)} alt={`${p.name} project overview`} fill sizes="100vw" preload className="object-cover" />}</div></div>
          </div>
          <div className="selected-stage-picker flex justify-center px-2 py-3 lg:hidden">
            <Segmented label="Selected work" options={projects.map((x) => ({ id: x.slug, label: x.name }))} value={active} onChange={select} />
          </div>
        </div>
      </section>
      )}
    </>
  );
}

function IntroState({ name, intro, projects, onSelect }: {
  name: string;
  intro: ReactNode;
  projects: StageProject[];
  onSelect: (index: number) => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");
  const [phase, setPhase] = useState<"idle" | "typing" | "sending" | "thinking" | "leaving">("idle");
  const [submitted, setSubmitted] = useState("");
  const [sculpture, setSculpture] = useState("default");
  const busy = phase !== "idle";
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const running = useRef(false);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  const choices = [...projects.map((project, index) => ({ ...project, index })), { slug: "about", name: "About me", index: -1 }];
  const matches = choices.filter((project) => busy || project.name.toLowerCase().includes(query.trim().toLowerCase()));
  const cancel = () => {
    if (timer.current) clearTimeout(timer.current);
    running.current = false;
    setSculpture("default");
    setPhase("idle");
    setSubmitted("");
    setMessage("");
    requestAnimationFrame(() => input.current?.focus());
  };
  const openChoice = (index: number, typeName = true) => {
    const choice = choices.find((item) => item.index === index);
    if (!choice) return;
    if (running.current) return;
    running.current = true;
    setSculpture(choice.slug);
    const finish = () => {
      if (index === -1) {
        revealNextProject(
          () => router.push("/about/", { scroll: false }),
          () => Boolean(document.querySelector("main [data-about-page]")),
        );
      } else onSelect(index);
    };
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      finish();
      return;
    }
    const send = () => {
      setSubmitted(typeName ? choice.name : query.trim());
      setPhase("sending");
      setMessage("Message sent.");
      timer.current = setTimeout(() => {
        setPhase("thinking");
        setMessage(`Preparing ${choice.name}…`);
        timer.current = setTimeout(() => {
          setPhase("leaving");
          timer.current = setTimeout(finish, 0);
        }, 480);
      }, 180);
    };
    input.current?.focus({ preventScroll: true });
    if (!typeName) { send(); return; }
    setQuery("");
    setPhase("typing");
    setMessage("");
    const text = choice.name;
    let character = 0;
    const type = () => {
      character += 1;
      setQuery(text.slice(0, character));
      if (character < text.length) timer.current = setTimeout(type, Math.min(55, 700 / text.length));
      else timer.current = setTimeout(send, 160);
    };
    timer.current = setTimeout(type, 100);
  };

  return (
    <div data-phase={phase} aria-busy={busy} onKeyDown={(event) => { if (event.key === "Escape" && busy) cancel(); }} className="intro-surface order-1 flex flex-1 flex-col justify-center px-2 md:px-4">
      <div aria-hidden="true" className="intro-ambient">
        <span className="intro-ambient-blue" />
        <span className="intro-ambient-violet" />
        <span className="intro-ambient-pearl" />
      </div>
      <HeroSculpture variant={sculpture} active={phase !== "idle"} />
      <div className="intro-copy">
        <p className="intro-name" translate="no">
          {name}
        </p>
        <div className="intro-positioning">{intro}</div>
        <div className="intro-project-picker">
          {submitted ? (
            <div className="project-conversation" aria-label="Project request">
              <div className="project-user-message"><span className="sr-only">You: </span>{submitted}</div>
              {(phase === "thinking" || phase === "leaving") && (
                <div className="project-assistant-message">
                  <span className="project-thinking-orbit" aria-hidden="true"><span /><span /><span /></span>

                </div>
              )}
            </div>
          ) : <form className="project-prompt" role="search" aria-label="Find a project" onSubmit={(event) => {
            event.preventDefault();
            if (busy) return;
            if (matches.length === 1) openChoice(matches[0].index, false);
            else setMessage(matches.length ? "Choose a project below." : "No matching result. Try Gemini, Devsign, or About me.");
          }}>
            <label htmlFor="project-query" className="sr-only">Find a project</label>
            <input ref={input} readOnly={busy} id="project-query" type="search" value={query} onChange={(event) => { setQuery(event.target.value); setMessage(""); }} placeholder="What would you like to explore?" autoComplete="off" aria-describedby="project-search-status" />
            <button disabled={busy} type="submit" aria-label="Open matching project" className="press project-prompt-submit"><span className="prompt-send-icon" aria-hidden="true">↗</span></button>
          </form>}
          {!submitted && <div className="project-suggestions" aria-label="Projects">
            {matches.map((project) => <button key={project.slug} type="button" disabled={busy} data-suggestion={project.slug} className="press project-suggestion" onClick={() => openChoice(project.index)}>
              <svg className="pill-border-light" aria-hidden="true"><rect pathLength="100" /></svg>
              {project.slug === "about" ? <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="project-suggestion-icon"><circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.5" /><path d="M5 20v-2a7 7 0 0 1 14 0v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg> : <Image src={withBase(project.slug === "gemini-privacy" ? "/images/cases/gemini-privacy/gemini-logo.png" : "/images/cases/workflow-app/devsign-icon.svg")} alt="" width={18} height={18} className="project-suggestion-icon" />}
              <span>{project.name}</span>
            </button>)}
          </div>}
          <p id="project-search-status" role="status" className={`project-search-status ${submitted ? "sr-only" : ""}`}>{message || (!matches.length ? "No matching project." : "")}</p>
        </div>
      </div>
    </div>
  );
}
