import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Cpu,
  Layers,
  AlertTriangle,
  Zap,
  Calendar,
  Clock,
  Shield,
  ChevronDown,
  CheckCircle,
  Bell,
  Info,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';
import { PlantAdminSummaryCards } from './PlantAdminSummaryCards';
import { PlantAdminConsumptionTrend } from './PlantAdminConsumptionTrend';
import { PlantAdminSectionGrid } from './PlantAdminSectionGrid';
import { PlantAdminTransformers } from './PlantAdminTransformers';
import { PlantAdminSectionsView } from './PlantAdminSectionsView';
import { PlantAdminAlerts } from './PlantAdminAlerts';

export type PlantAdminTab = 'dashboard' | 'transformers' | 'sections' | 'alerts';

export const PlantAdminPortal: React.FC = () => {
  const { currentRole, setCurrentRole, currentUser, alerts, enquiries } = useApp();
  const [activeTab, setActiveTab] = useState<PlantAdminTab>('dashboard');
  const [time, setTime] = useState(new Date());
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const activeAlertsCount = alerts.filter((a) => a.status === 'active').length;
  const pendingEnquiriesCount = enquiries.filter((e) => e.status === 'pending').length;
  const totalAlertBadge = activeAlertsCount + pendingEnquiriesCount;

  const roleLabels: Record<UserRole, { label: string; badge: string; color: string }> = {
    plant_admin: {
      label: 'Plant Admin',
      badge: 'Head of Factory',
      color: 'bg-purple-100 text-purple-800 border-purple-300',
    },
    electrical_admin: {
      label: 'Electrical Admin',
      badge: 'Chief Electrical Eng.',
      color: 'bg-amber-100 text-amber-800 border-amber-300',
    },
    reading_operator: {
      label: 'Reading Operator',
      badge: 'Reading Entry & Settings',
      color: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    },
    viewer: {
      label: 'Viewer',
      badge: 'Read-Only MIS',
      color: 'bg-blue-100 text-blue-800 border-blue-300',
    },
  };

  const navItems = [
    {
      id: 'dashboard' as PlantAdminTab,
      label: 'Executive Overview',
      description: 'KPIs, Consumption Trend & 21 Sections',
      icon: LayoutDashboard,
    },
    {
      id: 'transformers' as PlantAdminTab,
      label: 'Transformers & Losses',
      description: '750 & 950 KVA Substation Efficiency',
      icon: Cpu,
    },
    {
      id: 'sections' as PlantAdminTab,
      label: '21 Plant Sections',
      description: 'Industrial Feeders, Limits & MF',
      icon: Layers,
    },
    {
      id: 'alerts' as PlantAdminTab,
      label: 'Alerts & Enquiries',
      description: 'Threshold Breaches & Dept Enquiries',
      icon: AlertTriangle,
      badge: totalAlertBadge,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col font-sans antialiased selection:bg-blue-500/20 selection:text-blue-900">
      {/* Top Industrial Header (Executive Light Theme) */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 lg:px-8 py-3 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          {/* Left: Factory Identity & Branding */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-700 to-indigo-600 flex items-center justify-center shadow-md shadow-purple-500/20 text-white shrink-0">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base sm:text-lg tracking-tight text-slate-900">
                  SMRUTHI ORGANICS LIMITED
                </span>
                <span className="px-2 py-0.5 text-[11px] font-bold rounded-md bg-purple-50 text-purple-700 border border-purple-200">
                  Unit-1
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Head of Factory • Plant Admin Executive Portal
              </p>
            </div>
          </div>

          {/* Right: Date, Clock, Shift, Alerts, Role Switcher */}
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
              <div className="flex items-center gap-1.5 font-mono text-purple-700 font-semibold">
                <Clock className="w-3.5 h-3.5 text-purple-600" />
                <span>
                  {time.toLocaleTimeString('en-IN', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                </span>
              </div>
              <div className="w-px h-3.5 bg-slate-200" />
              <span className="text-amber-700 font-bold">Shift 1 (08:00 - 16:00)</span>
            </div>

            {/* Quick Alerts Button */}
            <button
              onClick={() => setActiveTab('alerts')}
              className="relative p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 transition-colors"
              title="Alerts and Enquiries"
            >
              <Bell className="w-4 h-4" />
              {totalAlertBadge > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white shadow-sm animate-pulse">
                  {totalAlertBadge}
                </span>
              )}
            </button>

            {/* Role Switcher Dropdown */}
            <div className="relative">
              <button
                onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-sm ${roleLabels[currentRole].color}`}
              >
                <Shield className="w-3.5 h-3.5" />
                <div className="text-left hidden sm:block">
                  <span className="block leading-tight">{roleLabels[currentRole].label}</span>
                  <span className="text-[10px] opacity-75 font-normal">
                    {roleLabels[currentRole].badge}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 ml-1 opacity-70" />
              </button>

              {roleDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white border border-slate-200 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3 py-2 border-b border-slate-100 mb-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Simulate User Role
                    </p>
                    <p className="text-xs text-slate-800 font-bold truncate mt-0.5">
                      {currentUser.fullName}
                    </p>
                  </div>

                  <div className="space-y-1">
                    {(
                      [
                        'plant_admin',
                        'electrical_admin',
                        'reading_operator',
                        'viewer',
                      ] as UserRole[]
                    ).map((r) => (
                      <button
                        key={r}
                        onClick={() => {
                          setCurrentRole(r);
                          setRoleDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-colors text-left ${
                          currentRole === r
                            ? 'bg-purple-50 text-purple-800 border border-purple-200'
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div>
                          <div>{roleLabels[r].label}</div>
                          <div className="text-[10px] text-slate-400 font-normal">
                            {roleLabels[r].badge}
                          </div>
                        </div>
                        {currentRole === r && (
                          <CheckCircle className="w-3.5 h-3.5 text-purple-600" />
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

      {/* Role Banner */}
      <div className="px-4 lg:px-8 py-2 bg-purple-50/70 border-b border-purple-200 text-xs text-purple-900 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-purple-700 shrink-0" />
          <div>
            <span className="font-extrabold">Plant Admin Mode (Head of Factory): </span>
            <span className="text-purple-800 font-medium">
              Real-time monitoring across 21 plant sections, consumption trends, and substation transformer efficiency. Daily reading entry, costing, and database configs are restricted.
            </span>
          </div>
        </div>
        <div className="hidden lg:block shrink-0 text-[11px] font-mono text-purple-700 font-semibold">
          Active Executive: {currentUser.fullName}
        </div>
      </div>

      {/* Main Navigation Tab Bar */}
      <div className="bg-white border-b border-slate-200 px-4 lg:px-8 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center gap-1 sm:gap-2 overflow-x-auto py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      isActive ? 'bg-white text-purple-700' : 'bg-red-500 text-white'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Dynamic Main Body Content */}
      <main className="flex-1 p-4 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* 1. Summary Cards (No costing card) */}
            <PlantAdminSummaryCards />

            {/* 2. Consumption Trend (Renamed from Share-Market) */}
            <PlantAdminConsumptionTrend />

            {/* 3. Department Sections Monitoring (Day/Week/Month/Year filters, No Capacity Headroom) */}
            <PlantAdminSectionGrid />
          </div>
        )}

        {activeTab === 'transformers' && <PlantAdminTransformers />}

        {activeTab === 'sections' && <PlantAdminSectionsView />}

        {activeTab === 'alerts' && <PlantAdminAlerts />}
      </main>
    </div>
  );
};
