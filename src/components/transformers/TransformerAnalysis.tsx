import React, { useState, useMemo } from 'react';
import {
  Cpu,
  Zap,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Clock,
  ArrowRight,
  TrendingDown,
  Download,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { calculateTransformerLosses, formatUnits } from '../../lib/calculations';
import { exportTransformersToExcel } from '../../lib/exportUtils';

export const TransformerAnalysis: React.FC = () => {
  const { transformerReadings, readings, addTransformerReading, currentRole, currentUser } =
    useApp();

  const isAllowedToEnter = currentRole === 'reading_operator' || currentRole === 'electrical_admin';

  // Total main plant energy for today
  const todayStr = new Date().toISOString().split('T')[0];
  const todayPlantUnits = useMemo(() => {
    const todayReadings = readings.filter((r) => r.date === todayStr);
    if (todayReadings.length > 0) {
      return todayReadings.reduce((sum, r) => sum + r.consumedKwh, 0);
    }
    // If no readings today, pick latest date
    const sortedDates = Array.from(new Set(readings.map((r) => r.date))).sort().reverse();
    if (sortedDates.length > 0) {
      return readings
        .filter((r) => r.date === sortedDates[0])
        .reduce((sum, r) => sum + r.consumedKwh, 0);
    }
    return 28500;
  }, [readings, todayStr]);

  // Previous transformer records
  const latestTrRecord = transformerReadings[0];

  // Entry Form States
  const [date, setDate] = useState<string>(todayStr);
  const [time, setTime] = useState<string>('08:30');
  const [mainKwhUnits, setMainKwhUnits] = useState<number>(Number(todayPlantUnits.toFixed(1)));

  // 750 KVA inputs
  const [t750Prev, setT750Prev] = useState<number>(latestTrRecord ? latestTrRecord.t750Curr : 284500);
  const [t750Curr, setT750Curr] = useState<number>(
    latestTrRecord ? Number((latestTrRecord.t750Curr + 310).toFixed(1)) : 284810
  );
  const [t750Mf, setT750Mf] = useState<number>(latestTrRecord ? latestTrRecord.t750Mf : 40);

  // 950 KVA inputs
  const [t950Prev, setT950Prev] = useState<number>(latestTrRecord ? latestTrRecord.t950Curr : 362100);
  const [t950Curr, setT950Curr] = useState<number>(
    latestTrRecord ? Number((latestTrRecord.t950Curr + 315).toFixed(1)) : 362415
  );
  const [t950Mf, setT950Mf] = useState<number>(latestTrRecord ? latestTrRecord.t950Mf : 50);

  const [operatorName, setOperatorName] = useState<string>(currentUser.fullName);
  const [notes, setNotes] = useState<string>('Routine transformer substation log');
  const [isSaved, setIsSaved] = useState<boolean>(false);

  // Live Automatic Calculations
  const calculations = useMemo(() => {
    let error = '';
    if (t750Curr < t750Prev) {
      error = 'Error: 750 KVA current reading cannot be less than previous reading';
    }
    if (t950Curr < t950Prev) {
      error = 'Error: 950 KVA current reading cannot be less than previous reading';
    }

    if (error) {
      return {
        t750Units: 0,
        t950Units: 0,
        totalOutputUnits: 0,
        transformerLosses: 0,
        lossPercentage: 0,
        error,
        isValid: false,
      };
    }

    const res = calculateTransformerLosses(
      mainKwhUnits,
      t750Curr,
      t750Prev,
      t750Mf,
      t950Curr,
      t950Prev,
      t950Mf
    );

    return {
      ...res,
      error: '',
      isValid: true,
    };
  }, [mainKwhUnits, t750Curr, t750Prev, t750Mf, t950Curr, t950Prev, t950Mf]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!calculations.isValid) return;

    await addTransformerReading({
      date,
      time,
      mainKwhUnits,
      t750Prev,
      t750Curr,
      t750Mf,
      t750Units: calculations.t750Units,
      t950Prev,
      t950Curr,
      t950Mf,
      t950Units: calculations.t950Units,
      totalOutputUnits: calculations.totalOutputUnits,
      transformerLosses: calculations.transformerLosses,
      lossPercentage: calculations.lossPercentage,
      operatorName,
      notes,
    });

    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      setT750Prev(t750Curr);
      setT950Prev(t950Curr);
    }, 2500);
  };

  // Recent transformer efficiency averages
  const avgLoss = useMemo(() => {
    if (transformerReadings.length === 0) return 3.1;
    const sum = transformerReadings.reduce((acc, t) => acc + t.lossPercentage, 0);
    return Number((sum / transformerReadings.length).toFixed(2));
  }, [transformerReadings]);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Cpu className="w-5 h-5 text-cyan-400" />
            750 KVA & 950 KVA Transformer Loss Center
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Automated step-down transformer output summation, core/copper loss calculation & efficiency tracking.
          </p>
        </div>

        <button
          onClick={() => exportTransformersToExcel(transformerReadings)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-xs font-semibold text-slate-200 transition-colors self-start sm:self-auto"
        >
          <Download className="w-3.5 h-3.5 text-cyan-400" />
          Export Loss Log (.xlsx)
        </button>
      </div>

      {/* 3 Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4">
          <span className="text-xs text-slate-400 block mb-1">Transformer Yard Capacity:</span>
          <div className="text-2xl font-bold font-mono text-white">1,700 kVA</div>
          <span className="text-[11px] text-cyan-400 mt-1 block">
            750 kVA (Delta-Star) + 950 kVA (Step-Down)
          </span>
        </div>

        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4">
          <span className="text-xs text-slate-400 block mb-1">Current Plant Loss Percentage:</span>
          <div className="text-2xl font-bold font-mono text-emerald-400">
            {latestTrRecord ? `${latestTrRecord.lossPercentage}%` : '2.95%'}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Industrial Benchmark Target: &lt; 4.0%
          </span>
        </div>

        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4">
          <span className="text-xs text-slate-400 block mb-1">30-Day Average Loss:</span>
          <div className="text-2xl font-bold font-mono text-cyan-400">{avgLoss}%</div>
          <span className="text-[11px] text-emerald-400 mt-1 block">
            Optimal High Efficiency Tier
          </span>
        </div>
      </div>

      {/* Entry & Calculation Interface */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-xl">
        <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-400" />
          Record Transformer Log with Automatic Electrical Losses
        </h3>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Metadata row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Date:</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                disabled={!isAllowedToEnter}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Time:</label>
              <input
                type="time"
                required
                value={time}
                onChange={(e) => setTime(e.target.value)}
                disabled={!isAllowedToEnter}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Main Plant KWH Units (All Sections):
              </label>
              <input
                type="number"
                step="0.1"
                required
                value={mainKwhUnits}
                onChange={(e) => setMainKwhUnits(parseFloat(e.target.value) || 0)}
                disabled={!isAllowedToEnter}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-amber-300 font-mono font-bold focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* 750 KVA & 950 KVA Dual Column Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* 750 KVA Card */}
            <div className="rounded-xl bg-slate-950/80 border border-slate-800 p-4 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider">
                  750 KVA Transformer
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  MF: {t750Mf}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="text-slate-400 block mb-1">Previous Dial:</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={t750Prev}
                    onChange={(e) => setT750Prev(parseFloat(e.target.value) || 0)}
                    disabled={!isAllowedToEnter}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-850 border border-slate-700 text-white font-mono text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Current Dial:</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={t750Curr}
                    onChange={(e) => setT750Curr(parseFloat(e.target.value) || 0)}
                    disabled={!isAllowedToEnter}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-850 border border-slate-700 text-white font-mono text-xs focus:outline-none"
                  />
                </div>
              </div>

              {currentRole === 'electrical_admin' && (
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Configurable MF:</label>
                  <input
                    type="number"
                    step="1"
                    value={t750Mf}
                    onChange={(e) => setT750Mf(parseFloat(e.target.value) || 1)}
                    className="w-full px-2.5 py-1 rounded-lg bg-slate-850 border border-slate-700 text-cyan-300 font-mono text-xs focus:outline-none"
                  />
                </div>
              )}

              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">1. 750 KVA Units:</span>
                <span className="text-base font-bold text-cyan-300">
                  {formatUnits(calculations.t750Units)} kWh
                </span>
              </div>
            </div>

            {/* 950 KVA Card */}
            <div className="rounded-xl bg-slate-950/80 border border-slate-800 p-4 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider">
                  950 KVA Transformer
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  MF: {t950Mf}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="text-slate-400 block mb-1">Previous Dial:</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={t950Prev}
                    onChange={(e) => setT950Prev(parseFloat(e.target.value) || 0)}
                    disabled={!isAllowedToEnter}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-850 border border-slate-700 text-white font-mono text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Current Dial:</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={t950Curr}
                    onChange={(e) => setT950Curr(parseFloat(e.target.value) || 0)}
                    disabled={!isAllowedToEnter}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-850 border border-slate-700 text-white font-mono text-xs focus:outline-none"
                  />
                </div>
              </div>

              {currentRole === 'electrical_admin' && (
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Configurable MF:</label>
                  <input
                    type="number"
                    step="1"
                    value={t950Mf}
                    onChange={(e) => setT950Mf(parseFloat(e.target.value) || 1)}
                    className="w-full px-2.5 py-1 rounded-lg bg-slate-850 border border-slate-700 text-indigo-300 font-mono text-xs focus:outline-none"
                  />
                </div>
              )}

              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">2. 950 KVA Units:</span>
                <span className="text-base font-bold text-indigo-300">
                  {formatUnits(calculations.t950Units)} kWh
                </span>
              </div>
            </div>
          </div>

          {/* Automatic Transformer Loss Calculation Results Display */}
          <div className="rounded-xl bg-slate-950 p-4 border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Automatic Electrical Calculations Results
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block">3. Total Transformer Output:</span>
                <span className="text-base font-bold text-white">
                  {formatUnits(calculations.totalOutputUnits)} kWh
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">750 KVA + 950 KVA</span>
              </div>

              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block">4. Transformer Losses:</span>
                <span className="text-base font-bold text-amber-400">
                  {formatUnits(calculations.transformerLosses)} kWh
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Main Units − Total Output
                </span>
              </div>

              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block">5. Loss Percentage:</span>
                <span
                  className={`text-base font-bold ${
                    calculations.lossPercentage <= 4.0 ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  {calculations.lossPercentage}%
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  (Losses ÷ Main Units) × 100
                </span>
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-800">
            <div>
              {isSaved && (
                <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold">
                  <CheckCircle2 className="w-4 h-4" /> Transformer Reading Saved!
                </span>
              )}
            </div>

            <button
              type="submit"
              disabled={!isAllowedToEnter || !calculations.isValid}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-950/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <span>Record Transformer Reading</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>

      {/* Historical Transformer Logs Table */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5">
        <h3 className="text-sm font-bold text-white mb-3">
          Historical Transformer Loss Records
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="pb-2">Date</th>
                <th className="pb-2">Time</th>
                <th className="pb-2 text-white">Main Units</th>
                <th className="pb-2 text-cyan-300">750 KVA Units</th>
                <th className="pb-2 text-indigo-300">950 KVA Units</th>
                <th className="pb-2">Total Output</th>
                <th className="pb-2 text-amber-400">Losses (kWh)</th>
                <th className="pb-2 text-emerald-400">Loss %</th>
                <th className="pb-2">Operator</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {transformerReadings.slice(0, 10).map((t) => (
                <tr key={t.id} className="text-slate-300 hover:bg-slate-800/40">
                  <td className="py-2.5 font-semibold text-white">{t.date}</td>
                  <td className="py-2.5 text-slate-400">{t.time}</td>
                  <td className="py-2.5 text-white font-bold">{formatUnits(t.mainKwhUnits)}</td>
                  <td className="py-2.5 text-cyan-300">{formatUnits(t.t750Units)}</td>
                  <td className="py-2.5 text-indigo-300">{formatUnits(t.t950Units)}</td>
                  <td className="py-2.5">{formatUnits(t.totalOutputUnits)}</td>
                  <td className="py-2.5 text-amber-400 font-semibold">{formatUnits(t.transformerLosses)}</td>
                  <td className="py-2.5 font-bold text-emerald-400">{t.lossPercentage}%</td>
                  <td className="py-2.5 text-slate-400">{t.operatorName}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
