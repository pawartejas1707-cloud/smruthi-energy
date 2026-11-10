import React, { useState, useEffect } from 'react';
import {
  Zap,
  Settings,
  Database,
  Calendar,
  Clock,
  Shield,
  ChevronDown,
  CheckCircle,
  FileSpreadsheet,
  Cpu,
  User,
  ArrowRightLeft,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';
import { OperatorReadingEntry } from './OperatorReadingEntry';
import { OperatorMeterSettings } from './OperatorMeterSettings';

export const OperatorPortal: React.FC = () => {
  const { currentRole, setCurrentRole, currentUser, isBackendConnected } = useApp();
  const [activeTab, setActiveTab] = useState<'entry' | 'settings'>('entry');
  const [time, setTime] = useState(new Date());
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const roleLabels: Record<UserRole, { label: string; badge: string }> = {
    reading_operator: {
      label: 'Reading Operator',
      badge: 'Reading Entry & Settings',
    },
    electrical_admin: {
      label: 'Electrical Admin',
      badge: 'Full Plant Control',
    },
    plant_admin: {
      label: 'Plant Admin',
      badge: 'Head of Factory',
    },
    viewer: {
      label: 'Viewer',
      badge: 'Read-Only MIS',
    },
    block_a: { label: 'A Block In-Charge', badge: 'Sub-ID' },
    block_b: { label: 'B Block In-Charge', badge: 'Sub-ID' },
    block_c: { label: 'C Block In-Charge', badge: 'Sub-ID' },
    block_d: { label: 'D Block In-Charge', badge: 'Sub-ID' },
    block_eg: { label: 'E & G Block In-Charge', badge: 'Sub-ID' },
    block_f: { label: 'F Block In-Charge', badge: 'Sub-ID' },
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col font-sans antialiased selection:bg-blue-500/20 selection:text-blue-900">
      {/* Top Industrial Header (Light Theme) */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 lg:px-8 py-3 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          {/* Left: Branding & Plant Details */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/20 text-white shrink-0">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base sm:text-lg tracking-tight text-slate-900">
                  SMRUTHI ORGANICS LIMITED
                </span>
                <span className="px-2 py-0.5 text-[11px] font-bold rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                  Unit-1
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Electrical Department • Shift Reading Operator Portal
              </p>
            </div>
          </div>

          {/* Right: Clock, Shift, MongoDB status, Role Switcher */}
          <div className="flex items-center gap-3">
            {/* Live Clock & Shift Badge */}
            <div className="hidden md:flex items-center gap-3 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-medium">
                  {time.toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </div>
              <div className="w-px h-3.5 bg-slate-200" />
              <div className="flex items-center gap-1.5 font-mono text-blue-700 font-semibold">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                <span>
                  {time.toLocaleTimeString('en-IN', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                </span>
              </div>
            </div>

            {/* MongoDB Backend Status Pill */}
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border ${
                isBackendConnected
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}
              title="MongoDB Atlas Database Sync"
            >
              <Database className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">
                {isBackendConnected ? 'MongoDB Atlas Live' : 'Database Ready'}
              </span>
              <div
                className={`w-2 h-2 rounded-full ${
                  isBackendConnected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                }`}
              />
            </div>

            {/* Role Switcher Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-blue-200 bg-blue-50 text-blue-800 hover:bg-blue-100 text-xs font-bold transition-all shadow-sm"
              >
                <Shield className="w-3.5 h-3.5 text-blue-700" />
                <div className="text-left hidden sm:block">
                  <span className="block leading-tight">Reading Operator</span>
                  <span className="text-[10px] text-blue-600 font-normal">Entry & Settings</span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-blue-600 ml-1" />
              </button>

              {roleDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white border border-slate-200 shadow-xl p-2 z-50 animate-in fade-in zoom-in-95 duration-100 max-h-[85vh] overflow-y-auto">
                  <div className="px-3 py-2 border-b border-slate-100 mb-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Switch User Role
                    </p>
                    <p className="text-xs text-slate-700 font-medium truncate mt-0.5">
                      Current: {currentUser.fullName}
                    </p>
                  </div>

                  <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Core Plant Roles
                  </div>
                  <div className="space-y-0.5 mb-2">
                    {(
                      [
                        'reading_operator',
                        'plant_admin',
                        'electrical_admin',
                        'viewer',
                      ] as UserRole[]
                    ).map((role) => (
                      <button
                        key={role}
                        type="button"
                        onClick={() => {
                          setCurrentRole(role);
                          setRoleDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-medium transition-colors text-left ${
                          currentRole === role
                            ? 'bg-blue-50 text-blue-800 border border-blue-200 font-bold'
                            : 'text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <div>
                          <div className="font-semibold">{roleLabels[role].label}</div>
                          <div className="text-[10px] text-slate-500">
                            {roleLabels[role].badge}
                          </div>
                        </div>
                        {currentRole === role && (
                          <CheckCircle className="w-3.5 h-3.5 text-blue-600" />
                        )}
                      </button>
                    ))}
                  </div>

                  <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-t border-slate-100 pt-1.5">
                    Production Block Sub-IDs
                  </div>
                  <div className="space-y-0.5">
                    {(
                      [
                        'block_a',
                        'block_b',
                        'block_c',
                        'block_d',
                        'block_eg',
                        'block_f',
                      ] as UserRole[]
                    ).map((role) => (
                      <button
                        key={role}
                        type="button"
                        onClick={() => {
                          setCurrentRole(role);
                          setRoleDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-medium transition-colors text-left ${
                          currentRole === role
                            ? 'bg-blue-50 text-blue-800 border border-blue-200 font-bold'
                            : 'text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <div>
                          <div className="font-semibold">{roleLabels[role].label}</div>
                          <div className="text-[10px] text-slate-500">
                            {roleLabels[role].badge}
                          </div>
                        </div>
                        {currentRole === role && (
                          <CheckCircle className="w-3.5 h-3.5 text-blue-600" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Operator Tab Navigation (Only Two Clean Tabs!) */}
        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('entry')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'entry'
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Zap className="w-4 h-4" />
              <span>Shift Reading Entry</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'settings'
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Meter Settings & Multiplying Factors (Permanent)</span>
            </button>
          </div>

          <div className="hidden lg:flex items-center gap-2 text-xs text-slate-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Industrial Light Theme Active</span>
          </div>
        </div>
      </header>

      {/* Main Operator Content */}
      <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
        {activeTab === 'entry' && <OperatorReadingEntry />}
        {activeTab === 'settings' && <OperatorMeterSettings />}
      </main>

      {/* Clean Industrial Footer */}
      <footer className="bg-white border-t border-slate-200 px-6 py-3 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-slate-700">Smruthi Organics Ltd. (Unit-1)</span>
          <span>•</span>
          <span>11 KV Incomer Feeder</span>
          <span>•</span>
          <span>750 & 950 KVA Transformers</span>
        </div>
        <div className="font-mono text-slate-400 text-[11px]">
          Electrical Energy Monitoring System • Operator Mode
        </div>
      </footer>
    </div>
  );
};
