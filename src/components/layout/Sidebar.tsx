import React from 'react';
import {
  LayoutDashboard,
  Zap,
  Cpu,
  Layers,
  FileSpreadsheet,
  AlertTriangle,
  IndianRupee,
  Database,
  ChevronRight,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export type ActiveTab =
  | 'dashboard'
  | 'readings'
  | 'transformers'
  | 'sections'
  | 'reports'
  | 'alerts'
  | 'costing'
  | 'database';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const { alerts, enquiries } = useApp();

  const activeAlertsCount = alerts.filter((a) => a.status === 'active').length;
  const pendingEnquiriesCount = enquiries.filter((e) => e.status === 'pending').length;

  const navItems = [
    {
      id: 'dashboard' as ActiveTab,
      label: 'Admin Dashboard',
      description: 'Summary cards, market graph & sections',
      icon: LayoutDashboard,
    },
    {
      id: 'readings' as ActiveTab,
      label: 'Daily Meter Readings',
      description: 'KWH, KVAH, PF & Demand log',
      icon: Zap,
    },
    {
      id: 'transformers' as ActiveTab,
      label: 'Transformers & Losses',
      description: '750 & 950 KVA loss analysis',
      icon: Cpu,
    },
    {
      id: 'sections' as ActiveTab,
      label: '21 Plant Sections',
      description: 'Limits, meters & multiplying factors',
      icon: Layers,
    },
    {
      id: 'reports' as ActiveTab,
      label: 'Historical Reports',
      description: 'Date filters, CSV & Excel export',
      icon: FileSpreadsheet,
    },
    {
      id: 'alerts' as ActiveTab,
      label: 'Alerts & Enquiries',
      description: 'Limit breaches & admin messages',
      icon: AlertTriangle,
      badge: activeAlertsCount + pendingEnquiriesCount,
    },
    {
      id: 'costing' as ActiveTab,
      label: 'Electricity Costing',
      description: 'Tariffs, ₹/kWh rates & billing',
      icon: IndianRupee,
    },
    {
      id: 'database' as ActiveTab,
      label: 'Supabase & Deploy',
      description: '₹0 Free tier sync & cloud schema',
      icon: Database,
    },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 select-none">
      {/* Navigation Links */}
      <div className="p-3 space-y-1.5 flex-1 overflow-y-auto">
        <div className="px-3 py-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
          Main Navigation
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full group flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all duration-150 ${
                isActive
                  ? 'bg-gradient-to-r from-cyan-950/80 to-slate-850 text-cyan-300 border border-cyan-800/80 shadow-md shadow-cyan-950/30 font-medium'
                  : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`p-1.5 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-cyan-500/20 text-cyan-400'
                      : 'bg-slate-800 text-slate-400 group-hover:text-slate-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="truncate">
                  <div className="text-xs font-semibold truncate leading-tight">
                    {item.label}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate opacity-80">
                    {item.description}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0 ml-2">
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-red-500 text-white">
                    {item.badge}
                  </span>
                )}
                {isActive && <ChevronRight className="w-3.5 h-3.5 text-cyan-400" />}
              </div>
            </button>
          );
        })}
      </div>

      {/* Industrial Substation Info Footer */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/60">
        <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs">
          <div className="flex items-center justify-between text-slate-400 font-medium mb-1">
            <span>HT Incomer:</span>
            <span className="text-cyan-400 font-mono">11 KV / 415 V</span>
          </div>
          <div className="flex items-center justify-between text-slate-400 font-medium mb-1">
            <span>Contract Demand:</span>
            <span className="text-slate-200 font-mono">1200 kVA</span>
          </div>
          <div className="flex items-center justify-between text-slate-400 font-medium">
            <span>Active Transformers:</span>
            <span className="text-emerald-400 font-mono">750 & 950 KVA</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
