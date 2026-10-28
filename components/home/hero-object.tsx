"use client";

import { useEffect, useRef } from "react";

// The landing object, after metalab.com's home: an oversized glossy black
// chrome form that crosses the whole screen, lit by long white studio
// highlights and deep violet and blue reflections, with film grain. Here the
// form is one continuous loop with a softly squared path: the positioning
// line made solid, the research-design-engineering loop that closes on
// itself. It turns slowly and tilts a little toward the cursor. Hovering a
// case changes the reflections to that case's colours (Gemini blue and
// lavender, Devsign purple) and the loop's weight. Raymarched in a fragment
// shader (no model, no runtime), capped at DPR 1, 1280px and 30fps, paused
// offscreen, hidden or during the page transition, and skipped with reduced
// motion (CSS shows the static ambient light instead).
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

mat2 rot(float a) { float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

vec3 orient(vec3 p) {
  p.yz = rot(1.15 + pointer.y * 0.1) * p.yz;
  p.xz = rot(time * 0.07 - pointer.x * 0.16) * p.xz;
  p.xy = rot(-0.5) * p.xy;
  return p;
}
// A thick loop on a softly squared path, breathing a little along its length.
float map(vec3 p) {
  p = orient(p);
  float ang = atan(p.z, p.x);
  vec2 q = abs(p.xz) - vec2(0.55);
  float path = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - 0.95;
  float y = p.y + 0.1 * sin(ang * 2.0 + time * 0.3);
  float r = 0.46 + 0.06 * spread + 0.03 * sin(ang * 3.0 - time * 0.2);
  return length(vec2(path, y)) - r;
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
  vec3 ro = vec3(0.0, 0.0, 4.8);
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
export function HeroObject({ variant = "default", active = true, className }: { variant?: string; active?: boolean; className?: string }) {
  const canvas = useRef<HTMLCanvasElement>(null);
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
    const uRes = u("resolution"), uPointer = u("pointer"), uTime = u("time"), uT = [u("tint0"), u("tint1"), u("tint2")], uSpread = u("spread"), uFocus = u("focus"), uLight = u("light");
    // The theme: the explicit choice on <html>, else the system's.
    const scheme = window.matchMedia("(prefers-color-scheme: dark)");
    const isDark = () => { const t = document.documentElement.dataset.theme; return t ? t === "dark" : scheme.matches; };
    let lightTarget = isDark() ? 0 : 1;
    const onTheme = () => { lightTarget = isDark() ? 0 : 1; };
    scheme.addEventListener("change", onTheme);
    const themeObserver = new MutationObserver(onTheme);
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

    let width = 0, height = 0;
    const resize = () => {
      const rect = el.getBoundingClientRect();
      const scale = Math.min(1, 1280 / Math.max(1, rect.width));
      width = Math.max(1, Math.round(rect.width * scale));
      height = Math.max(1, Math.round(rect.height * scale));
      if (el.width !== width || el.height !== height) { el.width = width; el.height = height; }
      gl.viewport(0, 0, width, height);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(el);
    resize();

    const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      pointer.tx = (event.clientX / window.innerWidth) * 2 - 1;
      pointer.ty = (event.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    const current = { tints: OBJECT_STATES.default.tints.map((c) => [...c]), spread: OBJECT_STATES.default.spread, focus: 0, light: lightTarget };
    let visible = true;
    const io = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }, { threshold: 0 });
    io.observe(el);

    let frame = 0, last = performance.now(), clock = 0, lastDraw = 0;
    const draw = (now: number) => {
      frame = requestAnimationFrame(draw);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const covered = !running.current && idleSince.current !== null && now - idleSince.current > 800;
      const paused = !visible || document.hidden || covered || document.documentElement.hasAttribute("data-project-navigation");
      if (paused) return;
      if (now - lastDraw < 1000 / 30) return;
      lastDraw = now;
      clock += dt;
      const target = OBJECT_STATES[state.current] ?? OBJECT_STATES.default;
      const k = 1 - Math.exp(-dt / 0.45);
      for (let s = 0; s < 3; s++) for (let i = 0; i < 3; i++) current.tints[s][i] += (target.tints[s][i] - current.tints[s][i]) * k;
      current.spread += (target.spread - current.spread) * k;
      current.focus += (target.focus - current.focus) * k;
      current.light += (lightTarget - current.light) * k;
      pointer.x += (pointer.tx - pointer.x) * (1 - Math.exp(-dt / 0.6));
      pointer.y += (pointer.ty - pointer.y) * (1 - Math.exp(-dt / 0.6));
      gl.uniform2f(uRes, width, height);
      gl.uniform2f(uPointer, pointer.x, pointer.y);
      gl.uniform1f(uTime, clock);
      for (let s = 0; s < 3; s++) gl.uniform3f(uT[s], current.tints[s][0], current.tints[s][1], current.tints[s][2]);
      gl.uniform1f(uSpread, current.spread);
      gl.uniform1f(uFocus, current.focus);
      gl.uniform1f(uLight, current.light);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
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

  return <canvas ref={canvas} className={className} aria-hidden="true" />;
}
