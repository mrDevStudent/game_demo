import React, { useState } from 'react';
import { Check, Copy, Download, RotateCcw } from 'lucide-react';
import { QuestResult } from '../types';

interface CompletionSummaryProps {
  result: QuestResult;
  onRestart: () => void;
}

function formatTime(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

export const CompletionSummary: React.FC<CompletionSummaryProps> = ({ result, onRestart }) => {
  const [copied, setCopied] = useState(false);
  const jsonText = JSON.stringify(result, null, 2);

  const handleDownload = () => {
    const blob = new Blob([jsonText], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quest-${result.participant}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(jsonText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignore if clipboard unavailable
    }
  };

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center p-4 pointer-events-none">
      <div className="pointer-events-auto w-full max-w-xl max-h-[calc(100vh-2rem)] overflow-y-auto rounded-2xl bg-white shadow-xl border border-slate-200 p-6 sm:p-7 text-slate-900">
        <div className="text-center mb-5">
          <p className="text-xs font-medium text-emerald-700 mb-1">All 4 Rooms Completed</p>
          <h2 className="font-display text-2xl font-bold tracking-tight text-slate-900">
            Simulation Complete
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Share the participant code below with your researcher.
          </p>

          <div className="mt-4 inline-block rounded-xl bg-slate-50 border border-slate-200 px-6 py-3">
            <span className="block text-[11px] font-medium text-slate-500 mb-0.5">
              Participant Code
            </span>
            <span className="font-mono-tabular text-3xl font-bold tracking-[0.22em] text-blue-700">
              {result.participant}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-5">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <span className="block text-[11px] text-slate-500">Questionnaires</span>
            <span className="font-mono-tabular text-base font-bold text-slate-900">
              {result.totalAnswered} / 20
            </span>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <span className="block text-[11px] text-slate-500">Duration</span>
            <span className="font-mono-tabular text-base font-bold text-slate-900">
              {formatTime(result.durationMs)}
            </span>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <span className="block text-[11px] text-slate-500">Distance</span>
            <span className="font-mono-tabular text-base font-bold text-slate-900">
              {result.distance} m
            </span>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <span className="block text-[11px] text-slate-500">Move Time</span>
            <span className="font-mono-tabular text-base font-bold text-slate-900">
              {formatTime(result.moveTimeMs)}
            </span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 mb-4 text-xs text-slate-600 space-y-1">
          <div className="flex justify-between">
            <span>Participant</span>
            <span className="font-semibold text-slate-900">
              {result.demographics.name ?? 'Anonymous'}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Age / Section</span>
            <span className="font-semibold text-slate-900">
              {result.demographics.age} · {result.demographics.section}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Gender / Character</span>
            <span className="font-semibold text-slate-900 capitalize">
              {result.demographics.gender} ({result.character} model)
            </span>
          </div>
          <div className="flex justify-between">
            <span>Building Order</span>
            <span className="font-semibold text-slate-900 capitalize">
              {result.roomOrder.join(' → ')}
            </span>
          </div>
        </div>

        <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-3 max-h-40 overflow-y-auto">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-2">
            Recorded Responses ({result.answers.length})
          </p>
          <div className="space-y-1.5 text-xs">
            {result.answers.map((ans) => (
              <div
                key={ans.questionId}
                className="flex items-center justify-between gap-3 py-1 border-b border-slate-200/70 last:border-b-0"
              >
                <span className="text-slate-700 truncate">
                  {ans.roomName} · {ans.patientName}
                </span>
                <span className="font-mono-tabular font-bold text-blue-700 shrink-0">
                  Option {ans.selectedOption}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 mb-3">
          <button
            type="button"
            onClick={handleDownload}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors whitespace-nowrap"
          >
            <Download className="w-4 h-4 shrink-0" />
            <span>Download JSON</span>
          </button>

          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600 shrink-0" /> : <Copy className="w-4 h-4 shrink-0" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          <button
            type="button"
            onClick={onRestart}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap"
          >
            <RotateCcw className="w-4 h-4 shrink-0" />
            <span>New Session</span>
          </button>
        </div>

        <textarea
          readOnly
          value={jsonText}
          aria-label="Study telemetry JSON output"
          className="w-full h-24 rounded-lg border border-slate-200 bg-slate-50 p-2.5 font-mono-tabular text-[11px] text-slate-600 focus:outline-none"
        />
      </div>
    </div>
  );
};
