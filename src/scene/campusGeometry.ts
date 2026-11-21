import * as THREE from 'three';
import { CAMPUS_ROOMS } from '../data/questionnaires';
import { RoomConfig, RoomId } from '../types';

export interface BoxCollider {
  x: number;
  z: number;
  hw: number;
  hd: number;
}

export interface CameraBox {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  minZ: number;
  maxZ: number;
}

export interface BuildingEntrance {
  roomId: RoomId;
  name: string;
  x: number;
  z: number;
  exitX: number;
  exitZ: number;
  ring: THREE.Mesh;
  beacon: THREE.Mesh;
  labelSprite: THREE.Sprite;
  updateStatusLabel: (completedCount: number, totalCount: number, completed: boolean) => void;
}

export interface RoomInterior {
  group: THREE.Group;
  chairPos: THREE.Vector3;
  deskPos: THREE.Vector3;
  eyePos: THREE.Vector3;
  lookAtTarget: THREE.Vector3;
  patientSpot: THREE.Vector3;
  patientExitSpot: THREE.Vector3;
  queueSpots: THREE.Vector3[];
  guideArrow: THREE.Group;
  guideRing: THREE.Mesh;
  guideChevrons: THREE.Group;
  deskCollider: BoxCollider;
  roomColliders: BoxCollider[];
  roomCameraBounds: CameraBox;
  roomHeaderSprite: THREE.Sprite;
  setRoomSign: (title: string, accentHex: number) => void;
}

export interface CampusWorld {
  campusGroup: THREE.Group;
  roomGroup: THREE.Group;
  outdoorColliders: BoxCollider[];
  outdoorCameraObstacles: CameraBox[];
  entrances: BuildingEntrance[];
  roomInterior: RoomInterior;
  dispose: () => void;
}

function createSignCanvas(
  text: string,
  bgColor: string,
  borderColor: string
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 460;
  canvas.height = 96;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 4;
  ctx.strokeRect(4, 4, canvas.width - 8, canvas.height - 8);

  ctx.fillStyle = '#f8fafc';
  ctx.font = '700 32px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, canvas.width / 2, canvas.height / 2 + 1);
  return canvas;
}

function createSignTexture(text: string, bgColor: string, borderColor: string): THREE.CanvasTexture {
  const canvas = createSignCanvas(text, bgColor, borderColor);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createLabelSprite(
  text: string,
  x: number,
  y: number,
  z: number,
  scale: number,
  bg = 'rgba(15, 23, 42, 0.82)',
  border = 'rgba(255, 255, 255, 0.28)'
): THREE.Sprite {
  const tex = createSignTexture(text, bg, border);
  const material = new THREE.SpriteMaterial({ map: tex, depthTest: false, transparent: true });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(5.4 * scale, 1.12 * scale, 1);
  sprite.position.set(x, y, z);
  return sprite;
}

function createPavingTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#d6cfc2';
  ctx.fillRect(0, 0, 256, 256);

  ctx.strokeStyle = 'rgba(110, 102, 88, 0.22)';
  ctx.lineWidth = 2;
  const step = 64;
  for (let y = 0; y < 256; y += step) {
    for (let x = 0; x < 256; x += step) {
      const offset = (y / step) % 2 === 0 ? 0 : step / 2;
      ctx.strokeRect((x + offset) % 256, y, step, step);
    }
  }

  for (let i = 0; i < 600; i += 1) {
    const gx = Math.random() * 256;
    const gy = Math.random() * 256;
    ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255,255,255,0.08)' : 'rgba(90,82,70,0.06)';
    ctx.fillRect(gx, gy, 2, 2);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(6, 6);
  tex.anisotropy = maxAnisotropy;
  return tex;
}

function createMeadowTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#74ad66';
  ctx.fillRect(0, 0, 256, 256);

  for (let i = 0; i < 1200; i += 1) {
    const x = Math.random() * 256;
    const y = Math.random() * 256;
    ctx.fillStyle = i % 3 === 0 ? 'rgba(96, 152, 82, 0.32)' : 'rgba(140, 195, 118, 0.24)';
    ctx.fillRect(x, y, 3, 5);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(28, 28);
  tex.anisotropy = maxAnisotropy;
  return tex;
}

function createRoomFloorTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#e7dfd3';
  ctx.fillRect(0, 0, 256, 256);

  ctx.strokeStyle = 'rgba(148, 134, 114, 0.28)';
  ctx.lineWidth = 2;
  for (let y = 0; y < 256; y += 32) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(256, y);
    ctx.stroke();
    const shift = (y / 32) % 2 === 0 ? 0 : 64;
    for (let x = shift; x < 256; x += 128) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + 32);
      ctx.stroke();
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(5, 4);
  tex.anisotropy = maxAnisotropy;
  return tex;
}

function buildCompositeBuilding(spec: RoomConfig): { group: THREE.Group; collider: BoxCollider } {
  const group = new THREE.Group();
  group.position.set(spec.x, 0, spec.z);

  const plinthMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.9, metalness: 0.05 });
  const plinth = new THREE.Mesh(new THREE.BoxGeometry(10.6, 0.45, 8.6), plinthMat);
  plinth.position.y = 0.225;
  plinth.receiveShadow = true;
  plinth.castShadow = true;
  group.add(plinth);

  const wallMat = new THREE.MeshStandardMaterial({ color: spec.wallColor, roughness: 0.82, metalness: 0.04 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(10, 4.8, 8), wallMat);
  body.position.y = 2.85;
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  const trimMat = new THREE.MeshStandardMaterial({ color: spec.trimColor, roughness: 0.55, metalness: 0.15 });
  const cornice = new THREE.Mesh(new THREE.BoxGeometry(10.4, 0.35, 8.4), trimMat);
  cornice.position.y = 5.35;
  cornice.castShadow = true;
  group.add(cornice);

  const roofMat = new THREE.MeshStandardMaterial({ color: spec.roofColor, roughness: 0.68, metalness: 0.08 });
  const roofBase = new THREE.Mesh(new THREE.BoxGeometry(10.8, 0.45, 8.8), roofMat);
  roofBase.position.y = 5.75;
  roofBase.castShadow = true;
  roofBase.receiveShadow = true;
  group.add(roofBase);

  const roofCap = new THREE.Mesh(new THREE.BoxGeometry(8.6, 0.55, 6.6), roofMat);
  roofCap.position.y = 6.22;
  roofCap.castShadow = true;
  group.add(roofCap);

  const doorFaceZ = spec.facingSign * 4.02;
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.45, metalness: 0.35 });
  const doorFrame = new THREE.Mesh(new THREE.BoxGeometry(2.4, 3.2, 0.24), frameMat);
  doorFrame.position.set(0, 1.85, doorFaceZ);
  group.add(doorFrame);

  const doorGlassMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.2, metalness: 0.45 });
  const doorLeaf = new THREE.Mesh(new THREE.BoxGeometry(1.9, 2.85, 0.28), doorGlassMat);
  doorLeaf.position.set(0, 1.72, doorFaceZ);
  group.add(doorLeaf);

  const canopy = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.18, 1.35), trimMat);
  canopy.position.set(0, 3.68, doorFaceZ + spec.facingSign * 0.58);
  canopy.castShadow = true;
  group.add(canopy);

  const step = new THREE.Mesh(new THREE.BoxGeometry(2.9, 0.22, 1.05), plinthMat);
  step.position.set(0, 0.11, doorFaceZ + spec.facingSign * 0.48);
  step.receiveShadow = true;
  group.add(step);

  const winGlassMat = new THREE.MeshStandardMaterial({ color: 0x93c5fd, roughness: 0.16, metalness: 0.32 });
  [-3.1, 3.1].forEach((wx) => {
    const wFrame = new THREE.Mesh(new THREE.BoxGeometry(1.75, 1.65, 0.16), frameMat);
    wFrame.position.set(wx, 2.95, doorFaceZ);
    const wPane = new THREE.Mesh(new THREE.BoxGeometry(1.45, 1.35, 0.2), winGlassMat);
    wPane.position.set(wx, 2.95, doorFaceZ);
    group.add(wFrame, wPane);
  });

  [-5.02, 5.02].forEach((sx) => {
    [-1.6, 1.6].forEach((sz) => {
      const swFrame = new THREE.Mesh(new THREE.BoxGeometry(0.16, 1.6, 1.6), frameMat);
      swFrame.position.set(sx, 2.95, sz);
      const swPane = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.32, 1.32), winGlassMat);
      swPane.position.set(sx, 2.95, sz);
      group.add(swFrame, swPane);
    });
  });

  const signSprite = createLabelSprite(spec.name, 0, 7.65, 0, 1.15);
  group.add(signSprite);

  return {
    group,
    collider: { x: spec.x, z: spec.z, hw: 5.3, hd: 4.3 },
  };
}

function buildCompositeTree(x: number, z: number, scale: number, tintVariant: number): THREE.Group {
  const tree = new THREE.Group();
  tree.position.set(x, 0, z);
  tree.scale.setScalar(scale);

  const barkMat = new THREE.MeshStandardMaterial({ color: 0x6f4e37, roughness: 0.92, metalness: 0.02 });
  const rootFlare = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.42, 0.55, 7), barkMat);
  rootFlare.position.y = 0.275;
  rootFlare.castShadow = true;
  tree.add(rootFlare);

  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.25, 1.7, 7), barkMat);
  trunk.position.y = 1.25;
  trunk.castShadow = true;
  tree.add(trunk);

  const leafColors = [0x3b8747, 0x459452, 0x32753f];
  const leafMat = new THREE.MeshStandardMaterial({
    color: leafColors[tintVariant % leafColors.length],
    roughness: 0.78,
    metalness: 0.02,
  });

  const tier1 = new THREE.Mesh(new THREE.ConeGeometry(1.55, 2.1, 8), leafMat);
  tier1.position.y = 2.6;
  tier1.castShadow = true;
  tier1.receiveShadow = true;

  const tier2 = new THREE.Mesh(new THREE.ConeGeometry(1.2, 1.85, 8), leafMat);
  tier2.position.y = 3.7;
  tier2.castShadow = true;

  const tier3 = new THREE.Mesh(new THREE.ConeGeometry(0.75, 1.35, 8), leafMat);
  tier3.position.y = 4.65;
  tier3.castShadow = true;

  tree.add(tier1, tier2, tier3);
  return tree;
}

function buildPottedPlant(x: number, z: number): THREE.Group {
  const plant = new THREE.Group();
  plant.position.set(x, 0, z);
  const potMat = new THREE.MeshStandardMaterial({ color: 0x9a6b4c, roughness: 0.78, metalness: 0.05 });
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.24, 0.55, 12), potMat);
  pot.position.y = 0.275;
  pot.castShadow = true;

  const soil = new THREE.Mesh(
    new THREE.CylinderGeometry(0.29, 0.29, 0.05, 12),
    new THREE.MeshStandardMaterial({ color: 0x3f2e21, roughness: 0.95 })
  );
  soil.position.y = 0.54;

  const leafMat = new THREE.MeshStandardMaterial({ color: 0x2f855a, roughness: 0.72, metalness: 0.04 });
  const crown1 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.36, 0), leafMat);
  crown1.position.set(0, 0.85, 0);
  crown1.castShadow = true;
  const crown2 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.25, 0), leafMat);
  crown2.position.set(0.16, 1.05, 0.1);
  crown2.castShadow = true;

  plant.add(pot, soil, crown1, crown2);
  return plant;
}

function buildBookshelf(x: number, z: number, rotY: number): THREE.Group {
  const shelf = new THREE.Group();
  shelf.position.set(x, 0, z);
  shelf.rotation.y = rotY;

  const woodMat = new THREE.MeshStandardMaterial({ color: 0x7c583a, roughness: 0.72, metalness: 0.06 });
  const back = new THREE.Mesh(new THREE.BoxGeometry(2.2, 2.5, 0.12), woodMat);
  back.position.set(0, 1.25, -0.2);
  back.castShadow = true;

  const left = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.5, 0.45), woodMat);
  left.position.set(-1.04, 1.25, 0);
  const right = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.5, 0.45), woodMat);
  right.position.set(1.04, 1.25, 0);
  shelf.add(back, left, right);

  [0.2, 0.85, 1.5, 2.15, 2.46].forEach((sy) => {
    const plank = new THREE.Mesh(new THREE.BoxGeometry(2.16, 0.08, 0.44), woodMat);
    plank.position.set(0, sy, 0);
    plank.castShadow = true;
    shelf.add(plank);
  });

  const bookColors = [0x2563eb, 0xd97706, 0x059669, 0xe11d48, 0x475569];
  [0.24, 0.89, 1.54].forEach((by, rowIdx) => {
    for (let b = 0; b < 5; b += 1) {
      const book = new THREE.Mesh(
        new THREE.BoxGeometry(0.24, 0.44, 0.28),
        new THREE.MeshStandardMaterial({ color: bookColors[(b + rowIdx) % bookColors.length], roughness: 0.65 })
      );
      book.position.set(-0.72 + b * 0.34, by + 0.22, 0.02);
      shelf.add(book);
    }
  });

  return shelf;
}

function buildRoomInteriorGroup(maxAnisotropy: number): RoomInterior {
  const group = new THREE.Group();
  const floorTex = createRoomFloorTexture(maxAnisotropy);

  // Room dimensions: 18m wide (-9..9), 14m deep (-6.5..7.5), 4.6m high
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(18, 14),
    new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.72, metalness: 0.05 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  group.add(floor);

  const wallMat = new THREE.MeshStandardMaterial({ color: 0xf4f1ea, roughness: 0.86, metalness: 0.02 });
  const wainscotMat = new THREE.MeshStandardMaterial({ color: 0xd8d0c3, roughness: 0.76, metalness: 0.04 });
  const trimMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.5, metalness: 0.2 });

  // Back wall (-Z behind consultation desk)
  const backWall = new THREE.Mesh(new THREE.BoxGeometry(18, 4.6, 0.3), wallMat);
  backWall.position.set(0, 2.3, -6.5);
  backWall.receiveShadow = true;
  const backWainscot = new THREE.Mesh(new THREE.BoxGeometry(17.8, 1.15, 0.34), wainscotMat);
  backWainscot.position.set(0, 0.575, -6.48);
  group.add(backWall, backWainscot);

  // Left & right walls
  [-9, 9].forEach((wx) => {
    const sideWall = new THREE.Mesh(new THREE.BoxGeometry(0.3, 4.6, 14), wallMat);
    sideWall.position.set(wx, 2.3, 0.5);
    sideWall.receiveShadow = true;
    const sideWainscot = new THREE.Mesh(new THREE.BoxGeometry(0.34, 1.15, 13.8), wainscotMat);
    sideWainscot.position.set(wx, 0.575, 0.5);
    group.add(sideWall, sideWainscot);

    // Bright daylight window panels
    const winFrame = new THREE.Mesh(new THREE.BoxGeometry(0.38, 1.9, 4.6), trimMat);
    winFrame.position.set(wx, 2.6, 0.2);
    const winGlass = new THREE.Mesh(
      new THREE.BoxGeometry(0.42, 1.65, 4.3),
      new THREE.MeshStandardMaterial({ color: 0xdbeafe, emissive: 0xbfdbfe, emissiveIntensity: 0.35, roughness: 0.2 })
    );
    winGlass.position.set(wx, 2.6, 0.2);
    group.add(winFrame, winGlass);
  });

  // Front entrance wall (+Z) with framed exit doorway
  [-5.25, 5.25].forEach((fx) => {
    const seg = new THREE.Mesh(new THREE.BoxGeometry(7.5, 4.6, 0.3), wallMat);
    seg.position.set(fx, 2.3, 7.5);
    group.add(seg);
  });
  const headerWall = new THREE.Mesh(new THREE.BoxGeometry(3.2, 1.4, 0.3), wallMat);
  headerWall.position.set(0, 3.9, 7.5);
  const doorArch = new THREE.Mesh(new THREE.BoxGeometry(3.1, 3.25, 0.36), trimMat);
  doorArch.position.set(0, 1.62, 7.5);
  const doorRecess = new THREE.Mesh(
    new THREE.BoxGeometry(2.7, 3.05, 0.38),
    new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 })
  );
  doorRecess.position.set(0, 1.52, 7.52);
  group.add(headerWall, doorArch, doorRecess);

  // Subtle ceiling beams (open above camera overhead so top-down angles never clip)
  [-3.2, 0.8, 4.8].forEach((bz) => {
    const beam = new THREE.Mesh(new THREE.BoxGeometry(17.8, 0.22, 0.28), trimMat);
    beam.position.set(0, 4.48, bz);
    group.add(beam);
  });

  // Consultation Desk (at z = -2.4)
  const deskGroup = new THREE.Group();
  deskGroup.position.set(0, 0, -2.4);
  const deskTopMat = new THREE.MeshStandardMaterial({ color: 0x8b5e3c, roughness: 0.48, metalness: 0.08 });
  const deskMetalMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.38, metalness: 0.55 });

  const deskTop = new THREE.Mesh(new THREE.BoxGeometry(2.7, 0.1, 1.1), deskTopMat);
  deskTop.position.y = 0.78;
  deskTop.castShadow = true;
  deskTop.receiveShadow = true;

  const modestyPanel = new THREE.Mesh(new THREE.BoxGeometry(2.45, 0.65, 0.08), wainscotMat);
  modestyPanel.position.set(0, 0.42, 0.42);
  modestyPanel.castShadow = true;

  [
    [-1.22, -0.45],
    [1.22, -0.45],
    [-1.22, 0.45],
    [1.22, 0.45],
  ].forEach(([lx, lz]) => {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.74, 0.08), deskMetalMat);
    leg.position.set(lx, 0.37, lz);
    leg.castShadow = true;
    deskGroup.add(leg);
  });

  // Desk props (visible in 1st-person seated view)
  const clipboard = new THREE.Mesh(
    new THREE.BoxGeometry(0.34, 0.025, 0.44),
    new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.8 })
  );
  clipboard.position.set(-0.55, 0.845, -0.15);
  clipboard.rotation.y = 0.15;

  const lampBase = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.13, 0.04, 14), deskMetalMat);
  lampBase.position.set(0.95, 0.85, -0.15);
  const lampStem = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.38, 10), deskMetalMat);
  lampStem.position.set(0.95, 1.04, -0.15);
  const lampShade = new THREE.Mesh(
    new THREE.ConeGeometry(0.14, 0.16, 14),
    new THREE.MeshStandardMaterial({ color: 0x1e40af, roughness: 0.45 })
  );
  lampShade.position.set(0.9, 1.24, -0.12);
  lampShade.rotation.z = 0.25;

  const nameplate = new THREE.Mesh(
    new THREE.BoxGeometry(0.46, 0.11, 0.08),
    new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.35, metalness: 0.4 })
  );
  nameplate.position.set(0.45, 0.885, 0.34);

  deskGroup.add(deskTop, modestyPanel, clipboard, lampBase, lampStem, lampShade, nameplate);
  group.add(deskGroup);

  // Desk Chair (at z = -3.65, facing +Z toward the patient with clean legroom)
  const chairGroup = new THREE.Group();
  chairGroup.position.set(0, 0, -3.65);
  const cushionMat = new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.68, metalness: 0.05 });

  const basePole = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.055, 0.42, 10), deskMetalMat);
  basePole.position.y = 0.24;
  const baseHub = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.34, 0.06, 10), deskMetalMat);
  baseHub.position.y = 0.04;
  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.1, 0.58), cushionMat);
  seat.position.y = 0.48;
  seat.castShadow = true;
  const backrest = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.62, 0.09), cushionMat);
  backrest.position.set(0, 0.84, -0.25);
  backrest.castShadow = true;
  chairGroup.add(basePole, baseHub, seat, backrest);
  group.add(chairGroup);

  // Room Props: Bookshelves, Plants & Waiting Queue Floor Runner
  group.add(buildBookshelf(-6.5, -5.8, 0));
  group.add(buildBookshelf(6.5, -5.8, 0));
  group.add(buildPottedPlant(-7.8, -5.4));
  group.add(buildPottedPlant(7.8, -5.4));
  group.add(buildPottedPlant(-7.6, 5.6));
  group.add(buildPottedPlant(7.6, 5.6));

  const runnerMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, roughness: 0.88 });
  const queueRunner = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 7.6), runnerMat);
  queueRunner.rotation.x = -Math.PI / 2;
  queueRunner.position.set(0, 0.02, 2.2);
  queueRunner.receiveShadow = true;
  group.add(queueRunner);

  // Room Header Sign on Back Wall
  const roomHeaderSprite = createLabelSprite('Consultation Room', 0, 3.25, -6.1, 0.9, 'rgba(15, 23, 42, 0.86)', '#3b82f6');
  group.add(roomHeaderSprite);

  // Guided Target Ring & Animated Floating 3D Arrow above Chair
  const guideRing = new THREE.Mesh(
    new THREE.TorusGeometry(1.05, 0.065, 10, 36),
    new THREE.MeshStandardMaterial({
      color: 0x2563eb,
      emissive: 0x2563eb,
      emissiveIntensity: 0.65,
      roughness: 0.3,
    })
  );
  guideRing.rotation.x = Math.PI / 2;
  guideRing.position.set(0, 0.05, -3.65);
  group.add(guideRing);

  const guideArrow = new THREE.Group();
  guideArrow.position.set(0, 2.25, -3.65);
  const arrowMat = new THREE.MeshStandardMaterial({
    color: 0x2563eb,
    emissive: 0x1d4ed8,
    emissiveIntensity: 0.55,
    roughness: 0.28,
    metalness: 0.15,
  });
  const arrowTip = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.52, 16), arrowMat);
  arrowTip.rotation.x = Math.PI;
  arrowTip.position.y = -0.18;
  const arrowShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.52, 14), arrowMat);
  arrowShaft.position.y = 0.28;
  guideArrow.add(arrowTip, arrowShaft);
  group.add(guideArrow);

  // Floor directional chevrons angled cleanly toward the desk chair
  const guideChevrons = new THREE.Group();
  const chevMat = new THREE.MeshStandardMaterial({
    color: 0x2563eb,
    emissive: 0x2563eb,
    emissiveIntensity: 0.45,
    transparent: true,
    opacity: 0.72,
  });
  [
    [3.2, 3.2, -0.32],
    [3.0, 0.4, -0.52],
    [2.1, -2.2, -0.78],
  ].forEach(([cx, cz, yaw]) => {
    const dot = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.42, 3), chevMat);
    dot.rotation.order = 'YXZ';
    dot.rotation.y = yaw;
    dot.rotation.x = -Math.PI / 2;
    dot.scale.set(1, 1, 0.35);
    dot.position.set(cx, 0.04, cz);
    guideChevrons.add(dot);
  });
  group.add(guideChevrons);

  const setRoomSign = (title: string, accentHex: number) => {
    const mat = roomHeaderSprite.material as THREE.SpriteMaterial;
    if (mat.map) mat.map.dispose();
    const borderHex = `#${accentHex.toString(16).padStart(6, '0')}`;
    mat.map = createSignTexture(title, 'rgba(15, 23, 42, 0.88)', borderHex);
    mat.needsUpdate = true;
  };

  const deskCollider: BoxCollider = { x: 0, z: -2.4, hw: 1.42, hd: 0.58 };
  const roomColliders: BoxCollider[] = [
    deskCollider,
    // Bookshelves
    { x: -6.5, z: -5.8, hw: 1.15, hd: 0.3 },
    { x: 6.5, z: -5.8, hw: 1.15, hd: 0.3 },
    // Potted plants
    { x: -7.8, z: -5.4, hw: 0.42, hd: 0.42 },
    { x: 7.8, z: -5.4, hw: 0.42, hd: 0.42 },
    { x: -7.6, z: 5.6, hw: 0.42, hd: 0.42 },
    { x: 7.6, z: 5.6, hw: 0.42, hd: 0.42 },
  ];

  // Camera stays strictly inside room walls (x=±8.85, z=-6.35..7.35) and under beams (y=4.37)
  const roomCameraBounds: CameraBox = {
    minX: -8.35,
    maxX: 8.35,
    minY: 0.42,
    maxY: 3.95,
    minZ: -5.85,
    maxZ: 6.85,
  };

  return {
    group,
    chairPos: new THREE.Vector3(0, 0, -3.65),
    deskPos: new THREE.Vector3(0, 0, -2.4),
    eyePos: new THREE.Vector3(0, 1.48, -3.45),
    lookAtTarget: new THREE.Vector3(0, 1.36, -0.95),
    patientSpot: new THREE.Vector3(0, 0, -0.95),
    patientExitSpot: new THREE.Vector3(6.2, 0, 3.8),
    queueSpots: [
      new THREE.Vector3(-1.35, 0, 1.25),
      new THREE.Vector3(-1.35, 0, 2.35),
      new THREE.Vector3(-1.35, 0, 3.45),
      new THREE.Vector3(-1.35, 0, 4.55),
      new THREE.Vector3(-1.35, 0, 5.65),
    ],
    guideArrow,
    guideRing,
    guideChevrons,
    deskCollider,
    roomColliders,
    roomCameraBounds,
    roomHeaderSprite,
    setRoomSign,
  };
}

export function buildCampusWorld(scene: THREE.Scene, maxAnisotropy: number): CampusWorld {
  const campusGroup = new THREE.Group();
  scene.add(campusGroup);

  const meadowTex = createMeadowTexture(maxAnisotropy);
  const pavingTex = createPavingTexture(maxAnisotropy);

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(180, 180),
    new THREE.MeshStandardMaterial({ map: meadowTex, roughness: 0.94, metalness: 0.02 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  campusGroup.add(ground);

  const pathMat = new THREE.MeshStandardMaterial({ map: pavingTex, roughness: 0.85, metalness: 0.04 });
  const curbMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.88, metalness: 0.05 });

  [
    [46, 5.2],
    [5.2, 46],
  ].forEach(([w, d]) => {
    const curb = new THREE.Mesh(new THREE.BoxGeometry(w + 0.4, 0.04, d + 0.4), curbMat);
    curb.position.y = 0.02;
    curb.receiveShadow = true;
    campusGroup.add(curb);

    const path = new THREE.Mesh(new THREE.PlaneGeometry(w, d), pathMat);
    path.rotation.x = -Math.PI / 2;
    path.position.y = 0.045;
    path.receiveShadow = true;
    campusGroup.add(path);
  });

  const plazaPad = new THREE.Mesh(new THREE.CylinderGeometry(4.4, 4.5, 0.05, 32), pathMat);
  plazaPad.position.y = 0.03;
  plazaPad.receiveShadow = true;
  campusGroup.add(plazaPad);

  const plazaTrim = new THREE.Mesh(new THREE.TorusGeometry(4.45, 0.12, 8, 48), curbMat);
  plazaTrim.rotation.x = Math.PI / 2;
  plazaTrim.position.y = 0.06;
  campusGroup.add(plazaTrim);

  // 4 Buildings + Entrances
  const outdoorColliders: BoxCollider[] = [];
  const outdoorCameraObstacles: CameraBox[] = [];
  const entrances: BuildingEntrance[] = [];

  CAMPUS_ROOMS.forEach((room) => {
    const built = buildCompositeBuilding(room);
    campusGroup.add(built.group);
    outdoorColliders.push(built.collider);
    outdoorCameraObstacles.push({
      minX: room.x - 5.65,
      maxX: room.x + 5.65,
      minY: 0,
      maxY: 6.75,
      minZ: room.z - 4.65,
      maxZ: room.z + 4.65,
    });

    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(1.45, 0.1, 10, 40),
      new THREE.MeshStandardMaterial({
        color: 0x2563eb,
        emissive: 0x2563eb,
        emissiveIntensity: 0.55,
        roughness: 0.3,
      })
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.set(room.doorX, 0.08, room.doorZ);
    campusGroup.add(ring);

    const beacon = new THREE.Mesh(
      new THREE.CylinderGeometry(0.4, 1.2, 2.8, 24, 1, true),
      new THREE.MeshStandardMaterial({
        color: 0x3b82f6,
        emissive: 0x2563eb,
        emissiveIntensity: 0.4,
        transparent: true,
        opacity: 0.14,
        side: THREE.DoubleSide,
        depthWrite: false,
      })
    );
    beacon.position.set(room.doorX, 1.45, room.doorZ);
    campusGroup.add(beacon);

    const labelSprite = createLabelSprite(
      `Enter · 0/${room.questions.length}`,
      room.doorX,
      2.35,
      room.doorZ,
      0.66,
      'rgba(30, 64, 175, 0.86)',
      'rgba(147, 197, 253, 0.5)'
    );
    campusGroup.add(labelSprite);

    const updateStatusLabel = (completedCount: number, totalCount: number, completed: boolean) => {
      const mat = labelSprite.material as THREE.SpriteMaterial;
      if (mat.map) mat.map.dispose();
      const ringMat = ring.material as THREE.MeshStandardMaterial;
      const beaconMat = beacon.material as THREE.MeshStandardMaterial;

      if (completed) {
        ringMat.color.setHex(0x10b981);
        ringMat.emissive.setHex(0x10b981);
        beaconMat.color.setHex(0x10b981);
        beaconMat.opacity = 0.08;
        mat.map = createSignTexture(
          `Done · ${completedCount}/${totalCount}`,
          'rgba(6, 95, 70, 0.9)',
          'rgba(110, 231, 183, 0.6)'
        );
      } else {
        ringMat.color.setHex(0x2563eb);
        ringMat.emissive.setHex(0x2563eb);
        beaconMat.color.setHex(0x3b82f6);
        beaconMat.opacity = 0.14;
        mat.map = createSignTexture(
          `Enter · ${completedCount}/${totalCount}`,
          'rgba(30, 64, 175, 0.86)',
          'rgba(147, 197, 253, 0.5)'
        );
      }
      mat.needsUpdate = true;
    };

    entrances.push({
      roomId: room.id,
      name: room.name,
      x: room.doorX,
      z: room.doorZ,
      exitX: room.doorX,
      exitZ: room.doorZ + room.facingSign * 2.4,
      ring,
      beacon,
      labelSprite,
      updateStatusLabel,
    });
  });

  // Perimeter Fence & Trees
  const postMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.85, metalness: 0.1 });
  const railMat = new THREE.MeshStandardMaterial({ color: 0x785b42, roughness: 0.88, metalness: 0.04 });
  [-25.5, 25.5].forEach((edge) => {
    for (let p = -24; p <= 24; p += 6) {
      const postX = new THREE.Mesh(new THREE.BoxGeometry(0.32, 1.05, 0.32), postMat);
      postX.position.set(p, 0.525, edge);
      postX.castShadow = true;
      const postZ = new THREE.Mesh(new THREE.BoxGeometry(0.32, 1.05, 0.32), postMat);
      postZ.position.set(edge, 0.525, p);
      postZ.castShadow = true;
      campusGroup.add(postX, postZ);
    }
    const railH = new THREE.Mesh(new THREE.BoxGeometry(51, 0.1, 0.1), railMat);
    railH.position.set(0, 0.72, edge);
    const railV = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 51), railMat);
    railV.position.set(edge, 0.72, 0);
    campusGroup.add(railH, railV);
  });

  for (let i = 0; i < 38; i += 1) {
    const angle = i * 2.39996;
    const radius = i < 14 ? 19 + (i % 4) * 1.8 : 28 + (i % 5) * 3.5;
    const tx = Math.cos(angle) * radius;
    const tz = Math.sin(angle) * radius;
    if (Math.abs(tx) < 6.8 || Math.abs(tz) < 6.8) continue;
    if (Math.abs(Math.abs(tx) - 14) < 7.6 && Math.abs(Math.abs(tz) - 14) < 6.6) continue;
    // Keep trees clear of the perimeter fence line
    if (Math.abs(Math.abs(tx) - 25.5) < 1.6 || Math.abs(Math.abs(tz) - 25.5) < 1.6) continue;
    const scale = 0.85 + ((i * 37) % 30) / 100;
    campusGroup.add(buildCompositeTree(tx, tz, scale, i));
    if (Math.abs(tx) < 24.5 && Math.abs(tz) < 24.5) {
      outdoorColliders.push({ x: tx, z: tz, hw: 0.42 * scale, hd: 0.42 * scale });
    }
  }

  // Room Interior Group (hidden initially until entering a building)
  const roomInterior = buildRoomInteriorGroup(maxAnisotropy);
  roomInterior.group.visible = false;
  scene.add(roomInterior.group);

  return {
    campusGroup,
    roomGroup: roomInterior.group,
    outdoorColliders,
    outdoorCameraObstacles,
    entrances,
    roomInterior,
    dispose: () => {
      meadowTex.dispose();
      pavingTex.dispose();
      scene.traverse((obj) => {
        const mesh = obj as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
        if (mesh.material) {
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((m) => m.dispose());
          } else {
            mesh.material.dispose();
          }
        }
      });
    },
  };
}
