import React, { useState, useMemo, useEffect } from 'react';
import {
  Building2,
  Zap,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Calendar,
  Send,
  MessageSquare,
  Shield,
  ChevronDown,
  Layers,
  ArrowRight,
  User,
  CheckCircle,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatUnits } from '../../lib/calculations';
import { UserRole } from '../../types';

export const BlockDepartmentPortal: React.FC = () => {
  const {
    currentRole,
    setCurrentRole,
    currentUser,
    sections,
    readings,
    enquiries,
    replyToEnquiry,
  } = useApp();

  const [time, setTime] = useState(new Date());
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [activeReplyEnquiryId, setActiveReplyEnquiryId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Map role to section
  const section = useMemo(() => {
    const nameMap: Record<string, string[]> = {
      block_a: ['A Block', 'SEC-A-BLK'],
      block_b: ['B Block', 'SEC-B-BLK'],
      block_c: ['C Block', 'SEC-C-BLK'],
      block_d: ['D Block', 'SEC-D-BLK'],
      block_eg: ['E & G', 'E & G Block', 'SEC-EG-BLK'],
      block_f: ['F Block', 'SEC-F-BLK'],
    };

    const targetNames = nameMap[currentRole] || ['A Block'];
    return (
      sections.find((s) =>
        targetNames.some(
          (tn) => s.name.toLowerCase() === tn.toLowerCase() || s.code.toLowerCase() === tn.toLowerCase()
        )
      ) || sections[0]
    );
  }, [currentRole, sections]);

  // Compute today's consumption for this block
  const blockMetrics = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    let effectiveDate = today;
    const todayReadings = readings.filter((r) => r.date === today && r.sectionId === section.id);

    let consumedKwh = todayReadings.reduce((sum, r) => sum + r.consumedKwh, 0);

    if (todayReadings.length === 0 && readings.length > 0) {
      const sortedDates = Array.from(new Set(readings.map((r) => r.date))).sort().reverse();
      effectiveDate = sortedDates[0];
      const effReadings = readings.filter(
        (r) => r.date === effectiveDate && r.sectionId === section.id
      );
      consumedKwh = effReadings.reduce((sum, r) => sum + r.consumedKwh, 0);
    }

    const limitKwh = section.dailyLimitKwh || 2800;
    const isExceeded = consumedKwh > limitKwh;
    const excessKwh = isExceeded ? Number((consumedKwh - limitKwh).toFixed(1)) : 0;
    const excessPct = isExceeded ? Number(((excessKwh / limitKwh) * 100).toFixed(1)) : 0;
    const pctUsed = Number(((consumedKwh / limitKwh) * 100).toFixed(1));

    return {
      date: effectiveDate,
      consumedKwh: Number(consumedKwh.toFixed(1)),
      limitKwh,
      isExceeded,
      excessKwh,
      excessPct,
      pctUsed,
    };
  }, [section, readings]);

  // Filter enquiries relevant to this block
  const blockEnquiries = useMemo(() => {
    return enquiries.filter(
      (e) =>
        e.sectionId === section.id ||
        e.sectionName.toLowerCase() === section.name.toLowerCase() ||
        e.targetRole === currentRole
    );
  }, [enquiries, section, currentRole]);

  const pendingEnquiries = blockEnquiries.filter((e) => e.status !== 'resolved');
  const resolvedEnquiries = blockEnquiries.filter((e) => e.status === 'resolved');

  const handleReplySubmit = async (enquiryId: string) => {
    if (!replyText.trim()) return;
    setIsSubmitting(true);
    try {
      await replyToEnquiry(enquiryId, replyText.trim());
      setReplyText('');
      setActiveReplyEnquiryId(null);
      setSubmittedSuccess(true);
      setTimeout(() => setSubmittedSuccess(false), 4000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const roleLabels: Record<UserRole, { label: string; badge: string; color: string }> = {
    block_a: { label: 'A Block In-Charge', badge: 'Sub-ID', color: 'bg-blue-100 text-blue-800 border-blue-300' },
    block_b: { label: 'B Block In-Charge', badge: 'Sub-ID', color: 'bg-indigo-100 text-indigo-800 border-indigo-300' },
    block_c: { label: 'C Block In-Charge', badge: 'Sub-ID', color: 'bg-cyan-100 text-cyan-800 border-cyan-300' },
    block_d: { label: 'D Block In-Charge', badge: 'Sub-ID', color: 'bg-teal-100 text-teal-800 border-teal-300' },
    block_eg: { label: 'E & G Block In-Charge', badge: 'Sub-ID', color: 'bg-amber-100 text-amber-800 border-amber-300' },
    block_f: { label: 'F Block In-Charge', badge: 'Sub-ID', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
    plant_admin: { label: 'Plant Admin', badge: 'Head of Factory', color: 'bg-purple-100 text-purple-800 border-purple-300' },
    electrical_admin: { label: 'Electrical Admin', badge: 'Chief Electrical Eng.', color: 'bg-amber-100 text-amber-800 border-amber-300' },
    reading_operator: { label: 'Reading Operator', badge: 'Shift Entry', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
    viewer: { label: 'Viewer', badge: 'Read-Only MIS', color: 'bg-blue-100 text-blue-800 border-blue-300' },
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col font-sans antialiased selection:bg-blue-500/20 selection:text-blue-900">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 lg:px-8 py-3 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/20 text-white shrink-0">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base sm:text-lg tracking-tight text-slate-900">
                  SMRUTHI ORGANICS LIMITED
                </span>
                <span className="px-2 py-0.5 text-[11px] font-bold rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                  {section.name}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Manufacturing Department Sub-ID Portal • {currentUser.fullName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Live Clock & Shift Badge */}
            <div className="hidden md:flex items-center gap-3 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-medium">
                  {time.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
              </div>
              <div className="w-px h-3.5 bg-slate-200" />
              <div className="flex items-center gap-1.5 font-mono text-blue-700 font-semibold">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                <span>
                  {time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </div>
            </div>

            {/* Role Switcher */}
            <div className="relative">
              <button
                onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-sm ${roleLabels[currentRole].color}`}
              >
                <Shield className="w-3.5 h-3.5" />
                <div className="text-left hidden sm:block">
                  <span className="block leading-tight">{roleLabels[currentRole].label}</span>
                  <span className="text-[10px] opacity-75 font-normal">{roleLabels[currentRole].badge}</span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 ml-1 opacity-70" />
              </button>

              {roleDropdownOpen && (
                <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-white border border-slate-200 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-100 max-h-[460px] overflow-y-auto">
                  <div className="px-3 py-2 border-b border-slate-100 mb-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Switch User Role
                    </p>
                    <p className="text-xs text-slate-800 font-bold truncate mt-0.5">{currentUser.fullName}</p>
                  </div>

                  <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Core Plant Executives
                  </div>
                  <div className="space-y-0.5 mb-2">
                    {(['plant_admin', 'electrical_admin', 'reading_operator', 'viewer'] as UserRole[]).map((r) => (
                      <button
                        key={r}
                        onClick={() => {
                          setCurrentRole(r);
                          setRoleDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-bold transition-colors text-left ${
                          currentRole === r
                            ? 'bg-purple-50 text-purple-800 border border-purple-200'
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div>
                          <div>{roleLabels[r].label}</div>
                          <div className="text-[10px] text-slate-400 font-normal">{roleLabels[r].badge}</div>
                        </div>
                        {currentRole === r && <CheckCircle className="w-3.5 h-3.5 text-purple-600" />}
                      </button>
                    ))}
                  </div>

                  <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-t border-slate-100 pt-1.5">
                    Production Block Sub-IDs (Department In-Charges)
                  </div>
                  <div className="space-y-0.5">
                    {(['block_a', 'block_b', 'block_c', 'block_d', 'block_eg', 'block_f'] as UserRole[]).map((r) => (
                      <button
                        key={r}
                        onClick={() => {
                          setCurrentRole(r);
                          setRoleDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-bold transition-colors text-left ${
                          currentRole === r
                            ? 'bg-blue-50 text-blue-800 border border-blue-200'
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div>
                          <div>{roleLabels[r].label}</div>
                          <div className="text-[10px] text-slate-400 font-normal">{roleLabels[r].badge}</div>
                        </div>
                        {currentRole === r && <CheckCircle className="w-3.5 h-3.5 text-blue-600" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-4 lg:p-8 max-w-6xl mx-auto w-full space-y-6">
        {/* Success toast after answering enquiry */}
        {submittedSuccess && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 flex items-center gap-2 font-bold text-xs shadow-sm animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Your departmental response has been officially delivered to the Plant Admin!</span>
          </div>
        )}

        {/* Status Header Banner */}
        <div
          className={`rounded-2xl p-6 border shadow-sm transition-all ${
            blockMetrics.isExceeded
              ? 'bg-red-50/70 border-red-300 ring-2 ring-red-400/20'
              : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                  {section.code}
                </span>
                <h1 className="text-xl lg:text-2xl font-black text-slate-900 tracking-tight">
                  {section.name} Production Block
                </h1>
              </div>
              <p className="text-xs text-slate-500 mt-1 max-w-xl">{section.description}</p>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5 border shadow-sm ${
                  blockMetrics.isExceeded
                    ? 'bg-red-600 text-white border-red-700 animate-pulse'
                    : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                }`}
              >
                {blockMetrics.isExceeded ? (
                  <>
                    <AlertTriangle className="w-4 h-4" />
                    <span>DAILY LIMIT EXCEEDED (+{blockMetrics.excessPct}%)</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Operating Within Normal Limit</span>
                  </>
                )}
              </span>
            </div>
          </div>

          {/* 3 Metrics Cards inside Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-5 border-t border-slate-200/80">
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
              <span className="text-[11px] font-bold text-slate-500 uppercase">Today's Consumption</span>
              <div className="text-2xl font-black font-mono text-slate-900 mt-1">
                {formatUnits(blockMetrics.consumedKwh)}{' '}
                <span className="text-sm font-normal text-slate-500">kWh</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-1">Log Date: {blockMetrics.date}</div>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
              <span className="text-[11px] font-bold text-slate-500 uppercase">Configured Daily Limit</span>
              <div className="text-2xl font-black font-mono text-slate-900 mt-1">
                {formatUnits(blockMetrics.limitKwh)}{' '}
                <span className="text-sm font-normal text-slate-500">kWh</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-1">Set by Electrical Admin</div>
            </div>

            <div
              className={`p-4 rounded-xl border shadow-sm ${
                blockMetrics.isExceeded ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'
              }`}
            >
              <span className="text-[11px] font-bold text-slate-500 uppercase">Threshold Status</span>
              <div
                className={`text-2xl font-black font-mono mt-1 ${
                  blockMetrics.isExceeded ? 'text-red-700' : 'text-emerald-700'
                }`}
              >
                {blockMetrics.isExceeded
                  ? `+${formatUnits(blockMetrics.excessKwh)} kWh`
                  : `${blockMetrics.pctUsed}% of limit`}
              </div>
              <div className="text-[10px] text-slate-500 mt-1">
                {blockMetrics.isExceeded
                  ? 'Limit Breached — Plant Admin Inquiry Active'
                  : 'Power consumption normal'}
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-4">
            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  blockMetrics.isExceeded ? 'bg-red-600' : 'bg-emerald-600'
                }`}
                style={{ width: `${Math.min(100, blockMetrics.pctUsed)}%` }}
              />
            </div>
          </div>
        </div>

        {/* 2. Plant Admin Inquiries Section (Core Requirement 5) */}
        <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-purple-600" />
              <div>
                <h2 className="text-base font-extrabold text-slate-900">
                  Plant Admin Executive Inquiries ({blockEnquiries.length})
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  When consumption exceeds daily limit, Plant Admin sends inquiries here for departmental answers.
                </p>
              </div>
            </div>

            {pendingEnquiries.length > 0 && (
              <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-red-600 text-white animate-pulse">
                {pendingEnquiries.length} Action Required
              </span>
            )}
          </div>

          {blockEnquiries.length === 0 ? (
            <div className="text-center py-10 text-xs text-slate-500">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="font-bold text-slate-700">No Inquiries Received from Plant Admin</p>
              <p className="text-slate-400 mt-1">
                When your block exceeds its daily threshold limit, inquiries from the factory head will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {blockEnquiries.map((enq) => {
                const isResolved = enq.status === 'resolved';
                const isReplying = activeReplyEnquiryId === enq.id;

                return (
                  <div
                    key={enq.id}
                    className={`rounded-2xl p-5 border transition-all ${
                      isResolved
                        ? 'bg-slate-50 border-slate-200'
                        : 'bg-red-50/50 border-red-300 ring-1 ring-red-400/20'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200/80">
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                              isResolved
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : 'bg-red-600 text-white'
                            }`}
                          >
                            {isResolved ? '✓ Response Submitted' : '🚨 Action Required'}
                          </span>
                          <h3 className="font-extrabold text-sm text-slate-900">{enq.subject}</h3>
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          From: <strong className="text-slate-700">{enq.sentBy}</strong> (Plant Operations) • Date:{' '}
                          <span className="font-mono">{enq.date}</span>
                        </div>
                      </div>

                      <div className="text-xs font-mono font-bold text-red-600">
                        Exceeded: +{formatUnits(enq.exceededKwh)} kWh
                      </div>
                    </div>

                    {/* Plant Admin's Message */}
                    <div className="mt-3 p-3.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 whitespace-pre-line leading-relaxed font-sans">
                      {enq.message}
                    </div>

                    {/* If Resolved, show the submitted answer */}
                    {isResolved && enq.replyMessage && (
                      <div className="mt-3 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs space-y-1">
                        <div className="flex items-center justify-between text-emerald-800 font-bold">
                          <span>Department Response Submitted by {enq.repliedBy || currentUser.fullName}:</span>
                          <span className="text-[10px] text-emerald-600 font-mono">
                            {enq.repliedAt?.slice(0, 10)}
                          </span>
                        </div>
                        <p className="text-emerald-950 whitespace-pre-line leading-relaxed">{enq.replyMessage}</p>
                      </div>
                    )}

                    {/* If Pending, provide direct Answer form */}
                    {!isResolved && (
                      <div className="mt-3 pt-3 border-t border-red-200/60">
                        {!isReplying ? (
                          <div className="flex justify-end">
                            <button
                              onClick={() => {
                                setActiveReplyEnquiryId(enq.id);
                                setReplyText(
                                  `Dear Plant Admin,\n\nRegarding the consumption breach in ${section.name}:\nDuring this shift, batch processing required extended reactor heating and reflux pump operation. Equipment is operating within safe mechanical limits.\n\nRegards,\n${currentUser.fullName}`
                                );
                              }}
                              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md shadow-red-600/20 transition-all cursor-pointer"
                            >
                              <Send className="w-3.5 h-3.5" />
                              <span>Answer Plant Admin Inquiry</span>
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-3 bg-white p-4 rounded-xl border border-red-200">
                            <label className="block text-xs font-bold text-slate-700">
                              Enter Department Explanation for Plant Admin:
                            </label>
                            <textarea
                              rows={4}
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              placeholder="Provide technical reason for limit breach (e.g. equipment cycle, motor overload, continuous reflux)..."
                              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 font-medium focus:outline-none focus:border-blue-500 resize-none font-sans"
                            />
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => setActiveReplyEnquiryId(null)}
                                className="px-3.5 py-1.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                disabled={isSubmitting}
                                onClick={() => handleReplySubmit(enq.id)}
                                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                              >
                                <Send className="w-3.5 h-3.5" />
                                <span>{isSubmitting ? 'Submitting...' : 'Submit Official Explanation'}</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 3. Attached Feeder Meters Directory */}
        <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-blue-600" />
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Attached Feeder Meters for {section.name} ({section.meters.length})
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Electrical submeters connected to this block MCC panel with active Multiplying Factors (MF).
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {section.meters.map((mtr) => (
              <div
                key={mtr.id}
                className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between"
              >
                <div>
                  <div className="font-extrabold text-sm text-slate-900">{mtr.meterName}</div>
                  <div className="text-xs text-slate-500 font-mono mt-0.5">
                    Code: <strong className="text-slate-700">{mtr.meterCode}</strong> • {mtr.meterType}
                  </div>
                  {mtr.notes && <div className="text-[11px] text-slate-400 mt-1">{mtr.notes}</div>}
                </div>
                <div className="text-right font-mono text-xs">
                  <div className="font-extrabold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    KWH MF: &times;{mtr.kwhMf}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">KVAH: &times;{mtr.kvahMf}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};
