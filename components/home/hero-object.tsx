"use client";

import { useEffect, useRef } from "react";

// The landing object: a sphere of about 60,000 points, the positioning line
// as an image. Most of the points are out of place, drifting in a cloud like
// ciphertext; the cursor decodes: near it every point falls into place on the
// shell, so the sphere sharpens wherever you look, and the points right under
// the cursor step aside. It turns slowly and leans toward the cursor; when the
// mouse rests, the decoding lens drifts around the sphere on its own. The
// research-to-shipped work of the cases is the same move: making what is
// hidden or scattered legible. Hovering a case recolours the points (Gemini
// blue and lavender, Devsign purple). Plain WebGL points (no model, no
// runtime), DPR 1, drawn at the display's rate with fewer points if frames
// run long; paused offscreen, hidden or during the page transition, and
// skipped with reduced motion (CSS shows the static ambient light instead).
const vertex = `
attribute float idx;
attribute vec3 rnd;
uniform float count;
uniform float time;
uniform vec2 pointer;    // tilt, -1..1
uniform vec2 lens;       // where the decoding lens is, -1..1, y up
uniform float reach;     // the lens's size
uniform float aspect;    // width / height
uniform float order;     // share of points in place away from the lens
uniform float spread;
varying float vOrder;
varying float vDepth;

mat2 rot(float a) { float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }
vec3 turn(vec3 p) {
  p.xz = rot(time * 0.06 + pointer.x * 0.35) * p.xz;
  p.yz = rot(0.25 - pointer.y * 0.25) * p.yz;
  return p;
}
// The form sits above the middle, a little right, clear of the copy.
vec2 project(vec3 p) { vec2 s = p.xy * 2.1 / (5.0 - p.z) + vec2(0.1, 0.26); s.x /= aspect; return s; }

void main() {
  // In place: an even shell (a Fibonacci sphere). Out of place: the same
  // point flung out into a drifting cloud.
  float phi = acos(1.0 - 2.0 * (idx + 0.5) / count);
  float th = 3.14159265 * (1.0 + sqrt(5.0)) * idx;
  vec3 shell = (1.2 + 0.08 * spread) * vec3(sin(phi) * cos(th), cos(phi), sin(phi) * sin(th));
  vec3 drift = vec3(sin(time * 0.31 + rnd.x * 6.28), sin(time * 0.27 + rnd.y * 6.28), sin(time * 0.23 + rnd.z * 6.28));
  vec3 cloud = shell * (1.0 + rnd.x * 0.9) + (rnd - 0.5) * vec3(3.6, 2.4, 2.4) + drift * 0.25;
  vec3 a = turn(shell), b = turn(cloud);
  // Each point is either in place or out in the cloud: a share of them
  // everywhere, all of them near the lens.
  vec2 sa = project(a);
  float d = length((sa - lens) * vec2(aspect, 1.0));
  float share = clamp(order + (1.0 - order) * smoothstep(reach, 0.05, d), 0.0, 1.0);
  float o = smoothstep(rnd.y - 0.08, rnd.y + 0.08, share);
  vec3 p = mix(b, a, o);
  vec2 s = project(p);
  // The points right under the lens step aside.
  vec2 away = (s - lens) * vec2(aspect, 1.0);
  float r = length(away);
  s += normalize(away + 1e-4) / vec2(aspect, 1.0) * 0.05 * exp(-r * r / 0.02);
  gl_Position = vec4(s, 0.0, 1.0);
  vDepth = clamp((p.z + 3.0) / 6.0, 0.0, 1.0);
  vOrder = o;
  gl_PointSize = (1.4 + 1.6 * o) * (0.6 + 0.8 * vDepth);
}
`;

const fragment = `
precision highp float;
uniform float light;
uniform vec3 tint0;
uniform vec3 tint1;
varying float vOrder;
varying float vDepth;
void main() {
  float a = smoothstep(0.5, 0.15, length(gl_PointCoord - 0.5));
  // Dark: dim blue when scattered, bright lavender-white in place. Light:
  // grey when scattered, the case's deep colour in place.
  vec3 dark = mix(tint0 * 0.55, mix(tint1 * 1.15, vec3(0.95, 0.95, 1.0), 0.5), vOrder);
  vec3 ink = mix(vec3(0.55, 0.56, 0.66), tint1 * 0.62, vOrder);
  vec3 col = mix(dark, ink, light);
  float alpha = a * mix(0.4, 0.95, vOrder) * (0.45 + 0.55 * vDepth);
  gl_FragColor = vec4(col * alpha, alpha);
}
`;

// Per case: the colours of the scattered and the placed points, and the
// sphere's extra size.
export const OBJECT_STATES: Record<string, { tints: number[][]; spread: number }> = {
  default: { tints: [[0.45, 0.5, 0.95], [0.6, 0.45, 0.95]], spread: 0 },
  "gemini-privacy": { tints: [[0.3, 0.55, 1.0], [0.62, 0.6, 1.0]], spread: 0.6 },
  "workflow-app": { tints: [[0.42, 0.3, 0.92], [0.66, 0.46, 1.0]], spread: -0.4 },
};

const COUNT = 60000;

// `active` false (a world covers the object) stops drawing after the fade, so
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
    // Per point: its index on the sphere and three random numbers (where it
    // drifts in the cloud, and how readily it falls into place). Shuffled
    // order, so drawing fewer points thins the sphere evenly.
    const idx = new Float32Array(COUNT), rnd = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) { idx[i] = i; rnd[i * 3] = Math.random(); rnd[i * 3 + 1] = Math.random(); rnd[i * 3 + 2] = Math.random(); }
    for (let i = COUNT - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]]; }
    const buffers = [["idx", idx, 1], ["rnd", rnd, 3]].map(([name, data, size]) => {
      const buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, data as Float32Array, gl.STATIC_DRAW);
      const at = gl.getAttribLocation(program, name as string);
      gl.enableVertexAttribArray(at);
      gl.vertexAttribPointer(at, size as number, gl.FLOAT, false, 0, 0);
      return buffer;
    });
    const u = (name: string) => gl.getUniformLocation(program, name);
    const uCount = u("count"), uTime = u("time"), uPointer = u("pointer"), uLens = u("lens"), uReach = u("reach"), uAspect = u("aspect"), uOrder = u("order"), uSpread = u("spread"), uLight = u("light"), uT0 = u("tint0"), uT1 = u("tint1");
    gl.uniform1f(uCount, COUNT);
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

    // pointer: the tilt (-1..1 over the window). cursor: where the mouse is
    // over the stage (-1..1, y up) and how engaged it is (eases in while the
    // mouse moves, out a while after it rests).
    const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
    const cursor = { x: 0.3, y: 0.3, tx: 0.3, ty: 0.3, press: 0, movedAt: -1e9 };
    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      pointer.tx = (event.clientX / window.innerWidth) * 2 - 1;
      pointer.ty = (event.clientY / window.innerHeight) * 2 - 1;
      const rect = el.getBoundingClientRect();
      cursor.tx = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      cursor.ty = 1 - ((event.clientY - rect.top) / rect.height) * 2;
      cursor.movedAt = performance.now();
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    const current = { tints: OBJECT_STATES.default.tints.map((c) => [...c]), spread: 0, light: lightTarget };
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
      current.spread += (target.spread - current.spread) * k;
      current.light += (lightTarget - current.light) * k;
      pointer.x += (pointer.tx - pointer.x) * (1 - Math.exp(-dt / 0.6));
      pointer.y += (pointer.ty - pointer.y) * (1 - Math.exp(-dt / 0.6));
      const follow = 1 - Math.exp(-dt / 0.15);
      cursor.x += (cursor.tx - cursor.x) * follow;
      cursor.y += (cursor.ty - cursor.y) * follow;
      const engaged = now - cursor.movedAt < 2500 ? 1 : 0;
      cursor.press += (engaged - cursor.press) * (1 - Math.exp(-dt / (engaged ? 0.2 : 1.2)));
      // At rest the lens circles the sphere on its own.
      const autoX = 0.1 * (height / width) + Math.cos(clock * 0.35) * 0.45 * (height / width) * 1.4;
      const autoY = 0.26 + Math.sin(clock * 0.35) * 0.4;
      gl.uniform1f(uTime, clock);
      gl.uniform2f(uPointer, pointer.x, pointer.y);
      gl.uniform2f(uLens, autoX + (cursor.x - autoX) * cursor.press, autoY + (cursor.y - autoY) * cursor.press);
      gl.uniform1f(uReach, 0.55 + 0.2 * cursor.press);
      gl.uniform1f(uAspect, width / height);
      gl.uniform1f(uOrder, 0.2);
      gl.uniform1f(uSpread, current.spread);
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
