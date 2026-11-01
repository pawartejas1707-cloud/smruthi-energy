import React, { useState, useMemo } from 'react';
import { Layers, AlertTriangle, CheckCircle, Mail, Zap, ChevronRight } from 'lucide-react';
import { Section } from '../../types';
import { useApp } from '../../context/AppContext';
import { formatUnits } from '../../lib/calculations';
import { EnquiryModal } from './EnquiryModal';

interface SectionGridProps {
  onSelectSection?: (sectionId: string) => void;
}

export const SectionGrid: React.FC<SectionGridProps> = ({ onSelectSection }) => {
  const { sections, readings, currentRole } = useApp();
  const [enquirySection, setEnquirySection] = useState<{ section: Section; units: number } | null>(
    null
  );
  const [filterMode, setFilterMode] = useState<'all' | 'exceeded' | 'normal'>('all');

  // Compute today's consumption for each section
  const sectionMetrics = useMemo(() => {
    // Determine effective date (today or most recent date)
    const today = new Date().toISOString().split('T')[0];
    let effectiveDate = today;
    const todayReadings = readings.filter((r) => r.date === today);
    if (todayReadings.length === 0 && readings.length > 0) {
      const sortedDates = Array.from(new Set(readings.map((r) => r.date))).sort().reverse();
      effectiveDate = sortedDates[0];
    }

    const currentReadings = readings.filter((r) => r.date === effectiveDate);

    return sections.map((sec) => {
      const secReadings = currentReadings.filter((r) => r.sectionId === sec.id);
      const consumedKwh = secReadings.reduce((sum, r) => sum + r.consumedKwh, 0);
      const isExceeded = consumedKwh > sec.dailyLimitKwh;
      const exceededKwh = isExceeded ? Number((consumedKwh - sec.dailyLimitKwh).toFixed(1)) : 0;
      const exceededPct = isExceeded
        ? Number(((exceededKwh / sec.dailyLimitKwh) * 100).toFixed(1))
        : 0;
      const percentageUsed = Number(((consumedKwh / sec.dailyLimitKwh) * 100).toFixed(1));

      return {
        section: sec,
        consumedKwh: Number(consumedKwh.toFixed(1)),
        isExceeded,
        exceededKwh,
        exceededPct,
        percentageUsed,
        readingsCount: secReadings.length,
        metersCount: sec.meters.length,
      };
    });
  }, [sections, readings]);

  const filteredMetrics = useMemo(() => {
    if (filterMode === 'exceeded') {
      return sectionMetrics.filter((m) => m.isExceeded);
    }
    if (filterMode === 'normal') {
      return sectionMetrics.filter((m) => !m.isExceeded);
    }
    return sectionMetrics;
  }, [sectionMetrics, filterMode]);

  const totalExceededCount = sectionMetrics.filter((m) => m.isExceeded).length;

  return (
    <div className="space-y-4">
      {/* Header and Quick Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-bold text-white tracking-tight">
              Department Sections Monitoring (21 Sections)
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time daily consumption against configured limits. Green = Within Limit, Red = Limit
            Exceeded.
          </p>
        </div>

        {/* Status Filter Buttons */}
        <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1 rounded-lg transition-colors font-medium ${
              filterMode === 'all'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All (21)
          </button>
          <button
            onClick={() => setFilterMode('exceeded')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-colors font-medium ${
              filterMode === 'exceeded'
                ? 'bg-red-950 text-red-300 border border-red-800'
                : 'text-slate-400 hover:text-red-400'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-red-500" />
            Exceeded ({totalExceededCount})
          </button>
          <button
            onClick={() => setFilterMode('normal')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-colors font-medium ${
              filterMode === 'normal'
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                : 'text-slate-400 hover:text-emerald-400'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Within Limit ({21 - totalExceededCount})
          </button>
        </div>
      </div>

      {/* 21 Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3.5">
        {filteredMetrics.map((item) => {
          const { section, consumedKwh, isExceeded, exceededKwh, exceededPct, percentageUsed } =
            item;

          return (
            <div
              key={section.id}
              className={`group relative rounded-2xl p-4 border transition-all duration-200 shadow-md ${
                isExceeded
                  ? 'bg-gradient-to-b from-red-950/40 to-slate-900 border-red-500/80 shadow-red-950/20 hover:border-red-400 ring-1 ring-red-500/30'
                  : 'bg-slate-900 border-slate-800 hover:border-emerald-500/40 shadow-black/20'
              }`}
            >
              {/* Card Top: Name and Limit Status Badge */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="min-w-0">
                  <h4 className="font-bold text-sm text-white truncate group-hover:text-cyan-300 transition-colors">
                    {section.name}
                  </h4>
                  <span className="text-[10px] text-slate-400 font-mono block truncate">
                    {section.code} • {section.meters.length} Meter{section.meters.length > 1 ? 's' : ''}
                  </span>
                </div>

                <div
                  className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 border ${
                    isExceeded
                      ? 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse'
                      : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                  }`}
                >
                  {isExceeded ? (
                    <>
                      <AlertTriangle className="w-2.5 h-2.5" />
                      <span>Exceeded</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-2.5 h-2.5" />
                      <span>Normal</span>
                    </>
                  )}
                </div>
              </div>

              {/* Units & Limit Details */}
              <div className="space-y-1 mb-3">
                <div className="flex items-baseline justify-between">
                  <span className="text-[11px] text-slate-400">Today's Units:</span>
                  <span className="font-mono text-lg font-bold text-white tracking-tight">
                    {formatUnits(consumedKwh)} <span className="text-xs text-slate-400 font-normal">kWh</span>
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400">Daily Limit:</span>
                  <span className="text-amber-400 font-medium">
                    {formatUnits(section.dailyLimitKwh)} kWh
                  </span>
                </div>
              </div>

              {/* Progress Bar of Daily Limit */}
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mb-3">
                <div
                  className={`h-full transition-all duration-300 ${
                    isExceeded ? 'bg-red-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(100, percentageUsed)}%` }}
                />
              </div>

              {/* Exceeded Highlights or Within Limit Summary */}
              {isExceeded ? (
                <div className="p-2 rounded-xl bg-red-950/60 border border-red-800/80 text-[11px] space-y-1">
                  <div className="flex items-center justify-between text-red-300 font-semibold font-mono">
                    <span>Exceeded:</span>
                    <span>+{formatUnits(exceededKwh)} kWh (+{exceededPct}%)</span>
                  </div>

                  {/* Plant Admin or Electrical Admin Action */}
                  <div className="pt-1.5 mt-1 border-t border-red-800/50 flex items-center justify-between">
                    <span className="text-[10px] text-red-400 font-medium">Action Required</span>
                    <button
                      onClick={() => setEnquirySection({ section, units: consumedKwh })}
                      className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-[10px] font-bold shadow-sm transition-colors"
                      title="Send Enquiry to Electrical Admin"
                    >
                      <Mail className="w-3 h-3" />
                      {currentRole === 'plant_admin' ? 'Send Enquiry' : 'View / Enquiry'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span>Capacity Headroom:</span>
                  <span className="text-emerald-400">
                    {formatUnits(Math.max(0, section.dailyLimitKwh - consumedKwh))} kWh
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Enquiry Modal */}
      {enquirySection && (
        <EnquiryModal
          section={enquirySection.section}
          todayUnits={enquirySection.units}
          onClose={() => setEnquirySection(null)}
        />
      )}
    </div>
  );
};
