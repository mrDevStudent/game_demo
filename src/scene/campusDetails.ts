import * as THREE from 'three';
import { BoxCollider } from './campusGeometry';
import { RoomConfig } from '../types';

export interface CampusDetailTextures {
  wallStucco: THREE.CanvasTexture;
  roofShingle: THREE.CanvasTexture;
  plazaMedallion: THREE.CanvasTexture;
  cobblePaver: THREE.CanvasTexture;
  dispose: () => void;
}

export function createCampusDetailTextures(maxAnisotropy: number): CampusDetailTextures {
  // 1. Subtle architectural stucco / brick-plaster grain (white-tinted so material color multiplies cleanly)
  const stuccoCanvas = document.createElement('canvas');
  stuccoCanvas.width = 256;
  stuccoCanvas.height = 256;
  const sCtx = stuccoCanvas.getContext('2d')!;
  sCtx.fillStyle = '#f4f4f4';
  sCtx.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 256; y += 16) {
    sCtx.fillStyle = 'rgba(0, 0, 0, 0.035)';
    sCtx.fillRect(0, y, 256, 1);
  }
  for (let i = 0; i < 1800; i += 1) {
    const x = (i * 73) % 256;
    const y = (i * 137) % 256;
    sCtx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.22)' : 'rgba(120,120,120,0.06)';
    sCtx.fillRect(x, y, 2, 2);
  }
  const wallStucco = new THREE.CanvasTexture(stuccoCanvas);
  wallStucco.colorSpace = THREE.SRGBColorSpace;
  wallStucco.wrapS = THREE.RepeatWrapping;
  wallStucco.wrapT = THREE.RepeatWrapping;
  wallStucco.repeat.set(3, 2);
  wallStucco.anisotropy = maxAnisotropy;

  // 2. Architectural roof shingle pattern (grayscale base so roofColor tints it cleanly)
  const roofCanvas = document.createElement('canvas');
  roofCanvas.width = 256;
  roofCanvas.height = 256;
  const rCtx = roofCanvas.getContext('2d')!;
  rCtx.fillStyle = '#e5e5e5';
  rCtx.fillRect(0, 0, 256, 256);
  const rowH = 24;
  const colW = 32;
  for (let row = 0; row * rowH < 256; row += 1) {
    const y = row * rowH;
    const shift = row % 2 === 0 ? 0 : colW / 2;
    rCtx.fillStyle = 'rgba(0, 0, 0, 0.14)';
    rCtx.fillRect(0, y + rowH - 2, 256, 2);
    for (let x = -colW; x < 256 + colW; x += colW) {
      const tone = ((row * 7 + x) % 3) * 0.04;
      rCtx.fillStyle = `rgba(0, 0, 0, ${0.03 + tone})`;
      rCtx.fillRect(x + shift, y, colW - 2, rowH - 2);
      rCtx.fillStyle = 'rgba(0, 0, 0, 0.12)';
      rCtx.fillRect(x + shift + colW - 2, y, 2, rowH);
    }
  }
  const roofShingle = new THREE.CanvasTexture(roofCanvas);
  roofShingle.colorSpace = THREE.SRGBColorSpace;
  roofShingle.wrapS = THREE.RepeatWrapping;
  roofShingle.wrapT = THREE.RepeatWrapping;
  roofShingle.repeat.set(4, 3);
  roofShingle.anisotropy = maxAnisotropy;

  // 3. Central Plaza Compass Medallion
  const plazaCanvas = document.createElement('canvas');
  plazaCanvas.width = 512;
  plazaCanvas.height = 512;
  const pCtx = plazaCanvas.getContext('2d')!;
  const cx = 256;
  const cy = 256;

  pCtx.fillStyle = '#d4cdc0';
  pCtx.fillRect(0, 0, 512, 512);

  // Outer stone ring
  pCtx.beginPath();
  pCtx.arc(cx, cy, 246, 0, Math.PI * 2);
  pCtx.fillStyle = '#c8bfb0';
  pCtx.fill();
  pCtx.lineWidth = 10;
  pCtx.strokeStyle = '#94a3b8';
  pCtx.stroke();

  // Radial paving joints
  pCtx.strokeStyle = 'rgba(100, 92, 80, 0.28)';
  pCtx.lineWidth = 2;
  for (let a = 0; a < 16; a += 1) {
    const ang = (a / 16) * Math.PI * 2;
    pCtx.beginPath();
    pCtx.moveTo(cx + Math.cos(ang) * 70, cy + Math.sin(ang) * 70);
    pCtx.lineTo(cx + Math.cos(ang) * 240, cy + Math.sin(ang) * 240);
    pCtx.stroke();
  }
  [115, 175, 224].forEach((rad) => {
    pCtx.beginPath();
    pCtx.arc(cx, cy, rad, 0, Math.PI * 2);
    pCtx.stroke();
  });

  // Inner compass star inlay
  pCtx.beginPath();
  pCtx.arc(cx, cy, 74, 0, Math.PI * 2);
  pCtx.fillStyle = '#e5dfd3';
  pCtx.fill();
  pCtx.lineWidth = 4;
  pCtx.strokeStyle = '#64748b';
  pCtx.stroke();

  for (let i = 0; i < 8; i += 1) {
    const ang = (i / 8) * Math.PI * 2;
    const len = i % 2 === 0 ? 64 : 44;
    pCtx.beginPath();
    pCtx.moveTo(cx, cy);
    pCtx.lineTo(cx + Math.cos(ang - 0.16) * 20, cy + Math.sin(ang - 0.16) * 20);
    pCtx.lineTo(cx + Math.cos(ang) * len, cy + Math.sin(ang) * len);
    pCtx.lineTo(cx + Math.cos(ang + 0.16) * 20, cy + Math.sin(ang + 0.16) * 20);
    pCtx.closePath();
    pCtx.fillStyle = i % 2 === 0 ? '#475569' : '#94a3b8';
    pCtx.fill();
  }

  pCtx.beginPath();
  pCtx.arc(cx, cy, 14, 0, Math.PI * 2);
  pCtx.fillStyle = '#d97706';
  pCtx.fill();

  const plazaMedallion = new THREE.CanvasTexture(plazaCanvas);
  plazaMedallion.colorSpace = THREE.SRGBColorSpace;
  plazaMedallion.anisotropy = maxAnisotropy;

  // 4. Spur walkway paver texture
  const paverCanvas = document.createElement('canvas');
  paverCanvas.width = 256;
  paverCanvas.height = 256;
  const pvCtx = paverCanvas.getContext('2d')!;
  pvCtx.fillStyle = '#ddd6c8';
  pvCtx.fillRect(0, 0, 256, 256);
  pvCtx.strokeStyle = 'rgba(110, 102, 88, 0.24)';
  pvCtx.lineWidth = 2;
  for (let y = 0; y < 256; y += 32) {
    const shift = (y / 32) % 2 === 0 ? 0 : 32;
    for (let x = -32; x < 256 + 32; x += 64) {
      pvCtx.strokeRect(x + shift, y, 64, 32);
    }
  }
  const cobblePaver = new THREE.CanvasTexture(paverCanvas);
  cobblePaver.colorSpace = THREE.SRGBColorSpace;
  cobblePaver.wrapS = THREE.RepeatWrapping;
  cobblePaver.wrapT = THREE.RepeatWrapping;
  cobblePaver.repeat.set(1.5, 3);
  cobblePaver.anisotropy = maxAnisotropy;

  return {
    wallStucco,
    roofShingle,
    plazaMedallion,
    cobblePaver,
    dispose: () => {
      wallStucco.dispose();
      roofShingle.dispose();
      plazaMedallion.dispose();
      cobblePaver.dispose();
    },
  };
}

function createWindowAssembly(
  w: number,
  h: number,
  frameMat: THREE.Material,
  glassMat: THREE.Material,
  sillMat: THREE.Material
): THREE.Group {
  const win = new THREE.Group();

  const outerFrame = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.16), frameMat);
  outerFrame.castShadow = true;
  win.add(outerFrame);

  const pane = new THREE.Mesh(new THREE.BoxGeometry(w - 0.24, h - 0.24, 0.19), glassMat);
  win.add(pane);

  // Mullion crossbars
  const vMullion = new THREE.Mesh(new THREE.BoxGeometry(0.06, h - 0.2, 0.21), frameMat);
  const hMullion = new THREE.Mesh(new THREE.BoxGeometry(w - 0.2, 0.06, 0.21), frameMat);
  win.add(vMullion, hMullion);

  // Stone sill & upper lintel
  const sill = new THREE.Mesh(new THREE.BoxGeometry(w + 0.24, 0.12, 0.28), sillMat);
  sill.position.set(0, -h / 2 - 0.05, 0.05);
  sill.castShadow = true;

  const lintel = new THREE.Mesh(new THREE.BoxGeometry(w + 0.22, 0.16, 0.24), sillMat);
  lintel.position.set(0, h / 2 + 0.07, 0.03);
  lintel.castShadow = true;

  win.add(sill, lintel);
  return win;
}

export function buildDetailedBuilding(
  spec: RoomConfig,
  textures: CampusDetailTextures
): { group: THREE.Group; collider: BoxCollider; accentColliders: BoxCollider[] } {
  const group = new THREE.Group();
  group.position.set(spec.x, 0, spec.z);
  const accentColliders: BoxCollider[] = [];

  const plinthMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    roughness: 0.9,
    metalness: 0.05,
  });
  const stoneTrimMat = new THREE.MeshStandardMaterial({
    color: 0xcbd5e1,
    roughness: 0.82,
    metalness: 0.04,
  });
  const wallMat = new THREE.MeshStandardMaterial({
    color: spec.wallColor,
    map: textures.wallStucco,
    roughness: 0.82,
    metalness: 0.03,
  });
  const trimMat = new THREE.MeshStandardMaterial({
    color: spec.trimColor,
    roughness: 0.52,
    metalness: 0.18,
  });
  const roofMat = new THREE.MeshStandardMaterial({
    color: spec.roofColor,
    map: textures.roofShingle,
    roughness: 0.68,
    metalness: 0.08,
  });
  const frameMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    roughness: 0.42,
    metalness: 0.35,
  });
  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xd97706,
    roughness: 0.28,
    metalness: 0.78,
  });
  const winGlassMat = new THREE.MeshStandardMaterial({
    color: 0x93c5fd,
    emissive: 0xfef08a,
    emissiveIntensity: 0.24,
    roughness: 0.14,
    metalness: 0.36,
  });
  const doorGlassMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    emissive: 0xfde68a,
    emissiveIntensity: 0.15,
    roughness: 0.18,
    metalness: 0.48,
  });
  const lanternGlowMat = new THREE.MeshStandardMaterial({
    color: 0xfef3c7,
    emissive: 0xfbbf24,
    emissiveIntensity: 1.0,
    roughness: 0.2,
  });

  // 1. Stepped Stone Plinth & Base Water-Table Molding
  const plinth = new THREE.Mesh(new THREE.BoxGeometry(10.6, 0.42, 8.6), plinthMat);
  plinth.position.y = 0.21;
  plinth.receiveShadow = true;
  plinth.castShadow = true;

  const waterTable = new THREE.Mesh(new THREE.BoxGeometry(10.28, 0.16, 8.28), stoneTrimMat);
  waterTable.position.y = 0.5;
  waterTable.receiveShadow = true;
  group.add(plinth, waterTable);

  // 2. Main Stucco Body & Corner Pilasters + Horizontal Stringcourse
  const body = new THREE.Mesh(new THREE.BoxGeometry(10, 4.75, 8), wallMat);
  body.position.y = 2.92;
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  // Corner pilasters
  [
    [-4.9, -3.9],
    [4.9, -3.9],
    [-4.9, 3.9],
    [4.9, 3.9],
  ].forEach(([px, pz]) => {
    const pilaster = new THREE.Mesh(new THREE.BoxGeometry(0.46, 4.75, 0.46), stoneTrimMat);
    pilaster.position.set(px, 2.92, pz);
    pilaster.castShadow = true;
    pilaster.receiveShadow = true;
    group.add(pilaster);
  });

  // Mid-level facade belt trim
  const belt = new THREE.Mesh(new THREE.BoxGeometry(10.18, 0.12, 8.18), stoneTrimMat);
  belt.position.y = 1.68;
  group.add(belt);

  // Cornice & Overhanging Eaves
  const cornice = new THREE.Mesh(new THREE.BoxGeometry(10.55, 0.28, 8.55), trimMat);
  cornice.position.y = 5.42;
  cornice.castShadow = true;
  group.add(cornice);

  // 3. Pitched Hipped Roof + Rooftop Lantern Cupola
  const roofBase = new THREE.Mesh(new THREE.BoxGeometry(11.1, 0.24, 9.1), trimMat);
  roofBase.position.y = 5.66;
  roofBase.castShadow = true;
  roofBase.receiveShadow = true;
  group.add(roofBase);

  const hipRoof = new THREE.Mesh(new THREE.CylinderGeometry(1.75, 7.7, 2.05, 4), roofMat);
  hipRoof.rotation.y = Math.PI / 4;
  hipRoof.scale.set(1.01, 1, 0.82);
  hipRoof.position.y = 6.78;
  hipRoof.castShadow = true;
  hipRoof.receiveShadow = true;
  group.add(hipRoof);

  // Cupola deck & glazed lantern turret
  const cupolaBase = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.3, 1.9), trimMat);
  cupolaBase.position.y = 7.75;
  cupolaBase.castShadow = true;
  const cupolaBody = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.72, 1.4), stoneTrimMat);
  cupolaBody.position.y = 8.24;
  cupolaBody.castShadow = true;
  const cupolaGlass = new THREE.Mesh(new THREE.BoxGeometry(1.76, 0.42, 1.46), winGlassMat);
  cupolaGlass.position.y = 8.26;
  const cupolaCap = new THREE.Mesh(new THREE.ConeGeometry(1.38, 0.88, 4), roofMat);
  cupolaCap.rotation.y = Math.PI / 4;
  cupolaCap.position.y = 9.04;
  cupolaCap.castShadow = true;
  const finial = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 10), brassMat);
  finial.position.y = 9.52;
  group.add(cupolaBase, cupolaBody, cupolaGlass, cupolaCap, finial);

  // 4. Grand Entrance Portico, Columns, Lantern Sconces & Double Doors
  const doorFaceZ = spec.facingSign * 4.02;
  const porticoOut = spec.facingSign;

  const doorFrame = new THREE.Mesh(new THREE.BoxGeometry(2.65, 3.45, 0.26), frameMat);
  doorFrame.position.set(0, 2.1, doorFaceZ);
  const doorLeaf = new THREE.Mesh(new THREE.BoxGeometry(2.15, 2.7, 0.3), doorGlassMat);
  doorLeaf.position.set(0, 1.75, doorFaceZ);
  const doorDivider = new THREE.Mesh(new THREE.BoxGeometry(0.08, 2.65, 0.33), frameMat);
  doorDivider.position.set(0, 1.75, doorFaceZ);
  const transom = new THREE.Mesh(new THREE.BoxGeometry(2.15, 0.42, 0.3), winGlassMat);
  transom.position.set(0, 3.38, doorFaceZ);

  // Brass handles
  [-0.18, 0.18].forEach((hx) => {
    const handle = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.32, 0.08), brassMat);
    handle.position.set(hx, 1.65, doorFaceZ + porticoOut * 0.18);
    group.add(handle);
  });

  // Wide portico steps
  const upperLanding = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.36, 1.35), plinthMat);
  upperLanding.position.set(0, 0.18, doorFaceZ + porticoOut * 0.68);
  upperLanding.receiveShadow = true;
  const lowerStep = new THREE.Mesh(new THREE.BoxGeometry(3.9, 0.18, 0.55), stoneTrimMat);
  lowerStep.position.set(0, 0.09, doorFaceZ + porticoOut * 1.48);
  lowerStep.receiveShadow = true;

  // Portico columns & pediment canopy
  [-1.42, 1.42].forEach((cx) => {
    const colBase = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.28, 0.42), stoneTrimMat);
    colBase.position.set(cx, 0.5, doorFaceZ + porticoOut * 1.08);
    const colShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 3.05, 14), stoneTrimMat);
    colShaft.position.set(cx, 2.15, doorFaceZ + porticoOut * 1.08);
    colShaft.castShadow = true;
    const colCap = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.2, 0.4), stoneTrimMat);
    colCap.position.set(cx, 3.74, doorFaceZ + porticoOut * 1.08);
    group.add(colBase, colShaft, colCap);
  });

  const canopy = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.22, 1.55), trimMat);
  canopy.position.set(0, 3.92, doorFaceZ + porticoOut * 0.72);
  canopy.castShadow = true;
  const canopyTrim = new THREE.Mesh(new THREE.BoxGeometry(3.76, 0.14, 1.68), stoneTrimMat);
  canopyTrim.position.set(0, 4.08, doorFaceZ + porticoOut * 0.72);

  // Flanking wall sconces
  [-1.65, 1.65].forEach((sx) => {
    const sconceArm = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.26), frameMat);
    sconceArm.position.set(sx, 2.72, doorFaceZ + porticoOut * 0.12);
    const sconceGlobe = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.26, 0.18), lanternGlowMat);
    sconceGlobe.position.set(sx, 2.86, doorFaceZ + porticoOut * 0.2);
    group.add(sconceArm, sconceGlobe);
  });

  group.add(
    doorFrame,
    doorLeaf,
    doorDivider,
    transom,
    upperLanding,
    lowerStep,
    canopy,
    canopyTrim
  );

  // 5. Detailed Windows on Front, Sides, and Back Facades
  [-3.2, 3.2].forEach((wx) => {
    const fWin = createWindowAssembly(1.8, 1.75, frameMat, winGlassMat, stoneTrimMat);
    fWin.position.set(wx, 2.95, doorFaceZ);
    group.add(fWin);

    // Flower boxes beneath front windows
    const box = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.24, 0.34), trimMat);
    box.position.set(wx, 1.82, doorFaceZ + porticoOut * 0.2);
    const foliage = new THREE.Mesh(
      new THREE.BoxGeometry(1.62, 0.22, 0.28),
      new THREE.MeshStandardMaterial({ color: 0x3b8747, roughness: 0.85 })
    );
    foliage.position.set(wx, 1.98, doorFaceZ + porticoOut * 0.2);
    group.add(box, foliage);
  });

  // Side windows (rotated 90 deg)
  [-5.02, 5.02].forEach((sx) => {
    [-1.7, 1.7].forEach((sz) => {
      const sWin = createWindowAssembly(1.65, 1.7, frameMat, winGlassMat, stoneTrimMat);
      sWin.rotation.y = Math.PI / 2;
      sWin.position.set(sx, 2.95, sz);
      group.add(sWin);
    });
  });

  // Back facade windows
  const backFaceZ = -spec.facingSign * 4.02;
  [-3.0, 0, 3.0].forEach((bx) => {
    const bWin = createWindowAssembly(1.7, 1.7, frameMat, winGlassMat, stoneTrimMat);
    bWin.position.set(bx, 2.95, backFaceZ);
    group.add(bWin);
  });

  // 6. Building-Specific Campus Character Props (tucked neatly near facade)
  if (spec.id === 'classroom') {
    // Campus notice board beside steps
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.5, 0.12), frameMat);
    post.position.set(3.4, 0.75, doorFaceZ + porticoOut * 0.9);
    const board = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.75, 0.1), trimMat);
    board.position.set(3.4, 1.38, doorFaceZ + porticoOut * 0.9);
    const paper = new THREE.Mesh(
      new THREE.BoxGeometry(0.92, 0.56, 0.12),
      new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.9 })
    );
    paper.position.set(3.4, 1.38, doorFaceZ + porticoOut * 0.9);
    group.add(post, board, paper);
  } else if (spec.id === 'library') {
    // Book-return pedestal
    const dropBox = new THREE.Mesh(new THREE.BoxGeometry(0.65, 1.05, 0.55), trimMat);
    dropBox.position.set(-3.4, 0.525, doorFaceZ + porticoOut * 0.8);
    dropBox.castShadow = true;
    const slotTrim = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.12, 0.58), brassMat);
    slotTrim.position.set(-3.4, 0.82, doorFaceZ + porticoOut * 0.8);
    group.add(dropBox, slotTrim);
  } else if (spec.id === 'canteen') {
    // Cafe bistro umbrella table tucked beside front apron
    const tx = spec.x + 3.5;
    const tz = spec.z + porticoOut * 5.2;
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 2.25, 10), frameMat);
    pole.position.set(3.5, 1.125, porticoOut * 5.2);
    const tableTop = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.07, 16), stoneTrimMat);
    tableTop.position.set(3.5, 0.78, porticoOut * 5.2);
    tableTop.castShadow = true;
    const umbrella = new THREE.Mesh(
      new THREE.ConeGeometry(1.15, 0.55, 8),
      new THREE.MeshStandardMaterial({ color: 0xe11d48, roughness: 0.72 })
    );
    umbrella.position.set(3.5, 2.15, porticoOut * 5.2);
    umbrella.castShadow = true;
    group.add(pole, tableTop, umbrella);
    accentColliders.push({ x: tx, z: tz, hw: 0.7, hd: 0.7 });
  } else if (spec.id === 'principal') {
    // Formal stone urn planters flanking portico columns + crest medallion above canopy
    const crest = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.12, 18), brassMat);
    crest.rotation.x = Math.PI / 2;
    crest.position.set(0, 4.48, doorFaceZ + porticoOut * 0.12);
    group.add(crest);
    [-2.25, 2.25].forEach((ux) => {
      const urn = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.22, 0.58, 12), stoneTrimMat);
      urn.position.set(ux, 0.29, doorFaceZ + porticoOut * 1.12);
      urn.castShadow = true;
      const shrub = new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.32, 0),
        new THREE.MeshStandardMaterial({ color: 0x2f855a, roughness: 0.8 })
      );
      shrub.position.set(ux, 0.72, doorFaceZ + porticoOut * 1.12);
      shrub.castShadow = true;
      group.add(urn, shrub);
    });
  }

  return {
    group,
    collider: { x: spec.x, z: spec.z, hw: 5.3, hd: 4.35 },
    accentColliders,
  };
}

export function buildLampPost(x: number, z: number): { group: THREE.Group; collider: BoxCollider } {
  const lamp = new THREE.Group();
  lamp.position.set(x, 0, z);

  const ironMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.42,
    metalness: 0.65,
  });
  const glowMat = new THREE.MeshStandardMaterial({
    color: 0xfef3c7,
    emissive: 0xfbbf24,
    emissiveIntensity: 1.15,
    roughness: 0.2,
  });

  const plinth = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.28, 0.35, 8), ironMat);
  plinth.position.y = 0.175;
  plinth.castShadow = true;

  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.11, 2.9, 10), ironMat);
  pole.position.y = 1.75;
  pole.castShadow = true;

  const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.12, 0.14, 8), ironMat);
  collar.position.y = 3.22;

  const lanternGlass = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.16, 0.42, 6), glowMat);
  lanternGlass.position.y = 3.48;

  const lanternCap = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.26, 6), ironMat);
  lanternCap.position.y = 3.82;
  lanternCap.castShadow = true;

  lamp.add(plinth, pole, collar, lanternGlass, lanternCap);
  return {
    group: lamp,
    collider: { x, z, hw: 0.28, hd: 0.28 },
  };
}

export function buildParkBench(
  x: number,
  z: number,
  rotY: number
): { group: THREE.Group; collider: BoxCollider } {
  const bench = new THREE.Group();
  bench.position.set(x, 0, z);
  bench.rotation.y = rotY;

  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x8b5a34,
    roughness: 0.76,
    metalness: 0.04,
  });
  const ironMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.45,
    metalness: 0.6,
  });

  [-0.72, 0.72].forEach((lx) => {
    const frontLeg = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.45, 0.48), ironMat);
    frontLeg.position.set(lx, 0.225, 0);
    frontLeg.castShadow = true;
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.22, 0.46), ironMat);
    arm.position.set(lx, 0.56, -0.02);
    bench.add(frontLeg, arm);
  });

  const seat = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.08, 0.46), woodMat);
  seat.position.set(0, 0.45, 0.03);
  seat.castShadow = true;
  seat.receiveShadow = true;

  const backrest = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.42, 0.07), woodMat);
  backrest.position.set(0, 0.72, -0.2);
  backrest.rotation.x = -0.14;
  backrest.castShadow = true;

  bench.add(seat, backrest);

  const isHorizontal = Math.abs(Math.sin(rotY)) < 0.7;
  return {
    group: bench,
    collider: {
      x,
      z,
      hw: isHorizontal ? 0.88 : 0.34,
      hd: isHorizontal ? 0.34 : 0.88,
    },
  };
}

export function buildPlanterHedge(
  x: number,
  z: number,
  w: number,
  d: number
): { group: THREE.Group; collider: BoxCollider } {
  const planter = new THREE.Group();
  planter.position.set(x, 0, z);

  const stoneMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    roughness: 0.88,
    metalness: 0.05,
  });
  const hedgeMat = new THREE.MeshStandardMaterial({
    color: 0x3b7d45,
    roughness: 0.86,
    metalness: 0.02,
  });
  const blossomColors = [0xf59e0b, 0xf43f5e, 0xfbbf24];

  const curb = new THREE.Mesh(new THREE.BoxGeometry(w, 0.28, d), stoneMat);
  curb.position.y = 0.14;
  curb.castShadow = true;
  curb.receiveShadow = true;

  const hedge = new THREE.Mesh(new THREE.BoxGeometry(w - 0.18, 0.52, d - 0.18), hedgeMat);
  hedge.position.y = 0.48;
  hedge.castShadow = true;
  hedge.receiveShadow = true;
  planter.add(curb, hedge);

  const count = Math.max(2, Math.floor(Math.max(w, d) * 1.4));
  for (let i = 0; i < count; i += 1) {
    const t = (i + 0.5) / count - 0.5;
    const fx = w >= d ? t * (w - 0.45) : 0;
    const fz = d > w ? t * (d - 0.45) : 0;
    const flower = new THREE.Mesh(
      new THREE.DodecahedronGeometry(0.11, 0),
      new THREE.MeshStandardMaterial({
        color: blossomColors[i % blossomColors.length],
        roughness: 0.72,
      })
    );
    flower.position.set(fx, 0.76, fz);
    planter.add(flower);
  }

  return {
    group: planter,
    collider: { x, z, hw: w / 2, hd: d / 2 },
  };
}

export function buildGatePillar(x: number, z: number): { group: THREE.Group; collider: BoxCollider } {
  const pillar = new THREE.Group();
  pillar.position.set(x, 0, z);

  const stoneMat = new THREE.MeshStandardMaterial({
    color: 0x64748b,
    roughness: 0.86,
    metalness: 0.08,
  });
  const capMat = new THREE.MeshStandardMaterial({
    color: 0xcbd5e1,
    roughness: 0.78,
    metalness: 0.06,
  });
  const glowMat = new THREE.MeshStandardMaterial({
    color: 0xfef3c7,
    emissive: 0xf59e0b,
    emissiveIntensity: 0.95,
    roughness: 0.25,
  });

  const base = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.35, 0.86), capMat);
  base.position.y = 0.175;
  base.castShadow = true;

  const shaft = new THREE.Mesh(new THREE.BoxGeometry(0.68, 1.85, 0.68), stoneMat);
  shaft.position.y = 1.25;
  shaft.castShadow = true;

  const cap = new THREE.Mesh(new THREE.BoxGeometry(0.88, 0.2, 0.88), capMat);
  cap.position.y = 2.26;
  cap.castShadow = true;

  const lantern = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.36, 0.32), glowMat);
  lantern.position.y = 2.54;

  const lanternRoof = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.22, 4), stoneMat);
  lanternRoof.rotation.y = Math.PI / 4;
  lanternRoof.position.y = 2.82;

  pillar.add(base, shaft, cap, lantern, lanternRoof);
  return {
    group: pillar,
    collider: { x, z, hw: 0.45, hd: 0.45 },
  };
}

export function buildBroadleafTree(
  x: number,
  z: number,
  scale: number,
  tintVariant: number
): THREE.Group {
  const tree = new THREE.Group();
  tree.position.set(x, 0, z);
  tree.scale.setScalar(scale);

  const barkMat = new THREE.MeshStandardMaterial({
    color: 0x6b4c35,
    roughness: 0.92,
    metalness: 0.02,
  });
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.3, 1.9, 8), barkMat);
  trunk.position.y = 0.95;
  trunk.castShadow = true;
  tree.add(trunk);

  const palette = [0x4b934d, 0x5ba356, 0x739c44, 0xc98842];
  const leafMat = new THREE.MeshStandardMaterial({
    color: palette[tintVariant % palette.length],
    roughness: 0.78,
    metalness: 0.02,
  });

  const mainCrown = new THREE.Mesh(new THREE.DodecahedronGeometry(1.35, 1), leafMat);
  mainCrown.position.set(0, 2.8, 0);
  mainCrown.castShadow = true;
  mainCrown.receiveShadow = true;

  const sub1 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.95, 1), leafMat);
  sub1.position.set(0.75, 2.45, 0.35);
  sub1.castShadow = true;

  const sub2 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.88, 1), leafMat);
  sub2.position.set(-0.68, 2.55, -0.38);
  sub2.castShadow = true;

  const top = new THREE.Mesh(new THREE.DodecahedronGeometry(0.82, 1), leafMat);
  top.position.set(0.05, 3.68, -0.05);
  top.castShadow = true;

  tree.add(mainCrown, sub1, sub2, top);
  return tree;
}
