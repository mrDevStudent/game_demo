import React, { useState } from 'react';
import { ArrowRight, Check, FileText, Loader2 } from 'lucide-react';
import { DemographicsData, GenderOption } from '../types';

interface DemographicsLandingProps {
  modelsLoaded: boolean;
  modelsError: string | null;
  selectedGender: GenderOption;
  initialData: DemographicsData | null;
  onGenderChange: (gender: GenderOption) => void;
  onSubmit: (data: DemographicsData) => void;
  onRetryModels?: () => void;
}

export const DemographicsLanding: React.FC<DemographicsLandingProps> = ({
  modelsLoaded,
  modelsError,
  selectedGender,
  initialData,
  onGenderChange,
  onSubmit,
  onRetryModels,
}) => {
  const [name, setName] = useState(initialData?.name ?? '');
  const [age, setAge] = useState(initialData?.age ? String(initialData.age) : '');
  const [section, setSection] = useState(initialData?.section ?? '');
  const [consented, setConsented] = useState(initialData?.consented ?? false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAge = Number(age);
    if (!age.trim() || !Number.isFinite(parsedAge) || parsedAge < 7 || parsedAge > 99) {
      setErrorMsg('Please enter a valid age between 7 and 99.');
      return;
    }
    if (!section.trim()) {
      setErrorMsg('Please enter your class or section.');
      return;
    }
    if (!consented) {
      setErrorMsg('You must read and agree to the Informed Consent Letter before continuing.');
      return;
    }

    setErrorMsg(null);
    onSubmit({
      name: name.trim(),
      age: Math.round(parsedAge),
      gender: selectedGender,
      section: section.trim(),
      consented: true,
      consentTimestamp: new Date().toISOString(),
    });
  };

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-start p-3 sm:p-4 lg:p-10 pointer-events-none">
      <div className="pointer-events-auto w-full max-w-[520px] landscape:max-w-[46vw] lg:landscape:max-w-[520px] max-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-2rem)] lg:max-h-[calc(100vh-3rem)] overflow-y-auto rounded-2xl bg-white shadow-xl border border-slate-200/90 p-4 sm:p-5 lg:p-8 text-slate-900">
        <div className="space-y-1 lg:space-y-2 mb-3.5 lg:mb-6">
          <p className="text-[11px] lg:text-xs font-medium text-slate-500">
            Campus Spatial Navigation Study · 3–5 min · Anonymous Export
          </p>
          <h1 className="font-display text-lg sm:text-xl lg:text-3xl font-bold tracking-tight text-slate-900">
            Campus Quest Simulator
          </h1>
          <p className="text-xs lg:text-sm text-slate-600 leading-relaxed">
            Complete the brief participant intake and informed consent below to enter the 3D campus navigation task.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 lg:space-y-4" noValidate>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 lg:gap-4">
            <div className="sm:col-span-2">
              <label htmlFor="demo-name" className="block text-xs font-semibold text-slate-700 mb-1 lg:mb-1.5">
                Name <span className="font-normal text-slate-400">(Optional)</span>
              </label>
              <input
                id="demo-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name or leave blank"
                maxLength={80}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 lg:px-3.5 lg:py-2.5 text-xs lg:text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              />
            </div>

            <div>
              <label htmlFor="demo-age" className="block text-xs font-semibold text-slate-700 mb-1 lg:mb-1.5">
                Age <span className="text-rose-600">*</span>
              </label>
              <input
                id="demo-age"
                type="number"
                min={7}
                max={99}
                value={age}
                onChange={(e) => {
                  setAge(e.target.value);
                  if (errorMsg) setErrorMsg(null);
                }}
                placeholder="e.g. 19"
                required
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 lg:px-3.5 lg:py-2.5 text-xs lg:text-sm font-mono-tabular text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              />
            </div>

            <div>
              <label htmlFor="demo-section" className="block text-xs font-semibold text-slate-700 mb-1 lg:mb-1.5">
                Section <span className="text-rose-600">*</span>
              </label>
              <input
                id="demo-section"
                type="text"
                value={section}
                onChange={(e) => {
                  setSection(e.target.value);
                  if (errorMsg) setErrorMsg(null);
                }}
                placeholder="e.g. BSCS 3A / STEM-11"
                maxLength={60}
                required
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 lg:px-3.5 lg:py-2.5 text-xs lg:text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              />
            </div>
          </div>

          <div>
            <span className="block text-xs font-semibold text-slate-700 mb-1 lg:mb-1.5">
              Gender <span className="text-rose-600">*</span>
            </span>
            <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-100 border border-slate-200">
              {(['female', 'male'] as GenderOption[]).map((option) => {
                const active = selectedGender === option;
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => onGenderChange(option)}
                    className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 lg:px-4 lg:py-2.5 text-xs lg:text-sm font-semibold transition-colors whitespace-nowrap ${
                      active
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-700 hover:bg-white/70 hover:text-slate-900'
                    }`}
                  >
                    {active && <Check className="w-4 h-4 shrink-0" />}
                    <span>{option === 'female' ? 'Female' : 'Male'}</span>
                  </button>
                );
              })}
            </div>
            <p className="mt-1 lg:mt-1.5 text-[11px] lg:text-xs text-slate-500">
              Automatically assigns the {selectedGender} 3D character model shown in the campus preview.
            </p>
          </div>

          <div className="pt-2 border-t border-slate-200">
            <div className="flex items-center gap-2 mb-1.5 lg:mb-2">
              <FileText className="w-4 h-4 text-slate-600 shrink-0" />
              <h2 className="text-xs font-semibold text-slate-800 uppercase tracking-wide">
                Informed Consent Letter
              </h2>
            </div>
            <div className="max-h-24 lg:max-h-36 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-2.5 lg:p-3.5 text-xs text-slate-600 leading-relaxed space-y-2">
              <p className="font-semibold text-slate-800">
                Participant Consent for Spatial Navigation Simulation Study
              </p>
              <p>
                <strong>Purpose:</strong> You are invited to participate in an interactive 3D campus navigation simulation designed to observe wayfinding accuracy, completion timing, and route choices.
              </p>
              <p>
                <strong>Procedures:</strong> After confirming your demographic details, you will guide a 3D avatar across a virtual campus to enter Room 1 through Room 4 and complete 5 client questionnaires in each room.
              </p>
              <p>
                <strong>Confidentiality &amp; Voluntary Participation:</strong> Providing your name is optional. All recorded movement coordinates, event timestamps, and demographic entries are packaged under a randomly generated 6-character participant code for researcher archiving and review. Participation is completely voluntary and you may stop at any time.
              </p>
            </div>

            <label className="mt-2.5 lg:mt-3 flex items-start gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={consented}
                onChange={(e) => {
                  setConsented(e.target.checked);
                  if (errorMsg) setErrorMsg(null);
                }}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600"
              />
              <span className="text-xs text-slate-700 leading-snug">
                I have read the Informed Consent Letter above and voluntarily agree to participate in this simulation.
              </span>
            </label>
          </div>

          {(errorMsg || modelsError) && (
            <div
              role="alert"
              className="flex items-center justify-between gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-700"
            >
              <span className="break-words">{modelsError ?? errorMsg}</span>
              {modelsError && onRetryModels && (
                <button
                  type="button"
                  onClick={onRetryModels}
                  className="shrink-0 rounded-md border border-rose-300 bg-white px-2.5 py-1 text-[11px] font-semibold text-rose-700 hover:bg-rose-100 transition-colors"
                >
                  Retry
                </button>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={!modelsLoaded || Boolean(modelsError)}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 lg:px-5 lg:py-3 text-xs lg:text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
          >
            {!modelsLoaded && !modelsError ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                <span>Loading 3D Characters…</span>
              </>
            ) : (
              <>
                <span>Continue to Briefing</span>
                <ArrowRight className="w-4 h-4 shrink-0" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
