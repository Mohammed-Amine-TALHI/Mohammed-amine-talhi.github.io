import { useEffect, useRef } from 'react';

/**
 * React Bits — LiquidEther
 *
 * A slow, flowing ether that reacts to the cursor. The upstream React Bits
 * version drives this through three.js; this is the same effect written
 * directly against WebGL so the site doesn't take a ~600 kB 3D-engine
 * dependency for one background.
 *
 * Technique: fractal Brownian motion sampled through two rounds of domain
 * warping (Iñigo Quílez's "warp" pattern), tinted through a three-stop
 * amber palette, with a decaying radial impulse wherever the pointer moves.
 *
 * Falls back to rendering nothing if WebGL is unavailable — the caller keeps a
 * CSS gradient underneath, so the page never looks broken.
 */

const VERT = `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`;

const FRAG = `
precision highp float;

uniform vec2  uRes;
uniform float uTime;
uniform vec2  uMouse;     // normalised, aspect-corrected
uniform float uImpulse;   // 0..1, decays after the pointer stops
uniform vec3  uInk;       // background
uniform vec3  uWarm;      // amber
uniform vec3  uDeep;      // deep orange
uniform float uIntensity;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);          // smoothstep interpolation
  return mix(
    mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

// five octaves, each rotated to avoid axis-aligned artefacts
float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  mat2 rot = mat2(1.6, 1.2, -1.2, 1.6);
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p = rot * p;
    a *= 0.5;
  }
  return v;
}

void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  float aspect = uRes.x / uRes.y;

  vec2 p = uv;
  p.x *= aspect;
  p *= 1.7;

  float t = uTime * 0.045;

  // pointer impulse: a soft bulge that pushes the flow around
  vec2 m = uMouse;
  m.x *= aspect;
  m *= 1.7;
  float d = distance(p, m);
  float bulge = uImpulse * exp(-d * d * 2.2);

  // --- domain warping ---
  vec2 q = vec2(
    fbm(p + vec2(0.0, 0.0) + t),
    fbm(p + vec2(5.2, 1.3) - t * 0.8)
  );

  vec2 r = vec2(
    fbm(p + 3.0 * q + vec2(1.7, 9.2) + t * 1.3 + bulge * 1.8),
    fbm(p + 3.0 * q + vec2(8.3, 2.8) - t * 1.1 + bulge * 1.4)
  );

  float f = fbm(p + 3.4 * r);

  // --- palette ---
  vec3 col = mix(uInk, uDeep, clamp(f * 1.55, 0.0, 1.0));
  col = mix(col, uWarm, clamp(length(r) * 0.62 + bulge * 0.5, 0.0, 1.0));

  // filament highlights where the warp field folds on itself
  float filament = pow(clamp(length(q) * 0.75, 0.0, 1.0), 3.0);
  col += uWarm * filament * 0.35;

  col *= (0.42 + 0.85 * f) * uIntensity;

  // keep the edges dark so foreground text stays legible
  float vig = smoothstep(1.2, 0.3, distance(uv, vec2(0.5)));
  col *= 0.35 + 0.65 * vig;

  gl_FragColor = vec4(col, 1.0);
}
`;

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const sh = gl.createShader(type)!;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    console.warn('LiquidEther shader error:', gl.getShaderInfoLog(sh));
    gl.deleteShader(sh);
    return null;
  }
  return sh;
}

export default function LiquidEther({
  className = '',
  intensity = 1,
  speed = 1,
  interactive = true,
}: {
  className?: string;
  intensity?: number;
  speed?: number;
  interactive?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = (canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'low-power' }) ||
      canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null;
    if (!gl) return; // caller's CSS gradient stays visible

    const vs = compile(gl, gl.VERTEX_SHADER, VERT);
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return;

    const prog = gl.createProgram()!;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.warn('LiquidEther link error:', gl.getProgramInfoLog(prog));
      return;
    }
    gl.useProgram(prog);

    // full-screen triangle pair
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(prog, 'aPos');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const u = {
      res: gl.getUniformLocation(prog, 'uRes'),
      time: gl.getUniformLocation(prog, 'uTime'),
      mouse: gl.getUniformLocation(prog, 'uMouse'),
      impulse: gl.getUniformLocation(prog, 'uImpulse'),
      ink: gl.getUniformLocation(prog, 'uInk'),
      warm: gl.getUniformLocation(prog, 'uWarm'),
      deep: gl.getUniformLocation(prog, 'uDeep'),
      intensity: gl.getUniformLocation(prog, 'uIntensity'),
    };

    gl.uniform3f(u.ink, 0.031, 0.031, 0.043); // --color-ink-950
    gl.uniform3f(u.warm, 0.98, 0.65, 0.11); // amber-400/500
    gl.uniform3f(u.deep, 0.72, 0.24, 0.03); // orange-700
    gl.uniform1f(u.intensity, intensity);

    // cap the render scale — this is a background, not the subject
    let dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const w = Math.floor(canvas.clientWidth * dpr);
      const h = Math.floor(canvas.clientHeight * dpr);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
      gl.uniform2f(u.res, canvas.width, canvas.height);
    };
    resize();
    window.addEventListener('resize', resize);

    // pointer state
    let mx = 0.5;
    let my = 0.5;
    let impulse = 0;
    const onMove = (e: PointerEvent) => {
      if (!interactive) return;
      mx = e.clientX / window.innerWidth;
      my = 1 - e.clientY / window.innerHeight; // GL origin is bottom-left
      impulse = 1;
    };
    if (interactive) window.addEventListener('pointermove', onMove, { passive: true });

    let raf = 0;
    const start = performance.now();
    let last = start;

    // Paint once up front. rAF is suspended while the tab is hidden, so without
    // this the canvas would stay black until the visitor focuses the page.
    gl.uniform1f(u.time, 0);
    gl.uniform2f(u.mouse, 0.5, 0.5);
    gl.uniform1f(u.impulse, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      if (document.hidden) return;

      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      impulse = Math.max(0, impulse - dt * 0.55); // fade the bulge out

      resize();
      gl.uniform1f(u.time, ((now - start) / 1000) * speed);
      gl.uniform2f(u.mouse, mx, my);
      gl.uniform1f(u.impulse, impulse);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    raf = requestAnimationFrame(frame);

    // restarting the clock on tab-return avoids a huge jump in the noise field
    const onVis = () => {
      if (!document.hidden) last = performance.now();
    };
    document.addEventListener('visibilitychange', onVis);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('visibilitychange', onVis);
      gl.deleteProgram(prog);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteBuffer(buf);
    };
  }, [intensity, speed, interactive]);

  return <canvas ref={canvasRef} className={'block h-full w-full ' + className} aria-hidden />;
}
