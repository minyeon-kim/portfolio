type Answer = { answer: string; quote: string; who: string };

// Interview evidence, read straight down: what we wanted to learn (each question with the real
// quote that answered it and who said it), then who took part.
export function InterviewCards({ questions, answers, participants, peopleLabel, questionsLabel }: {
  questions: string[]; answers: Answer[]; participants: string[][]; peopleLabel: string; questionsLabel: string;
}) {
  const person = (id: string) => participants.find((p) => p[0] === id);
  return (
    <div className="dv-ivc">
      <div className="reveal">
        <h4 className="dv-ivc-label">{questionsLabel}</h4>
        <ol className="dv-ivc-list dv-ivc-asks">
          {questions.map((q, i) => {
            const a = answers[i];
            const p = a && person(a.who);
            return (
              <li key={q}>
                <b>{String(i + 1).padStart(2, "0")}</b>
                <p className="dv-ivc-q">{q}</p>
                {a && <blockquote>“{a.quote}”{p && <> <cite>{p[0]}, {p[1]}</cite></>}</blockquote>}
              </li>
            );
          })}
        </ol>
      </div>
      <div className="reveal">
        <h4 className="dv-ivc-label">{peopleLabel}</h4>
        <ul className="dv-ivc-list dv-ivc-people">
          {participants.map((p) => (
            <li key={p[0]}>
              <b>{p[0]}</b>
              <span>{p[1]}<small>{p[2]} · {p[3]}</small></span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
