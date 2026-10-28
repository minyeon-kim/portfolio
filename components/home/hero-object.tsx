"use client";

import { useEffect, useRef } from "react";

// The landing object: a glossy twisted loop, raymarched in a fragment shader
// (no model, no runtime). It turns slowly, tilts a little toward the cursor,
// and its rim light takes the hovered case's colour (smoothed). Rendering is
// capped at DPR 1, 1280px and 30fps, pauses offscreen, hidden or during the
// page transition, and is skipped entirely with reduced motion (CSS shows the
// static ambient light instead).
const vertex = `
attribute vec2 position;
void main() { gl_Position = vec4(position, 0.0, 1.0); }
`;

const fragment = `
precision highp float;
uniform vec2 resolution;
uniform vec2 pointer;
uniform float time;
uniform vec3 tintA;
uniform vec3 tintB;
uniform float energy;

mat2 rot(float a) { float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }

// A ring with a rounded-rectangle cross-section that twists twice around the
// ring and flexes gently, so it reads as one continuous folded band.
float band(vec3 p) {
  float ang = atan(p.z, p.x);
  float ring = length(p.xz) - 1.0;
  vec2 sec = vec2(ring, p.y + 0.14 * sin(ang * 3.0 + time * 0.35));
  sec = rot(ang * 2.0 + time * 0.2) * sec;
  vec2 d = abs(sec) - vec2(0.32, 0.085);
  return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0) - 0.06;
}
float map(vec3 p) {
  p.yz = rot(0.55 + pointer.y * 0.18) * p.yz;
  p.xz = rot(time * 0.16 - pointer.x * 0.22) * p.xz;
  p.xy = rot(-0.35) * p.xy;
  return band(p);
}
vec3 normalAt(vec3 p) {
  vec2 e = vec2(0.0015, 0.0);
  return normalize(vec3(map(p + e.xyy) - map(p - e.xyy), map(p + e.yxy) - map(p - e.yxy), map(p + e.yyx) - map(p - e.yyx)));
}
void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * resolution) / resolution.y;
  // Camera pulled back so the loop spans about 70% of the stage height.
  vec3 ro = vec3(0.0, 0.0, 7.4);
  vec3 rd = normalize(vec3(uv, -2.0));
  float t = 0.0; float hit = -1.0;
  for (int i = 0; i < 90; i++) {
    vec3 p = ro + rd * t;
    float d = map(p);
    if (d < 0.0012) { hit = t; break; }
    t += d * 0.9;
    if (t > 12.0) break;
  }
  if (hit < 0.0) { gl_FragColor = vec4(0.0); return; }
  vec3 p = ro + rd * hit;
  vec3 n = normalAt(p);
  vec3 v = -rd;
  float fres = pow(1.0 - max(dot(n, v), 0.0), 3.0);
  vec3 l1 = normalize(vec3(0.6, 0.8, 0.5));
  vec3 l2 = normalize(vec3(-0.7, -0.4, 0.6));
  float d1 = max(dot(n, l1), 0.0), d2 = max(dot(n, l2), 0.0);
  float s1 = pow(max(dot(reflect(-l1, n), v), 0.0), 48.0);
  float s2 = pow(max(dot(reflect(-l2, n), v), 0.0), 28.0);
  vec3 base = vec3(0.045, 0.05, 0.06);
  vec3 col = base
    + tintA * (d1 * 0.22 + s1 * 0.9)
    + tintB * (d2 * 0.28 + s2 * 0.6)
    + mix(tintA, tintB, 0.5) * fres * (0.55 + energy * 0.3)
    + vec3(0.9, 0.93, 1.0) * s1 * 0.35;
  float edge = smoothstep(0.0, 0.004, 0.004);
  gl_FragColor = vec4(col, 1.0) * edge;
}
`;

export const OBJECT_TINTS: Record<string, [number[], number[]]> = {
  default: [[0.36, 0.5, 0.95], [0.6, 0.45, 0.9]],
  "gemini-privacy": [[0.26, 0.52, 0.96], [0.65, 0.55, 0.98]],
  "workflow-app": [[0.45, 0.33, 0.9], [0.7, 0.58, 1.0]],
};

export function HeroObject({ variant = "default", active = false, className }: { variant?: string; active?: boolean; className?: string }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const state = useRef({ variant, active });
  useEffect(() => { state.current = { variant, active }; }, [variant, active]);

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
    const uRes = u("resolution"), uPointer = u("pointer"), uTime = u("time"), uA = u("tintA"), uB = u("tintB"), uEnergy = u("energy");

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

    const tint = { a: [...OBJECT_TINTS.default[0]], b: [...OBJECT_TINTS.default[1]], energy: 0 };
    let visible = true;
    const io = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }, { threshold: 0 });
    io.observe(el);

    let frame = 0, last = performance.now(), clock = 0, lastDraw = 0;
    const draw = (now: number) => {
      frame = requestAnimationFrame(draw);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const paused = !visible || document.hidden || document.documentElement.hasAttribute("data-project-navigation");
      if (paused) return;
      if (now - lastDraw < 1000 / 30) return;
      lastDraw = now;
      clock += dt;
      const target = OBJECT_TINTS[state.current.variant] ?? OBJECT_TINTS.default;
      const k = 1 - Math.exp(-dt / 0.4);
      for (let i = 0; i < 3; i++) { tint.a[i] += (target[0][i] - tint.a[i]) * k; tint.b[i] += (target[1][i] - tint.b[i]) * k; }
      tint.energy += ((state.current.active ? 1 : 0) - tint.energy) * k;
      pointer.x += (pointer.tx - pointer.x) * (1 - Math.exp(-dt / 0.6));
      pointer.y += (pointer.ty - pointer.y) * (1 - Math.exp(-dt / 0.6));
      gl.uniform2f(uRes, width, height);
      gl.uniform2f(uPointer, pointer.x, pointer.y);
      gl.uniform1f(uTime, clock);
      gl.uniform3f(uA, tint.a[0], tint.a[1], tint.a[2]);
      gl.uniform3f(uB, tint.b[0], tint.b[1], tint.b[2]);
      gl.uniform1f(uEnergy, tint.energy);
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
      // Not loseContext(): React's dev StrictMode re-runs the effect on the same
      // canvas, and a lost context cannot compile shaders again.
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
    };
  }, []);

  return <canvas ref={canvas} className={className} aria-hidden="true" />;
}
