import type { ReactNode } from "react";

// Sets one phrase of a line apart: the phrase in full ink, the rest muted
// (styled by .has-emphasis in app/globals.css). Without a match the line is plain.
export function Emphasis({ text, phrase }: { text: string; phrase?: string }): ReactNode {
  const at = phrase ? text.indexOf(phrase) : -1;
  if (!phrase || at < 0) return text;
  return <>{text.slice(0, at)}<strong>{phrase}</strong>{text.slice(at + phrase.length)}</>;
}
