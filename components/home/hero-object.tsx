"use client";

import { useEffect, useRef } from "react";

// The landing backdrop: a ride. The camera runs down a chrome coaster track
// that swoops and banks through a chrome coil, so the stage keeps pulling
// you in (the research-design-engineering loop as a track that never stops).
// Same studio as before: glossy black chrome lit by long white highlights and
// violet and blue reflections, with film grain. The cursor turns the head and
// slides a glint over the chrome; moving the mouse speeds the ride up a little.
// Hovering a case changes the reflections to that case's colours (Gemini blue
// and lavender, Devsign purple) and the coil's width. Raymarched in a fragment
// shader (no model, no runtime), capped at DPR 1 and 1100px, drawn at the
// display's rate and rendered smaller if frames run long; paused offscreen,
// hidden or during the page transition, and skipped with reduced motion (CSS
// shows the static ambient light instead).
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

uniform float travel;

mat2 rot(float a) { float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

// The ride's centreline: a long swooping curve the camera follows down z.
vec2 path(float z) { return vec2(sin(z * 0.16) * 1.8 + sin(z * 0.061) * 1.4, sin(z * 0.11) * 0.7 + cos(z * 0.043) * 0.5); }
// The scene, in coordinates that follow the path (gentle curves, so the
// distance to a curve is close enough to the distance in the plane): a
// coaster track under the camera (two chrome rails on ties) and a chrome
// coil wound around the ride, its rings rushing past.
float map(vec3 p) {
  vec2 q = p.xy - path(p.z);
  vec2 b = q - vec2(0.0, -0.75);
  float rails = length(vec2(abs(b.x) - 0.42, b.y)) - 0.055;
  float zt = mod(p.z, 0.7) - 0.35;
  vec3 tie = abs(vec3(b.x, b.y + 0.09, zt)) - vec3(0.5, 0.025, 0.05);
  float ties = length(max(tie, 0.0)) + min(max(tie.x, max(tie.y, tie.z)), 0.0);
  // The coil as a true helix (radius R, k turns per unit of z): the gap along
  // z to the nearest turn, tilted by the helix's pitch.
  float R = 1.5 + 0.1 * spread, k = 1.25;
  float dz = mod(p.z - atan(q.y, q.x) / k + 3.14159 / k, 6.28318 / k) - 3.14159 / k;
  float coil = length(vec2(length(q) - R, dz * k * R / sqrt(k * k * R * R + 1.0))) - 0.085;
  return min(min(rails, ties), coil) * 0.6;
}
vec3 normalAt(vec3 p) {
  vec2 e = vec2(0.002, 0.0);
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
  // Riding the path: the camera a little above the centreline, looking down
  // the curve ahead, banking into the turns; the cursor turns the head.
  float z = travel;
  vec3 ro = vec3(path(z), z);
  vec3 ahead = vec3(path(z + 4.0), z + 4.0);
  vec3 fw = normalize(ahead - ro + vec3(pointer.x * 0.5, -pointer.y * 0.3, 0.0));
  float bank = (path(z + 2.0).x - 2.0 * path(z + 1.0).x + path(z).x) * 1.2;
  vec3 up = vec3(sin(bank), cos(bank), 0.0);
  vec3 rt = normalize(cross(fw, up));
  up = cross(rt, fw);
  vec3 rd = normalize(uv.x * rt + uv.y * up + 1.25 * fw);
  float t = 0.05; float hit = -1.0;
  for (int i = 0; i < 110; i++) {
    float d = map(ro + rd * t);
    if (d < 0.0012 * t) { hit = t; break; }
    t += max(d, 0.002);
    if (t > 24.0) break;
  }
  float grain = (hash(gl_FragCoord.xy + fract(time) * 7.0) - 0.5) * 0.045;
  if (hit < 0.0) { gl_FragColor = vec4(0.0); return; }
  vec4 c = shade(ro + rd * hit, rd);
  c.rgb *= mix(1.6, 0.8, light);
  // Far chrome sinks into the stage's own background.
  float a = exp(-hit * 0.15);
  gl_FragColor = vec4((c.rgb + grain) * a, a);
}
`;

// Per case: the colours of the three reflections (sky, floor, front), the
// coil's extra width and whether the chrome's edges light up.
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
    const uRes = u("resolution"), uPointer = u("pointer"), uTime = u("time"), uT = [u("tint0"), u("tint1"), u("tint2")], uSpread = u("spread"), uFocus = u("focus"), uLight = u("light"), uCursor = u("cursor"), uPress = u("press"), uTravel = u("travel");
    // The theme: the explicit choice on <html>, else the system's.
    const scheme = window.matchMedia("(prefers-color-scheme: dark)");
    const isDark = () => { const t = document.documentElement.dataset.theme; return t ? t === "dark" : scheme.matches; };
    let lightTarget = isDark() ? 0 : 1;
    const onTheme = () => { lightTarget = isDark() ? 0 : 1; };
    scheme.addEventListener("change", onTheme);
    const themeObserver = new MutationObserver(onTheme);
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

    let width = 0, height = 0;
    // Lowered (to half at most) while frames run long.
    let quality = 1;
    const resize = () => {
      const rect = el.getBoundingClientRect();
      const scale = Math.min(1, 1100 / Math.max(1, rect.width)) * quality;
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

    // Distance down the track; the speed eases up while the mouse moves.
    let frame = 0, last = performance.now(), clock = 0, slow = 0, travel = 0;
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
      travel += dt * (1.8 + 1.4 * cursor.press);
      gl.uniform2f(uRes, width, height);
      gl.uniform2f(uPointer, pointer.x, pointer.y);
      gl.uniform1f(uTime, clock);
      for (let s = 0; s < 3; s++) gl.uniform3f(uT[s], current.tints[s][0], current.tints[s][1], current.tints[s][2]);
      gl.uniform1f(uSpread, current.spread);
      gl.uniform1f(uFocus, current.focus);
      gl.uniform1f(uLight, current.light);
      gl.uniform2f(uCursor, cursor.x, cursor.y);
      gl.uniform1f(uPress, cursor.press);
      gl.uniform1f(uTravel, travel);
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
