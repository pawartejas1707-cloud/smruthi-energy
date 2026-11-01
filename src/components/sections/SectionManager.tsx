import React, { useState } from 'react';
import {
  Layers,
  Settings,
  Plus,
  Edit2,
  Check,
  X,
  Zap,
  ShieldAlert,
  Save,
  Sliders,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Section, Meter } from '../../types';
import { formatUnits } from '../../lib/calculations';

export const SectionManager: React.FC = () => {
  const { sections, updateSectionLimit, addMeterToSection, updateMeter, currentRole } = useApp();

  const isElectricalAdmin = currentRole === 'electrical_admin';

  // Section limit editing state
  const [editingLimitSectionId, setEditingLimitSectionId] = useState<string | null>(null);
  const [tempLimit, setTempLimit] = useState<number>(0);

  // Meter configuration modal state
  const [activeSectionForMeter, setActiveSectionForMeter] = useState<Section | null>(null);
  const [isAddMeterModalOpen, setIsAddMeterModalOpen] = useState(false);
  const [newMeterCode, setNewMeterCode] = useState('');
  const [newMeterName, setNewMeterName] = useState('');
  const [newMeterType, setNewMeterType] = useState<'main' | 'submeter'>('submeter');
  const [newKwhMf, setNewKwhMf] = useState<number>(20);
  const [newKvahMf, setNewKvahMf] = useState<number>(20);
  const [newDemandMf, setNewDemandMf] = useState<number>(0.5);
  const [newNotes, setNewNotes] = useState('');

  // Meter edit state
  const [editingMeterId, setEditingMeterId] = useState<string | null>(null);
  const [tempMeterMf, setTempMeterMf] = useState<{ kwhMf: number; kvahMf: number; demandMf: number }>({
    kwhMf: 1,
    kvahMf: 1,
    demandMf: 1,
  });

  const handleStartEditLimit = (sec: Section) => {
    if (!isElectricalAdmin) return;
    setEditingLimitSectionId(sec.id);
    setTempLimit(sec.dailyLimitKwh);
  };

  const handleSaveLimit = async (sectionId: string) => {
    if (tempLimit <= 0) return;
    await updateSectionLimit(sectionId, tempLimit);
    setEditingLimitSectionId(null);
  };

  const handleAddMeterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSectionForMeter || !newMeterCode || !newMeterName) return;

    await addMeterToSection(activeSectionForMeter.id, {
      sectionId: activeSectionForMeter.id,
      meterCode: newMeterCode.trim().toUpperCase(),
      meterName: newMeterName.trim(),
      meterType: newMeterType,
      kwhMf: Number(newKwhMf),
      kvahMf: Number(newKvahMf),
      contractDemandMf: Number(newDemandMf),
      isActive: true,
      notes: newNotes,
    });

    setIsAddMeterModalOpen(false);
    setNewMeterCode('');
    setNewMeterName('');
  };

  const handleStartEditMeter = (m: Meter) => {
    if (!isElectricalAdmin) return;
    setEditingMeterId(m.id);
    setTempMeterMf({
      kwhMf: m.kwhMf,
      kvahMf: m.kvahMf,
      demandMf: m.contractDemandMf,
    });
  };

  const handleSaveMeter = async (sectionId: string, meterId: string) => {
    await updateMeter(sectionId, meterId, {
      kwhMf: tempMeterMf.kwhMf,
      kvahMf: tempMeterMf.kvahMf,
      contractDemandMf: tempMeterMf.demandMf,
    });
    setEditingMeterId(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Layers className="w-5 h-5 text-cyan-400" />
            21 Department Sections & Meter Configuration
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure daily consumption limits (kWh), multiplying factors (MF), and add new submeters.
          </p>
        </div>

        {!isElectricalAdmin && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-300">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <span>Configuration locked for {currentRole.replace('_', ' ').toUpperCase()} (Electrical Admin Only)</span>
          </div>
        )}
      </div>

      {/* 21 Sections List */}
      <div className="space-y-4">
        {sections.map((sec, index) => {
          const isEditingLimit = editingLimitSectionId === sec.id;

          return (
            <div
              key={sec.id}
              className="rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-lg space-y-4"
            >
              {/* Section Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-lg bg-cyan-950 text-cyan-400 border border-cyan-800 flex items-center justify-center font-mono font-bold text-xs">
                    {index + 1}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-white">{sec.name}</h3>
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[11px] border border-slate-700">
                        {sec.code}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{sec.description}</p>
                  </div>
                </div>

                {/* Section Daily Limit Setting */}
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-[11px] text-slate-400 block">Daily Limit (kWh):</span>
                    {isEditingLimit ? (
                      <div className="flex items-center gap-1 mt-1">
                        <input
                          type="number"
                          value={tempLimit}
                          onChange={(e) => setTempLimit(parseFloat(e.target.value) || 0)}
                          className="w-24 px-2 py-1 rounded bg-slate-850 border border-cyan-500 text-white font-mono text-xs focus:outline-none"
                        />
                        <button
                          onClick={() => handleSaveLimit(sec.id)}
                          className="p-1 rounded bg-emerald-600 text-white hover:bg-emerald-500"
                          title="Save Limit"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setEditingLimitSectionId(null)}
                          className="p-1 rounded bg-slate-800 text-slate-400 hover:text-white"
                          title="Cancel"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-base font-bold font-mono text-amber-400">
                          {formatUnits(sec.dailyLimitKwh)} kWh
                        </span>
                        {isElectricalAdmin && (
                          <button
                            onClick={() => handleStartEditLimit(sec)}
                            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                            title="Edit Section Daily Limit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Add Meter Button */}
                  {isElectricalAdmin && (
                    <button
                      onClick={() => {
                        setActiveSectionForMeter(sec);
                        setIsAddMeterModalOpen(true);
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-xs font-semibold text-cyan-300 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Meter
                    </button>
                  )}
                </div>
              </div>

              {/* Meters Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="pb-2">Meter Code</th>
                      <th className="pb-2">Meter Description</th>
                      <th className="pb-2">Type</th>
                      <th className="pb-2 text-amber-400">KWH MF</th>
                      <th className="pb-2 text-cyan-400">KVAH MF</th>
                      <th className="pb-2 text-purple-400">Demand MF</th>
                      <th className="pb-2">Status</th>
                      {isElectricalAdmin && <th className="pb-2 text-right">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {sec.meters.map((m) => {
                      const isEditingMeter = editingMeterId === m.id;

                      return (
                        <tr key={m.id} className="text-slate-300 hover:bg-slate-800/40">
                          <td className="py-2.5 font-bold text-white">{m.meterCode}</td>
                          <td className="py-2.5 text-slate-300 font-sans">{m.meterName}</td>
                          <td className="py-2.5 capitalize text-slate-400">{m.meterType}</td>

                          {isEditingMeter ? (
                            <>
                              <td className="py-2">
                                <input
                                  type="number"
                                  step="0.5"
                                  value={tempMeterMf.kwhMf}
                                  onChange={(e) =>
                                    setTempMeterMf({
                                      ...tempMeterMf,
                                      kwhMf: parseFloat(e.target.value) || 1,
                                    })
                                  }
                                  className="w-16 px-1.5 py-0.5 rounded bg-slate-850 border border-cyan-500 text-xs text-white"
                                />
                              </td>
                              <td className="py-2">
                                <input
                                  type="number"
                                  step="0.5"
                                  value={tempMeterMf.kvahMf}
                                  onChange={(e) =>
                                    setTempMeterMf({
                                      ...tempMeterMf,
                                      kvahMf: parseFloat(e.target.value) || 1,
                                    })
                                  }
                                  className="w-16 px-1.5 py-0.5 rounded bg-slate-850 border border-cyan-500 text-xs text-white"
                                />
                              </td>
                              <td className="py-2">
                                <input
                                  type="number"
                                  step="0.05"
                                  value={tempMeterMf.demandMf}
                                  onChange={(e) =>
                                    setTempMeterMf({
                                      ...tempMeterMf,
                                      demandMf: parseFloat(e.target.value) || 1,
                                    })
                                  }
                                  className="w-16 px-1.5 py-0.5 rounded bg-slate-850 border border-cyan-500 text-xs text-white"
                                />
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="py-2.5 font-bold text-amber-400">{m.kwhMf}</td>
                              <td className="py-2.5 font-bold text-cyan-400">{m.kvahMf}</td>
                              <td className="py-2.5 font-bold text-purple-400">
                                {m.contractDemandMf}
                              </td>
                            </>
                          )}

                          <td className="py-2.5">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              Active
                            </span>
                          </td>

                          {isElectricalAdmin && (
                            <td className="py-2.5 text-right">
                              {isEditingMeter ? (
                                <div className="flex items-center justify-end gap-1">
                                  <button
                                    onClick={() => handleSaveMeter(sec.id, m.id)}
                                    className="p-1 rounded bg-emerald-600 text-white hover:bg-emerald-500"
                                    title="Save MF Changes"
                                  >
                                    <Check className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={() => setEditingMeterId(null)}
                                    className="p-1 rounded bg-slate-800 text-slate-400 hover:text-white"
                                    title="Cancel"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => handleStartEditMeter(m)}
                                  className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-750 text-[11px] text-cyan-300 font-sans"
                                >
                                  Configure MF
                                </button>
                              )}
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Meter Modal */}
      {isAddMeterModalOpen && activeSectionForMeter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-6 relative">
            <button
              onClick={() => setIsAddMeterModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <form onSubmit={handleAddMeterSubmit} className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-white">Add New Meter</h3>
                <p className="text-xs text-slate-400">
                  Configure meter in {activeSectionForMeter.name} ({activeSectionForMeter.code})
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Meter Code (e.g. MTR-A3):
                </label>
                <input
                  type="text"
                  required
                  placeholder="MTR-..."
                  value={newMeterCode}
                  onChange={(e) => setNewMeterCode(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white uppercase font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Meter Name / Feeder Description:
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Auxiliary Vacuum Pump Feeder"
                  value={newMeterName}
                  onChange={(e) => setNewMeterName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-amber-400 mb-1">
                    KWH MF:
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={newKwhMf}
                    onChange={(e) => setNewKwhMf(parseFloat(e.target.value) || 1)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-cyan-400 mb-1">
                    KVAH MF:
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={newKvahMf}
                    onChange={(e) => setNewKvahMf(parseFloat(e.target.value) || 1)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-purple-400 mb-1">
                    Demand MF:
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    required
                    value={newDemandMf}
                    onChange={(e) => setNewDemandMf(parseFloat(e.target.value) || 1)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Installation / Location Notes:
                </label>
                <input
                  type="text"
                  placeholder="e.g. Substation Panel Bay 4"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddMeterModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-xs font-bold text-slate-950 shadow-lg"
                >
                  Save Meter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
