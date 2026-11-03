import React, { useMemo } from 'react';
import { Cpu, Zap, Activity, AlertTriangle, CheckCircle2, TrendingDown, ArrowRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatUnits } from '../../lib/calculations';

export const PlantAdminTransformers: React.FC = () => {
  const { transformerReadings, readings } = useApp();

  const latestRecord = transformerReadings[0];

  // Plant total for today
  const todayStr = new Date().toISOString().split('T')[0];
  const todayPlantUnits = useMemo(() => {
    const todayReadings = readings.filter((r) => r.date === todayStr);
    if (todayReadings.length > 0) {
      return todayReadings.reduce((sum, r) => sum + r.consumedKwh, 0);
    }
    const sortedDates = Array.from(new Set(readings.map((r) => r.date))).sort().reverse();
    if (sortedDates.length > 0) {
      return readings
        .filter((r) => r.date === sortedDates[0])
        .reduce((sum, r) => sum + r.consumedKwh, 0);
    }
    return 28500;
  }, [readings, todayStr]);

  // Current transformer snapshot
  const mainKwh = latestRecord?.mainKwhUnits || todayPlantUnits;
  const t750Units = latestRecord?.t750Units || Math.round(mainKwh * 0.44);
  const t950Units = latestRecord?.t950Units || Math.round(mainKwh * 0.54);
  const totalOutput = latestRecord?.totalOutputUnits || t750Units + t950Units;
  const losses = latestRecord?.transformerLosses ?? Math.max(0, mainKwh - totalOutput);
  const lossPct = latestRecord?.lossPercentage ?? Number(((losses / mainKwh) * 100).toFixed(2));

  const isLossNormal = lossPct <= 3.5;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
              <Cpu className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
              Substation Transformers & Technical Loss Analysis
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            11 KV / 415 V Primary Substation • 750 KVA & 950 KVA Transformers Operational Efficiency.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="px-3 py-1 rounded-xl bg-slate-100 border border-slate-300 font-bold text-slate-700">
            HT Incomer: 11,000 V
          </span>
          <span
            className={`px-3 py-1 rounded-xl border font-bold flex items-center gap-1.5 ${
              isLossNormal
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                : 'bg-red-50 text-red-700 border-red-300'
            }`}
          >
            {isLossNormal ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Losses Within Normal Range (&le;3.5%)</span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                <span>Elevated Transformer Losses (&gt;3.5%)</span>
              </>
            )}
          </span>
        </div>
      </div>

      {/* 4 Telemetry Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Main Incomer */}
        <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm border-l-4 border-l-blue-600">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              HT Main Incomer Energy
            </span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-700">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-slate-900">
            {formatUnits(mainKwh)} <span className="text-sm font-normal text-slate-500">kWh</span>
          </div>
          <div className="mt-2 text-xs text-slate-500 font-medium">
            Primary 11 KV Grid Inflow Meter
          </div>
        </div>

        {/* 750 KVA Output */}
        <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm border-l-4 border-l-indigo-600">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              750 KVA Transformer (TR-1)
            </span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-700">
              <Cpu className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-slate-900">
            {formatUnits(t750Units)} <span className="text-sm font-normal text-slate-500">kWh</span>
          </div>
          <div className="mt-2 text-xs text-slate-500 font-medium">
            Share: {Number(((t750Units / totalOutput) * 100).toFixed(1))}% of Output
          </div>
        </div>

        {/* 950 KVA Output */}
        <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm border-l-4 border-l-cyan-600">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              950 KVA Transformer (TR-2)
            </span>
            <div className="p-2 rounded-xl bg-cyan-50 text-cyan-700">
              <Cpu className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-slate-900">
            {formatUnits(t950Units)} <span className="text-sm font-normal text-slate-500">kWh</span>
          </div>
          <div className="mt-2 text-xs text-slate-500 font-medium">
            Share: {Number(((t950Units / totalOutput) * 100).toFixed(1))}% of Output
          </div>
        </div>

        {/* Technical Losses */}
        <div
          className={`rounded-2xl bg-white border p-5 shadow-sm border-l-4 ${
            isLossNormal
              ? 'border-slate-200 border-l-emerald-600'
              : 'border-red-200 border-l-red-600 bg-red-50/30'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Technical Transformer Losses
            </span>
            <div
              className={`p-2 rounded-xl ${
                isLossNormal ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
              }`}
            >
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-slate-900">
            {formatUnits(losses)} <span className="text-sm font-normal text-slate-500">kWh</span>
          </div>
          <div className="mt-2 text-xs font-bold font-mono">
            Loss: <span className={isLossNormal ? 'text-emerald-700' : 'text-red-700'}>{lossPct}%</span>{' '}
            <span className="text-slate-500 font-normal font-sans">(Target &le; 3.0%)</span>
          </div>
        </div>
      </div>

      {/* Energy Flow Balance Diagram */}
      <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm">
        <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Activity className="w-4 h-4 text-blue-600" />
          Substation Energy Balance Flow
        </h3>

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 font-mono text-xs">
          {/* Incomer Node */}
          <div className="text-center p-3 rounded-xl bg-blue-50 border border-blue-200 w-full md:w-56">
            <div className="text-[10px] text-blue-700 font-sans font-bold uppercase">Main Incomer Input</div>
            <div className="text-lg font-black text-blue-900 mt-1">{formatUnits(mainKwh)} kWh</div>
            <div className="text-[10px] text-slate-500 font-sans mt-0.5">100.0% Input Energy</div>
          </div>

          <ArrowRight className="w-5 h-5 text-slate-400 rotate-90 md:rotate-0 shrink-0" />

          {/* Combined Transformers */}
          <div className="flex-1 w-full space-y-2">
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-slate-200">
              <span className="font-sans font-bold text-slate-700">750 KVA Transformer Output:</span>
              <span className="font-bold text-slate-900">{formatUnits(t750Units)} kWh</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-slate-200">
              <span className="font-sans font-bold text-slate-700">950 KVA Transformer Output:</span>
              <span className="font-bold text-slate-900">{formatUnits(t950Units)} kWh</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-50 border border-emerald-200">
              <span className="font-sans font-bold text-emerald-800">Total Substation Output:</span>
              <span className="font-black text-emerald-900">{formatUnits(totalOutput)} kWh</span>
            </div>
          </div>

          <ArrowRight className="w-5 h-5 text-slate-400 rotate-90 md:rotate-0 shrink-0" />

          {/* Loss Node */}
          <div
            className={`text-center p-3 rounded-xl border w-full md:w-56 ${
              isLossNormal ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'
            }`}
          >
            <div className="text-[10px] text-slate-600 font-sans font-bold uppercase">
              Transformer Losses
            </div>
            <div className={`text-lg font-black mt-1 ${isLossNormal ? 'text-emerald-800' : 'text-red-800'}`}>
              {formatUnits(losses)} kWh
            </div>
            <div className="text-[10px] font-sans font-bold mt-0.5">
              {lossPct}% Technical Loss
            </div>
          </div>
        </div>
      </div>

      {/* Historical Transformer Logs Table */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider">
            Substation Operational Logs History
          </h3>
          <span className="text-xs text-slate-500 font-medium">
            {transformerReadings.length} Log Entries Recorded
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-600 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="p-3">Date</th>
                <th className="p-3">Time</th>
                <th className="p-3 text-right">Main Incomer (kWh)</th>
                <th className="p-3 text-right">750 KVA (kWh)</th>
                <th className="p-3 text-right">950 KVA (kWh)</th>
                <th className="p-3 text-right">Total Output (kWh)</th>
                <th className="p-3 text-right">Losses (kWh)</th>
                <th className="p-3 text-right">Loss %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {transformerReadings.slice(0, 15).map((log, idx) => {
                const lossNormal = log.lossPercentage <= 3.5;
                return (
                  <tr key={log.id || idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-sans font-bold text-slate-900">{log.date}</td>
                    <td className="p-3 text-slate-600 font-sans">{log.time}</td>
                    <td className="p-3 text-right font-bold text-slate-900">
                      {formatUnits(log.mainKwhUnits)}
                    </td>
                    <td className="p-3 text-right text-slate-700">{formatUnits(log.t750Units)}</td>
                    <td className="p-3 text-right text-slate-700">{formatUnits(log.t950Units)}</td>
                    <td className="p-3 text-right font-bold text-slate-900">
                      {formatUnits(log.totalOutputUnits)}
                    </td>
                    <td className="p-3 text-right text-slate-700">
                      {formatUnits(log.transformerLosses)}
                    </td>
                    <td className="p-3 text-right">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          lossNormal
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-red-50 text-red-700 border border-red-200'
                        }`}
                      >
                        {log.lossPercentage}%
                      </span>
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
