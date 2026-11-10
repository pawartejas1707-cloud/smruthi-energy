import React, { useState, useMemo } from 'react';
import {
  IndianRupee,
  Calendar,
  Layers,
  Search,
  TrendingUp,
  TrendingDown,
  BarChart3,
  FileSpreadsheet,
  Zap,
  Building2,
  PieChart as PieIcon,
  CheckCircle2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  AreaChart,
  Area,
} from 'recharts';
import { useApp } from '../../context/AppContext';
import { formatINR, formatUnits } from '../../lib/calculations';

export type CostTimeframe = 'day' | 'week' | 'month' | 'year';

export const PlantAdminCosting: React.FC = () => {
  const { sections, readings, costSettings } = useApp();

  const [timeframe, setTimeframe] = useState<CostTimeframe>('month');
  const [selectedBlockId, setSelectedBlockId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [chartType, setChartType] = useState<'bar' | 'area'>('bar');

  // Dates and timeframe calculation
  const { filteredReadings, periodLabel, daysCount } = useMemo(() => {
    const sortedDates = Array.from(new Set(readings.map((r) => r.date))).sort();
    const latestDate = sortedDates[sortedDates.length - 1] || new Date().toISOString().split('T')[0];

    let targetDates: string[] = [];
    let label = '';
    let count = 1;

    if (timeframe === 'day') {
      targetDates = [latestDate];
      label = `Day-wise: Today (${latestDate})`;
      count = 1;
    } else if (timeframe === 'week') {
      targetDates = sortedDates.slice(-7);
      label = `Week-wise: Last 7 Days (${targetDates[0] || latestDate} to ${latestDate})`;
      count = 7;
    } else if (timeframe === 'month') {
      targetDates = sortedDates.slice(-30);
      label = `Month-wise: Last 30 Days (${targetDates[0] || latestDate} to ${latestDate})`;
      count = 30;
    } else if (timeframe === 'year') {
      targetDates = sortedDates.slice(-365);
      count = Math.max(targetDates.length, 30);
      label = `Year-wise: Annual Cumulative (${count} Days Recorded)`;
    }

    const targetSet = new Set(targetDates);
    const subset = readings.filter((r) => targetSet.has(r.date));

    return {
      filteredReadings: subset,
      periodLabel: label,
      daysCount: count,
    };
  }, [readings, timeframe]);

  // Block-wise cost calculations
  const blockCostData = useMemo(() => {
    const rate = costSettings.ratePerKwh || 8.75;
    const taxRate = (costSettings.taxRatePercent || 6.0) / 100;
    const facRate = costSettings.fuelAdjustmentChargePerKwh || 0.42;

    // Calculate total plant units first
    const plantTotalKwh = filteredReadings.reduce((sum, r) => sum + r.consumedKwh, 0);

    const list = sections.map((sec) => {
      const secReadings = filteredReadings.filter((r) => r.sectionId === sec.id);
      const consumedKwh = secReadings.reduce((sum, r) => sum + r.consumedKwh, 0);

      // Cost calculations
      const energyCharges = consumedKwh * rate;
      const fuelCharges = consumedKwh * facRate;
      const subtotal = energyCharges + fuelCharges;
      const duty = subtotal * taxRate;
      const totalCost = subtotal + duty;
      const effectiveRate = consumedKwh > 0 ? totalCost / consumedKwh : rate;
      const pctOfPlant = plantTotalKwh > 0 ? (consumedKwh / plantTotalKwh) * 100 : 0;

      return {
        section: sec,
        consumedKwh: Number(consumedKwh.toFixed(1)),
        energyCharges: Number(energyCharges.toFixed(1)),
        fuelCharges: Number(fuelCharges.toFixed(1)),
        duty: Number(duty.toFixed(1)),
        totalCost: Number(totalCost.toFixed(0)),
        effectiveRate: Number(effectiveRate.toFixed(2)),
        pctOfPlant: Number(pctOfPlant.toFixed(1)),
        dailyAvgCost: Number((totalCost / daysCount).toFixed(0)),
      };
    });

    return list.sort((a, b) => b.totalCost - a.totalCost);
  }, [sections, filteredReadings, costSettings, daysCount]);

  // Overall totals
  const totalPlantUnits = blockCostData.reduce((sum, b) => sum + b.consumedKwh, 0);
  const totalPlantCost = blockCostData.reduce((sum, b) => sum + b.totalCost, 0);
  const overallEffectiveRate = totalPlantUnits > 0 ? totalPlantCost / totalPlantUnits : costSettings.ratePerKwh;

  // Selected block details if single block selected
  const activeBlock = useMemo(() => {
    if (selectedBlockId === 'all') return null;
    return blockCostData.find((b) => b.section.id === selectedBlockId) || null;
  }, [selectedBlockId, blockCostData]);

  // Time-series chart data (Daily cost in ₹)
  const chartData = useMemo(() => {
    let subset = filteredReadings;
    if (selectedBlockId !== 'all') {
      subset = filteredReadings.filter((r) => r.sectionId === selectedBlockId);
    }

    const dateMap: Record<string, number> = {};
    subset.forEach((r) => {
      if (!dateMap[r.date]) dateMap[r.date] = 0;
      dateMap[r.date] += r.consumedKwh;
    });

    const dates = Object.keys(dateMap).sort();
    const rate = costSettings.ratePerKwh || 8.75;
    const taxMultiplier = 1 + (costSettings.taxRatePercent || 6.0) / 100;
    const facRate = costSettings.fuelAdjustmentChargePerKwh || 0.42;

    return dates.map((d) => {
      const units = dateMap[d] || 0;
      const cost = units * (rate + facRate) * taxMultiplier;
      let displayDate = d;
      try {
        const dt = new Date(d);
        displayDate = dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
      } catch (e) {}

      return {
        date: displayDate,
        fullDate: d,
        units: Number(units.toFixed(1)),
        cost: Number(cost.toFixed(0)),
      };
    });
  }, [filteredReadings, selectedBlockId, costSettings]);

  // Filtered table rows based on search
  const tableRows = useMemo(() => {
    if (!searchQuery.trim()) return blockCostData;
    const q = searchQuery.toLowerCase();
    return blockCostData.filter(
      (b) =>
        b.section.name.toLowerCase().includes(q) ||
        b.section.code.toLowerCase().includes(q) ||
        b.section.category.toLowerCase().includes(q)
    );
  }, [blockCostData, searchQuery]);

  return (
    <div className="space-y-6">
      {/* 1. Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800 border border-emerald-300">
              <IndianRupee className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg lg:text-xl font-extrabold text-slate-900 tracking-tight">
                Electricity Cost & Tariff Analysis
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {periodLabel} • HT Industrial Rate: ₹{costSettings.ratePerKwh}/kWh + Duty & FAC
              </p>
            </div>
          </div>
        </div>

        {/* Timeframe & Block Selectors */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Timeframe selector: Day, Week, Month, Year */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            {(['day', 'week', 'month', 'year'] as CostTimeframe[]).map((t) => (
              <button
                key={t}
                onClick={() => setTimeframe(t)}
                className={`px-3 py-1.5 rounded-lg font-bold capitalize transition-all ${
                  timeframe === t
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t === 'day' ? 'Day-wise' : t === 'week' ? 'Week-wise' : t === 'month' ? 'Month-wise' : 'Year-wise'}
              </button>
            ))}
          </div>

          {/* Block Selector Dropdown */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-xs shadow-sm">
            <Layers className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <select
              value={selectedBlockId}
              onChange={(e) => setSelectedBlockId(e.target.value)}
              className="bg-transparent font-bold text-slate-900 focus:outline-none cursor-pointer max-w-[200px] truncate"
            >
              <option value="all">⚡ Overall Plant (All 21 Blocks Combined)</option>
              {sections.map((sec) => (
                <option key={sec.id} value={sec.id}>
                  {sec.name} ({sec.code})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 2. Top Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Cost Card */}
        <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm border-l-4 border-l-emerald-600">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              {activeBlock ? `${activeBlock.section.name} Cost` : 'Total Plant Electricity Cost'}
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl lg:text-3xl font-black font-mono text-slate-900">
            {formatINR(activeBlock ? activeBlock.totalCost : totalPlantCost)}
          </div>
          <div className="mt-2 text-xs text-slate-500 font-medium">
            {timeframe === 'day' ? "Today's Energy Bill" : `Cumulative for ${daysCount} Days`}
          </div>
        </div>

        {/* Consumed Units Card */}
        <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm border-l-4 border-l-blue-600">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Energy Consumption
            </span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-700">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl lg:text-3xl font-black font-mono text-slate-900">
            {formatUnits(activeBlock ? activeBlock.consumedKwh : totalPlantUnits)}{' '}
            <span className="text-sm font-normal text-slate-500">kWh</span>
          </div>
          <div className="mt-2 text-xs text-slate-500 font-medium">
            {activeBlock
              ? `Share: ${activeBlock.pctOfPlant}% of Plant Total`
              : 'Combined across all 21 sections'}
          </div>
        </div>

        {/* Effective Rate Card */}
        <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm border-l-4 border-l-indigo-600">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Effective Tariff Rate
            </span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-700">
              <BarChart3 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl lg:text-3xl font-black font-mono text-slate-900">
            ₹{(activeBlock ? activeBlock.effectiveRate : overallEffectiveRate).toFixed(2)}{' '}
            <span className="text-sm font-normal text-slate-500">/ kWh</span>
          </div>
          <div className="mt-2 text-xs text-slate-500 font-medium">
            Includes ₹{costSettings.ratePerKwh} base + {costSettings.taxRatePercent}% Duty + FAC
          </div>
        </div>

        {/* Daily Average Cost Card */}
        <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm border-l-4 border-l-amber-600">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Daily Average Cost
            </span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl lg:text-3xl font-black font-mono text-slate-900">
            {formatINR(
              activeBlock
                ? activeBlock.dailyAvgCost
                : Math.round(totalPlantCost / daysCount)
            )}
          </div>
          <div className="mt-2 text-xs text-slate-500 font-medium">
            Per-day average expense rate
          </div>
        </div>
      </div>

      {/* 3. Cost Visual Trend Chart */}
      <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-extrabold text-sm text-slate-900">
              {activeBlock
                ? `${activeBlock.section.name} — Cost Expense Trend (₹)`
                : 'Overall Plant Daily Electricity Cost Trend (₹)'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Daily electricity expense calculated with tariff and duty charges.
            </p>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            <button
              onClick={() => setChartType('bar')}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                chartType === 'bar'
                  ? 'bg-white text-emerald-800 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Bar Chart
            </button>
            <button
              onClick={() => setChartType('area')}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                chartType === 'area'
                  ? 'bg-white text-emerald-800 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Area Chart
            </button>
          </div>
        </div>

        <div className="h-64 sm:h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'bar' ? (
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis
                  dataKey="date"
                  stroke="#64748b"
                  tick={{ fill: '#475569', fontSize: 11, fontFamily: 'monospace' }}
                  tickLine={false}
                />
                <YAxis
                  stroke="#64748b"
                  tick={{ fill: '#475569', fontSize: 11, fontFamily: 'monospace' }}
                  tickLine={false}
                  tickFormatter={(val) => `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                />
                <Tooltip
                  formatter={(val: any) => [formatINR(Number(val)), 'Electricity Cost']}
                  labelFormatter={(lbl, p) => p?.[0]?.payload?.fullDate || lbl}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '12px',
                    color: '#ffffff',
                    fontSize: '12px',
                    fontFamily: 'monospace',
                  }}
                />
                <Bar dataKey="cost" fill="#059669" radius={[4, 4, 0, 0]} />
              </BarChart>
            ) : (
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="costGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#059669" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis
                  dataKey="date"
                  stroke="#64748b"
                  tick={{ fill: '#475569', fontSize: 11, fontFamily: 'monospace' }}
                  tickLine={false}
                />
                <YAxis
                  stroke="#64748b"
                  tick={{ fill: '#475569', fontSize: 11, fontFamily: 'monospace' }}
                  tickLine={false}
                  tickFormatter={(val) => `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                />
                <Tooltip
                  formatter={(val: any) => [formatINR(Number(val)), 'Electricity Cost']}
                  labelFormatter={(lbl, p) => p?.[0]?.payload?.fullDate || lbl}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '12px',
                    color: '#ffffff',
                    fontSize: '12px',
                    fontFamily: 'monospace',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="cost"
                  stroke="#059669"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#costGrad)"
                />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* 4. Block-Wise Cost Breakdown Table */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider">
              Block-Wise Electricity Cost Breakdown
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Click any block row to filter and analyze its separate cost trend.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-xs w-48 sm:w-60 shadow-sm">
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search block..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent text-slate-900 font-medium focus:outline-none w-full text-xs"
              />
            </div>
            {selectedBlockId !== 'all' && (
              <button
                onClick={() => setSelectedBlockId('all')}
                className="px-3 py-1.5 rounded-xl bg-slate-800 text-white text-xs font-bold shadow-sm"
              >
                Reset to All Blocks
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-600 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="p-3">Rank</th>
                <th className="p-3">Feeder Block</th>
                <th className="p-3 text-right">Consumed Units (kWh)</th>
                <th className="p-3 text-right">Energy Charges (₹)</th>
                <th className="p-3 text-right">Duty & FAC (₹)</th>
                <th className="p-3 text-right font-black text-slate-900">Total Bill (₹)</th>
                <th className="p-3 text-right">Effective Rate</th>
                <th className="p-3 text-right">% of Plant Bill</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {tableRows.map((row, idx) => {
                const isSelected = selectedBlockId === row.section.id;
                return (
                  <tr
                    key={row.section.id}
                    onClick={() =>
                      setSelectedBlockId(isSelected ? 'all' : row.section.id)
                    }
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-emerald-50/80 font-bold'
                        : 'hover:bg-slate-50/80'
                    }`}
                  >
                    <td className="p-3 font-sans text-slate-400 font-bold">#{idx + 1}</td>
                    <td className="p-3 font-sans">
                      <div className="font-extrabold text-slate-900 flex items-center gap-1.5">
                        <span>{row.section.name}</span>
                        {isSelected && (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded">
                            Selected
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {row.section.code} • {row.section.category}
                      </div>
                    </td>
                    <td className="p-3 text-right text-slate-800">
                      {formatUnits(row.consumedKwh)}
                    </td>
                    <td className="p-3 text-right text-slate-600">
                      {formatINR(row.energyCharges)}
                    </td>
                    <td className="p-3 text-right text-slate-500">
                      {formatINR(row.fuelCharges + row.duty)}
                    </td>
                    <td className="p-3 text-right font-extrabold text-slate-900 text-sm">
                      {formatINR(row.totalCost)}
                    </td>
                    <td className="p-3 text-right text-slate-600 font-sans">
                      ₹{row.effectiveRate}/u
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 bg-slate-100 h-1.5 rounded-full overflow-hidden border border-slate-200">
                          <div
                            className="bg-emerald-600 h-full rounded-full"
                            style={{ width: `${Math.min(100, row.pctOfPlant * 3)}%` }}
                          />
                        </div>
                        <span className="font-bold text-slate-800">{row.pctOfPlant}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
