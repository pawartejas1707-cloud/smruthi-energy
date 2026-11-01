import React from 'react';
import { useApp } from '../../context/AppContext';
import { Info, Lock, CheckCircle2, AlertOctagon } from 'lucide-react';

export const RoleBanner: React.FC = () => {
  const { currentRole, currentUser } = useApp();

  const roleInfo = {
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
  }[currentRole];

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
