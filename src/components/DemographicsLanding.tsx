import React, { useState } from 'react';
import { ArrowRight, Check, FileText, Loader2 } from 'lucide-react';
import { AvatarGender, DemographicsData, GenderOption } from '../types';

interface DemographicsLandingProps {
  modelsLoaded: boolean;
  modelsError: string | null;
  selectedAvatar: AvatarGender;
  initialData: DemographicsData | null;
  onAvatarChange: (avatar: AvatarGender) => void;
  onSubmit: (data: DemographicsData) => void;
  onRetryModels?: () => void;
}

export const DemographicsLanding: React.FC<DemographicsLandingProps> = ({
  modelsLoaded,
  modelsError,
  selectedAvatar,
  initialData,
  onAvatarChange,
  onSubmit,
  onRetryModels,
}) => {
  const [name, setName] = useState(initialData?.name ?? '');
  const [age, setAge] = useState(initialData?.age ? String(initialData.age) : '');
  const [gender, setGender] = useState<GenderOption>(initialData?.gender ?? 'male');
  const [genderOther, setGenderOther] = useState(initialData?.genderOther ?? '');
  const [section, setSection] = useState(initialData?.section ?? '');
  const [consented, setConsented] = useState(initialData?.consented ?? false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSelectGender = (option: GenderOption) => {
    setGender(option);
    if (errorMsg) setErrorMsg(null);
    if (option === 'female' || option === 'male') {
      onAvatarChange(option);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAge = Number(age);
    if (!age.trim() || !Number.isFinite(parsedAge) || parsedAge < 7 || parsedAge > 99) {
      setErrorMsg('Please enter a valid age between 7 and 99.');
      return;
    }
    if (!section.trim()) {
      setErrorMsg('Please enter your course and section.');
      return;
    }
    if (gender === 'other' && !genderOther.trim()) {
      setErrorMsg('Please specify your gender in the text field.');
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
      gender,
      genderOther: gender === 'other' ? genderOther.trim().slice(0, 60) : '',
      avatar: selectedAvatar,
      section: section.trim(),
      consented: true,
      consentTimestamp: new Date().toISOString(),
    });
  };

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-start p-3 sm:p-4 lg:p-10 pointer-events-none">
      <div className="pointer-events-auto w-full max-w-[520px] landscape:max-w-[46vw] lg:landscape:max-w-[520px] max-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-2rem)] lg:max-h-[calc(100vh-3rem)] overflow-y-auto rounded-2xl bg-white shadow-xl border border-slate-200/90 p-4 sm:p-5 lg:p-8 text-slate-900">
        <div className="space-y-1 lg:space-y-2 mb-3.5 lg:mb-5">
          <p className="text-[11px] lg:text-xs font-medium text-slate-500">
            Part I · Demographic Profile · Pre (20) &amp; Post (20) Assessment
          </p>
          <h1 className="font-display text-lg sm:text-xl lg:text-3xl font-bold tracking-tight text-slate-900">
            Campus Quest Simulator
          </h1>
          <p className="text-xs lg:text-sm text-slate-600 leading-relaxed">
            Complete the respondent profile and informed consent below to begin the 20-item Pre-Simulation assessment and 3D campus Post-Simulation.
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
                Course &amp; Section <span className="text-rose-600">*</span>
              </label>
              <input
                id="demo-section"
                type="text"
                value={section}
                onChange={(e) => {
                  setSection(e.target.value);
                  if (errorMsg) setErrorMsg(null);
                }}
                placeholder="e.g. BSIT 11001"
                maxLength={60}
                required
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 lg:px-3.5 lg:py-2.5 text-xs lg:text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              />
            </div>
          </div>

          <div className="space-y-2">
            <span className="block text-xs font-semibold text-slate-700">
              Gender <span className="text-rose-600">*</span>
            </span>
            <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-slate-100 border border-slate-200">
              {(['male', 'female', 'other'] as GenderOption[]).map((option) => {
                const active = gender === option;
                const label = option === 'male' ? 'Male' : option === 'female' ? 'Female' : 'Other';
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => handleSelectGender(option)}
                    className={`flex items-center justify-center gap-1.5 rounded-lg px-2.5 py-2 lg:px-3 lg:py-2 text-xs lg:text-sm font-semibold transition-colors whitespace-nowrap ${
                      active
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-700 hover:bg-white/70 hover:text-slate-900'
                    }`}
                  >
                    {active && <Check className="w-3.5 h-3.5 shrink-0" />}
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>

            {gender === 'other' && (
              <div className="space-y-2 pt-1">
                <div>
                  <label htmlFor="demo-gender-other" className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Other (Please specify) <span className="text-rose-600">*</span>
                  </label>
                  <input
                    id="demo-gender-other"
                    type="text"
                    value={genderOther}
                    onChange={(e) => {
                      setGenderOther(e.target.value);
                      if (errorMsg) setErrorMsg(null);
                    }}
                    placeholder="Specify gender"
                    maxLength={60}
                    required
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs lg:text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                  />
                </div>

                <div className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                  <span className="text-[11px] font-semibold text-slate-600">
                    3D Character Model
                  </span>
                  <div className="flex items-center gap-1.5">
                    {(['female', 'male'] as AvatarGender[]).map((av) => (
                      <button
                        key={av}
                        type="button"
                        onClick={() => onAvatarChange(av)}
                        className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                          selectedAvatar === av
                            ? 'bg-blue-600 text-white'
                            : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {av === 'female' ? 'Female' : 'Male'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {gender !== 'other' && (
              <p className="text-[11px] lg:text-xs text-slate-500">
                Automatically assigns the {selectedAvatar} 3D character model shown in the campus preview.
              </p>
            )}
          </div>

          <div className="pt-2 border-t border-slate-200">
            <div className="flex items-center gap-2 mb-1.5 lg:mb-2">
              <FileText className="w-4 h-4 text-slate-600 shrink-0" />
              <h2 className="text-xs font-semibold text-slate-800 uppercase tracking-wide">
                Informed Consent Letter
              </h2>
            </div>
            <div className="max-h-24 lg:max-h-32 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-2.5 lg:p-3 text-xs text-slate-600 leading-relaxed space-y-2">
              <p className="font-semibold text-slate-800">
                Participant Consent for Digital Guidance Counseling Simulation Study
              </p>
              <p>
                <strong>Purpose:</strong> You are invited to participate in an interactive 3D guidance counseling simulation study evaluating ethical and scenario-based decision-making before and after simulation navigation.
              </p>
              <p>
                <strong>Procedures:</strong> After submitting your demographic profile, you will complete both the Pre-Simulation (20 items) and Post-Simulation (20 items) by guiding your 3D avatar across Room 1 through Room 4 (5 client scenarios per room in each stage).
              </p>
              <p>
                <strong>Confidentiality &amp; Voluntary Participation:</strong> Providing your name is optional. All responses, timestamps, and demographic entries are packaged under a randomly generated 6-character participant code for researcher review. Participation is voluntary and you may stop at any time.
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
                I have read the Informed Consent Letter above and voluntarily agree to participate in this study.
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
                <span>Continue to Pre-Simulation</span>
                <ArrowRight className="w-4 h-4 shrink-0" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
