import React, { useState, useMemo } from 'react';
import { Mail, Send, AlertTriangle, X, CheckCircle2, Building2 } from 'lucide-react';
import { Section, DailyReading, UserRole } from '../../types';
import { useApp } from '../../context/AppContext';
import { formatUnits } from '../../lib/calculations';

interface EnquiryModalProps {
  section: Section;
  todayUnits: number;
  onClose: () => void;
}

export const EnquiryModal: React.FC<EnquiryModalProps> = ({ section, todayUnits, onClose }) => {
  const { currentUser, sendEnquiry, alerts } = useApp();

  const isExceeded = todayUnits > section.dailyLimitKwh;
  const exceededKwh = isExceeded ? Number((todayUnits - section.dailyLimitKwh).toFixed(1)) : 0;
  const exceededPct = isExceeded
    ? Number(((exceededKwh / section.dailyLimitKwh) * 100).toFixed(1))
    : 0;

  // Map 6 core production blocks to their sub-IDs, all other sections to Electrical Admin
  const matchedTarget = useMemo(() => {
    const sName = section.name.toLowerCase().trim();
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
  }, [section]);

  const defaultSubject = `[URGENT] Consumption Limit Breach: ${section.name} (+${exceededPct}%)`;
  const defaultBody = `Dear ${matchedTarget.name},

During today's monitoring shift, ${section.name} consumed ${formatUnits(
    todayUnits
  )} kWh, exceeding the allocated daily threshold limit of ${formatUnits(
    section.dailyLimitKwh
  )} kWh by ${formatUnits(exceededKwh)} kWh (+${exceededPct}%).

Please investigate operating equipment, batch cycles, or motor load in this section and submit your departmental response on the portal.

Regards,
${currentUser.fullName}
Plant Operations Department`;

  const [subject, setSubject] = useState(defaultSubject);
  const [message, setMessage] = useState(defaultBody);
  const [isSent, setIsSent] = useState(false);

  // Find active alert if exists
  const activeAlert = alerts.find(
    (a) => a.sectionId === section.id && a.status === 'active'
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await sendEnquiry({
      alertId: activeAlert?.id,
      sectionId: section.id,
      sectionName: section.name,
      date: new Date().toISOString().split('T')[0],
      consumedKwh: todayUnits,
      limitKwh: section.dailyLimitKwh,
      exceededKwh,
      subject,
      message,
      sentBy: currentUser.fullName,
      sentByEmail: currentUser.email,
      sentTo: matchedTarget.name,
      sentToEmail: matchedTarget.email,
      targetRole: matchedTarget.role,
    });

    setIsSent(true);
    setTimeout(() => {
      onClose();
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {isSent ? (
          <div className="text-center py-8 space-y-3">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white">Enquiry Dispatched Successfully</h3>
            <p className="text-xs text-slate-300 max-w-md mx-auto">
              In-app departmental enquiry ticket sent to {matchedTarget.name} (
              <span className="text-cyan-300 font-mono">{matchedTarget.email}</span>). A notification has
              been routed to their department portal.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-300">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  Send Inquiry: {section.name}
                </h3>
                <p className="text-xs text-slate-400">
                  Targeted departmental inquiry for {section.name} threshold breach
                </p>
              </div>
            </div>

            {/* Breach Summary Card */}
            <div className="p-3 rounded-xl bg-red-950/40 border border-red-800/60 flex items-center justify-between text-xs font-mono">
              <div>
                <span className="text-slate-400 block">Today's Consumption:</span>
                <span className="text-white font-bold">{formatUnits(todayUnits)} kWh</span>
              </div>
              <div>
                <span className="text-slate-400 block">Configured Limit:</span>
                <span className="text-amber-400 font-bold">
                  {formatUnits(section.dailyLimitKwh)} kWh
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Exceeded By:</span>
                <span className="text-red-400 font-bold">
                  +{formatUnits(exceededKwh)} kWh ({exceededPct}%)
                </span>
              </div>
            </div>

            {/* Designated In-Charge Sub-ID Recipient */}
            <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 text-xs">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                Designated Recipient (Sub-ID / Dept In-Charge):
              </span>
              <div className="font-bold text-white mt-0.5 flex items-center justify-between">
                <span>{matchedTarget.name}</span>
                <span className="text-[11px] font-mono text-purple-300 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-800">
                  {matchedTarget.email}
                </span>
              </div>
            </div>

            {/* Subject */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Subject:</label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-500 font-medium"
              />
            </div>

            {/* Message Body */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Enquiry Details / Operational Concern:
              </label>
              <textarea
                rows={5}
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-500 resize-none font-sans"
              />
            </div>

            {/* Submit / Cancel Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-xs font-bold text-white shadow-lg shadow-purple-950/40 transition-all"
              >
                <Send className="w-3.5 h-3.5" />
                Dispatch Enquiry
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
