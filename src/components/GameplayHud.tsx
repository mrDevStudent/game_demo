import React, { useEffect, useRef, useState } from 'react';
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Circle,
  RotateCw,
  X,
} from 'lucide-react';
import { TOTAL_QUESTIONNAIRES } from '../data/questionnaires';
import { CampusMode, DemographicsData, RoomId, RoomProgress } from '../types';
import { JoystickInput } from '../scene/CampusCanvas';

interface GameplayHudProps {
  rooms: RoomProgress[];
  campusMode: CampusMode;
  activeRoomId: RoomId | null;
  elapsedMs: number;
  demographics: DemographicsData;
  toastMessage: string | null;
  joystickRef: React.MutableRefObject<JoystickInput>;
}

function formatTime(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

export const GameplayHud: React.FC<GameplayHudProps> = ({
  rooms,
  campusMode,
  activeRoomId,
  elapsedMs,
  demographics,
  toastMessage,
  joystickRef,
}) => {
  const [progressHidden, setProgressHidden] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth < 640 : false
  );
  const [showTouchPad, setShowTouchPad] = useState(false);
  const [isPortraitMobile, setIsPortraitMobile] = useState(false);
  const [landscapeHintDismissed, setLandscapeHintDismissed] = useState(false);
  const stickRef = useRef<HTMLDivElement | null>(null);
  const knobRef = useRef<HTMLDivElement | null>(null);
  const pointerIdRef = useRef<number | null>(null);

  useEffect(() => {
    const checkViewport = () => {
      const hasTouch =
        window.matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0;
      const portrait = window.innerHeight > window.innerWidth && window.innerWidth < 768;
      setIsPortraitMobile(hasTouch && portrait);
      if (hasTouch) setShowTouchPad(true);
    };

    checkViewport();
    const enableOnTouch = () => {
      setShowTouchPad(true);
      checkViewport();
    };
    window.addEventListener('resize', checkViewport);
    window.addEventListener('orientationchange', checkViewport);
    window.addEventListener('touchstart', enableOnTouch, { passive: true, once: true });
    return () => {
      window.removeEventListener('resize', checkViewport);
      window.removeEventListener('orientationchange', checkViewport);
      window.removeEventListener('touchstart', enableOnTouch);
    };
  }, []);

  const totalDone = rooms.reduce((sum, r) => sum + r.completedCount, 0);

  const resetStick = () => {
    pointerIdRef.current = null;
    joystickRef.current.active = false;
    joystickRef.current.x = 0;
    joystickRef.current.y = 0;
    if (knobRef.current) {
      knobRef.current.style.left = '40px';
      knobRef.current.style.top = '40px';
    }
  };

  const moveStick = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = stickRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    let x = (e.clientX - rect.left - 60) / 50;
    let y = (e.clientY - rect.top - 60) / 50;
    const len = Math.hypot(x, y);
    if (len > 1) {
      x /= len;
      y /= len;
    }
    if (len < 0.12) {
      x = 0;
      y = 0;
    }
    joystickRef.current.active = true;
    joystickRef.current.x = x;
    joystickRef.current.y = -y;
    if (knobRef.current) {
      knobRef.current.style.left = `${40 + x * 40}px`;
      knobRef.current.style.top = `${40 + y * 40}px`;
    }
  };

  useEffect(() => {
    const onBlur = () => {
      pointerIdRef.current = null;
      joystickRef.current.active = false;
      joystickRef.current.x = 0;
      joystickRef.current.y = 0;
    };
    window.addEventListener('blur', onBlur);
    return () => window.removeEventListener('blur', onBlur);
  }, [joystickRef]);

  const instructionText =
    campusMode === 'outdoor'
      ? 'Walk into any room entrance'
      : campusMode === 'room_walk'
        ? 'Follow the arrow to sit at the desk chair'
        : 'Finish all 5 clients (A / B / C / D)';

  return (
    <div className="fixed inset-0 z-10 pointer-events-none">
      {/* Top-Left Collapsible / Hideable Progress UI */}
      <div className="pointer-events-auto fixed left-3 top-3 sm:left-4 sm:top-4 flex flex-col items-start gap-2">
        {progressHidden ? (
          <button
            type="button"
            onClick={() => setProgressHidden(false)}
            title="Show progress"
            aria-label="Show progress"
            className="h-10 px-2.5 sm:px-3 flex items-center gap-1.5 rounded-xl bg-white/95 border border-slate-200 shadow-sm text-xs font-semibold text-slate-800 hover:bg-slate-50 transition-colors"
          >
            <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />
            <span className="hidden sm:inline text-slate-600">Progress</span>
            <span className="font-mono-tabular font-bold text-slate-900">
              {totalDone}/{TOTAL_QUESTIONNAIRES}
            </span>
            <span className="text-slate-300" aria-hidden="true">
              ·
            </span>
            <span className="font-mono-tabular font-bold text-blue-700">
              {formatTime(elapsedMs)}
            </span>
          </button>
        ) : (
          <div className="w-56 sm:w-60 rounded-xl bg-white/95 border border-slate-200 shadow-md p-3.5 text-slate-900">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Progress ({totalDone}/{TOTAL_QUESTIONNAIRES})
              </span>
              <div className="flex items-center gap-1.5">
                <span className="font-mono-tabular text-sm font-bold text-blue-700">
                  {formatTime(elapsedMs)}
                </span>
                <button
                  type="button"
                  onClick={() => setProgressHidden(true)}
                  title="Hide progress"
                  aria-label="Hide progress"
                  className="h-6 w-6 flex items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <ul className="space-y-1.5 text-xs">
              {rooms.map((room) => {
                const isActive = room.id === activeRoomId;
                return (
                  <li
                    key={room.id}
                    className={`flex items-center justify-between ${
                      room.completed
                        ? 'text-slate-400 line-through'
                        : isActive
                          ? 'text-blue-700 font-semibold'
                          : 'text-slate-800 font-medium'
                    }`}
                  >
                    <span className="flex items-center gap-1.5 truncate">
                      {room.completed ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      ) : (
                        <Circle
                          className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-400'}`}
                        />
                      )}
                      <span className="truncate">{room.name}</span>
                    </span>
                    <span className="font-mono-tabular text-[11px] shrink-0">
                      {room.completedCount}/{room.totalCount}
                    </span>
                  </li>
                );
              })}
            </ul>

            <p className="mt-2.5 pt-2 border-t border-slate-200 text-[11px] font-medium text-blue-700">
              {instructionText}
            </p>

            <p className="mt-1 text-[11px] text-slate-500 truncate">
              {demographics.section} · {demographics.gender === 'female' ? 'Female' : 'Male'}
            </p>
          </div>
        )}
      </div>

      {/* Top-Center Toast Feedback (offset below top buttons on narrow screens) */}
      {toastMessage && (
        <div
          role="status"
          className="fixed top-16 sm:top-4 left-1/2 -translate-x-1/2 z-20 max-w-[calc(100vw-1.5rem)] truncate rounded-xl bg-slate-900 text-white px-4 py-2 text-xs sm:text-sm font-semibold shadow-lg whitespace-nowrap"
        >
          {toastMessage}
        </div>
      )}

      {/* Subtle Portrait-Mode Landscape Guide (auto-hides in landscape or when dismissed) */}
      {isPortraitMobile &&
        !landscapeHintDismissed &&
        !toastMessage &&
        campusMode !== 'seated_first_person' && (
          <div className="pointer-events-auto fixed top-16 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 rounded-xl bg-slate-900/95 border border-slate-700/70 text-white px-3 py-1.5 text-xs font-medium shadow-lg whitespace-nowrap">
            <RotateCw className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Rotate to landscape for best view</span>
            <button
              type="button"
              onClick={() => setLandscapeHintDismissed(true)}
              aria-label="Dismiss landscape tip"
              className="ml-0.5 p-0.5 rounded text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

      {/* Virtual Joystick (only while walking on touch devices, hidden when seated in 1st-person questionnaire) */}
      {campusMode !== 'seated_first_person' && showTouchPad && (
        <div
          ref={stickRef}
          onPointerDown={(e) => {
            e.preventDefault();
            pointerIdRef.current = e.pointerId;
            e.currentTarget.setPointerCapture(e.pointerId);
            moveStick(e);
          }}
          onPointerMove={(e) => {
            if (e.pointerId === pointerIdRef.current) moveStick(e);
          }}
          onPointerUp={(e) => {
            if (e.pointerId === pointerIdRef.current) resetStick();
          }}
          onPointerCancel={(e) => {
            if (e.pointerId === pointerIdRef.current) resetStick();
          }}
          onLostPointerCapture={(e) => {
            if (e.pointerId === pointerIdRef.current) resetStick();
          }}
          className="pointer-events-auto no-select-touch fixed left-4 bottom-5 sm:left-5 sm:bottom-6 w-[120px] h-[120px] rounded-full bg-white/90 border border-slate-300 shadow-md"
        >
          <div
            ref={knobRef}
            style={{ left: '40px', top: '40px' }}
            className="absolute w-10 h-10 rounded-full bg-amber-500 shadow"
          />
        </div>
      )}
    </div>
  );
};
