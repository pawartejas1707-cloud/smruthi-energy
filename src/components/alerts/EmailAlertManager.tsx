import React, { useState } from 'react';
import {
  Mail,
  Send,
  CheckCircle2,
  AlertTriangle,
  Settings,
  Bell,
  Clock,
  ShieldCheck,
  RefreshCw,
  Plus,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatUnits } from '../../lib/calculations';

export const EmailAlertManager: React.FC = () => {
  const {
    sections,
    emailConfig,
    emailLogs,
    updateEmailConfig,
    sendTestEmail,
    refreshEmailLogs,
  } = useApp();

  const [testEmailRecipient, setTestEmailRecipient] = useState('');
  const [selectedBlockForTest, setSelectedBlockForTest] = useState('A Block');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Settings edit state
  const [isEditingSettings, setIsEditingSettings] = useState(false);
  const [recipientsInput, setRecipientsInput] = useState(emailConfig.recipients.join(', '));
  const [smtpHost, setSmtpHost] = useState(emailConfig.smtpHost || '');
  const [smtpPort, setSmtpPort] = useState(emailConfig.smtpPort || 587);
  const [smtpUser, setSmtpUser] = useState(emailConfig.smtpUser || '');
  const [smtpPass, setSmtpPass] = useState(emailConfig.smtpPass || '');
  const [fromAddress, setFromAddress] = useState(
    emailConfig.fromAddress || 'Smruthi Organics Electrical Dept <alerts@smruthi-organics.com>'
  );
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);

  // Monitored blocks state
  const [monitoredBlocks, setMonitoredBlocks] = useState<string[]>(
    emailConfig.monitoredBlocks || ['A Block']
  );

  const handleToggleBlock = async (blockName: string) => {
    let updated: string[];
    if (monitoredBlocks.includes(blockName)) {
      // Don't let them remove everything if they want A Block
      updated = monitoredBlocks.filter((b) => b !== blockName);
    } else {
      updated = [...monitoredBlocks, blockName];
    }
    setMonitoredBlocks(updated);
    await updateEmailConfig({ monitoredBlocks: updated });
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    const recipientsList = recipientsInput
      .split(',')
      .map((r) => r.trim())
      .filter(Boolean);

    await updateEmailConfig({
      recipients: recipientsList,
      monitoredBlocks,
      smtpHost,
      smtpPort: Number(smtpPort),
      smtpUser,
      smtpPass,
      fromAddress,
    });
    setIsSavingSettings(false);
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 3000);
    setIsEditingSettings(false);
  };

  const handleSendTest = async () => {
    setIsSendingTest(true);
    setTestResult(null);
    try {
      const res = await sendTestEmail(selectedBlockForTest, testEmailRecipient.trim() || undefined);
      if (res) {
        setTestResult({
          success: res.success,
          message: res.message || 'Test email processed successfully!',
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Failed to dispatch test email',
      });
    } finally {
      setIsSendingTest(false);
    }
  };

  const aBlock = sections.find((s) => s.name === 'A Block') || {
    name: 'A Block',
    code: 'SEC-A-BLK',
    dailyLimitKwh: 2800,
  };

  return (
    <div className="space-y-6">
      {/* 1. Highlight Banner specifically for A Block Email Notification */}
      <div className="rounded-2xl bg-gradient-to-r from-red-500/10 via-amber-500/5 to-blue-500/10 border-2 border-red-500/40 p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-red-600 text-white shadow-md shadow-red-600/30 shrink-0">
              <Mail className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-red-600 text-white text-[10px] font-black uppercase tracking-wider">
                  Active Automated Dispatcher
                </span>
                <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 text-[11px] font-bold">
                  Target Feeder: A Block
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 mt-1">
                Automated Email Alert System for A Block Limit Breaches
              </h3>
              <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                Whenever <strong>A Block</strong> (Code: <code>SEC-A-BLK</code>) consumption crosses its daily threshold limit of{' '}
                <strong className="text-red-700 font-mono font-bold">{formatUnits(aBlock.dailyLimitKwh)} kWh</strong>, an automated alert email is dispatched instantly to all designated plant engineers and factory heads.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2 shrink-0">
            <button
              onClick={() => setIsEditingSettings(!isEditingSettings)}
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 hover:text-slate-900 text-xs font-bold shadow-sm transition-colors cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5 text-slate-500" />
              <span>{isEditingSettings ? 'Close Config' : 'Configure SMTP & Recipients'}</span>
            </button>
          </div>
        </div>

        {/* Quick status bar */}
        <div className="mt-4 pt-3 border-t border-red-200/60 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span className="text-slate-600">Threshold Limit:</span>
            <span className="font-mono font-bold text-slate-900">{formatUnits(aBlock.dailyLimitKwh)} kWh/day</span>
          </div>
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-amber-600" />
            <span className="text-slate-600">Recipients Count:</span>
            <span className="font-mono font-bold text-slate-900">{emailConfig.recipients.length} Email(s)</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-600" />
            <span className="text-slate-600">Trigger Mode:</span>
            <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Immediate On-Save
            </span>
          </div>
        </div>
      </div>

      {/* 2. Interactive Test Email Dispatcher */}
      <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div>
            <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
              <Send className="w-4 h-4 text-blue-600" />
              <span>Test Email Alert Dispatcher</span>
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Simulate an A Block consumption breach and verify email reception in your inbox right now.
            </p>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            Default Recipients: {emailConfig.recipients.join(', ')}
          </span>
        </div>

        <div className="flex flex-col md:flex-row items-stretch gap-3">
          <div className="w-full md:w-56">
            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
              Select Monitored Block:
            </label>
            <select
              value={selectedBlockForTest}
              onChange={(e) => setSelectedBlockForTest(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-slate-900 bg-white text-xs focus:outline-none focus:border-blue-500"
            >
              <option value="A Block">⭐ A Block (2,800 kWh limit)</option>
              {sections
                .filter((s) => s.name !== 'A Block')
                .map((s) => (
                  <option key={s.id} value={s.name}>
                    {s.name} ({s.code}) - {formatUnits(s.dailyLimitKwh)} kWh
                  </option>
                ))}
            </select>
          </div>

          <div className="flex-1">
            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
              Recipient Email (Leave blank to use default recipients):
            </label>
            <input
              type="email"
              placeholder="e.g. your-email@gmail.com (or leave blank to use defaults)"
              value={testEmailRecipient}
              onChange={(e) => setTestEmailRecipient(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium text-slate-900 bg-white text-xs focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={handleSendTest}
              disabled={isSendingTest}
              className="w-full md:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSendingTest ? 'Dispatching...' : `⚡ Send Test Alert Email for ${selectedBlockForTest}`}</span>
            </button>
          </div>
        </div>

        {testResult && (
          <div
            className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-3 ${
              testResult.success
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                : 'bg-red-50 border-red-300 text-red-900'
            }`}
          >
            <div className="flex items-center gap-2">
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              )}
              <span className="font-semibold">{testResult.message}</span>
            </div>
            <button
              onClick={() => setTestResult(null)}
              className="text-xs font-bold underline opacity-75 hover:opacity-100"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>

      {/* 3. Settings Configuration (Expandable) */}
      {isEditingSettings && (
        <form onSubmit={handleSaveSettings} className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <Settings className="w-4 h-4 text-purple-600" />
                <span>Email Alert Settings & SMTP Configuration</span>
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Configure your recipient list and optional SMTP relay (Gmail, Office365, or Corporate Mail Server).
              </p>
            </div>
            {settingsSaved && (
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                ✓ Settings Saved!
              </span>
            )}
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Recipient Email Addresses (comma separated):
              </label>
              <input
                type="text"
                required
                value={recipientsInput}
                onChange={(e) => setRecipientsInput(e.target.value)}
                placeholder="plant.head@smruthi-organics.com, electrical.hod@smruthi-organics.com"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-slate-900 text-xs focus:outline-none focus:border-blue-500"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Any address listed here will receive automatic emails whenever A Block crosses 2,800 kWh.
              </span>
            </div>

            {/* Monitored Blocks Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Monitored Blocks for Automated Email Alert:
              </label>
              <div className="flex flex-wrap gap-2">
                {sections.map((sec) => {
                  const isChecked = monitoredBlocks.includes(sec.name);
                  const isABlock = sec.name === 'A Block';
                  return (
                    <button
                      type="button"
                      key={sec.id}
                      onClick={() => handleToggleBlock(sec.name)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 ${
                        isChecked
                          ? isABlock
                            ? 'bg-red-600 text-white border-red-700 shadow-sm'
                            : 'bg-purple-600 text-white border-purple-700'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <span>{isChecked ? '✓' : '+'}</span>
                      <span>{sec.name}</span>
                      <span className="text-[10px] opacity-80">({formatUnits(sec.dailyLimitKwh)} kWh)</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* SMTP Configuration Fields */}
            <div className="pt-3 border-t border-slate-100 space-y-3">
              <div className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Live SMTP Relay Settings (Optional — leave empty to use server simulation mode):
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    SMTP Host (e.g. smtp.gmail.com):
                  </label>
                  <input
                    type="text"
                    value={smtpHost}
                    onChange={(e) => setSmtpHost(e.target.value)}
                    placeholder="smtp.gmail.com"
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 font-mono text-slate-900 text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">SMTP Port:</label>
                  <input
                    type="number"
                    value={smtpPort}
                    onChange={(e) => setSmtpPort(Number(e.target.value))}
                    placeholder="587"
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 font-mono text-slate-900 text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    From Address:
                  </label>
                  <input
                    type="text"
                    value={fromAddress}
                    onChange={(e) => setFromAddress(e.target.value)}
                    placeholder="alerts@smruthi-organics.com"
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    SMTP Username / Email:
                  </label>
                  <input
                    type="text"
                    value={smtpUser}
                    onChange={(e) => setSmtpUser(e.target.value)}
                    placeholder="electrical.smruthi@gmail.com"
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 font-mono text-slate-900 text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    SMTP Password / App Key:
                  </label>
                  <input
                    type="password"
                    value={smtpPass}
                    onChange={(e) => setSmtpPass(e.target.value)}
                    placeholder="App Password"
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 font-mono text-slate-900 text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3">
              <button
                type="button"
                onClick={() => setIsEditingSettings(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSavingSettings}
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-600/20"
              >
                {isSavingSettings ? 'Saving...' : 'Save Configuration'}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* 4. Live Dispatched Alert Emails Audit Log */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-slate-600" />
            <h4 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider">
              Dispatched Alert Emails Audit Log
            </h4>
          </div>
          <button
            onClick={() => refreshEmailLogs()}
            className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-blue-600 font-bold"
            title="Refresh logs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>

        {emailLogs.length === 0 ? (
          <div className="text-center py-10 px-4 text-slate-500 text-xs">
            <Mail className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="font-bold text-slate-700">No Alert Emails Dispatched Yet</p>
            <p className="text-slate-400 mt-1">
              Click &quot;Send Test Alert Email for A Block&quot; above or save an A Block reading exceeding 2,800 kWh.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-600 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-3">Dispatched Time</th>
                  <th className="p-3">Feeder Block</th>
                  <th className="p-3">Limit / Consumed</th>
                  <th className="p-3">Excess (Variance)</th>
                  <th className="p-3">Recipients</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {emailLogs.map((log) => {
                  const isSent = log.status === 'sent';
                  const isSim = log.status === 'simulated';
                  return (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 font-sans text-slate-600 whitespace-nowrap">
                        {log.sentAt ? new Date(log.sentAt).toLocaleString('en-IN') : log.date}
                      </td>
                      <td className="p-3 font-sans font-bold text-slate-900 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200 text-xs">
                          {log.sectionName}
                        </span>
                      </td>
                      <td className="p-3 text-slate-700 whitespace-nowrap">
                        {formatUnits(log.consumedKwh)} / {formatUnits(log.limitKwh)} kWh
                      </td>
                      <td className="p-3 font-bold text-red-600 whitespace-nowrap">
                        +{formatUnits(log.exceededKwh)} kWh (+{log.exceededPercentage}%)
                      </td>
                      <td className="p-3 font-sans text-slate-600 max-w-xs truncate" title={log.recipients?.join(', ')}>
                        {log.recipients?.join(', ') || 'Default'}
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isSent
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : isSim
                              ? 'bg-blue-100 text-blue-800 border border-blue-300'
                              : 'bg-red-100 text-red-800 border border-red-300'
                          }`}
                        >
                          {isSent ? '✓ Sent (Live)' : isSim ? '⚡ Dispatched (Logged)' : 'Failed'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
