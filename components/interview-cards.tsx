"use client";

import { useState } from "react";

type Answer = { answer: string; quote: string; who: string };

// Interview: what we asked → what we heard, one card per question (owner: two plain tables
// listed questions and people with nothing joining them). Each card closes on a real quote
// and who said it; pointing at a card (or focusing it) lights that person among the
// participants above, so the two lists read as one.
export function InterviewCards({ keys, questions, answers, participants, peopleLabel, questionsLabel }: {
  keys: string[]; questions: string[]; answers: Answer[]; participants: string[][]; peopleLabel: string; questionsLabel: string;
}) {
  const [who, setWho] = useState<string | null>(null);
  return (
    <div className="dv-ivc">
      <div className="dv-ivc-people reveal">
        <h4 className="dv-ivc-label">{peopleLabel}</h4>
        <ul>
          {participants.map(([id, role, team, exp]) => (
            <li key={id} data-on={who === id || undefined} data-dim={(who && who !== id) || undefined}>
              <b>{id}</b><span>{role}</span><small>{team} · {exp}</small>
            </li>
          ))}
        </ul>
      </div>
      <h4 className="dv-ivc-label reveal">{questionsLabel}</h4>
      <ol className="dv-ivc-cards">
        {questions.map((q, i) => {
          const a = answers[i];
          return (
            <li key={q} className="reveal" tabIndex={a ? 0 : undefined}
              onMouseEnter={() => a && setWho(a.who)} onMouseLeave={() => setWho(null)}
              onFocus={() => a && setWho(a.who)} onBlur={() => setWho(null)}>
              <p className="dv-ivc-num">{String(i + 1).padStart(2, "0")}</p>
              <h5 className="dv-ivc-key">{keys[i]}</h5>
              <p className="dv-ivc-q">{q}</p>
              {a && <>
                <p className="dv-ivc-answer">{a.answer}</p>
                <blockquote className="dv-ivc-quote">“{a.quote}”</blockquote>
                <p className="dv-ivc-who">{a.who} · {participants.find((p) => p[0] === a.who)?.[1]}</p>
              </>}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
