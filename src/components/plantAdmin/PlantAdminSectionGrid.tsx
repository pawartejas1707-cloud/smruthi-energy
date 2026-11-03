import React, { useState, useMemo } from 'react';
import { Layers, AlertTriangle, CheckCircle, Mail, Search, Calendar, Filter } from 'lucide-react';
import { Section } from '../../types';
import { useApp } from '../../context/AppContext';
import { formatUnits } from '../../lib/calculations';
import { EnquiryModal } from '../dashboard/EnquiryModal';

export type SectionTimeframe = 'day' | 'week' | 'month' | 'year';

export const PlantAdminSectionGrid: React.FC = () => {
  const { sections, readings } = useApp();
  const [timeframe, setTimeframe] = useState<SectionTimeframe>('day');
  const [filterMode, setFilterMode] = useState<'all' | 'exceeded' | 'normal'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [enquirySection, setEnquirySection] = useState<{ section: Section; units: number } | null>(
    null
  );

  // Group readings and calculate timeframe consumption
  const { metrics, periodLabel, multiplier } = useMemo(() => {
    // 1. Identify distinct sorted dates in readings
    const sortedDates = Array.from(new Set(readings.map((r) => r.date))).sort();
    const latestDate = sortedDates[sortedDates.length - 1] || new Date().toISOString().split('T')[0];

    let targetDates: string[] = [];
    let periodLabelStr = '';
    let factor = 1;

    if (timeframe === 'day') {
      targetDates = [latestDate];
      periodLabelStr = `Day-wise: Today (${latestDate})`;
      factor = 1;
    } else if (timeframe === 'week') {
      targetDates = sortedDates.slice(-7);
      periodLabelStr = `Week-wise: Last 7 Days (${targetDates[0] || latestDate} to ${latestDate})`;
      factor = 7;
    } else if (timeframe === 'month') {
      targetDates = sortedDates.slice(-30);
      periodLabelStr = `Month-wise: Last 30 Days (${targetDates[0] || latestDate} to ${latestDate})`;
      factor = 30;
    } else if (timeframe === 'year') {
      targetDates = sortedDates.slice(-365);
      const daysCount = Math.max(targetDates.length, 30);
      periodLabelStr = `Year-wise: Annual Cumulative (${targetDates.length} Days Recorded)`;
      factor = daysCount;
    }

    const targetDateSet = new Set(targetDates);
    const filteredReadings = readings.filter((r) => targetDateSet.has(r.date));

    // Calculate consumption per section for the chosen timeframe
    const sectionMetricsList = sections.map((sec) => {
      const secReadings = filteredReadings.filter((r) => r.sectionId === sec.id);
      const consumedKwh = secReadings.reduce((sum, r) => sum + r.consumedKwh, 0);

      // Period limit = dailyLimitKwh * timeframe multiplier
      const periodLimit = sec.dailyLimitKwh * factor;
      const isExceeded = consumedKwh > periodLimit;
      const exceededKwh = isExceeded ? Number((consumedKwh - periodLimit).toFixed(1)) : 0;
      const exceededPct = isExceeded
        ? Number(((exceededKwh / periodLimit) * 100).toFixed(1))
        : 0;
      const percentageUsed = periodLimit > 0 ? Number(((consumedKwh / periodLimit) * 100).toFixed(1)) : 0;

      return {
        section: sec,
        consumedKwh: Number(consumedKwh.toFixed(1)),
        periodLimit: Number(periodLimit.toFixed(1)),
        isExceeded,
        exceededKwh,
        exceededPct,
        percentageUsed,
        readingsCount: secReadings.length,
        metersCount: sec.meters.length,
      };
    });

    return {
      metrics: sectionMetricsList,
      periodLabel: periodLabelStr,
      multiplier: factor,
    };
  }, [sections, readings, timeframe]);

  // Apply search and status filters
  const filteredMetrics = useMemo(() => {
    let result = metrics;

    if (filterMode === 'exceeded') {
      result = result.filter((m) => m.isExceeded);
    } else if (filterMode === 'normal') {
      result = result.filter((m) => !m.isExceeded);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (m) =>
          m.section.name.toLowerCase().includes(q) ||
          m.section.code.toLowerCase().includes(q) ||
          m.section.description?.toLowerCase().includes(q)
      );
    }

    return result;
  }, [metrics, filterMode, searchQuery]);

  const totalExceededCount = metrics.filter((m) => m.isExceeded).length;
  const totalNormalCount = metrics.length - totalExceededCount;

  return (
    <div className="space-y-4">
      {/* Header and Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-2">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="text-base lg:text-lg font-extrabold text-slate-900 tracking-tight">
              Department Sections Monitoring (21 Sections)
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {periodLabel} • Real-time telemetry monitoring against configured thresholds.
          </p>
        </div>

        {/* Action Controls: Timeframe selector & Filter buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Requirement 3: Day wise, Week wise, Month wise, Year wise */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            <button
              onClick={() => setTimeframe('day')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                timeframe === 'day'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Day-wise
            </button>
            <button
              onClick={() => setTimeframe('week')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                timeframe === 'week'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Week-wise
            </button>
            <button
              onClick={() => setTimeframe('month')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                timeframe === 'month'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Month-wise
            </button>
            <button
              onClick={() => setTimeframe('year')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                timeframe === 'year'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Year-wise
            </button>
          </div>

          {/* Status Filter Buttons */}
          <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200 text-xs shadow-sm">
            <button
              onClick={() => setFilterMode('all')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
                filterMode === 'all'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All (21)
            </button>
            <button
              onClick={() => setFilterMode('exceeded')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold transition-colors ${
                filterMode === 'exceeded'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-red-600'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-red-500" />
              Exceeded ({totalExceededCount})
            </button>
            <button
              onClick={() => setFilterMode('normal')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold transition-colors ${
                filterMode === 'normal'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-emerald-600'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Within Limit ({totalNormalCount})
            </button>
          </div>

          {/* Quick Search */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 text-xs shadow-sm">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search section..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-slate-900 placeholder:text-slate-400 font-medium focus:outline-none w-28 sm:w-36 text-xs"
            />
          </div>
        </div>
      </div>

      {/* 21 Cards Grid (Industrial Light Theme) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3.5">
        {filteredMetrics.map((item) => {
          const {
            section,
            consumedKwh,
            periodLimit,
            isExceeded,
            exceededKwh,
            exceededPct,
            percentageUsed,
          } = item;

          return (
            <div
              key={section.id}
              className={`group relative rounded-2xl p-4 border transition-all duration-200 shadow-sm ${
                isExceeded
                  ? 'bg-red-50/40 border-red-300 hover:border-red-400 ring-1 ring-red-400/20'
                  : 'bg-white border-slate-200 hover:border-blue-300'
              }`}
            >
              {/* Card Top: Name and Limit Status Badge */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="min-w-0">
                  <h4 className="font-extrabold text-sm text-slate-900 truncate group-hover:text-blue-700 transition-colors">
                    {section.name}
                  </h4>
                  <span className="text-[10px] text-slate-500 font-mono block truncate font-medium">
                    {section.code} • {section.meters.length} Meter{section.meters.length > 1 ? 's' : ''}
                  </span>
                </div>

                <div
                  className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 border ${
                    isExceeded
                      ? 'bg-red-100 text-red-700 border-red-200'
                      : 'bg-emerald-100 text-emerald-700 border-emerald-200'
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
                      <span>Within Limit</span>
                    </>
                  )}
                </div>
              </div>

              {/* Units & Limit Details */}
              <div className="space-y-1 mb-2.5">
                <div className="flex items-baseline justify-between">
                  <span className="text-[11px] text-slate-500 font-medium capitalize">
                    {timeframe === 'day' ? "Today's Units:" : `${timeframe} Units:`}
                  </span>
                  <span className="font-mono text-base font-extrabold text-slate-900 tracking-tight">
                    {formatUnits(consumedKwh)}{' '}
                    <span className="text-xs text-slate-500 font-normal">kWh</span>
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-500 font-sans">
                    {timeframe === 'day' ? 'Daily Limit:' : `${timeframe} Limit:`}
                  </span>
                  <span className="text-slate-700 font-bold">
                    {formatUnits(periodLimit)} kWh
                  </span>
                </div>
              </div>

              {/* Progress Bar of Period Limit */}
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mb-2.5 border border-slate-200">
                <div
                  className={`h-full transition-all duration-300 ${
                    isExceeded ? 'bg-red-600' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(100, percentageUsed)}%` }}
                />
              </div>

              {/* Action Area: When Exceeded, show direct Send Enquiry button */}
              {isExceeded ? (
                <div className="p-2 rounded-xl bg-red-100/70 border border-red-200 text-[11px] space-y-1">
                  <div className="flex items-center justify-between text-red-800 font-bold font-mono">
                    <span>Exceeded:</span>
                    <span>+{formatUnits(exceededKwh)} kWh (+{exceededPct}%)</span>
                  </div>

                  <div className="pt-1.5 mt-1 border-t border-red-200 flex items-center justify-between">
                    <span className="text-[10px] text-red-700 font-bold">Limit Breached</span>
                    <button
                      onClick={() => setEnquirySection({ section, units: consumedKwh })}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold shadow-sm transition-colors cursor-pointer"
                      title="Send Direct Enquiry to Electrical Admin"
                    >
                      <Mail className="w-3 h-3" />
                      <span>Send Enquiry</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Requirement 5: Capacity Headroom removed */
                <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium pt-1 border-t border-slate-100">
                  <span className="text-emerald-700 font-bold flex items-center gap-1">
                    <CheckCircle className="w-3 h-3 text-emerald-600" />
                    Normal Operation
                  </span>
                  <span className="font-mono text-slate-700 font-bold">
                    {percentageUsed}% of limit
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Enquiry Modal for Plant Admin */}
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
