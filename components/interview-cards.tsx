// Interview evidence: what we wanted to learn as three small diagrams, then who took part.
const Q_MARKS = [
  // Where AI-made work gets stuck between two people.
  <svg key="0" viewBox="0 0 160 64" aria-hidden="true"><circle className="q" cx="16" cy="32" r="10" /><path className="q" d="M32 32h30" /><rect className="on" x="68" y="16" width="24" height="32" rx="4" /><path className="on" d="M73 27l14 10M87 27L73 37" /><path className="q d" d="M98 32h30" /><circle className="q" cx="144" cy="32" r="10" /></svg>,
  // Design and build differ: who decides?
  <svg key="1" viewBox="0 0 160 64" aria-hidden="true"><rect className="q" x="4" y="14" width="36" height="36" rx="4" /><rect className="q" x="120" y="14" width="36" height="36" rx="4" /><path className="q d" d="M46 32h22M92 32h22" /><circle className="on" cx="80" cy="32" r="12" /><path className="on" d="M76 28a4 4 0 118 0c0 3-4 3-4 6M80 38v.5" /></svg>,
  // The final version exists; its reason doesn't.
  <svg key="2" viewBox="0 0 160 64" aria-hidden="true"><rect className="q" x="20" y="10" width="44" height="44" rx="4" /><path className="q" d="M32 33l8 8 13-16" /><path className="q d" d="M70 32h20" /><rect className="on d" x="96" y="10" width="44" height="44" rx="4" /><path className="on d" d="M108 26h20M108 38h12" /></svg>,
];

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
