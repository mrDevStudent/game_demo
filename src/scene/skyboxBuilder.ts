import * as THREE from 'three';

/**
 * Metadata extracted from /new/skybox.rbxm ("Simple Sunset Sky")
 * Face asset IDs stored in the Roblox Sky instance:
 *   Front: rbxassetid://102861865671030
 *   Back:  rbxassetid://116125630991600
 *   Left:  rbxassetid://101856865035667
 *   Right: rbxassetid://91813273790778
 *   Up:    rbxassetid://72828282060364
 *   Down:  rbxassetid://129095827049856
 *   StarCount: 3000, CelestialBodiesShown: true
 */
export const SUNSET_SKYBOX_CONFIG = {
  name: 'Simple Sunset Sky',
  horizonFogColor: 0xd9a384,
  sunDirection: new THREE.Vector3(-0.66, 0.16, -0.73).normalize(),
} as const;

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function hash3(x: number, y: number, z: number): number {
  const n = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453123;
  return n - Math.floor(n);
}

function noise3(x: number, y: number, z: number): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const iz = Math.floor(z);
  const fx = x - ix;
  const fy = y - iy;
  const fz = z - iz;
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);
  const uz = fz * fz * (3 - 2 * fz);

  const n000 = hash3(ix, iy, iz);
  const n100 = hash3(ix + 1, iy, iz);
  const n010 = hash3(ix, iy + 1, iz);
  const n110 = hash3(ix + 1, iy + 1, iz);
  const n001 = hash3(ix, iy, iz + 1);
  const n101 = hash3(ix + 1, iy, iz + 1);
  const n011 = hash3(ix, iy + 1, iz + 1);
  const n111 = hash3(ix + 1, iy + 1, iz + 1);

  return lerp(
    lerp(lerp(n000, n100, ux), lerp(n010, n110, ux), uy),
    lerp(lerp(n001, n101, ux), lerp(n011, n111, ux), uy),
    uz
  );
}

function fbm3(x: number, y: number, z: number): number {
  let val = 0;
  let amp = 0.52;
  let freq = 1;
  for (let i = 0; i < 4; i += 1) {
    val += amp * noise3(x * freq, y * freq, z * freq);
    freq *= 2.05;
    amp *= 0.5;
  }
  return val;
}

function sampleSunsetSky(
  dx: number,
  dy: number,
  dz: number,
  sunDir: THREE.Vector3
): [number, number, number] {
  const sunDot = Math.max(-1, Math.min(1, dx * sunDir.x + dy * sunDir.y + dz * sunDir.z));
  const sunFactor = Math.max(0, sunDot);

  // Base vertical sunset gradient: deep twilight zenith -> mauve -> warm peach/gold horizon
  let r: number;
  let g: number;
  let b: number;

  if (dy >= 0) {
    const tLow = smoothstep(0.0, 0.16, dy);
    const tMid = smoothstep(0.14, 0.45, dy);
    const tHigh = smoothstep(0.4, 0.92, dy);

    // Horizon apricot-gold (#f4aa78) -> low rose-coral (#d87d76) -> mid twilight (#6e567c) -> zenith (#1f2c52)
    r = lerp(244, 216, tLow);
    g = lerp(172, 125, tLow);
    b = lerp(120, 118, tLow);

    r = lerp(r, 110, tMid);
    g = lerp(g, 86, tMid);
    b = lerp(b, 124, tMid);

    r = lerp(r, 31, tHigh);
    g = lerp(g, 44, tHigh);
    b = lerp(b, 82, tHigh);
  } else {
    // Below horizon blends smoothly into warm dusk mist
    const tBelow = smoothstep(0.0, -0.35, dy);
    r = lerp(244, 74, tBelow);
    g = lerp(172, 62, tBelow);
    b = lerp(120, 74, tBelow);
  }

  // Warm sunset atmospheric glow toward the sun
  const horizonBand = Math.exp(-Math.abs(dy - 0.05) * 6.5);
  const wideGlow = Math.pow(sunFactor, 3.0) * (0.42 + 0.58 * horizonBand);
  const tightGlow = Math.pow(sunFactor, 24.0);
  const sunDisc = smoothstep(0.9985, 0.9994, sunDot);

  r += wideGlow * 70 + tightGlow * 85 + sunDisc * 120;
  g += wideGlow * 42 + tightGlow * 68 + sunDisc * 110;
  b += wideGlow * 12 + tightGlow * 32 + sunDisc * 85;

  // Wispy backlit sunset clouds in upper-horizon band
  if (dy > 0.01 && dy < 0.65) {
    const cloudMask = smoothstep(0.02, 0.14, dy) * (1 - smoothstep(0.32, 0.64, dy));
    const projScale = 2.6 / (dy + 0.24);
    const cx = dx * projScale + 1.7;
    const cz = dz * projScale - 2.3;
    const n = fbm3(cx * 0.65, dy * 2.2, cz * 0.65);
    const cloud = smoothstep(0.52, 0.78, n) * cloudMask * 0.55;

    const cloudLit = Math.pow(sunFactor, 2.0);
    const cr = lerp(138, 255, cloudLit);
    const cg = lerp(96, 178, cloudLit);
    const cb = lerp(126, 132, cloudLit);

    r = lerp(r, cr, cloud);
    g = lerp(g, cg, cloud);
    b = lerp(b, cb, cloud);
  }

  // Faint twilight stars in upper sky matching StarCount in skybox.rbxm
  if (dy > 0.22) {
    const starGrid = 96;
    const sx = Math.floor(dx * starGrid);
    const sy = Math.floor(dy * starGrid);
    const sz = Math.floor(dz * starGrid);
    const cellRand = hash3(sx, sy, sz);
    if (cellRand > 0.992) {
      const starFade = smoothstep(0.22, 0.68, dy) * (1 - sunFactor * 0.7);
      const twinkle = ((cellRand - 0.992) / 0.008) * 145 * starFade;
      r += twinkle;
      g += twinkle;
      b += twinkle * 1.05;
    }
  }

  return [
    Math.max(0, Math.min(255, Math.round(r))),
    Math.max(0, Math.min(255, Math.round(g))),
    Math.max(0, Math.min(255, Math.round(b))),
  ];
}

function getCubeFaceDirection(faceIndex: number, u: number, v: number): [number, number, number] {
  let x = 0;
  let y = 0;
  let z = 0;
  switch (faceIndex) {
    case 0: // +X
      x = 1;
      y = -v;
      z = -u;
      break;
    case 1: // -X
      x = -1;
      y = -v;
      z = u;
      break;
    case 2: // +Y
      x = u;
      y = 1;
      z = v;
      break;
    case 3: // -Y
      x = u;
      y = -1;
      z = -v;
      break;
    case 4: // +Z
      x = u;
      y = -v;
      z = 1;
      break;
    default: // -Z
      x = -u;
      y = -v;
      z = -1;
      break;
  }
  const invLen = 1 / Math.hypot(x, y, z);
  return [x * invLen, y * invLen, z * invLen];
}

export function createSunsetSkyboxTexture(faceSize = 256): THREE.CubeTexture {
  const faces: HTMLCanvasElement[] = [];
  const sunDir = SUNSET_SKYBOX_CONFIG.sunDirection;

  for (let face = 0; face < 6; face += 1) {
    const canvas = document.createElement('canvas');
    canvas.width = faceSize;
    canvas.height = faceSize;
    const ctx = canvas.getContext('2d')!;
    const img = ctx.createImageData(faceSize, faceSize);
    const data = img.data;

    for (let py = 0; py < faceSize; py += 1) {
      const v = ((py + 0.5) / faceSize) * 2 - 1;
      for (let px = 0; px < faceSize; px += 1) {
        const u = ((px + 0.5) / faceSize) * 2 - 1;
        const [dx, dy, dz] = getCubeFaceDirection(face, u, v);
        const [r, g, b] = sampleSunsetSky(dx, dy, dz, sunDir);
        const idx = (py * faceSize + px) * 4;
        data[idx] = r;
        data[idx + 1] = g;
        data[idx + 2] = b;
        data[idx + 3] = 255;
      }
    }

    ctx.putImageData(img, 0, 0);
    faces.push(canvas);
  }

  const cubeTexture = new THREE.CubeTexture(faces);
  cubeTexture.colorSpace = THREE.SRGBColorSpace;
  cubeTexture.needsUpdate = true;
  return cubeTexture;
}
