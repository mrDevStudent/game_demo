import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  User,
} from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocFromServer,
  getFirestore,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import {
  ArchiveStatus,
  GenderOption,
  QuestArchiveRecord,
  QuestionnaireAnswer,
  QuestResult,
  RoomId,
  SpatialSample,
  TelemetryEvent,
} from '../types';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

export const ADMIN_EMAILS: readonly string[] = [
  'boringassworld@gmail.com',
  'emmanuelroberttenorio@gmail.com',
];
const COLLECTION_NAME = 'questSubmissions';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

async function testConnection(): Promise<void> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
void testConnection();

export function subscribeToAuth(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, callback);
}

export async function signInAdminWithGoogle(): Promise<User> {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const cred = await signInWithPopup(auth, provider);
  return cred.user;
}

export async function signOutAdmin(): Promise<void> {
  await signOut(auth);
}

export async function checkIsAdminUser(user: User | null): Promise<boolean> {
  if (!user || !user.emailVerified || !user.email) return false;
  const normalized = user.email.trim().toLowerCase();
  if (ADMIN_EMAILS.includes(normalized)) return true;
  try {
    const snap = await getDoc(doc(db, 'admins', user.uid));
    return snap.exists();
  } catch {
    return false;
  }
}

function downsampleSpatialSamples(raw: [number, number, number][]): SpatialSample[] {
  const maxItems = 1400;
  if (raw.length <= maxItems) {
    return raw.map(([t, x, z]) => ({
      t: Math.max(0, Math.round(t)),
      x: +Number(x).toFixed(2),
      z: +Number(z).toFixed(2),
    }));
  }
  const stride = Math.ceil(raw.length / maxItems);
  const out: SpatialSample[] = [];
  for (let i = 0; i < raw.length; i += stride) {
    const [t, x, z] = raw[i];
    out.push({
      t: Math.max(0, Math.round(t)),
      x: +Number(x).toFixed(2),
      z: +Number(z).toFixed(2),
    });
  }
  return out;
}

export async function saveQuestSubmission(result: QuestResult): Promise<string> {
  const cleanParticipant = result.participant.replace(/[^A-Z0-9]/g, '').slice(0, 12) || 'PART01';
  const docId = `${cleanParticipant}_${Date.now()}`;
  const path = `${COLLECTION_NAME}/${docId}`;

  const payload = {
    participant: cleanParticipant,
    demographics: {
      name: (result.demographics.name ?? '').trim().slice(0, 80),
      age: Math.min(99, Math.max(7, Math.round(result.demographics.age || 18))),
      gender: (result.demographics.gender === 'male' ? 'male' : 'female') as GenderOption,
      section: (result.demographics.section || 'Unspecified').trim().slice(0, 60),
      consented: true,
      consentTimestamp: (result.demographics.consentTimestamp || new Date().toISOString()).slice(0, 40),
    },
    character: (result.character === 'male' ? 'male' : 'female') as GenderOption,
    durationMs: Math.min(7200000, Math.max(0, Math.round(result.durationMs))),
    totalAnswered: Math.min(20, Math.max(1, Math.round(result.totalAnswered))),
    roomOrder: result.roomOrder.slice(0, 4),
    answers: result.answers.slice(0, 20),
    distance: Math.min(50000, Math.max(0, +result.distance.toFixed(1))),
    moveTimeMs: Math.min(7200000, Math.max(0, Math.round(result.moveTimeMs))),
    events: result.events.slice(0, 500),
    samples: downsampleSpatialSamples(result.samples),
    archiveStatus: 'active' as ArchiveStatus,
    adminNotes: '',
    editedBy: '',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  try {
    await setDoc(doc(db, COLLECTION_NAME, docId), payload);
    return docId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

function toMillis(val: unknown): number {
  if (val instanceof Timestamp) return val.toMillis();
  if (typeof val === 'number') return val;
  return Date.now();
}

export function subscribeArchiveRecords(
  onRecords: (records: QuestArchiveRecord[]) => void,
  onError: (err: Error) => void
): () => void {
  const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const list: QuestArchiveRecord[] = snapshot.docs.map((d) => {
        const data = d.data();
        const demo = (data.demographics ?? {}) as Record<string, unknown>;
        return {
          id: d.id,
          participant: String(data.participant ?? d.id),
          demographics: {
            name: String(demo.name ?? ''),
            age: Number(demo.age ?? 0),
            gender: demo.gender === 'male' ? 'male' : 'female',
            section: String(demo.section ?? ''),
            consented: Boolean(demo.consented),
            consentTimestamp: String(demo.consentTimestamp ?? ''),
          },
          character: data.character === 'male' ? 'male' : 'female',
          durationMs: Number(data.durationMs ?? 0),
          totalAnswered: Number(data.totalAnswered ?? 0),
          roomOrder: (Array.isArray(data.roomOrder) ? data.roomOrder : []) as RoomId[],
          answers: (Array.isArray(data.answers) ? data.answers : []) as QuestionnaireAnswer[],
          distance: Number(data.distance ?? 0),
          moveTimeMs: Number(data.moveTimeMs ?? 0),
          events: (Array.isArray(data.events) ? data.events : []) as TelemetryEvent[],
          samples: (Array.isArray(data.samples) ? data.samples : []) as SpatialSample[],
          archiveStatus: data.archiveStatus === 'archived' ? 'archived' : 'active',
          adminNotes: String(data.adminNotes ?? ''),
          editedBy: String(data.editedBy ?? ''),
          createdAtMs: toMillis(data.createdAt),
          updatedAtMs: toMillis(data.updatedAt),
        };
      });
      onRecords(list);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, COLLECTION_NAME);
      } catch (wrapped) {
        onError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    }
  );
}

export async function updateArchiveRecord(
  id: string,
  updates: {
    demographics: QuestArchiveRecord['demographics'];
    character: GenderOption;
    answers: QuestionnaireAnswer[];
    archiveStatus: ArchiveStatus;
    adminNotes: string;
  },
  editorEmail: string
): Promise<void> {
  const path = `${COLLECTION_NAME}/${id}`;
  try {
    await updateDoc(doc(db, COLLECTION_NAME, id), {
      demographics: {
        name: updates.demographics.name.trim().slice(0, 80),
        age: Math.min(99, Math.max(7, Math.round(updates.demographics.age))),
        gender: updates.demographics.gender,
        section: updates.demographics.section.trim().slice(0, 60),
        consented: true,
        consentTimestamp: updates.demographics.consentTimestamp.slice(0, 40),
      },
      character: updates.character,
      answers: updates.answers,
      archiveStatus: updates.archiveStatus,
      adminNotes: updates.adminNotes.trim().slice(0, 1000),
      editedBy: editorEmail.slice(0, 160),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}
