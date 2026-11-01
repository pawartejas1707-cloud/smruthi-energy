import React, { useState, useEffect } from 'react';
import {
  Zap,
  Bell,
  Shield,
  Database,
  Calendar,
  Clock,
  ChevronDown,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';

interface HeaderProps {
  onOpenSupabaseModal: () => void;
  onOpenAlerts: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSupabaseModal, onOpenAlerts }) => {
  const { currentRole, setCurrentRole, currentUser, alerts, isSupabaseLive } = useApp();
  const [time, setTime] = useState(new Date());
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const activeAlerts = alerts.filter((a) => a.status === 'active');

  const roleLabels: Record<UserRole, { label: string; color: string; badge: string }> = {
    electrical_admin: {
      label: 'Electrical Admin',
      color: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      badge: 'Full Access',
    },
    plant_admin: {
      label: 'Plant Admin',
      color: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      badge: 'Monitor & Enquiry',
    },
    viewer: {
      label: 'Viewer',
      color: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      badge: 'Read-Only',
    },
    reading_operator: {
      label: 'Reading Operator',
      color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      badge: 'Entry Only',
    },
  };

  return (
    <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 lg:px-6 py-3">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Branding & Plant Details */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-cyan-600 to-amber-500 flex items-center justify-center shadow-lg shadow-cyan-950/50">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight text-white">
                SMRUTHI ORGANICS LIMITED
              </span>
              <span className="hidden sm:inline-block px-2 py-0.5 text-xs font-semibold rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                Unit-1
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">
              Electrical Department • Industrial Energy Monitoring System
            </p>
          </div>
        </div>

        {/* Right: Operational Status, Role Switcher, Alerts */}
        <div className="flex items-center gap-3">
          {/* Shift / Live Clock */}
          <div className="hidden md:flex items-center gap-3 px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/60 text-xs text-slate-300">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>{time.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
            </div>
            <div className="w-px h-3.5 bg-slate-700" />
            <div className="flex items-center gap-1.5 font-mono text-cyan-300">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>{time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
            </div>
            <div className="w-px h-3.5 bg-slate-700" />
            <span className="text-amber-400 font-medium">Shift 1 (08:00 - 16:00)</span>
          </div>

          {/* Supabase Status Pill */}
          <button
            onClick={onOpenSupabaseModal}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              isSupabaseLive
                ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-400 hover:bg-emerald-900/40'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750'
            }`}
            title="Configure Supabase PostgreSQL Connection"
          >
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">
              {isSupabaseLive ? 'Supabase Connected' : 'Supabase Setup (₹0)'}
            </span>
            <div
              className={`w-2 h-2 rounded-full ${
                isSupabaseLive ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`}
            />
          </button>

          {/* Active Alerts Bell */}
          <button
            onClick={onOpenAlerts}
            className="relative p-2 rounded-lg bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-300 transition-colors"
            title="Consumption Alerts"
          >
            <Bell className="w-4 h-4" />
            {activeAlerts.length > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-lg animate-pulse">
                {activeAlerts.length}
              </span>
            )}
          </button>

          {/* Role Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                roleLabels[currentRole].color
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <div className="text-left hidden sm:block">
                <span className="font-semibold block leading-tight">
                  {roleLabels[currentRole].label}
                </span>
                <span className="text-[10px] opacity-75">{roleLabels[currentRole].badge}</span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 ml-1 opacity-70" />
            </button>

            {roleDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-2 border-b border-slate-800 mb-1">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Simulate User Role (4 Roles)
                  </p>
                  <p className="text-xs text-slate-300 font-medium truncate mt-0.5">
                    {currentUser.fullName}
                  </p>
                </div>

                <div className="space-y-1">
                  {(
                    [
                      'electrical_admin',
                      'plant_admin',
                      'reading_operator',
                      'viewer',
                    ] as UserRole[]
                  ).map((role) => (
                    <button
                      key={role}
                      onClick={() => {
                        setCurrentRole(role);
                        setRoleDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors text-left ${
                        currentRole === role
                          ? 'bg-cyan-950/60 text-cyan-300 border border-cyan-800/80'
                          : 'text-slate-300 hover:bg-slate-800/80'
                      }`}
                    >
                      <div>
                        <div className="font-semibold">{roleLabels[role].label}</div>
                        <div className="text-[10px] text-slate-400">
                          {roleLabels[role].badge}
                        </div>
                      </div>
                      {currentRole === role && (
                        <CheckCircle className="w-3.5 h-3.5 text-cyan-400" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
