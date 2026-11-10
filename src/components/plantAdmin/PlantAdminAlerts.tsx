import React, { useState } from 'react';
import {
  AlertTriangle,
  Mail,
  CheckCircle2,
  Clock,
  Layers,
  MessageSquare,
  Send,
  Building2,
  CheckCircle,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatUnits } from '../../lib/calculations';
import { UserRole } from '../../types';

export const PlantAdminAlerts: React.FC = () => {
  const { alerts, enquiries, sendEnquiry, currentUser, sections } = useApp();

  const [activeTab, setActiveTab] = useState<'alerts' | 'enquiries'>('alerts');
  const [isComposeOpen, setIsComposeOpen] = useState(false);

  // Compose form states
  const [selectedSectionId, setSelectedSectionId] = useState(sections[0]?.id || '');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const activeAlerts = alerts.filter((a) => a.status === 'active');
  const pendingEnquiries = enquiries.filter((e) => e.status !== 'resolved');

  // Map section to target sub-id or electrical admin
  const getTargetForSection = (secName: string) => {
    const sName = secName.toLowerCase().trim();
    const map: Record<string, { role: UserRole; name: string; email: string }> = {
      'a block': { role: 'block_a', name: 'Sanjay Deshmukh (A Block In-Charge)', email: 'block-a@smruthi-organics.com' },
      'b block': { role: 'block_b', name: 'Anil Kulkarni (B Block In-Charge)', email: 'block-b@smruthi-organics.com' },
      'c block': { role: 'block_c', name: 'Prakash Shinde (C Block In-Charge)', email: 'block-c@smruthi-organics.com' },
      'd block': { role: 'block_d', name: 'Mahesh Jadhav (D Block In-Charge)', email: 'block-d@smruthi-organics.com' },
      'e & g': { role: 'block_eg', name: 'Sunil Chavan (E & G Block In-Charge)', email: 'block-eg@smruthi-organics.com' },
      'e & g block': { role: 'block_eg', name: 'Sunil Chavan (E & G Block In-Charge)', email: 'block-eg@smruthi-organics.com' },
      'f block': { role: 'block_f', name: 'Vikas Gaikwad (F Block In-Charge)', email: 'block-f@smruthi-organics.com' },
    };

    return map[sName] || {
      role: 'electrical_admin' as UserRole,
      name: 'Er. Rajesh K. More (Electrical Admin / Chief)',
      email: 'electrical.hod@smruthi-organics.com',
    };
  };

  const handleComposeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;

    setIsSending(true);
    const sec = sections.find((s) => s.id === selectedSectionId) || sections[0];
    const target = getTargetForSection(sec.name);

    try {
      await sendEnquiry({
        sectionId: sec.id,
        sectionName: sec.name,
        date: new Date().toISOString().split('T')[0],
        consumedKwh: sec.dailyLimitKwh * 1.12,
        limitKwh: sec.dailyLimitKwh,
        exceededKwh: Number((sec.dailyLimitKwh * 0.12).toFixed(1)),
        subject,
        message,
        sentBy: currentUser.fullName,
        sentByEmail: currentUser.email,
        sentTo: target.name,
        sentToEmail: target.email,
        targetRole: target.role,
      });
      setIsComposeOpen(false);
      setSubject('');
      setMessage('');
      setActiveTab('enquiries');
    } finally {
      setIsSending(false);
    }
  };

  const selectedSecObj = sections.find((s) => s.id === selectedSectionId) || sections[0];
  const currentComposeTarget = selectedSecObj ? getTargetForSection(selectedSecObj.name) : null;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-red-50 text-red-600 border border-red-200">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
              Limit Breach Alerts & Department Inquiries Center
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit log of section limit violations and executive inquiries sent to Block Sub-IDs (A, B, C, D, E&G, F Blocks) and Electrical Section.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsComposeOpen(!isComposeOpen)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-sm transition-colors cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Raise Department Inquiry</span>
          </button>
        </div>
      </div>

      {/* Compose Inquiry Drawer / Modal */}
      {isComposeOpen && (
        <div className="rounded-2xl bg-white border-2 border-purple-200 p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-purple-600" />
              <span>Raise Executive Inquiry for Departmental Response</span>
            </div>
            <button
              onClick={() => setIsComposeOpen(false)}
              className="text-slate-400 hover:text-slate-600 font-bold text-xs"
            >
              Cancel
            </button>
          </div>

          <form onSubmit={handleComposeSubmit} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Select Department Section:
                </label>
                <select
                  value={selectedSectionId}
                  onChange={(e) => {
                    setSelectedSectionId(e.target.value);
                    const chosen = sections.find((s) => s.id === e.target.value);
                    if (chosen) {
                      setSubject(`[URGENT] Consumption Limit Breach: ${chosen.name}`);
                    }
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 font-bold bg-white text-xs focus:outline-none focus:border-purple-500"
                >
                  {sections.map((sec) => (
                    <option key={sec.id} value={sec.id}>
                      {sec.name} ({sec.code}) — Limit: {formatUnits(sec.dailyLimitKwh)} kWh
                    </option>
                  ))}
                </select>
              </div>

              {currentComposeTarget && (
                <div className="p-3 rounded-xl bg-purple-50 border border-purple-200 text-xs">
                  <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider block">
                    Designated Responder (Sub-ID):
                  </span>
                  <div className="font-extrabold text-purple-950 mt-0.5">
                    {currentComposeTarget.name}
                  </div>
                  <div className="text-[11px] font-mono text-purple-600">{currentComposeTarget.email}</div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Subject:</label>
              <input
                type="text"
                required
                placeholder="e.g. [URGENT] Consumption Limit Breach: A Block"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 font-semibold bg-white text-xs focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Executive Inquiry Message:
              </label>
              <textarea
                required
                rows={4}
                placeholder="Describe the inquiry regarding high power consumption, reactor operations, pump running hours..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 font-medium bg-white text-xs focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsComposeOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSending}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-600/20"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSending ? 'Sending...' : 'Dispatch Inquiry'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('alerts')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'alerts'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          <span>Section Limit Breaches</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-red-500 text-white font-mono">
            {activeAlerts.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('enquiries')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'enquiries'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Department Inquiries & Sub-ID Answers</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-white text-purple-700 font-bold font-mono">
            {enquiries.length}
          </span>
        </button>
      </div>

      {/* Tab 1: Section Limit Breaches */}
      {activeTab === 'alerts' && (
        <div className="space-y-3">
          {alerts.length === 0 ? (
            <div className="text-center py-12 rounded-2xl bg-white border border-slate-200 p-6 text-slate-500 text-xs">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="font-bold text-slate-700">All 21 Plant Sections are Operating Within Normal Limits</p>
              <p className="text-slate-400 mt-1">No threshold breaches currently logged.</p>
            </div>
          ) : (
            alerts.map((al) => {
              const isActive = al.status === 'active';
              return (
                <div
                  key={al.id}
                  className={`rounded-2xl p-4 border transition-all ${
                    isActive
                      ? 'bg-red-50/60 border-red-300 shadow-sm'
                      : 'bg-white border-slate-200 opacity-80'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                          isActive
                            ? 'bg-red-600 text-white'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        {isActive ? '🚨 Limit Breached' : 'Resolved'}
                      </span>
                      <h4 className="font-extrabold text-sm text-slate-900">{al.sectionName}</h4>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{al.date}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-2.5 rounded-xl bg-white/80 border border-slate-200 text-xs font-mono mb-2">
                    <div>
                      <span className="text-[10px] text-slate-500 font-sans block">Consumed:</span>
                      <span className="font-bold text-slate-900">{formatUnits(al.consumedKwh)} kWh</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-sans block">Configured Limit:</span>
                      <span className="font-bold text-slate-700">{formatUnits(al.limitKwh)} kWh</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-sans block">Exceeded by:</span>
                      <span className="font-bold text-red-600">+{formatUnits(al.exceededKwh)} kWh</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-sans block">Percentage:</span>
                      <span className="font-bold text-red-600">+{al.exceededPercentage}%</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Tab 2: Department Inquiries & Responses */}
      {activeTab === 'enquiries' && (
        <div className="space-y-4">
          {enquiries.length === 0 ? (
            <div className="text-center py-12 rounded-2xl bg-white border border-slate-200 p-6 text-slate-500 text-xs">
              <MessageSquare className="w-8 h-8 text-purple-500 mx-auto mb-2" />
              <p className="font-bold text-slate-700">No Inquiries Raised Yet</p>
              <p className="text-slate-400 mt-1">
                You can raise an inquiry directly from an exceeded card in the dashboard or click &quot;Raise Department Inquiry&quot;.
              </p>
            </div>
          ) : (
            enquiries.map((enq) => {
              const isResolved = enq.status === 'resolved';
              return (
                <div
                  key={enq.id}
                  className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                            isResolved
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-amber-100 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {isResolved ? '✓ Department Answer Received' : '⏳ Awaiting Sub-ID Answer'}
                        </span>
                        <h4 className="font-extrabold text-sm text-slate-900">{enq.subject}</h4>
                      </div>
                      <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-2 font-medium">
                        <span>
                          Target Section: <strong className="text-slate-800">{enq.sectionName}</strong>
                        </span>
                        <span>•</span>
                        <span>
                          Assigned To: <strong className="text-purple-700">{enq.sentTo}</strong>
                        </span>
                        <span>•</span>
                        <span className="font-mono text-slate-400">{enq.date}</span>
                      </div>
                    </div>

                    <div className="text-xs font-mono font-bold text-red-600">
                      Exceeded: +{formatUnits(enq.exceededKwh)} kWh
                    </div>
                  </div>

                  {/* Plant Admin's Sent Inquiry */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 whitespace-pre-line font-sans leading-relaxed">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Inquiry Dispatched by Plant Admin:
                    </span>
                    {enq.message}
                  </div>

                  {/* Department Sub-ID Response */}
                  {enq.replyMessage ? (
                    <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs space-y-1.5">
                      <div className="flex items-center justify-between text-emerald-800 font-extrabold">
                        <span className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Department Answer from {enq.repliedBy || enq.sentTo}:</span>
                        </span>
                        <span className="text-[10px] text-emerald-600 font-mono">
                          {enq.repliedAt?.slice(0, 10)}
                        </span>
                      </div>
                      <p className="text-emerald-950 whitespace-pre-line leading-relaxed font-sans font-medium">
                        {enq.replyMessage}
                      </p>
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900 flex items-center justify-between">
                      <span className="font-medium">
                        Waiting for <strong>{enq.sentTo}</strong> to login with their Block Sub-ID and submit their explanation.
                      </span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
