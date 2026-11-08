"use client";

import { useState } from "react";

type Answer = { answer: string; quote: string; who: string };

// Interview evidence, short (owner: the cards read as raw data): the heading already states the
// finding, so below it are three real quotes, large, each under its research-question keyword and
// over who said it, then the participants as one small line. Pointing at or focusing a quote
// lights that person in the line. The full questions are in the linked guide.
export function InterviewCards({ keys, answers, participants, peopleLabel, questionsLabel }: {
  keys: string[]; questions?: string[]; answers: Answer[]; participants: string[][]; peopleLabel: string; questionsLabel: string;
}) {
  const [who, setWho] = useState<string | null>(null);
  const person = (id: string) => participants.find((p) => p[0] === id);
  return (
    <div className="dv-ivc">
      <h4 className="dv-ivc-label reveal">{questionsLabel}</h4>
      <ol className="dv-ivc-quotes">
        {answers.map((a, i) => {
          const p = person(a.who);
          return (
            <li key={a.quote} className="reveal" tabIndex={0}
              onMouseEnter={() => setWho(a.who)} onMouseLeave={() => setWho(null)}
              onFocus={() => setWho(a.who)} onBlur={() => setWho(null)}>
              <p className="dv-ivc-key">{keys[i]}</p>
              <blockquote>“{a.quote}”</blockquote>
              {p && <p className="dv-ivc-who"><b>{p[0]}</b> {p[1]}, {p[3]}</p>}
            </li>
          );
        })}
      </ol>
      <p className="dv-ivc-people reveal">
        <span className="dv-ivc-people-label">{peopleLabel}</span>
        {participants.map(([id, role]) => (
          <span key={id} className="dv-ivc-chip" data-on={who === id || undefined}><b>{id}</b> {role}</span>
        ))}
      </p>
    </div>
  );
}
