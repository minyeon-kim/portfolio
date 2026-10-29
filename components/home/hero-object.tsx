"use client";

import { useEffect, useRef } from "react";

// The landing backdrop, after particle-love.com: about 65,000 points of
// light drifting like dust in a slow swirling flow, gathering in faint
// threads, across the whole stage. A quick flick of the mouse sets off a
// burst: a ring that throws the dust outward like a firework (and decodes the
// headline's letters as it passes them, see ScrambleHeadline). Slow pools of light drift over it, so the
// dust glows in places and sinks into the dark elsewhere. Moving the mouse
// sweeps a wide swathe of dust along and stirs it into wisps that brighten,
// then it settles again. Each state leans the dust, loosely,
// toward a hint of its own form, never a hard shape:
// - default: a spiral galaxy, slowly turning
// - Gemini privacy revamp, blue: the Gemini sparkle
// - Devsign, purple: the Devsign bolt, purple with a cyan edge
// - About me, teal: a rolling landscape of dots under falling data
// A GPU simulation (WebGL 2, positions and velocities in float textures);
// DPR 1, paused offscreen, hidden or during the page transition, skipped
// with reduced motion or without float render targets (CSS shows the static
// ambient light instead).

const SIZE = 320; // 102,400 points

const quadVertex = `#version 300 es
in vec2 a; out vec2 v;
void main() { v = a * 0.5 + 0.5; gl_Position = vec4(a, 0.0, 1.0); }`;

const common = `
uniform float time;
uniform float symbol;
uniform float SIZE;
uniform float focus;  // 0 at rest, 1 while a case is hovered: the form gathers tighter
float h1(float n) { return fract(sin(n) * 43758.5453); }
// The Devsign bolt, as in its logo: a thick bolt in two slanted slabs.
const vec2 BOLT[9] = vec2[9](vec2(140.0, 0.0), vec2(565.0, 0.0), vec2(470.0, 215.0), vec2(660.0, 230.0), vec2(340.0, 625.0), vec2(325.0, 440.0), vec2(125.0, 415.0), vec2(235.0, 215.0), vec2(0.0, 205.0));
vec2 boltPoint(vec2 v) { return vec2((v.x - 330.0) * 0.75, 312.0 - v.y) * (1.7 / 625.0); }
bool inBolt(vec2 q) {
  bool inside = false;
  for (int i = 0, j = 8; i < 9; j = i++) {
    vec2 a = boltPoint(BOLT[i]), b = boltPoint(BOLT[j]);
    if ((a.y > q.y) != (b.y > q.y) && q.x < (b.x - a.x) * (q.y - a.y) / (b.y - a.y) + a.x) inside = !inside;
  }
  return inside;
}
// Where each particle leans: a loose cloud with a wide halo of dust.
vec3 homeOf(vec2 uv) {
  float n = floor(uv.x * SIZE) + floor(uv.y * SIZE) * SIZE;
  float a = h1(n * 1.17), b = h1(n * 2.31), c = h1(n * 3.77), g = h1(n * 5.13);
  vec3 j = vec3(h1(n * 7.1), h1(n * 8.3), h1(n * 9.7)) - 0.5;
  vec3 p; float loose = mix(0.4, 4.2, pow(g, 1.2));
  if (symbol > 2.5) {
    // A landscape of dots, seen low from the front: a regular grid rolling
    // into slow waves, rising into ridges at the sides, with faint streams
    // of data falling behind it.
    if (a < 0.82) {
      vec2 gp = (floor(uv * SIZE) + 0.5) / SIZE;
      float x = (gp.x - 0.5) * 6.4, z = (gp.y - 0.5) * 4.0 - 0.9;
      float ridge = smoothstep(0.8, 3.0, abs(x)) * (0.55 + 0.45 * sin(x * 2.3 + z * 1.7));
      float y = 0.16 * sin(x * 1.4 + time * 0.35) * cos(z * 1.9 - time * 0.25) + 0.08 * sin(x * 4.1 + z * 3.3 + time * 0.5) + ridge * 0.75;
      p = vec3(x, y - 0.8, z);
      loose *= 0.06;
    } else {
      float col = floor(b * 46.0);
      p = vec3((col / 46.0 - 0.5) * 6.0, mix(-0.9, 1.5, fract(c + time * 0.03 * (0.5 + h1(col)))), -2.2 + h1(col * 3.1) * 0.8);
      loose *= 0.08;
    }
  } else if (symbol > 1.5) {
    // The Devsign bolt, loosely: its outline a little denser than its body,
    // both spreading softly like the Gemini sparkle;
    // set above the title, clear of the project window on the right.
    vec2 q;
    if (a < 0.3) {
      float e = b * 9.0, k = floor(e);
      int ki = int(k);
      q = mix(boltPoint(BOLT[ki]), boltPoint(BOLT[(ki + 1) % 9]), fract(e));
      loose *= 0.5;
    } else {
      q = vec2(0.0, 0.1);
      for (int t = 0; t < 10; t++) {
        vec2 r = (vec2(h1(n * 3.1 + float(t) * 1.7), h1(n * 5.9 + float(t) * 2.3)) - 0.5) * vec2(1.4, 1.75);
        if (inBolt(r)) { q = r; break; }
      }
      loose *= 0.75;
    }
    p = vec3(q + vec2(-0.6, 0.42), (h1(n * 4.4) - 0.5) * 0.2);
  } else if (symbol > 0.5) {
    // The Gemini sparkle: a four-point star with concave sides, its edge
    // drawn densely and its body filled more lightly.
    float t = b * 6.2831853;
    vec2 dir = vec2(cos(t), sin(t));
    float r = 1.2 / pow(pow(abs(dir.x), 0.5) + pow(abs(dir.y), 0.5), 2.0);
    float fill = a < 0.45 ? 1.0 : sqrt(c);
    p = vec3(dir * r * fill * 1.1, (h1(n * 4.4) - 0.5) * 0.2);
    loose *= a < 0.45 ? 0.45 : 0.7;
  } else {
    // A spiral galaxy seen at a slant, loosely: a bright core and two arms
    // winding out through a wide haze, turning slowly.
    vec2 q;
    if (a < 0.14) {
      q = (vec2(b, c) - 0.5) * 0.55 * sqrt(h1(n * 6.1));
    } else {
      float r = 0.18 + pow((a - 0.14) / 0.86, 0.8) * 2.0;
      float t = floor(b * 2.0) * 3.14159 + r * 2.3 + time * 0.02 + (c - 0.5) * 0.9;
      q = vec2(cos(t), sin(t)) * r;
    }
    q.y *= 0.42;
    float ct = cos(0.38), st = sin(0.38);
    q = vec2(ct * q.x - st * q.y, st * q.x + ct * q.y);
    p = vec3(q * 1.1, (h1(n * 4.4) - 0.5) * 0.3);
    loose *= 0.85;
  }
  // While a case is hovered, most of the dust draws in so the form shows;
  // the widest third stays out as haze.
  loose *= mix(1.0, mix(0.22, 1.0, step(0.66, g)), focus);
  return p * 1.6 + j * loose * vec3(1.6, 1.35, 1.0) + vec3(0.35, mix(-0.05, 0.12, focus), 0.0);
}
// A swirling, divergence-free flow (ABC flow, two octaves).
vec3 flow(vec3 p) {
  float t = time * 0.15;
  vec3 v = vec3(sin(p.z * 1.3 + t) + cos(p.y * 1.1 - t), sin(p.x * 1.2 + t * 1.2) + cos(p.z * 1.4), sin(p.y * 1.5 - t) + cos(p.x * 1.3 + t));
  p *= 2.3;
  return v + 0.5 * vec3(sin(p.z + t * 2.0) + cos(p.y), sin(p.x - t) + cos(p.z + t), sin(p.y + t) + cos(p.x));
}
// A slowly shifting landscape the dust slides into: its valleys make threads.
float field(vec3 p) {
  float t = time * 0.1;
  return sin(p.x * 1.6 + sin(p.y * 1.3 + t)) * cos(p.y * 1.4 - sin(p.z * 1.1 - t)) + 0.5 * sin(p.z * 2.1 + p.x * 0.9 + t * 1.5);
}
vec3 valley(vec3 p) {
  vec2 e = vec2(0.02, 0.0);
  return -vec3(field(p + e.xyy) - field(p - e.xyy), field(p + e.yxy) - field(p - e.yxy), field(p + e.yyx) - field(p - e.yyx)) / (2.0 * e.x);
}`;

const initFragment = `#version 300 es
precision highp float; in vec2 v; out vec4 o;
${common}
uniform float which;
void main() {
  vec3 jitter = vec3(h1(v.x * 91.0 + v.y * 17.0), h1(v.y * 53.0 + v.x * 7.0), h1(v.x * v.y * 31.0)) - 0.5;
  o = which < 0.5 ? vec4(homeOf(v) + jitter * 2.5, 1.0) : vec4(0.0);
}`;

const velocityFragment = `#version 300 es
precision highp float; in vec2 v; out vec4 o;
${common}
uniform sampler2D pos; uniform sampler2D vel; uniform float dt;
uniform vec2 mouse; uniform vec2 mouseVel; uniform float aspect; uniform float gather; uniform float stir;
uniform vec2 burstAt; uniform float burstAge; uniform float burstPower;
void main() {
  vec3 p = texture(pos, v).xyz, u = texture(vel, v).xyz;
  u += (homeOf(v) - p) * mix(gather, gather * 3.0, focus) * dt;
  u += flow(p * 0.8) * 0.45 * stir * dt;
  u += valley(p * 0.9) * 0.6 * stir * dt;
  // The cursor sweeps nearby dust along its motion and swirls it.
  vec2 s = p.xy * 1.7 / (5.0 - p.z); s.x /= aspect;
  vec2 d = (s - mouse) * vec2(aspect, 1.0);
  float k = exp(-dot(d, d) / 0.16);
  vec2 mv = mouseVel / max(dt, 1e-3);
  u.xy += (mv * 1.0 + vec2(-d.y, d.x) * length(mv) * 4.0 + normalize(d + 1e-4) * length(mv) * 1.2) * k * dt * 2.0;
  // A burst: a ring expanding from where the mouse flicked, throwing the dust
  // outward like a firework; the ring weakens as it grows.
  vec2 bd = (s - burstAt) * vec2(aspect, 1.0);
  float bl = length(bd), ring = burstAge * 1.4;
  float bw = exp(-(bl - ring) * (bl - ring) / 0.012) * burstPower * exp(-burstAge * 1.6);
  float jitter = h1(v.x * 37.0 + v.y * 91.0);
  u.xy += normalize(bd + 1e-4) * bw * (2.6 + 4.0 * jitter) * dt * 10.0;
  u.z += (jitter - 0.5) * bw * 20.0 * dt;
  u *= exp(-dt * 0.9);
  o = vec4(u, 1.0);
}`;

const positionFragment = `#version 300 es
precision highp float; in vec2 v; out vec4 o;
uniform sampler2D pos; uniform sampler2D vel; uniform float dt;
void main() { o = vec4(texture(pos, v).xyz + texture(vel, v).xyz * dt, 1.0); }`;

const pools = `
// Two or three wide pools of light drifting slowly over the stage: the dust
// inside them glows, the rest sinks into the dark.
float pools(vec2 s, float aspect, float time) {
  vec2 a = vec2(0.45 + 0.35 * sin(time * 0.05), 0.25 + 0.25 * cos(time * 0.07));
  vec2 b = vec2(-0.55 + 0.3 * cos(time * 0.04 + 1.0), -0.35 + 0.3 * sin(time * 0.06));
  vec2 c = vec2(0.1 + 0.5 * sin(time * 0.03 + 2.0), 0.65 + 0.2 * cos(time * 0.05));
  vec2 q = vec2(aspect, 1.0);
  return 0.25 + 1.3 * exp(-dot((s - a) * q, (s - a) * q) / 0.35) + 0.9 * exp(-dot((s - b) * q, (s - b) * q) / 0.25) + 0.6 * exp(-dot((s - c) * q, (s - c) * q) / 0.2);
}`;

const drawVertex = `#version 300 es
precision highp float;
uniform sampler2D pos; uniform sampler2D vel; uniform float SIZE; uniform float aspect; uniform float symbol; uniform float time; uniform vec2 mouse; uniform float spectrum; uniform float bolt; uniform float light;
out vec3 vTint; out float vSpec; out float vSpeed; out float vDepth; out float vSeed; out float vStar; out float vLight; out float vSize; out float vFaint;
${pools}
void main() {
  float i = float(gl_VertexID);
  vec2 uv = (vec2(mod(i, SIZE), floor(i / SIZE)) + 0.5) / SIZE;
  vec3 p = texture(pos, uv).xyz, u = texture(vel, uv).xyz;
  vec2 s = p.xy * 1.7 / (5.0 - p.z); s.x /= aspect;
  gl_Position = vec4(s, 0.0, 1.0);
  vSpeed = length(u);
  // Gemini: the sparkle takes the logo's colours, blue at its heart and
  // warmer towards its points (coral up, yellow left, green down).
  vec2 g = p.xy - vec2(0.35, 0.12);
  float ga = atan(g.y, g.x);
  vec3 tips = vec3(0.26, 0.52, 1.0) * max(cos(ga), 0.0) + vec3(1.0, 0.42, 0.4) * max(sin(ga), 0.0)
    + vec3(1.0, 0.8, 0.25) * max(-cos(ga), 0.0) + vec3(0.2, 0.8, 0.5) * max(-sin(ga), 0.0);
  tips /= max(abs(cos(ga)) + abs(sin(ga)), 1e-3);
  vTint = tips;
  vSpec = spectrum * smoothstep(0.1, 1.0, length(g));
  // Devsign: the logo's violet, cyan along the lower right, and a soft
  // white sheen across the upper slab.
  vec2 d = (p.xy - vec2(0.35, 0.12)) / 1.6 - vec2(-0.6, 0.42);
  float cyan = smoothstep(0.25, 0.55, dot(d, normalize(vec2(1.0, -0.7))));
  float sheen = exp(-pow(dot(d - vec2(-0.25, 0.35), normalize(vec2(0.3, 1.0))) / 0.08, 2.0)) * 0.6;
  vec3 boltTint = mix(mix(vec3(0.56, 0.28, 1.0), vec3(0.3, 0.8, 1.0), cyan), vec3(0.95, 0.9, 1.0), sheen);
  vTint = mix(vTint, boltTint, bolt);
  vSpec = mix(vSpec, 0.85, bolt);
  vDepth = clamp((p.z + 2.0) / 4.0, 0.0, 1.0);
  vSeed = fract(sin(i * 12.9898) * 43758.5453);
  float cat = fract(sin(i * 1.17) * 43758.5453);
  vStar = symbol > 0.5 && symbol < 1.5 && cat < 0.45 ? 0.3 : (symbol > 1.5 && symbol < 2.5 && cat < 0.3 ? 0.3 : (symbol > 2.5 && cat >= 0.82 ? 0.3 : 0.0));
  vLight = pools(s, aspect, time) + 0.9 * exp(-dot((s - mouse) * vec2(aspect, 1.0), (s - mouse) * vec2(aspect, 1.0)) / 0.12);
  // The About landscape spans the whole stage, so it carries its own light.
  if (symbol > 2.5) vLight = max(vLight, 0.85);
  // Twinkle: every point breathes a little; a few flare now and then.
  float phase = time * (0.6 + 1.8 * vSeed) + vSeed * 40.0;
  float flare = pow(max(sin(phase), 0.0), 16.0) * step(0.75, fract(vSeed * 7.7));
  vLight *= 0.7 + 0.3 * sin(phase * 1.7);
  // Most of it is fine dust, faint on its own so that only where it gathers
  // does it add up into a milky haze; a few in a hundred are stars, and only
  // those flare.
  float star = step(0.965, fract(vSeed * 13.1));
  vSize = flare * star;
  float size = mix(mix(1.0, 1.4, vDepth), mix(1.5, 2.1, vDepth), star) * (1.0 + 0.2 * vStar);
  vFaint = mix(1.15, 1.5, star);
  // Light theme: ink on a pale page needs a little more body to read.
  gl_PointSize = size * mix(1.0, 1.4, light) + vSize * 3.0;
}`;

const drawFragment = `#version 300 es
precision highp float;
in vec3 vTint; in float vSpec; in float vSpeed; in float vDepth; in float vSeed; in float vStar; in float vLight; in float vSize; in float vFaint; out vec4 o;
uniform vec3 calm; uniform vec3 fast; uniform vec3 accent; uniform float light;
void main() {
  vec2 q = gl_PointCoord - 0.5;
  // A soft core; a flaring star shows a faint four-point glint.
  float core = smoothstep(0.5, 0.0, length(q) * mix(1.0, 3.0, vSize));
  float rays = 0.5 * vSize * (exp(-abs(q.x) * 60.0) + exp(-abs(q.y) * 60.0)) * smoothstep(0.5, 0.1, length(q));
  float a = min(core + rays, 1.0) * vFaint;
  float e = smoothstep(0.25, 1.6, vSpeed);
  vec3 c = mix(mix(calm, accent, smoothstep(0.55, 0.95, vSeed)), fast, max(max(e, step(0.94, vSeed) * 0.6), vStar));
  c = mix(c, vTint * mix(1.3, 1.5, e), vSpec);
  float alpha = a * (0.7 + 0.6 * e + 0.4 * vStar + 1.5 * vSize) * (0.6 + 0.4 * vDepth) * vLight;
  c = mix(c, vec3(1.0), 0.6 * vSize);
  // Light theme: the dust is ink over the page rather than light.
  c = mix(c, pow(c, vec3(1.7)) * 0.95, light);
  alpha *= mix(1.0, 2.8, light);
  o = vec4(c * alpha, alpha);
}`;

// The pools' own soft light on the room behind the dust.
const glowFragment = `#version 300 es
precision highp float; in vec2 v; out vec4 o;
uniform float aspect; uniform float time; uniform vec3 calm; uniform vec3 accent; uniform vec3 fast; uniform float light;
${pools}
void main() {
  vec2 s = v * 2.0 - 1.0;
  float l = max(pools(s, aspect, time) - 0.25, 0.0);
  vec3 c = mix(calm, accent, 0.5 + 0.5 * s.x) * l * 0.07 * (1.0 - light);
  // A wide diagonal band of soft light, lower left to upper right, drifting
  // slowly: the room's own gradient behind the dust.
  vec2 q = vec2(s.x * aspect, s.y);
  float across = dot(q, normalize(vec2(-0.55, 1.0))) + 0.25 * sin(time * 0.05) + 0.15 * sin(q.x * 0.8 + time * 0.07);
  float band = exp(-across * across * 1.6);
  float edge = exp(-pow(across - 0.55, 2.0) * 9.0);
  vec3 deep = calm * vec3(0.9, 0.7, 1.15);
  c += (mix(deep, mix(calm, fast, 0.25), 0.5 + 0.5 * sin(q.x * 0.6 + time * 0.04)) * band * 0.3 + deep * edge * 0.08) * (1.0 - light);
  // Light theme: the same band as a faint tinted haze over the page.
  float haze = (band * 0.08 + l * 0.04) * light;
  o = vec4(c + mix(calm, accent, 0.5 + 0.5 * s.x) * 0.55 * haze, haze);
}`;

// Per state: which form the dust leans to, and its colours (calm, stirred,
// accent).
export const OBJECT_STATES: Record<string, { symbol: number; calm: number[]; fast: number[]; accent: number[] }> = {
  default: { symbol: 0, calm: [0.42, 0.46, 0.85], fast: [1.0, 0.75, 0.88], accent: [0.5, 0.85, 0.9] },
  "gemini-privacy": { symbol: 1, calm: [0.25, 0.45, 1.0], fast: [0.85, 0.92, 1.0], accent: [0.42, 0.72, 1.0] },
  "workflow-app": { symbol: 2, calm: [0.5, 0.3, 0.95], fast: [1.0, 0.75, 0.95], accent: [0.85, 0.45, 0.95] },
  about: { symbol: 3, calm: [0.15, 0.72, 0.64], fast: [0.75, 1.0, 0.9], accent: [0.3, 0.9, 0.8] },
};

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
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const gl = el.getContext("webgl2", { alpha: true, antialias: false, premultipliedAlpha: true, powerPreference: "high-performance" });
    if (!gl || !gl.getExtension("EXT_color_buffer_float")) return;
    const compile = (type: number, src: string) => { const s = gl.createShader(type)!; gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) console.error("hero-object shader", gl.getShaderInfoLog(s)); return s; };
    const link = (v: string, f: string) => {
      const p = gl.createProgram()!;
      gl.attachShader(p, compile(gl.VERTEX_SHADER, v));
      gl.attachShader(p, compile(gl.FRAGMENT_SHADER, f));
      gl.linkProgram(p);
      if (!gl.getProgramParameter(p, gl.LINK_STATUS)) console.error("hero-object", gl.getProgramInfoLog(p));
      return p;
    };
    const pInit = link(quadVertex, initFragment), pVel = link(quadVertex, velocityFragment), pPos = link(quadVertex, positionFragment), pDraw = link(drawVertex, drawFragment), pGlow = link(quadVertex, glowFragment);
    const quad = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const vaoQuad = gl.createVertexArray();
    gl.bindVertexArray(vaoQuad);
    for (const p of [pInit, pVel, pPos, pGlow]) { const at = gl.getAttribLocation(p, "a"); gl.enableVertexAttribArray(at); gl.vertexAttribPointer(at, 2, gl.FLOAT, false, 0, 0); }
    const vaoDraw = gl.createVertexArray();
    // Positions and velocities, two of each to read one and write the other.
    const target = () => {
      const texture = gl.createTexture()!;
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, SIZE, SIZE, 0, gl.RGBA, gl.FLOAT, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      const framebuffer = gl.createFramebuffer()!;
      gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
      return { texture, framebuffer };
    };
    const P = [target(), target()], V = [target(), target()];
    const uniform = (p: WebGLProgram, name: string) => gl.getUniformLocation(p, name);
    const pass = (p: WebGLProgram, to: { framebuffer: WebGLFramebuffer }, setup: () => void) => {
      gl.useProgram(p);
      gl.bindVertexArray(vaoQuad);
      gl.bindFramebuffer(gl.FRAMEBUFFER, to.framebuffer);
      gl.viewport(0, 0, SIZE, SIZE);
      gl.disable(gl.BLEND);
      setup();
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };
    const bind = (p: WebGLProgram, name: string, unit: number, texture: WebGLTexture) => { gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, texture); gl.uniform1i(uniform(p, name), unit); };
    const start = OBJECT_STATES[state.current] ?? OBJECT_STATES.default;
    [P[0], V[0]].forEach((to, which) => pass(pInit, to, () => { gl.uniform1f(uniform(pInit, "which"), which); gl.uniform1f(uniform(pInit, "SIZE"), SIZE); gl.uniform1f(uniform(pInit, "symbol"), start.symbol); }));

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
    };
    const observer = new ResizeObserver(resize);
    observer.observe(el);
    resize();

    // The mouse over the stage (-1..1, y up) and where it was last frame.
    const mouse = { x: 9, y: 9, px: 9, py: 9, cx: 0, cy: 0 };
    // The last burst: where (clip space), when, how strong.
    const burst = { x: 0, y: 0, at: -1e9, power: 0 };
    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      const rect = el.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = 1 - ((event.clientY - rect.top) / rect.height) * 2;
      mouse.cx = event.clientX; mouse.cy = event.clientY;
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    const colours = { calm: [...start.calm], fast: [...start.fast], accent: [...start.accent], light: lightTarget, focus: 0, spectrum: 0, bolt: 0 };
    let visible = true;
    const io = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }, { threshold: 0 });
    io.observe(el);

    let frame = 0, last = performance.now(), clock = 0;
    const draw = (now: number) => {
      frame = requestAnimationFrame(draw);
      const dt = Math.min(1 / 30, (now - last) / 1000);
      last = now;
      const covered = !running.current && idleSince.current !== null && now - idleSince.current > 800;
      if (!visible || document.hidden || covered || document.documentElement.hasAttribute("data-project-navigation")) { mouse.px = mouse.x; mouse.py = mouse.y; return; }
      clock += dt;
      const target = OBJECT_STATES[state.current] ?? OBJECT_STATES.default;
      const k = 1 - Math.exp(-dt / 0.5);
      (["calm", "fast", "accent"] as const).forEach((key) => { for (let i = 0; i < 3; i++) colours[key][i] += (target[key][i] - colours[key][i]) * k; });
      colours.light += (lightTarget - colours.light) * k;
      colours.spectrum += ((target.symbol === 1 ? 1 : 0) - colours.spectrum) * k;
      colours.bolt += ((target.symbol === 2 ? 1 : 0) - colours.bolt) * k;
      colours.focus += ((target.symbol > 0 ? 1 : 0) - colours.focus) * (1 - Math.exp(-dt / 0.6));
      // A jump (the mouse entering the stage) is not a sweep.
      let vx = mouse.x - mouse.px, vy = mouse.y - mouse.py;
      if (Math.hypot(vx, vy) > 0.3) { vx = 0; vy = 0; }
      mouse.px = mouse.x; mouse.py = mouse.y;
      // A quick flick sets off a burst (at most every 0.7s), and tells the
      // headline so its letters decode as the ring passes them.
      const speed = Math.hypot(vx, vy) / Math.max(dt, 1e-3);
      if (speed > 2.8 && clock - burst.at > 0.7) {
        Object.assign(burst, { x: mouse.x, y: mouse.y, at: clock, power: Math.min(1.2, speed / 4) });
        window.dispatchEvent(new CustomEvent("hero-burst", { detail: { x: mouse.cx, y: mouse.cy, pxPerSecond: (1.4 * height) / 2, power: burst.power } }));
      }

      pass(pVel, V[1], () => {
        bind(pVel, "pos", 0, P[0].texture); bind(pVel, "vel", 1, V[0].texture);
        gl.uniform1f(uniform(pVel, "dt"), dt); gl.uniform1f(uniform(pVel, "time"), clock); gl.uniform1f(uniform(pVel, "symbol"), target.symbol); gl.uniform1f(uniform(pVel, "SIZE"), SIZE);
        gl.uniform2f(uniform(pVel, "mouse"), mouse.x, mouse.y); gl.uniform2f(uniform(pVel, "mouseVel"), vx, vy); gl.uniform1f(uniform(pVel, "aspect"), width / height);
        gl.uniform2f(uniform(pVel, "burstAt"), burst.x, burst.y); gl.uniform1f(uniform(pVel, "burstAge"), clock - burst.at); gl.uniform1f(uniform(pVel, "burstPower"), burst.power);
        gl.uniform1f(uniform(pVel, "gather"), 0.8); gl.uniform1f(uniform(pVel, "focus"), colours.focus); gl.uniform1f(uniform(pVel, "stir"), 0.65);
      });
      V.reverse();
      pass(pPos, P[1], () => { bind(pPos, "pos", 0, P[0].texture); bind(pPos, "vel", 1, V[0].texture); gl.uniform1f(uniform(pPos, "dt"), dt); });
      P.reverse();

      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, width, height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE);
      gl.useProgram(pGlow);
      gl.bindVertexArray(vaoQuad);
      gl.uniform1f(uniform(pGlow, "aspect"), width / height); gl.uniform1f(uniform(pGlow, "time"), clock); gl.uniform1f(uniform(pGlow, "light"), colours.light);
      gl.uniform3fv(uniform(pGlow, "calm"), colours.calm); gl.uniform3fv(uniform(pGlow, "accent"), colours.accent); gl.uniform3fv(uniform(pGlow, "fast"), colours.fast);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      gl.useProgram(pDraw);
      gl.bindVertexArray(vaoDraw);
      // Dark: the dust adds up into light. Light: it lies over the page.
      if (colours.light < 0.5) gl.blendFunc(gl.ONE, gl.ONE); else gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      bind(pDraw, "pos", 0, P[0].texture); bind(pDraw, "vel", 1, V[0].texture);
      gl.uniform1f(uniform(pDraw, "SIZE"), SIZE); gl.uniform1f(uniform(pDraw, "aspect"), width / height); gl.uniform1f(uniform(pDraw, "symbol"), target.symbol);
      gl.uniform1f(uniform(pDraw, "time"), clock); gl.uniform2f(uniform(pDraw, "mouse"), mouse.x, mouse.y);
      gl.uniform3fv(uniform(pDraw, "calm"), colours.calm); gl.uniform3fv(uniform(pDraw, "fast"), colours.fast); gl.uniform3fv(uniform(pDraw, "accent"), colours.accent);
      gl.uniform1f(uniform(pDraw, "light"), colours.light);
      gl.uniform1f(uniform(pDraw, "spectrum"), colours.spectrum);
      gl.uniform1f(uniform(pDraw, "bolt"), colours.bolt);
      gl.drawArrays(gl.POINTS, 0, SIZE * SIZE);
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
      [...P, ...V].forEach(({ texture, framebuffer }) => { gl.deleteTexture(texture); gl.deleteFramebuffer(framebuffer); });
      [pInit, pVel, pPos, pDraw, pGlow].forEach((p) => gl.deleteProgram(p));
      gl.deleteBuffer(quad);
    };
  }, []);

  return <canvas ref={canvas} className={className} aria-hidden="true" />;
}
