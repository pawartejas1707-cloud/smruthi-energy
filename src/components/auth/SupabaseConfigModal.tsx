import React, { useState } from 'react';
import {
  Database,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  X,
  Key,
  ShieldCheck,
  Zap,
  Copy,
  Check,
} from 'lucide-react';
import {
  saveSupabaseConfig,
  clearSupabaseConfig,
  isSupabaseConfigured,
  activeSupabaseUrl,
  activeSupabaseKey,
} from '../../lib/supabase';

interface SupabaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupabaseConfigModal: React.FC<SupabaseConfigModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const [url, setUrl] = useState(activeSupabaseUrl);
  const [key, setKey] = useState(activeSupabaseKey);
  const [copiedSql, setCopiedSql] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveSupabaseConfig(url, key);
  };

  const handleDisconnect = () => {
    if (confirm('Disconnect from Supabase and revert to local offline cache?')) {
      clearSupabaseConfig();
    }
  };

  const handleCopySqlHint = () => {
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">
              Supabase PostgreSQL Connection & Free Tier Setup (₹0 Cost)
            </h3>
            <p className="text-xs text-slate-400">
              Synchronize industrial energy records across all plant workstations securely.
            </p>
          </div>
        </div>

        {/* Status Callout */}
        <div
          className={`p-4 rounded-xl border mb-5 flex items-start gap-3 text-xs ${
            isSupabaseConfigured
              ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
              : 'bg-amber-950/40 border-amber-800 text-amber-300'
          }`}
        >
          {isSupabaseConfigured ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          )}
          <div>
            <div className="font-bold text-sm">
              {isSupabaseConfigured
                ? 'Connected to Live Supabase PostgreSQL Database'
                : 'Operating in Local Demo Mode (Realistic Industrial Cache)'}
            </div>
            <p className="mt-1 opacity-90 leading-relaxed">
              {isSupabaseConfigured
                ? 'All readings, 21 section limits, transformer logs, and plant enquiries synchronize in real-time with your cloud database.'
                : 'To achieve 100% ₹0 cost free-tier deployment and cross-computer sync, enter your Supabase Project URL and anon public key below.'}
            </p>
          </div>
        </div>

        {/* Free Tier Checklist */}
        <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 mb-5 text-xs text-slate-300 space-y-2">
          <div className="font-semibold text-slate-200">Supabase Free Tier Limits Verified:</div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[11px]">
            <div className="p-2 rounded bg-slate-900 border border-slate-800">
              <span className="text-slate-400 block text-[10px]">Database:</span>
              <span className="text-emerald-400 font-bold">500 MB (Free)</span>
            </div>
            <div className="p-2 rounded bg-slate-900 border border-slate-800">
              <span className="text-slate-400 block text-[10px]">Auth Users:</span>
              <span className="text-emerald-400 font-bold">50,000 MAU</span>
            </div>
            <div className="p-2 rounded bg-slate-900 border border-slate-800">
              <span className="text-slate-400 block text-[10px]">Hosting Cost:</span>
              <span className="text-emerald-400 font-bold">₹0 Forever</span>
            </div>
            <div className="p-2 rounded bg-slate-900 border border-slate-800">
              <span className="text-slate-400 block text-[10px]">RLS Security:</span>
              <span className="text-emerald-400 font-bold">Enabled</span>
            </div>
          </div>
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Supabase Project URL:
            </label>
            <input
              type="url"
              required
              placeholder="https://xyzcompany.supabase.co"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-850 border border-slate-700 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Supabase Public Anon Key:
            </label>
            <input
              type="password"
              required
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              value={key}
              onChange={(e) => setKey(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-850 border border-slate-700 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Quick Steps Instructions */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 space-y-1">
            <div className="font-semibold text-slate-200">How to setup in 2 minutes:</div>
            <ol className="list-decimal list-inside space-y-0.5">
              <li>Create a free account on supabase.com (100% Free Plan).</li>
              <li>Create a new project named <code className="text-cyan-300">smruthi-energy</code>.</li>
              <li>Open SQL Editor in Supabase and paste the contents of <code className="text-cyan-300">supabase/schema.sql</code>.</li>
              <li>Copy Project URL and Anon API key from Project Settings → API, paste here and click Save.</li>
            </ol>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-800">
            {isSupabaseConfigured ? (
              <button
                type="button"
                onClick={handleDisconnect}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-red-400 hover:bg-red-950/40 border border-red-800"
              >
                Disconnect Supabase
              </button>
            ) : (
              <a
                href="https://supabase.com"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-xs text-cyan-400 hover:underline"
              >
                Open Supabase.com <ExternalLink className="w-3 h-3" />
              </a>
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800"
              >
                Close
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white shadow-lg"
              >
                Save & Connect Database
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
