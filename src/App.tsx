import { useCallback, useEffect, useRef, useState } from 'react';
import { Maximize2, Minimize2, ShieldCheck, Volume2, VolumeX } from 'lucide-react';
import { CampusCanvas, JoystickInput } from './scene/CampusCanvas';
import { DemographicsLanding } from './components/DemographicsLanding';
import { BriefingOverlay } from './components/BriefingOverlay';
import { GameplayHud } from './components/GameplayHud';
import { QuestionnaireOverlay } from './components/QuestionnaireOverlay';
import { CompletionSummary } from './components/CompletionSummary';
import { AdminDashboard } from './components/AdminDashboard';
import { ErrorBoundary } from './components/ErrorBoundary';
import { saveQuestSubmission } from './services/firebaseArchive';
import { soundEngine } from './audio/soundEngine';
import { TOTAL_QUESTIONNAIRES } from './data/questionnaires';
import {
  CampusMode,
  DemographicsData,
  GenderOption,
  OptionLetter,
  PatientQuestion,
  QuestResult,
  RoomId,
  RoomProgress,
  SimPhase,
} from './types';

export default function App() {
  const [phase, setPhase] = useState<SimPhase>('landing');
  const [selectedGender, setSelectedGender] = useState<GenderOption>('female');
  const [demographics, setDemographics] = useState<DemographicsData | null>(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [modelsError, setModelsError] = useState<string | null>(null);

  const [rooms, setRooms] = useState<RoomProgress[]>([]);
  const [campusMode, setCampusMode] = useState<CampusMode>('outdoor');
  const [activeRoomId, setActiveRoomId] = useState<RoomId | null>(null);
  const [activeQuestion, setActiveQuestion] = useState<PatientQuestion | null>(null);
  const [roomCounter, setRoomCounter] = useState<{
    roomName: string;
    current: number;
    total: number;
  } | null>(null);

  const [elapsedMs, setElapsedMs] = useState(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [result, setResult] = useState<QuestResult | null>(null);
  const [archiveState, setArchiveState] = useState<'saving' | 'saved' | 'error'>('saving');
  const [archiveError, setArchiveError] = useState<string | null>(null);
  const [adminOpen, setAdminOpen] = useState(false);

  const [sessionResetKey, setSessionResetKey] = useState(0);
  const [muted, setMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const joystickRef = useRef<JoystickInput>({ active: false, x: 0, y: 0 });
  const submitAnswerRef = useRef<((option: OptionLetter) => void) | null>(null);
  const leaveRoomRef = useRef<(() => void) | null>(null);
  const retryModelsRef = useRef<(() => void) | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  const docEl = typeof document !== 'undefined' ? document.documentElement : null;
  const fullscreenSupported = Boolean(
    docEl &&
      (docEl.requestFullscreen ||
        (docEl as HTMLElement & { webkitRequestFullscreen?: () => Promise<void> })
          .webkitRequestFullscreen)
  );

  const showToast = useCallback((message: string) => {
    setToastMessage(message);
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = window.setTimeout(() => {
      setToastMessage(null);
    }, 2600);
  }, []);

  const toggleMute = useCallback(() => {
    setMuted((prev) => {
      const next = !prev;
      soundEngine.setMuted(next);
      return next;
    });
  }, []);

  const toggleFullscreen = useCallback(() => {
    try {
      const doc = document as Document & {
        webkitFullscreenElement?: Element;
        webkitExitFullscreen?: () => Promise<void>;
      };
      const el = document.documentElement as HTMLElement & {
        webkitRequestFullscreen?: () => Promise<void>;
      };
      const orientation = window.screen?.orientation as
        | (ScreenOrientation & { lock?: (type: string) => Promise<void>; unlock?: () => void })
        | undefined;

      if (doc.fullscreenElement || doc.webkitFullscreenElement) {
        try {
          orientation?.unlock?.();
        } catch {
          // Ignore unsupported orientation unlock
        }
        (doc.exitFullscreen || doc.webkitExitFullscreen)?.call(doc);
      } else {
        const req = (el.requestFullscreen || el.webkitRequestFullscreen)?.call(el);
        const isTouchOrNarrow =
          window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 1024;
        if (req && typeof req.then === 'function') {
          req
            .then(() => {
              if (isTouchOrNarrow && orientation?.lock) {
                orientation.lock('landscape').catch(() => {
                  // iOS Safari / desktop browsers disallow programmatic lock
                });
              }
            })
            .catch(() => showToast('Fullscreen not available here'));
        }
      }
    } catch {
      showToast('Fullscreen not available here');
    }
  }, [showToast]);

  useEffect(() => {
    const onFullscreenChange = () => {
      const doc = document as Document & { webkitFullscreenElement?: Element };
      const active = Boolean(doc.fullscreenElement || doc.webkitFullscreenElement);
      setIsFullscreen(active);
      if (!active) {
        try {
          window.screen?.orientation?.unlock?.();
        } catch {
          // Ignore unsupported orientation unlock
        }
      }
    };
    const onVisibilityChange = () => {
      soundEngine.handleVisibilityChange(document.hidden);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')
      ) {
        return;
      }
      if (e.code === 'KeyM') toggleMute();
      if (e.code === 'KeyF' && fullscreenSupported) toggleFullscreen();
    };

    document.addEventListener('fullscreenchange', onFullscreenChange);
    document.addEventListener('webkitfullscreenchange', onFullscreenChange);
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('fullscreenchange', onFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', onFullscreenChange);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [fullscreenSupported, toggleFullscreen, toggleMute]);

  const handleModelsLoaded = useCallback(() => {
    setModelsLoaded(true);
    setModelsError(null);
  }, []);

  const handleModelsError = useCallback((err: string) => {
    setModelsError(err);
  }, []);

  const handleRetryModels = useCallback(() => {
    setModelsError(null);
    setModelsLoaded(false);
    retryModelsRef.current?.();
  }, []);

  const handleGenderChange = useCallback((gender: GenderOption) => {
    soundEngine.playSfx('click');
    setSelectedGender(gender);
  }, []);

  const handleDemographicsSubmit = useCallback((data: DemographicsData) => {
    soundEngine.playSfx('click');
    soundEngine.startMusic();
    setDemographics(data);
    setSelectedGender(data.gender);
    setPhase('briefing');
  }, []);

  const handleBeginQuest = useCallback(() => {
    soundEngine.playSfx('click');
    soundEngine.startMusic();
    setPhase('playing');
  }, []);

  const handleModeChange = useCallback((mode: CampusMode, roomId: RoomId | null) => {
    setCampusMode(mode);
    setActiveRoomId(roomId);
  }, []);

  const handleActiveQuestionChange = useCallback(
    (
      question: PatientQuestion | null,
      counter: { roomName: string; current: number; total: number } | null
    ) => {
      setActiveQuestion(question);
      setRoomCounter(counter);
    },
    []
  );

  const handleSelectOption = useCallback((option: OptionLetter) => {
    if (submitAnswerRef.current) {
      submitAnswerRef.current(option);
    }
  }, []);

  const persistQuestResult = useCallback(async (questResult: QuestResult) => {
    setArchiveState('saving');
    setArchiveError(null);
    try {
      await saveQuestSubmission(questResult);
      setArchiveState('saved');
    } catch (err) {
      setArchiveState('error');
      setArchiveError(err instanceof Error ? 'Save failed' : 'Save failed');
    }
  }, []);

  const handleQuestComplete = useCallback(
    (questResult: QuestResult) => {
      soundEngine.playSfx('complete');
      soundEngine.softenMusic();
      setResult(questResult);
      setPhase('complete');
      void persistQuestResult(questResult);
    },
    [persistQuestResult]
  );

  const handleRestartSession = useCallback(() => {
    soundEngine.playSfx('click');
    setResult(null);
    setDemographics(null);
    setElapsedMs(0);
    setToastMessage(null);
    setActiveQuestion(null);
    setRoomCounter(null);
    setArchiveState('saving');
    setArchiveError(null);
    setSessionResetKey((k) => k + 1);
    setPhase('landing');
  }, []);

  const handlePickupSfx = useCallback(() => {
    soundEngine.playSfx('pickup');
  }, []);

  const totalAnswered = rooms.reduce((sum, r) => sum + r.completedCount, 0);

  return (
    <ErrorBoundary>
      <div className="relative w-screen h-screen overflow-hidden bg-[#c2daef] select-none">
        {/* Unobstructed 3D Campus & Room Viewport */}
        <CampusCanvas
          phase={phase}
          selectedGender={selectedGender}
          demographicsSnapshot={demographics}
          sessionResetKey={sessionResetKey}
          joystickRef={joystickRef}
          submitAnswerRef={submitAnswerRef}
          leaveRoomRef={leaveRoomRef}
          retryModelsRef={retryModelsRef}
          onModelsLoaded={handleModelsLoaded}
          onModelsError={handleModelsError}
          onRoomProgressChange={setRooms}
          onModeChange={handleModeChange}
          onActiveQuestionChange={handleActiveQuestionChange}
          onTimerTick={setElapsedMs}
          onToast={showToast}
          onPickupSfx={handlePickupSfx}
          onQuestComplete={handleQuestComplete}
        />

        {/* Top-Right Global Controls (Admin, Audio, Fullscreen) */}
        <div className="fixed right-3 top-3 sm:right-4 sm:top-4 z-30 flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={() => {
              soundEngine.playSfx('click');
              setAdminOpen(true);
            }}
            className="h-10 px-2.5 sm:px-3.5 flex items-center gap-1.5 rounded-xl bg-white/95 border border-slate-200 shadow-sm text-xs font-semibold text-slate-800 hover:bg-slate-50 transition-colors"
          >
            <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
            <span>Admin</span>
          </button>

          <button
            type="button"
            onClick={toggleMute}
            title={muted ? 'Unmute audio (M)' : 'Mute audio (M)'}
            aria-label={muted ? 'Unmute audio' : 'Mute audio'}
            className="h-10 w-10 flex items-center justify-center rounded-xl bg-white/95 border border-slate-200 shadow-sm text-slate-700 hover:bg-slate-50 transition-colors"
          >
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {fullscreenSupported && (
            <button
              type="button"
              onClick={toggleFullscreen}
              title={isFullscreen ? 'Exit fullscreen (F)' : 'Enter fullscreen (F)'}
              aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
              className="h-10 w-10 flex items-center justify-center rounded-xl bg-white/95 border border-slate-200 shadow-sm text-slate-700 hover:bg-slate-50 transition-colors"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          )}
        </div>

        {/* Phase 1: Landing Page + Demographics & Informed Consent */}
        {phase === 'landing' && (
          <DemographicsLanding
            modelsLoaded={modelsLoaded}
            modelsError={modelsError}
            selectedGender={selectedGender}
            initialData={demographics}
            onGenderChange={handleGenderChange}
            onSubmit={handleDemographicsSubmit}
            onRetryModels={handleRetryModels}
          />
        )}

        {/* Phase 2: Pre-Quest Briefing */}
        {phase === 'briefing' && demographics && (
          <BriefingOverlay
            demographics={demographics}
            onBack={() => {
              soundEngine.playSfx('click');
              setPhase('landing');
            }}
            onBegin={handleBeginQuest}
          />
        )}

        {/* Phase 3: Active Gameplay HUD & 1st-Person Questionnaire */}
        {phase === 'playing' && demographics && (
          <>
            <GameplayHud
              rooms={rooms}
              campusMode={campusMode}
              activeRoomId={activeRoomId}
              elapsedMs={elapsedMs}
              demographics={demographics}
              toastMessage={toastMessage}
              joystickRef={joystickRef}
            />

            {campusMode === 'seated_first_person' && (
              <QuestionnaireOverlay
                question={activeQuestion}
                roomCounter={roomCounter}
                totalAnswered={totalAnswered}
                totalQuestionnaires={TOTAL_QUESTIONNAIRES}
                onSelectOption={handleSelectOption}
              />
            )}
          </>
        )}

        {/* Phase 4: End-Player Completion Summary (No Download / Copy Controls) */}
        {phase === 'complete' && result && (
          <CompletionSummary
            result={result}
            archiveState={archiveState}
            archiveError={archiveError}
            onRetryArchive={() => {
              if (result) void persistQuestResult(result);
            }}
            onRestart={handleRestartSession}
          />
        )}

        {/* Admin Dashboard Overlay (Archive, Edit, SVG Download & Copy — No Delete) */}
        <AdminDashboard open={adminOpen} onClose={() => setAdminOpen(false)} />
      </div>
    </ErrorBoundary>
  );
}
