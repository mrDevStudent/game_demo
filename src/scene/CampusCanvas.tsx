import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { clone as cloneSkeleton } from 'three/examples/jsm/utils/SkeletonUtils.js';
import {
  BoxCollider,
  buildCampusWorld,
  CameraBox,
  CampusWorld,
} from './campusGeometry';
import {
  createNpcGestureClips,
  NpcAnimationController,
  NpcGestureClips,
} from './npcAnimationController';
import { CAMPUS_ROOMS, NPC_MODEL_FILES, TOTAL_QUESTIONNAIRES } from '../data/questionnaires';
import {
  CampusMode,
  GenderOption,
  OptionLetter,
  PatientQuestion,
  QuestionnaireAnswer,
  QuestResult,
  RoomId,
  RoomProgress,
  SimPhase,
  TelemetryEvent,
} from '../types';

interface CharacterRig {
  group: THREE.Group;
  mixer: THREE.AnimationMixer;
  walkAction: THREE.AnimationAction;
  idleAction: THREE.AnimationAction;
  walkWeight: number;
}

interface NpcActor {
  group: THREE.Group;
  anim: NpcAnimationController;
  question: PatientQuestion;
  state: 'queued' | 'walking_to_desk' | 'at_desk' | 'acknowledging' | 'leaving' | 'done';
  targetPos: THREE.Vector3;
  targetHeading: number;
  ackRemaining: number;
}

export interface JoystickInput {
  active: boolean;
  x: number;
  y: number;
}

interface CampusCanvasProps {
  phase: SimPhase;
  selectedGender: GenderOption;
  demographicsSnapshot: {
    name: string;
    age: number;
    gender: GenderOption;
    section: string;
    consented: boolean;
    consentTimestamp: string;
  } | null;
  sessionResetKey: number;
  joystickRef: React.MutableRefObject<JoystickInput>;
  submitAnswerRef: React.MutableRefObject<((option: OptionLetter) => void) | null>;
  leaveRoomRef: React.MutableRefObject<(() => void) | null>;
  retryModelsRef?: React.MutableRefObject<(() => void) | null>;
  onModelsLoaded: () => void;
  onModelsError: (err: string) => void;
  onRoomProgressChange: (rooms: RoomProgress[]) => void;
  onModeChange: (mode: CampusMode, activeRoomId: RoomId | null) => void;
  onActiveQuestionChange: (
    question: PatientQuestion | null,
    roomCounter: { roomName: string; current: number; total: number } | null
  ) => void;
  onTimerTick: (elapsedMs: number) => void;
  onToast: (message: string) => void;
  onPickupSfx: () => void;
  onQuestComplete: (result: QuestResult) => void;
}

const MODEL_BASES = Array.from(
  new Set([
    `${import.meta.env.BASE_URL || '/'}models/`,
    '/models/',
    'models/',
    'public/models/',
  ])
);

function inspectBinaryError(file: string, buf: ArrayBuffer): string | null {
  if (buf.byteLength < 64) {
    return `${file} is empty or truncated`;
  }
  const head = new TextDecoder().decode(new Uint8Array(buf, 0, Math.min(48, buf.byteLength)));
  if (head.startsWith('version https://git-lfs.github.com')) {
    return `${file} is a Git LFS pointer (enable Git LFS in Vercel or commit raw model)`;
  }
  if (head.trimStart().startsWith('<!') || head.trimStart().toLowerCase().startsWith('<html')) {
    return `${file} missing on host (returned HTML)`;
  }
  if (/\.glb$/i.test(file) && head.slice(0, 4) !== 'glTF') {
    return `${file} is not a valid GLB binary`;
  }
  return null;
}

async function fetchAssetBuffer(file: string): Promise<ArrayBuffer> {
  const encoded = encodeURIComponent(file);
  let lastReason = 'not found';

  for (let attempt = 0; attempt < 2; attempt += 1) {
    for (const base of MODEL_BASES) {
      try {
        const res = await fetch(`${base}${encoded}`, {
          cache: attempt === 0 ? 'default' : 'no-store',
        });
        if (!res.ok) {
          lastReason = `HTTP ${res.status}`;
          continue;
        }
        const contentType = (res.headers.get('content-type') || '').toLowerCase();
        if (contentType.includes('text/html')) {
          lastReason = '404 HTML fallback';
          continue;
        }
        const buf = await res.arrayBuffer();
        const binaryErr = inspectBinaryError(file, buf);
        if (binaryErr) {
          if (binaryErr.includes('Git LFS')) {
            throw new Error(binaryErr);
          }
          lastReason = binaryErr;
          continue;
        }
        return buf;
      } catch (err) {
        if (err instanceof Error && err.message.includes('Git LFS')) {
          throw err;
        }
        lastReason = err instanceof Error ? err.message : 'network error';
      }
    }
    if (attempt === 0) {
      await new Promise((r) => window.setTimeout(r, 350));
    }
  }
  throw new Error(`Failed loading ${file}: ${lastReason}`);
}

function detectSoftwareWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param));
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
}

function moveAndFace(
  currentPos: THREE.Vector3,
  targetPos: THREE.Vector3,
  currentHeading: number,
  speed: number,
  dt: number
): { arrived: boolean; heading: number } {
  const dx = targetPos.x - currentPos.x;
  const dz = targetPos.z - currentPos.z;
  const dist = Math.hypot(dx, dz);
  if (dist <= 0.06) {
    currentPos.x = targetPos.x;
    currentPos.z = targetPos.z;
    return { arrived: true, heading: currentHeading };
  }
  const step = Math.min(dist, speed * dt);
  currentPos.x += (dx / dist) * step;
  currentPos.z += (dz / dist) * step;
  const targetH = Math.atan2(dx, dz);
  let deltaH = targetH - currentHeading;
  deltaH = Math.atan2(Math.sin(deltaH), Math.cos(deltaH));
  const nextH = currentHeading + deltaH * Math.min(1, dt * 12);
  return { arrived: false, heading: nextH };
}

function makeRotationOnlyClip(name: string, clip: THREE.AnimationClip): THREE.AnimationClip {
  const rotTracks = clip.tracks.filter((t) => !t.name.endsWith('.position'));
  return new THREE.AnimationClip(name, clip.duration, rotTracks);
}

function clampCameraInsideBox(
  origin: THREE.Vector3,
  camPos: THREE.Vector3,
  bounds: CameraBox
): void {
  const vx = camPos.x - origin.x;
  const vy = camPos.y - origin.y;
  const vz = camPos.z - origin.z;
  let tMax = 1;

  if (vx > 1e-6) tMax = Math.min(tMax, (bounds.maxX - origin.x) / vx);
  else if (vx < -1e-6) tMax = Math.min(tMax, (bounds.minX - origin.x) / vx);

  if (vy > 1e-6) tMax = Math.min(tMax, (bounds.maxY - origin.y) / vy);
  else if (vy < -1e-6) tMax = Math.min(tMax, (bounds.minY - origin.y) / vy);

  if (vz > 1e-6) tMax = Math.min(tMax, (bounds.maxZ - origin.z) / vz);
  else if (vz < -1e-6) tMax = Math.min(tMax, (bounds.minZ - origin.z) / vz);

  const t = Math.max(0.08, Math.min(1, tMax));
  camPos.set(origin.x + vx * t, origin.y + vy * t, origin.z + vz * t);
  camPos.x = THREE.MathUtils.clamp(camPos.x, bounds.minX, bounds.maxX);
  camPos.y = THREE.MathUtils.clamp(camPos.y, bounds.minY, bounds.maxY);
  camPos.z = THREE.MathUtils.clamp(camPos.z, bounds.minZ, bounds.maxZ);
}

function clipCameraOutsideBoxes(
  origin: THREE.Vector3,
  camPos: THREE.Vector3,
  obstacles: CameraBox[]
): void {
  const vx = camPos.x - origin.x;
  const vy = camPos.y - origin.y;
  const vz = camPos.z - origin.z;
  let bestT = 1;

  for (let i = 0; i < obstacles.length; i += 1) {
    const b = obstacles[i];
    let tMin = 0;
    let tMax = bestT;

    if (Math.abs(vx) < 1e-6) {
      if (origin.x < b.minX || origin.x > b.maxX) continue;
    } else {
      let tx1 = (b.minX - origin.x) / vx;
      let tx2 = (b.maxX - origin.x) / vx;
      if (tx1 > tx2) {
        const tmp = tx1;
        tx1 = tx2;
        tx2 = tmp;
      }
      tMin = Math.max(tMin, tx1);
      tMax = Math.min(tMax, tx2);
      if (tMin > tMax) continue;
    }

    if (Math.abs(vy) < 1e-6) {
      if (origin.y < b.minY || origin.y > b.maxY) continue;
    } else {
      let ty1 = (b.minY - origin.y) / vy;
      let ty2 = (b.maxY - origin.y) / vy;
      if (ty1 > ty2) {
        const tmp = ty1;
        ty1 = ty2;
        ty2 = tmp;
      }
      tMin = Math.max(tMin, ty1);
      tMax = Math.min(tMax, ty2);
      if (tMin > tMax) continue;
    }

    if (Math.abs(vz) < 1e-6) {
      if (origin.z < b.minZ || origin.z > b.maxZ) continue;
    } else {
      let tz1 = (b.minZ - origin.z) / vz;
      let tz2 = (b.maxZ - origin.z) / vz;
      if (tz1 > tz2) {
        const tmp = tz1;
        tz1 = tz2;
        tz2 = tmp;
      }
      tMin = Math.max(tMin, tz1);
      tMax = Math.min(tMax, tz2);
      if (tMin > tMax) continue;
    }

    if (tMin > 0 && tMin < bestT) {
      bestT = Math.max(0.16, tMin - 0.04);
    }
  }

  if (bestT < 1) {
    camPos.set(origin.x + vx * bestT, origin.y + vy * bestT, origin.z + vz * bestT);
  }
  camPos.y = Math.max(0.45, camPos.y);
}

function resolveBoxColliders(
  pos: { x: number; z: number },
  colliders: BoxCollider[],
  margin: number
): void {
  for (let i = 0; i < colliders.length; i += 1) {
    const col = colliders[i];
    const px = pos.x - col.x;
    const pz = pos.z - col.z;
    const ox = col.hw + margin - Math.abs(px);
    const oz = col.hd + margin - Math.abs(pz);
    if (ox > 0 && oz > 0) {
      if (ox < oz) pos.x += Math.sign(px || 1) * ox;
      else pos.z += Math.sign(pz || 1) * oz;
    }
  }
}

export const CampusCanvas: React.FC<CampusCanvasProps> = ({
  phase,
  selectedGender,
  demographicsSnapshot,
  sessionResetKey,
  joystickRef,
  submitAnswerRef,
  leaveRoomRef,
  retryModelsRef,
  onModelsLoaded,
  onModelsError,
  onRoomProgressChange,
  onModeChange,
  onActiveQuestionChange,
  onTimerTick,
  onToast,
  onPickupSfx,
  onQuestComplete,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [contextLost, setContextLost] = useState(false);

  const phaseRef = useRef<SimPhase>(phase);
  const genderRef = useRef<GenderOption>(selectedGender);
  const demoRef = useRef(demographicsSnapshot);
  const callbacksRef = useRef({
    onModelsLoaded,
    onModelsError,
    onRoomProgressChange,
    onModeChange,
    onActiveQuestionChange,
    onTimerTick,
    onToast,
    onPickupSfx,
    onQuestComplete,
  });

  phaseRef.current = phase;
  genderRef.current = selectedGender;
  demoRef.current = demographicsSnapshot;
  callbacksRef.current = {
    onModelsLoaded,
    onModelsError,
    onRoomProgressChange,
    onModeChange,
    onActiveQuestionChange,
    onTimerTick,
    onToast,
    onPickupSfx,
    onQuestComplete,
  };

  const resetFnRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (resetFnRef.current) {
      resetFnRef.current();
    }
  }, [sessionResetKey]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isSoftwareGl = detectSoftwareWebGL();
    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.touchAction = 'none';
    container.appendChild(renderer.domElement);

    const onContextLost = (e: Event) => {
      e.preventDefault();
      setContextLost(true);
    };
    const onContextRestored = () => {
      setContextLost(false);
    };
    renderer.domElement.addEventListener('webglcontextlost', onContextLost);
    renderer.domElement.addEventListener('webglcontextrestored', onContextRestored);

    const scene = new THREE.Scene();
    const outdoorBg = new THREE.Color(0xc2daef);
    const indoorBg = new THREE.Color(0xe6ecf2);
    scene.background = outdoorBg.clone();
    scene.fog = new THREE.Fog(0xc2daef, 36, 98);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const roomEnv = new RoomEnvironment();
    const envTex = pmremGenerator.fromScene(roomEnv, 0.04).texture;
    scene.environment = envTex;
    roomEnv.dispose();
    pmremGenerator.dispose();

    const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 220);
    camera.position.set(-1.45, 1.55, 4.75);
    camera.lookAt(-1.45, 1.05, 0);

    const hemiLight = new THREE.HemisphereLight(0xf8fafc, 0x5c7356, 0.68);
    scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight(0xfff7ed, 1.1);
    sunLight.position.set(12, 22, 10);
    sunLight.castShadow = !isSoftwareGl;
    sunLight.shadow.mapSize.set(2048, 2048);
    sunLight.shadow.bias = -0.0005;
    sunLight.shadow.normalBias = 0.02;
    Object.assign(sunLight.shadow.camera, {
      left: -32,
      right: 32,
      top: 32,
      bottom: -32,
      near: 1,
      far: 75,
    });
    scene.add(sunLight);
    scene.add(sunLight.target);

    const rimLight = new THREE.DirectionalLight(0xdbeafe, 0.35);
    rimLight.position.set(-14, 12, -16);
    scene.add(rimLight);

    const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();
    const world: CampusWorld = buildCampusWorld(scene, maxAnisotropy);

    // Playable character rigs & shared Mixamo clips + additive gestures for custom NPCs
    const playerRigs: { female?: CharacterRig; male?: CharacterRig } = {};
    let sharedNpcWalkClip: THREE.AnimationClip | null = null;
    let sharedNpcIdleClip: THREE.AnimationClip | null = null;
    let npcGestureClips: NpcGestureClips | null = null;

    // Cache of custom NPC GLB groups keyed by filename
    interface NpcTemplateEntry {
      modelGroup: THREE.Group;
      walkClip?: THREE.AnimationClip;
      idleClip?: THREE.AnimationClip;
    }

    const npcTemplateCache = new Map<string, Promise<NpcTemplateEntry>>();
    const npcLoadedSet = new Set<string>();

    let disposed = false;
    let enteringRoom = false;

    const sleepMs = (ms: number) =>
      new Promise<void>((resolve) => {
        window.setTimeout(resolve, ms);
      });

    const waitForIdleSlot = () =>
      new Promise<void>((resolve) => {
        const win = window as Window & {
          requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
        };
        if (win.requestIdleCallback) {
          win.requestIdleCallback(() => resolve(), { timeout: 500 });
        } else {
          window.requestAnimationFrame(() => window.setTimeout(resolve, 16));
        }
      });

    const getNpcTemplate = (file: string, softYield = false): Promise<NpcTemplateEntry> => {
      const existing = npcTemplateCache.get(file);
      if (existing) return existing;

      const promise = (async () => {
        const buf = await fetchAssetBuffer(file);
        if (disposed) throw new Error('Cancelled');
        if (softYield) {
          await waitForIdleSlot();
          if (disposed) throw new Error('Cancelled');
        }
        const basePath = `${import.meta.env.BASE_URL || '/'}models/`;
        const gltf = await new GLTFLoader().parseAsync(buf, basePath);
        if (disposed) throw new Error('Cancelled');

        const modelGroup = gltf.scene;
        modelGroup.traverse((child) => {
          const mesh = child as THREE.Mesh;
          if (mesh.isMesh) {
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            mesh.frustumCulled = false;
            const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
            mats.forEach((m) => {
              if (!m) return;
              const std = m as THREE.MeshStandardMaterial;
              if (std.map) {
                std.map.colorSpace = THREE.SRGBColorSpace;
                std.map.needsUpdate = true;
              }
              std.color?.setHex(0xffffff);
              std.needsUpdate = true;
            });
          }
        });
        const walkRaw = gltf.animations.find((a) => a.name === 'walk');
        const idleRaw = gltf.animations.find((a) => a.name === 'idle');
        const walkClip = walkRaw ? makeRotationOnlyClip(`npc_walk_${file}`, walkRaw) : undefined;
        const idleClip = idleRaw ? makeRotationOnlyClip(`npc_idle_${file}`, idleRaw) : undefined;
        npcLoadedSet.add(file);
        return { modelGroup, walkClip, idleClip };
      })().catch((err) => {
        // Never permanently cache a failed fetch/parse so room entry can retry cleanly
        npcTemplateCache.delete(file);
        throw err;
      });

      npcTemplateCache.set(file, promise);
      return promise;
    };

    async function loadPlayerTemplate(
      glbFile: string
    ): Promise<{ rig: CharacterRig; walkClip: THREE.AnimationClip; idleClip: THREE.AnimationClip }> {
      const buf = await fetchAssetBuffer(glbFile);
      if (disposed) throw new Error('Cancelled');
      const basePath = `${import.meta.env.BASE_URL || '/'}models/`;
      const gltf = await new GLTFLoader().parseAsync(buf, basePath);
      if (disposed) throw new Error('Cancelled');

      const rootModel = gltf.scene;
      rootModel.scale.setScalar(1.75);

      const walkClip =
        gltf.animations.find((a) => a.name === 'walk') ?? gltf.animations[0];
      const idleClip =
        gltf.animations.find((a) => a.name === 'idle') ?? gltf.animations[1] ?? walkClip;

      if (!walkClip || !idleClip) {
        throw new Error(`Missing animations in ${glbFile}`);
      }

      const playerModel = cloneSkeleton(rootModel) as THREE.Group;
      const group = new THREE.Group();
      group.add(playerModel);

      playerModel.traverse((child) => {
        const mesh = child as THREE.Mesh;
        if (mesh.isMesh) {
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          mesh.frustumCulled = false;
          const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          mats.forEach((m) => {
            if (!m) return;
            const std = m as THREE.MeshStandardMaterial;
            if (std.map) {
              std.map.colorSpace = THREE.SRGBColorSpace;
              std.map.needsUpdate = true;
            }
            std.color?.setHex(0xffffff);
            std.roughness = 0.72;
            std.needsUpdate = true;
          });
        }
      });

      const mixer = new THREE.AnimationMixer(playerModel);
      const walkAction = mixer.clipAction(walkClip);
      const idleAction = mixer.clipAction(idleClip);
      walkAction.play();
      idleAction.play();
      walkAction.setEffectiveWeight(0);
      idleAction.setEffectiveWeight(1);
      scene.add(group);

      return {
        rig: { group, mixer, walkAction, idleAction, walkWeight: 0 },
        walkClip,
        idleClip,
      };
    }

    let loadingPlayers = false;
    const loadAllCharacterAssets = async () => {
      if (loadingPlayers || disposed) return;
      loadingPlayers = true;
      try {
        const [fRes, mRes] = await Promise.all([
          playerRigs.female
            ? Promise.resolve({
                rig: playerRigs.female,
                walkClip: sharedNpcWalkClip!,
                idleClip: sharedNpcIdleClip!,
              })
            : loadPlayerTemplate('female-character.glb'),
          playerRigs.male
            ? Promise.resolve({
                rig: playerRigs.male,
                walkClip: sharedNpcWalkClip!,
                idleClip: sharedNpcIdleClip!,
              })
            : loadPlayerTemplate('male-character.glb'),
        ]);
        if (disposed) return;

        playerRigs.female = fRes.rig;
        playerRigs.male = mRes.rig;
        sharedNpcWalkClip = makeRotationOnlyClip('npc_walk', fRes.walkClip);
        sharedNpcIdleClip = makeRotationOnlyClip('npc_idle', fRes.idleClip);
        npcGestureClips = createNpcGestureClips();

        if (!isSoftwareGl) {
          renderer.compile(scene, camera);
        }
        callbacksRef.current.onModelsLoaded();

        // Softly preload all NPC models 1-by-1 while participant fills demographics/briefing
        void (async () => {
          await sleepMs(700);
          for (const npcFile of NPC_MODEL_FILES) {
            if (disposed) break;
            while (enteringRoom && !disposed) {
              await sleepMs(250);
            }
            if (disposed) break;
            if (npcLoadedSet.has(npcFile) || npcTemplateCache.has(npcFile)) {
              continue;
            }
            try {
              await getNpcTemplate(npcFile, true);
            } catch (err) {
              console.warn('Soft NPC preload skipped:', npcFile, err);
            }
            if (disposed) break;
            await sleepMs(320);
            await waitForIdleSlot();
          }
        })();
      } catch (err) {
        if (!disposed) {
          const msg = err instanceof Error ? err.message : 'Failed to load 3D character models.';
          callbacksRef.current.onModelsError(msg);
        }
      } finally {
        loadingPlayers = false;
      }
    };

    if (retryModelsRef) {
      retryModelsRef.current = () => {
        void loadAllCharacterAssets();
      };
    }
    void loadAllCharacterAssets();

    // Simulation & Room Queue State
    const player = { x: 0, z: 0, heading: 0 };
    let campusMode: CampusMode = 'outdoor';
    let activeRoomId: RoomId | null = null;
    let reenterCooldownUntil = 0;

    let camYaw = 0;
    let camPitch = 0.34;
    let camDist = 5.8;
    let fpYaw = 0;
    let fpPitch = 0;
    let snapNextCamera = true;

    const keys: Record<string, boolean> = {};
    let dragPointerId: number | null = null;
    let lastDrag: [number, number] | null = null;

    let roomNpcs: NpcActor[] = [];
    let currentDeskNpcIdx = -1;
    let questionShownAtPerf = 0;

    const answeredByRoom: Record<RoomId, QuestionnaireAnswer[]> = {
      classroom: [],
      library: [],
      canteen: [],
      principal: [],
    };
    const roomOrder: RoomId[] = [];

    const telemetry = {
      events: [] as TelemetryEvent[],
      samples: [] as [number, number, number][],
      distance: 0,
      moveTimeSec: 0,
      t0: performance.now(),
      questStartPerf: 0,
      nextSampleSec: 0,
      completed: false,
      prevPhase: 'landing' as SimPhase,
    };

    const emitRoomProgress = () => {
      const progress: RoomProgress[] = CAMPUS_ROOMS.map((room) => {
        const count = answeredByRoom[room.id].length;
        const total = room.questions.length;
        const completed = count >= total;
        const entrance = world.entrances.find((e) => e.roomId === room.id);
        entrance?.updateStatusLabel(count, total, completed);
        return {
          id: room.id,
          name: room.name,
          subtitle: room.subtitle,
          completedCount: count,
          totalCount: total,
          completed,
        };
      });
      callbacksRef.current.onRoomProgressChange(progress);
    };

    const clearRoomNpcs = () => {
      roomNpcs.forEach((npc) => {
        npc.anim.dispose();
        world.roomGroup.remove(npc.group);
      });
      roomNpcs = [];
      currentDeskNpcIdx = -1;
      callbacksRef.current.onActiveQuestionChange(null, null);
    };

    const spawnRoomNpcs = async (roomId: RoomId) => {
      clearRoomNpcs();
      const room = CAMPUS_ROOMS.find((r) => r.id === roomId);
      if (!room || !sharedNpcWalkClip || !sharedNpcIdleClip || !npcGestureClips) return;

      const doneCount = answeredByRoom[roomId].length;
      const remaining = room.questions.slice(doneCount);

      // Load unique models sequentially so mobile devices don't spike RAM/bandwidth on 5 large FBX files at once
      const loadedMap = new Map<string, NpcTemplateEntry>();
      for (const q of remaining) {
        if (disposed || activeRoomId !== roomId) return;
        if (!loadedMap.has(q.modelFile)) {
          const tpl = await getNpcTemplate(q.modelFile);
          loadedMap.set(q.modelFile, tpl);
        }
      }
      if (disposed || activeRoomId !== roomId) return;

      remaining.forEach((q, idx) => {
        const entry = loadedMap.get(q.modelFile)!;
        const clonedModel = cloneSkeleton(entry.modelGroup) as THREE.Group;
        const npcScale = q.scale ?? 1.75;
        clonedModel.scale.setScalar(npcScale);
        clonedModel.updateMatrixWorld(true);

        // Ground the NPC cleanly at y = 0 based on its scaled bounding box
        const box = new THREE.Box3().setFromObject(clonedModel);
        if (Number.isFinite(box.min.y)) {
          clonedModel.position.y = -box.min.y;
        }

        const npcGroup = new THREE.Group();
        npcGroup.add(clonedModel);

        const anim = new NpcAnimationController(
          clonedModel,
          entry.walkClip ?? sharedNpcWalkClip!,
          entry.idleClip ?? sharedNpcIdleClip!,
          npcGestureClips!,
          idx
        );

        const spot = world.roomInterior.queueSpots[idx] ?? world.roomInterior.queueSpots[4];
        npcGroup.position.copy(spot);
        npcGroup.rotation.y = Math.PI;
        world.roomGroup.add(npcGroup);

        roomNpcs.push({
          group: npcGroup,
          anim,
          question: q,
          state: 'queued',
          targetPos: spot.clone(),
          targetHeading: Math.PI,
          ackRemaining: 0,
        });
      });
    };

    const callNextPatientToDesk = () => {
      const nextIdx = roomNpcs.findIndex((n) => n.state === 'queued');
      if (nextIdx === -1) return;
      currentDeskNpcIdx = nextIdx;
      const activeNpc = roomNpcs[nextIdx];
      activeNpc.state = 'walking_to_desk';
      activeNpc.targetPos.copy(world.roomInterior.patientSpot);
      activeNpc.targetHeading = Math.PI;
      activeNpc.anim.setState('walking');

      let queueSlot = 0;
      roomNpcs.forEach((npc, i) => {
        if (i > nextIdx && npc.state === 'queued') {
          const spot = world.roomInterior.queueSpots[queueSlot] ?? world.roomInterior.queueSpots[4];
          npc.targetPos.copy(spot);
          queueSlot += 1;
        }
      });
    };

    const exitToOutdoor = (roomId: RoomId, toastMsg?: string) => {
      const entrance = world.entrances.find((e) => e.roomId === roomId);
      clearRoomNpcs();
      campusMode = 'outdoor';
      activeRoomId = null;
      reenterCooldownUntil = performance.now() + 1400;

      world.campusGroup.visible = true;
      world.roomGroup.visible = false;
      scene.background = outdoorBg.clone();
      scene.fog = new THREE.Fog(0xc2daef, 36, 98);

      if (entrance) {
        player.x = entrance.exitX;
        player.z = entrance.exitZ;
        player.heading = entrance.exitZ < 0 ? 0 : Math.PI;
      } else {
        player.x = 0;
        player.z = 0;
        player.heading = 0;
      }
      camYaw = 0;
      camPitch = 0.34;
      camDist = 5.8;
      snapNextCamera = true;

      callbacksRef.current.onModeChange('outdoor', null);
      if (toastMsg) callbacksRef.current.onToast(toastMsg);
    };

    const enterRoom = async (roomId: RoomId) => {
      if (enteringRoom) return;
      const room = CAMPUS_ROOMS.find((r) => r.id === roomId);
      if (!room) return;
      if (answeredByRoom[roomId].length >= room.questions.length) {
        reenterCooldownUntil = performance.now() + 1000;
        callbacksRef.current.onToast(`${room.name} is already completed (5/5).`);
        return;
      }

      enteringRoom = true;
      try {
        const pendingFiles = room.questions
          .slice(answeredByRoom[roomId].length)
          .map((q) => q.modelFile)
          .filter((f) => !npcLoadedSet.has(f));

        if (pendingFiles.length > 0) {
          callbacksRef.current.onToast(`Loading ${room.name} clients…`);
        }

        if (!roomOrder.includes(roomId)) {
          roomOrder.push(roomId);
        }

        activeRoomId = roomId;
        campusMode = 'room_walk';
        world.campusGroup.visible = false;
        world.roomGroup.visible = true;
        world.roomInterior.guideArrow.visible = true;
        world.roomInterior.setRoomSign(`${room.name} · ${room.subtitle}`, room.wallColor);

        scene.background = indoorBg.clone();
        scene.fog = new THREE.Fog(0xe6ecf2, 24, 65);

        player.x = 3.2;
        player.z = 5.0;
        player.heading = Math.PI * 0.9;
        camYaw = -0.32;
        camPitch = 0.34;
        camDist = 4.2;
        snapNextCamera = true;

        telemetry.events.push({
          t: Math.round(performance.now() - telemetry.t0),
          type: 'room_enter',
          roomId,
        });

        callbacksRef.current.onModeChange('room_walk', roomId);
        await spawnRoomNpcs(roomId);

        if (!disposed && activeRoomId === roomId) {
          callbacksRef.current.onToast(`Entered ${room.name}. Finish all 5 questions to unlock exit.`);
        }
      } catch (err) {
        console.error('Failed to spawn room NPCs:', err);
        const detail =
          err instanceof Error && err.message
            ? err.message
            : 'Failed to load room NPC models.';
        callbacksRef.current.onToast(detail);
        exitToOutdoor(roomId);
      } finally {
        enteringRoom = false;
      }
    };

    leaveRoomRef.current = () => {
      if (!activeRoomId) return;
      const room = CAMPUS_ROOMS.find((r) => r.id === activeRoomId);
      if (!room) return;
      const done = answeredByRoom[activeRoomId].length;
      if (done < room.questions.length) {
        callbacksRef.current.onToast(
          `Finish all ${room.questions.length} questions in ${room.name} before exiting.`
        );
        return;
      }
      if (campusMode === 'room_walk') {
        exitToOutdoor(activeRoomId, `${room.name} complete (5/5)! Choose another room.`);
      }
    };

    submitAnswerRef.current = (option: OptionLetter) => {
      if (campusMode !== 'seated_first_person' || !activeRoomId || currentDeskNpcIdx === -1) return;
      const npc = roomNpcs[currentDeskNpcIdx];
      if (!npc || npc.state !== 'at_desk') return;
      const room = CAMPUS_ROOMS.find((r) => r.id === activeRoomId);
      if (!room) return;

      const nowPerf = performance.now();
      const responseTimeMs = Math.max(0, Math.round(nowPerf - questionShownAtPerf));
      const answeredAtMs = Math.max(0, Math.round(nowPerf - telemetry.questStartPerf));

      const answer: QuestionnaireAnswer = {
        questionId: npc.question.id,
        roomId: activeRoomId,
        roomName: room.name,
        patientIndex: npc.question.patientIndex,
        patientName: npc.question.patientName,
        selectedOption: option,
        selectedText: npc.question.options[option],
        responseTimeMs,
        answeredAtMs,
      };
      answeredByRoom[activeRoomId].push(answer);

      telemetry.events.push({
        t: Math.round(nowPerf - telemetry.t0),
        type: 'answer',
        roomId: activeRoomId,
        questionId: npc.question.id,
        selectedOption: option,
      });

      callbacksRef.current.onPickupSfx();
      callbacksRef.current.onActiveQuestionChange(null, null);
      emitRoomProgress();

      npc.state = 'acknowledging';
      npc.ackRemaining = 0.55;
      npc.targetPos.copy(world.roomInterior.patientExitSpot);
      npc.anim.setState('acknowledging');
      currentDeskNpcIdx = -1;

      const totalDone = Object.values(answeredByRoom).reduce((sum, arr) => sum + arr.length, 0);
      const roomDone = answeredByRoom[activeRoomId].length;

      if (totalDone >= TOTAL_QUESTIONNAIRES) {
        telemetry.completed = true;
        const durationMs = Math.max(0, Math.round(nowPerf - telemetry.questStartPerf));
        telemetry.events.push({
          t: Math.round(nowPerf - telemetry.t0),
          type: 'quest_complete',
        });

        const codeChars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
        const participantCode = Array.from(
          { length: 6 },
          () => codeChars[Math.floor(Math.random() * codeChars.length)]
        ).join('');

        const allAnswers = [
          ...answeredByRoom.classroom,
          ...answeredByRoom.library,
          ...answeredByRoom.canteen,
          ...answeredByRoom.principal,
        ].sort((a, b) => a.answeredAtMs - b.answeredAtMs);

        const demo = demoRef.current;
        const activeGender = genderRef.current;
        const result: QuestResult = {
          participant: participantCode,
          demographics: {
            name: demo?.name.trim() ? demo.name.trim() : null,
            age: demo?.age ?? 0,
            gender: activeGender,
            section: demo?.section ?? '',
            consented: Boolean(demo?.consented),
            consentTimestamp: demo?.consentTimestamp ?? new Date().toISOString(),
          },
          character: activeGender,
          durationMs,
          totalAnswered: allAnswers.length,
          roomOrder: [...roomOrder],
          answers: allAnswers,
          distance: +telemetry.distance.toFixed(1),
          moveTimeMs: Math.round(telemetry.moveTimeSec * 1000),
          events: telemetry.events,
          samples: telemetry.samples,
        };

        window.setTimeout(() => {
          if (!disposed) {
            callbacksRef.current.onQuestComplete(result);
          }
        }, 620);
        return;
      }

      if (roomDone >= room.questions.length) {
        const completedRoomId = activeRoomId;
        const completedRoomName = room.name;
        window.setTimeout(() => {
          if (!disposed && activeRoomId === completedRoomId) {
            exitToOutdoor(
              completedRoomId,
              `${completedRoomName} complete (5/5)! Choose another room.`
            );
          }
        }, 1250);
      }
    };

    const resetSession = () => {
      clearRoomNpcs();
      player.x = 0;
      player.z = 0;
      player.heading = 0;
      campusMode = 'outdoor';
      activeRoomId = null;
      reenterCooldownUntil = 0;
      enteringRoom = false;
      camYaw = 0;
      camPitch = 0.34;
      camDist = 5.8;
      fpYaw = 0;
      fpPitch = 0;
      snapNextCamera = true;

      world.campusGroup.visible = true;
      world.roomGroup.visible = false;
      scene.background = outdoorBg.clone();
      scene.fog = new THREE.Fog(0xc2daef, 36, 98);

      answeredByRoom.classroom = [];
      answeredByRoom.library = [];
      answeredByRoom.canteen = [];
      answeredByRoom.principal = [];
      roomOrder.length = 0;

      telemetry.events = [];
      telemetry.samples = [];
      telemetry.distance = 0;
      telemetry.moveTimeSec = 0;
      telemetry.t0 = performance.now();
      telemetry.questStartPerf = 0;
      telemetry.nextSampleSec = 0;
      telemetry.completed = false;
      telemetry.prevPhase = 'landing';

      emitRoomProgress();
      callbacksRef.current.onModeChange('outdoor', null);
      callbacksRef.current.onActiveQuestionChange(null, null);
      callbacksRef.current.onTimerTick(0);
    };

    resetFnRef.current = resetSession;
    emitRoomProgress();

    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')) {
        return;
      }
      keys[e.code] = true;
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keys[e.code] = false;
    };
    const onBlur = () => {
      Object.keys(keys).forEach((k) => {
        keys[k] = false;
      });
      dragPointerId = null;
      lastDrag = null;
    };

    const canvasEl = renderer.domElement;
    const onPointerDown = (e: PointerEvent) => {
      if (dragPointerId !== null) return;
      dragPointerId = e.pointerId;
      lastDrag = [e.clientX, e.clientY];
      canvasEl.setPointerCapture(e.pointerId);
    };
    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerId !== dragPointerId || !lastDrag) return;
      const dx = e.clientX - lastDrag[0];
      const dy = e.clientY - lastDrag[1];
      if (campusMode === 'seated_first_person') {
        fpYaw = THREE.MathUtils.clamp(fpYaw - dx * 0.004, -0.45, 0.45);
        fpPitch = THREE.MathUtils.clamp(fpPitch - dy * 0.003, -0.22, 0.22);
      } else {
        camYaw -= dx * 0.006;
        camPitch = THREE.MathUtils.clamp(camPitch + dy * 0.004, 0.08, 1.18);
      }
      lastDrag = [e.clientX, e.clientY];
    };
    const onPointerEnd = (e: PointerEvent) => {
      if (e.pointerId === dragPointerId) {
        dragPointerId = null;
        lastDrag = null;
      }
    };
    const onWheel = (e: WheelEvent) => {
      if (campusMode !== 'seated_first_person') {
        const maxDist = campusMode === 'room_walk' ? 6.2 : 12;
        camDist = THREE.MathUtils.clamp(camDist + e.deltaY * 0.004, 2.4, maxDist);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    canvasEl.addEventListener('pointerdown', onPointerDown);
    canvasEl.addEventListener('pointermove', onPointerMove);
    canvasEl.addEventListener('pointerup', onPointerEnd);
    canvasEl.addEventListener('pointercancel', onPointerEnd);
    canvasEl.addEventListener('lostpointercapture', onPointerEnd);
    canvasEl.addEventListener('wheel', onWheel, { passive: true });

    const resize = () => {
      const width = container.clientWidth || window.innerWidth;
      const height = container.clientHeight || window.innerHeight;
      renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    window.addEventListener('resize', resize);
    resize();

    const _camDesired = new THREE.Vector3();
    const _lookTarget = new THREE.Vector3();
    let frameId = 0;
    let lastTime = performance.now();

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (disposed) return;
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    const tick = () => {
      if (disposed) return;

      const nowPerf = performance.now();
      const dt = Math.min(0.05, (nowPerf - lastTime) / 1000);
      lastTime = nowPerf;
      const currentPhase = phaseRef.current;
      const activeGender = genderRef.current;

      if (telemetry.prevPhase !== currentPhase) {
        if (currentPhase === 'playing') {
          snapNextCamera = true;
        }
        if (currentPhase === 'playing' && telemetry.questStartPerf === 0) {
          telemetry.questStartPerf = nowPerf;
          telemetry.events.push({
            t: Math.round(nowPerf - telemetry.t0),
            type: 'quest_begin',
            character: activeGender,
            gender: activeGender,
            section: demoRef.current?.section,
          });
        }
        telemetry.prevPhase = currentPhase;
      }

      const activeRig = activeGender === 'female' ? playerRigs.female : playerRigs.male;
      const inactiveRig = activeGender === 'female' ? playerRigs.male : playerRigs.female;

      if (inactiveRig) {
        inactiveRig.group.visible = false;
      }

      if (activeRig) {
        if (currentPhase === 'landing' || currentPhase === 'briefing') {
          activeRig.group.visible = true;
          activeRig.walkWeight = THREE.MathUtils.damp(activeRig.walkWeight, 0, 8, dt);
          activeRig.walkAction.setEffectiveWeight(activeRig.walkWeight);
          activeRig.idleAction.setEffectiveWeight(1 - activeRig.walkWeight);
          activeRig.mixer.update(dt);
          activeRig.group.position.set(0, 0, 0);
          activeRig.group.rotation.y = currentPhase === 'landing' ? Math.sin(nowPerf * 0.0006) * 0.32 : 0;

          const vw = container.clientWidth || window.innerWidth;
          const vh = container.clientHeight || window.innerHeight;
          const isWideDesktop = vw >= 1024;
          const isLandscapeViewport = vw > vh;
          let offsetX = 0;
          if (currentPhase === 'landing') {
            if (isWideDesktop) {
              offsetX = -1.45;
            } else if (isLandscapeViewport) {
              const aspect = vw / Math.max(1, vh);
              offsetX = -Math.min(1.65, Math.max(1.25, aspect * 0.78));
            }
          }
          _camDesired.set(offsetX, 1.55, 4.75);
          _lookTarget.set(offsetX, 1.05, 0);
          if (snapNextCamera) {
            camera.position.copy(_camDesired);
            snapNextCamera = false;
          } else {
            camera.position.lerp(_camDesired, 1 - Math.exp(-6 * dt));
          }
          camera.lookAt(_lookTarget);
        } else {
          if (currentPhase === 'playing' && !telemetry.completed) {
            const elapsedMs = Math.max(0, Math.round(nowPerf - telemetry.questStartPerf));
            callbacksRef.current.onTimerTick(elapsedMs);

            if (elapsedMs >= telemetry.nextSampleSec * 1000) {
              telemetry.nextSampleSec += 1;
              telemetry.samples.push([elapsedMs, +player.x.toFixed(2), +player.z.toFixed(2)]);
            }
          }

          if (campusMode === 'seated_first_person') {
            activeRig.group.visible = false;

            roomNpcs.forEach((npc) => {
              if (npc.state === 'done') return;

              if (npc.state === 'walking_to_desk') {
                npc.anim.setState('walking');
                const res = moveAndFace(npc.group.position, npc.targetPos, npc.group.rotation.y, 1.85, dt);
                npc.group.rotation.y = res.heading;
                if (res.arrived) {
                  npc.state = 'at_desk';
                  npc.group.rotation.y = Math.PI;
                  npc.anim.setState('greeting');
                  questionShownAtPerf = performance.now();
                  const room = CAMPUS_ROOMS.find((r) => r.id === activeRoomId);
                  if (room) {
                    callbacksRef.current.onActiveQuestionChange(npc.question, {
                      roomName: room.name,
                      current: npc.question.patientIndex,
                      total: room.questions.length,
                    });
                  }
                }
              } else if (npc.state === 'queued') {
                const res = moveAndFace(npc.group.position, npc.targetPos, npc.group.rotation.y, 1.5, dt);
                npc.group.rotation.y = res.arrived ? Math.PI : res.heading;
                npc.anim.setState(res.arrived ? 'queue_idle' : 'walking');
              } else if (npc.state === 'at_desk') {
                let dH = Math.PI - npc.group.rotation.y;
                dH = Math.atan2(Math.sin(dH), Math.cos(dH));
                npc.group.rotation.y += dH * Math.min(1, dt * 8);
              } else if (npc.state === 'acknowledging') {
                let dH = Math.PI - npc.group.rotation.y;
                dH = Math.atan2(Math.sin(dH), Math.cos(dH));
                npc.group.rotation.y += dH * Math.min(1, dt * 8);
                npc.ackRemaining -= dt;
                if (npc.ackRemaining <= 0) {
                  npc.state = 'leaving';
                  npc.anim.setState('walking');
                  if (currentDeskNpcIdx === -1 && !telemetry.completed) {
                    const anyActiveAtDesk = roomNpcs.some(
                      (n) => n.state === 'walking_to_desk' || n.state === 'at_desk'
                    );
                    if (!anyActiveAtDesk) {
                      callNextPatientToDesk();
                    }
                  }
                }
              } else if (npc.state === 'leaving') {
                npc.anim.setState('walking');
                const res = moveAndFace(npc.group.position, npc.targetPos, npc.group.rotation.y, 2.2, dt);
                npc.group.rotation.y = res.heading;
                if (res.arrived) {
                  npc.state = 'done';
                  npc.group.visible = false;
                }
              }

              npc.anim.update(dt);
            });

            const eye = world.roomInterior.eyePos;
            const target = world.roomInterior.lookAtTarget;
            _camDesired.copy(eye);
            _lookTarget.set(
              target.x + Math.sin(fpYaw) * 2.2,
              target.y + fpPitch * 1.4,
              target.z
            );
            camera.position.lerp(_camDesired, 1 - Math.exp(-8 * dt));
            camera.lookAt(_lookTarget);
          } else {
            activeRig.group.visible = true;

            let ax = 0;
            let ay = 0;
            let mag = 0;
            if (currentPhase === 'playing' && !telemetry.completed && !enteringRoom) {
              ax = (keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0);
              ay = (keys.KeyW || keys.ArrowUp ? 1 : 0) - (keys.KeyS || keys.ArrowDown ? 1 : 0);
              if (joystickRef.current.active) {
                ax = joystickRef.current.x;
                ay = joystickRef.current.y;
              }
              mag = Math.min(1, Math.hypot(ax, ay));
            }

            const sinYaw = Math.sin(camYaw);
            const cosYaw = Math.cos(camYaw);
            let dx = -sinYaw * ay + cosYaw * ax;
            let dz = -cosYaw * ay - sinYaw * ax;
            const dLen = Math.hypot(dx, dz) || 1;
            dx /= dLen;
            dz /= dLen;

            if (mag > 0.05) {
              const speed = (campusMode === 'room_walk' ? 2.4 : 2.8) * mag;
              const prevX = player.x;
              const prevZ = player.z;

              if (campusMode === 'outdoor') {
                player.x = THREE.MathUtils.clamp(player.x + dx * speed * dt, -24.2, 24.2);
                player.z = THREE.MathUtils.clamp(player.z + dz * speed * dt, -24.2, 24.2);
                resolveBoxColliders(player, world.outdoorColliders, 0.52);
                player.x = THREE.MathUtils.clamp(player.x, -24.2, 24.2);
                player.z = THREE.MathUtils.clamp(player.z, -24.2, 24.2);
              } else {
                player.x = THREE.MathUtils.clamp(player.x + dx * speed * dt, -8.3, 8.3);
                player.z = THREE.MathUtils.clamp(player.z + dz * speed * dt, -5.8, 6.8);
                resolveBoxColliders(player, world.roomInterior.roomColliders, 0.38);

                // Keep player from walking straight through queued NPCs
                for (let i = 0; i < roomNpcs.length; i += 1) {
                  const npc = roomNpcs[i];
                  if (npc.state === 'done') continue;
                  const nx = player.x - npc.group.position.x;
                  const nz = player.z - npc.group.position.z;
                  const nDist = Math.hypot(nx, nz);
                  if (nDist < 0.72) {
                    const push = 0.72 - nDist;
                    if (nDist > 1e-4) {
                      player.x += (nx / nDist) * push;
                      player.z += (nz / nDist) * push;
                    } else {
                      player.x += 0.72;
                    }
                  }
                }

                player.x = THREE.MathUtils.clamp(player.x, -8.3, 8.3);
                player.z = THREE.MathUtils.clamp(player.z, -5.8, 6.8);
              }

              telemetry.distance += Math.hypot(player.x - prevX, player.z - prevZ);
              telemetry.moveTimeSec += dt;

              let deltaH = Math.atan2(dx, dz) - player.heading;
              deltaH = Math.atan2(Math.sin(deltaH), Math.cos(deltaH));
              player.heading += deltaH * Math.min(1, dt * 12);
            }

            const targetWalk = mag > 0.05 ? 1 : 0;
            activeRig.walkWeight = THREE.MathUtils.damp(activeRig.walkWeight, targetWalk, 9, dt);
            activeRig.walkAction.setEffectiveWeight(activeRig.walkWeight);
            activeRig.idleAction.setEffectiveWeight(1 - activeRig.walkWeight);
            activeRig.walkAction.timeScale = mag > 0.05 ? mag * 1.25 : activeRig.walkWeight > 0.02 ? 0.8 : 0;
            activeRig.mixer.update(dt);
            activeRig.group.position.set(player.x, 0, player.z);
            activeRig.group.rotation.y = player.heading;

            if (campusMode === 'room_walk') {
              world.roomInterior.guideArrow.position.y = 2.22 + Math.sin(nowPerf / 280) * 0.18;
              world.roomInterior.guideArrow.rotation.y += dt * 1.4;

              roomNpcs.forEach((npc) => {
                npc.anim.update(dt);
              });

              const chair = world.roomInterior.chairPos;
              if (
                currentPhase === 'playing' &&
                !enteringRoom &&
                roomNpcs.length > 0 &&
                Math.hypot(player.x - chair.x, player.z - chair.z) < 1.25
              ) {
                campusMode = 'seated_first_person';
                fpYaw = 0;
                fpPitch = 0;
                world.roomInterior.guideArrow.visible = false;
                callbacksRef.current.onModeChange('seated_first_person', activeRoomId);
                callNextPatientToDesk();
              }
            } else if (campusMode === 'outdoor' && currentPhase === 'playing' && nowPerf > reenterCooldownUntil) {
              for (const entrance of world.entrances) {
                if (Math.hypot(player.x - entrance.x, player.z - entrance.z) < 1.5) {
                  void enterRoom(entrance.roomId);
                  break;
                }
              }
            }

            const effectiveDist = campusMode === 'room_walk' ? Math.min(camDist, 6.2) : camDist;
            const tx = player.x;
            const ty = 1.35;
            const tz = player.z;
            _lookTarget.set(tx, ty, tz);
            _camDesired.set(
              tx + Math.sin(camYaw) * Math.cos(camPitch) * effectiveDist,
              Math.max(0.55, ty + Math.sin(camPitch) * effectiveDist),
              tz + Math.cos(camYaw) * Math.cos(camPitch) * effectiveDist
            );

            if (campusMode === 'room_walk') {
              clampCameraInsideBox(_lookTarget, _camDesired, world.roomInterior.roomCameraBounds);
            } else {
              clipCameraOutsideBoxes(_lookTarget, _camDesired, world.outdoorCameraObstacles);
            }

            if (snapNextCamera) {
              camera.position.copy(_camDesired);
              snapNextCamera = false;
            } else {
              camera.position.lerp(_camDesired, 1 - Math.exp(-10 * dt));
              if (campusMode === 'room_walk') {
                clampCameraInsideBox(_lookTarget, camera.position, world.roomInterior.roomCameraBounds);
              } else {
                clipCameraOutsideBoxes(_lookTarget, camera.position, world.outdoorCameraObstacles);
              }
            }
            camera.lookAt(_lookTarget);
          }
        }
      }

      if (campusMode === 'outdoor') {
        sunLight.position.set(player.x + 12, 22, player.z + 10);
        sunLight.target.position.set(player.x, 0, player.z);
      } else {
        sunLight.position.set(6, 14, 6);
        sunLight.target.position.set(0, 0, -1);
      }
      sunLight.target.updateMatrixWorld();

      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    };

    if (isSoftwareGl) {
      afterDraw(tick);
    } else {
      frameId = requestAnimationFrame(tick);
    }

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      clearRoomNpcs();
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('resize', resize);
      canvasEl.removeEventListener('pointerdown', onPointerDown);
      canvasEl.removeEventListener('pointermove', onPointerMove);
      canvasEl.removeEventListener('pointerup', onPointerEnd);
      canvasEl.removeEventListener('pointercancel', onPointerEnd);
      canvasEl.removeEventListener('lostpointercapture', onPointerEnd);
      canvasEl.removeEventListener('wheel', onWheel);
      canvasEl.removeEventListener('webglcontextlost', onContextLost);
      canvasEl.removeEventListener('webglcontextrestored', onContextRestored);

      world.dispose();
      envTex.dispose();
      renderer.dispose();
      if (canvasEl.parentNode === container) {
        container.removeChild(canvasEl);
      }
    };
  }, [joystickRef, leaveRoomRef, submitAnswerRef]);

  return (
    <div className="relative w-full h-full">
      <div ref={mountRef} className="w-full h-full" />
      {contextLost && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/90 text-white p-6 text-center z-40">
          <div className="max-w-sm space-y-2">
            <h2 className="font-display text-xl font-bold">3D View Interrupted</h2>
            <p className="text-sm text-slate-300">
              WebGL rendering context was temporarily suspended. Restoring graphics automatically.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
