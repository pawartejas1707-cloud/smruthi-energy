import React, { useState } from 'react';
import {
  Database,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  X,
  Server,
  Terminal,
  Copy,
  Check,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface MongoConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MongoConfigModal: React.FC<MongoConfigModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const { isBackendConnected } = useApp();
  const [copiedUri, setCopiedUri] = useState(false);

  const sampleUri = 'mongodb+srv://<username>:<password>@cluster0.mongodb.net/smruthi_energy?retryWrites=true&w=majority';

  const handleCopyUri = () => {
    navigator.clipboard.writeText(sampleUri);
    setCopiedUri(true);
    setTimeout(() => setCopiedUri(false), 2000);
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
              MongoDB Atlas & Render Architecture (₹0 Cost)
            </h3>
            <p className="text-xs text-slate-400">
              Enterprise industrial full-stack: Express backend + MongoDB Atlas + Render cloud hosting.
            </p>
          </div>
        </div>

        {/* Status Callout */}
        <div
          className={`p-4 rounded-xl border mb-5 flex items-start gap-3 text-xs ${
            isBackendConnected
              ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
              : 'bg-amber-950/40 border-amber-800 text-amber-300'
          }`}
        >
          {isBackendConnected ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          )}
          <div>
            <div className="font-bold text-sm">
              {isBackendConnected
                ? 'Backend Connected: Synchronizing with MongoDB'
                : 'Operating in Local Demo Mode with Automatic Failover'}
            </div>
            <p className="mt-1 opacity-90 leading-relaxed">
              {isBackendConnected
                ? 'All 21 sections, daily meter logs, transformer records, and plant enquiries are actively persisting to your Express + MongoDB server.'
                : 'The client application is using reactive local storage cache. To connect your live MongoDB Atlas database on Render, follow the instructions below.'}
            </p>
          </div>
        </div>

        {/* Free Tier Limits */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-5 font-mono text-xs">
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-slate-400 block text-[10px]">MongoDB Atlas:</span>
            <span className="text-emerald-400 font-bold">512 MB (Free M0)</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Never Expires</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-slate-400 block text-[10px]">Render Web Service:</span>
            <span className="text-cyan-400 font-bold">750 Free Hours</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Monthly</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-slate-400 block text-[10px]">Initial Cost:</span>
            <span className="text-emerald-400 font-bold">₹0 Forever</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Free Tier Only</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-slate-400 block text-[10px]">Architecture:</span>
            <span className="text-amber-400 font-bold">Full Monorepo</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Unified Port</span>
          </div>
        </div>

        {/* Step-by-Step Setup */}
        <div className="space-y-3 text-xs text-slate-300">
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <div className="font-bold text-white flex items-center gap-1.5">
              <span>1. Create Free MongoDB Atlas Cluster</span>
              <a
                href="https://www.mongodb.com/cloud/atlas/register"
                target="_blank"
                rel="noreferrer"
                className="text-cyan-400 hover:underline inline-flex items-center gap-0.5"
              >
                (mongodb.com <ExternalLink className="w-3 h-3" />)
              </a>
            </div>
            <p className="text-slate-400 font-sans leading-relaxed">
              1. Sign up for free and choose the <strong>M0 Free Cluster</strong> (Shared).<br />
              2. Under <strong>Security → Database Access</strong>, create a user (e.g. <code className="text-cyan-300">smruthi_admin</code>).<br />
              3. Under <strong>Network Access</strong>, click "Add IP Address" and choose <strong>Allow Access from Anywhere (0.0.0.0/0)</strong> so Render can connect.<br />
              4. Click <strong>Connect → Drivers</strong> and copy your Connection String URI.
            </p>

            <div className="relative mt-2">
              <pre className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 font-mono text-[11px] text-amber-300 overflow-x-auto pr-8">
                {sampleUri}
              </pre>
              <button
                onClick={handleCopyUri}
                className="absolute top-2 right-2 p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                title="Copy URI template"
              >
                {copiedUri ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <div className="font-bold text-white flex items-center gap-1.5">
              <span>2. Deploy on Render (Free Plan)</span>
              <a
                href="https://dashboard.render.com"
                target="_blank"
                rel="noreferrer"
                className="text-cyan-400 hover:underline inline-flex items-center gap-0.5"
              >
                (render.com <ExternalLink className="w-3 h-3" />)
              </a>
            </div>
            <p className="text-slate-400 font-sans leading-relaxed">
              1. Sign in to Render with your GitHub account.<br />
              2. Click <strong>New +</strong> → <strong>Web Service</strong>.<br />
              3. Select your repository: <code className="text-cyan-300">pawartejas1707-cloud/smruthi-energy</code>.<br />
              4. Build Command: <code className="text-cyan-300">npm run build</code><br />
              5. Start Command: <code className="text-cyan-300">npm start</code><br />
              6. Under <strong>Environment Variables</strong>, add:<br />
                 • <code className="text-cyan-300">MONGODB_URI</code> = *(your MongoDB Atlas connection string)*<br />
                 • <code className="text-cyan-300">NODE_ENV</code> = <code className="text-cyan-300">production</code><br />
              7. Click <strong>Deploy Web Service</strong>. Render builds the React app and starts the Express + MongoDB server on your free Render URL!
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-800 mt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
