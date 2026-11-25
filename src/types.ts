export type AvatarGender = 'female' | 'male';

export type GenderOption = 'female' | 'male' | 'other';

export type SimulationStage = 'pre' | 'post';

export type SimPhase =
  | 'landing'
  | 'pre_briefing'
  | 'pre_playing'
  | 'post_briefing'
  | 'post_playing'
  | 'complete';

export type RoomId = 'classroom' | 'library' | 'canteen' | 'principal';

export type CampusMode = 'outdoor' | 'room_walk' | 'seated_first_person';

export type OptionLetter = 'A' | 'B' | 'C' | 'D';

export type ArchiveStatus = 'active' | 'archived';

export type CounselingAreaId = 'area1' | 'area2' | 'area3' | 'area4';

export interface DemographicsData {
  name: string;
  age: number;
  gender: GenderOption;
  genderOther: string;
  avatar: AvatarGender;
  section: string;
  consented: boolean;
  consentTimestamp: string;
}

export interface PreSimulationQuestion {
  id: string;
  itemNumber: number;
  areaId: CounselingAreaId;
  areaTitle: string;
  prompt: string;
  options: Record<OptionLetter, string>;
}

export interface PreSimulationAnswer {
  questionId: string;
  itemNumber: number;
  areaTitle: string;
  selectedOption: OptionLetter;
  selectedText: string;
  responseTimeMs: number;
  answeredAtMs: number;
}

export interface PatientQuestion {
  id: string;
  roomId: RoomId;
  patientIndex: number;
  itemNumber?: number;
  areaTitle?: string;
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
  character?: AvatarGender;
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
    genderOther: string;
    section: string;
    consented: boolean;
    consentTimestamp: string;
  };
  character: AvatarGender;
  durationMs: number;
  preDurationMs: number;
  totalAnswered: number;
  roomOrder: RoomId[];
  preAnswers: PreSimulationAnswer[];
  answers: QuestionnaireAnswer[];
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
    genderOther: string;
    section: string;
    consented: boolean;
    consentTimestamp: string;
  };
  character: AvatarGender;
  durationMs: number;
  preDurationMs: number;
  totalAnswered: number;
  roomOrder: RoomId[];
  preAnswers: PreSimulationAnswer[];
  answers: QuestionnaireAnswer[];
  moveTimeMs: number;
  events: TelemetryEvent[];
  samples: SpatialSample[];
  archiveStatus: ArchiveStatus;
  adminNotes: string;
  editedBy: string;
  createdAtMs: number;
  updatedAtMs: number;
}

export function formatGenderDisplay(gender: GenderOption, genderOther?: string): string {
  if (gender === 'female') return 'Female';
  if (gender === 'male') return 'Male';
  const custom = (genderOther ?? '').trim();
  return custom ? `Other: ${custom}` : 'Other';
}
