"use client";

import { useEffect, useRef } from "react";

// The landing object, after metalab.com's home: an oversized glossy black
// chrome form that crosses the whole screen, lit by long white studio
// highlights and deep violet and blue reflections, with film grain. Here the
// form is one continuous loop with a softly squared path: the positioning
// line made solid, the research-design-engineering loop that closes on
// itself; its three stages ride along it as labels (Research, Design,
// Engineering), so the form says what it stands for. It turns slowly and
// answers the cursor: it tilts toward it, a glint follows it across the
// chrome, and the tube swells where the cursor points. Hovering a case
// changes the reflections to that case's colours (Gemini blue and lavender,
// Devsign purple) and the loop's weight. Raymarched in a fragment shader (no
// model, no runtime), capped at DPR 1 and 1100px, drawn at the display's rate
// and rendered smaller if frames run long; paused offscreen, hidden or during
// the page transition, and skipped with reduced motion (CSS shows the static
// ambient light instead).
const vertex = `
attribute vec2 position;
void main() { gl_Position = vec4(position, 0.0, 1.0); }
`;

const fragment = `
precision highp float;
uniform vec2 resolution;
uniform vec2 pointer;
uniform float time;
uniform vec3 tint0;
uniform vec3 tint1;
uniform vec3 tint2;
uniform float spread;
uniform float focus;
uniform float light;
uniform vec2 cursor;
uniform float press;

mat2 rot(float a) { float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

vec3 orient(vec3 p) {
  p.yz = rot(1.15 + pointer.y * 0.22) * p.yz;
  p.xz = rot(time * 0.07 - pointer.x * 0.34) * p.xz;
  p.xy = rot(-0.5) * p.xy;
  return p;
}
// The camera, shared with main(): the cursor's ray through the scene.
const vec3 eye = vec3(0.0, 0.0, 4.8);
// A thick loop on a softly squared path, breathing a little along its length,
// swelling a little where the cursor points.
float map(vec3 p) {
  vec3 ray = normalize(vec3(cursor, -1.9));
  vec3 w = p - eye;
  float near = length(w - ray * dot(w, ray));
  float swell = 0.09 * press * exp(-near * near / 0.12);
  p = orient(p);
  float ang = atan(p.z, p.x);
  vec2 q = abs(p.xz) - vec2(0.55);
  float path = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - 0.95;
  float y = p.y + 0.1 * sin(ang * 2.0 + time * 0.3);
  float r = 0.46 + 0.06 * spread + 0.03 * sin(ang * 3.0 - time * 0.2);
  return length(vec2(path, y)) - r - swell;
}
vec3 normalAt(vec3 p) {
  vec2 e = vec2(0.0015, 0.0);
  return normalize(vec3(map(p + e.xyy) - map(p - e.xyy), map(p + e.yxy) - map(p - e.yxy), map(p + e.yyx) - map(p - e.yyx)));
}
// A long thin light: bright where the reflected ray is near a great circle.
float streak(vec3 r, vec3 n, vec3 c, float w) {
  float band = exp(-pow(dot(r, n) / w, 2.0));
  return band * smoothstep(-0.3, 0.6, dot(r, c));
}
// The studio around the object: near black, a violet sky, blue from below,
// two white softbox streaks.
vec3 env(vec3 r) {
  // Dark: a near-black room. Light: a bright pearl room, where the streaks
  // read as dark seams instead.
  vec3 c = mix(vec3(0.01, 0.01, 0.016), mix(vec3(0.42, 0.44, 0.5), vec3(0.9, 0.91, 0.94), smoothstep(-0.4, 0.8, r.y)), light);
  c += tint1 * 0.78 * pow(max(dot(r, normalize(vec3(-0.35, 0.75, 0.55))), 0.0), 2.2);
  c += tint0 * 0.5 * pow(max(dot(r, normalize(vec3(0.65, -0.45, 0.6))), 0.0), 2.6);
  c += tint2 * 0.18 * pow(max(dot(r, normalize(vec3(0.2, 0.2, 1.0))), 0.0), 6.0);
  // In light the streaks widen and soften: a narrow dark seam over pale chrome
  // reads as a crease in the surface.
  float s1 = streak(r, normalize(vec3(0.25, 1.0, 0.35)), normalize(vec3(0.1, 0.25, 1.0)), mix(0.085, 0.16, light));
  float s2 = streak(r, normalize(vec3(-0.9, 0.15, 0.4)), normalize(vec3(0.35, -0.25, 0.9)), mix(0.06, 0.12, light));
  c += vec3(1.0) * mix(2.0, 0.45, light) * s1 + vec3(0.95, 0.95, 1.0) * mix(1.3, 0.3, light) * s2;
  c -= vec3(0.6, 0.6, 0.66) * light * 0.5 * streak(r, normalize(vec3(0.6, 0.7, -0.3)), normalize(vec3(-0.2, 0.3, 1.0)), 0.2);
  // A small softbox held where the cursor is: its glint slides over the chrome.
  float glint = pow(max(dot(r, normalize(vec3(cursor * 1.6, 1.0))), 0.0), 60.0);
  c += mix(vec3(1.0), tint2, 0.3) * glint * press * mix(2.4, 0.8, light);
  return c;
}
vec4 shade(vec3 p, vec3 rd) {
  vec3 n = normalAt(p);
  vec3 v = -rd;
  float nv = max(dot(n, v), 0.0);
  float fres = 0.08 + 0.92 * pow(1.0 - nv, 3.0);
  vec3 r = reflect(rd, n);
  vec3 refl = env(r);
  // Black chrome: almost everything is reflection; a trace of the case colour
  // in the body, and a soft lit edge when a case is picked.
  vec3 col = mix(vec3(0.012), vec3(0.4, 0.42, 0.47), light) + refl * (0.55 + 0.45 * fres) + tint1 * mix(0.03, 0.14, light) + tint0 * focus * pow(1.0 - nv, 2.0) * 0.25;
  return vec4(col, 1.0);
}
void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * resolution) / resolution.y;
  // Camera close, so the loop sweeps past the edges of the stage.
  vec3 ro = eye;
  vec3 rd = normalize(vec3(uv, -1.9));
  float t = 0.0; float hit = -1.0; float dm = 1e9; float tm = 0.0;
  for (int i = 0; i < 90; i++) {
    vec3 p = ro + rd * t;
    float d = map(p);
    if (d < dm) { dm = d; tm = t; }
    if (d < 0.001) { hit = t; break; }
    t += d * 0.92;
    if (t > 11.0) break;
  }
  float grain = (hash(gl_FragCoord.xy + fract(time) * 7.0) - 0.5) * 0.045;
  if (hit >= 0.0) {
    vec4 c = shade(ro + rd * hit, rd);
    gl_FragColor = vec4(c.rgb + grain, 1.0);
    return;
  }
  // Missed: soften the silhouette by about a pixel.
  float px = tm / resolution.y * 1.3;
  float edge = 1.0 - smoothstep(0.0, px, dm);
  if (edge < 0.002) { gl_FragColor = vec4(0.0); return; }
  vec4 c = shade(ro + rd * tm, rd);
  gl_FragColor = vec4((c.rgb + grain) * edge, edge);
}
`;

// Per case: the colours of the three reflections (sky, floor, front), the
// loop's extra weight and whether its edge lights up.
export const OBJECT_STATES: Record<string, { tints: number[][]; spread: number; focus: number }> = {
  default: { tints: [[0.28, 0.4, 0.95], [0.5, 0.3, 0.95], [0.75, 0.8, 0.95]], spread: 0, focus: 0 },
  "gemini-privacy": { tints: [[0.26, 0.55, 1.0], [0.62, 0.55, 1.0], [0.78, 0.86, 1.0]], spread: 0.3, focus: 1 },
  "workflow-app": { tints: [[0.38, 0.26, 0.9], [0.6, 0.42, 1.0], [0.7, 0.62, 1.0]], spread: -0.4, focus: 0.6 },
};

// `active` false (a world covers the loop) stops drawing after the fade, so
// the GPU is free for the prototype frame.
// The loop's path in its own plane, as in map(): a rounded square of half-size
// 1.5 with corner radius 0.95. The radius along the angle `a`, by bisection.
function pathRadius(a: number) {
  const x = Math.abs(Math.cos(a)), z = Math.abs(Math.sin(a));
  const sdf = (r: number) => {
    const qx = x * r - 0.55, qz = z * r - 0.55;
    return Math.hypot(Math.max(qx, 0), Math.max(qz, 0)) + Math.min(Math.max(qx, qz), 0) - 0.95;
  };
  let lo = 0, hi = 3;
  for (let i = 0; i < 20; i++) { const mid = (lo + hi) / 2; if (sdf(mid) < 0) lo = mid; else hi = mid; }
  return lo;
}
const turn = (a: number, b: number, angle: number): [number, number] => {
  // GLSL rot(angle) * vec2(a, b) with mat2(c, -s, s, c) (column-major).
  const c = Math.cos(angle), s = Math.sin(angle);
  return [c * a + s * b, -s * a + c * b];
};

export function HeroObject({ variant = "default", active = true, className, labels = [] }: { variant?: string; active?: boolean; className?: string; labels?: string[] }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const labelBox = useRef<HTMLDivElement>(null);
  const state = useRef(variant);
  useEffect(() => { state.current = variant; }, [variant]);
  const running = useRef(active);
  const idleSince = useRef<number | null>(null);
  useEffect(() => { running.current = active; idleSince.current = active ? null : performance.now(); }, [active]);

  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduce.matches) return;
    const gl = el.getContext("webgl", { alpha: true, antialias: false, premultipliedAlpha: true, powerPreference: "low-power" });
    if (!gl) return;
    const compile = (type: number, src: string) => { const s = gl.createShader(type)!; gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) console.error("hero-object shader", gl.getShaderInfoLog(s)); return s; };
    const program = gl.createProgram()!;
    gl.attachShader(program, compile(gl.VERTEX_SHADER, vertex));
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fragment));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) { console.error("hero-object", gl.getProgramInfoLog(program)); return; }
    gl.useProgram(program);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, "position");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    const u = (name: string) => gl.getUniformLocation(program, name);
    const uRes = u("resolution"), uPointer = u("pointer"), uTime = u("time"), uT = [u("tint0"), u("tint1"), u("tint2")], uSpread = u("spread"), uFocus = u("focus"), uLight = u("light"), uCursor = u("cursor"), uPress = u("press");
    // The theme: the explicit choice on <html>, else the system's.
    const scheme = window.matchMedia("(prefers-color-scheme: dark)");
    const isDark = () => { const t = document.documentElement.dataset.theme; return t ? t === "dark" : scheme.matches; };
    let lightTarget = isDark() ? 0 : 1;
    const onTheme = () => { lightTarget = isDark() ? 0 : 1; };
    scheme.addEventListener("change", onTheme);
    const themeObserver = new MutationObserver(onTheme);
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

    let width = 0, height = 0, cssWidth = 1, cssHeight = 1;
    // Lowered (to half at most) while frames run long.
    let quality = 1;
    const resize = () => {
      const rect = el.getBoundingClientRect();
      cssWidth = Math.max(1, rect.width);
      cssHeight = Math.max(1, rect.height);
      const scale = Math.min(1, 1100 / cssWidth) * quality;
      width = Math.max(1, Math.round(rect.width * scale));
      height = Math.max(1, Math.round(rect.height * scale));
      if (el.width !== width || el.height !== height) { el.width = width; el.height = height; }
      gl.viewport(0, 0, width, height);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(el);
    resize();

    // pointer: the tilt (-1..1 over the window). cursor: where it points, in
    // the shader's screen units (height 1, centre 0, y up), and how engaged
    // it is (eases in while the mouse moves over the stage, out when it rests).
    const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
    const cursor = { x: 0, y: 0, tx: 0, ty: 0, press: 0, movedAt: -1e9 };
    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      pointer.tx = (event.clientX / window.innerWidth) * 2 - 1;
      pointer.ty = (event.clientY / window.innerHeight) * 2 - 1;
      const rect = el.getBoundingClientRect();
      cursor.tx = (event.clientX - rect.left - rect.width / 2) / rect.height;
      cursor.ty = -(event.clientY - rect.top - rect.height / 2) / rect.height;
      cursor.movedAt = performance.now();
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    const current = { tints: OBJECT_STATES.default.tints.map((c) => [...c]), spread: OBJECT_STATES.default.spread, focus: 0, light: lightTarget };
    let visible = true;
    const io = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }, { threshold: 0 });
    io.observe(el);

    // The labels ride the loop's centreline: object space → the scene (the
    // inverse of orient()) → the screen (the camera in main()). The loop is
    // larger than the stage, so they are spread evenly over the part of it
    // that is on screen, drifting slowly along it; behind the tube they fade.
    const labelEls = Array.from(labelBox.current?.children ?? []) as HTMLElement[];
    const radii = Array.from({ length: 144 }, (_, i) => pathRadius((i / 144) * Math.PI * 2));
    const project = (i: number) => {
      const a = (i / 144) * Math.PI * 2;
      let x = Math.cos(a) * radii[i], z = Math.sin(a) * radii[i];
      let y = -0.1 * Math.sin(a * 2 + clock * 0.3);
      [x, y] = turn(x, y, 0.5);
      [x, z] = turn(x, z, -(clock * 0.07 - pointer.x * 0.34));
      [y, z] = turn(y, z, -(1.15 + pointer.y * 0.22));
      const k = 1.9 / (4.8 - z);
      return { x: cssWidth / 2 + x * k * cssHeight, y: cssHeight / 2 - y * k * cssHeight, front: Math.min(1, Math.max(0, (z + 1.1) / 1.6)) };
    };
    // The stage's copy (headline, picker, note) and the header: kept clear of
    // labels. Measured every half second, in the canvas's coordinates.
    let avoid: { l: number; t: number; r: number; b: number }[] = [];
    let measuredAt = -1e9;
    const measure = (now: number) => {
      if (now - measuredAt < 500) return;
      measuredAt = now;
      const origin = el.getBoundingClientRect();
      avoid = Array.from(document.querySelectorAll<HTMLElement>(".home-tagline-wrap, .home-picks, .home-note, header"))
        .map((node) => node.getBoundingClientRect())
        .filter((r) => r.width > 0 && r.height > 0)
        .map((r) => ({ l: r.left - origin.left - 70, t: r.top - origin.top - 24, r: r.right - origin.left + 70, b: r.bottom - origin.top + 24 }));
    };
    const placeLabels = (now: number) => {
      if (!labelEls.length) return;
      measure(now);
      const points = radii.map((_, i) => project(i));
      const inside = (q: { x: number; y: number }) => q.x > 80 && q.x < cssWidth - 80 && q.y > 90 && q.y < cssHeight - 60
        && !avoid.some((z) => q.x > z.l && q.x < z.r && q.y > z.t && q.y < z.b);
      // The longest run of on-screen points (the loop closes, so walk it twice).
      let best: number[] = [], run: number[] = [];
      for (let n = 0; n < 288; n++) {
        const i = n % 144;
        if (inside(points[i]) && run.length < 144) run.push(i); else run = [];
        if (run.length > best.length) best = [...run];
      }
      if (best.length < labelEls.length * 4) { labelEls.forEach((label) => { label.style.opacity = "0"; }); return; }
      const drift = (clock * 0.02) % 1;
      labelEls.forEach((label, i) => {
        const at = (((i + 0.5) / labelEls.length + drift * 0.3) % 1) * 0.84 + 0.08;
        const q = points[best[Math.floor(at * (best.length - 1))]];
        label.style.transform = `translate3d(${q.x.toFixed(1)}px, ${q.y.toFixed(1)}px, 0) translate(-50%, -50%)`;
        label.style.opacity = (0.75 + 0.25 * q.front).toFixed(3);
      });
      labelBox.current?.setAttribute("data-ready", "");
    };

    let frame = 0, last = performance.now(), clock = 0, slow = 0;
    const draw = (now: number) => {
      frame = requestAnimationFrame(draw);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const covered = !running.current && idleSince.current !== null && now - idleSince.current > 800;
      const paused = !visible || document.hidden || covered || document.documentElement.hasAttribute("data-project-navigation");
      if (paused) return;
      // Frames over ~22ms for a second running: render smaller.
      slow = dt > 0.022 ? slow + 1 : Math.max(0, slow - 1);
      if (slow > 60 && quality > 0.5) { quality = Math.max(0.5, quality * 0.8); slow = 0; resize(); }
      clock += dt;
      const target = OBJECT_STATES[state.current] ?? OBJECT_STATES.default;
      const k = 1 - Math.exp(-dt / 0.45);
      for (let s = 0; s < 3; s++) for (let i = 0; i < 3; i++) current.tints[s][i] += (target.tints[s][i] - current.tints[s][i]) * k;
      current.spread += (target.spread - current.spread) * k;
      current.focus += (target.focus - current.focus) * k;
      current.light += (lightTarget - current.light) * k;
      pointer.x += (pointer.tx - pointer.x) * (1 - Math.exp(-dt / 0.6));
      pointer.y += (pointer.ty - pointer.y) * (1 - Math.exp(-dt / 0.6));
      const follow = 1 - Math.exp(-dt / 0.12);
      cursor.x += (cursor.tx - cursor.x) * follow;
      cursor.y += (cursor.ty - cursor.y) * follow;
      const engaged = now - cursor.movedAt < 1800 ? 1 : 0;
      cursor.press += (engaged - cursor.press) * (1 - Math.exp(-dt / (engaged ? 0.25 : 0.9)));
      gl.uniform2f(uRes, width, height);
      gl.uniform2f(uPointer, pointer.x, pointer.y);
      gl.uniform1f(uTime, clock);
      for (let s = 0; s < 3; s++) gl.uniform3f(uT[s], current.tints[s][0], current.tints[s][1], current.tints[s][2]);
      gl.uniform1f(uSpread, current.spread);
      gl.uniform1f(uFocus, current.focus);
      gl.uniform1f(uLight, current.light);
      gl.uniform2f(uCursor, cursor.x, cursor.y);
      gl.uniform1f(uPress, cursor.press);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      placeLabels(now);
    };
    frame = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      io.disconnect();
      window.removeEventListener("pointermove", onMove);
      scheme.removeEventListener("change", onTheme);
      themeObserver.disconnect();
      // Not loseContext(): React's dev StrictMode re-runs the effect on the same
      // canvas, and a lost context cannot compile shaders again.
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
    };
  }, []);

  return (
    <>
      <canvas ref={canvas} className={className} aria-hidden="true" />
      {labels.length > 0 && (
        <div ref={labelBox} className="hero-object-labels" aria-hidden="true">
          {labels.map((label) => <span key={label}>{label}</span>)}
        </div>
      )}
    </>
  );
}
