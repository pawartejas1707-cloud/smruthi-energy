import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  BarChart,
  Bar,
} from 'recharts';
import {
  Calendar,
  Filter,
  Layers,
  Sliders,
  TrendingUp,
  Activity,
  Maximize2,
  Clock,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatUnits } from '../../lib/calculations';

type TimeRange = 'day' | 'week' | 'month' | 'year' | 'custom';
type ChartStyle = 'area' | 'bar';

export const ConsumptionChart: React.FC = () => {
  const { readings, sections } = useApp();

  const [timeRange, setTimeRange] = useState<TimeRange>('month');
  const [selectedSectionId, setSelectedSectionId] = useState<string>('all');
  const [chartStyle, setChartStyle] = useState<ChartStyle>('area');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [customLimit, setCustomLimit] = useState<number | null>(null);

  // Determine active section and limit
  const activeSection = useMemo(() => {
    if (selectedSectionId === 'all') return null;
    return sections.find((s) => s.id === selectedSectionId) || null;
  }, [selectedSectionId, sections]);

  // Total plant limit or section limit
  const defaultLimit = useMemo(() => {
    if (activeSection) {
      return activeSection.dailyLimitKwh;
    }
    // Overall plant limit = sum of all 21 sections limits
    return sections.reduce((sum, s) => sum + s.dailyLimitKwh, 0);
  }, [activeSection, sections]);

  const effectiveLimit = customLimit !== null ? customLimit : defaultLimit;

  // Process data for the chart based on timeframe and section filter
  const chartData = useMemo(() => {
    // 1. Filter by section
    let filtered = readings;
    if (selectedSectionId !== 'all') {
      filtered = readings.filter((r) => r.sectionId === selectedSectionId);
    }

    // Group by date
    const dateMap: Record<string, { totalKwh: number; totalKvah: number; count: number }> = {};
    filtered.forEach((r) => {
      if (!dateMap[r.date]) {
        dateMap[r.date] = { totalKwh: 0, totalKvah: 0, count: 0 };
      }
      dateMap[r.date].totalKwh += r.consumedKwh;
      dateMap[r.date].totalKvah += r.consumedKvah;
      dateMap[r.date].count += 1;
    });

    const sortedDates = Object.keys(dateMap).sort();
    if (sortedDates.length === 0) return [];

    const now = new Date();
    let startDate: Date;

    if (timeRange === 'day') {
      // Simulate hourly slices for the latest day
      const latestDate = sortedDates[sortedDates.length - 1];
      const dayTotal = dateMap[latestDate]?.totalKwh || 24000;
      // Generate 24-hour share-market curve
      const hourlyData = [];
      const hourWeights = [
        0.025, 0.024, 0.024, 0.026, 0.032, 0.045, 0.052, 0.058, 0.062, 0.065, 0.068, 0.066,
        0.058, 0.062, 0.065, 0.067, 0.064, 0.055, 0.048, 0.042, 0.038, 0.032, 0.028, 0.026,
      ];
      for (let h = 0; h < 24; h++) {
        const timeLabel = `${h.toString().padStart(2, '0')}:00`;
        const kwh = Number((dayTotal * hourWeights[h]).toFixed(1));
        const limitHourly = Number((effectiveLimit / 24).toFixed(1));
        hourlyData.push({
          date: timeLabel,
          fullDate: `${latestDate} ${timeLabel}`,
          kwh,
          limit: limitHourly,
          pf: 0.95,
          status: kwh > limitHourly ? 'exceeded' : 'normal',
        });
      }
      return hourlyData;
    } else if (timeRange === 'week') {
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 7);
    } else if (timeRange === 'month') {
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 30);
    } else if (timeRange === 'year') {
      startDate = new Date(now);
      startDate.setFullYear(now.getFullYear() - 1);
    } else {
      // custom
      startDate = customStartDate ? new Date(customStartDate) : new Date(sortedDates[0]);
    }

    const endDate =
      timeRange === 'custom' && customEndDate ? new Date(customEndDate) : new Date();

    return sortedDates
      .filter((d) => {
        const itemDate = new Date(d);
        return itemDate >= startDate && itemDate <= endDate;
      })
      .map((d) => {
        const item = dateMap[d];
        const pf =
          item.totalKvah > 0 ? Number((item.totalKwh / item.totalKvah).toFixed(3)) : 0.95;
        const kwh = Number(item.totalKwh.toFixed(1));

        return {
          date: d.slice(5), // MM-DD
          fullDate: d,
          kwh,
          limit: effectiveLimit,
          pf,
          status: kwh > effectiveLimit ? 'exceeded' : 'normal',
        };
      });
  }, [
    readings,
    selectedSectionId,
    timeRange,
    customStartDate,
    customEndDate,
    effectiveLimit,
  ]);

  // Statistics for the displayed range
  const rangeStats = useMemo(() => {
    if (chartData.length === 0) return { total: 0, avg: 0, peak: 0, breaches: 0 };
    const total = chartData.reduce((acc, curr) => acc + curr.kwh, 0);
    const avg = total / chartData.length;
    const peak = Math.max(...chartData.map((d) => d.kwh));
    const breaches = chartData.filter((d) => d.kwh > effectiveLimit).length;
    return {
      total: Number(total.toFixed(1)),
      avg: Number(avg.toFixed(1)),
      peak: Number(peak.toFixed(1)),
      breaches,
    };
  }, [chartData, effectiveLimit]);

  // Custom market-style tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const isExceeded = data.kwh > data.limit;
      const diff = Number((data.kwh - data.limit).toFixed(1));
      const diffPct = Number(((diff / data.limit) * 100).toFixed(1));

      return (
        <div className="rounded-xl bg-slate-900/95 border border-slate-700/80 p-3 shadow-2xl backdrop-blur-md min-w-[200px]">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
            <span className="text-xs font-semibold text-slate-300 font-mono">
              {data.fullDate || label}
            </span>
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                isExceeded
                  ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              }`}
            >
              {isExceeded ? 'Exceeded' : 'Within Limit'}
            </span>
          </div>

          <div className="space-y-1.5 text-xs font-mono">
            <div className="flex items-center justify-between text-slate-400">
              <span>Consumption:</span>
              <span className="font-bold text-white text-sm">
                {formatUnits(data.kwh)} kWh
              </span>
            </div>

            <div className="flex items-center justify-between text-slate-400">
              <span>Threshold Limit:</span>
              <span className="text-amber-400">{formatUnits(data.limit)} kWh</span>
            </div>

            <div className="flex items-center justify-between text-slate-400">
              <span>Variance:</span>
              <span
                className={`font-semibold ${
                  isExceeded ? 'text-red-400' : 'text-emerald-400'
                }`}
              >
                {diff > 0 ? `+${formatUnits(diff)} (${diffPct}%)` : `${formatUnits(diff)} kWh`}
              </span>
            </div>

            <div className="flex items-center justify-between text-slate-400 pt-1 border-t border-slate-800/80">
              <span>Power Factor:</span>
              <span className="text-cyan-400 font-semibold">{data.pf}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="rounded-2xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden p-5">
      {/* Chart Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base lg:text-lg font-bold text-white tracking-tight">
              Consumption Trend
            </h2>
            <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 text-[11px] font-semibold border border-cyan-800">
              Live Feed
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {activeSection
              ? `Monitoring: ${activeSection.name} (${activeSection.meters.length} meter${
                  activeSection.meters.length > 1 ? 's' : ''
                })`
              : 'Overall Plant Consumption — All 21 Industrial Sections Combined'}
          </p>
        </div>

        {/* Filters and Dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Section Selector */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs">
            <Layers className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={selectedSectionId}
              onChange={(e) => {
                setSelectedSectionId(e.target.value);
                setCustomLimit(null);
              }}
              className="bg-transparent text-white font-medium focus:outline-none cursor-pointer pr-2 max-w-[170px] truncate"
            >
              <option value="all" className="bg-slate-900 text-white">
                ⚡ All 21 Sections Combined
              </option>
              {sections.map((s) => (
                <option key={s.id} value={s.id} className="bg-slate-900 text-white">
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Timeframe Filters (Day, Week, Month, Year, Custom) */}
          <div className="flex items-center bg-slate-800/80 p-1 rounded-xl border border-slate-700 text-xs">
            {(['day', 'week', 'month', 'year', 'custom'] as TimeRange[]).map((t) => (
              <button
                key={t}
                onClick={() => setTimeRange(t)}
                className={`px-3 py-1 rounded-lg font-medium capitalize transition-colors ${
                  timeRange === t
                    ? 'bg-cyan-500 text-slate-950 shadow-md font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Chart View Toggle (Area vs Bar) */}
          <div className="flex items-center bg-slate-800/80 p-1 rounded-xl border border-slate-700 text-xs">
            <button
              onClick={() => setChartStyle('area')}
              className={`px-2.5 py-1 rounded-lg transition-colors ${
                chartStyle === 'area'
                  ? 'bg-slate-700 text-cyan-300 font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Area
            </button>
            <button
              onClick={() => setChartStyle('bar')}
              className={`px-2.5 py-1 rounded-lg transition-colors ${
                chartStyle === 'bar'
                  ? 'bg-slate-700 text-cyan-300 font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Bar
            </button>
          </div>
        </div>
      </div>

      {/* Custom Date Range Picker (shown when custom timeframe is active) */}
      {timeRange === 'custom' && (
        <div className="flex flex-wrap items-center gap-3 pt-3 pb-1 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">From:</span>
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400">To:</span>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>
      )}

      {/* Metrics Mini-Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs">
        <div>
          <span className="text-slate-500 block">Period Total:</span>
          <span className="font-mono font-bold text-white text-sm">
            {formatUnits(rangeStats.total)} kWh
          </span>
        </div>
        <div>
          <span className="text-slate-500 block">Daily Average:</span>
          <span className="font-mono font-bold text-cyan-400 text-sm">
            {formatUnits(rangeStats.avg)} kWh
          </span>
        </div>
        <div>
          <span className="text-slate-500 block">Peak Load Point:</span>
          <span className="font-mono font-bold text-amber-400 text-sm">
            {formatUnits(rangeStats.peak)} kWh
          </span>
        </div>
        <div>
          <span className="text-slate-500 block">Threshold Breaches:</span>
          <span
            className={`font-mono font-bold text-sm ${
              rangeStats.breaches > 0 ? 'text-red-400 animate-pulse' : 'text-emerald-400'
            }`}
          >
            {rangeStats.breaches} Days
          </span>
        </div>
      </div>

      {/* The Market Chart Canvas */}
      <div className="h-80 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          {chartStyle === 'area' ? (
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="marketGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.45} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis
                dataKey="date"
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }}
                tickLine={false}
              />
              <YAxis
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }}
                tickLine={false}
                tickFormatter={(val) => `${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine
                y={effectiveLimit}
                stroke="#ef4444"
                strokeDasharray="4 4"
                strokeWidth={1.5}
                label={{
                  value: `Limit: ${formatUnits(effectiveLimit)} kWh`,
                  fill: '#ef4444',
                  fontSize: 10,
                  position: 'insideTopRight',
                  fontWeight: 600,
                }}
              />
              <Area
                type="monotone"
                dataKey="kwh"
                stroke="#06b6d4"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#marketGradient)"
                activeDot={{ r: 6, fill: '#38bdf8', stroke: '#0f172a', strokeWidth: 2 }}
              />
            </AreaChart>
          ) : (
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis
                dataKey="date"
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }}
                tickLine={false}
              />
              <YAxis
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }}
                tickLine={false}
                tickFormatter={(val) => `${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine
                y={effectiveLimit}
                stroke="#ef4444"
                strokeDasharray="4 4"
                strokeWidth={1.5}
              />
              <Bar
                dataKey="kwh"
                fill="#06b6d4"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Graph Legend & Configurable Limit Line slider */}
      <div className="flex flex-wrap items-center justify-between gap-4 mt-3 pt-3 border-t border-slate-800 text-xs text-slate-400">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-cyan-400" />
            <span>Energy Consumption (kWh)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-red-500 border border-red-500" />
            <span>Configurable Limit Line ({formatUnits(effectiveLimit)} kWh)</span>
          </div>
        </div>

        {/* Electrical Admin Limit Adjustment on the fly */}
        <div className="flex items-center gap-2">
          <Sliders className="w-3.5 h-3.5 text-slate-400" />
          <span>Interactive Limit Line:</span>
          <input
            type="range"
            min={Math.round(defaultLimit * 0.5)}
            max={Math.round(defaultLimit * 1.5)}
            step={50}
            value={effectiveLimit}
            onChange={(e) => setCustomLimit(Number(e.target.value))}
            className="w-24 accent-cyan-400 cursor-pointer"
          />
          <button
            onClick={() => setCustomLimit(null)}
            className="text-[11px] text-cyan-400 hover:underline"
            title="Reset to default section limit"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
};
