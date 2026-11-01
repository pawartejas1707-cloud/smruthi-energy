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
import { useApp } from '../../context/AppContext';

export const DatabaseView: React.FC<{ onOpenConfigModal: () => void }> = ({ onOpenConfigModal }) => {
  const { isBackendConnected, resetToDefaultData } = useApp();
  const [copiedEnv, setCopiedEnv] = useState(false);
  const [copiedRenderYaml, setCopiedRenderYaml] = useState(false);

  const envSample = `# SMRUTHI ORGANICS – ELECTRICAL DEPARTMENT
# MongoDB Atlas & Render Environment Variables
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/smruthi_energy?retryWrites=true&w=majority
PORT=5000
NODE_ENV=production
`;

  const renderYamlSample = `services:
  - type: web
    name: smruthi-energy-portal
    env: node
    plan: free
    buildCommand: npm run build
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: MONGODB_URI
        sync: false
`;

  const handleCopyEnv = () => {
    navigator.clipboard.writeText(envSample);
    setCopiedEnv(true);
    setTimeout(() => setCopiedEnv(false), 2000);
  };

  const handleCopyRenderYaml = () => {
    navigator.clipboard.writeText(renderYamlSample);
    setCopiedRenderYaml(true);
    setTimeout(() => setCopiedRenderYaml(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Server className="w-5 h-5 text-emerald-400" />
            MongoDB Atlas & Render Backend Architecture (₹0 Cost)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Production deployment guide for Node.js Express API + MongoDB Atlas + Render Free Tier Web Service.
          </p>
        </div>

        <button
          onClick={onOpenConfigModal}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white shadow-lg shadow-emerald-950/40 transition-all self-start sm:self-auto"
        >
          <Database className="w-4 h-4" />
          {isBackendConnected ? 'MongoDB Live (Connected)' : 'Configure MongoDB & Render'}
        </button>
      </div>

      {/* Free Tier Cost & Limits Verification Table */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-xl space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          Free-Tier Technologies & Resource Verification
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
          {/* MongoDB Atlas */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-emerald-400">MongoDB Atlas (M0)</span>
              <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 text-[10px] border border-emerald-800">
                ₹0 Forever
              </span>
            </div>
            <ul className="space-y-1 text-slate-400 font-sans text-xs">
              <li>• 512 MB permanent cloud document storage</li>
              <li>• Automated daily backups & replica set</li>
              <li>• SSL TLS 1.3 encrypted cluster connection</li>
              <li>• Supports 10+ years of daily 21-section entries</li>
            </ul>
          </div>

          {/* Render Web Service */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-cyan-400">Render Free Web Service</span>
              <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 text-[10px] border border-cyan-800">
                ₹0 / month
              </span>
            </div>
            <ul className="space-y-1 text-slate-400 font-sans text-xs">
              <li>• 750 free instance hours / month</li>
              <li>• Automated CI/CD directly from GitHub repo</li>
              <li>• Free managed SSL certificate & custom domain</li>
              <li>• Runs Express server + serves React bundle</li>
            </ul>
          </div>

          {/* Multi-PC Sync */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-400">Plant-Wide Sync</span>
              <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 text-[10px] border border-amber-800">
                REST API
              </span>
            </div>
            <ul className="space-y-1 text-slate-400 font-sans text-xs">
              <li>• Unified Node.js backend port</li>
              <li>• Reading operator logs from substation tablet</li>
              <li>• Plant Admin views real-time graphs instantly</li>
              <li>• Zero CORS configuration required</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Step by Step Deployment Guide */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-xl space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Terminal className="w-4 h-4 text-cyan-400" />
          Production Deployment on Render + MongoDB Atlas
        </h3>

        <div className="space-y-3 text-xs text-slate-300">
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
            <div className="font-bold text-white">Step 1: Create MongoDB Atlas Cluster (Free M0)</div>
            <p className="text-slate-400 leading-relaxed font-sans">
              1. Sign up at <a href="https://mongodb.com" target="_blank" rel="noreferrer" className="text-cyan-400 underline">mongodb.com</a> and create a free <strong>M0 Shared Cluster</strong>.<br />
              2. Go to <strong>Security → Database Access</strong>: Create a database username & password.<br />
              3. Go to <strong>Security → Network Access</strong>: Add IP Address <code className="text-cyan-300">0.0.0.0/0</code> (Allow Access from Anywhere).<br />
              4. Click <strong>Connect → Drivers</strong>: Copy the connection string URI.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
            <div className="font-bold text-white">Step 2: Environment Variables Template</div>
            <p className="text-slate-400 leading-relaxed font-sans">
              Set these variables in your Render Web Service settings (or in <code className="text-cyan-300">.env</code> locally):
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

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
            <div className="font-bold text-white">Step 3: Deploy on Render.com (₹0 Cost)</div>
            <p className="text-slate-400 leading-relaxed font-sans">
              1. Go to <a href="https://render.com" target="_blank" rel="noreferrer" className="text-cyan-400 underline">render.com</a> and sign in with GitHub.<br />
              2. Click <strong>New +</strong> → <strong>Web Service</strong>.<br />
              3. Connect your repository: <code className="text-cyan-300">pawartejas1707-cloud/smruthi-energy</code>.<br />
              4. Set <strong>Build Command</strong>: <code className="text-cyan-300">npm run build</code><br />
              5. Set <strong>Start Command</strong>: <code className="text-cyan-300">npm start</code><br />
              6. Under <strong>Environment Variables</strong>, add your <code className="text-cyan-300">MONGODB_URI</code> and <code className="text-cyan-300">NODE_ENV=production</code>.<br />
              7. Click <strong>Deploy Web Service</strong>. Render will build the React frontend, compile the Express server, connect to MongoDB Atlas, seed all 21 sections, and serve the application live!
            </p>
          </div>
        </div>
      </div>

      {/* Reset Simulation State */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-xl flex items-center justify-between">
        <div>
          <h4 className="text-sm font-bold text-white">Reset Local Simulation Cache</h4>
          <p className="text-xs text-slate-400 mt-0.5">
            Clear browser storage and reload default 21 sections & 30-day realistic readings.
          </p>
        </div>
        <button
          onClick={() => {
            if (confirm('Reset simulation data to default initial state?')) {
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
