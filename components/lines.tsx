// Headings break between whole phrases instead of wherever the width runs out.
// Write " | " where a line should end; from md up each phrase gets its own line,
// and on narrow screens the text flows normally.
export function Lines({ text }: { text: string }) {
  const parts = text.split(" | ");
  if (parts.length === 1) return text;
  return parts.map((part, i) => (
    <span key={i} className="line">
      {part}
      {i < parts.length - 1 ? " " : null}
    </span>
  ));
}
