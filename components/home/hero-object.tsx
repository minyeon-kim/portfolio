"use client";

import { useEffect, useRef } from "react";

// The landing backdrop, after byotone.com: a few tens of thousands of still,
// matte, off-white grains drifting slowly in a soft flow, gathered loosely
// into a form. No glow, no twinkle; the cursor only nudges the grains right
// beside it, and the camera barely leans toward it. Each state leans the dust,
// loosely, toward a hint of its own form, and a change of state flows the
// grains into the new form where they are:
// - default: a wide, open galaxy across the stage, slowly turning
// - Gemini privacy revamp, blue: the Gemini sparkle
// - Devsign, purple: the Devsign bolt, purple with a cyan edge
// - About me, teal: a rolling landscape of dots under falling data
// A GPU simulation (WebGL 2, positions and velocities in float textures);
// drawn at the screen's own resolution (DPR up to 2) so the finest dust is a
// device pixel; 46,656 points simulated on desktop, 22,500 on phones, 45%
// of them drawn; paused offscreen, hidden or during the page transition, skipped
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
// The Devsign bolt, from public/images/devsign/devsign-logo.svg (42×40): an
// upper slab, a notch each side where it steps over, a lower slab to a point.
const vec2 BOLT[9] = vec2[9](vec2(31.4, 7.59), vec2(26.0, 16.73), vec2(35.3, 16.73), vec2(21.9, 33.9), vec2(21.31, 25.88), vec2(12.4, 25.88), vec2(18.0, 16.73), vec2(7.2, 16.73), vec2(13.4, 7.59));
// Centred, y up, half its height = 1, with the logo's own proportions.
vec2 boltPoint(vec2 v) { return vec2(v.x - 21.25, 20.75 - v.y) / 13.16; }
bool inBolt(vec2 q) {
  bool inside = false;
  for (int i = 0, j = 8; i < 9; j = i++) {
    vec2 a = boltPoint(BOLT[i]), b = boltPoint(BOLT[j]);
    if ((a.y > q.y) != (b.y > q.y) && q.x < (b.x - a.x) * (q.y - a.y) / (b.y - a.y) + a.x) inside = !inside;
  }
  return inside;
}
// Where the logos sit, in world units: about 24% across and 26% down the stage.
const vec2 LOGO_AT = vec2(-2.47, 1.53);
const float LOGO_SIZE = 0.9;
// Where point n of the form leans: the form, with a wide halo of dust.
vec3 formOf(float n, vec2 uv) {
  float a = hq(n, 1u), b = hq(n, 2u), c = hq(n, 3u), g = hq(n, 4u);
  vec3 j = vec3(hq(n, 5u), hq(n, 6u), hq(n, 7u)) - 0.5;
  vec3 p; float loose = mix(0.4, 4.2, pow(g, 1.2));
  if (symbol > 2.5 || symbol < 0.5) {
    // The landing (and About): a landscape of dots, seen low from the front,
    // spread across the whole stage: a regular grid rolling into slow waves,
    // rising into ridges at the sides, with faint, loose streams of data
    // falling behind it.
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
  } else {
    // The two logos, drawn tight so they read as the logos: one spot top left
    // (clear of the name below and the card on the right), one size, and only
    // a tenth of the dust left round them as haze.
    vec2 q = vec2(0.0);
    if (symbol > 1.5) {
      if (a < 0.15) {
        float e = b * 9.0;
        int ki = int(floor(e));
        q = mix(boltPoint(BOLT[ki]), boltPoint(BOLT[(ki + 1) % 9]), fract(e));
      } else {
        for (int t = 0; t < 16; t++) {
          vec2 r = vec2(mix(-1.07, 1.07, hq(n, 20u + uint(t) * 2u)), mix(-1.0, 1.0, hq(n, 21u + uint(t) * 2u)));
          if (inBolt(r)) { q = r; break; }
        }
      }
    } else {
      // The Gemini star: |x|^0.66 + |y|^0.66 = 1, as in its logo. The edge
      // samples crowd towards the points, which keeps them sharp.
      if (a < 0.2) {
        float t = b * 6.2831853;
        vec2 dir = vec2(cos(t), sin(t));
        q = dir / pow(pow(abs(dir.x), 0.66) + pow(abs(dir.y), 0.66), 1.0 / 0.66);
      } else {
        for (int t = 0; t < 24; t++) {
          vec2 r = vec2(hq(n, 20u + uint(t) * 2u), hq(n, 21u + uint(t) * 2u)) * 2.0 - 1.0;
          if (pow(abs(r.x), 0.66) + pow(abs(r.y), 0.66) < 1.0) { q = r; break; }
        }
      }
    }
    return vec3(q * LOGO_SIZE + LOGO_AT, (hq(n, 17u) - 0.5) * 0.1) + j * (g > 0.9 ? mix(0.3, 1.2, c) : 0.04);
  }
  // While a case is hovered, most of the dust draws in so the form shows;
  // the widest third stays out as haze.
  // A case's form keeps only a thin haze round it, so the shape reads.
  loose *= mix(1.0, mix(0.22, symbol > 0.5 ? 0.7 : 0.35, step(0.8, g)), focus);
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
  // Start drawn in tight at the centre: on load the form blooms outward
  // while the camera comes forward (after byotone.com's orb entry).
  o = which < 0.5 ? vec4(homeOf(v) * 0.12 + jitter * 0.25, 1.0) : vec4(0.0);
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
uniform float approach;  // extra camera distance: high on load, easing to 0 as the form comes forward
vec2 project(vec3 p, vec2 cam, float aspect) {
  p.xy -= move.xy;
  p.z += move.z - approach;
  // Dust the camera has flown past is out of view.
  if (5.0 - p.z < 0.35) return vec2(9.0);
  float ay = cam.x * 0.12, ax = -cam.y * 0.07;
  p.xz = mat2(cos(ay), -sin(ay), sin(ay), cos(ay)) * p.xz;
  p.yz = mat2(cos(ax), -sin(ax), sin(ax), cos(ax)) * p.yz;
  vec2 s = p.xy * 1.7 / (5.0 - p.z); s.x /= aspect;
  return s;
}`;

const velocityFragment = `#version 300 es
precision highp float; in vec2 v; out vec4 o;
${common}
uniform sampler2D pos; uniform sampler2D vel; uniform float dt;
uniform vec2 mouse; uniform vec2 mouseVel; uniform float aspect; uniform float gather; uniform float damp; uniform float stir; uniform vec2 cam; uniform float hold;
${view}
void main() {
  vec3 p = texture(pos, v).xyz, u = texture(vel, v).xyz;
  u += (homeOf(v) + arrive - p) * gather * hold * dt;
  u += flow(p * 0.8) * 0.45 * stir * dt;
  u += valley(p * 0.9) * 0.6 * stir * dt;
  // The cursor sweeps nearby dust along its motion and swirls it.
  vec2 s = project(p, cam, aspect);
  vec2 d = (s - mouse) * vec2(aspect, 1.0);
  // After byotone.com: only the grains near the cursor give way a little,
  // so the form never loses its shape (no wide swirl). They part along its
  // motion, and the landscape swells gently under a resting cursor.
  float k = exp(-dot(d, d) / 0.16);
  vec2 mv = mouseVel / max(dt, 1e-3);
  u.xy += (mv * 0.4 + normalize(d + 1e-4) * length(mv) * 0.45) * k * dt * 2.0;
  u.y += k * mix(0.3, 1.0, step(symbol, 0.5) + step(2.5, symbol)) * dt;
  // Damped enough that a change of form flows in and settles without wobbling.
  u *= exp(-dt * damp);
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

const drawVertex = `#version 300 es
precision highp float;
uniform sampler2D pos; uniform sampler2D vel; uniform float SIZE; uniform float aspect; uniform float symbol; uniform float time; uniform vec2 mouse; uniform float spectrum; uniform float bolt; uniform float galaxy; uniform float light; uniform float dpr; uniform vec4 clearRect; uniform vec2 cam;
uniform float keep;  // the share of the simulation drawn
uniform float halo;  // the light theme: grains drawn larger as a glow (bright core, soft coloured halo)
out float vNear; out vec3 vTint; out float vSpec; out float vSpeed; out float vDepth; out float vSeed; out float vStar; out float vLight; out float vSize; out float vFaint; out float vFlake;
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
  // (-2.47, 1.53) and 0.9 are LOGO_AT and LOGO_SIZE.
  vec2 g = (p.xy - vec2(-2.47, 1.53)) / 0.9;
  float ga = atan(g.y, g.x);
  vec3 tips = vec3(0.2, 0.5, 1.0) * max(cos(ga), 0.0) + vec3(1.0, 0.27, 0.27) * max(sin(ga), 0.0)
    + vec3(1.0, 0.75, 0.1) * max(-cos(ga), 0.0) + vec3(0.1, 0.75, 0.4) * max(-sin(ga), 0.0);
  tips /= max(abs(cos(ga)) + abs(sin(ga)), 1e-3);
  vTint = mix(vec3(0.2, 0.5, 1.0), tips, smoothstep(0.0, 0.75, length(g)));
  vSpec = spectrum * 0.95;
  // Devsign: the logo's violet, cyan along the lower right, and a soft
  // white sheen across the upper slab.
  vec2 d = (p.xy - vec2(-2.47, 1.53)) / 1.1;
  float cyan = smoothstep(0.25, 0.55, dot(d, normalize(vec2(1.0, -0.7))));
  float sheen = exp(-pow(dot(d - vec2(-0.25, 0.35), normalize(vec2(0.3, 1.0))) / 0.08, 2.0)) * 0.6;
  vec3 boltTint = mix(mix(vec3(0.56, 0.28, 1.0), vec3(0.3, 0.8, 1.0), cyan), vec3(0.95, 0.9, 1.0), sheen);
  vTint = mix(vTint, boltTint, bolt);
  vSpec = mix(vSpec, 0.85, bolt);
  // The landing galaxy is the richest: every project's colour wound through
  // its arms (blue, violet, teal, a touch of pink) round a warm white core.
  vec2 gq = (p.xy - vec2(0.35, 0.1)) / vec2(4.5, 1.1);
  float gr = length(gq), gt = atan(gq.y, gq.x);
  float wave = 0.5 + 0.5 * sin(gt * 2.0 + gr * 3.5 - time * 0.05);
  vec3 arms = mix(mix(vec3(0.35, 0.55, 1.0), vec3(0.62, 0.38, 1.0), wave), vec3(0.3, 0.9, 0.82), smoothstep(0.55, 1.0, sin(gt * 3.0 - gr * 2.0) * 0.5 + 0.5) * 0.7);
  arms = mix(arms, vec3(1.0, 0.55, 0.85), smoothstep(0.75, 1.0, wave) * smoothstep(0.4, 1.2, gr) * 0.6);
  vec3 galaxyTint = mix(arms, vec3(1.0, 0.92, 0.88), exp(-gr * gr / 0.06));
  // Light theme: a brighter, sunnier palette on the pale page (sky blue,
  // violet, hot pink, coral, mint) with no grey core, so it reads as
  // glitter rather than ink.
  vec3 lightArms = mix(mix(vec3(0.2, 0.62, 1.0), vec3(0.58, 0.36, 1.0), wave), vec3(1.0, 0.3, 0.62), smoothstep(0.55, 1.0, sin(gt * 3.0 - gr * 2.0) * 0.5 + 0.5) * 0.8);
  lightArms = mix(lightArms, vec3(1.0, 0.55, 0.3), smoothstep(0.7, 1.0, wave) * 0.6);
  lightArms = mix(lightArms, vec3(0.1, 0.85, 0.7), smoothstep(0.8, 1.0, sin(gt * 5.0 + gr * 4.0) * 0.5 + 0.5) * 0.7);
  galaxyTint = mix(galaxyTint, lightArms, step(0.5, light));
  vTint = mix(vTint, galaxyTint, galaxy);
  vSpec = mix(vSpec, 0.8, galaxy);
  vDepth = clamp((p.z + 2.0) / 4.0, 0.0, 1.0);
  vSeed = fract(sin(i * 12.9898) * 43758.5453);
  // Depth of field: dust nearer than the form's plane grows large, soft and
  // faint; dust beyond it shrinks and stays crisp.
  vNear = smoothstep(0.62, 0.8, vDepth + (fract(vSeed * 41.3) - 0.5) * 0.06) * galaxy;
  float cat = fract(sin(i * 1.17) * 43758.5453);
  vStar = symbol > 0.5 && symbol < 1.5 && cat < 0.45 ? 0.3 : (symbol > 1.5 && symbol < 2.5 && cat < 0.3 ? 0.3 : (symbol > 2.5 && cat >= 0.82 ? 0.3 : 0.0));
  // Even light (after byotone.com): no drifting pools or cursor glow, so
  // the form reads by density alone.
  vLight = 0.7;
  // The About landscape spans the whole stage, so it carries its own light.
  if (symbol > 2.5) vLight = max(vLight, 0.85);
  // The bolt's upper slab sits where the room is darkest; lift it so the
  // whole bolt reads evenly.
  if (symbol > 1.5 && symbol < 2.5) vLight = max(vLight, 0.75);
  // No twinkle (after byotone.com): grains that breathe and flare one by one
  // read as shimmering grain; still grains read as matter.
  float flare = 0.0;
  vLight *= 0.85;
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
    // Crisp: every grain is drawn, so the form reads as clearly as before,
    // but not all alike: most sink low into the glow and only a few stay
    // bright. An even field of equally bright grains is what read as grain.
  // After byotone.com: fewer, slightly larger grains (2–3px), nearly even
  // in brightness and matte, so the form reads by density alone.
  // Landing: the dust thins out with height above the landscape, so the
  // waves dissolve into the sky instead of a second field sitting on top.
  float sky = galaxy * smoothstep(-0.2, 0.7, s.y);
  float kept = step(fract(vSeed * 97.31), keep * mix(1.0, 0.12, sky));
  // Mostly small grains, about one in eight a larger flake, so the field
  // has depth instead of an even texture. The sky keeps only the small ones.
  float flake = step(0.875, fract(vSeed * 71.9)) * (1.0 - sky) * step(spectrum + bolt, 0.5);
  vFlake = flake;
  vFaint *= kept * mix(0.55, 1.0, fract(vSeed * 53.7)) * mix(0.9, 1.15, flake) * mix(1.0, 0.6, sky);
  px = mix(mix(1.6, 2.4, vDepth), mix(4.0, 6.0, vDepth), flake) * dpr;
  // Light theme: about one grain in twelve glints now and then (a slow,
  // sharp swell in size and brightness, each on its own beat).
  float tw = step(0.92, fract(vSeed * 37.7)) * step(0.5, light) * (1.0 - sky);
  float glint = tw * pow(0.5 + 0.5 * sin(time * mix(0.6, 1.4, fract(vSeed * 19.3)) + vSeed * 40.0), 14.0);
  vFaint *= 1.0 + glint * 3.0;
  px *= 1.0 + glint * 0.8;
  px *= mix(1.0, 5.0, halo);
  gl_PointSize = kept > 0.5 ? px : 0.0;
  if (kept < 0.5) gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
}`;

const drawFragment = `#version 300 es
precision highp float;
in float vNear; in vec3 vTint; in float vSpec; in float vSpeed; in float vDepth; in float vSeed; in float vStar; in float vLight; in float vSize; in float vFaint; in float vFlake; out vec4 o;
uniform vec3 calm;  // each grain keeps its colour: the form's tint, else the state's
uniform float halo;
void main() {
  // Each grain is a soft sprite (a gaussian plus a small core; the larger
  // flakes mostly gaussian, out of focus). Only its intensity is written:
  // the dither pass turns the summed light into ink on the ground.
  vec2 q = gl_PointCoord - 0.5;
  float r2 = dot(q, q) * 4.0;
  if (r2 > 1.0) discard;
  float cover = exp(-r2 * mix(3.2, 1.8, vFlake)) * 0.75 + (1.0 - smoothstep(0.3, 0.55, sqrt(r2))) * mix(0.45, 0.1, vFlake);
  // Glow (the sprite is 5x larger): a hot core the grain's old size and a
  // wide soft halo around it.
  float rr = sqrt(r2);
  float glow = exp(-pow(rr / mix(0.1, 0.18, vFlake), 2.0)) * mix(1.7, 0.7, vFlake) + exp(-pow(rr / 0.45, 2.0)) * 0.08;
  cover = mix(cover, glow, halo);
  float i = cover * vFaint * vLight * (0.4 + 0.6 * vDepth) * mix(1.0, 0.35, vNear);
  vec3 c = mix(calm, vTint, clamp(vSpec * 1.2, 0.0, 1.0));
  c = mix(c, c * c * 1.6, 0.35);
  o = vec4(c * i, i);
}`;

// A far field of faint stars behind the dust. They live in a box that wraps
// around the camera, offset by everything it has travelled (\`travel\`), so
// when the camera moves the near dust streams past and the stars barely
// shift: the depth the move happens in.
const starVertex = `#version 300 es
precision highp float;
uniform float aspect; uniform vec2 cam; uniform vec3 travel; uniform float dpr; uniform float time; uniform float galaxy;
out float vA; out vec3 vC;
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
  // Landing: fewer and dimmer towards the top, with no bright ones up there.
  float sky = galaxy * smoothstep(-0.2, 0.7, s.y);
  if (hs(i * 11.3) > mix(1.0, 0.25, sky)) gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
  float bright = step(0.97, hs(i * 9.7)) * (1.0 - sky);
  vA *= (1.4 + bright * 2.5) * mix(1.0, 0.6, sky);
  // Blue-white, warm and pale violet stars, a few of them bright.
  float t = hs(i * 4.3);
  vC = t < 0.45 ? vec3(0.7, 0.82, 1.0) : (t < 0.75 ? vec3(1.0, 0.86, 0.7) : vec3(0.85, 0.72, 1.0));
  gl_PointSize = mix(1.0, 1.8, smoothstep(6.0, 12.0, w.z)) * (1.0 + bright * 1.6) * dpr;
}`;
const starFragment = `#version 300 es
precision highp float; in float vA; in vec3 vC; out vec4 o;
void main() {
  float a = smoothstep(0.5, 0.1, length(gl_PointCoord - 0.5)) * vA * 0.7;
  o = vec4(vC * a, a);
}`;

// The look (after byotone.com): the summed light of the grains, ordered-
// dithered on a slightly rotated grid of ~1.5 CSS px cells into a few tone
// levels, so the field reads as printed stipple in colour on the ground,
// with a faint film grain over the empty ground that steps 8 times a second.
const ditherFragment = `#version 300 es
precision highp float; in vec2 v; out vec4 o;
uniform sampler2D scene; uniform float dpr; uniform float grainTime;
uniform vec3 ground; uniform vec3 ink;
uniform float time; uniform float light;
uniform float halo;  // the light theme: glow on the dawn ground instead of the printed look
float hash(vec2 p) {
  vec3 q = fract(vec3(p.xyx) * 0.1031);
  q += dot(q, q.yzx + 33.33);
  return fract((q.x + q.y) * q.z);
}
// 4x4 Bayer threshold, 0..1.
float bayer(vec2 p) {
  vec2 c = mod(p, 4.0);
  vec2 h = floor(c * 0.5), b = c - h * 2.0;
  float lo = mod(b.x * 2.0 + b.y * 3.0, 4.0), hi = mod(h.x * 2.0 + h.y * 3.0, 4.0);
  return (lo * 4.0 + hi + 0.5) / 16.0;
}
float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
}
float fbm(vec2 p) { float a = 0.5, s = 0.0; for (int k = 0; k < 4; k++) { s += a * vnoise(p); p = p * 2.03 + 11.7; a *= 0.5; } return s; }
void main() {
  vec3 light3 = texture(scene, v).rgb;
  vec2 css = gl_FragCoord.xy / max(1.0, dpr);
  // A trace of nebula drifting behind everything (blue, violet,
  // teal, a little magenta), stippled with the rest.
  {
    vec2 q = css / 520.0 + vec2(time * 0.006, -time * 0.004);
    float n1 = fbm(q), n2 = fbm(q * 1.7 + 4.2), n3 = fbm(q * 0.8 - 7.1);
    vec3 neb = vec3(0.25, 0.4, 1.0) * smoothstep(0.45, 0.85, n1)
      + vec3(0.6, 0.3, 1.0) * smoothstep(0.5, 0.9, n2)
      + vec3(0.2, 0.85, 0.8) * smoothstep(0.58, 0.95, n3) * 0.7
      + vec3(1.0, 0.35, 0.7) * smoothstep(0.62, 0.95, n1 * n2 * 1.6) * 0.6;
    // Clear towards the top: patches of it up there read as clumps.
    light3 += neb * 0.045 * (1.0 - smoothstep(0.35, 0.8, v.y));
  }
  float lum = max(light3.r, max(light3.g, light3.b));
  float signal = pow(clamp(lum * 1.6, 0.0, 1.0), 0.72);
  signal = smoothstep(0.025, 0.96, signal);
  vec3 hue = light3 / max(lum, 1e-4);
  float an = 0.205;
  vec2 cell = floor(mat2(cos(an), -sin(an), sin(an), cos(an)) * css / 1.55);
  float threshold = mix(bayer(cell), hash(cell), 0.1);
  float cover = clamp(floor(signal * 5.0 + threshold) / 5.0, 0.0, 1.0);
  float g = hash(cell + vec2(grainTime * 7.0, grainTime * 3.0));
  vec3 base = mix(ground, ink, g * g * 0.05);
  // Each dot is printed in the colour of its light (bright on the dark
  // ground, a deeper shade on the light page).
  // Light: saturated and bright (the strongest channel near full), not a
  // darkened shade, so the page sparkles instead of looking inked.
  vec3 vivid = clamp(mix(vec3(dot(hue, vec3(0.3, 0.5, 0.2))), hue, 1.6), 0.0, 1.0);
  vivid = vivid / max(max(vivid.r, max(vivid.g, vivid.b)), 1e-3) * 0.9;
  vec3 coloured = mix(mix(vec3(0.62), hue, 0.85) * 1.05, vivid, light);
  o = vec4(mix(base, coloured, cover), 1.0);
  // Light theme: the grains glow instead of being printed. The ground steps
  // down from white to a dawn gradient (peach below, lilac middle, pale sky
  // above) so light can rise above it; each halo tints the ground towards its pastel
  // colour, and dense, bright spots burn through to a near-white core.
  if (halo > 0.001) {
    vec3 dawn = mix(vec3(0.965, 0.894, 0.855), vec3(0.855, 0.902, 0.965), smoothstep(0.0, 1.0, v.y));
    dawn = mix(dawn, vec3(0.918, 0.886, 0.957), exp(-pow((v.y - 0.5) / 0.22, 2.0)) * 0.5);
    vec3 paper = dawn;
    paper += (hash(cell + vec2(grainTime * 7.0, grainTime * 3.0)) - 0.5) * 0.012;
    float aura = 1.0 - exp(-lum * 1.4);
    vec3 col = mix(paper, vivid, aura * 0.9);
    col = mix(col, mix(vivid, vec3(1.0), 0.7), smoothstep(1.0, 2.6, lum) * 0.85);
    o = vec4(mix(o.rgb, col, halo), 1.0);
  }
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
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
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
    const pInit = link(quadVertex, initFragment), pVel = link(quadVertex, velocityFragment), pPos = link(quadVertex, positionFragment), pDraw = link(drawVertex, drawFragment);
    const pStar = link(starVertex, starFragment), pDither = link(quadVertex, ditherFragment);
    const quad = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const vaoQuad = gl.createVertexArray();
    gl.bindVertexArray(vaoQuad);
    for (const p of [pInit, pVel, pPos, pDither]) { const at = gl.getAttribLocation(p, "a"); gl.enableVertexAttribArray(at); gl.vertexAttribPointer(at, 2, gl.FLOAT, false, 0, 0); }
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
    // The grains' summed light, before the dither pass.
    const scene = { texture: gl.createTexture()!, framebuffer: gl.createFramebuffer()!, w: 0, h: 0 };
    const sizeScene = () => {
      if (scene.w === width && scene.h === height) return;
      scene.w = width; scene.h = height;
      gl.bindTexture(gl.TEXTURE_2D, scene.texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, width, height, 0, gl.RGBA, gl.HALF_FLOAT, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.bindFramebuffer(gl.FRAMEBUFFER, scene.framebuffer);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, scene.texture, 0);
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
    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      const rect = el.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = 1 - ((event.clientY - rect.top) / rect.height) * 2;
      mouse.cx = event.clientX; mouse.cy = event.clientY;
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    const colours = { calm: [...start.calm], fast: [...start.fast], accent: [...start.accent], light: lightTarget, focus: 0, spectrum: 0, bolt: 0, galaxy: start.symbol === 0 ? 1 : 0 };
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
      const k = 1 - Math.exp(-dt / 0.2);
      (["calm", "fast", "accent"] as const).forEach((key) => { for (let i = 0; i < 3; i++) colours[key][i] += (target[key][i] - colours[key][i]) * k; });
      colours.light += (lightTarget - colours.light) * k;
      colours.spectrum += ((target.symbol === 1 ? 1 : 0) - colours.spectrum) * k;
      colours.bolt += ((target.symbol === 2 ? 1 : 0) - colours.bolt) * k;
      colours.galaxy += ((target.symbol === 0 ? 1 : 0) - colours.galaxy) * k;
      // The landing galaxy gathers nearly as tightly as a case's form, so it reads as a spiral.
      colours.focus += ((target.symbol > 0 ? 1 : 0.85) - colours.focus) * (1 - Math.exp(-dt / 0.2));
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
          // No fly-through (after byotone.com): the grains flow into the new
          // form where they are.
          trip.arrive = [0, 0, 0];
        }
        trip.symbol = target.symbol;
      }
      let tu = Math.min(1, (clock - trip.at) / TRIP);
      if (tu >= 1 && trip.arrive[2] !== 0) rebase(1);
      const travelling = trip.arrive[2] !== 0;
      const e = travelling ? ease(tu) : 0;
      // How far the camera has got: sideways and up as the world shifts, forward as depth.
      const move = [trip.arrive[0] * e, trip.arrive[1] * e, -trip.arrive[2] * e];
      // The dust sets off towards the new form at once and keeps flowing
      // there through the whole trip (it used to hold still and then gather
      // in the last stretch, which read as a late snap, not a move).
      const hold = travelling ? 0.35 + 0.65 * ease(Math.min(1, tu / 0.7)) : 1;
      if (!travelling) tu = 1;
      // The entrance: the camera comes forward from 1.6 units back over 2.5s,
      // eased in and out, while the gathered form blooms outward.
      const wake = Math.min(1, clock / 2.5);
      const awake = wake < 0.5 ? 4 * wake ** 3 : 1 - 4 * (1 - wake) ** 3;
      const approach = 1.6 * (1 - awake);
      const logo = target.symbol === 1 || target.symbol === 2;
      const inside = Math.abs(mouse.x) <= 1 && Math.abs(mouse.y) <= 1;
      const ck = 1 - Math.exp(-dt / 1.2);
      // A logo stays square-on: the lean nearly stops while it shows.
      const lean = inside ? (logo ? 0.2 : 1) : 0;
      cam.x += (mouse.x * lean - cam.x) * ck; cam.y += (mouse.y * lean - cam.y) * ck;
      // A jump (the mouse entering the stage) is not a sweep.
      let vx = mouse.x - mouse.px, vy = mouse.y - mouse.py;
      if (Math.hypot(vx, vy) > 0.3) { vx = 0; vy = 0; }
      mouse.px = mouse.x; mouse.py = mouse.y;
      pass(pVel, V[1], () => {
        bind(pVel, "pos", 0, P[0].texture); bind(pVel, "vel", 1, V[0].texture);
        gl.uniform1f(uniform(pVel, "dt"), dt); gl.uniform1f(uniform(pVel, "time"), clock); gl.uniform1f(uniform(pVel, "symbol"), target.symbol); gl.uniform1f(uniform(pVel, "SIZE"), SIZE);
        gl.uniform2f(uniform(pVel, "cam"), cam.x, cam.y); gl.uniform3f(uniform(pVel, "move"), move[0], move[1], move[2]); gl.uniform1f(uniform(pVel, "approach"), approach); gl.uniform3f(uniform(pVel, "arrive"), trip.arrive[0], trip.arrive[1], trip.arrive[2]); gl.uniform1f(uniform(pVel, "hold"), hold);
        gl.uniform2f(uniform(pVel, "mouse"), mouse.x, mouse.y); gl.uniform2f(uniform(pVel, "mouseVel"), vx, vy); gl.uniform1f(uniform(pVel, "aspect"), width / height);
        gl.uniform1f(uniform(pVel, "gather"), logo ? 14 : 4); gl.uniform1f(uniform(pVel, "damp"), logo ? 6.5 : 3.6); gl.uniform1f(uniform(pVel, "focus"), colours.focus); gl.uniform1f(uniform(pVel, "lightTheme"), lightTarget); gl.uniform1f(uniform(pVel, "stir"), logo ? 0.02 : 0.18 - 0.14 * colours.galaxy);
      });
      V.reverse();
      pass(pPos, P[1], () => {
        bind(pPos, "pos", 0, P[0].texture); bind(pPos, "vel", 1, V[0].texture); gl.uniform1f(uniform(pPos, "dt"), dt);
        gl.uniform3f(uniform(pPos, "shift"), shift[0], shift[1], shift[2]); gl.uniform1f(uniform(pPos, "travelling"), travelling ? 1 : 0);
        gl.uniform3f(uniform(pPos, "move"), move[0], move[1], move[2]); gl.uniform3f(uniform(pPos, "arrive"), trip.arrive[0], trip.arrive[1], trip.arrive[2]);
        gl.uniform1f(uniform(pPos, "time"), clock); gl.uniform1f(uniform(pPos, "symbol"), target.symbol); gl.uniform1f(uniform(pPos, "SIZE"), SIZE); gl.uniform1f(uniform(pPos, "focus"), colours.focus); gl.uniform1f(uniform(pPos, "lightTheme"), lightTarget);
      });
      P.reverse();

      // 1. The grains' light into the scene target, added up.
      sizeScene();
      gl.bindFramebuffer(gl.FRAMEBUFFER, scene.framebuffer);
      gl.viewport(0, 0, width, height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE);
      // The far stars round the form.
      gl.useProgram(pStar);
      gl.bindVertexArray(vaoDraw);
      gl.uniform1f(uniform(pStar, "aspect"), width / height); gl.uniform2f(uniform(pStar, "cam"), cam.x, cam.y); gl.uniform1f(uniform(pStar, "dpr"), dpr); gl.uniform1f(uniform(pStar, "time"), clock);
      gl.uniform1f(uniform(pStar, "approach"), approach); gl.uniform1f(uniform(pStar, "galaxy"), colours.galaxy);
      gl.uniform3f(uniform(pStar, "travel"), trip.travel[0] + trip.arrive[0] * e, trip.travel[1] + trip.arrive[1] * e, trip.travel[2] + trip.arrive[2] * e);
      gl.drawArrays(gl.POINTS, 0, 4200);
      gl.useProgram(pDraw);
      gl.bindVertexArray(vaoDraw);
      bind(pDraw, "pos", 0, P[0].texture); bind(pDraw, "vel", 1, V[0].texture);
      gl.uniform1f(uniform(pDraw, "SIZE"), SIZE); gl.uniform1f(uniform(pDraw, "aspect"), width / height); gl.uniform1f(uniform(pDraw, "symbol"), target.symbol);
      gl.uniform3f(uniform(pDraw, "arrive"), trip.arrive[0], trip.arrive[1], trip.arrive[2]); gl.uniform1f(uniform(pDraw, "approach"), approach);
      gl.uniform1f(uniform(pDraw, "time"), clock); gl.uniform2f(uniform(pDraw, "mouse"), mouse.x, mouse.y); gl.uniform2f(uniform(pDraw, "cam"), cam.x, cam.y); gl.uniform3f(uniform(pDraw, "move"), move[0], move[1], move[2]);
      gl.uniform1f(uniform(pDraw, "light"), colours.light);
      gl.uniform1f(uniform(pDraw, "spectrum"), colours.spectrum);
      gl.uniform1f(uniform(pDraw, "bolt"), colours.bolt);
      gl.uniform1f(uniform(pDraw, "galaxy"), colours.galaxy);
      if (clearTick++ % 10 === 0) readClear();
      gl.uniform1f(uniform(pDraw, "dpr"), dpr);
      gl.uniform4f(uniform(pDraw, "clearRect"), clear[0], clear[1], clear[2], clear[3]);
      gl.uniform1f(uniform(pDraw, "keep"), 0.35 + 0.3 * Math.min(1, colours.spectrum + colours.bolt));
      gl.uniform3fv(uniform(pDraw, "calm"), colours.calm); gl.uniform1f(uniform(pDraw, "halo"), colours.light);
      gl.drawArrays(gl.POINTS, 0, SIZE * SIZE);
      // 2. Dithered onto the ground, opaque, each dot in its light's colour.
      // Dark: a deep blue-black space; light: deeper shades on the page.
      gl.disable(gl.BLEND);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.useProgram(pDither);
      gl.bindVertexArray(vaoQuad);
      bind(pDither, "scene", 0, scene.texture);
      gl.uniform1f(uniform(pDither, "dpr"), dpr);
      gl.uniform1f(uniform(pDither, "grainTime"), Math.floor(now / 125) % 1024);
      gl.uniform1f(uniform(pDither, "time"), clock); gl.uniform1f(uniform(pDither, "light"), colours.light);
      gl.uniform1f(uniform(pDither, "halo"), colours.light);
      const L = colours.light;
      const mixc = (a: number[], b: number[], t: number) => a.map((x, i) => x + (b[i] - x) * t);
      const ground = mixc([10 / 255, 11 / 255, 20 / 255], [238 / 255, 240 / 255, 238 / 255], L);
      // The film grain over the ground.
      const grain = mixc([166 / 255, 162 / 255, 152 / 255], [52 / 255, 54 / 255, 58 / 255], L);
      gl.uniform3fv(uniform(pDither, "ground"), ground);
      gl.uniform3fv(uniform(pDither, "ink"), grain);
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
      [...P, ...V].forEach(({ texture, framebuffer }) => { gl.deleteTexture(texture); gl.deleteFramebuffer(framebuffer); });
      [pInit, pVel, pPos, pDraw, pStar, pDither].forEach((p) => gl.deleteProgram(p));
      gl.deleteTexture(scene.texture); gl.deleteFramebuffer(scene.framebuffer);
      gl.deleteBuffer(quad);
    };
  }, []);

  return <canvas ref={canvas} className={className} aria-hidden="true" />;
}
