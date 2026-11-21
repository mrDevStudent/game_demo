import React, { useEffect, useState } from 'react';
import { OptionLetter, PatientQuestion } from '../types';

interface QuestionnaireOverlayProps {
  question: PatientQuestion | null;
  roomCounter: { roomName: string; current: number; total: number } | null;
  totalAnswered: number;
  totalQuestionnaires: number;
  onSelectOption: (option: OptionLetter) => void;
}

const OPTION_LETTERS: OptionLetter[] = ['A', 'B', 'C', 'D'];

export const QuestionnaireOverlay: React.FC<QuestionnaireOverlayProps> = ({
  question,
  roomCounter,
  totalAnswered,
  totalQuestionnaires,
  onSelectOption,
}) => {
  const [selected, setSelected] = useState<OptionLetter | null>(null);

  useEffect(() => {
    setSelected(null);
  }, [question?.id]);

  const handleChoose = (letter: OptionLetter) => {
    if (!question || selected !== null) return;
    setSelected(letter);
    window.setTimeout(() => {
      onSelectOption(letter);
    }, 180);
  };

  useEffect(() => {
    if (!question) return;
    const onKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toUpperCase();
      if (key === 'A' || key === '1') handleChoose('A');
      else if (key === 'B' || key === '2') handleChoose('B');
      else if (key === 'C' || key === '3') handleChoose('C');
      else if (key === 'D' || key === '4') handleChoose('D');
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  if (!question || !roomCounter) {
    return (
      <div className="pointer-events-none fixed bottom-5 left-1/2 -translate-x-1/2 z-20">
        <div className="rounded-xl bg-white/95 border border-slate-200 shadow-lg px-5 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 whitespace-nowrap">
          Next client approaching the desk…
        </div>
      </div>
    );
  }

  return (
    <div className="pointer-events-none fixed bottom-2.5 sm:bottom-3 lg:bottom-5 left-1/2 -translate-x-1/2 z-20 w-[min(780px,calc(100vw-1.5rem))]">
      <div className="pointer-events-auto max-h-[58dvh] lg:max-h-none overflow-y-auto rounded-2xl bg-white/95 border border-slate-200 shadow-xl p-3 sm:p-4 lg:p-6 text-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] lg:text-xs text-slate-500 mb-1.5 lg:mb-2">
          <div className="flex items-center gap-2 font-medium">
            <span className="font-semibold text-blue-700">{roomCounter.roomName}</span>
            <span aria-hidden="true">·</span>
            <span>{question.patientName}</span>
            <span aria-hidden="true">·</span>
            <span>{question.patientRole}</span>
          </div>
          <div className="font-mono-tabular font-semibold text-slate-600">
            Client {roomCounter.current}/{roomCounter.total} · Total {totalAnswered}/{totalQuestionnaires}
          </div>
        </div>

        <h3 className="font-display text-sm sm:text-base lg:text-lg font-bold text-slate-900 leading-snug mb-2.5 lg:mb-3.5">
          {question.prompt}
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 lg:gap-2.5">
          {OPTION_LETTERS.map((letter) => {
            const isPicked = selected === letter;
            return (
              <button
                key={letter}
                type="button"
                disabled={selected !== null}
                onClick={() => handleChoose(letter)}
                className={`flex items-start gap-2.5 lg:gap-3 text-left rounded-xl border px-3 py-2 lg:px-3.5 lg:py-2.5 min-h-[40px] lg:min-h-[44px] transition-colors ${
                  isPicked
                    ? 'border-blue-600 bg-blue-600 text-white'
                    : 'border-slate-200 bg-slate-50 text-slate-800 hover:border-blue-400 hover:bg-blue-50/70'
                }`}
              >
                <span
                  className={`font-mono-tabular inline-flex items-center justify-center w-5 h-5 lg:w-6 lg:h-6 rounded-md text-[11px] lg:text-xs font-bold shrink-0 mt-0.5 ${
                    isPicked ? 'bg-white text-blue-700' : 'bg-white border border-slate-300 text-slate-700'
                  }`}
                >
                  {letter}
                </span>
                <span className="text-xs lg:text-sm font-medium leading-snug">
                  {question.options[letter]}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
