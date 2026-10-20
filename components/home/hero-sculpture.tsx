"use client";

import { useEffect, useRef } from "react";

const vertex = `
attribute vec2 position;
void main() { gl_Position = vec4(position, 0.0, 1.0); }
`;

const fragment = `
precision highp float;
uniform vec2 resolution;
uniform vec2 pointer;
uniform float time;
uniform float lightMode;
uniform vec2 flavor;
uniform float flavor2;
uniform float proximity;
uniform float energy;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 cell = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(cell), hash(cell + vec2(1.0, 0.0)), f.x), mix(hash(cell + vec2(0.0, 1.0)), hash(cell + vec2(1.0)), f.x), f.y);
}
float flow(vec2 p) { return noise(p) * 0.65 + noise(p * 2.03 + 4.7) * 0.25 + noise(p * 4.01) * 0.10; }
float cloud(vec2 p, vec2 center, vec2 scale) {
  vec2 d = (p - center) / scale;
  return exp(-dot(d, d) * 1.8);
}
void main() {
  vec2 uv = gl_FragCoord.xy / resolution;
  float t = time * 0.075;
  vec2 drift = pointer * vec2(0.075, -0.055);
  vec2 warp = vec2(flow(uv * 2.8 + vec2(t, -t * 0.4)), flow(uv * 2.6 + vec2(7.0 - t * 0.45, t)));
  vec2 p = uv + (warp - 0.5) * (0.34 + proximity * 0.035 + energy * 0.22) - drift;
  // Selection energy pulls the pools inward and swells them while the prompt runs.
  p = mix(p, vec2(0.5) + (p - vec2(0.5)) * 0.82, energy);
  float blue = cloud(p, vec2(0.90 + sin(t) * 0.10, 0.77 + cos(t * 0.8) * 0.10), vec2(0.53, 0.58));
  float violet = cloud(p, vec2(0.02 + cos(t * 0.7) * 0.11, 0.18 + sin(t * 0.8) * 0.11), vec2(0.50, 0.55));
  float silver = cloud(p, vec2(0.66 + sin(t * 0.6) * 0.15, -0.07 + cos(t) * 0.07), vec2(0.48, 0.42));
  vec3 c1 = mix(vec3(0.12, 0.22, 0.45), vec3(0.52, 0.67, 0.91), lightMode);
  vec3 c2 = mix(vec3(0.30, 0.15, 0.38), vec3(0.76, 0.62, 0.85), lightMode);
  vec3 c3 = mix(vec3(0.12, 0.25, 0.29), vec3(0.56, 0.77, 0.78), lightMode);
  c1 = mix(c1, mix(vec3(0.06, 0.23, 0.52), vec3(0.48, 0.66, 0.96), lightMode), flavor.x);
  c2 = mix(c2, mix(vec3(0.30, 0.24, 0.52), vec3(0.74, 0.66, 0.98), lightMode), flavor.x);
  c1 = mix(c1, mix(vec3(0.035, 0.30, 0.20), vec3(0.40, 0.80, 0.64), lightMode), flavor.y);
  c2 = mix(c2, mix(vec3(0.04, 0.20, 0.22), vec3(0.52, 0.75, 0.69), lightMode), flavor.y);
  c3 = mix(c3, mix(vec3(0.10, 0.28, 0.19), vec3(0.71, 0.86, 0.68), lightMode), flavor.y);
  c1 = mix(c1, mix(vec3(0.24, 0.18, 0.50), vec3(0.66, 0.60, 0.94), lightMode), flavor2);
  c2 = mix(c2, mix(vec3(0.38, 0.16, 0.42), vec3(0.84, 0.64, 0.86), lightMode), flavor2);
  float total = blue + violet + silver;
  vec3 color = (c1 * blue + c2 * violet + c3 * silver) / max(0.001, total);
  // Soft light pools have no surface normals, silhouette, or specular edge.
  float alpha = smoothstep(0.02, 1.20, total) * (0.75 + energy * 0.2);
  gl_FragColor = vec4(color, alpha);
}
`;

// Diffused color fields: no solid geometry or external assets.
export function HeroSculpture({ variant = "default", active = false }: { variant?: string; active?: boolean }) {
  const destination = useRef(variant);
  const excited = useRef(active);
  useEffect(() => { excited.current = active; }, [active]);
  const wake = useRef<(() => void) | null>(null);
  useEffect(() => { destination.current = variant; wake.current?.(); }, [variant]);
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl", { alpha: true, antialias: true, premultipliedAlpha: false, preserveDrawingBuffer: true, powerPreference: "low-power" });
    if (!gl) return;
    const compile = (type: number, source: string) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) { gl.deleteShader(shader); return null; }
      return shader;
    };
    const vs = compile(gl.VERTEX_SHADER, vertex);
    const fs = compile(gl.FRAGMENT_SHADER, fragment);
    const program = gl.createProgram();
    if (!vs || !fs || !program) {
      if (vs) gl.deleteShader(vs);
      if (fs) gl.deleteShader(fs);
      if (program) gl.deleteProgram(program);
      return;
    }
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      gl.deleteProgram(program); gl.deleteShader(vs); gl.deleteShader(fs); return;
    }
    gl.useProgram(program);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, "position");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    const uniforms = {
      resolution: gl.getUniformLocation(program, "resolution"),
      pointer: gl.getUniformLocation(program, "pointer"),
      time: gl.getUniformLocation(program, "time"),
      lightMode: gl.getUniformLocation(program, "lightMode"),
      flavor: gl.getUniformLocation(program, "flavor"),
      proximity: gl.getUniformLocation(program, "proximity"),
      energy: gl.getUniformLocation(program, "energy"),
      flavor2: gl.getUniformLocation(program, "flavor2"),
    };
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const systemDark = window.matchMedia("(prefers-color-scheme: dark)");
    let frame = 0;
    let last = 0;
    let visible = true;
    let light = 0;
    let sceneTime = 0;
    let paintedAt = 0;
    const target = { x: 0, y: 0, proximity: 0 };
    const current = { x: 0, y: 0, proximity: 0, energy: 0, gemini: destination.current === "gemini-privacy" ? 1 : 0, devsign: destination.current === "workflow-app" ? 1 : 0, about: destination.current === "about" ? 1 : 0 };
    const draw = (now: number) => {
      gl.uniform2f(uniforms.resolution, canvas.width, canvas.height);
      gl.uniform2f(uniforms.pointer, current.x, current.y);
      current.energy += ((excited.current ? 1 : 0) - current.energy) * (reduce.matches ? 1 : 0.08);
      // The flow runs several times faster while a selection is in progress.
      if (!reduce.matches && paintedAt) sceneTime += Math.min(0.06, (now - paintedAt) / 1000) * (1 + current.energy * 5);
      paintedAt = now;
      gl.uniform1f(uniforms.time, sceneTime * 2.2);
      const gemini = destination.current === "gemini-privacy" ? 1 : 0;
      const devsign = destination.current === "workflow-app" ? 1 : 0;
      current.gemini += (gemini - current.gemini) * (reduce.matches ? 1 : 0.11);
      current.devsign += (devsign - current.devsign) * (reduce.matches ? 1 : 0.11);
      const about = destination.current === "about" ? 1 : 0;
      current.about += (about - current.about) * (reduce.matches ? 1 : 0.11);
      gl.uniform2f(uniforms.flavor, current.gemini, current.devsign);
      gl.uniform1f(uniforms.flavor2, current.about);
      gl.uniform1f(uniforms.energy, current.energy);
      gl.uniform1f(uniforms.proximity, current.proximity);
      gl.uniform1f(uniforms.lightMode, light);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    };
    const tick = (now: number) => {
      frame = 0;
      if (document.hidden || !visible) return;
      if (document.documentElement.hasAttribute("data-project-navigation")) {
        if (!last) { draw(now); last = now; }
        return;
      }
      if (now - last > 30) {
        current.x += (target.x - current.x) * 0.065;
        current.y += (target.y - current.y) * 0.065;
        current.proximity += (target.proximity - current.proximity) * 0.065;
        draw(now);
        last = now;
      }
      if (!reduce.matches && destination.current !== "default") frame = requestAnimationFrame(tick);
    };
    const start = () => { if (!frame) frame = requestAnimationFrame(tick); };
    wake.current = start;
    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio, 1, 960 / Math.max(1, canvas.clientWidth));
      canvas.width = Math.max(1, Math.round(canvas.clientWidth * ratio));
      canvas.height = Math.max(1, Math.round(canvas.clientHeight * ratio));
      gl.viewport(0, 0, canvas.width, canvas.height);
      start();
    };
    const theme = () => {
      const setting = document.documentElement.dataset.theme;
      light = setting === "light" || (setting !== "dark" && !systemDark.matches) ? 1 : 0;
      start();
    };
    const move = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" || reduce.matches) return;
      const bounds = canvas.getBoundingClientRect();
      const distance = Math.hypot(event.clientX - bounds.left - bounds.width * 0.5, event.clientY - bounds.top - bounds.height * 0.5);
      target.proximity = Math.max(0, 1 - distance / 650);
      target.x = event.clientX / window.innerWidth * 2 - 1;
      target.y = event.clientY / window.innerHeight * 2 - 1;
    };
    const reset = () => { target.x = 0; target.y = 0; target.proximity = 0; };
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    const appearance = new MutationObserver(theme);
    appearance.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "data-project-navigation"] });
    const intersection = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; if (visible) start(); });
    intersection.observe(canvas);
    window.addEventListener("pointermove", move, { passive: true });
    document.documentElement.addEventListener("pointerleave", reset);
    document.addEventListener("visibilitychange", start);
    systemDark.addEventListener("change", theme);
    reduce.addEventListener("change", start);
    theme(); resize();
    return () => {
      wake.current = null;
      cancelAnimationFrame(frame);
      observer.disconnect(); appearance.disconnect(); intersection.disconnect();
      window.removeEventListener("pointermove", move);
      document.documentElement.removeEventListener("pointerleave", reset);
      document.removeEventListener("visibilitychange", start);
      systemDark.removeEventListener("change", theme);
      reduce.removeEventListener("change", start);
      gl.deleteBuffer(buffer); gl.deleteProgram(program); gl.deleteShader(vs); gl.deleteShader(fs);
    };
  }, []); // The variant is read from a ref to preserve the GPU context across changes.
  return <canvas ref={ref} className="hero-sculpture" data-sculpture={variant} data-active={active || undefined} aria-hidden="true" />;
}
