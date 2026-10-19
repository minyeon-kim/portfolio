import type { ReactNode } from "react";
import { CopyDemo } from "./copy-demo";
import { OtpInput } from "./otp-input";
import { PasswordMeter } from "./password-meter";

type Experiment = { title: string; description: string; tech: string[]; demo: ReactNode };

// Shared by /playground and the landing page.
export const experiments: Experiment[] = [
  {
    title: "Password strength meter",
    description: "Feedback that explains what to fix, not just a red bar.",
    tech: ["React state", "Regex heuristics", "aria-live"],
    demo: <PasswordMeter />,
  },
  {
    title: "2FA code input",
    description: "Six boxes that type, delete, and paste like one field.",
    tech: ["React refs", "Paste events", "one-time-code autofill"],
    demo: <OtpInput />,
  },
  {
    title: "Copy button",
    description: "A confirmation you can see and hear, with no layout shift.",
    tech: ["Clipboard API", "CSS transitions", "role=status"],
    demo: <CopyDemo />,
  },
];

export function ExperimentGrid({ headingLevel = "h2" }: { headingLevel?: "h2" | "h3" }) {
  const Heading = headingLevel;
  return (
    <ul className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
      {experiments.map((x) => (
        <li key={x.title} className="reveal flex flex-col rounded-md border border-line bg-surface">
          <div className="flex-1 p-3">{x.demo}</div>
          <div className="border-t border-line p-3">
            <Heading className="mb-0.5 text-base font-medium">{x.title}</Heading>
            <p className="mb-1 text-sm text-muted">{x.description}</p>
            <ul aria-label="Built with" className="flex flex-wrap gap-0.5">
              {x.tech.map((t) => (
                <li key={t} className="rounded-md border border-line px-0.5 font-mono text-xs text-muted">
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </li>
      ))}
    </ul>
  );
}
