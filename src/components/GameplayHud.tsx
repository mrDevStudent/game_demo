import React, { useEffect, useRef, useState } from 'react';
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Circle,
  DoorOpen,
  Gamepad2,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
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
  muted: boolean;
  isFullscreen: boolean;
  fullscreenSupported: boolean;
  joystickRef: React.MutableRefObject<JoystickInput>;
  onToggleMute: () => void;
  onToggleFullscreen: () => void;
  onLeaveRoom: () => void;
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
  muted,
  isFullscreen,
  fullscreenSupported,
  joystickRef,
  onToggleMute,
  onToggleFullscreen,
  onLeaveRoom,
}) => {
  const [controlsCollapsed, setControlsCollapsed] = useState(false);
  const [showTouchPad, setShowTouchPad] = useState(false);
  const stickRef = useRef<HTMLDivElement | null>(null);
  const knobRef = useRef<HTMLDivElement | null>(null);
  const pointerIdRef = useRef<number | null>(null);

  useEffect(() => {
    const isCoarse = window.matchMedia('(pointer: coarse)').matches;
    if (isCoarse) setShowTouchPad(true);
  }, []);

  const totalDone = rooms.reduce((sum, r) => sum + r.completedCount, 0);
  const activeRoom = rooms.find((r) => r.id === activeRoomId) ?? null;

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
      ? 'Walk into any building entrance'
      : campusMode === 'room_walk'
        ? 'Follow the arrow to sit at the desk chair'
        : 'Answer each client (A / B / C / D)';

  return (
    <div className="fixed inset-0 z-10 pointer-events-none">
      {/* Top-Left Room & Questionnaire Checklist */}
      <div className="pointer-events-auto fixed left-3 top-3 sm:left-4 sm:top-4 w-60 rounded-xl bg-white/95 border border-slate-200 shadow-md p-3.5 text-slate-900">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Progress ({totalDone}/{TOTAL_QUESTIONNAIRES})
          </span>
          <span className="font-mono-tabular text-sm font-bold text-blue-700">
            {formatTime(elapsedMs)}
          </span>
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
                    <Circle className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
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

        {campusMode === 'room_walk' && activeRoom && (
          <button
            type="button"
            onClick={onLeaveRoom}
            className="mt-2.5 w-full flex items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <DoorOpen className="w-3.5 h-3.5 shrink-0" />
            <span>Exit {activeRoom.name}</span>
          </button>
        )}
      </div>

      {/* Top-Right Utility Controls */}
      <div className="pointer-events-auto fixed right-3 top-3 sm:right-4 sm:top-4 flex items-center gap-2">
        <button
          type="button"
          onClick={onToggleMute}
          title={muted ? 'Unmute audio (M)' : 'Mute audio (M)'}
          aria-label={muted ? 'Unmute audio' : 'Mute audio'}
          className="h-10 w-10 flex items-center justify-center rounded-xl bg-white/95 border border-slate-200 shadow-sm text-slate-700 hover:bg-slate-50 transition-colors"
        >
          {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>

        {fullscreenSupported && (
          <button
            type="button"
            onClick={onToggleFullscreen}
            title={isFullscreen ? 'Exit fullscreen (F)' : 'Enter fullscreen (F)'}
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            className="h-10 w-10 flex items-center justify-center rounded-xl bg-white/95 border border-slate-200 shadow-sm text-slate-700 hover:bg-slate-50 transition-colors"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* Top-Center Toast Feedback */}
      {toastMessage && (
        <div
          role="status"
          className="fixed top-4 left-1/2 -translate-x-1/2 rounded-xl bg-slate-900 text-white px-4 py-2 text-xs sm:text-sm font-semibold shadow-lg whitespace-nowrap"
        >
          {toastMessage}
        </div>
      )}

      {/* Virtual Joystick (only while walking, hidden when seated in 1st-person questionnaire) */}
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
          className="pointer-events-auto no-select-touch fixed left-5 bottom-6 w-[120px] h-[120px] rounded-full bg-white/90 border border-slate-300 shadow-md"
        >
          <div
            ref={knobRef}
            style={{ left: '40px', top: '40px' }}
            className="absolute w-10 h-10 rounded-full bg-amber-500 shadow"
          />
        </div>
      )}

      {/* Collapsible Bottom Control Dock (hidden when seated so Questionnaire UI sits unobstructed) */}
      {campusMode !== 'seated_first_person' && (
        <div className="pointer-events-auto fixed bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center">
          <button
            type="button"
            onClick={() => setControlsCollapsed((prev) => !prev)}
            className="flex items-center gap-1.5 rounded-t-lg bg-white/95 border border-b-0 border-slate-200 px-3 py-1 text-[11px] font-semibold text-slate-600 hover:text-slate-900 shadow-sm whitespace-nowrap"
          >
            {controlsCollapsed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            <span>{controlsCollapsed ? 'Show Controls' : 'Hide Controls'}</span>
          </button>

          {!controlsCollapsed && (
            <div className="flex items-center gap-3 rounded-xl bg-white/95 border border-slate-200 shadow-md px-4 py-2 text-xs text-slate-600 whitespace-nowrap">
              <span>WASD / Arrows: Move</span>
              <span aria-hidden="true">·</span>
              <span>Drag: Orbit</span>
              <span aria-hidden="true">·</span>
              <span>Scroll: Zoom</span>
              <button
                type="button"
                onClick={() => setShowTouchPad((prev) => !prev)}
                className={`ml-1 inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold transition-colors ${
                  showTouchPad ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Gamepad2 className="w-3.5 h-3.5" />
                <span>Joystick</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
