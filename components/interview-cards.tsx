// Interview evidence: what we wanted to learn as three small diagrams, then who took part.
// One outline icon per question (Tabler, MIT): stuck, who decides, the missing reason.
const Q_PATHS = [
  "M8 13v-7.5a1.5 1.5 0 0 1 3 0v6.5M11 5.5v-2a1.5 1.5 0 1 1 3 0v8.5M14 5.5a1.5 1.5 0 0 1 3 0v6.5M17 7.5a1.5 1.5 0 0 1 3 0v8.5a6 6 0 0 1 -6 6h-2h.208a6 6 0 0 1 -5.012 -2.7l-.196 -.3c-.312 -.479 -1.407 -2.388 -3.286 -5.728a1.5 1.5 0 0 1 .536 -2.022a1.867 1.867 0 0 1 2.28 .28l1.47 1.47",
  "M8 7a4 4 0 1 0 8 0a4 4 0 0 0 -8 0M6 21v-2a4 4 0 0 1 4 -4h3.5M19 22v.01M19 19a2.003 2.003 0 0 0 .914 -3.782a1.98 1.98 0 0 0 -2.414 .483",
  "M14 3v4a1 1 0 0 0 1 1h4M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2zM12 17v.01M12 14a1.5 1.5 0 1 0 -1.14 -2.474",
];
const Q_MARKS = Q_PATHS.map((d) => <svg key={d} viewBox="0 0 24 24" aria-hidden="true"><path d={d} /></svg>);

export function InterviewCards({ questions, keys, participants, peopleLabel, questionsLabel }: {
  questions: string[]; keys: string[]; participants: string[][]; peopleLabel: string; questionsLabel: string;
}) {
  return (
    <div className="dv-ivc">
      <div className="reveal">
        <h4 className="dv-ivc-label">{questionsLabel}</h4>
        <ol className="dv-ivc2-asks">
          {questions.map((q, i) => (
            <li key={q}>
              {Q_MARKS[i]}
              <strong>{keys[i]}</strong>
              <p>{q}</p>
            </li>
          ))}
        </ol>
      </div>
      <div className="reveal">
        <h4 className="dv-ivc-label">{peopleLabel}</h4>
        <ul className="dv-ivc2-people">
          {participants.map((p) => (
            <li key={p[0]}>
              <b>{p[0]}</b>
              <strong>{p[1]}</strong>
              <span>{p[2]}<br />{p[3]}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
