"use client";

import { localize } from "@/lib/i18n";
import { useLocale, useStrings } from "@/lib/use-locale";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { revealNextProject } from "@/lib/project-transition";
import { ScrambleHeadline } from "@/components/scramble-headline";
import { DevsignLoop } from "@/components/devsign-loop";
import { GeminiDevice } from "@/components/gemini-device";
import { GeminiPhone } from "@/components/gemini-phone";
import { HeroObject } from "./hero-object";
import type { StageProject } from "./project-stage";

type Props = { projects: StageProject[]; onSelect: (index: number) => void };

// The landing stage, after metalab.com's home: one dark screen, no scroll.
// A glossy object (HeroObject) turns slowly behind everything. Left: the case
// picker as pills. With nothing (or About me) hovered the stage reads the
// positioning: the first half as the big statement bottom right, the second
// half as the paragraph bottom left. Hovering or focusing a project pill swaps
// them to that case: its name, its problem line, the object takes its colour,
// and the case's device rises in at the right. Top right: local time, as a
// quiet sign of where the work happens.
export function HomeIntro({ projects, onSelect }: Props) {
  const t = useStrings();
  const locale = useLocale();
  const router = useRouter();
  const [hover, setHover] = useState<string | null>(null);
  const [recent, setRecent] = useState<StageProject | null>(null);
  const choices = [...projects, { slug: "about", name: t.aboutMe }];
  const shown = projects.find((p) => p.slug === hover) ?? null;
  // Keeps the last case's copy in place while it fades out (derived during render).
  if (shown && shown !== recent) setRecent(shown);

  const [clock, setClock] = useState("");
  useEffect(() => {
    const tick = () => setClock(new Intl.DateTimeFormat(locale === "ko" ? "ko-KR" : "en-US", { hour: "numeric", minute: "2-digit", timeZone: "Asia/Seoul" }).format(new Date()));
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, [locale]);

  const open = (slug: string) => {
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

  return (
    <section id="work" aria-label={t.introduction} className="intro-stage home-stage full-bleed md:-mt-[64px]">
      <div className="home-backdrop" data-project={shown?.slug} aria-hidden="true">
        <div className="intro-ambient"><span className="intro-ambient-blue" /><span className="intro-ambient-violet" /><span className="intro-ambient-pearl" /></div>
        <HeroObject className="home-object" variant={shown?.slug ?? "default"} active={Boolean(shown)} />
        {projects.map((p) => (
          <div key={p.slug} className="home-device" data-project={p.slug} data-active={shown?.slug === p.slug || undefined}>
            {p.slug === "workflow-app"
              ? <div className="home-device-window"><DevsignLoop alt="" /></div>
              : p.slug === "gemini-privacy"
                ? <div className="home-device-phone"><GeminiDevice><GeminiPhone alt="" /></GeminiDevice></div>
                : null}
          </div>
        ))}
      </div>
      <div className="intro-surface home-grid">
        <p className="home-meta">{t.city}{clock ? ` · ${clock}` : ""}</p>
        <nav className="home-picks" aria-label={t.projects}>
          <ol>
            {choices.map((c, i) => (
              <li key={c.slug}>
                <button
                  type="button"
                  className="press home-pick"
                  data-slug={c.slug}
                  data-active={hover === c.slug || undefined}
                  onMouseEnter={() => setHover(c.slug)}
                  onMouseLeave={() => setHover(null)}
                  onFocus={() => setHover(c.slug)}
                  onBlur={() => setHover(null)}
                  onClick={() => open(c.slug)}
                >
                  {c.slug !== "about" && <span className="home-pick-index" aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>}
                  {c.name}
                </button>
              </li>
            ))}
          </ol>
        </nav>
        <div className="home-note" data-swap={shown ? "" : undefined}>
          <p className="home-note-default">{t.heroParagraph}</p>
          <p className="home-note-project" aria-hidden={!shown}>{recent?.problem}</p>
        </div>
        <div className="home-tagline-wrap" data-swap={shown ? "" : undefined}>
          <ScrambleHeadline className="home-tagline home-tagline-default" text={t.heroLine} emphasis={t.heroEmphasis} />
          <p className="home-tagline home-tagline-project" aria-hidden={!shown}>{recent?.name}</p>
        </div>
      </div>
    </section>
  );
}
