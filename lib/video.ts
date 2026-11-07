// Case clips play muted and looping with no control bar (owner). If the browser refuses
// autoplay, the clip waits and starts on the visitor's next scroll, tap or key press instead
// of showing controls; an interrupted play (a quick scroll pausing it) is simply ignored.
const KICK = ["pointerdown", "keydown", "touchstart", "scroll"] as const;
export function playClip(v: HTMLVideoElement) {
  return v.play().catch((error: Error) => {
    if (error?.name !== "NotAllowedError") return;
    const retry = () => { KICK.forEach((t) => window.removeEventListener(t, retry)); v.play().catch(() => {}); };
    KICK.forEach((t) => window.addEventListener(t, retry, { passive: true }));
  });
}
// Pressing a clip pauses or resumes it, the one control kept without a bar.
export function toggleClip(event: { currentTarget: HTMLVideoElement }) {
  const v = event.currentTarget;
  if (v.paused) v.play().catch(() => {}); else v.pause();
}
