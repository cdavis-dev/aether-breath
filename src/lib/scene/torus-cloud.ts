import * as THREE from "three";
import type { Snapshot } from "@/lib/breath/types";

const COUNT = 420;
const R_MIN = 0.04;
const R_MAX = 2.12;
const TUBE_MIN = 0.34;
const TUBE_MAX = 0.5;

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeGlowTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return new THREE.Texture();
  }
  const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.18, "rgba(220,245,238,0.55)");
  gradient.addColorStop(0.42, "rgba(158,217,209,0.18)");
  gradient.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 128, 128);
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

const vertexShader = /* glsl */ `
  uniform float uPixelRatio;
  uniform float uExpansion;
  uniform float uBrightness;
  uniform float uTime;
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  attribute float aSize;
  attribute float aSeed;
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    float dist = max(-mvPosition.z, 0.35);
    float size = aSize * mix(20.0, 13.0, uExpansion);
    gl_PointSize = clamp(size * uPixelRatio * (4.6 / dist), 2.0, 64.0);
    vec3 color = mix(uColorA, uColorB, uExpansion);
    color *= 0.7 + aSeed * 0.45;
    vColor = color * uBrightness;
    float twinkle = 0.88 + 0.12 * sin(uTime * (0.5 + aSeed * 1.7) + aSeed * 6.2831);
    vAlpha = mix(0.92, 0.58, uExpansion) * mix(0.62, 1.0, aSeed) * twinkle;
  }
`;

const fragmentShader = /* glsl */ `
  precision mediump float;
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vec2 uv = gl_PointCoord * 2.0 - 1.0;
    float d = dot(uv, uv);
    if (d > 1.0) discard;
    float core = exp(-d * 46.0);
    float glow = exp(-d * 7.5);
    float alpha = (core * 0.95 + glow * 0.38) * vAlpha;
    if (alpha < 0.01) discard;
    gl_FragColor = vec4(vColor * alpha, alpha);
  }
`;

type Particle = {
  u: number;
  v: number;
  omega: number;
  vSpin: number;
  tubeScale: number;
  radialBias: number;
  size: number;
  seed: number;
};

export function createTorusCloud() {
  const rng = mulberry32(0xaed4e4);
  const particles: Particle[] = [];
  const positions = new Float32Array(COUNT * 3);
  const sizes = new Float32Array(COUNT);
  const seeds = new Float32Array(COUNT);

  for (let i = 0; i < COUNT; i++) {
    const inner = rng() < 0.16;
    const particle: Particle = {
      u: (i / COUNT) * Math.PI * 2 + (rng() - 0.5) * 0.18,
      v: rng() * Math.PI * 2,
      omega: 0.18 + rng() * 0.42,
      vSpin: (rng() - 0.5) * 0.35,
      tubeScale: inner ? 0.35 + rng() * 0.4 : 0.7 + rng() * 0.7,
      radialBias: inner ? 0.12 + rng() * 0.22 : 0.82 + rng() * 0.22,
      size: inner ? 0.55 + rng() * 0.5 : 0.7 + rng() * 1.35,
      seed: rng(),
    };
    particles.push(particle);
    sizes[i] = particle.size;
    seeds[i] = particle.seed;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
  geometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
  geometry.computeBoundingSphere();

  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
    uniforms: {
      uPixelRatio: { value: 1 },
      uExpansion: { value: 0.45 },
      uBrightness: { value: 0.85 },
      uTime: { value: 0 },
      uColorA: { value: new THREE.Color("#dfe6e2") },
      uColorB: { value: new THREE.Color("#9ed9d1") },
    },
    vertexShader,
    fragmentShader,
  });

  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;

  const glowTexture = makeGlowTexture();
  const spriteMat = new THREE.SpriteMaterial({
    map: glowTexture,
    color: new THREE.Color("#b7ece4"),
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    toneMapped: false,
    opacity: 0.55,
  });
  const core = new THREE.Sprite(spriteMat);
  const halo = new THREE.Sprite(spriteMat.clone());
  halo.material.color = new THREE.Color("#8ecfc6");
  halo.material.opacity = 0.22;
  const bloom = new THREE.Sprite(spriteMat.clone());
  bloom.material.color = new THREE.Color("#cfe8e2");
  bloom.material.opacity = 0.1;

  const group = new THREE.Group();
  group.add(points, core, halo, bloom);

  let localTime = 0;

  function brightnessFor(phase: Snapshot["phase"]) {
    if (phase === "hold") return 1.18;
    if (phase === "inhale") return 1.02;
    if (phase === "exhale") return 0.88;
    if (phase === "complete") return 0.55;
    return 0.78;
  }

  function update(dt: number, snap: Snapshot, pixelRatio: number) {
    const frozen = snap.paused;
    if (!frozen) localTime += dt;

    const expansion = snap.expansion;
    const speed = snap.speed;
    const R = THREE.MathUtils.lerp(R_MIN, R_MAX, expansion);
    const tube = THREE.MathUtils.lerp(TUBE_MIN, TUBE_MAX, expansion);
    const flatten = THREE.MathUtils.lerp(1, 0.78, expansion);
    const spin = frozen ? 0 : dt * speed;

    for (let i = 0; i < COUNT; i++) {
      const p = particles[i];
      p.u += p.omega * spin;
      p.v += p.vSpin * spin * 0.35;
      const major = R * p.radialBias;
      const r = tube * p.tubeScale;
      const cv = Math.cos(p.v);
      const sv = Math.sin(p.v);
      const cu = Math.cos(p.u);
      const su = Math.sin(p.u);
      const ring = major + r * cv;
      const i3 = i * 3;
      positions[i3] = ring * cu;
      positions[i3 + 1] = r * sv * flatten;
      positions[i3 + 2] = ring * su;
    }

    const posAttr = geometry.getAttribute("position");
    posAttr.needsUpdate = true;

    material.uniforms.uExpansion.value = expansion;
    material.uniforms.uBrightness.value = brightnessFor(snap.phase);
    material.uniforms.uTime.value = localTime;
    material.uniforms.uPixelRatio.value = Math.min(pixelRatio, 2);

    const coreScale = THREE.MathUtils.lerp(1.15, 0.28, expansion);
    core.scale.setScalar(coreScale);
    halo.scale.setScalar(THREE.MathUtils.lerp(2.4, 0.9, expansion));
    bloom.scale.setScalar(THREE.MathUtils.lerp(4.6, 2.2, expansion));
    spriteMat.opacity = THREE.MathUtils.lerp(0.7, 0.18, expansion);
    halo.material.opacity = THREE.MathUtils.lerp(0.32, 0.08, expansion);
    bloom.material.opacity = THREE.MathUtils.lerp(0.16, 0.05, expansion);

    if (!frozen) {
      group.rotation.y += dt * (0.045 + speed * 0.11);
    }
    group.rotation.x = Math.sin(localTime * 0.16) * 0.2;
    group.rotation.z = Math.cos(localTime * 0.1) * 0.07;
    group.position.y = Math.sin(localTime * 0.35) * 0.04;
  }

  function dispose() {
    geometry.dispose();
    material.dispose();
    glowTexture.dispose();
    spriteMat.dispose();
    halo.material.dispose();
    bloom.material.dispose();
  }

  return { group, update, dispose };
}

export type TorusCloud = ReturnType<typeof createTorusCloud>;
