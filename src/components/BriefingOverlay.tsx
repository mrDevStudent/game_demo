import React from 'react';
import { ArrowLeft, CheckCircle2, Compass, Play } from 'lucide-react';
import { getRoomsForStage, TOTAL_PRE_QUESTIONS, TOTAL_QUESTIONNAIRES } from '../data/questionnaires';
import { DemographicsData, formatGenderDisplay, SimulationStage } from '../types';

interface BriefingOverlayProps {
  stage: SimulationStage;
  demographics: DemographicsData;
  preAnsweredCount: number;
  onBack?: () => void;
  onBegin: () => void;
}

export const BriefingOverlay: React.FC<BriefingOverlayProps> = ({
  stage,
  demographics,
  preAnsweredCount,
  onBack,
  onBegin,
}) => {
  const genderLabel = formatGenderDisplay(demographics.gender, demographics.genderOther);
  const avatarLabel = demographics.avatar === 'female' ? 'Female' : 'Male';
  const stageRooms = getRoomsForStage(stage);
  const totalForStage = stage === 'pre' ? TOTAL_PRE_QUESTIONS : TOTAL_QUESTIONNAIRES;

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center p-3 sm:p-4 pointer-events-none">
      <div className="pointer-events-auto w-full max-w-lg max-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-2xl bg-white shadow-xl border border-slate-200 p-4 sm:p-5 lg:p-7 text-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] lg:text-xs font-medium text-slate-500 mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <Compass className="w-4 h-4 text-blue-600 shrink-0" />
            <span className="truncate">
              {demographics.name ? demographics.name : 'Anonymous'} · Age {demographics.age} · {demographics.section}
            </span>
          </div>
          {stage === 'post' ? (
            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Pre-Sim {preAnsweredCount}/{TOTAL_PRE_QUESTIONS}</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 border border-blue-200 px-2 py-0.5 text-[11px] font-semibold text-blue-700 shrink-0">
              <span>Stage 1 of 2 · {totalForStage} Items</span>
            </span>
          )}
        </div>

        <h2 className="font-display text-lg sm:text-xl lg:text-2xl font-bold tracking-tight text-slate-900 mb-1.5 lg:mb-2">
          {stage === 'pre'
            ? 'Part II · Pre-Simulation Briefing'
            : 'Part III · Post-Simulation Briefing'}
        </h2>
        <p className="text-xs lg:text-sm text-slate-600 leading-relaxed mb-3 lg:mb-4">
          Gender: <span className="font-semibold text-slate-800">{genderLabel}</span> · 3D Avatar:{' '}
          <span className="font-semibold text-slate-800">{avatarLabel}</span>.{' '}
          {stage === 'pre'
            ? `Visit Room 1 through Room 4 in any order inside the 3D campus to complete all ${totalForStage} Pre-Simulation client scenarios.`
            : `Pre-Simulation is complete! Revisit Room 1 through Room 4 in the 3D campus to complete all ${totalForStage} Post-Simulation client scenarios.`}
        </p>

        <div className="space-y-1.5 lg:space-y-2 mb-3 lg:mb-4 rounded-xl border border-slate-200 bg-slate-50 p-3 lg:p-4 text-xs lg:text-sm">
          {stageRooms.map((room) => (
            <div key={room.id} className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <span className="font-semibold text-slate-900">{room.name}</span>
                <span className="text-slate-500"> · {room.subtitle}</span>
              </div>
              <span className="text-[11px] lg:text-xs font-mono-tabular text-slate-600 shrink-0">
                {room.questions.length} Qs
              </span>
            </div>
          ))}
        </div>

        <p className="text-[11px] lg:text-xs text-slate-500 mb-3.5 lg:mb-5 leading-relaxed">
          {stage === 'pre'
            ? 'Once you enter a room, follow the guide arrow to the desk chair and answer all 5 A/B/C/D client scenarios before exiting to the next room.'
            : 'Follow the exact same process across Room 1 through Room 4—sit at the consultation desk and answer all 5 A/B/C/D client scenarios per room.'}
        </p>

        <div className="flex items-center gap-2.5 lg:gap-3">
          {stage === 'pre' && onBack && (
            <button
              type="button"
              onClick={onBack}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 lg:px-4 lg:py-2.5 text-xs lg:text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap"
            >
              <ArrowLeft className="w-4 h-4 shrink-0" />
              <span>Profile</span>
            </button>
          )}
          <button
            type="button"
            onClick={onBegin}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2 lg:px-5 lg:py-2.5 text-xs lg:text-sm font-semibold text-white hover:bg-blue-700 transition-colors whitespace-nowrap"
          >
            <Play className="w-4 h-4 shrink-0" />
            <span>
              {stage === 'pre' ? 'Begin Pre-Simulation' : 'Begin Post-Simulation'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
