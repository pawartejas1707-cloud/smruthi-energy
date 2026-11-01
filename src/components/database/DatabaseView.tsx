import React, { useState } from 'react';
import {
  Database,
  Cloud,
  CheckCircle2,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Server,
  Terminal,
  Cpu,
} from 'lucide-react';
import { isSupabaseConfigured, activeSupabaseUrl } from '../../lib/supabase';
import { useApp } from '../../context/AppContext';

export const DatabaseView: React.FC<{ onOpenConfigModal: () => void }> = ({ onOpenConfigModal }) => {
  const { resetToDefaultData } = useApp();
  const [copiedEnv, setCopiedEnv] = useState(false);

  const envSample = `# SMRUTHI ORGANICS – ELECTRICAL DEPARTMENT
# .env.local Configuration for Production Vercel / Local Vite
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
`;

  const handleCopyEnv = () => {
    navigator.clipboard.writeText(envSample);
    setCopiedEnv(true);
    setTimeout(() => setCopiedEnv(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Cloud className="w-5 h-5 text-cyan-400" />
            Database Architecture & Free Tier Deployment (₹0 Cost)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Production deployment guide for Supabase PostgreSQL + Vercel Free Plan.
          </p>
        </div>

        <button
          onClick={onOpenConfigModal}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-xs font-bold text-slate-950 shadow-lg shadow-cyan-950/40 transition-all self-start sm:self-auto"
        >
          <Database className="w-4 h-4" />
          {isSupabaseConfigured ? 'Manage Supabase Connection' : 'Connect Supabase (₹0 Cost)'}
        </button>
      </div>

      {/* Free Tier Cost & Limits Verification Table */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-xl space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          Free-Tier Technologies & Limit Verification
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
          {/* Supabase Free Plan */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-emerald-400">Supabase PostgreSQL</span>
              <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 text-[10px] border border-emerald-800">
                ₹0 / month
              </span>
            </div>
            <ul className="space-y-1 text-slate-400 font-sans text-xs">
              <li>• 500 MB database storage (adequate for 10+ years of daily 21-section readings)</li>
              <li>• 50,000 monthly active users</li>
              <li>• Row Level Security (RLS) enabled</li>
              <li>• SSL encrypted PostgreSQL connections</li>
            </ul>
          </div>

          {/* Vercel Free Plan */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-cyan-400">Vercel Edge Hosting</span>
              <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 text-[10px] border border-cyan-800">
                ₹0 / month
              </span>
            </div>
            <ul className="space-y-1 text-slate-400 font-sans text-xs">
              <li>• 100 GB bandwidth / month</li>
              <li>• Automated CI/CD from GitHub</li>
              <li>• Global Edge CDN for sub-50ms latency</li>
              <li>• Free custom domain SSL certificate</li>
            </ul>
          </div>

          {/* Source & Sync */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-400">Multi-PC Sync</span>
              <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 text-[10px] border border-amber-800">
                Realtime
              </span>
            </div>
            <ul className="space-y-1 text-slate-400 font-sans text-xs">
              <li>• Centralized Supabase cloud storage</li>
              <li>• Reading operator enters on mobile/tablet</li>
              <li>• Plant Admin sees live readings instantly</li>
              <li>• Offline fallback ensures zero data loss</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Step by Step Deployment Guide */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-xl space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Terminal className="w-4 h-4 text-cyan-400" />
          Step-by-Step Production Deployment Instructions
        </h3>

        <div className="space-y-3 text-xs text-slate-300">
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <div className="font-bold text-white mb-1">Step 1: Setup Supabase Database</div>
            <p className="text-slate-400 leading-relaxed font-sans">
              1. Sign in to <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-cyan-400 underline">supabase.com</a>.<br />
              2. Click "New Project" and name it <code className="text-cyan-300">smruthi-energy</code>.<br />
              3. Go to the <strong>SQL Editor</strong> tab on the left navigation.<br />
              4. Open the file <code className="text-cyan-300">supabase/schema.sql</code> in this repository, paste the entire SQL code and click <strong>RUN</strong>.<br />
              5. All tables (<code className="text-cyan-300">sections</code>, <code className="text-cyan-300">meters</code>, <code className="text-cyan-300">meter_readings</code>, <code className="text-cyan-300">transformer_readings</code>, <code className="text-cyan-300">cost_settings</code>, <code className="text-cyan-300">consumption_alerts</code>, <code className="text-cyan-300">enquiries</code>) and initial seed data for all 21 sections will be created immediately with Row Level Security.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <div className="font-bold text-white mb-1">Step 2: Connect Environment Variables</div>
            <p className="text-slate-400 leading-relaxed font-sans mb-2">
              In Supabase Project Settings → API, copy <strong>Project URL</strong> and <strong>Project API Keys (anon public)</strong>.
            </p>
            <div className="relative">
              <pre className="p-3 rounded-lg bg-slate-900 border border-slate-800 font-mono text-xs text-slate-300 overflow-x-auto">
                {envSample}
              </pre>
              <button
                onClick={handleCopyEnv}
                className="absolute top-2 right-2 p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                title="Copy .env template"
              >
                {copiedEnv ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <div className="font-bold text-white mb-1">Step 3: Deploy to Vercel (Free Plan)</div>
            <p className="text-slate-400 leading-relaxed font-sans">
              1. Push this repository to your GitHub account: <code className="text-cyan-300">git push origin main</code>.<br />
              2. Go to <a href="https://vercel.com" target="_blank" rel="noreferrer" className="text-cyan-400 underline">vercel.com</a> and click "Add New Project".<br />
              3. Select your repository, add the two environment variables (<code className="text-cyan-300">VITE_SUPABASE_URL</code> and <code className="text-cyan-300">VITE_SUPABASE_ANON_KEY</code>), and click <strong>Deploy</strong>.<br />
              4. Your site will be live on <code className="text-cyan-300">https://smruthi-energy.vercel.app</code> with continuous updates, SSL security, and ₹0 costs!
            </p>
          </div>
        </div>
      </div>

      {/* Reset & Maintenance */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-xl flex items-center justify-between">
        <div>
          <h4 className="text-sm font-bold text-white">Reset Local Simulation State</h4>
          <p className="text-xs text-slate-400 mt-0.5">
            Reset local test readings and restore fresh realistic 30-day industrial logs.
          </p>
        </div>
        <button
          onClick={() => {
            if (confirm('Reset demo data to default initial state?')) {
              resetToDefaultData();
            }
          }}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-xs font-semibold text-slate-200"
        >
          Reset Simulation Data
        </button>
      </div>
    </div>
  );
};
