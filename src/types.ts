export type GenderOption = 'female' | 'male';

export type SimPhase = 'landing' | 'briefing' | 'playing' | 'complete';

export type RoomId = 'classroom' | 'library' | 'canteen' | 'principal';

export type CampusMode = 'outdoor' | 'room_walk' | 'seated_first_person';

export type OptionLetter = 'A' | 'B' | 'C' | 'D';

export type ArchiveStatus = 'active' | 'archived';

export interface DemographicsData {
  name: string;
  age: number;
  gender: GenderOption;
  section: string;
  consented: boolean;
  consentTimestamp: string;
}

export interface PatientQuestion {
  id: string;
  roomId: RoomId;
  patientIndex: number;
  patientName: string;
  patientRole: string;
  modelFile: string;
  scale?: number;
  prompt: string;
  options: Record<OptionLetter, string>;
}

export interface RoomConfig {
  id: RoomId;
  name: string;
  subtitle: string;
  x: number;
  z: number;
  facingSign: number;
  doorX: number;
  doorZ: number;
  wallColor: number;
  roofColor: number;
  trimColor: number;
  questions: PatientQuestion[];
}

export interface RoomProgress {
  id: RoomId;
  name: string;
  subtitle: string;
  completedCount: number;
  totalCount: number;
  completed: boolean;
}

export interface QuestionnaireAnswer {
  questionId: string;
  roomId: RoomId;
  roomName: string;
  patientIndex: number;
  patientName: string;
  selectedOption: OptionLetter;
  selectedText: string;
  responseTimeMs: number;
  answeredAtMs: number;
}

export interface TelemetryEvent {
  t: number;
  type: string;
  roomId?: RoomId;
  questionId?: string;
  selectedOption?: OptionLetter;
  character?: GenderOption;
  gender?: GenderOption;
  section?: string;
}

export interface SpatialSample {
  t: number;
  x: number;
  z: number;
}

export interface QuestResult {
  participant: string;
  demographics: {
    name: string | null;
    age: number;
    gender: GenderOption;
    section: string;
    consented: boolean;
    consentTimestamp: string;
  };
  character: GenderOption;
  durationMs: number;
  totalAnswered: number;
  roomOrder: RoomId[];
  answers: QuestionnaireAnswer[];
  distance: number;
  moveTimeMs: number;
  events: TelemetryEvent[];
  samples: [number, number, number][];
}

export interface QuestArchiveRecord {
  id: string;
  participant: string;
  demographics: {
    name: string;
    age: number;
    gender: GenderOption;
    section: string;
    consented: boolean;
    consentTimestamp: string;
  };
  character: GenderOption;
  durationMs: number;
  totalAnswered: number;
  roomOrder: RoomId[];
  answers: QuestionnaireAnswer[];
  distance: number;
  moveTimeMs: number;
  events: TelemetryEvent[];
  samples: SpatialSample[];
  archiveStatus: ArchiveStatus;
  adminNotes: string;
  editedBy: string;
  createdAtMs: number;
  updatedAtMs: number;
}
