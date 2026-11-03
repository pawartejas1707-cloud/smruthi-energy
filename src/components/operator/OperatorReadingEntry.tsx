import React, { useState, useEffect, useMemo } from 'react';
import {
  Zap,
  Save,
  Check,
  Building2,
  Cpu,
  Clock,
  Calendar,
  User,
  Search,
  CheckCircle2,
  AlertCircle,
  Activity,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Section, Meter } from '../../types';

export const OperatorReadingEntry: React.FC = () => {
  const {
    sections,
    readings,
    transformerReadings,
    addDailyReading,
    addTransformerReading,
    currentUser,
  } = useApp();

  // Active view: 'blocks' (21 blocks KWH ONLY) | 'transformer' (Main Incomer KWH & KVAH + 750/950 KVA Transformers)
  const [activeView, setActiveView] = useState<'blocks' | 'transformer'>('blocks');

  // Shared Shift Metadata
  const todayStr = new Date().toISOString().split('T')[0];
  const [readingDate, setReadingDate] = useState<string>(todayStr);
  const [readingTime, setReadingTime] = useState<string>('08:30');
  const [operatorName, setOperatorName] = useState<string>(
    currentUser.fullName || 'Ramesh Patil (Shift Operator)'
  );
  const [shift, setShift] = useState<
    'Shift 1 (Morning)' | 'Shift 2 (Evening)' | 'Shift 3 (Night)' | 'General Shift'
  >('Shift 1 (Morning)');

  const [searchFilter, setSearchFilter] = useState<string>('');

  // ----------------------------------------------------------------------
  // 1. 21 BLOCKS DATA (KWH ONLY — NO KVAH, NO POWER FACTOR)
  // ----------------------------------------------------------------------
  const blocksList = useMemo(() => {
    const list: Array<{
      sectionIndex: number;
      section: Section;
      meter: Meter;
      prevKwh: number;
      kwhMf: number;
      lastDate: string;
    }> = [];

    sections.forEach((sec, sIdx) => {
      sec.meters.forEach((m) => {
        const lastLog = readings
          .filter((r) => r.meterId === m.id || r.meterCode === m.meterCode)
          .sort(
            (a, b) =>
              new Date(b.date + ' ' + b.time).getTime() - new Date(a.date + ' ' + a.time).getTime()
          )[0];

        list.push({
          sectionIndex: sIdx + 1,
          section: sec,
          meter: m,
          prevKwh: lastLog ? lastLog.currKwh : 1000,
          kwhMf: m.kwhMf || 1,
          lastDate: lastLog ? `${lastLog.date} ${lastLog.time}` : 'Initial Dial',
        });
      });
    });

    return list;
  }, [sections, readings]);

  // Form input state per meter: { currKwh, saved: boolean }
  const [meterInputs, setMeterInputs] = useState<
    Record<string, { currKwh: number; saved: boolean }>
  >({});

  // Initialize input state with defaults
  useEffect(() => {
    const initial: Record<string, { currKwh: number; saved: boolean }> = {};
    blocksList.forEach((item) => {
      initial[item.meter.id] = {
        currKwh: Number((item.prevKwh + 15).toFixed(2)),
        saved: false,
      };
    });
    setMeterInputs(initial);
  }, [blocksList.length]);

  const handleKwhChange = (meterId: string, value: number) => {
    setMeterInputs((prev) => ({
      ...prev,
      [meterId]: {
        ...(prev[meterId] || { currKwh: 0, saved: false }),
        currKwh: value,
        saved: false,
      },
    }));
  };

  // Save single block KWH reading
  const handleSaveBlock = async (item: (typeof blocksList)[0]) => {
    const inputs = meterInputs[item.meter.id];
    if (!inputs) return;

    if (inputs.currKwh < item.prevKwh) {
      alert(`Warning for ${item.section.name}: Current KWH cannot be lower than Previous KWH!`);
      return;
    }

    const diffKwh = Number((inputs.currKwh - item.prevKwh).toFixed(2));
    const consumedKwh = Number((diffKwh * item.kwhMf).toFixed(2));

    await addDailyReading({
      date: readingDate,
      time: readingTime,
      sectionId: item.section.id,
      meterId: item.meter.id,
      meterCode: item.meter.meterCode,
      meterName: item.meter.meterName,
      prevKwh: item.prevKwh,
      currKwh: inputs.currKwh,
      kwhMf: item.kwhMf,
      consumedKwh,
      prevKvah: 0,
      currKvah: 0,
      kvahMf: item.meter.kvahMf || 1,
      consumedKvah: 0,
      powerFactor: 0.98, // Stored for admin reports
      prevDemand: 0,
      currDemand: 0,
      demandMf: item.meter.contractDemandMf || 1,
      calculatedDemand: 0,
      operatorName,
      shift,
    });

    setMeterInputs((prev) => ({
      ...prev,
      [item.meter.id]: {
        ...prev[item.meter.id],
        saved: true,
      },
    }));
  };

  // Save all entered blocks at once
  const [saveAllSuccess, setSaveAllSuccess] = useState(false);
  const handleSaveAllBlocks = async () => {
    for (const item of blocksList) {
      const inputs = meterInputs[item.meter.id];
      if (inputs && !inputs.saved) {
        await handleSaveBlock(item);
      }
    }
    setSaveAllSuccess(true);
    setTimeout(() => setSaveAllSuccess(false), 3000);
  };

  // Filtered blocks list
  const filteredBlocks = useMemo(() => {
    if (!searchFilter.trim()) return blocksList;
    const q = searchFilter.toLowerCase();
    return blocksList.filter(
      (b) =>
        b.section.name.toLowerCase().includes(q) ||
        b.section.code.toLowerCase().includes(q) ||
        b.meter.meterCode.toLowerCase().includes(q) ||
        b.meter.meterName.toLowerCase().includes(q)
    );
  }, [blocksList, searchFilter]);

  // ----------------------------------------------------------------------
  // 2. MAIN INCOMER (KWH & KVAH) + TRANSFORMERS (750 & 950 KVA)
  // ----------------------------------------------------------------------
  const lastTransformer = transformerReadings[0];

  // 1. Main Incomer KWH
  const [mainKwhPrev, setMainKwhPrev] = useState<number>(
    lastTransformer?.mainKwhPrev || (lastTransformer ? lastTransformer.mainKwhUnits - 1000 : 24000)
  );
  const [mainKwhCurr, setMainKwhCurr] = useState<number>(
    lastTransformer?.mainKwhCurr || (lastTransformer ? lastTransformer.mainKwhUnits : 25050)
  );

  // 2. Main Incomer KVAH
  const [mainKvahPrev, setMainKvahPrev] = useState<number>(
    lastTransformer?.mainKvahPrev || 24500
  );
  const [mainKvahCurr, setMainKvahCurr] = useState<number>(
    lastTransformer?.mainKvahCurr || 25600
  );

  // 3. 750 KVA Transformer
  const [t750Prev, setT750Prev] = useState<number>(
    lastTransformer ? lastTransformer.t750Curr : 12000
  );
  const [t750Curr, setT750Curr] = useState<number>(
    lastTransformer ? lastTransformer.t750Curr + 300 : 12300
  );
  const t750Mf = lastTransformer ? lastTransformer.t750Mf : 40;

  // 4. 950 KVA Transformer
  const [t950Prev, setT950Prev] = useState<number>(
    lastTransformer ? lastTransformer.t950Curr : 15000
  );
  const [t950Curr, setT950Curr] = useState<number>(
    lastTransformer ? lastTransformer.t950Curr + 310 : 15310
  );
  const t950Mf = lastTransformer ? lastTransformer.t950Mf : 40;

  const [tSaveSuccess, setTSaveSuccess] = useState(false);

  // Simple differences ONLY (no loss calculations on operator screen)
  const mainKwhDiff = Number((mainKwhCurr - mainKwhPrev).toFixed(2));
  const mainKvahDiff = Number((mainKvahCurr - mainKvahPrev).toFixed(2));
  const t750Diff = Number((t750Curr - t750Prev).toFixed(2));
  const t950Diff = Number((t950Curr - t950Prev).toFixed(2));

  const handleSaveMainAndTransformer = async (e: React.FormEvent) => {
    e.preventDefault();

    // Calculations passed to backend for Admin dashboard
    const t750Units = Math.max(0, Number((t750Diff * t750Mf).toFixed(1)));
    const t950Units = Math.max(0, Number((t950Diff * t950Mf).toFixed(1)));
    const totalOutputUnits = Number((t750Units + t950Units).toFixed(1));
    const transformerLosses = Number((mainKwhCurr - totalOutputUnits).toFixed(1));
    const lossPercentage = mainKwhCurr > 0 ? Number(((transformerLosses / mainKwhCurr) * 100).toFixed(2)) : 0;

    await addTransformerReading({
      date: readingDate,
      time: readingTime,
      mainKwhUnits: mainKwhCurr,
      mainKvahUnits: mainKvahCurr,
      mainKwhPrev,
      mainKwhCurr,
      mainKvahPrev,
      mainKvahCurr,
      t750Prev,
      t750Curr,
      t750Mf,
      t750Units,
      t950Prev,
      t950Curr,
      t950Mf,
      t950Units,
      totalOutputUnits,
      transformerLosses,
      lossPercentage,
      operatorName,
      notes: 'Shift main incomer & transformer reading',
    });

    setTSaveSuccess(true);
    setTimeout(() => {
      setTSaveSuccess(false);
      setMainKwhPrev(mainKwhCurr);
      setMainKvahPrev(mainKvahCurr);
      setT750Prev(t750Curr);
      setT950Prev(t950Curr);
    }, 2500);
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* 1. SHIFT METADATA BAR */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-blue-50 border border-blue-200 text-blue-700">
              <Zap className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Shift Reading Entry
              </h2>
              <p className="text-xs text-slate-500">
                Log KWH for 21 plant blocks, and Main KWH/KVAH for the substation incomer.
              </p>
            </div>
          </div>

          {/* Shift Controls */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-slate-50 p-2 rounded-xl border border-slate-200 text-xs">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">
                Date:
              </label>
              <input
                type="date"
                value={readingDate}
                onChange={(e) => setReadingDate(e.target.value)}
                className="w-full px-2 py-1 rounded-lg border border-slate-300 font-mono text-slate-900 bg-white text-xs font-semibold focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">
                Time:
              </label>
              <input
                type="time"
                value={readingTime}
                onChange={(e) => setReadingTime(e.target.value)}
                className="w-full px-2 py-1 rounded-lg border border-slate-300 font-mono text-slate-900 bg-white text-xs font-semibold focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">
                Shift:
              </label>
              <select
                value={shift}
                onChange={(e: any) => setShift(e.target.value)}
                className="w-full px-2 py-1 rounded-lg border border-slate-300 font-semibold text-slate-900 bg-white text-xs focus:outline-none focus:border-blue-500"
              >
                <option value="Shift 1 (Morning)">Shift 1 (Morning)</option>
                <option value="Shift 2 (Evening)">Shift 2 (Evening)</option>
                <option value="Shift 3 (Night)">Shift 3 (Night)</option>
                <option value="General Shift">General Shift</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">
                Operator:
              </label>
              <input
                type="text"
                value={operatorName}
                onChange={(e) => setOperatorName(e.target.value)}
                className="w-full px-2 py-1 rounded-lg border border-slate-300 font-semibold text-slate-900 bg-white text-xs focus:outline-none focus:border-blue-500 truncate"
              />
            </div>
          </div>
        </div>

        {/* View Switcher Pills */}
        <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200">
            <button
              type="button"
              onClick={() => setActiveView('blocks')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeView === 'blocks'
                  ? 'bg-white text-blue-700 shadow-sm border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>21 Plant Blocks (KWH Only)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveView('transformer')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeView === 'transformer'
                  ? 'bg-white text-blue-700 shadow-sm border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Cpu className="w-4 h-4" />
              <span>Main Incomer (KWH & KVAH) & Transformers</span>
            </button>
          </div>

          {activeView === 'blocks' && (
            <div className="flex items-center gap-2">
              {saveAllSuccess && (
                <span className="flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  All 21 blocks saved!
                </span>
              )}
              <button
                type="button"
                onClick={handleSaveAllBlocks}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-all"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save All Entered Blocks</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* VIEW 1: 21 PLANT BLOCKS ENTRY (KWH ONLY — NO KVAH, NO PF) */}
      {/* ------------------------------------------------------------------ */}
      {activeView === 'blocks' && (
        <div className="space-y-3">
          {/* Search Filter Bar */}
          <div className="flex items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search block name (e.g. A Block, Boiler, Compressor...)"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="text-xs text-slate-500 font-medium">
              Showing <span className="font-bold text-slate-800">{filteredBlocks.length}</span> of {blocksList.length} meters
            </div>
          </div>

          {/* Blockwise List: KWH ONLY */}
          <div className="grid grid-cols-1 gap-2.5">
            {filteredBlocks.map((item) => {
              const inputs = meterInputs[item.meter.id] || {
                currKwh: item.prevKwh + 15,
                saved: false,
              };

              const diffKwh = Number((inputs.currKwh - item.prevKwh).toFixed(2));
              const isKwhWarning = inputs.currKwh < item.prevKwh;

              return (
                <div
                  key={item.meter.id}
                  className={`bg-white rounded-2xl border transition-all p-3.5 shadow-sm ${
                    inputs.saved
                      ? 'border-emerald-300 bg-emerald-50/10'
                      : 'border-slate-200 hover:border-blue-200'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {/* Left: Block Number & Name */}
                    <div className="min-w-[240px]">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 font-mono font-bold text-xs flex items-center justify-center shrink-0">
                          {item.sectionIndex}
                        </span>
                        <div>
                          <h3 className="font-bold text-slate-900 text-sm leading-tight">
                            {item.section.name}
                          </h3>
                          <div className="text-[11px] font-mono text-blue-700 font-semibold">
                            {item.meter.meterCode} — {item.meter.meterName}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Middle: Clean KWH Entry (Previous Ref | Current Input | Difference) */}
                    <div className="flex-1 max-w-xl p-2.5 rounded-xl bg-blue-50/40 border border-blue-100 flex items-center justify-between gap-4">
                      {/* Previous KWH (Reference) */}
                      <div>
                        <span className="block text-[10px] font-bold text-blue-800 uppercase tracking-wider">
                          Prev KWH (Ref)
                        </span>
                        <span className="font-mono font-black text-sm text-blue-950">
                          {item.prevKwh}
                        </span>
                      </div>

                      {/* Current KWH Input */}
                      <div className="flex items-center gap-2">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-700 uppercase mb-0.5">
                            Current KWH
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={inputs.currKwh}
                            onChange={(e) =>
                              handleKwhChange(
                                item.meter.id,
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="w-32 px-2.5 py-1 rounded-lg border border-slate-300 font-mono font-bold text-slate-900 bg-white text-xs focus:outline-none focus:border-blue-500"
                          />
                        </div>
                      </div>

                      {/* Difference Only */}
                      <div className="text-right min-w-[70px]">
                        <span className="block text-[10px] font-bold text-slate-500 uppercase">
                          Difference
                        </span>
                        <span
                          className={`font-mono font-bold text-sm ${
                            diffKwh >= 0 ? 'text-blue-700' : 'text-red-600'
                          }`}
                        >
                          {diffKwh >= 0 ? `+${diffKwh}` : diffKwh}
                        </span>
                      </div>
                    </div>

                    {/* Right: Save Block Button */}
                    <div className="flex items-center justify-end shrink-0">
                      <button
                        type="button"
                        onClick={() => handleSaveBlock(item)}
                        disabled={inputs.saved || isKwhWarning}
                        className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-xs transition-all shadow-sm ${
                          inputs.saved
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200 cursor-default'
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                      >
                        {inputs.saved ? (
                          <>
                            <Check className="w-4 h-4 text-emerald-700" />
                            <span>Saved</span>
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4" />
                            <span>Save Block</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {isKwhWarning && (
                    <div className="mt-2 text-xs text-red-600 font-semibold flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>Current KWH reading cannot be lower than Previous KWH ({item.prevKwh})!</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* VIEW 2: MAIN INCOMER (KWH & KVAH) & TRANSFORMERS (750 & 950 KVA) */}
      {/* ------------------------------------------------------------------ */}
      {activeView === 'transformer' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
          <form onSubmit={handleSaveMainAndTransformer} className="space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-blue-600" />
                  Main 11 KV Incomer & Transformer Substation Entry
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Enter Main KWH, Main KVAH, and 750/950 KVA Transformer readings.
                </p>
              </div>

              {tSaveSuccess && (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Main Incomer & Transformer readings committed!</span>
                </div>
              )}
            </div>

            {/* SECTION 1: MAIN INCOMER READINGS (KWH AND KVAH SEPARATELY) */}
            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-blue-600" />
                Main 11 KV HT Incomer (Active & Apparent Energy)
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 1. Main Incomer KWH */}
                <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/30 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-blue-100">
                    <span className="text-xs font-bold text-blue-900 uppercase">
                      Main Incomer KWH
                    </span>
                    <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                      Active Energy
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-200">
                    <span className="block text-[10px] font-bold text-blue-800 uppercase">
                      Previous KWH (Ref)
                    </span>
                    <span className="font-mono font-black text-base text-blue-950">
                      {mainKwhPrev}
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Current Reading:
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={mainKwhCurr}
                      onChange={(e) => setMainKwhCurr(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-300 font-mono font-bold text-slate-900 bg-white text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* Difference Only */}
                  <div className="p-2 rounded-lg bg-white border border-slate-200 flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-600 font-semibold">Difference:</span>
                    <span className="font-black text-blue-700 text-sm">
                      {mainKwhDiff >= 0 ? `+${mainKwhDiff}` : mainKwhDiff}
                    </span>
                  </div>
                </div>

                {/* 2. Main Incomer KVAH */}
                <div className="p-4 rounded-xl border border-cyan-200 bg-cyan-50/30 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-cyan-100">
                    <span className="text-xs font-bold text-cyan-900 uppercase">
                      Main Incomer KVAH
                    </span>
                    <span className="text-[10px] font-bold text-cyan-700 bg-cyan-100 px-2 py-0.5 rounded">
                      Apparent Energy
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-cyan-50 border border-cyan-200">
                    <span className="block text-[10px] font-bold text-cyan-800 uppercase">
                      Previous KVAH (Ref)
                    </span>
                    <span className="font-mono font-black text-base text-cyan-950">
                      {mainKvahPrev}
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Current Reading:
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={mainKvahCurr}
                      onChange={(e) => setMainKvahCurr(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-300 font-mono font-bold text-slate-900 bg-white text-xs focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  {/* Difference Only */}
                  <div className="p-2 rounded-lg bg-white border border-slate-200 flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-600 font-semibold">Difference:</span>
                    <span className="font-black text-cyan-800 text-sm">
                      {mainKvahDiff >= 0 ? `+${mainKvahDiff}` : mainKvahDiff}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 2: TRANSFORMERS (750 KVA & 950 KVA) */}
            <div className="pt-2">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-purple-600" />
                Substation Step-Down Transformers
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 1. 750 KVA Transformer */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <span className="text-xs font-bold text-slate-900 uppercase">
                      Transformer 1 (750 KVA)
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-200">
                    <span className="block text-[10px] font-bold text-blue-800 uppercase">
                      Previous Dial (Ref)
                    </span>
                    <span className="font-mono font-black text-base text-blue-950">
                      {t750Prev}
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Current Reading:
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={t750Curr}
                      onChange={(e) => setT750Curr(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-300 font-mono font-bold text-slate-900 bg-white text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* Difference Only */}
                  <div className="p-2 rounded-lg bg-white border border-slate-200 flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-600 font-semibold">Difference:</span>
                    <span className="font-black text-blue-700 text-sm">
                      {t750Diff >= 0 ? `+${t750Diff}` : t750Diff}
                    </span>
                  </div>
                </div>

                {/* 2. 950 KVA Transformer */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <span className="text-xs font-bold text-slate-900 uppercase">
                      Transformer 2 (950 KVA)
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-200">
                    <span className="block text-[10px] font-bold text-blue-800 uppercase">
                      Previous Dial (Ref)
                    </span>
                    <span className="font-mono font-black text-base text-blue-950">
                      {t950Prev}
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Current Reading:
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={t950Curr}
                      onChange={(e) => setT950Curr(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-300 font-mono font-bold text-slate-900 bg-white text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* Difference Only */}
                  <div className="p-2 rounded-lg bg-white border border-slate-200 flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-600 font-semibold">Difference:</span>
                    <span className="font-black text-blue-700 text-sm">
                      {t950Diff >= 0 ? `+${t950Diff}` : t950Diff}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all"
              >
                <Save className="w-4 h-4" />
                <span>Save Main Incomer & Transformer Readings</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
