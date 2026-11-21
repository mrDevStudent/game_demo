import * as THREE from 'three';

export type NpcAnimState =
  | 'queue_idle'
  | 'walking'
  | 'greeting'
  | 'interacting'
  | 'acknowledging';

export interface NpcGestureClips {
  greetWave: THREE.AnimationClip;
  explainGesture: THREE.AnimationClip;
  curiousTilt: THREE.AnimationClip;
  acknowledgeNod: THREE.AnimationClip;
}

function makeDeltaTrack(
  boneName: string,
  times: number[],
  eulers: [number, number, number][]
): THREE.QuaternionKeyframeTrack {
  const values: number[] = [];
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  for (const [rx, ry, rz] of eulers) {
    e.set(rx, ry, rz, 'XYZ');
    q.setFromEuler(e);
    values.push(q.x, q.y, q.z, q.w);
  }
  return new THREE.QuaternionKeyframeTrack(`${boneName}.quaternion`, times, values);
}

export function createNpcGestureClips(): NpcGestureClips {
  // 1. Friendly greeting wave + slight bow & nod when arriving at desk (1.4s)
  const greetWave = new THREE.AnimationClip('npc_greet_wave', 1.4, [
    makeDeltaTrack(
      'mixamorigSpine2',
      [0, 0.35, 0.9, 1.4],
      [
        [0, 0, 0],
        [0.08, 0.04, 0],
        [0.05, 0, 0],
        [0, 0, 0],
      ]
    ),
    makeDeltaTrack(
      'mixamorigHead',
      [0, 0.3, 0.65, 1.0, 1.4],
      [
        [0, 0, 0],
        [0.18, -0.05, 0.04],
        [0.04, 0.04, -0.03],
        [0.12, 0, 0],
        [0, 0, 0],
      ]
    ),
    makeDeltaTrack(
      'mixamorigRightArm',
      [0, 0.35, 0.95, 1.4],
      [
        [0, 0, 0],
        [-0.22, 0, -0.26],
        [-0.18, 0, -0.22],
        [0, 0, 0],
      ]
    ),
    makeDeltaTrack(
      'mixamorigRightForeArm',
      [0, 0.35, 0.65, 0.95, 1.4],
      [
        [0, 0, 0],
        [-0.32, 0, -0.58],
        [-0.18, 0, -0.68],
        [-0.34, 0, -0.52],
        [0, 0, 0],
      ]
    ),
  ]);

  // 2. Conversational speaking/explaining gestures during questionnaire interaction (3.6s loop)
  const explainGesture = new THREE.AnimationClip('npc_explain_gesture', 3.6, [
    makeDeltaTrack(
      'mixamorigSpine2',
      [0, 0.9, 1.8, 2.7, 3.6],
      [
        [0, 0, 0],
        [0.04, 0.06, 0.02],
        [0.02, -0.05, -0.02],
        [0.05, 0.03, 0],
        [0, 0, 0],
      ]
    ),
    makeDeltaTrack(
      'mixamorigNeck',
      [0, 0.8, 1.8, 2.8, 3.6],
      [
        [0, 0, 0],
        [0.04, -0.08, 0.04],
        [-0.03, 0.07, -0.04],
        [0.05, 0, 0.03],
        [0, 0, 0],
      ]
    ),
    makeDeltaTrack(
      'mixamorigHead',
      [0, 0.7, 1.4, 2.2, 3.0, 3.6],
      [
        [0, 0, 0],
        [0.09, -0.07, 0.07],
        [-0.04, 0.06, -0.06],
        [0.11, 0.04, 0.04],
        [0.03, -0.05, -0.03],
        [0, 0, 0],
      ]
    ),
    makeDeltaTrack(
      'mixamorigRightArm',
      [0, 0.6, 1.5, 2.4, 3.6],
      [
        [0, 0, 0],
        [-0.14, 0, -0.22],
        [-0.08, 0, -0.14],
        [-0.18, 0, -0.25],
        [0, 0, 0],
      ]
    ),
    makeDeltaTrack(
      'mixamorigRightForeArm',
      [0, 0.6, 1.5, 2.4, 3.6],
      [
        [0, 0, 0],
        [-0.22, 0, -0.48],
        [-0.12, 0, -0.32],
        [-0.28, 0, -0.56],
        [0, 0, 0],
      ]
    ),
    makeDeltaTrack(
      'mixamorigLeftArm',
      [0, 1.2, 2.1, 3.0, 3.6],
      [
        [0, 0, 0],
        [-0.1, 0, 0.14],
        [-0.16, 0, 0.22],
        [-0.08, 0, 0.12],
        [0, 0, 0],
      ]
    ),
    makeDeltaTrack(
      'mixamorigLeftForeArm',
      [0, 1.2, 2.1, 3.0, 3.6],
      [
        [0, 0, 0],
        [-0.16, 0, 0.36],
        [-0.24, 0, 0.52],
        [-0.14, 0, 0.3],
        [0, 0, 0],
      ]
    ),
  ]);

  // 3. Calm attentive listening / curious head tilt & slight posture sway (3.2s loop)
  const curiousTilt = new THREE.AnimationClip('npc_curious_tilt', 3.2, [
    makeDeltaTrack(
      'mixamorigSpine1',
      [0, 1.1, 2.2, 3.2],
      [
        [0, 0, 0],
        [0.02, 0.04, 0.03],
        [0.01, -0.04, -0.03],
        [0, 0, 0],
      ]
    ),
    makeDeltaTrack(
      'mixamorigHead',
      [0, 0.9, 1.9, 2.7, 3.2],
      [
        [0, 0, 0],
        [0.06, 0.08, 0.1],
        [0.04, -0.06, -0.08],
        [0.08, 0.03, 0.04],
        [0, 0, 0],
      ]
    ),
    makeDeltaTrack(
      'mixamorigLeftForeArm',
      [0, 0.9, 2.2, 3.2],
      [
        [0, 0, 0],
        [-0.1, 0, 0.28],
        [-0.14, 0, 0.34],
        [0, 0, 0],
      ]
    ),
  ]);

  // 4. Appreciative double-nod + hand acknowledgment when option A/B/C/D is submitted (0.85s)
  const acknowledgeNod = new THREE.AnimationClip('npc_acknowledge_nod', 0.85, [
    makeDeltaTrack(
      'mixamorigSpine2',
      [0, 0.25, 0.55, 0.85],
      [
        [0, 0, 0],
        [0.11, 0, 0],
        [0.06, 0, 0],
        [0, 0, 0],
      ]
    ),
    makeDeltaTrack(
      'mixamorigHead',
      [0, 0.18, 0.36, 0.54, 0.72, 0.85],
      [
        [0, 0, 0],
        [0.24, 0, 0],
        [0.05, 0, 0],
        [0.2, 0, 0],
        [0.04, 0, 0],
        [0, 0, 0],
      ]
    ),
    makeDeltaTrack(
      'mixamorigRightArm',
      [0, 0.25, 0.6, 0.85],
      [
        [0, 0, 0],
        [-0.12, 0, -0.18],
        [-0.08, 0, -0.12],
        [0, 0, 0],
      ]
    ),
    makeDeltaTrack(
      'mixamorigRightForeArm',
      [0, 0.25, 0.6, 0.85],
      [
        [0, 0, 0],
        [-0.18, 0, -0.42],
        [-0.12, 0, -0.32],
        [0, 0, 0],
      ]
    ),
  ]);

  return { greetWave, explainGesture, curiousTilt, acknowledgeNod };
}

export class NpcAnimationController {
  public readonly mixer: THREE.AnimationMixer;
  private readonly walkAction: THREE.AnimationAction;
  private readonly idleAction: THREE.AnimationAction;
  private readonly greetAction: THREE.AnimationAction;
  private readonly explainAction: THREE.AnimationAction;
  private readonly curiousAction: THREE.AnimationAction;
  private readonly ackAction: THREE.AnimationAction;

  private state: NpcAnimState = 'queue_idle';
  private walkWeight = 0;
  private interactElapsed = 0;
  private interactVariant = 0;
  private onFinishListener: (e: { action: THREE.AnimationAction }) => void;

  constructor(
    root: THREE.Object3D,
    walkClip: THREE.AnimationClip,
    idleClip: THREE.AnimationClip,
    gestures: NpcGestureClips,
    queueIndex: number
  ) {
    this.mixer = new THREE.AnimationMixer(root);

    this.walkAction = this.mixer.clipAction(walkClip);
    this.idleAction = this.mixer.clipAction(idleClip);
    this.walkAction.play();
    this.idleAction.play();
    this.walkAction.setEffectiveWeight(0);
    this.idleAction.setEffectiveWeight(1);

    // Stagger idle phase & slight speed variance across queued NPCs
    this.idleAction.time = (queueIndex * 1.85) % Math.max(1, idleClip.duration);
    this.idleAction.timeScale = 0.92 + (queueIndex % 3) * 0.08;

    // Configure additive gesture layers
    this.greetAction = this.mixer.clipAction(gestures.greetWave);
    this.greetAction.blendMode = THREE.AdditiveAnimationBlendMode;
    this.greetAction.loop = THREE.LoopOnce;
    this.greetAction.clampWhenFinished = false;

    this.explainAction = this.mixer.clipAction(gestures.explainGesture);
    this.explainAction.blendMode = THREE.AdditiveAnimationBlendMode;
    this.explainAction.loop = THREE.LoopRepeat;
    this.explainAction.play();
    this.explainAction.setEffectiveWeight(0);

    this.curiousAction = this.mixer.clipAction(gestures.curiousTilt);
    this.curiousAction.blendMode = THREE.AdditiveAnimationBlendMode;
    this.curiousAction.loop = THREE.LoopRepeat;
    this.curiousAction.time = (queueIndex * 0.9) % gestures.curiousTilt.duration;
    this.curiousAction.play();
    this.curiousAction.setEffectiveWeight(0.24);

    this.ackAction = this.mixer.clipAction(gestures.acknowledgeNod);
    this.ackAction.blendMode = THREE.AdditiveAnimationBlendMode;
    this.ackAction.loop = THREE.LoopOnce;
    this.ackAction.clampWhenFinished = false;

    this.onFinishListener = (e) => {
      if (e.action === this.greetAction && this.state === 'greeting') {
        this.setState('interacting');
      }
    };
    this.mixer.addEventListener('finished', this.onFinishListener);
  }

  public getState(): NpcAnimState {
    return this.state;
  }

  public setState(next: NpcAnimState): void {
    if (this.state === next) return;
    this.state = next;

    if (next === 'greeting') {
      this.interactElapsed = 0;
      this.greetAction.reset();
      this.greetAction.setEffectiveWeight(1);
      this.greetAction.play();
    } else if (next === 'interacting') {
      this.interactElapsed = 0;
      this.interactVariant = 0;
      this.explainAction.reset().play();
      this.curiousAction.reset().play();
    } else if (next === 'acknowledging') {
      this.greetAction.stop();
      this.ackAction.reset();
      this.ackAction.setEffectiveWeight(1);
      this.ackAction.play();
    } else if (next === 'walking') {
      this.greetAction.stop();
      this.ackAction.stop();
    }
  }

  public update(dt: number): void {
    const isWalking = this.state === 'walking';
    this.walkWeight = THREE.MathUtils.damp(this.walkWeight, isWalking ? 1 : 0, 9, dt);
    this.walkAction.setEffectiveWeight(this.walkWeight);
    this.idleAction.setEffectiveWeight(1 - this.walkWeight);
    this.walkAction.timeScale = isWalking ? 1.15 : 0;

    let targetExplain = 0;
    let targetCurious = 0;

    if (this.state === 'queue_idle') {
      targetCurious = 0.25;
    } else if (this.state === 'greeting') {
      targetCurious = 0.15;
    } else if (this.state === 'interacting') {
      this.interactElapsed += dt;
      // Alternate smoothly between explaining hand gestures and attentive head tilts
      if (this.interactElapsed > 4.2) {
        this.interactElapsed = 0;
        this.interactVariant = (this.interactVariant + 1) % 2;
      }
      if (this.interactVariant === 0) {
        targetExplain = 0.92;
        targetCurious = 0.15;
      } else {
        targetExplain = 0.25;
        targetCurious = 0.85;
      }
    } else if (this.state === 'acknowledging') {
      targetExplain = 0;
      targetCurious = 0;
    }

    const curExplain = this.explainAction.getEffectiveWeight();
    const curCurious = this.curiousAction.getEffectiveWeight();
    this.explainAction.setEffectiveWeight(THREE.MathUtils.damp(curExplain, targetExplain, 5, dt));
    this.curiousAction.setEffectiveWeight(THREE.MathUtils.damp(curCurious, targetCurious, 5, dt));

    this.mixer.update(dt);
  }

  public dispose(): void {
    this.mixer.removeEventListener('finished', this.onFinishListener);
    this.mixer.stopAllAction();
  }
}
