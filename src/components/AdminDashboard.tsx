import React, { useEffect, useMemo, useState } from 'react';
import { User } from 'firebase/auth';
import {
  Archive,
  ArchiveRestore,
  Check,
  Copy,
  Download,
  Edit3,
  FileCode2,
  Loader2,
  Lock,
  LogIn,
  LogOut,
  Save,
  Search,
  ShieldCheck,
  X,
} from 'lucide-react';
import { CAMPUS_ROOMS } from '../data/questionnaires';
import {
  checkIsAdminUser,
  signInAdminWithGoogle,
  signOutAdmin,
  subscribeArchiveRecords,
  subscribeToAuth,
  updateArchiveRecord,
} from '../services/firebaseArchive';
import {
  ArchiveStatus,
  GenderOption,
  OptionLetter,
  QuestArchiveRecord,
  QuestionnaireAnswer,
} from '../types';
import {
  buildArchiveCohortSvg,
  buildQuestReportSvg,
  downloadSvgFile,
} from '../utils/svgReport';

interface AdminDashboardProps {
  open: boolean;
  onClose: () => void;
}

function formatDuration(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ open, onClose }) => {
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [unauthorizedDomain, setUnauthorizedDomain] = useState<string | null>(null);
  const [copiedDomain, setCopiedDomain] = useState(false);

  const [records, setRecords] = useState<QuestArchiveRecord[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [recordsError, setRecordsError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | ArchiveStatus>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [editing, setEditing] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);
  const [copiedSvg, setCopiedSvg] = useState(false);

  // Editable form state
  const [draftName, setDraftName] = useState('');
  const [draftAge, setDraftAge] = useState('18');
  const [draftSection, setDraftSection] = useState('');
  const [draftGender, setDraftGender] = useState<GenderOption>('female');
  const [draftStatus, setDraftStatus] = useState<ArchiveStatus>('active');
  const [draftNotes, setDraftNotes] = useState('');
  const [draftAnswers, setDraftAnswers] = useState<QuestionnaireAnswer[]>([]);

  const questionLookup = useMemo(() => {
    const map = new Map<string, Record<OptionLetter, string>>();
    CAMPUS_ROOMS.forEach((room) => {
      room.questions.forEach((q) => {
        map.set(q.id, q.options);
      });
    });
    return map;
  }, []);

  useEffect(() => {
    const unsub = subscribeToAuth(async (user) => {
      setAuthUser(user);
      if (user) {
        const ok = await checkIsAdminUser(user);
        setIsAdmin(ok);
      } else {
        setIsAdmin(false);
      }
      setAuthReady(true);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!open || !authReady || !isAdmin) {
      return;
    }
    setLoadingRecords(true);
    setRecordsError(null);
    const unsub = subscribeArchiveRecords(
      (list) => {
        setRecords(list);
        setLoadingRecords(false);
        setSelectedId((prev) => {
          if (prev && list.some((r) => r.id === prev)) return prev;
          return list[0]?.id ?? null;
        });
      },
      (err) => {
        setRecordsError(err.message);
        setLoadingRecords(false);
      }
    );
    return unsub;
  }, [open, authReady, isAdmin]);

  const filteredRecords = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return records.filter((r) => {
      if (statusFilter !== 'all' && r.archiveStatus !== statusFilter) return false;
      if (!q) return true;
      return (
        r.participant.toLowerCase().includes(q) ||
        r.demographics.name.toLowerCase().includes(q) ||
        r.demographics.section.toLowerCase().includes(q) ||
        r.adminNotes.toLowerCase().includes(q)
      );
    });
  }, [records, searchQuery, statusFilter]);

  const selectedRecord = useMemo(
    () => records.find((r) => r.id === selectedId) ?? filteredRecords[0] ?? null,
    [records, filteredRecords, selectedId]
  );

  useEffect(() => {
    if (!selectedRecord) {
      setEditing(false);
      return;
    }
    setDraftName(selectedRecord.demographics.name);
    setDraftAge(String(selectedRecord.demographics.age));
    setDraftSection(selectedRecord.demographics.section);
    setDraftGender(selectedRecord.demographics.gender);
    setDraftStatus(selectedRecord.archiveStatus);
    setDraftNotes(selectedRecord.adminNotes);
    setDraftAnswers(selectedRecord.answers.map((a) => ({ ...a })));
    setEditError(null);
  }, [selectedRecord]);

  const selectedSvg = useMemo(
    () => (selectedRecord ? buildQuestReportSvg(selectedRecord) : ''),
    [selectedRecord]
  );

  const selectedSvgDataUri = useMemo(
    () => (selectedSvg ? `data:image/svg+xml;utf8,${encodeURIComponent(selectedSvg)}` : ''),
    [selectedSvg]
  );

  if (!open) return null;

  const activeCount = records.filter((r) => r.archiveStatus === 'active').length;
  const archivedCount = records.filter((r) => r.archiveStatus === 'archived').length;

  const handleSignIn = async () => {
    setAuthBusy(true);
    setAuthError(null);
    setUnauthorizedDomain(null);
    try {
      await signInAdminWithGoogle();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Google Sign-In failed.';
      if (msg.includes('auth/unauthorized-domain')) {
        setUnauthorizedDomain(typeof window !== 'undefined' ? window.location.hostname : '');
      }
      setAuthError(msg);
    } finally {
      setAuthBusy(false);
    }
  };

  const handleCopyDomain = async () => {
    if (!unauthorizedDomain) return;
    try {
      await navigator.clipboard.writeText(unauthorizedDomain);
      setCopiedDomain(true);
      window.setTimeout(() => setCopiedDomain(false), 2000);
    } catch {
      // Clipboard unavailable
    }
  };

  const handleSignOut = async () => {
    setAuthBusy(true);
    try {
      await signOutAdmin();
      setRecords([]);
      setSelectedId(null);
    } finally {
      setAuthBusy(false);
    }
  };

  const handleToggleArchiveStatus = async () => {
    if (!selectedRecord || !authUser?.email) return;
    const nextStatus: ArchiveStatus =
      selectedRecord.archiveStatus === 'active' ? 'archived' : 'active';
    setSavingEdit(true);
    setEditError(null);
    try {
      await updateArchiveRecord(
        selectedRecord.id,
        {
          demographics: selectedRecord.demographics,
          character: selectedRecord.character,
          answers: selectedRecord.answers,
          archiveStatus: nextStatus,
          adminNotes: selectedRecord.adminNotes,
        },
        authUser.email
      );
      setSaveFeedback(
        nextStatus === 'archived' ? 'Moved record to Archive.' : 'Restored record to Active.'
      );
      window.setTimeout(() => setSaveFeedback(null), 2400);
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Failed to update archive status.');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord || !authUser?.email) return;

    const parsedAge = Number(draftAge);
    if (!Number.isFinite(parsedAge) || parsedAge < 7 || parsedAge > 99) {
      setEditError('Age must be between 7 and 99.');
      return;
    }
    if (!draftSection.trim()) {
      setEditError('Section cannot be empty.');
      return;
    }

    setSavingEdit(true);
    setEditError(null);
    try {
      await updateArchiveRecord(
        selectedRecord.id,
        {
          demographics: {
            ...selectedRecord.demographics,
            name: draftName.trim().slice(0, 80),
            age: Math.round(parsedAge),
            gender: draftGender,
            section: draftSection.trim().slice(0, 60),
          },
          character: draftGender,
          answers: draftAnswers,
          archiveStatus: draftStatus,
          adminNotes: draftNotes.trim().slice(0, 1000),
        },
        authUser.email
      );
      setEditing(false);
      setSaveFeedback('Changes saved to archive.');
      window.setTimeout(() => setSaveFeedback(null), 2400);
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Failed to save record edits.');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleCopySvg = async () => {
    if (!selectedSvg) return;
    try {
      await navigator.clipboard.writeText(selectedSvg);
      setCopiedSvg(true);
      window.setTimeout(() => setCopiedSvg(false), 2000);
    } catch {
      // Clipboard unavailable
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/75 p-3 sm:p-5">
      <div className="w-full max-w-6xl h-[calc(100vh-1.5rem)] sm:h-[calc(100vh-2.5rem)] flex flex-col rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden text-slate-900">
        {/* Top Bar */}
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-900 px-5 py-3.5 text-white shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-9 w-9 rounded-xl bg-blue-600 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-display text-base sm:text-lg font-bold tracking-tight">
                  Admin Data Archive
                </h2>
                <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/15 border border-amber-400/30 px-2 py-0.5 text-[10.5px] font-semibold text-amber-200">
                  <Lock className="w-3 h-3" />
                  <span>No-Delete Policy</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-300 truncate">
                {isAdmin && authUser?.email
                  ? `Signed in as ${authUser.email} · Archive, Edit & Export SVG`
                  : 'Authorized Researcher Access Only · Archive, Edit & SVG Export'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAdmin && filteredRecords.length > 0 && (
              <button
                type="button"
                onClick={() =>
                  downloadSvgFile(
                    buildArchiveCohortSvg(filteredRecords),
                    `campus-quest-cohort-${new Date().toISOString().slice(0, 10)}.svg`
                  )
                }
                className="flex items-center gap-1.5 rounded-lg bg-slate-800 border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-100 hover:bg-slate-700 transition-colors whitespace-nowrap"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Cohort SVG ({filteredRecords.length})</span>
              </button>
            )}
            {authUser && (
              <button
                type="button"
                onClick={handleSignOut}
                disabled={authBusy}
                className="flex items-center gap-1.5 rounded-lg bg-slate-800 border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-colors whitespace-nowrap"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close Admin Dashboard"
              className="h-8 w-8 flex items-center justify-center rounded-lg bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Auth Gate */}
        {!authReady ? (
          <div className="flex-1 flex items-center justify-center p-8 text-slate-500 gap-2 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Checking administrator session…</span>
          </div>
        ) : !authUser ? (
          <div className="flex-1 flex items-center justify-center p-6 bg-slate-50">
            <div className="w-full max-w-md rounded-2xl bg-white border border-slate-200 shadow-sm p-6 text-center space-y-4">
              <div className="mx-auto h-12 w-12 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700">
                <Lock className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <h3 className="font-display text-xl font-bold text-slate-900">
                  Administrator Sign-In Required
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Only the authorized researcher account can inspect archived sessions, edit participant records, or download SVG reports.
                </p>
              </div>
              {authError && (
                <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs text-rose-700 text-left space-y-2">
                  <p className="font-semibold">{authError}</p>
                  {unauthorizedDomain && (
                    <div className="rounded-md bg-white border border-rose-200 p-2.5 text-[11px] text-slate-700 space-y-1.5">
                      <p>
                        External hosting domains (like Vercel) must be allowlisted in{' '}
                        <strong>Firebase Console → Authentication → Settings → Authorized domains</strong>:
                      </p>
                      <div className="flex items-center justify-between gap-2 rounded bg-slate-100 px-2 py-1">
                        <code className="font-mono-tabular font-semibold text-slate-900 truncate">
                          {unauthorizedDomain}
                        </code>
                        <button
                          type="button"
                          onClick={handleCopyDomain}
                          className="inline-flex items-center gap-1 rounded bg-white border border-slate-300 px-2 py-0.5 text-[10.5px] font-semibold text-slate-700 hover:bg-slate-50 shrink-0"
                        >
                          {copiedDomain ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                          <span>{copiedDomain ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
              <button
                type="button"
                onClick={handleSignIn}
                disabled={authBusy}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 transition-colors"
              >
                {authBusy ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <LogIn className="w-4 h-4" />
                )}
                <span>Sign in with Google</span>
              </button>
            </div>
          </div>
        ) : !isAdmin ? (
          <div className="flex-1 flex items-center justify-center p-6 bg-slate-50">
            <div className="w-full max-w-md rounded-2xl bg-white border border-rose-200 shadow-sm p-6 text-center space-y-4">
              <h3 className="font-display text-lg font-bold text-slate-900">
                Access Restricted
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Signed in as <strong className="text-slate-900">{authUser.email}</strong>, which does not have administrator archive permissions.
              </p>
              <button
                type="button"
                onClick={handleSignOut}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Switch Google Account</span>
              </button>
            </div>
          </div>
        ) : (
          /* Main Admin Workspace */
          <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[320px_1fr] bg-slate-50">
            {/* Left Sidebar: Archive Records List */}
            <aside className="border-b lg:border-b-0 lg:border-r border-slate-200 bg-white flex flex-col min-h-0 max-h-72 lg:max-h-none">
              <div className="p-3.5 border-b border-slate-200 space-y-2.5">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search code, name, section…"
                    className="w-full rounded-lg border border-slate-300 bg-slate-50 pl-9 pr-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-3 gap-1 p-1 rounded-lg bg-slate-100 border border-slate-200 text-[11px] font-semibold">
                  {(
                    [
                      ['all', `All (${records.length})`],
                      ['active', `Active (${activeCount})`],
                      ['archived', `Archived (${archivedCount})`],
                    ] as const
                  ).map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setStatusFilter(key)}
                      className={`rounded-md py-1.5 px-1 transition-colors whitespace-nowrap ${
                        statusFilter === key
                          ? 'bg-white text-slate-900 shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                {loadingRecords ? (
                  <div className="p-6 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Loading archived sessions…</span>
                  </div>
                ) : recordsError ? (
                  <div className="p-4 text-xs text-rose-700 bg-rose-50 m-3 rounded-lg border border-rose-200 break-words">
                    {recordsError}
                  </div>
                ) : filteredRecords.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500">
                    No session records match this filter.
                  </div>
                ) : (
                  filteredRecords.map((rec) => {
                    const active = selectedRecord?.id === rec.id;
                    return (
                      <button
                        key={rec.id}
                        type="button"
                        onClick={() => {
                          setSelectedId(rec.id);
                          setEditing(false);
                        }}
                        className={`w-full text-left px-4 py-3 transition-colors ${
                          active ? 'bg-blue-50 border-l-4 border-l-blue-600' : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="font-mono-tabular text-xs font-bold text-blue-700">
                            {rec.participant}
                          </span>
                          <span
                            className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                              rec.archiveStatus === 'archived'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {rec.archiveStatus}
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-slate-900 truncate">
                          {rec.demographics.name || 'Anonymous'} · {rec.demographics.section}
                        </p>
                        <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                          <span>
                            {formatDuration(rec.durationMs)} · {rec.distance}m
                          </span>
                          <span>{new Date(rec.createdAtMs).toLocaleDateString()}</span>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </aside>

            {/* Right Pane: Inspector, Edit Form & SVG Download */}
            <main className="flex-1 overflow-y-auto p-4 sm:p-6">
              {!selectedRecord ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-500">
                  <FileCode2 className="w-10 h-10 text-slate-300 mb-3" />
                  <p className="text-sm font-semibold text-slate-700">No Participant Record Selected</p>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm">
                    Completed simulator sessions appear here automatically for archiving, editing, and SVG export.
                  </p>
                </div>
              ) : (
                <div className="space-y-5 max-w-4xl mx-auto">
                  {/* Action Header */}
                  <div className="rounded-2xl bg-white border border-slate-200 p-4 sm:p-5 shadow-sm flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono-tabular text-lg font-bold text-blue-700">
                          {selectedRecord.participant}
                        </span>
                        <span
                          className={`rounded-md px-2 py-0.5 text-[11px] font-bold uppercase ${
                            selectedRecord.archiveStatus === 'archived'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {selectedRecord.archiveStatus}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Recorded {new Date(selectedRecord.createdAtMs).toLocaleString()}
                        {selectedRecord.editedBy ? ` · Last edited by ${selectedRecord.editedBy}` : ''}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={handleToggleArchiveStatus}
                        disabled={savingEdit}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap"
                      >
                        {selectedRecord.archiveStatus === 'active' ? (
                          <>
                            <Archive className="w-3.5 h-3.5 text-amber-600" />
                            <span>Archive</span>
                          </>
                        ) : (
                          <>
                            <ArchiveRestore className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Unarchive</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setEditing((v) => !v);
                          setEditError(null);
                        }}
                        className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors whitespace-nowrap ${
                          editing
                            ? 'border-slate-900 bg-slate-900 text-white'
                            : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>{editing ? 'Close Editor' : 'Edit Record'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleCopySvg}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap"
                      >
                        {copiedSvg ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                        <span>{copiedSvg ? 'Copied SVG' : 'Copy SVG'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          downloadSvgFile(
                            selectedSvg,
                            `campus-quest-${selectedRecord.participant}.svg`
                          )
                        }
                        className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition-colors whitespace-nowrap"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download SVG</span>
                      </button>
                    </div>
                  </div>

                  {saveFeedback && (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-semibold text-emerald-800">
                      {saveFeedback}
                    </div>
                  )}

                  {editError && (
                    <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-semibold text-rose-700">
                      {editError}
                    </div>
                  )}

                  {/* Edit Form */}
                  {editing && (
                    <form
                      onSubmit={handleSaveEdit}
                      className="rounded-2xl bg-white border border-blue-200 p-5 shadow-sm space-y-4"
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-slate-900">
                          Edit Archived Session Record
                        </h3>
                        <span className="text-[11px] text-slate-500">
                          Deletion disabled by archive policy
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                            Participant Name
                          </label>
                          <input
                            type="text"
                            value={draftName}
                            maxLength={80}
                            onChange={(e) => setDraftName(e.target.value)}
                            placeholder="Blank = Anonymous"
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                            Age (7–99)
                          </label>
                          <input
                            type="number"
                            min={7}
                            max={99}
                            value={draftAge}
                            onChange={(e) => setDraftAge(e.target.value)}
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-mono-tabular focus:border-blue-600 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                            Section
                          </label>
                          <input
                            type="text"
                            value={draftSection}
                            maxLength={60}
                            onChange={(e) => setDraftSection(e.target.value)}
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                            Gender / Avatar Model
                          </label>
                          <select
                            value={draftGender}
                            onChange={(e) => setDraftGender(e.target.value as GenderOption)}
                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs focus:border-blue-600 focus:outline-none"
                          >
                            <option value="female">Female</option>
                            <option value="male">Male</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                            Archive Status
                          </label>
                          <select
                            value={draftStatus}
                            onChange={(e) => setDraftStatus(e.target.value as ArchiveStatus)}
                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs focus:border-blue-600 focus:outline-none"
                          >
                            <option value="active">Active</option>
                            <option value="archived">Archived</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Researcher / Admin Notes
                        </label>
                        <textarea
                          rows={2}
                          maxLength={1000}
                          value={draftNotes}
                          onChange={(e) => setDraftNotes(e.target.value)}
                          placeholder="Add notes for this archived record…"
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-none"
                        />
                      </div>

                      <div>
                        <p className="text-[11px] font-semibold text-slate-600 mb-2">
                          Edit Questionnaire Answers ({draftAnswers.length})
                        </p>
                        <div className="max-h-56 overflow-y-auto rounded-xl border border-slate-200 divide-y divide-slate-100">
                          {draftAnswers.map((ans, idx) => {
                            const opts = questionLookup.get(ans.questionId);
                            return (
                              <div
                                key={ans.questionId}
                                className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-3 py-2 text-xs bg-slate-50/50"
                              >
                                <div className="min-w-0">
                                  <span className="font-semibold text-slate-900">
                                    {ans.roomName} · {ans.patientName}
                                  </span>
                                  <p className="text-[11px] text-slate-500 truncate">
                                    {ans.selectedText}
                                  </p>
                                </div>
                                <select
                                  value={ans.selectedOption}
                                  onChange={(e) => {
                                    const letter = e.target.value as OptionLetter;
                                    const updatedText = opts?.[letter] ?? ans.selectedText;
                                    setDraftAnswers((prev) =>
                                      prev.map((item, i) =>
                                        i === idx
                                          ? {
                                              ...item,
                                              selectedOption: letter,
                                              selectedText: updatedText,
                                            }
                                          : item
                                      )
                                    );
                                  }}
                                  className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-blue-700 shrink-0"
                                >
                                  {(['A', 'B', 'C', 'D'] as OptionLetter[]).map((opt) => (
                                    <option key={opt} value={opt}>
                                      Option {opt}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setEditing(false)}
                          className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={savingEdit}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                        >
                          {savingEdit ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Save className="w-3.5 h-3.5" />
                          )}
                          <span>Save Changes</span>
                        </button>
                      </div>
                    </form>
                  )}

                  {/* SVG Report Preview */}
                  <div className="rounded-2xl bg-white border border-slate-200 p-4 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold uppercase tracking-wide text-slate-600">
                        Generated SVG Report Preview
                      </h3>
                      <span className="text-[11px] text-slate-400">
                        Includes Spatial Trajectory Map &amp; 20 Responses
                      </span>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-100 p-2 overflow-hidden">
                      <img
                        src={selectedSvgDataUri}
                        alt={`SVG report preview for participant ${selectedRecord.participant}`}
                        className="w-full h-auto rounded-lg"
                      />
                    </div>
                  </div>
                </div>
              )}
            </main>
          </div>
        )}
      </div>
    </div>
  );
};
