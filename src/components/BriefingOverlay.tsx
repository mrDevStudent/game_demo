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
    <div className="fixed inset-0 z-20 flex items-center justify-center p-4 pointer-events-none">
      <div className="pointer-events-auto w-full max-w-md rounded-2xl bg-white shadow-xl border border-slate-200 p-6 sm:p-7 text-slate-900">
        <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-2">
          <Compass className="w-4 h-4 text-blue-600 shrink-0" />
          <span>
            {demographics.name ? demographics.name : 'Anonymous'} · Age {demographics.age} · {demographics.section}
          </span>
        </div>

        <h2 className="font-display text-2xl font-bold tracking-tight text-slate-900 mb-2">
          Simulation Briefing
        </h2>
        <p className="text-sm text-slate-600 leading-relaxed mb-4">
          Your <span className="font-semibold text-slate-800">{genderLabel}</span> character is ready. Visit all 4 campus buildings in any order to complete all {TOTAL_QUESTIONNAIRES} client questionnaires.
        </p>

        <div className="space-y-2 mb-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs sm:text-sm">
          {CAMPUS_ROOMS.map((room, idx) => (
            <div key={room.id} className="flex items-center justify-between">
              <span className="font-medium text-slate-800">
                {idx + 1}. {room.name}
              </span>
              <span className="text-xs text-slate-500">{room.questions.length} Clients</span>
            </div>
          ))}
        </div>

        <p className="text-xs text-slate-500 mb-5 leading-relaxed">
          Inside each building, follow the blue guide arrow to the desk chair to enter 1st-person view. Each client in the queue will step forward with an A / B / C / D question.
        </p>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap"
          >
            <ArrowLeft className="w-4 h-4 shrink-0" />
            <span>Back</span>
          </button>
          <button
            type="button"
            onClick={onBegin}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors whitespace-nowrap"
          >
            <Play className="w-4 h-4 shrink-0" />
            <span>Begin Simulation</span>
          </button>
        </div>
      </div>
    </div>
  );
};
