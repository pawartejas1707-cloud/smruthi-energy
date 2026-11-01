import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  Download,
  Filter,
  Calendar,
  Layers,
  Zap,
  TrendingDown,
  Activity,
  IndianRupee,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { exportReadingsToExcel, exportReadingsToCsv } from '../../lib/exportUtils';
import { calculateBillEstimate, formatINR, formatUnits } from '../../lib/calculations';

type ReportFilterMode = 'day' | 'week' | 'month' | 'year' | 'custom';

export const HistoricalReports: React.FC = () => {
  const { readings, sections, costSettings } = useApp();

  const [filterMode, setFilterMode] = useState<ReportFilterMode>('month');
  const [selectedSectionId, setSelectedSectionId] = useState<string>('all');
  const [specificDate, setSpecificDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');
  const [activeViewTab, setActiveViewTab] = useState<'readings' | 'bills'>('readings');

  // Filtered readings list
  const filteredReadings = useMemo(() => {
    let list = readings;

    // 1. Filter by section
    if (selectedSectionId !== 'all') {
      list = list.filter((r) => r.sectionId === selectedSectionId);
    }

    const now = new Date();

    // 2. Filter by date range
    if (filterMode === 'day') {
      list = list.filter((r) => r.date === specificDate);
    } else if (filterMode === 'week') {
      const pastWeek = new Date(now);
      pastWeek.setDate(now.getDate() - 7);
      list = list.filter((r) => new Date(r.date) >= pastWeek);
    } else if (filterMode === 'month') {
      const pastMonth = new Date(now);
      pastMonth.setDate(now.getDate() - 30);
      list = list.filter((r) => new Date(r.date) >= pastMonth);
    } else if (filterMode === 'year') {
      const pastYear = new Date(now);
      pastYear.setFullYear(now.getFullYear() - 1);
      list = list.filter((r) => new Date(r.date) >= pastYear);
    } else if (filterMode === 'custom') {
      if (customStart) {
        list = list.filter((r) => new Date(r.date) >= new Date(customStart));
      }
      if (customEnd) {
        list = list.filter((r) => new Date(r.date) <= new Date(customEnd));
      }
    }

    // Sort descending by date and time
    return list.sort(
      (a, b) => new Date(b.date + ' ' + b.time).getTime() - new Date(a.date + ' ' + a.time).getTime()
    );
  }, [readings, selectedSectionId, filterMode, specificDate, customStart, customEnd]);

  // Aggregate metrics for the filtered view
  const summary = useMemo(() => {
    const totalKwh = filteredReadings.reduce((sum, r) => sum + r.consumedKwh, 0);
    const totalKvah = filteredReadings.reduce((sum, r) => sum + r.consumedKvah, 0);
    const avgPf =
      totalKvah > 0 ? Number((totalKwh / totalKvah).toFixed(3)) : 0.95;
    const peakDemand = Math.max(
      ...filteredReadings.map((r) => r.calculatedDemand || 0),
      0
    );

    // Group dates to count active days
    const uniqueDates = Array.from(new Set(filteredReadings.map((r) => r.date)));
    const periodDays = Math.max(1, uniqueDates.length);

    const bill = calculateBillEstimate(totalKwh, peakDemand, costSettings, periodDays);

    return {
      totalKwh,
      totalKvah,
      avgPf,
      peakDemand,
      periodDays,
      bill,
    };
  }, [filteredReadings, costSettings]);

  // Daily bills breakdown
  const dailyBillsBreakdown = useMemo(() => {
    const grouped: Record<string, { kwh: number; kvah: number; peakDemand: number }> = {};

    filteredReadings.forEach((r) => {
      if (!grouped[r.date]) {
        grouped[r.date] = { kwh: 0, kvah: 0, peakDemand: 0 };
      }
      grouped[r.date].kwh += r.consumedKwh;
      grouped[r.date].kvah += r.consumedKvah;
      grouped[r.date].peakDemand = Math.max(grouped[r.date].peakDemand, r.calculatedDemand || 0);
    });

    return Object.keys(grouped)
      .sort()
      .reverse()
      .map((d) => {
        const item = grouped[d];
        const pf = item.kvah > 0 ? Number((item.kwh / item.kvah).toFixed(3)) : 0.95;
        const est = calculateBillEstimate(item.kwh, item.peakDemand, costSettings, 1);
        return {
          date: d,
          kwh: item.kwh,
          kvah: item.kvah,
          pf,
          demand: item.peakDemand,
          energyCost: est.energyCharges,
          demandCost: est.demandCharges,
          tax: est.taxAmount,
          totalBill: est.totalBill,
        };
      });
  }, [filteredReadings, costSettings]);

  return (
    <div className="space-y-6">
      {/* Title & Export Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-cyan-400" />
            Historical Data, Electrical Calculations & Reports
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Query historical KWH, KVAH, Power Factor, Contract Demand and dynamic electricity bills with CSV / Excel export.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => exportReadingsToCsv(filteredReadings)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-xs font-semibold text-slate-200 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            Export CSV
          </button>
          <button
            onClick={() => exportReadingsToExcel(filteredReadings)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950 hover:bg-emerald-900 border border-emerald-700 text-xs font-semibold text-emerald-300 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            Export Excel (.xlsx)
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 shadow-lg space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Section Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400">Section:</span>
            <select
              value={selectedSectionId}
              onChange={(e) => setSelectedSectionId(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-500 font-medium"
            >
              <option value="all">All 21 Sections Combined</option>
              {sections.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.code})
                </option>
              ))}
            </select>
          </div>

          {/* Timeframe Filters */}
          <div className="flex items-center bg-slate-850 p-1 rounded-xl border border-slate-700 text-xs">
            {(['day', 'week', 'month', 'year', 'custom'] as ReportFilterMode[]).map((m) => (
              <button
                key={m}
                onClick={() => setFilterMode(m)}
                className={`px-3 py-1 rounded-lg font-medium capitalize transition-colors ${
                  filterMode === m
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Specific Date input if filterMode === 'day' */}
        {filterMode === 'day' && (
          <div className="flex items-center gap-2 pt-2 border-t border-slate-800 text-xs">
            <span className="text-slate-400">Select Specific Day:</span>
            <input
              type="date"
              value={specificDate}
              onChange={(e) => setSpecificDate(e.target.value)}
              className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-white font-mono text-xs focus:outline-none"
            />
          </div>
        )}

        {/* Custom Range if filterMode === 'custom' */}
        {filterMode === 'custom' && (
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-800 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Start Date:</span>
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-white font-mono text-xs focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-400">End Date:</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-white font-mono text-xs focus:outline-none"
              />
            </div>
          </div>
        )}
      </div>

      {/* Aggregate KPI Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl bg-slate-900 border border-slate-800 p-3">
          <span className="text-[11px] text-slate-400 block">Total KWH Consumed:</span>
          <span className="font-mono text-lg font-bold text-amber-400">
            {formatUnits(summary.totalKwh)} kWh
          </span>
        </div>

        <div className="rounded-xl bg-slate-900 border border-slate-800 p-3">
          <span className="text-[11px] text-slate-400 block">Avg Power Factor:</span>
          <span className="font-mono text-lg font-bold text-cyan-400">{summary.avgPf}</span>
        </div>

        <div className="rounded-xl bg-slate-900 border border-slate-800 p-3">
          <span className="text-[11px] text-slate-400 block">Peak Demand Observed:</span>
          <span className="font-mono text-lg font-bold text-purple-400">
            {summary.peakDemand} kVA
          </span>
        </div>

        <div className="rounded-xl bg-slate-900 border border-slate-800 p-3">
          <span className="text-[11px] text-slate-400 block">Estimated Period Bill:</span>
          <span className="font-mono text-lg font-bold text-emerald-400">
            {formatINR(summary.bill.totalBill)}
          </span>
        </div>
      </div>

      {/* View Switcher: Detailed Meter Readings vs Daily Electricity Bills */}
      <div className="flex items-center gap-2 border-b border-slate-800">
        <button
          onClick={() => setActiveViewTab('readings')}
          className={`pb-3 px-3 text-xs font-bold transition-colors border-b-2 ${
            activeViewTab === 'readings'
              ? 'border-cyan-400 text-cyan-300'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          Detailed Meter Readings ({filteredReadings.length} records)
        </button>

        <button
          onClick={() => setActiveViewTab('bills')}
          className={`pb-3 px-3 text-xs font-bold transition-colors border-b-2 ${
            activeViewTab === 'bills'
              ? 'border-emerald-400 text-emerald-300'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          Date-wise Electricity Bill Breakdown
        </button>
      </div>

      {/* Table Views */}
      {activeViewTab === 'readings' ? (
        <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-2">Meter</th>
                  <th className="py-3 px-2">Section</th>
                  <th className="py-3 px-2">Prev KWH</th>
                  <th className="py-3 px-2">Curr KWH</th>
                  <th className="py-3 px-2">MF</th>
                  <th className="py-3 px-2 text-amber-400">Consumed KWH</th>
                  <th className="py-3 px-2 text-cyan-400">PF</th>
                  <th className="py-3 px-2">Demand (kVA)</th>
                  <th className="py-3 px-3">Operator</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredReadings.slice(0, 100).map((r) => (
                  <tr key={r.id} className="text-slate-300 hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 text-white font-semibold whitespace-nowrap">
                      {r.date}
                    </td>
                    <td className="py-2.5 px-2 font-bold text-cyan-300 whitespace-nowrap">
                      {r.meterCode}
                    </td>
                    <td className="py-2.5 px-2 text-slate-400 font-sans whitespace-nowrap">
                      {r.meterName}
                    </td>
                    <td className="py-2.5 px-2">{r.prevKwh}</td>
                    <td className="py-2.5 px-2">{r.currKwh}</td>
                    <td className="py-2.5 px-2">{r.kwhMf}</td>
                    <td className="py-2.5 px-2 font-bold text-amber-400">
                      {formatUnits(r.consumedKwh)}
                    </td>
                    <td className="py-2.5 px-2 font-semibold text-cyan-400">{r.powerFactor}</td>
                    <td className="py-2.5 px-2">{r.calculatedDemand}</td>
                    <td className="py-2.5 px-3 text-slate-400 font-sans whitespace-nowrap">
                      {r.operatorName}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-2 text-amber-400">Total KWH</th>
                  <th className="py-3 px-2 text-cyan-400">Plant PF</th>
                  <th className="py-3 px-2">Peak Demand (kVA)</th>
                  <th className="py-3 px-2">Energy Charges (₹)</th>
                  <th className="py-3 px-2">Demand Charges (₹)</th>
                  <th className="py-3 px-2">Duty / Tax (₹)</th>
                  <th className="py-3 px-3 text-emerald-400 font-bold">Total Bill (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {dailyBillsBreakdown.map((b) => (
                  <tr key={b.date} className="text-slate-300 hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 font-semibold text-white">{b.date}</td>
                    <td className="py-2.5 px-2 text-amber-400 font-bold">{formatUnits(b.kwh)}</td>
                    <td className="py-2.5 px-2 text-cyan-400">{b.pf}</td>
                    <td className="py-2.5 px-2">{b.demand}</td>
                    <td className="py-2.5 px-2">{formatINR(b.energyCost)}</td>
                    <td className="py-2.5 px-2">{formatINR(b.demandCost)}</td>
                    <td className="py-2.5 px-2">{formatINR(b.tax)}</td>
                    <td className="py-2.5 px-3 text-emerald-400 font-bold">
                      {formatINR(b.totalBill)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
