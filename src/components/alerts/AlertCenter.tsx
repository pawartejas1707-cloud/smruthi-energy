import React, { useState } from 'react';
import {
  AlertTriangle,
  Mail,
  CheckCircle2,
  Clock,
  Layers,
  Send,
  MessageSquare,
  Shield,
  ArrowRight,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatUnits } from '../../lib/calculations';
import { EnquiryRecord } from '../../types';
import { EmailAlertManager } from './EmailAlertManager';

export const AlertCenter: React.FC = () => {
  const { alerts, enquiries, resolveAlert, replyToEnquiry, currentRole, currentUser } = useApp();

  const isElectricalAdmin = currentRole === 'electrical_admin';
  const isPlantAdmin = currentRole === 'plant_admin';

  const [viewTab, setViewTab] = useState<'alerts' | 'emailConfig'>('alerts');

  // Reply state
  const [activeEnquiryToReply, setActiveEnquiryToReply] = useState<EnquiryRecord | null>(null);
  const [replyText, setReplyText] = useState('');

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeEnquiryToReply || !replyText.trim()) return;

    await replyToEnquiry(activeEnquiryToReply.id, replyText.trim());
    setActiveEnquiryToReply(null);
    setReplyText('');
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            Consumption Limits & Plant Admin Enquiries Center
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Audit log of section limit violations, automatic alerts, Plant Admin email enquiries and Electrical Admin resolutions.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
          <span className="px-2.5 py-1 rounded-lg bg-red-950 border border-red-800 text-red-300 font-bold">
            {alerts.filter((a) => a.status === 'active').length} Active Alerts
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-purple-950 border border-purple-800 text-purple-300 font-bold">
            {enquiries.filter((e) => e.status === 'pending').length} Pending Enquiries
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setViewTab('alerts')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            viewTab === 'alerts'
              ? 'bg-slate-800 text-white shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-850'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          <span>Alerts & Enquiries</span>
        </button>

        <button
          onClick={() => setViewTab('emailConfig')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            viewTab === 'emailConfig'
              ? 'bg-red-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-850'
          }`}
        >
          <Mail className="w-3.5 h-3.5" />
          <span>Automated Email Alerts (A Block)</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white text-red-700 font-bold">
            Active
          </span>
        </button>
      </div>

      {viewTab === 'emailConfig' ? (
        <EmailAlertManager />
      ) : (
        /* Two Column Layout: Enquiries Thread vs Alert Log */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Plant Admin Enquiries & Responses */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-purple-400" />
              <h3 className="text-sm font-bold text-white">
                Plant Admin Enquiries & Email Dispatch Log
              </h3>
            </div>
            <span className="text-[11px] text-slate-400">{enquiries.length} Enquiries</span>
          </div>

          <div className="space-y-3 max-h-[550px] overflow-y-auto pr-1">
            {enquiries.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">
                No enquiries logged yet.
              </div>
            ) : (
              enquiries.map((enq) => (
                <div
                  key={enq.id}
                  className={`p-4 rounded-xl border space-y-2.5 transition-all ${
                    enq.status === 'resolved'
                      ? 'bg-slate-950/60 border-slate-800'
                      : 'bg-purple-950/20 border-purple-800/60 shadow-lg shadow-purple-950/20'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-xs text-white">{enq.subject}</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Section: <span className="text-cyan-300 font-medium">{enq.sectionName}</span> • Date: {enq.date}
                      </p>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase shrink-0 ${
                        enq.status === 'resolved'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {enq.status === 'resolved' ? 'Resolved' : 'Pending Response'}
                    </span>
                  </div>

                  {/* Enquiry message body */}
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 whitespace-pre-line font-sans">
                    {enq.message}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                    <span>From: {enq.sentBy}</span>
                    <span>To: {enq.sentTo}</span>
                  </div>

                  {/* Reply Section */}
                  {enq.replyMessage ? (
                    <div className="p-3 rounded-lg bg-slate-950 border border-emerald-800/50 space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-emerald-400">
                          Response from {enq.repliedBy || 'Electrical Admin'}:
                        </span>
                        <span className="text-slate-400 font-mono">
                          {enq.repliedAt?.slice(0, 10)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-200">{enq.replyMessage}</p>
                    </div>
                  ) : (
                    isElectricalAdmin && (
                      <div className="pt-2 border-t border-slate-800 flex justify-end">
                        <button
                          onClick={() => setActiveEnquiryToReply(enq)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white shadow-sm"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          Respond to Enquiry
                        </button>
                      </div>
                    )
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Section Limit Alerts Log */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <h3 className="text-sm font-bold text-white">
                Consumption Threshold Breach History
              </h3>
            </div>
            <span className="text-[11px] text-slate-400">{alerts.length} Records</span>
          </div>

          <div className="space-y-3 max-h-[550px] overflow-y-auto pr-1">
            {alerts.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">
                No limit violations recorded. All sections within daily limits.
              </div>
            ) : (
              alerts.map((alt) => (
                <div
                  key={alt.id}
                  className={`p-4 rounded-xl border space-y-2 transition-all ${
                    alt.status === 'active'
                      ? 'bg-red-950/30 border-red-800/80'
                      : 'bg-slate-950/60 border-slate-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-xs text-white">{alt.sectionName}</h4>
                      <p className="text-[11px] text-slate-400 font-mono">
                        Date: {alt.date} • {alt.createdAt?.slice(11, 16)} hrs
                      </p>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        alt.status === 'active'
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {alt.status === 'active' ? 'Active Alert' : 'Resolved'}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 p-2 rounded-lg bg-slate-900/80 border border-slate-800 text-xs font-mono">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Actual Units:</span>
                      <span className="text-white font-bold">{formatUnits(alt.consumedKwh)} kWh</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Daily Limit:</span>
                      <span className="text-amber-400 font-bold">{formatUnits(alt.limitKwh)} kWh</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Exceeded:</span>
                      <span className="text-red-400 font-bold">
                        +{formatUnits(alt.exceededKwh)} (+{alt.exceededPercentage}%)
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  {alt.status === 'active' && isElectricalAdmin && (
                    <div className="pt-2 flex justify-end">
                      <button
                        onClick={() => resolveAlert(alt.id)}
                        className="flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-600/80 hover:bg-emerald-600 text-xs font-semibold text-white shadow-sm"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Mark Resolved
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      )}

      {/* Reply Modal */}
      {activeEnquiryToReply && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-700 p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">
              Respond to Enquiry: {activeEnquiryToReply.subject}
            </h3>

            <div className="p-3 rounded-lg bg-slate-950 text-xs text-slate-300 font-sans border border-slate-800">
              {activeEnquiryToReply.message}
            </div>

            <form onSubmit={handleReplySubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Electrical Department Investigation & Response:
                </label>
                <textarea
                  rows={4}
                  required
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="e.g. Suction valve inspected. High ambient temperature caused increased refrigeration load. Corrective throttling applied."
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-500 resize-none font-sans"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setActiveEnquiryToReply(null)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white shadow-lg"
                >
                  <Send className="w-3.5 h-3.5" />
                  Submit Response & Resolve
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
