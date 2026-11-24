import React from 'react';
import { ArrowLeft, Compass, Play } from 'lucide-react';
import { CAMPUS_ROOMS, TOTAL_QUESTIONNAIRES } from '../data/questionnaires';
import { DemographicsData } from '../types';

interface BriefingOverlayProps {
  demographics: DemographicsData;
  onBack: () => void;
  onBegin: () => void;
}

export const BriefingOverlay: React.FC<BriefingOverlayProps> = ({
  demographics,
  onBack,
  onBegin,
}) => {
  const genderLabel = demographics.gender === 'female' ? 'Female' : 'Male';

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center p-3 sm:p-4 pointer-events-none">
      <div className="pointer-events-auto w-full max-w-md lg:max-w-md landscape:max-w-lg lg:landscape:max-w-md max-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-2xl bg-white shadow-xl border border-slate-200 p-4 sm:p-5 lg:p-7 text-slate-900">
        <div className="flex items-center gap-2 text-[11px] lg:text-xs font-medium text-slate-500 mb-1.5 lg:mb-2">
          <Compass className="w-4 h-4 text-blue-600 shrink-0" />
          <span className="truncate">
            {demographics.name ? demographics.name : 'Anonymous'} · Age {demographics.age} · {demographics.section}
          </span>
        </div>

        <h2 className="font-display text-lg sm:text-xl lg:text-2xl font-bold tracking-tight text-slate-900 mb-1.5 lg:mb-2">
          Simulation Briefing
        </h2>
        <p className="text-xs lg:text-sm text-slate-600 leading-relaxed mb-3 lg:mb-4">
          Your <span className="font-semibold text-slate-800">{genderLabel}</span> character is ready. Visit Room 1 through Room 4 in any order to complete all {TOTAL_QUESTIONNAIRES} client questionnaires.
        </p>

        <div className="grid grid-cols-2 lg:grid-cols-1 gap-x-4 gap-y-1.5 lg:gap-2 mb-3 lg:mb-4 rounded-xl border border-slate-200 bg-slate-50 p-3 lg:p-4 text-xs lg:text-sm">
          {CAMPUS_ROOMS.map((room) => (
            <div key={room.id} className="flex items-center justify-between gap-2">
              <span className="font-medium text-slate-800 truncate">
                {room.name}
              </span>
              <span className="text-[11px] lg:text-xs text-slate-500 shrink-0">
                {room.questions.length} Clients
              </span>
            </div>
          ))}
        </div>

        <p className="text-[11px] lg:text-xs text-slate-500 mb-3.5 lg:mb-5 leading-relaxed">
          Once you enter a room, follow the guide arrow to the desk chair and finish all 5 client questions before exiting to the next room.
        </p>

        <div className="flex items-center gap-2.5 lg:gap-3">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 lg:px-4 lg:py-2.5 text-xs lg:text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap"
          >
            <ArrowLeft className="w-4 h-4 shrink-0" />
            <span>Back</span>
          </button>
          <button
            type="button"
            onClick={onBegin}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2 lg:px-5 lg:py-2.5 text-xs lg:text-sm font-semibold text-white hover:bg-blue-700 transition-colors whitespace-nowrap"
          >
            <Play className="w-4 h-4 shrink-0" />
            <span>Begin Simulation</span>
          </button>
        </div>
      </div>
    </div>
  );
};
