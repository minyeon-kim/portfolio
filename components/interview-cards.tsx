// Interview evidence, read straight down: what we wanted to learn, then who took part.
export function InterviewCards({ questions, participants, peopleLabel, questionsLabel }: {
  questions: string[]; participants: string[][]; peopleLabel: string; questionsLabel: string;
}) {
  return (
    <div className="dv-ivc">
      <div className="reveal">
        <h4 className="dv-ivc-label">{questionsLabel}</h4>
        <ol className="dv-ivc-list dv-ivc-asks">
          {questions.map((q, i) => (
            <li key={q}>
              <b>{String(i + 1).padStart(2, "0")}</b>
              <p className="dv-ivc-q">{q}</p>
            </li>
          ))}
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
