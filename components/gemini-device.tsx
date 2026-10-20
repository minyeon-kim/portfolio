import type { ReactNode } from "react";

// 3D wrapper for the Gemini phone mockup (mobile-preview.svg, 1000x1100). The
// side strip sits on the phone body's left edge (x 28.3%, y 6.4%-93.6% of the
// art) and extends backwards, so the phone reads as a solid object while it is
// turned. Rotation is scroll-driven in globals.css; upright without it.
export function GeminiDevice({ children }: { children: ReactNode }) {
  return (
    <div className="gemini-device">
      <span className="gemini-device-side" aria-hidden="true" />
      {children}
    </div>
  );
}
