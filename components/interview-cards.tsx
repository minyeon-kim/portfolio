"use client";

type Answer = { answer: string; quote: string; who: string };

// Interview evidence, short: the heading states the finding, and below it three real quotes, each
// under its research-question keyword with who said it right under it. Who was interviewed is in
// the line under the heading; the full questions are in the linked guide.
export function InterviewCards({ keys, answers, participants, peopleLabel, questionsLabel }: {
  keys: string[]; questions?: string[]; answers: Answer[]; participants: string[][]; peopleLabel: string; questionsLabel: string;
}) {
  const person = (id: string) => participants.find((p) => p[0] === id);
  return (
    <div className="dv-ivc">
      <h4 className="dv-ivc-label reveal">{questionsLabel}</h4>
      <ol className="dv-ivc-quotes">
        {answers.map((a, i) => {
          const p = person(a.who);
          return (
            <li key={a.quote} className="reveal">
              <p className="dv-ivc-key">{keys[i]}</p>
              <blockquote>“{a.quote}”</blockquote>
              {p && <p className="dv-ivc-who"><b>{p[0]}</b> {p[1]}, {p[3]}</p>}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
