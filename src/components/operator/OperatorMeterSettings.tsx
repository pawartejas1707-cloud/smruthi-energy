import React, { useState, useMemo } from 'react';
import {
  Settings,
  Save,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  Sliders,
  Layers,
  Zap,
  Info,
  X,
  Edit2,
  Database,
  ArrowRight,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Section, Meter } from '../../types';
import { formatUnits } from '../../lib/calculations';

export const OperatorMeterSettings: React.FC = () => {
  const { sections, updateMeter, updateSectionLimit, isBackendConnected } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  // Modal / Inline Edit State
  const [editingMeter, setEditingMeter] = useState<{
    sectionId: string;
    sectionName: string;
    sectionLimit: number;
    meter: Meter;
  } | null>(null);

  const [formKwhMf, setFormKwhMf] = useState<number>(1);
  const [formKvahMf, setFormKvahMf] = useState<number>(1);
  const [formDemandMf, setFormDemandMf] = useState<number>(1);
  const [formMeterName, setFormMeterName] = useState<string>('');
  const [formMeterCode, setFormMeterCode] = useState<string>('');
  const [formDailyLimit, setFormDailyLimit] = useState<number>(1000);
  const [formNotes, setFormNotes] = useState<string>('');
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Filter sections and meters
  const filteredSections = useMemo(() => {
    return sections
      .map((sec) => {
        const matchesCategory =
          selectedCategory === 'all' || sec.category === selectedCategory;
        const matchingMeters = sec.meters.filter(
          (m) =>
            m.meterName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            m.meterCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
            sec.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            sec.code.toLowerCase().includes(searchQuery.toLowerCase())
        );

        if (!matchesCategory) return null;
        if (searchQuery && matchingMeters.length === 0) return null;

        return {
          ...sec,
          meters: searchQuery ? matchingMeters : sec.meters,
        };
      })
      .filter(Boolean) as Section[];
  }, [sections, searchQuery, selectedCategory]);

  const totalMetersCount = useMemo(() => {
    return sections.reduce((acc, s) => acc + s.meters.length, 0);
  }, [sections]);

  const handleOpenEdit = (section: Section, meter: Meter) => {
    setEditingMeter({
      sectionId: section.id,
      sectionName: section.name,
      sectionLimit: section.dailyLimitKwh,
      meter: { ...meter },
    });
    setFormKwhMf(meter.kwhMf);
    setFormKvahMf(meter.kvahMf);
    setFormDemandMf(meter.contractDemandMf);
    setFormMeterName(meter.meterName);
    setFormMeterCode(meter.meterCode);
    setFormDailyLimit(section.dailyLimitKwh);
    setFormNotes(meter.notes || '');
    setSaveSuccess(null);
  };

  const handleSaveMeterSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMeter) return;

    setIsSaving(true);
    try {
      // 1. Update Meter settings in state and DB
      await updateMeter(editingMeter.sectionId, editingMeter.meter.id, {
        meterName: formMeterName.trim(),
        meterCode: formMeterCode.trim(),
        kwhMf: Number(formKwhMf),
        kvahMf: Number(formKvahMf),
        contractDemandMf: Number(formDemandMf),
        notes: formNotes.trim(),
      });

      // 2. Update Section limit if changed
      if (formDailyLimit !== editingMeter.sectionLimit) {
        await updateSectionLimit(editingMeter.sectionId, Number(formDailyLimit));
      }

      setSaveSuccess(
        `Settings for ${formMeterCode} (${formMeterName}) saved permanently! Multiplying factor (MF = ${formKwhMf}) is now applied in Reading Entry.`
      );
      
      setTimeout(() => {
        setSaveSuccess(null);
        setEditingMeter(null);
      }, 2000);
    } catch (err: any) {
      console.error('Failed to update meter settings', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Informational Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 shrink-0">
              <Settings className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                Permanent Meter Configurations & Multiplying Factors (MF)
              </h2>
              <p className="text-xs text-slate-600 mt-1 max-w-3xl leading-relaxed">
                Configure permanent CT/PT Multiplying Factors (MF) for all 21 plant sections.
                These settings are stored permanently in the database and are{' '}
                <strong className="text-slate-900 font-semibold">
                  automatically applied in the Reading Entry Panel
                </strong>{' '}
                to calculate consumed units: <code className="bg-slate-100 px-1.5 py-0.5 rounded text-blue-700 font-mono text-[11px]">Units = (Current - Previous) × MF</code>.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-start md:self-center shrink-0">
            <div className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
              <Database className="w-3.5 h-3.5 text-emerald-600" />
              <span>{isBackendConnected ? 'Connected to MongoDB Atlas' : 'Local Storage Mode'}</span>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold">
              {sections.length} Sections • {totalMetersCount} Meters
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Section, Meter code or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 bg-white"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs text-slate-600 font-medium">Category:</span>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-medium text-slate-800 bg-white focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Categories ({sections.length})</option>
            <option value="manufacturing">Manufacturing (Blocks A, B, C, D, E&G, F)</option>
            <option value="utilities">Utilities & Compressors</option>
            <option value="storage">Storage & QC</option>
            <option value="qa_rd">R&D & Quality</option>
            <option value="general">General & Utilities</option>
          </select>
        </div>
      </div>

      {/* Meters Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
          <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            All 21 Plant Sections — Meter Multiplying Factors & Thresholds
          </div>
          <div className="text-xs text-slate-500">
            Click <span className="font-semibold text-blue-600">"Edit Configuration"</span> to change multiplying factor
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/70 text-slate-700 font-bold border-b border-slate-200">
                <th className="py-3 px-4">#</th>
                <th className="py-3 px-4">Section Name & Code</th>
                <th className="py-3 px-4">Meter Code</th>
                <th className="py-3 px-4">Meter Description</th>
                <th className="py-3 px-4 text-center">
                  <span className="inline-block px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-mono">
                    KWH MF
                  </span>
                </th>
                <th className="py-3 px-4 text-center">
                  <span className="inline-block px-2 py-0.5 rounded bg-cyan-100 text-cyan-800 font-mono">
                    KVAH MF
                  </span>
                </th>
                <th className="py-3 px-4 text-center">Demand MF</th>
                <th className="py-3 px-4 text-right">Daily Limit (kWh)</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSections.map((sec, secIdx) =>
                sec.meters.map((meter, mIdx) => (
                  <tr
                    key={meter.id || `${sec.id}-${mIdx}`}
                    className="hover:bg-blue-50/40 transition-colors"
                  >
                    <td className="py-3 px-4 font-mono text-slate-400">
                      {mIdx === 0 ? secIdx + 1 : ''}
                    </td>
                    <td className="py-3 px-4">
                      {mIdx === 0 ? (
                        <div>
                          <div className="font-bold text-slate-900 text-sm">{sec.name}</div>
                          <div className="text-[11px] text-slate-500 font-mono">{sec.code}</div>
                        </div>
                      ) : (
                        <div className="text-[11px] text-slate-400 pl-2">↳ Aux Meter</div>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-blue-700">
                      {meter.meterCode}
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-medium">
                      <div>{meter.meterName}</div>
                      {meter.notes && (
                        <div className="text-[10px] text-slate-400 italic">{meter.notes}</div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-block font-mono font-bold text-sm px-2.5 py-0.5 rounded-lg bg-blue-50 text-blue-800 border border-blue-200">
                        {meter.kwhMf}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-block font-mono font-bold text-sm px-2.5 py-0.5 rounded-lg bg-cyan-50 text-cyan-800 border border-cyan-200">
                        {meter.kvahMf}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-slate-600 font-semibold">
                      {meter.contractDemandMf}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-800">
                      {formatUnits(sec.dailyLimitKwh)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleOpenEdit(sec, meter)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-600 hover:text-white font-semibold transition-all shadow-sm"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Edit Config</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Meter Settings Modal */}
      {editingMeter && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-blue-600" />
                  Configure Meter Settings & Multiplying Factors
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Section: <strong className="text-slate-800">{editingMeter.sectionName}</strong>
                </p>
              </div>
              <button
                onClick={() => setEditingMeter(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveMeterSettings} className="p-6 space-y-4">
              {saveSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-medium">{saveSuccess}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Meter Code:
                  </label>
                  <input
                    type="text"
                    required
                    value={formMeterCode}
                    onChange={(e) => setFormMeterCode(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Meter Description / Name:
                  </label>
                  <input
                    type="text"
                    required
                    value={formMeterName}
                    onChange={(e) => setFormMeterName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 bg-white"
                  />
                </div>
              </div>

              {/* Crucial Multiplying Factors */}
              <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 space-y-3">
                <div className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-blue-600" />
                  Permanent Multiplying Factors (Directly applied to Reading Entry)
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-blue-800 mb-1">
                      KWH MF (Active Energy):
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      required
                      value={formKwhMf}
                      onChange={(e) => setFormKwhMf(parseFloat(e.target.value) || 1)}
                      className="w-full px-3 py-2 rounded-xl border border-blue-300 text-sm font-mono font-bold text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white"
                    />
                    <span className="text-[10px] text-blue-600 block mt-0.5">
                      Units = Diff × {formKwhMf}
                    </span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-cyan-800 mb-1">
                      KVAH MF (Apparent):
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      required
                      value={formKvahMf}
                      onChange={(e) => setFormKvahMf(parseFloat(e.target.value) || 1)}
                      className="w-full px-3 py-2 rounded-xl border border-cyan-300 text-sm font-mono font-bold text-cyan-900 focus:outline-none focus:ring-2 focus:ring-cyan-200 bg-white"
                    />
                    <span className="text-[10px] text-cyan-600 block mt-0.5">
                      Used for Power Factor
                    </span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-purple-800 mb-1">
                      Demand MF:
                    </label>
                    <input
                      type="number"
                      step="0.05"
                      min="0.1"
                      required
                      value={formDemandMf}
                      onChange={(e) => setFormDemandMf(parseFloat(e.target.value) || 1)}
                      className="w-full px-3 py-2 rounded-xl border border-purple-300 text-sm font-mono font-bold text-purple-900 focus:outline-none focus:ring-2 focus:ring-purple-200 bg-white"
                    />
                    <span className="text-[10px] text-purple-600 block mt-0.5">
                      Contract Demand MF
                    </span>
                  </div>
                </div>
              </div>

              {/* Section Threshold & Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Daily Section Threshold Limit (kWh):
                  </label>
                  <input
                    type="number"
                    step="50"
                    min="100"
                    required
                    value={formDailyLimit}
                    onChange={(e) => setFormDailyLimit(parseFloat(e.target.value) || 1000)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 bg-white"
                  />
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    Daily consumption threshold
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Installation / Feeder Notes:
                  </label>
                  <input
                    type="text"
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    placeholder="e.g. 400A MCC Panel Feeder, Incomer 1"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 bg-white"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setEditingMeter(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 disabled:opacity-50 transition-all"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? 'Saving to Database...' : 'Save Configuration Permanently'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
