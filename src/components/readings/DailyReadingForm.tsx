import React, { useState, useEffect, useMemo } from 'react';
import {
  Zap,
  CheckCircle2,
  AlertCircle,
  Clock,
  Calendar,
  User,
  Layers,
  Calculator,
  ArrowRight,
  ShieldAlert,
  Activity,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { calculateUnits, calculatePowerFactor, calculateContractDemand, formatUnits } from '../../lib/calculations';

export const DailyReadingForm: React.FC = () => {
  const { sections, readings, addDailyReading, currentRole, currentUser } = useApp();

  const isAllowedToEnter = currentRole === 'reading_operator' || currentRole === 'electrical_admin';

  // Selected Section & Meter
  const [selectedSectionId, setSelectedSectionId] = useState<string>(sections[0]?.id || '');
  const activeSection = useMemo(
    () => sections.find((s) => s.id === selectedSectionId) || sections[0],
    [sections, selectedSectionId]
  );

  const [selectedMeterId, setSelectedMeterId] = useState<string>(
    activeSection?.meters[0]?.id || ''
  );

  // When section changes, default to its first meter
  useEffect(() => {
    if (activeSection && activeSection.meters.length > 0) {
      setSelectedMeterId(activeSection.meters[0].id);
    }
  }, [activeSection]);

  const activeMeter = useMemo(
    () => activeSection?.meters.find((m) => m.id === selectedMeterId) || activeSection?.meters[0],
    [activeSection, selectedMeterId]
  );

  // Form inputs
  const todayStr = new Date().toISOString().split('T')[0];
  const [readingDate, setReadingDate] = useState<string>(todayStr);
  const [readingTime, setReadingTime] = useState<string>('08:30');
  const [operatorName, setOperatorName] = useState<string>(currentUser.fullName);
  const [shift, setShift] = useState<'Shift 1 (Morning)' | 'Shift 2 (Evening)' | 'Shift 3 (Night)' | 'General Shift'>(
    'Shift 1 (Morning)'
  );
  const [notes, setNotes] = useState<string>('');

  // Find previous recorded reading for this meter
  const previousRecord = useMemo(() => {
    const meterReadings = readings
      .filter((r) => r.meterId === activeMeter?.id)
      .sort((a, b) => new Date(b.date + ' ' + b.time).getTime() - new Date(a.date + ' ' + a.time).getTime());
    return meterReadings[0] || null;
  }, [readings, activeMeter]);

  // KWH fields
  const [prevKwh, setPrevKwh] = useState<number>(0);
  const [currKwh, setCurrKwh] = useState<number>(0);
  const [kwhMf, setKwhMf] = useState<number>(activeMeter?.kwhMf || 1);

  // KVAH fields
  const [prevKvah, setPrevKvah] = useState<number>(0);
  const [currKvah, setCurrKvah] = useState<number>(0);
  const [kvahMf, setKvahMf] = useState<number>(activeMeter?.kvahMf || 1);

  // Contract Demand fields
  const [prevDemand, setPrevDemand] = useState<number>(0);
  const [currDemand, setCurrDemand] = useState<number>(0);
  const [demandMf, setDemandMf] = useState<number>(activeMeter?.contractDemandMf || 1);

  // Auto-populate when meter or previous record changes
  useEffect(() => {
    if (activeMeter) {
      setKwhMf(activeMeter.kwhMf);
      setKvahMf(activeMeter.kvahMf);
      setDemandMf(activeMeter.contractDemandMf);

      if (previousRecord) {
        setPrevKwh(previousRecord.currKwh);
        setCurrKwh(Number((previousRecord.currKwh + 15).toFixed(1)));
        setPrevKvah(previousRecord.currKvah);
        setCurrKvah(Number((previousRecord.currKvah + 16).toFixed(1)));
        setPrevDemand(previousRecord.currDemand || 0);
        setCurrDemand(Number(((previousRecord.currDemand || 0) + 5).toFixed(1)));
      } else {
        setPrevKwh(1000);
        setCurrKwh(1015);
        setPrevKvah(1000);
        setCurrKvah(1016);
        setPrevDemand(50);
        setCurrDemand(55);
      }
    }
  }, [activeMeter, previousRecord]);

  // Live Automatic Electrical Calculations
  const calculations = useMemo(() => {
    let consumedKwh = 0;
    let consumedKvah = 0;
    let powerFactor = 1.0;
    let calculatedDemand = 0;
    let errorMessage = '';

    // Validation: prevent negative consumption
    if (currKwh < prevKwh) {
      errorMessage = 'Error: Current KWH cannot be lower than Previous KWH. Negative consumption prevented.';
    } else {
      consumedKwh = Number(((currKwh - prevKwh) * kwhMf).toFixed(2));
    }

    if (currKvah < prevKvah) {
      errorMessage = 'Error: Current KVAH cannot be lower than Previous KVAH. Negative consumption prevented.';
    } else {
      consumedKvah = Number(((currKvah - prevKvah) * kvahMf).toFixed(2));
    }

    if (!errorMessage) {
      powerFactor = calculatePowerFactor(consumedKwh, consumedKvah);
      calculatedDemand = calculateContractDemand(currDemand, prevDemand, demandMf);
    }

    return {
      consumedKwh,
      consumedKvah,
      powerFactor,
      calculatedDemand,
      errorMessage,
      isValid: !errorMessage && currKwh >= prevKwh && currKvah >= prevKvah,
    };
  }, [prevKwh, currKwh, kwhMf, prevKvah, currKvah, kvahMf, prevDemand, currDemand, demandMf]);

  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!calculations.isValid || !activeMeter || !activeSection) return;

    await addDailyReading({
      date: readingDate,
      time: readingTime,
      sectionId: activeSection.id,
      meterId: activeMeter.id,
      meterCode: activeMeter.meterCode,
      meterName: activeMeter.meterName,
      prevKwh,
      currKwh,
      kwhMf,
      consumedKwh: calculations.consumedKwh,
      prevKvah,
      currKvah,
      kvahMf,
      consumedKvah: calculations.consumedKvah,
      powerFactor: calculations.powerFactor,
      prevDemand,
      currDemand,
      demandMf,
      calculatedDemand: calculations.calculatedDemand,
      operatorName,
      shift,
      notes,
    });

    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      // Advance current reading to previous for next entry
      setPrevKwh(currKwh);
      setPrevKvah(currKvah);
      setPrevDemand(currDemand);
    }, 2500);
  };

  return (
    <div className="space-y-6">
      {/* Title & Role Gate */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400" />
            Daily Meter Reading Entry System
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Record KWH, KVAH & Contract Demand readings with automatic Multiplying Factor (MF) and Power Factor (PF) calculations.
          </p>
        </div>

        {!isAllowedToEnter && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-red-950/60 border border-red-800 text-xs text-red-300">
            <ShieldAlert className="w-4 h-4 shrink-0 text-red-400" />
            <span>Entry disabled for {currentRole.replace('_', ' ').toUpperCase()}. Switch role to Operator or Electrical Admin to submit.</span>
          </div>
        )}
      </div>

      {/* Main Reading Form Card */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 shadow-xl p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section & Meter Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-950/70 border border-slate-800">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Target Section (1 of 21 Sections):
              </label>
              <select
                value={selectedSectionId}
                onChange={(e) => setSelectedSectionId(e.target.value)}
                disabled={!isAllowedToEnter}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-850 border border-slate-700 text-xs font-medium text-white focus:outline-none focus:border-cyan-500"
              >
                {sections.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.code}) — Limit: {formatUnits(s.dailyLimitKwh)} kWh
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Meter Selection:
              </label>
              <select
                value={selectedMeterId}
                onChange={(e) => setSelectedMeterId(e.target.value)}
                disabled={!isAllowedToEnter}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-850 border border-slate-700 text-xs font-medium text-white focus:outline-none focus:border-cyan-500"
              >
                {activeSection?.meters.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.meterCode} — {m.meterName} (MF: {m.kwhMf})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Reading Timestamp & Operator Metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Reading Date:
              </label>
              <input
                type="date"
                required
                value={readingDate}
                onChange={(e) => setReadingDate(e.target.value)}
                disabled={!isAllowedToEnter}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Reading Time:
              </label>
              <input
                type="time"
                required
                value={readingTime}
                onChange={(e) => setReadingTime(e.target.value)}
                disabled={!isAllowedToEnter}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Shift:</label>
              <select
                value={shift}
                onChange={(e: any) => setShift(e.target.value)}
                disabled={!isAllowedToEnter}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="Shift 1 (Morning)">Shift 1 (Morning 08:00 - 16:00)</option>
                <option value="Shift 2 (Evening)">Shift 2 (Evening 16:00 - 00:00)</option>
                <option value="Shift 3 (Night)">Shift 3 (Night 00:00 - 08:00)</option>
                <option value="General Shift">General Shift (09:00 - 17:30)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Operator Details:
              </label>
              <input
                type="text"
                required
                value={operatorName}
                onChange={(e) => setOperatorName(e.target.value)}
                disabled={!isAllowedToEnter}
                placeholder="Operator Name / ID"
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-500 font-medium"
              />
            </div>
          </div>

          {/* Three Reading Cards: KWH, KVAH, Contract Demand */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* 1. KWH Reading Card */}
            <div className="rounded-xl bg-slate-950/80 border border-slate-800 p-4 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5" /> 1. Active Energy (KWH)
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  MF: {kwhMf}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="text-slate-400 block mb-1">Previous Dial:</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={prevKwh}
                    onChange={(e) => setPrevKwh(parseFloat(e.target.value) || 0)}
                    disabled={!isAllowedToEnter}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-850 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Current Dial:</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={currKwh}
                    onChange={(e) => setCurrKwh(parseFloat(e.target.value) || 0)}
                    disabled={!isAllowedToEnter}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-850 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Electrical Admin MF config */}
              {currentRole === 'electrical_admin' && (
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Configurable MF:</label>
                  <input
                    type="number"
                    step="0.1"
                    value={kwhMf}
                    onChange={(e) => setKwhMf(parseFloat(e.target.value) || 1)}
                    className="w-full px-2.5 py-1 rounded-lg bg-slate-850 border border-slate-700 text-amber-300 font-mono text-xs focus:outline-none"
                  />
                </div>
              )}

              {/* Automatic Units Calculation */}
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">Calculated Units:</span>
                <span className="text-base font-bold text-amber-400">
                  {formatUnits(calculations.consumedKwh)} kWh
                </span>
              </div>
            </div>

            {/* 2. KVAH Reading Card */}
            <div className="rounded-xl bg-slate-950/80 border border-slate-800 p-4 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5" /> 2. Apparent Energy (KVAH)
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  MF: {kvahMf}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="text-slate-400 block mb-1">Previous Dial:</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={prevKvah}
                    onChange={(e) => setPrevKvah(parseFloat(e.target.value) || 0)}
                    disabled={!isAllowedToEnter}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-850 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Current Dial:</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={currKvah}
                    onChange={(e) => setCurrKvah(parseFloat(e.target.value) || 0)}
                    disabled={!isAllowedToEnter}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-850 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {currentRole === 'electrical_admin' && (
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Configurable MF:</label>
                  <input
                    type="number"
                    step="0.1"
                    value={kvahMf}
                    onChange={(e) => setKvahMf(parseFloat(e.target.value) || 1)}
                    className="w-full px-2.5 py-1 rounded-lg bg-slate-850 border border-slate-700 text-cyan-300 font-mono text-xs focus:outline-none"
                  />
                </div>
              )}

              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">Calculated Units:</span>
                <span className="text-base font-bold text-cyan-400">
                  {formatUnits(calculations.consumedKvah)} kVAh
                </span>
              </div>
            </div>

            {/* 3. Contract Demand Card */}
            <div className="rounded-xl bg-slate-950/80 border border-slate-800 p-4 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Calculator className="w-3.5 h-3.5" /> 3. Contract Demand
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  MF: {demandMf}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="text-slate-400 block mb-1">Previous Dial:</label>
                  <input
                    type="number"
                    step="0.1"
                    value={prevDemand}
                    onChange={(e) => setPrevDemand(parseFloat(e.target.value) || 0)}
                    disabled={!isAllowedToEnter}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-850 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Current Dial:</label>
                  <input
                    type="number"
                    step="0.1"
                    value={currDemand}
                    onChange={(e) => setCurrDemand(parseFloat(e.target.value) || 0)}
                    disabled={!isAllowedToEnter}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-850 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {currentRole === 'electrical_admin' && (
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Demand MF:</label>
                  <input
                    type="number"
                    step="0.05"
                    value={demandMf}
                    onChange={(e) => setDemandMf(parseFloat(e.target.value) || 1)}
                    className="w-full px-2.5 py-1 rounded-lg bg-slate-850 border border-slate-700 text-purple-300 font-mono text-xs focus:outline-none"
                  />
                </div>
              )}

              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">Demand:</span>
                <span className="text-base font-bold text-purple-400">
                  {formatUnits(calculations.calculatedDemand)} kVA
                </span>
              </div>
            </div>
          </div>

          {/* Automatic Electrical Power Factor Banner */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className={`p-2.5 rounded-xl border ${
                  calculations.powerFactor >= 0.95
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                    : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                }`}
              >
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs text-slate-400 block">
                  Automatic Power Factor (PF = Diff KWH ÷ Diff KVAH):
                </span>
                <span className="font-mono text-xl font-bold text-white">
                  {calculations.powerFactor}{' '}
                  <span
                    className={`text-xs font-semibold ${
                      calculations.powerFactor >= 0.95 ? 'text-emerald-400' : 'text-amber-400'
                    }`}
                  >
                    ({calculations.powerFactor >= 0.95 ? 'Optimal Industrial PF' : 'Low PF - Review APFC'})
                  </span>
                </span>
              </div>
            </div>

            <div className="text-xs text-slate-400 font-mono text-right hidden sm:block">
              <div>Calculation: {formatUnits(calculations.consumedKwh)} / {formatUnits(calculations.consumedKvah)}</div>
              <div>Period: 24h Synchronized Shift</div>
            </div>
          </div>

          {/* Validation Warning Alert */}
          {calculations.errorMessage && (
            <div className="p-3 rounded-xl bg-red-950/70 border border-red-700 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{calculations.errorMessage}</span>
            </div>
          )}

          {/* Optional Operator Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Shift Observation / Maintenance Notes:
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={!isAllowedToEnter}
              placeholder="e.g. Incomer feeder temperature 38°C, capacitor bank 3 active"
              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Submit Action */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-800">
            <div className="text-xs text-slate-400">
              Meters must be logged in sequence. Negative consumption is strictly blocked.
            </div>

            <div className="flex items-center gap-3">
              {isSuccess && (
                <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4" /> Reading Saved Successfully!
                </span>
              )}

              <button
                type="submit"
                disabled={!isAllowedToEnter || !calculations.isValid}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-950/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <span>Commit Daily Reading</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Recent Readings for this Meter */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5">
        <h3 className="text-sm font-bold text-white mb-3">
          Recent Historical Logs for {activeMeter?.meterCode} ({activeMeter?.meterName})
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="pb-2">Date</th>
                <th className="pb-2">Time</th>
                <th className="pb-2">Prev KWH</th>
                <th className="pb-2">Curr KWH</th>
                <th className="pb-2">MF</th>
                <th className="pb-2 text-amber-400">Units (kWh)</th>
                <th className="pb-2 text-cyan-400">PF</th>
                <th className="pb-2">Demand (kVA)</th>
                <th className="pb-2">Operator</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {readings
                .filter((r) => r.meterId === activeMeter?.id)
                .slice(0, 5)
                .map((r) => (
                  <tr key={r.id} className="text-slate-300 hover:bg-slate-800/40">
                    <td className="py-2 text-white font-semibold">{r.date}</td>
                    <td className="py-2 text-slate-400">{r.time}</td>
                    <td className="py-2">{r.prevKwh}</td>
                    <td className="py-2">{r.currKwh}</td>
                    <td className="py-2">{r.kwhMf}</td>
                    <td className="py-2 text-amber-400 font-bold">{formatUnits(r.consumedKwh)}</td>
                    <td className="py-2 text-cyan-400 font-semibold">{r.powerFactor}</td>
                    <td className="py-2">{r.calculatedDemand}</td>
                    <td className="py-2 text-slate-400">{r.operatorName}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
