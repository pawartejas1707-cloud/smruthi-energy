import React, { useState, useMemo } from 'react';
import { Layers, Search, Cpu, CheckCircle2, Shield, AlertCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatUnits } from '../../lib/calculations';

export const PlantAdminSectionsView: React.FC = () => {
  const { sections } = useApp();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = useMemo(() => {
    return Array.from(new Set(sections.map((s) => s.category)));
  }, [sections]);

  const filtered = useMemo(() => {
    let result = sections;
    if (selectedCategory !== 'all') {
      result = result.filter((s) => s.category === selectedCategory);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.code.toLowerCase().includes(q) ||
          s.description?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [sections, selectedCategory, search]);

  const totalDailyLimit = sections.reduce((sum, s) => sum + s.dailyLimitKwh, 0);
  const totalMeters = sections.reduce((sum, s) => sum + s.meters.length, 0);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
              <Layers className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
              21 Plant Sections & Submeters Directory
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Active industrial feeders, configured energy thresholds, and meter Multiplying Factors (MF).
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 shadow-sm font-medium text-slate-700">
            Total Plant Daily Limit:{' '}
            <span className="font-bold font-mono text-slate-900">
              {formatUnits(totalDailyLimit)} kWh
            </span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 font-bold">
            21 Sections • {totalMeters} Active Meters
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-white border border-slate-200 shadow-sm">
        {/* Category Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-colors ${
              selectedCategory === 'all'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900'
            }`}
          >
            All Categories ({sections.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-colors ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900'
              }`}
            >
              {cat} ({sections.filter((s) => s.category === cat).length})
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-300 text-xs w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search section or meter..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent text-slate-900 placeholder:text-slate-400 font-medium focus:outline-none w-full text-xs"
          />
        </div>
      </div>

      {/* Sections Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((sec) => (
          <div
            key={sec.id}
            className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm hover:border-slate-300 transition-all flex flex-col justify-between"
          >
            <div>
              {/* Header */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 leading-tight">
                    {sec.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-mono text-[11px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                      {sec.code}
                    </span>
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                      {sec.category}
                    </span>
                  </div>
                </div>

                <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold text-[11px] border border-slate-200 shrink-0">
                  {sec.meters.length} Meter{sec.meters.length > 1 ? 's' : ''}
                </span>
              </div>

              <p className="text-xs text-slate-500 mb-3">{sec.description}</p>

              {/* Daily Limit Badge */}
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 mb-3 flex items-center justify-between text-xs">
                <span className="font-medium text-slate-600">Configured Daily Limit:</span>
                <span className="font-mono font-black text-slate-900 text-sm">
                  {formatUnits(sec.dailyLimitKwh)} kWh
                </span>
              </div>

              {/* Submeters List */}
              <div className="space-y-1.5">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Attached Feeder Meters & Multiplying Factors (MF)
                </div>
                {sec.meters.map((mtr) => (
                  <div
                    key={mtr.id}
                    className="p-2 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-slate-900">{mtr.meterName}</div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {mtr.meterCode} • {mtr.meterType}
                      </div>
                    </div>
                    <div className="text-right font-mono text-[11px]">
                      <div className="font-bold text-blue-700">MF: &times;{mtr.kwhMf}</div>
                      <div className="text-[10px] text-slate-500">KVAH: &times;{mtr.kvahMf}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 pt-2 border-t border-slate-100 text-[10px] text-slate-400 flex items-center justify-between">
              <span>Read-only configuration</span>
              <span className="flex items-center gap-1 text-emerald-600 font-bold">
                <CheckCircle2 className="w-3 h-3" /> Active Feeder
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
