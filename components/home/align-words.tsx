// Each word is its own box so the intro can slide from centered to left-aligned
// text while scrolling (see the alignment effect in project-stage.tsx). " | "
// marks a phrase break, which applies from md up.
export function AlignWords({ text }: { text: string }) {
  return text.split(" | ").map((phrase, p, phrases) => {
    const words = phrase.split(" ");
    return (
      <span key={p}>
        {words.map((word, i) => (
          <span key={i}>
            <span className="align-word">{word}</span>
            {i < words.length - 1 || p < phrases.length - 1 ? " " : null}
          </span>
        ))}
        {p < phrases.length - 1 && <br className="align-break" />}
      </span>
    );
  });
}
