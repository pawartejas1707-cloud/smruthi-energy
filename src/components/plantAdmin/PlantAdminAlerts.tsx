import React, { useState } from 'react';
import { AlertTriangle, Mail, CheckCircle2, Clock, Layers, MessageSquare, Send, Bell } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatUnits } from '../../lib/calculations';
import { EnquiryRecord } from '../../types';
import { EmailAlertManager } from '../alerts/EmailAlertManager';

export const PlantAdminAlerts: React.FC = () => {
  const { alerts, enquiries, sendEnquiry, currentUser, sections } = useApp();

  const [activeTab, setActiveTab] = useState<'emails' | 'alerts' | 'enquiries'>('emails');
  const [isComposeOpen, setIsComposeOpen] = useState(false);

  // Compose form states
  const [selectedSectionId, setSelectedSectionId] = useState(sections[0]?.id || '');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const activeAlerts = alerts.filter((a) => a.status === 'active');
  const resolvedAlerts = alerts.filter((a) => a.status === 'resolved');

  const handleComposeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;

    setIsSending(true);
    const sec = sections.find((s) => s.id === selectedSectionId) || sections[0];

    try {
      await sendEnquiry({
        sectionId: sec.id,
        sectionName: sec.name,
        date: new Date().toISOString().split('T')[0],
        consumedKwh: sec.dailyLimitKwh * 1.1,
        limitKwh: sec.dailyLimitKwh,
        exceededKwh: sec.dailyLimitKwh * 0.1,
        subject,
        message,
        sentBy: currentUser.fullName,
        sentByEmail: currentUser.email,
        sentTo: 'Electrical Admin (Er. Rajesh K. More)',
        sentToEmail: 'electrical.hod@smruthi-organics.com',
      });
      setIsComposeOpen(false);
      setSubject('');
      setMessage('');
      setActiveTab('enquiries');
    } finally {
      setIsSending(false);
    }
  };

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
              Consumption Alerts & Electrical Enquiries Center
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit log of section limit violations and direct enquiry communications with Electrical Admin.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsComposeOpen(!isComposeOpen)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition-colors cursor-pointer"
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Compose Direct Enquiry</span>
          </button>
        </div>
      </div>

      {/* Compose Enquiry Modal / Drawer if open */}
      {isComposeOpen && (
        <div className="rounded-2xl bg-white border border-blue-200 p-5 shadow-md">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
            <div className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
              <Mail className="w-4 h-4 text-blue-600" />
              <span>Send Executive Enquiry to Electrical Department</span>
            </div>
            <button
              onClick={() => setIsComposeOpen(false)}
              className="text-slate-400 hover:text-slate-600 font-bold text-xs"
            >
              Cancel
            </button>
          </div>

          <form onSubmit={handleComposeSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Select Department Section:
              </label>
              <select
                value={selectedSectionId}
                onChange={(e) => setSelectedSectionId(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-slate-900 font-semibold bg-white text-xs focus:outline-none focus:border-blue-500"
              >
                {sections.map((sec) => (
                  <option key={sec.id} value={sec.id}>
                    {sec.name} ({sec.code}) - Limit: {formatUnits(sec.dailyLimitKwh)} kWh
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Subject:</label>
              <input
                type="text"
                required
                placeholder="e.g. Investigation required for excessive consumption in Block C"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-slate-900 font-semibold bg-white text-xs focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Executive Enquiry Message:
              </label>
              <textarea
                required
                rows={4}
                placeholder="Describe your inquiry or concern regarding power consumption, equipment running hours, or motor overhauls..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 font-medium bg-white text-xs focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsComposeOpen(false)}
                className="px-3.5 py-1.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSending}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSending ? 'Sending...' : 'Dispatch Enquiry'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* View Switcher: Email Alerts vs Limit Alerts vs Enquiries */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('emails')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'emails'
              ? 'bg-red-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Mail className="w-3.5 h-3.5" />
          <span>Automated Email Alerts (A Block)</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white text-red-700 font-bold">
            Active
          </span>
        </button>

        <button
          onClick={() => setActiveTab('alerts')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'alerts'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          <span>Threshold Limit Alerts</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-red-500 text-white font-mono">
            {activeAlerts.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('enquiries')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'enquiries'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
          <span>Enquiry Communications</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-blue-600 text-white font-mono">
            {enquiries.length}
          </span>
        </button>
      </div>

      {/* Tab 0: Automated Email Alerts */}
      {activeTab === 'emails' && <EmailAlertManager />}

      {/* Tab 1: Limit Alerts */}
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
                      ? 'bg-red-50/50 border-red-300 shadow-sm'
                      : 'bg-white border-slate-200 opacity-80'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                          isActive
                            ? 'bg-red-100 text-red-700 border border-red-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {al.status}
                      </span>
                      <h4 className="font-extrabold text-sm text-slate-900">{al.sectionName}</h4>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{al.date}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-2.5 rounded-xl bg-white/80 border border-slate-200/80 text-xs font-mono mb-2">
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

      {/* Tab 2: Enquiries */}
      {activeTab === 'enquiries' && (
        <div className="space-y-3">
          {enquiries.length === 0 ? (
            <div className="text-center py-12 rounded-2xl bg-white border border-slate-200 p-6 text-slate-500 text-xs">
              <Mail className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <p className="font-bold text-slate-700">No Enquiries Currently Dispatched</p>
              <p className="text-slate-400 mt-1">
                You can send an enquiry from the Department Sections monitoring card or use "Compose Direct Enquiry".
              </p>
            </div>
          ) : (
            enquiries.map((enq) => {
              const isResolved = enq.status === 'resolved';
              return (
                <div
                  key={enq.id}
                  className="rounded-2xl bg-white border border-slate-200 p-4 shadow-sm space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                            isResolved
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {enq.status === 'resolved' ? 'Resolved by Electrical Admin' : 'Pending Response'}
                        </span>
                        <h4 className="font-bold text-sm text-slate-900">{enq.subject}</h4>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5 font-medium">
                        Section: <span className="font-bold text-slate-700">{enq.sectionName}</span> • Sent by: {enq.sentBy}
                      </div>
                    </div>

                    <div className="text-xs text-slate-400 font-mono">{enq.date}</div>
                  </div>

                  {/* Message body */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 whitespace-pre-line font-sans">
                    {enq.message}
                  </div>

                  {/* Electrical Department Reply if available */}
                  {enq.replyMessage && (
                    <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs space-y-1">
                      <div className="flex items-center justify-between text-emerald-800 font-bold">
                        <span>Response from Electrical Admin ({enq.repliedBy || 'Chief Electrical Eng.'}):</span>
                        <span className="text-[10px] text-emerald-600 font-mono">{enq.repliedAt?.slice(0, 10)}</span>
                      </div>
                      <p className="text-emerald-900 whitespace-pre-line">{enq.replyMessage}</p>
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
