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
  Activity,
  Layers,
  Sliders,
  Calendar,
  RotateCcw,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatUnits } from '../../lib/calculations';

type TimeRange = 'day' | 'week' | 'month' | 'year' | 'custom';
type ChartStyle = 'area' | 'bar';

export const PlantAdminConsumptionTrend: React.FC = () => {
  const { readings, sections } = useApp();

  const [timeRange, setTimeRange] = useState<TimeRange>('month');
  const [selectedSectionId, setSelectedSectionId] = useState<string>('all');
  const [chartStyle, setChartStyle] = useState<ChartStyle>('area');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [customLimit, setCustomLimit] = useState<number | null>(null);

  // Active section
  const activeSection = useMemo(() => {
    if (selectedSectionId === 'all') return null;
    return sections.find((s) => s.id === selectedSectionId) || null;
  }, [selectedSectionId, sections]);

  // Default limit
  const defaultLimit = useMemo(() => {
    if (activeSection) {
      return activeSection.dailyLimitKwh;
    }
    return sections.reduce((sum, s) => sum + s.dailyLimitKwh, 0);
  }, [activeSection, sections]);

  const effectiveLimit = customLimit !== null ? customLimit : defaultLimit;

  // Process data for the chart
  const chartData = useMemo(() => {
    let filtered = readings;
    if (selectedSectionId !== 'all') {
      filtered = readings.filter((r) => r.sectionId === selectedSectionId);
    }

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

    if (timeRange === 'day') {
      const latestDate = sortedDates[sortedDates.length - 1];
      const dayTotal = dateMap[latestDate]?.totalKwh || 24000;
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
          pf: (0.94 + (Math.sin(h) * 0.03)).toFixed(2),
        });
      }
      return hourlyData;
    }

    let sliceDates = sortedDates;
    if (timeRange === 'week') {
      sliceDates = sortedDates.slice(-7);
    } else if (timeRange === 'month') {
      sliceDates = sortedDates.slice(-30);
    } else if (timeRange === 'year') {
      sliceDates = sortedDates.slice(-365);
    } else if (timeRange === 'custom' && customStartDate && customEndDate) {
      sliceDates = sortedDates.filter((d) => d >= customStartDate && d <= customEndDate);
    }

    return sliceDates.map((dateStr) => {
      const item = dateMap[dateStr];
      const kwh = item ? Number(item.totalKwh.toFixed(1)) : 0;
      const kvah = item ? Number(item.totalKvah.toFixed(1)) : 0;
      const pf = kvah > 0 ? (kwh / kvah).toFixed(2) : '0.96';

      let displayDate = dateStr;
      try {
        const d = new Date(dateStr);
        displayDate = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
      } catch (e) {}

      return {
        date: displayDate,
        fullDate: dateStr,
        kwh,
        limit: effectiveLimit,
        pf,
      };
    });
  }, [readings, selectedSectionId, timeRange, customStartDate, customEndDate, effectiveLimit]);

  // Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const isExceeded = data.kwh > data.limit;
      const diff = Number((data.kwh - data.limit).toFixed(1));
      const diffPct = Number(((diff / data.limit) * 100).toFixed(1));

      return (
        <div className="rounded-xl bg-slate-900 text-white p-3 shadow-xl border border-slate-700 text-xs min-w-[210px]">
          <div className="font-bold text-slate-200 border-b border-slate-800 pb-1.5 mb-2 flex items-center justify-between">
            <span>{data.fullDate || data.date}</span>
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                isExceeded ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'
              }`}
            >
              {isExceeded ? 'Exceeded' : 'Normal'}
            </span>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between text-slate-300">
              <span>Energy Consumed:</span>
              <span className="font-bold font-mono text-cyan-300">{formatUnits(data.kwh)} kWh</span>
            </div>

            <div className="flex items-center justify-between text-slate-400">
              <span>Threshold Limit:</span>
              <span className="text-amber-400 font-mono">{formatUnits(data.limit)} kWh</span>
            </div>

            <div className="flex items-center justify-between text-slate-400">
              <span>Variance:</span>
              <span className={`font-semibold font-mono ${isExceeded ? 'text-red-400' : 'text-emerald-400'}`}>
                {diff > 0 ? `+${formatUnits(diff)} (${diffPct}%)` : `${formatUnits(diff)} kWh`}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden p-5">
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
              <Activity className="w-5 h-5" />
            </div>
            {/* Requirement 4: Share-Market Industrial Consumption Trend change the name to the consumption treand */}
            <h2 className="text-base lg:text-lg font-extrabold text-slate-900 tracking-tight">
              Consumption Trend
            </h2>
            <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200">
              Live Industrial Telemetry
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
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
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-300 text-xs">
            <Layers className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <select
              value={selectedSectionId}
              onChange={(e) => {
                setSelectedSectionId(e.target.value);
                setCustomLimit(null);
              }}
              className="bg-transparent text-slate-900 font-bold focus:outline-none cursor-pointer pr-2 max-w-[180px] truncate"
            >
              <option value="all">⚡ All 21 Sections Combined</option>
              {sections.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Timeframe Filters (Day, Week, Month, Year, Custom) */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            {(['day', 'week', 'month', 'year', 'custom'] as TimeRange[]).map((t) => (
              <button
                key={t}
                onClick={() => setTimeRange(t)}
                className={`px-3 py-1 rounded-lg font-bold capitalize transition-colors ${
                  timeRange === t
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Chart View Toggle (Area vs Bar) */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            <button
              onClick={() => setChartStyle('area')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
                chartStyle === 'area'
                  ? 'bg-white text-blue-700 shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Area
            </button>
            <button
              onClick={() => setChartStyle('bar')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
                chartStyle === 'bar'
                  ? 'bg-white text-blue-700 shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Bar
            </button>
          </div>
        </div>
      </div>

      {/* Custom Date Range Picker */}
      {timeRange === 'custom' && (
        <div className="flex flex-wrap items-center gap-3 pt-3 pb-1 text-xs">
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-slate-700 font-medium">From:</span>
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 font-mono text-xs focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-700 font-medium">To:</span>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 font-mono text-xs focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
      )}

      {/* Main Chart Graphic Area */}
      <div className="mt-4 h-72 sm:h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {chartStyle === 'area' ? (
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="plantAdminGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis
                dataKey="date"
                stroke="#64748b"
                tick={{ fill: '#475569', fontSize: 11, fontFamily: 'monospace', fontWeight: 600 }}
                tickLine={false}
              />
              <YAxis
                stroke="#64748b"
                tick={{ fill: '#475569', fontSize: 11, fontFamily: 'monospace', fontWeight: 600 }}
                tickLine={false}
                tickFormatter={(val) => `${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine
                y={effectiveLimit}
                stroke="#dc2626"
                strokeDasharray="4 4"
                strokeWidth={1.5}
                label={{
                  value: `Limit: ${formatUnits(effectiveLimit)} kWh`,
                  fill: '#dc2626',
                  fontSize: 10,
                  position: 'insideTopRight',
                  fontWeight: 700,
                }}
              />
              <Area
                type="monotone"
                dataKey="kwh"
                stroke="#2563eb"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#plantAdminGradient)"
                activeDot={{ r: 6, fill: '#1d4ed8', stroke: '#ffffff', strokeWidth: 2 }}
              />
            </AreaChart>
          ) : (
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis
                dataKey="date"
                stroke="#64748b"
                tick={{ fill: '#475569', fontSize: 11, fontFamily: 'monospace', fontWeight: 600 }}
                tickLine={false}
              />
              <YAxis
                stroke="#64748b"
                tick={{ fill: '#475569', fontSize: 11, fontFamily: 'monospace', fontWeight: 600 }}
                tickLine={false}
                tickFormatter={(val) => `${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine
                y={effectiveLimit}
                stroke="#dc2626"
                strokeDasharray="4 4"
                strokeWidth={1.5}
              />
              <Bar dataKey="kwh" fill="#2563eb" radius={[4, 4, 0, 0]} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Graph Legend & Configurable Limit Line slider */}
      <div className="flex flex-wrap items-center justify-between gap-4 mt-3 pt-3 border-t border-slate-200 text-xs text-slate-600">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 font-medium">
            <span className="w-3 h-3 rounded-full bg-blue-600" />
            <span>Energy Consumption (kWh)</span>
          </div>
          <div className="flex items-center gap-1.5 font-medium">
            <span className="w-3 h-0.5 bg-red-600 border border-red-600" />
            <span>Allocated Limit Line ({formatUnits(effectiveLimit)} kWh)</span>
          </div>
        </div>

        {/* Limit Adjustment on the fly */}
        <div className="flex items-center gap-2">
          <Sliders className="w-3.5 h-3.5 text-slate-500" />
          <span className="font-medium text-slate-700">Reference Limit:</span>
          <input
            type="range"
            min={Math.round(defaultLimit * 0.5)}
            max={Math.round(defaultLimit * 1.5)}
            step={50}
            value={effectiveLimit}
            onChange={(e) => setCustomLimit(Number(e.target.value))}
            className="w-24 accent-blue-600 cursor-pointer"
          />
          {customLimit !== null && (
            <button
              onClick={() => setCustomLimit(null)}
              className="p-1 text-slate-400 hover:text-blue-600 transition-colors"
              title="Reset to default limit"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
