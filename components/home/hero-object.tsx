"use client";


import { useEffect, useRef, useState } from "react";
import { DUST_LOOK_EVENT, readDustLook } from "@/components/home/dust-looks";

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
// - portrait (hovering About): the owner's photo across the whole stage, each
//   grain sent to a spot sampled from it and printed in the colour it has there
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
uniform float ground; // the landscape's height: lower where the copy sits above it
uniform float SIZE;
uniform float lightTheme;  // 1 in the light theme
uniform float focus;  // 0.85 on the landing galaxy, 1 while a case is hovered: the form gathers tighter
uniform sampler2D portrait;  // per grain: its spot in the portrait (xyz) and how bright it is there (w)
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
const float BOLT_SCALE = 1.7;
const vec2 BOLT_AT = vec2(-1.42, -0.19);
uniform float look;
// Where point n of the form leans: the form, with a wide halo of dust.
vec3 formOf(float n, vec2 uv) {
  float a = hq(n, 1u), b = hq(n, 2u), c = hq(n, 3u), g = hq(n, 4u);
  vec3 j = vec3(hq(n, 5u), hq(n, 6u), hq(n, 7u)) - 0.5;
  vec3 p; float loose = mix(0.4, 4.2, pow(g, 1.2));
  // Temporary: the landing form options (Menu row). One clear form right of centre.
  if (symbol < 0.5 && look > 0.5) {
    float t = time * 0.06;
    vec3 q;
    if (look < 1.5) {
      // D1: one thin ring (after byotone.com).
      float th = b * 6.2831853, w = (c - 0.5);
      q = vec3(cos(th), sin(th), 0.0) * (1.0 + w * 0.09) + vec3(0.0, 0.0, (hq(n, 17u) - 0.5) * 0.06);
      q.yz = mat2(cos(1.05), -sin(1.05), sin(1.05), cos(1.05)) * q.yz;
    } else if (look < 2.5) {
      // D2: a thick torus, tilted.
      float th = b * 6.2831853, ph = c * 6.2831853;
      q = vec3((1.0 + 0.32 * cos(ph)) * cos(th), (1.0 + 0.32 * cos(ph)) * sin(th), 0.32 * sin(ph));
      q.yz = mat2(cos(1.1), -sin(1.1), sin(1.1), cos(1.1)) * q.yz;
    } else if (look < 3.5) {
      // D3: a sphere, dust on its surface.
      float z = c * 2.0 - 1.0, th = b * 6.2831853;
      q = vec3(sqrt(1.0 - z * z) * cos(th), z, sqrt(1.0 - z * z) * sin(th));
    } else if (look < 4.5) {
      // D4: a small sphere inside a wide ring (a planet).
      float th = b * 6.2831853;
      if (a < 0.45) {
        float z = c * 2.0 - 1.0;
        q = vec3(sqrt(1.0 - z * z) * cos(th), z, sqrt(1.0 - z * z) * sin(th)) * 0.62;
      } else {
        q = vec3(cos(th), 0.0, sin(th)) * mix(1.05, 1.5, c);
        q.xy = mat2(cos(0.35), -sin(0.35), sin(0.35), cos(0.35)) * q.xy;
        q.yz = mat2(cos(0.32), -sin(0.32), sin(0.32), cos(0.32)) * q.yz;
      }
    } else {
      // D5: two crossing rings (a gyroscope).
      float th = b * 6.2831853, w = (c - 0.5) * 0.07;
      q = vec3(cos(th), sin(th), 0.0) * (1.0 + w);
      float k = a < 0.5 ? 0.9 : -0.9;
      q.xz = mat2(cos(k), -sin(k), sin(k), cos(k)) * q.xz;
      q.yz = mat2(cos(0.4), -sin(0.4), sin(0.4), cos(0.4)) * q.yz;
    }
    // Turning slowly about the vertical axis.
    q.xz = mat2(cos(t), -sin(t), sin(t), cos(t)) * q.xz;
    float haze = g > 0.9 ? 0.25 : 0.02;
    return q * 1.4 + j * haze + vec3(1.75, -0.3, 0.0);
  }
  if (symbol > 2.5 || symbol < 0.5) {
    // The landing (and About): a landscape of dots, seen low from the front,
    // spread across the whole stage: a regular grid rolling into slow waves,
    // rising into ridges at the sides, with faint, loose streams of data
    // falling behind it.
    // The landing keeps almost everything on the surface, so the wave reads as one form.
    if (a < (symbol < 0.5 ? 0.92 : 0.82)) {
      vec2 gp = (floor(uv * SIZE) + 0.5) / SIZE;
      // Temporary draft B2: the same wave, narrower, so it reads as one form.
      float x = (gp.x - 0.5) * 6.4, z = (gp.y - 0.5) * 4.0 - 0.9;
      float ridge = smoothstep(0.8, 3.0, abs(x)) * (0.55 + 0.45 * sin(x * 2.3 + z * 1.7));
      float y = 0.42 * sin(x * 1.4 + time * 0.35) * cos(z * 1.9 - time * 0.25) + 0.14 * sin(x * 4.1 + z * 3.3 + time * 0.5) + ridge * 1.2;
      // The landing: one slow extra bend so the curve isn't a clean sine, a little taller.
      if (symbol < 0.5) y = y * 1.1 + 0.2 * sin(x * 0.73 + z * 2.1 + 1.7 + time * 0.11);
      // The middle sinks, so the band reads as a soft bowl between the side ridges.
      y -= 0.5 * exp(-x * x / 2.4);
      // Tilted towards the viewer, so the rows open out down the screen.
      p = vec3(x, y + (z + 0.9) * (symbol < 0.5 ? 0.55 : 0.42) + ground, z);
      loose *= symbol < 0.5 ? 0.1 : 0.06;
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
    // Large and tall at the left of the card, the name over its lower part
    // (metalab.com's Midjourney head).
    p = vec3(q * BOLT_SCALE + BOLT_AT, (hq(n, 17u) - 0.5) * 0.2);
  } else {
    // The Gemini sparkle: a four-point star with concave sides, filled with a
    // thick band of dust inside its edge rather than a thin outline, so its
    // arms read as solid strokes.
    float t = b * 6.2831853;
    vec2 dir = vec2(cos(t), sin(t));
    float r = 1.2 / pow(pow(abs(dir.x), 0.5) + pow(abs(dir.y), 0.5), 2.0);
    float fill = a < 0.6 ? mix(0.62, 1.0, sqrt(c)) : sqrt(c);
    // Large behind the copy, above the card (metalab.com's Atlantic head).
    p = vec3(dir * r * fill * 1.2 + vec2(-0.2, 0.23), (hq(n, 18u) - 0.5) * 0.2);
    loose *= a < 0.6 ? 0.6 : 0.75;
  }
  // While a case is hovered, most of the dust draws in so the form shows;
  // the widest third stays out as haze.
  // A case's form keeps only a thin haze round it, so the shape reads.
  loose *= mix(1.0, mix(0.22, symbol > 0.5 ? 0.7 : 0.35, step(0.8, g)), focus);
  return p * 1.6 + j * loose * vec3(1.6, symbol < 0.5 ? 2.6 : 1.35, 1.0) + vec3(0.35, mix(-0.05, 0.12, focus), 0.0);
}
// Where each particle leans.
vec3 homeOf(vec2 uv) {
  if (symbol > 3.5) return texture(portrait, uv).xyz;
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
  // Start almost in place: on load the form opens out the last bit
  // while the camera comes forward, so it reads from the first frame.
  o = which < 0.5 ? vec4(homeOf(v) * 0.9 + jitter * 0.1, 1.0) : vec4(0.0);
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
  u += (homeOf(v) + arrive - p) * mix(gather, gather * 3.0, focus) * hold * dt;
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
  u.xy += (mv * 0.3 + normalize(d + 1e-4) * length(mv) * 0.35) * k * dt * 2.0;
  u.y += k * 0.7 * mix(0.3, 1.0, step(symbol, 0.5) + step(2.5, symbol)) * dt;
  // Damped enough that a change of form flows in and settles without wobbling.
  u *= exp(-dt * damp);
  o = vec4(u, 1.0);
}`;

const positionFragment = `#version 300 es
precision highp float; in vec2 v; out vec4 o;
${common}
${view}
uniform sampler2D pos; uniform sampler2D vel; uniform float dt; uniform vec3 shift; uniform float travelling; uniform float catchUp;
void main() {
  vec3 p = texture(pos, v).xyz + texture(vel, v).xyz * dt + shift;
  // Dust the camera flies past reappears at its place in the new form ahead,
  // so the form is waiting there when the camera arrives.
  if (travelling > 0.5 && 5.0 - (p.z + move.z) < 0.5) p = homeOf(v) + arrive;
  // The portrait is timed by the clock, not the simulation, so it has formed by
  // the time the photo arrives whatever the frame rate.
  if (symbol > 3.5) p = mix(p, homeOf(v), catchUp);
  o = vec4(p, 1.0);
}`;

const drawVertex = `#version 300 es
precision highp float;
uniform float look; uniform float formDim; uniform sampler2D pos; uniform sampler2D vel; uniform float SIZE; uniform float aspect; uniform float symbol; uniform float time; uniform vec2 mouse; uniform float spectrum; uniform float bolt; uniform float galaxy; uniform float light; uniform float dpr; uniform vec4 clearRect[4]; uniform vec2 cam; uniform float skyFrom; uniform float ground;
uniform float keep;  // the share of the simulation drawn
uniform float portraitMix; uniform sampler2D portrait; uniform sampler2D portraitColor;
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
  vec2 g = (p.xy - vec2(0.03, 0.488)) / 1.2;
  float ga = atan(g.y, g.x);
  vec3 tips = vec3(0.26, 0.52, 1.0) * max(cos(ga), 0.0) + vec3(1.0, 0.42, 0.4) * max(sin(ga), 0.0)
    + vec3(1.0, 0.8, 0.25) * max(-cos(ga), 0.0) + vec3(0.2, 0.8, 0.5) * max(-sin(ga), 0.0);
  tips /= max(abs(cos(ga)) + abs(sin(ga)), 1e-3);
  vTint = tips;
  vSpec = spectrum * mix(0.55, 0.95, smoothstep(0.05, 0.7, length(g)));
  // Devsign: the logo's violet, cyan along the lower right, and a soft
  // white sheen across the upper slab.
  // The bolt's own coordinates, wherever formOf sets it (scale 1.7 at (-1.42, -0.19)).
  vec2 d = ((p.xy - vec2(0.35, 0.12)) / 1.6 - vec2(-1.42, -0.19)) / 1.7;
  float cyan = smoothstep(0.25, 0.55, dot(d, normalize(vec2(1.0, -0.7))));
  float sheen = exp(-pow(dot(d - vec2(-0.25, 0.35), normalize(vec2(0.3, 1.0))) / 0.08, 2.0)) * 0.6;
  vec3 boltTint = mix(mix(vec3(0.56, 0.28, 1.0), vec3(0.3, 0.8, 1.0), cyan), vec3(0.95, 0.9, 1.0), sheen);
  vTint = mix(vTint, boltTint, bolt);
  vSpec = mix(vSpec, 0.85, bolt);
  // The landing galaxy is the richest: every project's colour wound through
  // its arms (blue, violet, teal, a touch of pink) round a warm white core.
  vec2 gq = (p.xy - vec2(0.35, 0.4 + ground)) / vec2(4.5, 1.9);
  float gr = length(gq), gt = atan(gq.y, gq.x);
  float wave = 0.5 + 0.5 * sin(gt * 2.0 + gr * 3.5 - time * 0.05);
  // Dark: one hue, deep periwinkle in the troughs rising to ice on the crests,
  // so brightness draws the wave instead of a mix of colours.
  vec3 arms = mix(vec3(0.26, 0.34, 0.92), vec3(0.84, 0.89, 1.0), smoothstep(-0.7, 0.9, p.y - ground));
  // Most of the way back to the earlier blue, violet and teal, keeping a little of the lit crests.
  vec3 mixedArms = mix(mix(vec3(0.38, 0.6, 1.0), vec3(0.56, 0.42, 1.0), wave), vec3(0.32, 0.86, 0.96), smoothstep(0.55, 1.0, sin(gt * 3.0 - gr * 2.0) * 0.5 + 0.5) * 0.7);
  mixedArms = mix(mixedArms, vec3(0.82, 0.62, 1.0), smoothstep(0.75, 1.0, wave) * smoothstep(0.4, 1.2, gr) * 0.6);
  arms = mix(arms, mixedArms, 0.65);
  vec3 galaxyTint = mix(arms, vec3(0.96, 0.95, 1.0), exp(-gr * gr / 0.06) * 0.3);
  // Light theme: a brighter, sunnier palette on the pale page (sky blue,
  // violet, hot pink, coral, mint) with no grey core, so it reads as
  // glitter rather than ink.
  vec3 lightArms = mix(mix(vec3(0.2, 0.62, 1.0), vec3(0.58, 0.36, 1.0), wave), vec3(1.0, 0.3, 0.62), smoothstep(0.55, 1.0, sin(gt * 3.0 - gr * 2.0) * 0.5 + 0.5) * 0.8);
  lightArms = mix(lightArms, vec3(1.0, 0.55, 0.3), smoothstep(0.7, 1.0, wave) * 0.6);
  lightArms = mix(lightArms, vec3(0.1, 0.85, 0.7), smoothstep(0.8, 1.0, sin(gt * 5.0 + gr * 4.0) * 0.5 + 0.5) * 0.7);
  galaxyTint = mix(galaxyTint, lightArms, step(0.5, light));
  vTint = mix(vTint, galaxyTint, galaxy);
  vSpec = mix(vSpec, 0.8, galaxy);
  // The portrait: each grain in the photo's colour at its spot.
  vTint = mix(vTint, texture(portraitColor, uv).rgb, portraitMix);
  vSpec = mix(vSpec, 1.0, portraitMix);
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
  // A case's form is the backdrop: its colour stays, but it sits well below the
  // card, which is the brightest thing on the stage (metalab.com).
  vFaint *= mix(1.0, mix(0.6, 0.55, light), formDim);
  vTint = mix(vTint, vec3(dot(vTint, vec3(0.3, 0.6, 0.1))), 0.15 * formDim);
  // In the dark the landing galaxy shines brighter than any project's form.
  vFaint *= 1.0 + 0.7 * galaxy * (1.0 - light);
  // Light theme: ink on a pale page needs a little more body to read.
  float px = (size * mix(1.0, 1.1, light) + vSize * mix(3.0, 1.5, light)) * dpr;
  // Below a device pixel a point can't shrink, so it fades instead.
  vFaint *= min(px, 1.0);
  // The case's paragraph stays readable: dust behind it (with a soft margin)
  // all but disappears. clearRect is its box in clip space (x0, y0, x1, y1).
  for (int i = 0; i < 4; i++) {
    vec4 c = clearRect[i];
    // The note gets a wider soft edge, so the dust thins around it too, not only under the letters.
    vec2 m = i == 1 ? vec2(0.12, 0.22) : vec2(0.05, 0.08);
    float inside = smoothstep(c.x - m.x, c.x, s.x) * smoothstep(c.z + m.x, c.z, s.x)
      * smoothstep(c.y - m.y, c.y, s.y) * smoothstep(c.w + m.y, c.w, s.y);
    // The last box is the big name: its form still shows through.
    // The landing's note (slot 1) only thins the dust, so the band still passes behind it.
    vFaint *= 1.0 - (i == 3 ? 0.55 : i == 1 ? 0.88 : 0.85) * inside;
  }
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
  // Only the middle of the sky thins early; the sides keep their ridges as before.
  float side = smoothstep(0.25, 0.7, abs(s.x));
  float sky = galaxy * smoothstep(mix(skyFrom, 0.3, side), mix(skyFrom, 0.3, side) + mix(0.6, 0.8, side), s.y);
  // Landing: slow patches of dense and thin dust drifting over the surface,
  // so the field gathers and opens instead of lying as one even sheet.
  float patchy = sin(p.x * 1.7 + p.z * 2.3 + time * 0.07) * sin(p.x * 3.9 - p.z * 1.4 + 1.3 - time * 0.05) + 0.5 * sin(p.x * 7.1 + p.z * 5.3 + time * 0.09);
  // One lead area right of centre, where the wave turns: packed and bright,
  // the dust scattering and dimming away from it towards the left.
  vec2 fromLead = (s - vec2(0.36, -0.22)) / vec2(0.55, 0.46);
  float lead = exp(-dot(fromLead, fromLead));
  float dense = max(smoothstep(-0.6, 0.8, patchy), lead);
  float kept = step(fract(vSeed * 97.31), keep * mix(1.0, mix(0.04, 0.12, side), sky) * mix(1.0, mix(0.32, 1.0, dense) * (1.0 + 2.0 * lead) * smoothstep(-0.8, -0.32, s.y), galaxy));
  if (look > 0.5 && galaxy > 0.5) kept = step(fract(vSeed * 97.31), 0.55);
  sky *= 1.0 - step(0.5, look);
  // Mostly small grains, about one in eight a larger flake, so the field
  // has depth instead of an even texture. The sky keeps only the small ones.
  float flake = step(0.875, fract(vSeed * 71.9)) * (1.0 - sky) * (1.0 - portraitMix) * (1.0 - galaxy);
  vFlake = flake;
  vFaint *= kept * mix(0.55, 1.0, fract(vSeed * 53.7)) * mix(0.9, 1.15, flake) * mix(1.0, 0.6, sky) * mix(1.0, 0.7, flake * galaxy * (1.0 - light));
  // Most grains quiet, a few much brighter and larger, more of them where the dust is dense.
  float standout = pow(fract(vSeed * 37.7), 5.0);
  vFaint *= mix(1.0, mix(0.5, 1.2, dense) * (0.7 + mix(2.0, 0.8, light) * standout) * mix(0.75, 1.0, smoothstep(-0.9, 0.1, s.x)) * (1.0 + mix(2.2, 0.7, light) * lead), galaxy);
  // Temporary drafts: the form with depth (near grains larger and brighter).
  float draft = step(0.5, look) * galaxy;
  vFaint = mix(vFaint, vFaint * mix(0.3, 1.6, vDepth), draft);
  float bigger = 1.0 - max(portraitMix, halo);
  px = mix(mix(1.6, 2.4, vDepth) * mix(1.0, 1.45, bigger), mix(4.0, 6.0, vDepth) * mix(1.0, 1.2, bigger) * mix(1.0, 0.58, galaxy * (1.0 - light)), flake) * dpr;
  px *= mix(1.0, 0.72 + 0.55 * standout, galaxy * (1.0 - light));
  px *= mix(1.0, mix(0.7, 1.9, vDepth), draft);
  // Light theme: about one grain in twelve glints now and then (a slow,
  // sharp swell in size and brightness, each on its own beat).
  // The portrait: grains are brighter where the photo is.
  vFaint *= mix(1.0, texture(portrait, uv).w * 0.55, portraitMix);
  float tw = step(0.92, fract(vSeed * 37.7)) * step(0.5, light) * (1.0 - sky);
  float glint = tw * pow(0.5 + 0.5 * sin(time * mix(0.6, 1.4, fract(vSeed * 19.3)) + vSeed * 40.0), 14.0);
  vFaint *= 1.0 + glint * 3.0;
  px *= 1.0 + glint * 0.8;
  px *= mix(1.0, 5.0, halo);
  // Spread across the whole stage, each grain needs a little more body.
  px *= mix(1.0, 1.5, portraitMix);
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
uniform float aspect; uniform vec2 cam; uniform vec3 travel; uniform float dpr; uniform float time; uniform float galaxy; uniform float skyFrom;
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
  // Only the middle of the sky thins early; the sides keep their ridges as before.
  float side = smoothstep(0.25, 0.7, abs(s.x));
  float sky = galaxy * smoothstep(mix(skyFrom, 0.3, side), mix(skyFrom, 0.3, side) + mix(0.6, 0.8, side), s.y);
  if (hs(i * 11.3) > mix(1.0, 0.25, sky)) gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
  // Faint and all one cool tone: warm or bright ones read as specks on the screen.
  vA *= 0.7 * mix(1.0, 0.6, sky);
  vC = vec3(0.7, 0.8, 1.0);
  gl_PointSize = mix(1.6, 2.6, smoothstep(6.0, 12.0, w.z)) * dpr;
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
uniform float caseDim; uniform float halo;  // the light theme: glow on the dawn ground instead of the printed look
uniform sampler2D photo; uniform float photoMix; uniform vec2 photoScale; uniform vec2 photoCentre; uniform vec2 cssSize;
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
  // On the dark page the dots themselves dim while a case is shown: the print
  // has no brightness to lower otherwise, only fewer dots.
  vec3 coloured = mix(mix(vec3(0.62), hue, 0.85) * 1.05 * mix(1.0, 0.5, caseDim), vivid, light);
  o = vec4(mix(base, coloured, cover), 1.0);
  // Light theme: the grains glow instead of being printed. The ground steps
  // down from white to a dawn gradient (peach below, lilac middle, pale sky
  // above) so light can rise above it; each halo tints the ground towards its pastel
  // colour. Nothing burns to white: a pale centre on one grain reads as a hollow ring.
  if (halo > 0.001) {
    vec3 dawn = mix(vec3(0.965, 0.894, 0.855), vec3(0.855, 0.902, 0.965), smoothstep(0.0, 1.0, v.y));
    dawn = mix(dawn, vec3(0.918, 0.886, 0.957), exp(-pow((v.y - 0.5) / 0.22, 2.0)) * 0.5);
    vec3 paper = dawn;
    paper += (hash(cell + vec2(grainTime * 7.0, grainTime * 3.0)) - 0.5) * 0.012;
    float aura = 1.0 - exp(-lum * 1.4);
    vec3 col = mix(paper, vivid, aura * 0.9);
    o = vec4(mix(o.rgb, col, halo), 1.0);
  }
  // The portrait across the whole stage: the photo in round coloured dots on a
  // loose grid (each sized by its tone), every dot arriving at its own moment.
  if (photoMix > 0.001) {
    float size = 5.0, ta = 0.205;
    mat2 turn = mat2(cos(ta), -sin(ta), sin(ta), cos(ta));
    vec2 g = turn * css / size, id = floor(g);
    vec2 f = fract(g) - 0.5 + (vec2(hash(id + 3.1), hash(id + 7.7)) - 0.5) * 0.24;
    vec2 at = (transpose(turn) * ((id + 0.5) * size)) / cssSize;
    vec3 c = texture(photo, (vec2(at.x, 1.0 - at.y) - 0.5) * photoScale + photoCentre).rgb;
    float l = dot(c, vec3(0.3, 0.59, 0.11));
    float tone = smoothstep(0.06, 0.92, mix(l, 1.0 - l, light));
    float r = 0.08 + 0.36 * sqrt(tone);
    float start = hash(id + 11.3) * 0.65;
    float arrive = smoothstep(start, start + 0.35, photoMix);
    float d = (1.0 - smoothstep(r - 0.1, r + 0.03, length(f))) * arrive;
    // Colour kept a little stronger than the photo's: lifted on the dark page,
    // deepened on the light one so it stays above the ground.
    vec3 vividC = clamp(mix(vec3(l), c, 1.6), 0.0, 1.0);
    vec3 dotC = mix(mix(vividC, vec3(1.0), 0.06) * mix(1.15, 1.0, l), vividC * mix(0.92, 0.55, 1.0 - l), light);
    o.rgb = mix(o.rgb, dotC, d);
  }
}`;

// Per state: which form the dust leans to, and its colours (calm, stirred,
// accent).
export const OBJECT_STATES: Record<string, { symbol: number; calm: number[]; fast: number[]; accent: number[] }> = {
  default: { symbol: 0, calm: [0.42, 0.46, 0.85], fast: [1.0, 0.75, 0.88], accent: [0.5, 0.85, 0.9] },
  "gemini-privacy": { symbol: 1, calm: [0.25, 0.45, 1.0], fast: [0.85, 0.92, 1.0], accent: [0.42, 0.72, 1.0] },
  "devsign": { symbol: 2, calm: [0.5, 0.3, 0.95], fast: [1.0, 0.75, 0.95], accent: [0.85, 0.45, 0.95] },
  about: { symbol: 3, calm: [0.15, 0.72, 0.64], fast: [0.75, 1.0, 0.9], accent: [0.3, 0.9, 0.8] },
  portrait: { symbol: 4, calm: [0.62, 0.66, 1.0], fast: [0.9, 0.9, 1.0], accent: [0.7, 0.75, 1.0] },
};

// `active` false stops drawing after a short fade.
type Portrait = { image: HTMLImageElement };
export function HeroObject({ variant = "default", active = true, portrait, className }: { variant?: string; active?: boolean; portrait?: Portrait | null; className?: string }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const state = useRef(variant);
  useEffect(() => { state.current = variant; }, [variant]);
  // Temporary: which landing form option is on (see DustLooks in the Menu).
  const look = useRef(0);
  useEffect(() => {
    look.current = readDustLook();
    const onLook = (e: Event) => { look.current = (e as CustomEvent<number>).detail; };
    window.addEventListener(DUST_LOOK_EVENT, onLook);
    return () => window.removeEventListener(DUST_LOOK_EVENT, onLook);
  }, []);
  const running = useRef(active);
  const idleSince = useRef<number | null>(null);
  useEffect(() => { running.current = active; idleSince.current = active ? null : performance.now(); }, [active]);
  const buildPortrait = useRef<((next: Portrait) => void) | null>(null);
  useEffect(() => { if (portrait) buildPortrait.current?.(portrait); }, [portrait]);

  // Compiling the shaders blocks the page, so it waits for a free moment, briefly; phones also
  // wait for the load to finish and a moment more, since it costs them about half a second.
  const [started, setStarted] = useState(false);
  useEffect(() => {
    const phone = window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 768;
    let timer = 0, idle = 0;
    const go = () => { setStarted(true); };
    const schedule = () => {
      if (phone) { timer = window.setTimeout(go, 500); return; }
      // Safari has no requestIdleCallback, whatever the types say.
      if (typeof window.requestIdleCallback === "function") idle = window.requestIdleCallback(go, { timeout: 150 });
      else timer = setTimeout(go, 100) as unknown as number;
    };
    if (!phone || document.readyState === "complete") schedule();
    else window.addEventListener("load", schedule, { once: true });
    return () => {
      window.clearTimeout(timer);
      if (idle) window.cancelIdleCallback(idle);
      window.removeEventListener("load", schedule);
    };
  }, []);

  useEffect(() => {
    if (!started) return;
    const el = canvas.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const SIZE = window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 768 ? 150 : 216;
    // From 64rem the copy sits above the landscape, so the waves run lower.
    const wideStage = () => window.innerWidth >= 1024;
    const landHeight = () => -0.3;
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
    const portraitTarget = target(), portraitColor = target();
    el.dataset.live = "";
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
    [P[0], V[0]].forEach((to, which) => pass(pInit, to, () => { gl.uniform1f(uniform(pInit, "which"), which); gl.uniform1f(uniform(pInit, "look"), look.current); gl.uniform1f(uniform(pInit, "SIZE"), SIZE); gl.uniform1f(uniform(pInit, "symbol"), start.symbol); gl.uniform1f(uniform(pInit, "ground"), landHeight()); gl.uniform1f(uniform(pInit, "focus"), start.symbol > 0 ? 1 : 0.85); }));

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

    const colours = { calm: [...start.calm], fast: [...start.fast], accent: [...start.accent], light: lightTarget, focus: start.symbol > 0 ? 1 : 0.85, spectrum: 0, bolt: 0, about: 0, galaxy: start.symbol === 0 ? 1 : 0 };
    let visible = true;
    const io = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }, { threshold: 0 });
    io.observe(el);

    // The visible case paragraph's box in clip space, re-read now and then;
    // off-screen when none is shown.
    const clear = new Array(16).fill(9);
    let clearTick = 0;
    const readClear = () => {
      // A case's paragraph. On the landing itself the text simply lies over the dust.
      const parts = [...document.querySelectorAll<HTMLElement>(".home-world-problem[data-on]")];
      const boxes = parts.map((part) => part.getBoundingClientRect()).filter((box) => box.width > 0);
      const c = el.getBoundingClientRect();
      // The case's role and name, on wide screens, which sit apart from its paragraph.
      [".home-world-role[data-on]", ".home-world-name[data-on]"].forEach((selector, i) => {
        const box = wideStage() ? document.querySelector<HTMLElement>(selector)?.getBoundingClientRect() : undefined;
        const at = 8 + i * 4;
        if (!box) { clear.fill(9, at, at + 4); return; }
        clear[at] = ((box.left - c.left) / c.width) * 2 - 1; clear[at + 2] = ((box.right - c.left) / c.width) * 2 - 1;
        clear[at + 1] = 1 - ((box.bottom - c.top) / c.height) * 2; clear[at + 3] = 1 - ((box.top - c.top) / c.height) * 2;
      });
      // The landing's note, on wide screens while no case is shown: the dust thins behind it.
      const note = wideStage() ? document.querySelector<HTMLElement>(".home-note:not([data-swap]) .home-note-default")?.getBoundingClientRect() : undefined;
      if (note && note.width > 0) {
        clear[4] = ((note.left - c.left) / c.width) * 2 - 1; clear[6] = ((note.right - c.left) / c.width) * 2 - 1;
        clear[5] = 1 - ((note.bottom - c.top) / c.height) * 2; clear[7] = 1 - ((note.top - c.top) / c.height) * 2;
      } else clear.fill(9, 4, 8);
      // Nothing shown yet: the headline keeps clear of the dust too.
      const put = (at: number, box?: DOMRect) => {
        if (!box || !box.width) { clear.fill(9, at, at + 4); return; }
        clear[at] = ((box.left - c.left) / c.width) * 2 - 1; clear[at + 2] = ((box.right - c.left) / c.width) * 2 - 1;
        clear[at + 1] = 1 - ((box.bottom - c.top) / c.height) * 2; clear[at + 3] = 1 - ((box.top - c.top) / c.height) * 2;
      };
      if (!boxes.length) { put(0, wideStage() ? document.querySelector<HTMLElement>(".home-tagline-wrap")?.getBoundingClientRect() : undefined); return; }
      clear[0] = ((Math.min(...boxes.map((r) => r.left)) - c.left) / c.width) * 2 - 1; clear[2] = ((Math.max(...boxes.map((r) => r.right)) - c.left) / c.width) * 2 - 1;
      clear[1] = 1 - ((Math.max(...boxes.map((r) => r.bottom)) - c.top) / c.height) * 2; clear[3] = 1 - ((Math.min(...boxes.map((r) => r.top)) - c.top) / c.height) * 2;
    };
    const photoTexture = gl.createTexture()!;
    const photoScale = [1, 1], photoCentre = [0.5, 0.5];
    // Each grain's spot and colour in the portrait: the photo covers the stage,
    // and the dust is densest where it is bright on the dark page, or dark or
    // colourful on the light one, with a little more on the person.
    buildPortrait.current = ({ image }) => {
      const rect = el.getBoundingClientRect();
      const aspect = rect.width / rect.height, depth = 5 / 1.7;
      const W = Math.round(240 * Math.max(1, aspect)), H = Math.round(W / aspect);
      const c = document.createElement("canvas");
      c.width = W; c.height = H;
      const ctx = c.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;
      const iw = image.naturalWidth, ih = image.naturalHeight;
      const sw = Math.min(iw, ih * aspect), sh = sw / aspect;
      ctx.drawImage(image, (iw - sw) * 0.44, (ih - sh) * 0.3, sw, sh, 0, 0, W, H);
      const pixels = ctx.getImageData(0, 0, W, H).data;
      const dark = lightTarget === 0;
      const shade = new Float32Array(W * H), weight = new Float32Array(W * H);
      let peak = 0;
      for (let i = 0; i < W * H; i++) {
        const r = pixels[i * 4] / 255, g = pixels[i * 4 + 1] / 255, b = pixels[i * 4 + 2] / 255;
        const l = r * 0.3 + g * 0.59 + b * 0.11;
        const sat = Math.max(r, g, b) - Math.min(r, g, b);
        const x = (i % W) / W, y = Math.floor(i / W) / H;
        const person = Math.exp(-((x - 0.5) ** 2) / 0.05 - ((y - 0.45) ** 2) / 0.12);
        shade[i] = dark ? l : 1 - l;
        weight[i] = (Math.pow(shade[i], dark ? 1.4 : 1.2) + sat * 0.8) * (0.55 + 0.45 * person);
        peak = Math.max(peak, weight[i]);
      }
      const places = new Float32Array(SIZE * SIZE * 4), colours = new Float32Array(SIZE * SIZE * 4);
      for (let n = 0; n < SIZE * SIZE; n++) {
        let u = 0, v = 0, i = 0;
        for (let t = 0; t < 80; t++) {
          u = Math.random(); v = Math.random();
          i = Math.floor(v * H) * W + Math.floor(u * W);
          if (Math.random() * peak < weight[i]) break;
        }
        places.set([(u * 2 - 1) * aspect * depth, (1 - v * 2) * depth, (Math.random() - 0.5) * 0.03, 0.45 + shade[i] * 0.6], n * 4);
        // A little more saturated than the photo, so the colour survives the dither.
        const r = pixels[i * 4] / 255, g = pixels[i * 4 + 1] / 255, b = pixels[i * 4 + 2] / 255, l = (r + g + b) / 3;
        colours.set([l + (r - l) * 1.7, l + (g - l) * 1.7, l + (b - l) * 1.7, 1].map((value) => Math.max(0, Math.min(1, value))), n * 4);
      }
      gl.bindTexture(gl.TEXTURE_2D, portraitTarget.texture);
      gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, SIZE, SIZE, gl.RGBA, gl.FLOAT, places);
      gl.bindTexture(gl.TEXTURE_2D, portraitColor.texture);
      gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, SIZE, SIZE, gl.RGBA, gl.FLOAT, colours);
      // The photo itself, for the dots of the dither pass.
      gl.bindTexture(gl.TEXTURE_2D, photoTexture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, image);
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      const imageAspect = iw / ih;
      photoScale[0] = Math.min(1, aspect / imageAspect); photoScale[1] = Math.min(1, imageAspect / aspect);
      photoCentre[0] = (1 - photoScale[0]) * 0.44 + photoScale[0] / 2; photoCentre[1] = (1 - photoScale[1]) * 0.3 + photoScale[1] / 2;
    };
    let portraitMix = 0, photoMix = 0;
    let frame = 0, last = performance.now(), clock = 0;
    const draw = (now: number) => {
      frame = requestAnimationFrame(draw);
      const dt = Math.min(1 / 30, (now - last) / 1000);
      const elapsed = Math.min(0.25, (now - last) / 1000);
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
      colours.about += ((state.current === "about" ? 1 : 0) - colours.about) * k;
      colours.galaxy += ((target.symbol === 0 ? 1 : 0) - colours.galaxy) * k;
      const toPortrait = target.symbol === 4;
      portraitMix += ((toPortrait ? 1 : 0) - portraitMix) * k;
      const stepPhoto = elapsed;
      photoMix = toPortrait ? Math.min(1, photoMix + stepPhoto / 0.9) : Math.max(0, photoMix - stepPhoto / 0.35);
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
      // The entrance: the camera comes forward from 0.5 units back over 0.6s,
      // eased in and out, while the form opens out.
      const wake = Math.min(1, clock / 0.6);
      // The dust settles as fast, then eases into its usual slow pull.
      const early = Math.max(0, 1 - clock / 0.8);
      const awake = wake < 0.5 ? 4 * wake ** 3 : 1 - 4 * (1 - wake) ** 3;
      const approach = 0.5 * (1 - awake);
      // A logo gathers fast (settled in about a second); the flow is raised with
      // the pull so its loose shape stays the same.
      const logo = target.symbol === 1 || target.symbol === 2;
      const inside = !toPortrait && Math.abs(mouse.x) <= 1 && Math.abs(mouse.y) <= 1;
      const ck = 1 - Math.exp(-dt / (toPortrait ? 0.2 : 1.2));
      cam.x += ((inside ? mouse.x : 0) - cam.x) * ck; cam.y += ((inside ? mouse.y : 0) - cam.y) * ck;
      // A jump (the mouse entering the stage) is not a sweep.
      let vx = mouse.x - mouse.px, vy = mouse.y - mouse.py;
      if (toPortrait || Math.hypot(vx, vy) > 0.3) { vx = 0; vy = 0; }
      mouse.px = mouse.x; mouse.py = mouse.y;
      pass(pVel, V[1], () => {
        bind(pVel, "pos", 0, P[0].texture); bind(pVel, "vel", 1, V[0].texture); bind(pVel, "portrait", 2, portraitTarget.texture);
        gl.uniform1f(uniform(pVel, "look"), look.current); gl.uniform1f(uniform(pVel, "dt"), dt); gl.uniform1f(uniform(pVel, "time"), clock); gl.uniform1f(uniform(pVel, "symbol"), target.symbol); gl.uniform1f(uniform(pVel, "ground"), landHeight()); gl.uniform1f(uniform(pVel, "SIZE"), SIZE);
        gl.uniform2f(uniform(pVel, "cam"), cam.x, cam.y); gl.uniform3f(uniform(pVel, "move"), move[0], move[1], move[2]); gl.uniform1f(uniform(pVel, "approach"), approach); gl.uniform3f(uniform(pVel, "arrive"), trip.arrive[0], trip.arrive[1], trip.arrive[2]); gl.uniform1f(uniform(pVel, "hold"), hold);
        gl.uniform2f(uniform(pVel, "mouse"), toPortrait ? 9 : mouse.x, toPortrait ? 9 : mouse.y); gl.uniform2f(uniform(pVel, "mouseVel"), vx, vy); gl.uniform1f(uniform(pVel, "aspect"), width / height);
        gl.uniform1f(uniform(pVel, "gather"), toPortrait ? 0 : logo ? 4.6 : 1.15 + 3.45 * early); gl.uniform1f(uniform(pVel, "damp"), toPortrait ? 10 : logo ? 6.5 : 2.4 + 4.1 * early); gl.uniform1f(uniform(pVel, "focus"), colours.focus); gl.uniform1f(uniform(pVel, "lightTheme"), lightTarget); gl.uniform1f(uniform(pVel, "stir"), toPortrait ? 0 : logo ? 0.6 : 0.18 - 0.14 * colours.galaxy);
      });
      V.reverse();
      pass(pPos, P[1], () => {
        bind(pPos, "pos", 0, P[0].texture); bind(pPos, "vel", 1, V[0].texture); bind(pPos, "portrait", 2, portraitTarget.texture); gl.uniform1f(uniform(pPos, "dt"), dt);
        gl.uniform1f(uniform(pPos, "catchUp"), 1 - Math.exp(-elapsed * 6)); gl.uniform3f(uniform(pPos, "shift"), shift[0], shift[1], shift[2]); gl.uniform1f(uniform(pPos, "travelling"), travelling ? 1 : 0);
        gl.uniform3f(uniform(pPos, "move"), move[0], move[1], move[2]); gl.uniform3f(uniform(pPos, "arrive"), trip.arrive[0], trip.arrive[1], trip.arrive[2]);
        gl.uniform1f(uniform(pPos, "look"), look.current); gl.uniform1f(uniform(pPos, "time"), clock); gl.uniform1f(uniform(pPos, "symbol"), target.symbol); gl.uniform1f(uniform(pPos, "ground"), landHeight()); gl.uniform1f(uniform(pPos, "SIZE"), SIZE); gl.uniform1f(uniform(pPos, "focus"), colours.focus); gl.uniform1f(uniform(pPos, "lightTheme"), lightTarget);
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
      gl.uniform1f(uniform(pStar, "approach"), approach); gl.uniform1f(uniform(pStar, "galaxy"), colours.galaxy); gl.uniform1f(uniform(pStar, "skyFrom"), 0.06);
      gl.uniform3f(uniform(pStar, "travel"), trip.travel[0] + trip.arrive[0] * e, trip.travel[1] + trip.arrive[1] * e, trip.travel[2] + trip.arrive[2] * e);
      // The portrait keeps only a few of the far stars.
      gl.drawArrays(gl.POINTS, 0, Math.round(4200 * (1 - 0.8 * portraitMix)));
      gl.useProgram(pDraw);
      gl.bindVertexArray(vaoDraw);
      bind(pDraw, "pos", 0, P[0].texture); bind(pDraw, "vel", 1, V[0].texture); bind(pDraw, "portrait", 2, portraitTarget.texture); bind(pDraw, "portraitColor", 3, portraitColor.texture);
      gl.uniform1f(uniform(pDraw, "portraitMix"), portraitMix);
      gl.uniform1f(uniform(pDraw, "SIZE"), SIZE); gl.uniform1f(uniform(pDraw, "aspect"), width / height); gl.uniform1f(uniform(pDraw, "symbol"), target.symbol); gl.uniform1f(uniform(pDraw, "skyFrom"), 0.06); gl.uniform1f(uniform(pDraw, "ground"), landHeight());
      gl.uniform3f(uniform(pDraw, "arrive"), trip.arrive[0], trip.arrive[1], trip.arrive[2]); gl.uniform1f(uniform(pDraw, "approach"), approach);
      gl.uniform1f(uniform(pDraw, "look"), look.current); gl.uniform1f(uniform(pDraw, "time"), clock); gl.uniform2f(uniform(pDraw, "mouse"), mouse.x, mouse.y); gl.uniform2f(uniform(pDraw, "cam"), cam.x, cam.y); gl.uniform3f(uniform(pDraw, "move"), move[0], move[1], move[2]);
      gl.uniform1f(uniform(pDraw, "light"), colours.light);
      gl.uniform1f(uniform(pDraw, "spectrum"), colours.spectrum);
      gl.uniform1f(uniform(pDraw, "formDim"), Math.max(colours.spectrum, colours.bolt, colours.about));
      gl.uniform1f(uniform(pDraw, "bolt"), colours.bolt);
      gl.uniform1f(uniform(pDraw, "galaxy"), colours.galaxy);
      if (clearTick++ % 10 === 0) readClear();
      gl.uniform1f(uniform(pDraw, "dpr"), dpr);
      gl.uniform4fv(uniform(pDraw, "clearRect"), clear);
      gl.uniform1f(uniform(pDraw, "keep"), 0.42 + 0.58 * portraitMix);
      gl.uniform3fv(uniform(pDraw, "calm"), colours.calm); gl.uniform1f(uniform(pDraw, "halo"), colours.light * (1 - portraitMix));
      gl.drawArrays(gl.POINTS, 0, SIZE * SIZE);
      // 2. Dithered onto the ground, opaque, each dot in its light's colour.
      // Dark: a deep blue-black space; light: deeper shades on the page.
      gl.disable(gl.BLEND);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.useProgram(pDither);
      gl.bindVertexArray(vaoQuad);
      bind(pDither, "scene", 0, scene.texture); bind(pDither, "photo", 1, photoTexture);
      gl.uniform1f(uniform(pDither, "photoMix"), photoMix); gl.uniform2f(uniform(pDither, "photoScale"), photoScale[0], photoScale[1]); gl.uniform2f(uniform(pDither, "photoCentre"), photoCentre[0], photoCentre[1]); gl.uniform2f(uniform(pDither, "cssSize"), width / dpr, height / dpr);
      gl.uniform1f(uniform(pDither, "dpr"), dpr);
      gl.uniform1f(uniform(pDither, "caseDim"), Math.max(colours.spectrum, colours.bolt, colours.about, colours.galaxy * 0.3));
      gl.uniform1f(uniform(pDither, "grainTime"), Math.floor(now / 125) % 1024);
      gl.uniform1f(uniform(pDither, "time"), clock); gl.uniform1f(uniform(pDither, "light"), colours.light);
      gl.uniform1f(uniform(pDither, "halo"), colours.light * (1 - portraitMix));
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
      buildPortrait.current = null;
      [...P, ...V, portraitTarget, portraitColor].forEach(({ texture, framebuffer }) => { gl.deleteTexture(texture); gl.deleteFramebuffer(framebuffer); });
      [pInit, pVel, pPos, pDraw, pStar, pDither].forEach((p) => gl.deleteProgram(p));
      gl.deleteTexture(photoTexture);
      gl.deleteTexture(scene.texture); gl.deleteFramebuffer(scene.framebuffer);
      gl.deleteBuffer(quad);
    };
  }, [started]);

  return <canvas ref={canvas} className={className} aria-hidden="true" />;
}
