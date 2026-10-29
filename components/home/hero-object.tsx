"use client";

import { useEffect, useRef } from "react";

// The landing backdrop: about 70,000 points filling the stage. At rest they
// run across it in dozens of drifting streams, in depth: scattered
// information. The cursor gathers what is near it into concentric orbits that
// brighten, and the streams quicken while the mouse moves: making the
// scattered legible, which is what the work is about. Hovering a case pulls
// every point into that case's form, abstractly:
// - Gemini privacy revamp: seven source streams converge on one answer, two of
//   them switched off (dim, stopping short): sources you can see and turn off.
// - Devsign: two line grids, design and code, a little apart and turned,
//   sliding into register and apart again: drift found and resolved.
// - About me: one continuous wave sheet, research to shipped without a break.
// The case worlds keep only their glows, so the form shows under their copy.
// Plain WebGL points (no model, no runtime), DPR 1, drawn at the display's
// rate with fewer points if frames run long; paused offscreen, hidden or
// during the page transition, and skipped with reduced motion (CSS shows the
// static ambient light instead).
const vertex = `
attribute vec3 rnd;
uniform float time;
uniform vec2 mouse;      // the cursor over the stage, -1..1, y up
uniform float aspect;
uniform float press;     // cursor engagement 0..1
uniform vec4 form;       // how far into each form: x Gemini, y Devsign, z About
varying float vBright;
varying float vDepth;

mat2 rot(float a) { float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }
// Perspective: z toward the viewer, camera at z = 3.
vec2 project(vec3 p) { return p.xy * 3.0 / (3.0 - p.z) / vec2(aspect, 1.0); }
vec3 unproject(vec2 s, float z) { return vec3(s * vec2(aspect, 1.0) * (3.0 - z) / 3.0, z); }

void main() {
  float W = aspect * 1.25;
  // 1. The flow: 48 streams crossing the screen, each a layered wave, points
  // running along them at their own pace, in depth.
  float lane = floor(rnd.y * 48.0);
  float z = mix(-2.2, 0.9, fract(lane * 0.618));
  float x = mod(rnd.x * 2.0 * W + time * (0.12 + 0.2 * fract(lane * 0.37)) * (1.0 + 0.6 * press), 2.0 * W) - W;
  float y = mix(-1.15, 1.15, fract(lane * 0.382 + 0.11)) + 0.16 * sin(x * 1.1 + time * 0.4 + lane) + 0.06 * sin(x * 3.1 - time * 0.7 + lane * 2.0) + (rnd.z - 0.5) * 0.05;
  vec3 flow = vec3(x, y, z);
  // 2. Gemini: seven source streams from the left converge on one answer at
  // the right; two of them are switched off (dim, they stop short).
  float src = floor(rnd.y * 7.0);
  float off = step(4.5, src);
  float u = fract(rnd.x + time * 0.06) * mix(1.0, 0.55, off);
  float sy = mix(-0.95, 1.05, src / 6.0);
  float e = u * u * (3.0 - 2.0 * u);
  vec2 g = vec2(mix(-W, W * 0.55, u), mix(sy, 0.3, e));
  float width = 0.11 * (1.0 - e) + 0.012;
  g.y += (rnd.z - 0.5) * width + 0.04 * sin(u * 9.0 + time + src) * (1.0 - e);
  vec3 gem = vec3(g, mix(-1.2, 0.5, fract(src * 0.618)) * (1.0 - e) + (rnd.z - 0.5) * 0.3 * (1.0 - e));
  // 3. Devsign: two grids of lines, design and code, slightly apart and
  // turned; they slide into register and drift apart again.
  float layer = step(0.5, rnd.z);
  float vertical = step(0.5, fract(rnd.z * 7.31));
  float line = floor(fract(rnd.y * 13.7) * mix(14.0, 24.0, vertical));
  float along = rnd.x;
  vec2 gq = vertical > 0.5 ? vec2(line / 23.0, along) : vec2(along, line / 13.0);
  vec2 gp = (gq - 0.5) * vec2(2.0 * W * 0.95, 2.2);
  float lock = smoothstep(0.25, 0.75, 0.5 + 0.5 * sin(time * 0.45));
  float drift = (1.0 - lock) * (layer * 2.0 - 1.0);
  gp = rot(drift * 0.05) * gp + vec2(drift * 0.07, drift * 0.04);
  vec3 dev = vec3(gp, -0.6 + layer * 0.35 * (1.0 - lock));
  // 4. About me: one continuous wave sheet, research to shipped without a break.
  vec2 sp = (rnd.xy - 0.5) * vec2(2.2 * W, 1.6);
  vec3 sheet = vec3(sp.x, -0.08 + sp.y * 0.3 + 0.26 * sin(sp.x * 1.3 + time * 0.5) * cos(sp.y * 1.6 - time * 0.3), sp.y * 1.6 - 0.5);
  // Blend the forms.
  vec3 p = flow;
  p = mix(p, gem, form.x);
  p = mix(p, dev, form.y);
  p = mix(p, sheet, form.z);
  // The cursor gathers what is near it into concentric orbits (not while a
  // case holds the points in its form).
  vec2 s = project(p);
  vec2 dv = (s - mouse) * vec2(aspect, 1.0);
  float d = length(dv);
  float k = press * smoothstep(0.55, 0.0, d) * (1.0 - max(form.x, max(form.y, form.z)));
  float ring = 0.06 + floor(rnd.z * 6.0) * 0.06;
  float ang = atan(dv.y, dv.x) + time * (0.9 - ring * 2.0) ;
  vec2 orbit = mouse + vec2(cos(ang), sin(ang)) * ring / vec2(aspect, 1.0);
  vec3 o3 = unproject(orbit, p.z * 0.3);
  p = mix(p, o3, k * 0.9);
  gl_Position = vec4(project(p), 0.0, 1.0);
  vDepth = clamp((p.z + 2.2) / 3.1, 0.0, 1.0);
  float laneGlow = 0.45 + 0.4 * step(0.8, fract(lane * 0.731));
  vBright = mix(laneGlow, 1.0, max(k, 0.8 * max(form.x * (1.0 - off * 0.75), max(form.y, form.z))));
  vBright = mix(vBright, 0.22, form.x * off);
  gl_PointSize = (1.3 + 2.0 * vDepth) * (1.0 + 0.6 * k);
}
`;

const fragment = `
precision highp float;
uniform float light;
uniform vec3 tint0;
uniform vec3 tint1;
varying float vBright;
varying float vDepth;
void main() {
  float a = smoothstep(0.5, 0.1, length(gl_PointCoord - 0.5));
  vec3 dark = mix(tint0 * 0.6, mix(tint1, vec3(0.95, 0.95, 1.0), 0.45), vBright);
  vec3 ink = mix(vec3(0.6, 0.61, 0.7), tint1 * 0.6, vBright);
  vec3 col = mix(dark, ink, light);
  float alpha = a * mix(0.2, 0.95, vBright) * (0.45 + 0.55 * vDepth);
  gl_FragColor = vec4(col * alpha, alpha);
}
`;

// Per state: the colours of the dim and the bright points, and which form
// the points take (Gemini, Devsign, About me).
export const OBJECT_STATES: Record<string, { tints: number[][]; form: number[] }> = {
  default: { tints: [[0.45, 0.5, 0.95], [0.6, 0.45, 0.95]], form: [0, 0, 0] },
  "gemini-privacy": { tints: [[0.3, 0.55, 1.0], [0.62, 0.6, 1.0]], form: [1, 0, 0] },
  "workflow-app": { tints: [[0.42, 0.3, 0.92], [0.66, 0.46, 1.0]], form: [0, 1, 0] },
  about: { tints: [[0.5, 0.52, 0.8], [0.72, 0.66, 0.95]], form: [0, 0, 1] },
};

const COUNT = 70000;

// `active` false stops drawing after a short fade.
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
    // Per point: three random numbers (its stream, its place along it, its
    // place in each form). Random, so drawing fewer points thins evenly.
    const rnd = new Float32Array(COUNT * 3);
    for (let i = 0; i < rnd.length; i++) rnd[i] = Math.random();
    const buffers = [["rnd", rnd, 3]].map(([name, data, size]) => {
      const buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, data as Float32Array, gl.STATIC_DRAW);
      const at = gl.getAttribLocation(program, name as string);
      gl.enableVertexAttribArray(at);
      gl.vertexAttribPointer(at, size as number, gl.FLOAT, false, 0, 0);
      return buffer;
    });
    const u = (name: string) => gl.getUniformLocation(program, name);
    const uTime = u("time"), uMouse = u("mouse"), uAspect = u("aspect"), uPress = u("press"), uForm = u("form"), uLight = u("light"), uT0 = u("tint0"), uT1 = u("tint1");
    gl.enable(gl.BLEND);
    // The theme: the explicit choice on <html>, else the system's.
    const scheme = window.matchMedia("(prefers-color-scheme: dark)");
    const isDark = () => { const t = document.documentElement.dataset.theme; return t ? t === "dark" : scheme.matches; };
    let lightTarget = isDark() ? 0 : 1;
    const onTheme = () => { lightTarget = isDark() ? 0 : 1; };
    scheme.addEventListener("change", onTheme);
    const themeObserver = new MutationObserver(onTheme);
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

    let width = 1, height = 1;
    const resize = () => {
      const rect = el.getBoundingClientRect();
      width = Math.max(1, Math.round(rect.width));
      height = Math.max(1, Math.round(rect.height));
      if (el.width !== width || el.height !== height) { el.width = width; el.height = height; }
      gl.viewport(0, 0, width, height);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(el);
    resize();

    // Where the mouse is over the stage (-1..1, y up) and how engaged it is
    // (eases in while the mouse moves, out a while after it rests).
    const cursor = { x: 0.3, y: 0.3, tx: 0.3, ty: 0.3, press: 0, movedAt: -1e9 };
    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      const rect = el.getBoundingClientRect();
      cursor.tx = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      cursor.ty = 1 - ((event.clientY - rect.top) / rect.height) * 2;
      cursor.movedAt = performance.now();
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    const current = { tints: OBJECT_STATES.default.tints.map((c) => [...c]), form: [0, 0, 0], light: lightTarget };
    let visible = true;
    const io = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }, { threshold: 0 });
    io.observe(el);

    // Fewer points (down to a third) while frames run long.
    let drawn = COUNT, slow = 0;
    let frame = 0, last = performance.now(), clock = 0;
    const draw = (now: number) => {
      frame = requestAnimationFrame(draw);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const covered = !running.current && idleSince.current !== null && now - idleSince.current > 800;
      const paused = !visible || document.hidden || covered || document.documentElement.hasAttribute("data-project-navigation");
      if (paused) return;
      slow = dt > 0.022 ? slow + 1 : Math.max(0, slow - 1);
      if (slow > 60 && drawn > COUNT / 3) { drawn = Math.max(Math.round(COUNT / 3), Math.round(drawn * 0.8)); slow = 0; }
      clock += dt;
      const target = OBJECT_STATES[state.current] ?? OBJECT_STATES.default;
      const k = 1 - Math.exp(-dt / 0.45);
      for (let s = 0; s < 2; s++) for (let i = 0; i < 3; i++) current.tints[s][i] += (target.tints[s][i] - current.tints[s][i]) * k;
      // The points travel into a form a little slower than the colours change.
      const kf = 1 - Math.exp(-dt / 0.6);
      for (let i = 0; i < 3; i++) current.form[i] += (target.form[i] - current.form[i]) * kf;
      current.light += (lightTarget - current.light) * k;
      const follow = 1 - Math.exp(-dt / 0.15);
      cursor.x += (cursor.tx - cursor.x) * follow;
      cursor.y += (cursor.ty - cursor.y) * follow;
      const engaged = now - cursor.movedAt < 2500 ? 1 : 0;
      cursor.press += (engaged - cursor.press) * (1 - Math.exp(-dt / (engaged ? 0.2 : 1.2)));
      gl.uniform1f(uTime, clock);
      gl.uniform2f(uMouse, cursor.x, cursor.y);
      gl.uniform1f(uPress, cursor.press);
      gl.uniform1f(uAspect, width / height);
      gl.uniform4f(uForm, current.form[0], current.form[1], current.form[2], 0);
      gl.uniform1f(uLight, current.light);
      gl.uniform3f(uT0, current.tints[0][0], current.tints[0][1], current.tints[0][2]);
      gl.uniform3f(uT1, current.tints[1][0], current.tints[1][1], current.tints[1][2]);
      // Dark: the points add up into light. Light: they lie over the page.
      if (current.light < 0.5) gl.blendFunc(gl.ONE, gl.ONE); else gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.POINTS, 0, drawn);
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
      buffers.forEach((buffer) => gl.deleteBuffer(buffer));
      gl.deleteProgram(program);
    };
  }, []);

  return <canvas ref={canvas} className={className} aria-hidden="true" />;
}
