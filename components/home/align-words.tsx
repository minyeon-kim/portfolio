// Each word is its own box so the intro can slide from centered to left-aligned
// text while scrolling (see the alignment effect in project-stage.tsx).
export function AlignWords({ text }: { text: string }) {
  const words = text.split(" ");
  return words.map((word, i) => (
    <span key={i}>
      <span className="align-word">{word}</span>
      {i < words.length - 1 ? " " : null}
    </span>
  ));
}
