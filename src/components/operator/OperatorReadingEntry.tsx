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
  ArrowRight,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { calculatePowerFactor } from '../../lib/calculations';
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

  // Active view: 'blocks' (21 blocks KWH & KVAH entry) | 'transformer' (substation incomer & 750/950 KVA)
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
  // 21 BLOCKS DATA PREPARATION
  // ----------------------------------------------------------------------
  // Prepare a flat list of all meters across all 21 sections with their latest previous readings
  const blocksList = useMemo(() => {
    const list: Array<{
      sectionIndex: number;
      section: Section;
      meter: Meter;
      prevKwh: number;
      prevKvah: number;
      kwhMf: number;
      kvahMf: number;
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
          prevKvah: lastLog ? lastLog.currKvah : 1000,
          kwhMf: m.kwhMf || 1,
          kvahMf: m.kvahMf || 1,
          lastDate: lastLog ? `${lastLog.date} ${lastLog.time}` : 'Initial',
        });
      });
    });

    return list;
  }, [sections, readings]);

  // Form input state per meter: { currKwh, currKvah, saved: boolean }
  const [meterInputs, setMeterInputs] = useState<
    Record<string, { currKwh: number; currKvah: number; saved: boolean }>
  >({});

  // Initialize input state with sensible defaults based on previous
  useEffect(() => {
    const initial: Record<string, { currKwh: number; currKvah: number; saved: boolean }> = {};
    blocksList.forEach((item) => {
      initial[item.meter.id] = {
        currKwh: Number((item.prevKwh + 15).toFixed(2)),
        currKvah: Number((item.prevKvah + 16).toFixed(2)),
        saved: false,
      };
    });
    setMeterInputs(initial);
  }, [blocksList.length]);

  const handleInputChange = (
    meterId: string,
    field: 'currKwh' | 'currKvah',
    value: number
  ) => {
    setMeterInputs((prev) => ({
      ...prev,
      [meterId]: {
        ...(prev[meterId] || { currKwh: 0, currKvah: 0, saved: false }),
        [field]: value,
        saved: false,
      },
    }));
  };

  // Save single block reading
  const handleSaveBlock = async (item: (typeof blocksList)[0]) => {
    const inputs = meterInputs[item.meter.id];
    if (!inputs) return;

    if (inputs.currKwh < item.prevKwh) {
      alert(`Warning for ${item.section.name}: Current KWH cannot be lower than Previous KWH!`);
      return;
    }

    const diffKwh = Number((inputs.currKwh - item.prevKwh).toFixed(2));
    const diffKvah = Number((inputs.currKvah - item.prevKvah).toFixed(2));
    const consumedKwh = Number((diffKwh * item.kwhMf).toFixed(2));
    const consumedKvah = Number((diffKvah * item.kvahMf).toFixed(2));
    // Calculate PF behind the scenes for Admin dashboard (not shown to operator)
    const powerFactor = calculatePowerFactor(consumedKwh, consumedKvah);

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
      prevKvah: item.prevKvah,
      currKvah: inputs.currKvah,
      kvahMf: item.kvahMf,
      consumedKvah,
      powerFactor,
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

  // Filtered blocks list for search
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
  // TRANSFORMER YARD (ONLY READINGS & DIFFERENCE)
  // ----------------------------------------------------------------------
  const lastTransformer = transformerReadings[0];

  // Incomer
  const [tMainPrev, setTMainPrev] = useState<number>(lastTransformer ? lastTransformer.mainKwhUnits : 24000);
  const [tMainCurr, setTMainCurr] = useState<number>(lastTransformer ? lastTransformer.mainKwhUnits + 1000 : 25000);

  // 750 KVA Transformer
  const [t750Prev, setT750Prev] = useState<number>(lastTransformer ? lastTransformer.t750Curr : 12000);
  const [t750Curr, setT750Curr] = useState<number>(lastTransformer ? lastTransformer.t750Curr + 300 : 12300);
  const t750Mf = lastTransformer ? lastTransformer.t750Mf : 40;

  // 950 KVA Transformer
  const [t950Prev, setT950Prev] = useState<number>(lastTransformer ? lastTransformer.t950Curr : 15000);
  const [t950Curr, setT950Curr] = useState<number>(lastTransformer ? lastTransformer.t950Curr + 310 : 15310);
  const t950Mf = lastTransformer ? lastTransformer.t950Mf : 40;

  const [tSaveSuccess, setTSaveSuccess] = useState(false);

  // Simple differences ONLY (as requested by user)
  const incomerDiff = Number((tMainCurr - tMainPrev).toFixed(2));
  const t750Diff = Number((t750Curr - t750Prev).toFixed(2));
  const t950Diff = Number((t950Curr - t950Prev).toFixed(2));

  const handleSaveTransformer = async (e: React.FormEvent) => {
    e.preventDefault();

    // Calculations passed to backend for Admin dashboard
    const t750Units = Math.max(0, Number((t750Diff * t750Mf).toFixed(1)));
    const t950Units = Math.max(0, Number((t950Diff * t950Mf).toFixed(1)));
    const totalOutputUnits = Number((t750Units + t950Units).toFixed(1));
    const transformerLosses = Number((tMainCurr - totalOutputUnits).toFixed(1));
    const lossPercentage = tMainCurr > 0 ? Number(((transformerLosses / tMainCurr) * 100).toFixed(2)) : 0;

    await addTransformerReading({
      date: readingDate,
      time: readingTime,
      mainKwhUnits: tMainCurr,
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
      notes: 'Shift transformer reading',
    });

    setTSaveSuccess(true);
    setTimeout(() => {
      setTSaveSuccess(false);
      setTMainPrev(tMainCurr);
      setT750Prev(t750Curr);
      setT950Prev(t950Curr);
    }, 2500);
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* 1. SIMPLE SHIFT METADATA BAR */}
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
                Enter current readings for the 21 plant blocks & transformers.
              </p>
            </div>
          </div>

          {/* Simple Shift Inputs */}
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
              <span>21 Plant Blocks Entry ({blocksList.length} Meters)</span>
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
              <span>Transformer Substation (Incomer & 750/950 KVA)</span>
            </button>
          </div>

          {activeView === 'blocks' && (
            <div className="flex items-center gap-2">
              {saveAllSuccess && (
                <span className="flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  All blocks saved!
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
      {/* VIEW 1: 21 PLANT BLOCKS ENTRY (KWH & KVAH ONLY — NO POWER FACTOR) */}
      {/* ------------------------------------------------------------------ */}
      {activeView === 'blocks' && (
        <div className="space-y-3">
          {/* Search Filter Bar */}
          <div className="flex items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Find block (e.g. A Block, Boiler, Compressor...)"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="text-xs text-slate-500 font-medium">
              Showing <span className="font-bold text-slate-800">{filteredBlocks.length}</span> of {blocksList.length} meters
            </div>
          </div>

          {/* Blockwise Cards / Rows */}
          <div className="grid grid-cols-1 gap-3">
            {filteredBlocks.map((item) => {
              const inputs = meterInputs[item.meter.id] || {
                currKwh: item.prevKwh + 15,
                currKvah: item.prevKvah + 16,
                saved: false,
              };

              const diffKwh = Number((inputs.currKwh - item.prevKwh).toFixed(2));
              const diffKvah = Number((inputs.currKvah - item.prevKvah).toFixed(2));
              const isKwhWarning = inputs.currKwh < item.prevKwh;

              return (
                <div
                  key={item.meter.id}
                  className={`bg-white rounded-2xl border transition-all p-4 shadow-sm ${
                    inputs.saved
                      ? 'border-emerald-300 bg-emerald-50/10'
                      : 'border-slate-200 hover:border-blue-200'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Left: Block Title & Code */}
                    <div className="min-w-[220px]">
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

                    {/* Middle: KWH Reading & KVAH Reading */}
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* 1. KWH (Active Energy) */}
                      <div className="p-3 rounded-xl bg-blue-50/50 border border-blue-100 flex items-center justify-between gap-3">
                        {/* Visible Previous KWH Reference */}
                        <div>
                          <span className="block text-[10px] font-bold text-blue-800 uppercase tracking-wider">
                            Prev KWH (Ref)
                          </span>
                          <span className="font-mono font-black text-sm text-blue-950">
                            {item.prevKwh}
                          </span>
                        </div>

                        {/* Current KWH Input */}
                        <div>
                          <label className="block text-[10px] font-bold text-slate-700 uppercase mb-0.5">
                            Current KWH
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={inputs.currKwh}
                            onChange={(e) =>
                              handleInputChange(
                                item.meter.id,
                                'currKwh',
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="w-28 px-2 py-1 rounded-lg border border-slate-300 font-mono font-bold text-slate-900 bg-white text-xs focus:outline-none focus:border-blue-500"
                          />
                        </div>

                        {/* Live Difference Only */}
                        <div className="text-right">
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

                      {/* 2. KVAH (Apparent Energy) */}
                      <div className="p-3 rounded-xl bg-cyan-50/50 border border-cyan-100 flex items-center justify-between gap-3">
                        {/* Visible Previous KVAH Reference */}
                        <div>
                          <span className="block text-[10px] font-bold text-cyan-800 uppercase tracking-wider">
                            Prev KVAH (Ref)
                          </span>
                          <span className="font-mono font-black text-sm text-cyan-950">
                            {item.prevKvah}
                          </span>
                        </div>

                        {/* Current KVAH Input */}
                        <div>
                          <label className="block text-[10px] font-bold text-slate-700 uppercase mb-0.5">
                            Current KVAH
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={inputs.currKvah}
                            onChange={(e) =>
                              handleInputChange(
                                item.meter.id,
                                'currKvah',
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="w-28 px-2 py-1 rounded-lg border border-slate-300 font-mono font-bold text-slate-900 bg-white text-xs focus:outline-none focus:border-cyan-500"
                          />
                        </div>

                        {/* Live Difference Only */}
                        <div className="text-right">
                          <span className="block text-[10px] font-bold text-slate-500 uppercase">
                            Difference
                          </span>
                          <span
                            className={`font-mono font-bold text-sm ${
                              diffKvah >= 0 ? 'text-cyan-800' : 'text-red-600'
                            }`}
                          >
                            {diffKvah >= 0 ? `+${diffKvah}` : diffKvah}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Save Button */}
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
      {/* VIEW 2: TRANSFORMER SECTION (READING & DIFFERENCE ONLY — NO LOSSES) */}
      {/* ------------------------------------------------------------------ */}
      {activeView === 'transformer' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
          <form onSubmit={handleSaveTransformer} className="space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-blue-600" />
                  Transformer Substation Reading Entry
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Enter Main Incomer, 750 KVA, and 950 KVA readings. System displays the difference only.
                </p>
              </div>

              {tSaveSuccess && (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Transformer reading committed!</span>
                </div>
              )}
            </div>

            {/* THREE SIMPLE CARDS: MAIN INCOMER, 750 KVA, 950 KVA */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* 1. Main Incomer */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="text-xs font-bold text-slate-900 uppercase">
                    1. Main 11 KV Incomer
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-200">
                  <span className="block text-[10px] font-bold text-blue-800 uppercase">
                    Previous Dial (Ref)
                  </span>
                  <span className="font-mono font-black text-base text-blue-950">
                    {tMainPrev}
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
                    value={tMainCurr}
                    onChange={(e) => setTMainCurr(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 font-mono font-bold text-slate-900 bg-white text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Difference Only */}
                <div className="p-2 rounded-lg bg-white border border-slate-200 flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-600 font-semibold">Difference:</span>
                  <span className="font-black text-blue-700 text-sm">
                    {incomerDiff >= 0 ? `+${incomerDiff}` : incomerDiff}
                  </span>
                </div>
              </div>

              {/* 2. 750 KVA Transformer */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="text-xs font-bold text-slate-900 uppercase">
                    2. Transformer 750 KVA
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

              {/* 3. 950 KVA Transformer */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="text-xs font-bold text-slate-900 uppercase">
                    3. Transformer 950 KVA
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

            {/* Save Button */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all"
              >
                <Save className="w-4 h-4" />
                <span>Save Transformer Readings</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
