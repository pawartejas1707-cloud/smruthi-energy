import React from 'react';
import { useApp } from '../../context/AppContext';
import { Info, Lock, CheckCircle2, AlertOctagon, Building2 } from 'lucide-react';
import { UserRole } from '../../types';

export const RoleBanner: React.FC = () => {
  const { currentRole, currentUser } = useApp();

  const roleInfoMap: Record<
    UserRole,
    { title: string; desc: string; icon: React.ComponentType<{ className?: string }>; style: string }
  > = {
    electrical_admin: {
      title: 'Electrical Admin Mode (Full Access)',
      desc: 'You have administrative rights to manage meters, set limits, adjust tariffs, enter/edit readings, and manage system settings.',
      icon: CheckCircle2,
      style: 'bg-amber-950/30 border-amber-800/50 text-amber-300',
    },
    plant_admin: {
      title: 'Plant Admin Mode (Monitoring & Enquiries)',
      desc: 'You can monitor all 21 sections, review daily trends, receive threshold breach alerts, and dispatch direct enquiry emails to Electrical Admin. Editing meter readings & settings is restricted.',
      icon: Info,
      style: 'bg-purple-950/30 border-purple-800/50 text-purple-300',
    },
    reading_operator: {
      title: 'Reading Operator Mode (Daily Entry Only)',
      desc: 'You can input daily meter readings and transformer values. Configuration of multiplying factors, tariffs, and limits is locked.',
      icon: Lock,
      style: 'bg-emerald-950/30 border-emerald-800/50 text-emerald-300',
    },
    viewer: {
      title: 'Viewer Mode (Read-Only)',
      desc: 'Read-only access to plant dashboards, share-market graphs, and historical energy reports. No modification permissions.',
      icon: AlertOctagon,
      style: 'bg-blue-950/30 border-blue-800/50 text-blue-300',
    },
    block_a: {
      title: 'A Block Sub-ID Portal',
      desc: 'Department in-charge view: monitor block energy consumption vs allocated daily limit and submit responses to Plant Admin enquiries.',
      icon: Building2,
      style: 'bg-blue-950/30 border-blue-800/50 text-blue-300',
    },
    block_b: {
      title: 'B Block Sub-ID Portal',
      desc: 'Department in-charge view: monitor block energy consumption vs allocated daily limit and submit responses to Plant Admin enquiries.',
      icon: Building2,
      style: 'bg-indigo-950/30 border-indigo-800/50 text-indigo-300',
    },
    block_c: {
      title: 'C Block Sub-ID Portal',
      desc: 'Department in-charge view: monitor block energy consumption vs allocated daily limit and submit responses to Plant Admin enquiries.',
      icon: Building2,
      style: 'bg-cyan-950/30 border-cyan-800/50 text-cyan-300',
    },
    block_d: {
      title: 'D Block Sub-ID Portal',
      desc: 'Department in-charge view: monitor block energy consumption vs allocated daily limit and submit responses to Plant Admin enquiries.',
      icon: Building2,
      style: 'bg-teal-950/30 border-teal-800/50 text-teal-300',
    },
    block_eg: {
      title: 'E & G Block Sub-ID Portal',
      desc: 'Department in-charge view: monitor block energy consumption vs allocated daily limit and submit responses to Plant Admin enquiries.',
      icon: Building2,
      style: 'bg-amber-950/30 border-amber-800/50 text-amber-300',
    },
    block_f: {
      title: 'F Block Sub-ID Portal',
      desc: 'Department in-charge view: monitor block energy consumption vs allocated daily limit and submit responses to Plant Admin enquiries.',
      icon: Building2,
      style: 'bg-emerald-950/30 border-emerald-800/50 text-emerald-300',
    },
  };

  const roleInfo = roleInfoMap[currentRole] || roleInfoMap.electrical_admin;
  const Icon = roleInfo.icon;

  return (
    <div className={`px-4 py-2 border-b text-xs flex items-center justify-between gap-3 ${roleInfo.style}`}>
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 shrink-0" />
        <div>
          <span className="font-semibold">{roleInfo.title}: </span>
          <span className="opacity-90">{roleInfo.desc}</span>
        </div>
      </div>
      <div className="hidden lg:block shrink-0 text-[11px] opacity-75 font-mono">
        Active User: {currentUser.fullName}
      </div>
    </div>
  );
};
