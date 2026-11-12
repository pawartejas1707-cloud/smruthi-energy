import React, { useState, useMemo } from 'react';
import {
  IndianRupee,
  Calendar,
  Layers,
  Search,
  TrendingUp,
  BarChart3,
  FileSpreadsheet,
  Zap,
  Building2,
  PieChart as PieIcon,
  CheckCircle2,
  Settings,
  LayoutGrid,
  Table as TableIcon,
  Check,
  X,
  Save,
  Calculator,
  Sliders,
  Sparkles,
  Info,
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
  const { sections, readings, costSettings, updateCostSettings } = useApp();

  const [timeframe, setTimeframe] = useState<CostTimeframe>('month');
  const [selectedBlockId, setSelectedBlockId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [chartType, setChartType] = useState<'bar' | 'area'>('bar');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // Cost Settings Modal State
  const [isCostModalOpen, setIsCostModalOpen] = useState(false);
  const [formRate, setFormRate] = useState<number>(costSettings.ratePerKwh);
  const [formFac, setFormFac] = useState<number>(costSettings.fuelAdjustmentChargePerKwh);
  const [formTax, setFormTax] = useState<number>(costSettings.taxRatePercent);
  const [formDemand, setFormDemand] = useState<number>(costSettings.demandChargePerKva);
  const [formFixed, setFormFixed] = useState<number>(costSettings.fixedMonthlyCharges);
  const [formDate, setFormDate] = useState<string>(costSettings.effectiveDate);
  const [isSavingCost, setIsSavingCost] = useState(false);
  const [saveCostSuccess, setSaveCostSuccess] = useState(false);

  // Sync form state when modal opens
  const handleOpenCostModal = () => {
    setFormRate(costSettings.ratePerKwh || 8.75);
    setFormFac(costSettings.fuelAdjustmentChargePerKwh || 0.42);
    setFormTax(costSettings.taxRatePercent || 6.0);
    setFormDemand(costSettings.demandChargePerKva || 350);
    setFormFixed(costSettings.fixedMonthlyCharges || 50000);
    setFormDate(costSettings.effectiveDate || '2026-04-01');
    setIsCostModalOpen(true);
  };

  const handleSaveCostSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingCost(true);
    try {
      await updateCostSettings({
        ratePerKwh: Number(formRate),
        fuelAdjustmentChargePerKwh: Number(formFac),
        taxRatePercent: Number(formTax),
        demandChargePerKva: Number(formDemand),
        fixedMonthlyCharges: Number(formFixed),
        effectiveDate: formDate,
      });
      setSaveCostSuccess(true);
      setTimeout(() => {
        setSaveCostSuccess(false);
        setIsCostModalOpen(false);
      }, 1200);
    } finally {
      setIsSavingCost(false);
    }
  };

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

  // Filtered rows/cards based on search
  const filteredBlocks = useMemo(() => {
    if (!searchQuery.trim()) return blockCostData;
    const q = searchQuery.toLowerCase();
    return blockCostData.filter(
      (b) =>
        b.section.name.toLowerCase().includes(q) ||
        b.section.code.toLowerCase().includes(q) ||
        b.section.category.toLowerCase().includes(q)
    );
  }, [blockCostData, searchQuery]);

  // Preview effective calculation for the modal
  const modalEffectivePreview = useMemo(() => {
    const subtotal = Number(formRate || 0) + Number(formFac || 0);
    const tax = subtotal * (Number(formTax || 0) / 100);
    const eff = subtotal + tax;
    const sampleUnits = 10000;
    const sampleCost = sampleUnits * eff;
    return {
      subtotal: Number(subtotal.toFixed(2)),
      tax: Number(tax.toFixed(2)),
      effectiveRate: Number(eff.toFixed(2)),
      sampleCost: Number(sampleCost.toFixed(0)),
    };
  }, [formRate, formFac, formTax]);

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
                {periodLabel} • HT Base: ₹{costSettings.ratePerKwh}/kWh | Duty: {costSettings.taxRatePercent}% | FAC: ₹{costSettings.fuelAdjustmentChargePerKwh}/kWh
              </p>
            </div>
          </div>
        </div>

        {/* Timeframe & Block Selectors & Cost Settings Button */}
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

          {/* Cost Settings & Tariff Configuration Button */}
          <button
            onClick={handleOpenCostModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
            title="Configure HT Tariffs, Duty, and Cost Settings"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Cost Settings</span>
          </button>
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

        {/* Effective Rate Card with Quick Configure Link */}
        <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm border-l-4 border-l-indigo-600 group">
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
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">
              Base: ₹{costSettings.ratePerKwh} + Duty + FAC
            </span>
            <button
              onClick={handleOpenCostModal}
              className="text-xs text-indigo-700 hover:text-indigo-900 font-bold flex items-center gap-1 group-hover:underline cursor-pointer"
            >
              <Settings className="w-3 h-3" />
              <span>Configure</span>
            </button>
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

      {/* 4. Block-Wise Electricity Cost Breakdown (CARDS COMPARTMENT) */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
        {/* Compartment Toolbar */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider">
                Block-Wise Electricity Cost Breakdown
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                21 Blocks
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Click any block card to filter and analyze its separate cost trend above. Ranked by highest bill.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* View Switcher: Cards View vs Table View */}
            <div className="flex items-center bg-white p-1 rounded-xl border border-slate-300 text-xs shadow-sm">
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold transition-all ${
                  viewMode === 'cards'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Cards</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold transition-all ${
                  viewMode === 'table'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span>Table</span>
              </button>
            </div>

            {/* Search Input */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-xs w-44 sm:w-56 shadow-sm">
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search block..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent text-slate-900 font-medium focus:outline-none w-full text-xs"
              />
            </div>

            {/* Reset Filter Button */}
            {selectedBlockId !== 'all' && (
              <button
                onClick={() => setSelectedBlockId('all')}
                className="px-3 py-1.5 rounded-xl bg-slate-800 text-white text-xs font-bold shadow-sm hover:bg-slate-700 transition-colors"
              >
                Show All Blocks
              </button>
            )}
          </div>
        </div>

        {/* View Mode 1: CARDS VIEW (Primary) */}
        {viewMode === 'cards' && (
          <div className="p-4 bg-slate-50/50">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredBlocks.map((row, idx) => {
                const isSelected = selectedBlockId === row.section.id;
                return (
                  <div
                    key={row.section.id}
                    onClick={() => setSelectedBlockId(isSelected ? 'all' : row.section.id)}
                    className={`group relative rounded-2xl p-4 border transition-all duration-200 shadow-sm cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-50/80 border-emerald-500 ring-2 ring-emerald-500/20 shadow-md'
                        : 'bg-white border-slate-200 hover:border-emerald-300 hover:shadow-md'
                    }`}
                  >
                    {/* Card Header: Rank, Block Name, Selected / Share Badge */}
                    <div className="flex items-start justify-between gap-2 mb-2.5">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-black font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-md shrink-0">
                            #{idx + 1}
                          </span>
                          <h4 className="font-extrabold text-sm text-slate-900 truncate group-hover:text-emerald-700 transition-colors">
                            {row.section.name}
                          </h4>
                        </div>
                        <p className="text-[10px] text-slate-500 font-mono mt-0.5 truncate">
                          {row.section.code} • {row.section.category}
                        </p>
                      </div>

                      {isSelected ? (
                        <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600 text-white shadow-sm flex items-center gap-1">
                          <Check className="w-2.5 h-2.5" />
                          <span>Selected</span>
                        </span>
                      ) : (
                        <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                          {row.pctOfPlant}% Bill
                        </span>
                      )}
                    </div>

                    {/* Primary Cost Metric Card Area */}
                    <div className="mb-3 p-3 rounded-xl bg-slate-50 border border-slate-100 group-hover:bg-emerald-50/40 transition-colors">
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">
                        Total Electricity Cost
                      </div>
                      <div className="text-xl sm:text-2xl font-black font-mono text-slate-900 tracking-tight text-emerald-800">
                        {formatINR(row.totalCost)}
                      </div>
                      <div className="text-[10px] text-slate-500 font-medium mt-1.5 flex items-center justify-between">
                        <span>Units Consumed:</span>
                        <span className="font-mono font-bold text-slate-900">{formatUnits(row.consumedKwh)} kWh</span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-medium mt-1 flex items-center justify-between">
                        <span>Effective Rate:</span>
                        <span className="font-mono font-bold text-slate-700">₹{row.effectiveRate} / kWh</span>
                      </div>
                    </div>

                    {/* Share of Plant Bill Visual Progress Bar */}
                    <div className="space-y-1 pt-2.5 border-t border-slate-100">
                      <div className="flex items-center justify-between text-[10px] text-slate-500">
                        <span className="font-sans">Share of Total Bill:</span>
                        <span className="font-mono font-bold text-slate-700">{row.pctOfPlant}%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden border border-slate-200">
                        <div
                          className="bg-emerald-600 h-full rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(100, row.pctOfPlant * 3)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* View Mode 2: TABLE VIEW (Optional Switch) */}
        {viewMode === 'table' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-600 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-3">Rank</th>
                  <th className="p-3">Feeder Block</th>
                  <th className="p-3 text-right">Consumed Units (kWh)</th>
                  <th className="p-3 text-right font-black text-slate-900">Total Bill (₹)</th>
                  <th className="p-3 text-right">Effective Rate</th>
                  <th className="p-3 text-right">% of Plant Bill</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {filteredBlocks.map((row, idx) => {
                  const isSelected = selectedBlockId === row.section.id;
                  return (
                    <tr
                      key={row.section.id}
                      onClick={() => setSelectedBlockId(isSelected ? 'all' : row.section.id)}
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
        )}
      </div>

      {/* 5. Cost Settings & Tariff Configuration Modal */}
      {isCostModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-xl rounded-2xl bg-white border border-slate-200 shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto">
            {/* Close Button */}
            <button
              onClick={() => setIsCostModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-800 border border-emerald-300">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Electricity Cost & HT Tariff Configuration
                </h3>
                <p className="text-xs text-slate-500">
                  Configure electricity unit rates, duty, FAC, and demand charges applied across all plant blocks.
                </p>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveCostSettings} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 1. Base Energy Rate (₹/kWh) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Base HT Rate (₹ / kWh) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">₹</span>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formRate}
                      onChange={(e) => setFormRate(parseFloat(e.target.value) || 0)}
                      className="w-full pl-7 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Standard HT-1 Industrial tariff</span>
                </div>

                {/* 2. Fuel Adjustment Charge (FAC ₹/kWh) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Fuel Adjustment (FAC) (₹ / kWh) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">₹</span>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formFac}
                      onChange={(e) => setFormFac(parseFloat(e.target.value) || 0)}
                      className="w-full pl-7 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Monthly variable fuel surcharge</span>
                </div>

                {/* 3. Electricity Duty / Tax (%) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Electricity Duty / Tax (%) *
                  </label>
                  <div className="relative">
                    <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400">%</span>
                    <input
                      type="number"
                      step="0.1"
                      required
                      value={formTax}
                      onChange={(e) => setFormTax(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">State Electricity Duty percentage</span>
                </div>

                {/* 4. Demand Charge (₹/kVA/month) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Contract Demand Charge (₹ / kVA)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">₹</span>
                    <input
                      type="number"
                      step="1"
                      value={formDemand}
                      onChange={(e) => setFormDemand(parseFloat(e.target.value) || 0)}
                      className="w-full pl-7 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Per kVA of recorded billing demand</span>
                </div>

                {/* 5. Fixed Monthly Charges (₹/month) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Fixed Monthly Surcharge (₹)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">₹</span>
                    <input
                      type="number"
                      step="100"
                      value={formFixed}
                      onChange={(e) => setFormFixed(parseFloat(e.target.value) || 0)}
                      className="w-full pl-7 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Meter rent, standing infrastructure</span>
                </div>

                {/* 6. Tariff Effective Date */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tariff Effective Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Date of MSEDCL tariff order</span>
                </div>
              </div>

              {/* Live Preview Box */}
              <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs">
                <div className="flex items-center gap-1.5 text-emerald-800 font-extrabold mb-1">
                  <Calculator className="w-4 h-4 text-emerald-600" />
                  <span>Calculated Effective Rate Preview:</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 font-mono text-[11px] text-slate-700 pt-1">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Subtotal (Base + FAC):</span>
                    <span className="font-bold">₹{modalEffectivePreview.subtotal}/kWh</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Duty ({formTax}%):</span>
                    <span className="font-bold">+₹{modalEffectivePreview.tax}/kWh</span>
                  </div>
                  <div>
                    <span className="text-emerald-800 font-bold block text-[10px]">Effective Tariff:</span>
                    <span className="font-black text-emerald-700 text-sm">₹{modalEffectivePreview.effectiveRate} / kWh</span>
                  </div>
                </div>
                <p className="text-[10px] text-emerald-700 mt-2 font-medium">
                  Sample: 10,000 kWh consumption = {formatINR(modalEffectivePreview.sampleCost)} base energy bill.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                <div className="text-[11px] text-slate-500">
                  Last updated by: <span className="font-semibold">{costSettings.updatedBy}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCostModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={isSavingCost}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
                  >
                    {saveCostSuccess ? (
                      <>
                        <Check className="w-4 h-4 text-white" />
                        <span>Saved & Applied!</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>{isSavingCost ? 'Saving...' : 'Save & Apply Tariff'}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};