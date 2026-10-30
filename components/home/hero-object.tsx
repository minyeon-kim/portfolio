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
// - default: a round galaxy, a bright core in a soft disc, slowly turning
// - Gemini privacy revamp, blue: the Gemini sparkle
// - Devsign, purple: the Devsign bolt, purple with a cyan edge
// - About me, teal: a rolling landscape of dots under falling data
// A GPU simulation (WebGL 2, positions and velocities in float textures);
// drawn at the screen's own resolution (DPR up to 2) so the finest dust is a
// device pixel; 46,656 points on desktop, 22,500 on phones (sparse, after
// byotone.com); paused offscreen, hidden or during the page transition, skipped
// with reduced motion or without float render targets (CSS shows the static
// ambient light instead).


const quadVertex = `#version 300 es
in vec2 a; out vec2 v;
void main() { v = a * 0.5 + 0.5; gl_Position = vec4(a, 0.0, 1.0); }`;

const common = `
uniform float time;
uniform float symbol;
uniform float SIZE;
uniform float lightTheme;  // 1 in the light theme
uniform float focus;  // 0.85 on the landing galaxy, 1 while a case is hovered: the form gathers tighter
float h1(float n) { return fract(sin(n) * 43758.5453); }
// An integer hash (PCG): sin() above loses precision for large n, which
// leaves visible spokes when many points share an angle.
float hq(float n, uint k) {
  uint v = uint(n) * 747796405u + k * 2891336453u;
  v = ((v >> ((v >> 28u) + 4u)) ^ v) * 277803737u;
  v = (v >> 22u) ^ v;
  return float(v) / 4294967295.0;
}
// The Devsign bolt, as in its logo: a thick bolt in two slanted slabs.
// Traced from the Devsign logo (659×625): an upper slab leaning right, a
// notch each side where it steps over, and a lower slab tapering to a point.
const vec2 BOLT[9] = vec2[9](vec2(140.0, 0.0), vec2(565.0, 0.0), vec2(460.0, 205.0), vec2(660.0, 225.0), vec2(340.0, 625.0), vec2(325.0, 440.0), vec2(125.0, 415.0), vec2(240.0, 220.0), vec2(0.0, 205.0));
// Sheared so the bolt leans like a slash (top to the right), not upright.
vec2 boltPoint(vec2 v) { vec2 q = vec2((v.x - 330.0) * 0.8, 312.0 - v.y) * (1.6 / 625.0); return vec2(q.x + q.y * 0.45, q.y); }
bool inBolt(vec2 q) {
  bool inside = false;
  for (int i = 0, j = 8; i < 9; j = i++) {
    vec2 a = boltPoint(BOLT[i]), b = boltPoint(BOLT[j]);
    if ((a.y > q.y) != (b.y > q.y) && q.x < (b.x - a.x) * (q.y - a.y) / (b.y - a.y) + a.x) inside = !inside;
  }
  return inside;
}
// Where point n of the form leans: the form, with a wide halo of dust.
vec3 formOf(float n, vec2 uv) {
  float a = hq(n, 1u), b = hq(n, 2u), c = hq(n, 3u), g = hq(n, 4u);
  vec3 j = vec3(hq(n, 5u), hq(n, 6u), hq(n, 7u)) - 0.5;
  vec3 p; float loose = mix(0.4, 4.2, pow(g, 1.2));
  if (symbol > 2.5) {
    // A landscape of dots, seen low from the front: a regular grid rolling
    // into slow waves, rising into ridges at the sides, with faint, loose
    // streams of data falling behind it.
    if (a < 0.82) {
      vec2 gp = (floor(uv * SIZE) + 0.5) / SIZE;
      float x = (gp.x - 0.5) * 6.4, z = (gp.y - 0.5) * 4.0 - 0.9;
      float ridge = smoothstep(0.8, 3.0, abs(x)) * (0.55 + 0.45 * sin(x * 2.3 + z * 1.7));
      float y = 0.16 * sin(x * 1.4 + time * 0.35) * cos(z * 1.9 - time * 0.25) + 0.08 * sin(x * 4.1 + z * 3.3 + time * 0.5) + ridge * 0.75;
      p = vec3(x, y - 0.8, z);
      loose *= 0.06;
    } else {
      float col = floor(b * 46.0);
      p = vec3((col / 46.0 - 0.5) * 6.0 + (h1(n * 6.1) - 0.5) * 0.35, mix(-0.9, 1.5, fract(c + time * 0.03 * (0.5 + h1(col)))), -2.2 + h1(col * 3.1) * 0.8);
      loose *= 0.6;
    }
  } else if (symbol > 1.5) {
    // The Devsign bolt, loosely: its outline a little denser than its body,
    // both spreading softly like the Gemini sparkle;
    // set above the title, clear of the project window on the right.
    vec2 q;
    if (a < 0.1) {
      float e = b * 9.0, k = floor(e);
      int ki = int(k);
      q = mix(boltPoint(BOLT[ki]), boltPoint(BOLT[(ki + 1) % 9]), fract(e));
      loose *= 0.45;
    } else {
      q = vec2(0.0, 0.1);
      for (int t = 0; t < 16; t++) {
        vec2 r = vec2(mix(-0.56, 0.85, hq(n, 20u + uint(t) * 2u)), mix(-0.81, 0.81, hq(n, 21u + uint(t) * 2u)));
        if (inBolt(r)) { q = r; break; }
      }
      loose *= 0.3;
    }
    // Top left, clear of the title below and the project card on the right.
    p = vec3(q + vec2(-1.75, 0.75), (hq(n, 17u) - 0.5) * 0.2);
  } else if (symbol > 0.5) {
    // The Gemini sparkle: a four-point star with concave sides, filled with a
    // thick band of dust inside its edge rather than a thin outline, so its
    // arms read as solid strokes.
    float t = b * 6.2831853;
    vec2 dir = vec2(cos(t), sin(t));
    float r = 1.2 / pow(pow(abs(dir.x), 0.5) + pow(abs(dir.y), 0.5), 2.0);
    float fill = a < 0.6 ? mix(0.62, 1.0, sqrt(c)) : sqrt(c);
    // Top left, above the title, clear of the card and the paragraph.
    p = vec3(dir * r * fill * 0.85 + vec2(-1.6, 0.9), (hq(n, 18u) - 0.5) * 0.2);
    loose *= a < 0.6 ? 0.6 : 0.75;
  } else {
    // A round cloud spreading from a soft centre: dense in the middle,
    // thinning out to a wide halo with no edge, breathing slowly outward.
    vec2 q; float z = (hq(n, 16u) - 0.5) * 0.8;
    float t = hq(n, 11u) * 6.2831853 + time * 0.02;
    float breathe = 1.0 + 0.06 * sin(time * 0.35);
    float r = -log(1.0 - hq(n, 13u) * 0.985) * 0.42 * breathe;
    q = vec2(cos(t), sin(t)) * r;
    loose *= mix(0.12, 0.5, smoothstep(0.4, 1.4, r));
    q += vec2(-0.2, 0.0);
    p = vec3(q * 1.1, z);
  }
  // While a case is hovered, most of the dust draws in so the form shows;
  // the widest third stays out as haze.
  // A case's form keeps only a thin haze round it, so the shape reads.
  loose *= mix(1.0, mix(0.22, symbol > 0.5 ? 0.7 : 1.0, step(0.8, g)), focus);
  return p * 1.6 + j * loose * vec3(1.6, 1.35, 1.0) + vec3(0.35, mix(-0.05, 0.12, focus), 0.0);
}
// Where each particle leans.
vec3 homeOf(vec2 uv) {
  return formOf(floor(uv.x * SIZE) + floor(uv.y * SIZE) * SIZE, uv);
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

// The view: the camera turns a little towards the mouse (cam, -1..1), so
// near dust slides against far dust and the room reads in depth.
// Switching state is a journey, one way: each form sits at its own place in
// space. The new form waits ahead (\`arrive\`, world units from here) and the
// camera travels there (\`move\`, how far it has got), flying through the old
// dust; when it arrives the world is re-centred on the camera.
const view = `
uniform vec3 move;
uniform vec3 arrive;
vec2 project(vec3 p, vec2 cam, float aspect) {
  p.xy -= move.xy;
  p.z += move.z;
  // Dust the camera has flown past is out of view.
  if (5.0 - p.z < 0.35) return vec2(9.0);
  float ay = cam.x * 0.22, ax = -cam.y * 0.14;
  p.xz = mat2(cos(ay), -sin(ay), sin(ay), cos(ay)) * p.xz;
  p.yz = mat2(cos(ax), -sin(ax), sin(ax), cos(ax)) * p.yz;
  vec2 s = p.xy * 1.7 / (5.0 - p.z); s.x /= aspect;
  return s;
}`;

const velocityFragment = `#version 300 es
precision highp float; in vec2 v; out vec4 o;
${common}
uniform sampler2D pos; uniform sampler2D vel; uniform float dt;
uniform vec2 mouse; uniform vec2 mouseVel; uniform float aspect; uniform float gather; uniform float stir; uniform vec2 cam; uniform float hold;
uniform vec2 burstAt; uniform float burstAge; uniform float burstPower;
${view}
void main() {
  vec3 p = texture(pos, v).xyz, u = texture(vel, v).xyz;
  u += (homeOf(v) + arrive - p) * mix(gather, gather * 3.0, focus) * hold * dt;
  u += flow(p * 0.8) * 0.45 * stir * dt;
  u += valley(p * 0.9) * 0.6 * stir * dt;
  // The cursor sweeps nearby dust along its motion and swirls it.
  vec2 s = project(p, cam, aspect);
  vec2 d = (s - mouse) * vec2(aspect, 1.0);
  // A wide, soft reach, so the cursor moves broad swathes rather than
  // punching small holes.
  float k = exp(-dot(d, d) / 0.45);
  vec2 mv = mouseVel / max(dt, 1e-3);
  u.xy += (mv * 0.8 + vec2(-d.y, d.x) * length(mv) * 2.0 + normalize(d + 1e-4) * length(mv) * 0.8) * k * dt * 2.0;
  // A burst: a ring expanding from where the mouse flicked, throwing the dust
  // outward like a firework; a broad ring that travels far and fades slowly.
  vec2 bd = (s - burstAt) * vec2(aspect, 1.0);
  float bl = length(bd), ring = burstAge * 2.4;
  float bw = exp(-(bl - ring) * (bl - ring) / 0.06) * burstPower * exp(-burstAge * 0.9);
  float jitter = h1(v.x * 37.0 + v.y * 91.0);
  u.xy += normalize(bd + 1e-4) * bw * (2.0 + 3.0 * jitter) * dt * 10.0;
  u.z += (jitter - 0.5) * bw * 20.0 * dt;
  u *= exp(-dt * 0.9);
  o = vec4(u, 1.0);
}`;

const positionFragment = `#version 300 es
precision highp float; in vec2 v; out vec4 o;
${common}
${view}
uniform sampler2D pos; uniform sampler2D vel; uniform float dt; uniform vec3 shift; uniform float travelling;
void main() {
  vec3 p = texture(pos, v).xyz + texture(vel, v).xyz * dt + shift;
  // Dust the camera flies past reappears at its place in the new form ahead,
  // so the form is waiting there when the camera arrives.
  if (travelling > 0.5 && 5.0 - (p.z + move.z) < 0.5) p = homeOf(v) + arrive;
  o = vec4(p, 1.0);
}`;

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
uniform sampler2D pos; uniform sampler2D vel; uniform float SIZE; uniform float aspect; uniform float symbol; uniform float time; uniform vec2 mouse; uniform float spectrum; uniform float bolt; uniform float galaxy; uniform float light; uniform float dpr; uniform vec4 clearRect; uniform vec2 cam;
out float vNear; out vec3 vTint; out float vSpec; out float vSpeed; out float vDepth; out float vSeed; out float vStar; out float vLight; out float vSize; out float vFaint;
${pools}
${view}
void main() {
  float i = float(gl_VertexID);
  vec2 uv = (vec2(mod(i, SIZE), floor(i / SIZE)) + 0.5) / SIZE;
  vec3 p = texture(pos, uv).xyz, u = texture(vel, uv).xyz;
  vec2 s = project(p, cam, aspect);
  gl_Position = vec4(s, 0.0, 1.0);
  vSpeed = length(u);
  // Gemini: the sparkle takes the logo's colours, blue at its heart and
  // warmer towards its points (coral up, yellow left, green down).
  vec2 g = (p.xy - vec2(-2.21, 1.56)) / 0.85;
  float ga = atan(g.y, g.x);
  vec3 tips = vec3(0.26, 0.52, 1.0) * max(cos(ga), 0.0) + vec3(1.0, 0.42, 0.4) * max(sin(ga), 0.0)
    + vec3(1.0, 0.8, 0.25) * max(-cos(ga), 0.0) + vec3(0.2, 0.8, 0.5) * max(-sin(ga), 0.0);
  tips /= max(abs(cos(ga)) + abs(sin(ga)), 1e-3);
  vTint = tips;
  vSpec = spectrum * mix(0.55, 0.95, smoothstep(0.05, 0.7, length(g)));
  // Devsign: the logo's violet, cyan along the lower right, and a soft
  // white sheen across the upper slab.
  vec2 d = (p.xy - vec2(0.35, 0.12)) / 1.6 - vec2(-1.75, 0.75);
  float cyan = smoothstep(0.25, 0.55, dot(d, normalize(vec2(1.0, -0.7))));
  float sheen = exp(-pow(dot(d - vec2(-0.25, 0.35), normalize(vec2(0.3, 1.0))) / 0.08, 2.0)) * 0.6;
  vec3 boltTint = mix(mix(vec3(0.56, 0.28, 1.0), vec3(0.3, 0.8, 1.0), cyan), vec3(0.95, 0.9, 1.0), sheen);
  vTint = mix(vTint, boltTint, bolt);
  vSpec = mix(vSpec, 0.85, bolt);
  // The landing galaxy is the richest: every project's colour wound through
  // its arms (blue, violet, teal, a touch of pink) round a warm white core.
  vec2 gq = (p.xy - vec2(0.0, 0.1)) / 1.6;
  float gr = length(gq), gt = atan(gq.y, gq.x);
  float wave = 0.5 + 0.5 * sin(gt * 2.0 + gr * 3.5 - time * 0.05);
  vec3 arms = mix(mix(vec3(0.35, 0.55, 1.0), vec3(0.62, 0.38, 1.0), wave), vec3(0.3, 0.9, 0.82), smoothstep(0.55, 1.0, sin(gt * 3.0 - gr * 2.0) * 0.5 + 0.5) * 0.7);
  arms = mix(arms, vec3(1.0, 0.55, 0.85), smoothstep(0.75, 1.0, wave) * smoothstep(0.4, 1.2, gr) * 0.6);
  vec3 galaxyTint = mix(arms, vec3(1.0, 0.92, 0.88), exp(-gr * gr / 0.06));
  vTint = mix(vTint, galaxyTint, galaxy);
  vSpec = mix(vSpec, 0.8, galaxy);
  vDepth = clamp((p.z + 2.0) / 4.0, 0.0, 1.0);
  vSeed = fract(sin(i * 12.9898) * 43758.5453);
  // Depth of field: dust nearer than the form's plane grows large, soft and
  // faint; dust beyond it shrinks and stays crisp.
  vNear = smoothstep(0.62, 0.8, vDepth + (fract(vSeed * 41.3) - 0.5) * 0.06) * galaxy;
  float cat = fract(sin(i * 1.17) * 43758.5453);
  vStar = symbol > 0.5 && symbol < 1.5 && cat < 0.45 ? 0.3 : (symbol > 1.5 && symbol < 2.5 && cat < 0.3 ? 0.3 : (symbol > 2.5 && cat >= 0.82 ? 0.3 : 0.0));
  vLight = pools(s, aspect, time) + 0.9 * exp(-dot((s - mouse) * vec2(aspect, 1.0), (s - mouse) * vec2(aspect, 1.0)) / 0.12);
  // The About landscape spans the whole stage, so it carries its own light.
  if (symbol > 2.5) vLight = max(vLight, 0.85);
  // The bolt's upper slab sits where the room is darkest; lift it so the
  // whole bolt reads evenly.
  if (symbol > 1.5 && symbol < 2.5) vLight = max(vLight, 0.75);
  // Twinkle: every point breathes a little; a few flare now and then.
  float phase = time * (0.6 + 1.8 * vSeed) + vSeed * 40.0;
  float flare = pow(max(sin(phase), 0.0), 16.0) * step(mix(0.75, 0.6, galaxy), fract(vSeed * 7.7));
  vLight *= 0.7 + 0.3 * sin(phase * 1.7);
  // Most of it is fine dust, faint on its own so that only where it gathers
  // does it add up into a milky haze; a few in a hundred are stars, and only
  // those flare.
  // Dark keeps the earlier grain (fewer, slightly larger points, more stars);
  // light uses the finer, denser mix.
  float dark = 1.0 - step(0.5, light);
  float star = step(mix(mix(0.97, 0.955, galaxy), mix(0.965, 0.94, galaxy), dark), fract(vSeed * 13.1));
  vSize = flare * star;
  // Three grains, in CSS pixels: most of it fine dust (about a device pixel
  // on a retina screen), some coarser dust, and the few stars.
  float fine = step(0.42, fract(vSeed * 29.3)) * (1.0 - star) * (1.0 - dark);
  // Sparse dust, so each grain is a little larger and sized by depth: far
  // ones small and sharp, near ones large and soft.
  float size = mix(0.8, 1.35, vDepth) * mix(mix(mix(mix(0.9, 1.1, vDepth), mix(1.0, 1.3, vDepth), dark), mix(0.7, 0.85, vDepth), fine), mix(mix(1.2, 1.6, vDepth) * 0.7, mix(1.5, 2.1, vDepth), dark), star) * (1.0 + 0.2 * vStar);
  // With sparse dust, a case's form needs each grain brighter to read.
  vFaint = mix(mix(mix(1.1, 1.15, dark), 0.95, fine), 1.5, star) * 2.0 * mix(1.0, 1.7, step(0.5, symbol));
  // In the dark the landing galaxy shines brighter than any project's form.
  vFaint *= 1.0 + 0.7 * galaxy * (1.0 - light);
  // Light theme: ink on a pale page needs a little more body to read.
  float px = (size * mix(1.0, 1.1, light) + vSize * mix(3.0, 1.5, light)) * dpr;
  // Below a device pixel a point can't shrink, so it fades instead.
  vFaint *= min(px, 1.0);
  // The case's paragraph stays readable: dust behind it (with a soft margin)
  // all but disappears. clearRect is its box in clip space (x0, y0, x1, y1).
  vec2 m = vec2(0.09, 0.14);
  float inside = smoothstep(clearRect.x - m.x, clearRect.x, s.x) * smoothstep(clearRect.z + m.x, clearRect.z, s.x)
    * smoothstep(clearRect.y - m.y, clearRect.y, s.y) * smoothstep(clearRect.w + m.y, clearRect.w, s.y);
  vFaint *= 1.0 - 0.85 * inside;
  px *= mix(0.9, 1.0, smoothstep(0.3, 0.5, vDepth));
  // Flying through: dust grows as the camera nears it.
  px *= clamp((5.0 - p.z) / max(5.0 - p.z - move.z, 0.35), 1.0, 2.2);
  vFaint *= 1.0 - smoothstep(4.0, 7.0, (5.0 - p.z) / max(5.0 - p.z - move.z, 0.35));
  gl_PointSize = max(px, 1.0);
}`;

const drawFragment = `#version 300 es
precision highp float;
in float vNear; in vec3 vTint; in float vSpec; in float vSpeed; in float vDepth; in float vSeed; in float vStar; in float vLight; in float vSize; in float vFaint; out vec4 o;
uniform vec3 calm; uniform vec3 fast; uniform vec3 accent; uniform float light;
void main() {
  vec2 q = gl_PointCoord - 0.5;
  // A soft core; a flaring star shows a faint four-point glint.
  float core = smoothstep(0.5, 0.5 * vNear * 0.8, length(q) * mix(1.0, 3.0, vSize));
  float rays = 0.5 * vSize * (exp(-abs(q.x) * 60.0) + exp(-abs(q.y) * 60.0)) * smoothstep(0.5, 0.1, length(q));
  float a = min(core + rays, 1.0) * vFaint;
  float e = smoothstep(0.25, 1.6, vSpeed);
  vec3 c = mix(mix(calm, accent, smoothstep(0.55, 0.95, vSeed)), fast, max(max(e, step(0.94, vSeed) * 0.6), vStar));
  c = mix(c, vTint * mix(mix(1.3, 1.5, e), 1.0, light), vSpec);
  float alpha = a * (0.7 + 0.6 * e + 0.4 * vStar + 1.5 * vSize) * (0.32 + 0.68 * vDepth) * vLight * mix(1.0, 0.25, vNear);
  c = mix(c, vec3(1.0), 0.6 * vSize);
  // Light theme: the dust is ink over the page, but vivid ink: saturation
  // pushed up, darkened only as much as a pale colour needs to read.
  float lum = dot(c, vec3(0.3, 0.59, 0.11));
  // Fluorescent: the strongest channel pushed to full, the weakest pulled
  // down, so each grain reads as coloured light rather than grey dust.
  vec3 sat = clamp(lum + (c - lum) * 2.4, 0.0, 1.0);
  vec3 vivid = sat / max(max(sat.r, max(sat.g, sat.b)), 0.2) * mix(0.78, 0.6, lum);
  c = mix(c, vivid, light);
  alpha *= mix(1.0, 3.2, light);
  o = vec4(c * alpha, alpha);
}`;

// The pools' own soft light on the room behind the dust.
const glowFragment = `#version 300 es
precision highp float; in vec2 v; out vec4 o;
uniform float aspect; uniform float time; uniform vec3 calm; uniform vec3 accent; uniform vec3 fast; uniform float lightIn;
uniform vec4 form; uniform float spectrum; // the form's centre and radius (world units), its glow; Gemini's colours
${pools}
void main() {
  // The theme flips this layer at once: half-way values would leave pixels
  // with a little alpha under bright colour, which the page composites as
  // hard-edged blobs while the theme changes.
  float light = step(0.5, lightIn);
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
  // A soft light of the form's own colour under it, so the dust shades off
  // into the room instead of ending in loose points.
  vec2 w = q / 0.34, d = (w - form.xy) / form.z;
  float fall = exp(-dot(d, d) * 1.4) * form.w;
  float ga = atan(d.y, d.x);
  vec3 tips = vec3(0.26, 0.52, 1.0) * max(cos(ga), 0.0) + vec3(1.0, 0.42, 0.4) * max(sin(ga), 0.0)
    + vec3(1.0, 0.8, 0.25) * max(-cos(ga), 0.0) + vec3(0.2, 0.8, 0.5) * max(-sin(ga), 0.0);
  tips /= max(abs(cos(ga)) + abs(sin(ga)), 1e-3);
  vec3 fc = mix(mix(calm, accent, 0.4), tips, spectrum * 0.8);
  c += fc * fall * 0.16 * (1.0 - light);
  // Light theme: the same band as a faint tinted haze over the page.
  float haze = (band * 0.08 + l * 0.04 + fall * 0.1) * light;
  vec3 hc = mix(mix(calm, accent, 0.5 + 0.5 * s.x), fc, clamp(fall * 3.0, 0.0, 1.0));
  o = vec4(c + hc * 0.55 * haze, haze);
}`;

// A far field of faint stars behind the dust. They live in a box that wraps
// around the camera, offset by everything it has travelled (\`travel\`), so
// when the camera moves the near dust streams past and the stars barely
// shift: the depth the move happens in.
const starVertex = `#version 300 es
precision highp float;
uniform float aspect; uniform vec2 cam; uniform vec3 travel; uniform float dpr; uniform float time;
out float vA;
${view}
float hs(float n) { return fract(sin(n) * 43758.5453); }
void main() {
  float i = float(gl_VertexID);
  vec3 b = vec3(hs(i * 1.31) * 16.0 - 8.0, hs(i * 2.17) * 10.0 - 5.0, hs(i * 3.73) * 12.0);
  vec3 w = vec3(mod(b.x - travel.x + 8.0, 16.0) - 8.0, mod(b.y - travel.y + 5.0, 10.0) - 5.0, mod(b.z - travel.z, 12.0));
  vec3 p = vec3(w.x, w.y, -15.0 + w.z);
  vec2 s = project(p, cam, aspect);
  gl_Position = vec4(s, 0.0, 1.0);
  float edge = smoothstep(0.0, 1.5, w.z) * (1.0 - smoothstep(10.0, 12.0, w.z));
  vA = edge * (0.35 + 0.65 * hs(i * 5.9)) * (0.8 + 0.2 * sin(time * (0.5 + hs(i * 7.1)) + i));
  gl_PointSize = mix(1.0, 1.8, smoothstep(6.0, 12.0, w.z)) * dpr;
}`;
const starFragment = `#version 300 es
precision highp float; in float vA; out vec4 o;
uniform vec3 calm; uniform float light;
void main() {
  float a = smoothstep(0.5, 0.1, length(gl_PointCoord - 0.5)) * vA * mix(0.55, 0.35, light);
  vec3 c = mix(mix(calm, vec3(1.0), 0.6), calm * 0.5, light);
  o = vec4(c * a, a);
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
    const SIZE = window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 768 ? 150 : 216;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
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
    const pStar = link(starVertex, starFragment);
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
      width = Math.max(1, Math.round(rect.width * dpr));
      height = Math.max(1, Math.round(rect.height * dpr));
      if (el.width !== width || el.height !== height) { el.width = width; el.height = height; }
    };
    const observer = new ResizeObserver(resize);
    observer.observe(el);
    resize();

    // The mouse over the stage (-1..1, y up) and where it was last frame.
    const mouse = { x: 9, y: 9, px: 9, py: 9, cx: 0, cy: 0 };
    // The camera's turn, easing after the mouse (centre when it is away).
    const cam = { x: 0, y: 0 };
    // The journey between states: when it started, and which way it swings.
    const trip = { at: -1e9, symbol: -1, side: 1, arrive: [0, 0, 0], travel: [0, 0, 0] };
    const TRIP = 2.0;
    const ease = (x: number) => x * x * (3 - 2 * x);
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

    const colours = { calm: [...start.calm], fast: [...start.fast], accent: [...start.accent], light: lightTarget, focus: 0, spectrum: 0, bolt: 0, galaxy: start.symbol === 0 ? 1 : 0, form: [0, 0.1, 1.6, 0] };
    let visible = true;
    const io = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }, { threshold: 0 });
    io.observe(el);

    // The visible case paragraph's box in clip space, re-read now and then;
    // off-screen when none is shown.
    const clear = [9, 9, 9, 9];
    let clearTick = 0;
    const readClear = () => {
      const p = document.querySelector<HTMLElement>(".home-world-problem[data-on]");
      if (!p) { clear.fill(9); return; }
      const c = el.getBoundingClientRect(), r = p.getBoundingClientRect();
      clear[0] = ((r.left - c.left) / c.width) * 2 - 1; clear[2] = ((r.right - c.left) / c.width) * 2 - 1;
      clear[1] = 1 - ((r.bottom - c.top) / c.height) * 2; clear[3] = 1 - ((r.top - c.top) / c.height) * 2;
    };
    let frame = 0, last = performance.now(), clock = 0;
    const draw = (now: number) => {
      frame = requestAnimationFrame(draw);
      const dt = Math.min(1 / 30, (now - last) / 1000);
      last = now;
      const covered = !running.current && idleSince.current !== null && now - idleSince.current > 800;
      if (!visible || document.hidden || covered || document.documentElement.hasAttribute("data-project-navigation")) { mouse.px = mouse.x; mouse.py = mouse.y; return; }
      clock += dt;
      const target = OBJECT_STATES[state.current] ?? OBJECT_STATES.default;
      const k = 1 - Math.exp(-dt / 0.35);
      (["calm", "fast", "accent"] as const).forEach((key) => { for (let i = 0; i < 3; i++) colours[key][i] += (target[key][i] - colours[key][i]) * k; });
      colours.light += (lightTarget - colours.light) * k;
      colours.spectrum += ((target.symbol === 1 ? 1 : 0) - colours.spectrum) * k;
      colours.bolt += ((target.symbol === 2 ? 1 : 0) - colours.bolt) * k;
      colours.galaxy += ((target.symbol === 0 ? 1 : 0) - colours.galaxy) * k;
      // The landing galaxy gathers nearly as tightly as a case's form, so it reads as a spiral.
      colours.focus += ((target.symbol > 0 ? 1 : 0.85) - colours.focus) * (1 - Math.exp(-dt / 0.4));
      // The journey: re-centre the world when a trip ends (or is cut short by
      // the next), then set off towards the new form's place.
      const shift = [0, 0, 0];
      const rebase = (e: number) => {
        for (let i = 0; i < 3; i++) { shift[i] -= trip.arrive[i] * e; trip.travel[i] += trip.arrive[i] * e; trip.arrive[i] = 0; }
      };
      if (target.symbol !== trip.symbol) {
        if (trip.symbol >= 0) {
          rebase(ease(Math.min(1, (clock - trip.at) / TRIP)));
          trip.at = clock; trip.side = -trip.side;
          trip.arrive = [trip.side * 1.3, 0.2, -5.5];
        }
        trip.symbol = target.symbol;
      }
      let tu = Math.min(1, (clock - trip.at) / TRIP);
      if (tu >= 1 && trip.arrive[2] !== 0) rebase(1);
      const travelling = trip.arrive[2] !== 0;
      const e = travelling ? ease(tu) : 0;
      // How far the camera has got: sideways and up as the world shifts, forward as depth.
      const move = [trip.arrive[0] * e, trip.arrive[1] * e, -trip.arrive[2] * e];
      // While under way the dust holds where it is, so the camera flies through
      // it; it gathers into the new form for the last stretch.
      const hold = travelling ? 0.05 + 0.95 * Math.max(0, (tu - 0.55) / 0.45) ** 2 : 1;
      if (!travelling) tu = 1;
      const inside = Math.abs(mouse.x) <= 1 && Math.abs(mouse.y) <= 1;
      const ck = 1 - Math.exp(-dt / 1.2);
      cam.x += ((inside ? mouse.x : 0) - cam.x) * ck; cam.y += ((inside ? mouse.y : 0) - cam.y) * ck;
      // A jump (the mouse entering the stage) is not a sweep.
      let vx = mouse.x - mouse.px, vy = mouse.y - mouse.py;
      if (Math.hypot(vx, vy) > 0.3) { vx = 0; vy = 0; }
      mouse.px = mouse.x; mouse.py = mouse.y;
      // A quick flick sets off a burst (at most every 1.2s), and tells the
      // headline so its letters decode as the ring passes them.
      const speed = Math.hypot(vx, vy) / Math.max(dt, 1e-3);
      if (speed > 2.8 && clock - burst.at > 1.2) {
        Object.assign(burst, { x: mouse.x, y: mouse.y, at: clock, power: Math.min(1.2, speed / 4) });
        window.dispatchEvent(new CustomEvent("hero-burst", { detail: { x: mouse.cx, y: mouse.cy, pxPerSecond: (2.4 * height) / 2, power: burst.power } }));
      }

      pass(pVel, V[1], () => {
        bind(pVel, "pos", 0, P[0].texture); bind(pVel, "vel", 1, V[0].texture);
        gl.uniform1f(uniform(pVel, "dt"), dt); gl.uniform1f(uniform(pVel, "time"), clock); gl.uniform1f(uniform(pVel, "symbol"), target.symbol); gl.uniform1f(uniform(pVel, "SIZE"), SIZE);
        gl.uniform2f(uniform(pVel, "cam"), cam.x, cam.y); gl.uniform3f(uniform(pVel, "move"), move[0], move[1], move[2]); gl.uniform3f(uniform(pVel, "arrive"), trip.arrive[0], trip.arrive[1], trip.arrive[2]); gl.uniform1f(uniform(pVel, "hold"), hold);
        gl.uniform2f(uniform(pVel, "mouse"), mouse.x, mouse.y); gl.uniform2f(uniform(pVel, "mouseVel"), vx, vy); gl.uniform1f(uniform(pVel, "aspect"), width / height);
        gl.uniform2f(uniform(pVel, "burstAt"), burst.x, burst.y); gl.uniform1f(uniform(pVel, "burstAge"), clock - burst.at); gl.uniform1f(uniform(pVel, "burstPower"), burst.power);
        gl.uniform1f(uniform(pVel, "gather"), 1.15); gl.uniform1f(uniform(pVel, "focus"), colours.focus); gl.uniform1f(uniform(pVel, "lightTheme"), lightTarget); gl.uniform1f(uniform(pVel, "stir"), 0.65 - 0.35 * colours.galaxy);
      });
      V.reverse();
      pass(pPos, P[1], () => {
        bind(pPos, "pos", 0, P[0].texture); bind(pPos, "vel", 1, V[0].texture); gl.uniform1f(uniform(pPos, "dt"), dt);
        gl.uniform3f(uniform(pPos, "shift"), shift[0], shift[1], shift[2]); gl.uniform1f(uniform(pPos, "travelling"), travelling ? 1 : 0);
        gl.uniform3f(uniform(pPos, "move"), move[0], move[1], move[2]); gl.uniform3f(uniform(pPos, "arrive"), trip.arrive[0], trip.arrive[1], trip.arrive[2]);
        gl.uniform1f(uniform(pPos, "time"), clock); gl.uniform1f(uniform(pPos, "symbol"), target.symbol); gl.uniform1f(uniform(pPos, "SIZE"), SIZE); gl.uniform1f(uniform(pPos, "focus"), colours.focus); gl.uniform1f(uniform(pPos, "lightTheme"), lightTarget);
      });
      P.reverse();

      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, width, height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE);
      gl.useProgram(pGlow);
      gl.bindVertexArray(vaoQuad);
      gl.uniform1f(uniform(pGlow, "aspect"), width / height); gl.uniform1f(uniform(pGlow, "time"), clock); gl.uniform1f(uniform(pGlow, "lightIn"), colours.light);
      // Where each form sits and how much light it casts on the room.
      const formTarget = target.symbol === 1 ? [-2.21, 1.56, 1.6, 1] : target.symbol === 2 ? [-2.37, 1.32, 1.3, 0.9] : target.symbol === 3 ? [0.35, -0.3, 2.4, 0.35] : [0, 0.1, 1.6, 0.4];
      for (let i = 0; i < 4; i++) colours.form[i] += (formTarget[i] - colours.form[i]) * k;
      gl.uniform4f(uniform(pGlow, "form"), colours.form[0], colours.form[1], colours.form[2], colours.form[3]); gl.uniform1f(uniform(pGlow, "spectrum"), colours.spectrum);
      gl.uniform3fv(uniform(pGlow, "calm"), colours.calm); gl.uniform3fv(uniform(pGlow, "accent"), colours.accent); gl.uniform3fv(uniform(pGlow, "fast"), colours.fast);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      // The far stars, before the dust.
      if (colours.light < 0.5) gl.blendFunc(gl.ONE, gl.ONE); else gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.useProgram(pStar);
      gl.bindVertexArray(vaoDraw);
      gl.uniform1f(uniform(pStar, "aspect"), width / height); gl.uniform2f(uniform(pStar, "cam"), cam.x, cam.y); gl.uniform1f(uniform(pStar, "dpr"), dpr); gl.uniform1f(uniform(pStar, "time"), clock);
      gl.uniform3f(uniform(pStar, "travel"), trip.travel[0] + trip.arrive[0] * e, trip.travel[1] + trip.arrive[1] * e, trip.travel[2] + trip.arrive[2] * e);
      gl.uniform3fv(uniform(pStar, "calm"), colours.calm); gl.uniform1f(uniform(pStar, "light"), colours.light);
      gl.drawArrays(gl.POINTS, 0, 2400);
      // Dark: the dust adds up into light. Light: it lies over the page.
      const dustBlend = () => { if (colours.light < 0.5) gl.blendFunc(gl.ONE, gl.ONE); else gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA); };
      gl.useProgram(pDraw);
      gl.bindVertexArray(vaoDraw);
      dustBlend();
      bind(pDraw, "pos", 0, P[0].texture); bind(pDraw, "vel", 1, V[0].texture);
      gl.uniform1f(uniform(pDraw, "SIZE"), SIZE); gl.uniform1f(uniform(pDraw, "aspect"), width / height); gl.uniform1f(uniform(pDraw, "symbol"), target.symbol);
      gl.uniform3f(uniform(pDraw, "arrive"), trip.arrive[0], trip.arrive[1], trip.arrive[2]);
      gl.uniform1f(uniform(pDraw, "time"), clock); gl.uniform2f(uniform(pDraw, "mouse"), mouse.x, mouse.y); gl.uniform2f(uniform(pDraw, "cam"), cam.x, cam.y); gl.uniform3f(uniform(pDraw, "move"), move[0], move[1], move[2]);
      gl.uniform3fv(uniform(pDraw, "calm"), colours.calm); gl.uniform3fv(uniform(pDraw, "fast"), colours.fast); gl.uniform3fv(uniform(pDraw, "accent"), colours.accent);
      gl.uniform1f(uniform(pDraw, "light"), colours.light);
      gl.uniform1f(uniform(pDraw, "spectrum"), colours.spectrum);
      gl.uniform1f(uniform(pDraw, "bolt"), colours.bolt);
      gl.uniform1f(uniform(pDraw, "galaxy"), colours.galaxy);
      if (clearTick++ % 10 === 0) readClear();
      gl.uniform1f(uniform(pDraw, "dpr"), dpr);
      gl.uniform4f(uniform(pDraw, "clearRect"), clear[0], clear[1], clear[2], clear[3]);
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
      [pInit, pVel, pPos, pDraw, pGlow, pStar].forEach((p) => gl.deleteProgram(p));
      gl.deleteBuffer(quad);
    };
  }, []);

  return <canvas ref={canvas} className={className} aria-hidden="true" />;
}
