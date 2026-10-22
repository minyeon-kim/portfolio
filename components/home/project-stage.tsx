"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ProjectTitle } from "@/components/project-title";
import { setUi, useUi } from "@/lib/ui-store";
import { revealNextProject } from "@/lib/project-transition";
import { Segmented } from "./segmented";
import { HeroSculpture } from "./hero-sculpture";
import { IntroShowcase } from "./intro-showcase";
import { GeminiDevice } from "@/components/gemini-device";
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
      <div className="intro-scroll-viewport">
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
            <div className="generated-frame"><div className="generated-preview">{p.cover && (p.slug === "gemini-privacy"
              ? <GeminiDevice><Image src={withBase(p.cover)} alt={`${p.name} project overview`} fill sizes="100vw" preload className="object-cover" /></GeminiDevice>
              : <Image src={withBase(p.cover)} alt={`${p.name} project overview`} fill sizes="100vw" preload className="object-cover" />)}</div></div>
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
  const surface = useRef<HTMLDivElement>(null);
  const picker = useRef<HTMLDivElement>(null);
  const showcase = useRef<HTMLDivElement>(null);
  const [exploreReady, setExploreReady] = useState(false);
  const [showcaseVisible, setShowcaseVisible] = useState(false);
  const [welcomeCount, setWelcomeCount] = useState(-1);
  const welcomePlayed = useRef(false);
  const welcomeText = "What would you like to explore?";
  useEffect(() => {
    if (!exploreReady || welcomePlayed.current) return;
    welcomePlayed.current = true;
    let count = 0;
    let interval: ReturnType<typeof setInterval> | undefined;
    let typingDelay: ReturnType<typeof setTimeout> | undefined;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const delay = setTimeout(() => {
      if (reduce) { count = welcomeText.length; setWelcomeCount(count); return; }
      setWelcomeCount(0);
      typingDelay = setTimeout(() => { interval = setInterval(() => {
        count += 1;
        setWelcomeCount(count);
        if (count >= welcomeText.length) clearInterval(interval);
      }, 65); }, 0);
    }, reduce ? 0 : 200);
    return () => {
      clearTimeout(delay);
      clearTimeout(typingDelay);
      clearInterval(interval);
      if (count < welcomeText.length) welcomePlayed.current = false;
    };
  }, [exploreReady]);
  useLayoutEffect(() => {
    const el = surface.current;
    const stage = el?.closest<HTMLElement>(".intro-stage");
    if (!el || !stage) return;
    // The chat picker stays hidden until this effect has placed it, so it never
    // flashes in its unpositioned spot during the first paint.
    el.setAttribute("data-mounted", "");
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    let lastReady: boolean | null = null;
    let progress: number | null = null;
    let lastTime = performance.now();
    const update = () => {
      frame = 0;
      const travel = Math.max(1, stage.offsetHeight - window.innerHeight);
      const start = Math.max(0, stage.getBoundingClientRect().top + window.scrollY);
      const target = Math.max(0, Math.min(1, (window.scrollY - start) / travel));
      const now = performance.now();
      const dt = Math.min(64, now - lastTime);
      lastTime = now;
      progress = progress === null || media.matches ? target : progress + (target - progress) * (1 - Math.exp(-dt / 180));
      const current = progress;
      const ramp = (from: number, to: number) => {
        const t = Math.max(0, Math.min(1, (current - from) / (to - from)));
        return t * t * (3 - 2 * t);
      };
      const split = media.matches ? 0 : ramp(0.03, 0.28);
      const showcaseExit = media.matches ? 0 : ramp(0.46, 0.66);
      const name = media.matches ? 0 : ramp(0.48, 0.68);
      const intro = media.matches ? 0 : ramp(0.52, 0.76);
      const explore = media.matches ? 1 : ramp(0.7, 0.98);
      const orb = media.matches ? 1 : ramp(0.64, 0.86);
      el.style.setProperty("--split", String(split));
      el.style.setProperty("--showcase-exit", String(showcaseExit));
      el.style.setProperty("--name-exit", String(name));
      el.style.setProperty("--intro-exit", String(intro));
      el.style.setProperty("--explore-enter", String(explore));
      el.style.setProperty("--orb-enter", String(orb));
      el.toggleAttribute("data-scroll-ready", !media.matches);
      const ready = explore > 0.65;
      if (picker.current) {
        picker.current.inert = !ready;
        picker.current.setAttribute("aria-hidden", String(!ready));
      }
      if (ready !== lastReady) { lastReady = ready; setExploreReady(ready); }
      const shown = split > 0.5 && showcaseExit < 0.5 && showcase.current?.offsetParent != null;
      if (showcase.current) {
        showcase.current.inert = !shown;
        showcase.current.setAttribute("aria-hidden", String(!shown));
      }
      setShowcaseVisible(shown);
      if (!media.matches && Math.abs(target - current) > 0.0005) frame = requestAnimationFrame(update);
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    // The stacked (narrow) layout places the card under the copy, so it needs both heights.
    const copy = el.querySelector<HTMLElement>(".intro-copy");
    const measure = () => {
      if (copy) el.style.setProperty("--copy-h", `${copy.offsetHeight}px`);
      if (showcase.current) el.style.setProperty("--card-h", `${showcase.current.offsetHeight}px`);
    };
    const observer = new ResizeObserver(measure);
    if (copy) observer.observe(copy);
    if (showcase.current) observer.observe(showcase.current);
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    media.addEventListener("change", schedule);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      media.removeEventListener("change", schedule);
    };
  }, []);
  const [query, setQuery] = useState("");
  const [phase, setPhase] = useState<"idle" | "opening" | "typing" | "sending" | "leaving">("idle");
  const [sculpture, setSculpture] = useState("default");
  const [message, setMessage] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const busy = phase !== "idle";
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const running = useRef(false);
  const trigger = useRef<HTMLElement | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  const choices = [...projects.map((project, index) => ({ ...project, index })), { slug: "about", name: "About me", index: -1 }];
  const cancel = () => {
    if (timer.current) clearTimeout(timer.current);
    running.current = false;
    setSculpture("default");
    setPhase("idle");
    setQuery("");
    setMessage("");
    requestAnimationFrame(() => trigger.current?.focus({ preventScroll: true }));
  };
  const openChoice = (index: number) => {
    const choice = choices.find((item) => item.index === index);
    if (!choice || running.current) return;
    running.current = true;
    trigger.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
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
    const orb = surface.current?.querySelector<HTMLElement>(".project-ai-orb");
    if (orb && surface.current) {
      const origin = orb.getBoundingClientRect();
      const bounds = surface.current.getBoundingClientRect();
      surface.current.style.setProperty("--light-origin-x", `${origin.left + origin.width / 2 - bounds.left}px`);
      surface.current.style.setProperty("--light-origin-y", `${origin.top + origin.height / 2 - bounds.top}px`);
    }
    setSculpture(choice.slug);
    setQuery("");
    setPhase("opening");
    setMessage("");
    requestAnimationFrame(() => input.current?.focus({ preventScroll: true }));
    const text = choice.name;
    let character = 0;
    const type = () => {
      setPhase("typing");
      character += 1;
      setQuery(text.slice(0, character));
      if (character < text.length) timer.current = setTimeout(type, Math.min(65, 1000 / text.length));
      else timer.current = setTimeout(() => {
        setPhase("sending");
        timer.current = setTimeout(() => {
          setPhase("leaving");
          timer.current = setTimeout(finish, 180);
        }, 480);
      }, 60);
    };
    timer.current = setTimeout(type, 160);
  };

  return (
    <div ref={surface} data-phase={phase} aria-busy={busy} onKeyDown={(event) => { if (event.key === "Escape" && busy) cancel(); }} className="intro-surface order-1 flex flex-1 flex-col justify-center px-2 md:px-4">
      <div aria-hidden="true" className="intro-ambient">
        <span className="intro-ambient-blue" />
        <span className="intro-ambient-violet" />
        <span className="intro-ambient-pearl" />
      </div>
      <div className="project-ambient-spread" data-active={busy || undefined} aria-hidden="true">
        <HeroSculpture variant={sculpture} active={busy} />
      </div>
      <div ref={showcase} className="intro-showcase-scroll">
        <IntroShowcase projects={projects} visible={showcaseVisible && !busy} />
      </div>
      <div className="intro-copy">
        <div className="intro-name-scroll"><p className="intro-name" translate="no" aria-label={name}>
          {Array.from(name).map((char, index) => <span key={index} className="intro-name-char" aria-hidden="true" style={{ animationDelay: `${index * 55}ms` }}>{char === " " ? "\u00a0" : char}</span>)}
        </p></div>
        <div className="intro-positioning-scroll"><div className="intro-positioning">{intro}</div></div>
        <div ref={picker} className="intro-project-picker">
          <div className="project-chat-welcome" data-present={exploreReady || undefined}>
            <div className="project-ai-orb" data-active={busy || undefined} data-speaking={exploreReady && welcomeCount < 0 && !busy || undefined} data-dismissed={welcomeCount >= 0 || undefined} aria-hidden="true">
              <div className="project-ai-expansion"><HeroSculpture className="project-ai-field" variant={sculpture} active={busy} /></div>
            </div>
            <h2 aria-label={welcomeText} data-show={welcomeCount > 0 || undefined}><span aria-hidden="true">{welcomeText.slice(0, Math.max(0, welcomeCount))}<span className="project-welcome-pending">{welcomeText.slice(Math.max(0, welcomeCount))}</span></span></h2>
          </div>
          <form className="project-prompt" data-has-query={query.trim() ? "" : undefined} aria-label="Explore projects" onSubmit={(event) => {
            event.preventDefault();
            if (busy) return;
            const value = query.trim().toLowerCase();
            const matches = value ? choices.filter((choice) => `${choice.name} ${choice.slug}`.toLowerCase().includes(value)) : [];
            if (matches.length === 1) openChoice(matches[0].index);
            else setMessage(value ? "Choose Gemini, Devsign, or About me below." : "Type a project name or choose below.");
          }}>
            <div className="project-prompt-row">
            <label htmlFor="project-query" className="sr-only">What would you like to explore?</label>
            <input ref={input} id="project-query" className="project-prompt-text" type="text" readOnly={busy} value={query} onChange={(event) => { setQuery(event.target.value); setMessage(""); }} autoComplete="off" placeholder="Ask about a project" aria-describedby="project-search-status" />
            <button type="submit" disabled={busy || !query.trim()} className="project-prompt-submit" data-ready={query.trim() ? "" : undefined} aria-label={phase === "sending" ? "Opening project" : "Open matching project"}>
              {phase === "sending" || phase === "leaving" ? <span className="project-thinking-orbit" aria-hidden="true"><span /><span /><span /></span> : <svg className="prompt-send-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none"><path d="M12 19V5M6 11l6-6 6 6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" /></svg>}
            </button>
          </div>
          </form>
          <div className="project-suggestions" aria-label="Projects" data-selecting={busy || undefined}>
            {choices.map((project) => <button key={project.slug} type="button" disabled={busy} data-chosen={sculpture === project.slug || undefined} data-suggestion={project.slug} className="press project-suggestion" onClick={() => openChoice(project.index)}>
              <svg className="pill-border-light" aria-hidden="true"><rect className="pill-edge-glow" pathLength="100" /><rect className="pill-edge-core" pathLength="100" /></svg>
              {project.slug === "about" ? <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="project-suggestion-icon"><circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.5" /><path d="M5 20v-2a7 7 0 0 1 14 0v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg> : <Image src={withBase(project.slug === "gemini-privacy" ? "/images/cases/gemini-privacy/gemini-logo.png" : "/images/cases/workflow-app/devsign-icon.svg")} alt="" width={18} height={18} className="project-suggestion-icon" />}
              <span>{project.name}</span>
            </button>)}
          </div>
          <p id="project-search-status" role="status" className={message ? "project-search-status" : "sr-only"}>{message || (phase === "sending" ? `Opening ${query}` : "")}</p>
        </div>
      </div>
      <button type="button" className="intro-explore-cue" tabIndex={exploreReady ? -1 : 0} onClick={() => {
        const stage = surface.current?.closest<HTMLElement>(".intro-stage");
        if (!stage) return;
        const start = Math.max(0, stage.getBoundingClientRect().top + window.scrollY);
        window.scrollTo({ top: start + stage.offsetHeight - window.innerHeight, behavior: "smooth" });
      }}>Explore projects <span aria-hidden="true">↓</span></button>
    </div>
  );
}
