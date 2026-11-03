import React, { useState, useMemo } from 'react';
import {
  Zap,
  Save,
  Check,
  Building2,
  Cpu,
  Search,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Section, Meter } from '../../types';

// Storage cache helpers for instant persistence across browser refresh
function getCachedDials(): Record<string, number> {
  try {
    const raw = localStorage.getItem('smruthi_latest_dials');
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

function saveCachedDial(meterId: string, meterCode: string, dial: number) {
  try {
    const dials = getCachedDials();
    dials[meterId] = dial;
    if (meterCode) dials[meterCode] = dial;
    localStorage.setItem('smruthi_latest_dials', JSON.stringify(dials));
  } catch (e) {}
}

function getCachedTransformerDials(): {
  mainKwh?: number;
  mainKvah?: number;
  t750?: number;
  t950?: number;
} | null {
  try {
    const raw = localStorage.getItem('smruthi_latest_transformer_dials');
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function saveCachedTransformerDials(data: {
  mainKwh: number;
  mainKvah: number;
  t750: number;
  t950: number;
}) {
  try {
    localStorage.setItem('smruthi_latest_transformer_dials', JSON.stringify(data));
  } catch (e) {}
}

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
  // 1. 21 BLOCKS DATA PREPARATION (KWH ONLY — NO KVAH, NO POWER FACTOR)
  // ----------------------------------------------------------------------
  // Local state tracking saved dials (initialized from localStorage cache)
  const [savedDials, setSavedDials] = useState<Record<string, number>>(() => getCachedDials());

  // Local state tracking user typed values
  const [userTypedKwh, setUserTypedKwh] = useState<Record<string, number>>({});

  const blocksList = useMemo(() => {
    const list: Array<{
      sectionIndex: number;
      section: Section;
      meter: Meter;
      prevKwh: number;
      kwhMf: number;
    }> = [];

    sections.forEach((sec, sIdx) => {
      sec.meters.forEach((m) => {
        // Find newest log for this meter sorted by timestamp
        const meterLogs = readings
          .filter((r) => r.meterId === m.id || r.meterCode === m.meterCode)
          .sort((a, b) => {
            const tA = a.createdAt
              ? new Date(a.createdAt).getTime()
              : new Date(`${a.date} ${a.time || '00:00'}`).getTime();
            const tB = b.createdAt
              ? new Date(b.createdAt).getTime()
              : new Date(`${b.date} ${b.time || '00:00'}`).getTime();
            return tB - tA;
          });

        const lastLog = meterLogs[0];

        // Resolved dial: savedDials state > cached dial > latest reading > fallback 1000
        let resolvedPrev = 1000;
        if (savedDials[m.id] !== undefined) {
          resolvedPrev = savedDials[m.id];
        } else if (savedDials[m.meterCode] !== undefined) {
          resolvedPrev = savedDials[m.meterCode];
        } else if (lastLog) {
          resolvedPrev = lastLog.currKwh;
        }

        list.push({
          sectionIndex: sIdx + 1,
          section: sec,
          meter: m,
          prevKwh: resolvedPrev,
          kwhMf: m.kwhMf || 1,
        });
      });
    });

    return list;
  }, [sections, readings, savedDials]);

  const handleKwhChange = (meterId: string, value: number) => {
    setUserTypedKwh((prev) => ({
      ...prev,
      [meterId]: value,
    }));
  };

  // Save single block reading
  const handleSaveBlock = async (item: (typeof blocksList)[0], currentKwhVal: number) => {
    if (currentKwhVal < item.prevKwh) {
      alert(`Warning for ${item.section.name}: Current KWH cannot be lower than Previous KWH!`);
      return;
    }

    const diffKwh = Number((currentKwhVal - item.prevKwh).toFixed(2));
    const consumedKwh = Number((diffKwh * item.kwhMf).toFixed(2));

    // 1. Immediately cache the new dial to localStorage
    saveCachedDial(item.meter.id, item.meter.meterCode, currentKwhVal);

    // 2. Immediately update local saved dials state so prevKwh becomes currentKwhVal, Difference becomes 0
    setSavedDials((prev) => ({
      ...prev,
      [item.meter.id]: currentKwhVal,
      [item.meter.meterCode]: currentKwhVal,
    }));

    // 3. Clear userTyped state for this meter so it locks back to "Saved"
    setUserTypedKwh((prev) => {
      const next = { ...prev };
      delete next[item.meter.id];
      return next;
    });

    // 4. Persist to AppContext & backend safely
    try {
      await addDailyReading({
        date: readingDate,
        time: readingTime,
        sectionId: item.section.id,
        meterId: item.meter.id,
        meterCode: item.meter.meterCode,
        meterName: item.meter.meterName,
        prevKwh: item.prevKwh,
        currKwh: currentKwhVal,
        kwhMf: item.kwhMf,
        consumedKwh,
        prevKvah: 0,
        currKvah: 0,
        kvahMf: item.meter.kvahMf || 1,
        consumedKvah: 0,
        powerFactor: 0.98,
        prevDemand: 0,
        currDemand: 0,
        demandMf: item.meter.contractDemandMf || 1,
        calculatedDemand: 0,
        operatorName,
        shift,
      });
    } catch (err) {
      console.warn('Background sync warning:', err);
    }
  };

  // Save all entered blocks that have changed
  const [saveAllSuccess, setSaveAllSuccess] = useState(false);
  const handleSaveAllBlocks = async () => {
    for (const item of blocksList) {
      const typedVal = userTypedKwh[item.meter.id];
      if (typedVal !== undefined && typedVal > item.prevKwh) {
        await handleSaveBlock(item, typedVal);
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

  // Count how many blocks have pending new readings
  const pendingBlocksCount = useMemo(() => {
    return blocksList.filter((item) => {
      const typedVal = userTypedKwh[item.meter.id];
      return typedVal !== undefined && typedVal > item.prevKwh;
    }).length;
  }, [blocksList, userTypedKwh]);

  // ----------------------------------------------------------------------
  // 2. MAIN INCOMER (KWH & KVAH) + TRANSFORMERS (750 & 950 KVA)
  // ----------------------------------------------------------------------
  const cachedTDials = useMemo(() => getCachedTransformerDials(), [transformerReadings.length]);
  const lastTransformer = transformerReadings[0];

  const [savedTDials, setSavedTDials] = useState<{
    mainKwh: number;
    mainKvah: number;
    t750: number;
    t950: number;
  }>(() => {
    const cached = getCachedTransformerDials();
    return {
      mainKwh: cached?.mainKwh ?? (lastTransformer?.mainKwhCurr || lastTransformer?.mainKwhUnits || 25050),
      mainKvah: cached?.mainKvah ?? (lastTransformer?.mainKvahCurr || 25600),
      t750: cached?.t750 ?? (lastTransformer?.t750Curr || 12300),
      t950: cached?.t950 ?? (lastTransformer?.t950Curr || 15310),
    };
  });

  // User typed inputs for transformer section
  const [typedMainKwh, setTypedMainKwh] = useState<number | undefined>(undefined);
  const [typedMainKvah, setTypedMainKvah] = useState<number | undefined>(undefined);
  const [typed750, setTyped750] = useState<number | undefined>(undefined);
  const [typed950, setTyped950] = useState<number | undefined>(undefined);

  const mainKwhVal = typedMainKwh !== undefined ? typedMainKwh : savedTDials.mainKwh;
  const mainKvahVal = typedMainKvah !== undefined ? typedMainKvah : savedTDials.mainKvah;
  const t750Val = typed750 !== undefined ? typed750 : savedTDials.t750;
  const t950Val = typed950 !== undefined ? typed950 : savedTDials.t950;

  const t750Mf = lastTransformer?.t750Mf || 40;
  const t950Mf = lastTransformer?.t950Mf || 40;

  const [tSaveSuccess, setTSaveSuccess] = useState(false);

  // Differences calculated live
  const mainKwhDiff = Number((mainKwhVal - savedTDials.mainKwh).toFixed(2));
  const mainKvahDiff = Number((mainKvahVal - savedTDials.mainKvah).toFixed(2));
  const t750Diff = Number((t750Val - savedTDials.t750).toFixed(2));
  const t950Diff = Number((t950Val - savedTDials.t950).toFixed(2));

  // Is there any new reading entered for transformer section?
  const hasTransformerChanged =
    mainKwhDiff > 0 || mainKvahDiff > 0 || t750Diff > 0 || t950Diff > 0;

  const handleSaveMainAndTransformer = async (e: React.FormEvent) => {
    e.preventDefault();

    // Calculations passed to backend for Admin dashboard
    const t750Units = Math.max(0, Number((t750Diff * t750Mf).toFixed(1)));
    const t950Units = Math.max(0, Number((t950Diff * t950Mf).toFixed(1)));
    const totalOutputUnits = Number((t750Units + t950Units).toFixed(1));
    const transformerLosses = Number((mainKwhVal - totalOutputUnits).toFixed(1));
    const lossPercentage =
      mainKwhVal > 0 ? Number(((transformerLosses / mainKwhVal) * 100).toFixed(2)) : 0;

    // 1. Immediately cache to permanent localStorage
    saveCachedTransformerDials({
      mainKwh: mainKwhVal,
      mainKvah: mainKvahVal,
      t750: t750Val,
      t950: t950Val,
    });

    // 2. Immediately update saved state: previous becomes current, difference becomes 0, button turns to "Saved"
    setSavedTDials({
      mainKwh: mainKwhVal,
      mainKvah: mainKvahVal,
      t750: t750Val,
      t950: t950Val,
    });

    // 3. Clear typed inputs
    setTypedMainKwh(undefined);
    setTypedMainKvah(undefined);
    setTyped750(undefined);
    setTyped950(undefined);

    setTSaveSuccess(true);
    setTimeout(() => {
      setTSaveSuccess(false);
    }, 2500);

    // 4. Persist to AppContext & backend safely
    try {
      await addTransformerReading({
        date: readingDate,
        time: readingTime,
        mainKwhUnits: mainKwhVal,
        mainKvahUnits: mainKvahVal,
        mainKwhPrev: savedTDials.mainKwh,
        mainKwhCurr: mainKwhVal,
        mainKvahPrev: savedTDials.mainKvah,
        mainKvahCurr: mainKvahVal,
        t750Prev: savedTDials.t750,
        t750Curr: t750Val,
        t750Mf,
        t750Units,
        t950Prev: savedTDials.t950,
        t950Curr: t950Val,
        t950Mf,
        t950Units,
        totalOutputUnits,
        transformerLosses,
        lossPercentage,
        operatorName,
        notes: 'Shift main incomer & transformer reading',
      });
    } catch (err) {
      console.warn('Transformer reading sync warning:', err);
    }
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
                  All blocks saved!
                </span>
              )}
              {pendingBlocksCount > 0 && (
                <button
                  type="button"
                  onClick={handleSaveAllBlocks}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-all animate-in fade-in"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save All Entered Blocks ({pendingBlocksCount})</span>
                </button>
              )}
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
              const typedVal = userTypedKwh[item.meter.id];
              const currentVal = typedVal !== undefined ? typedVal : item.prevKwh;

              const diffKwh = Number((currentVal - item.prevKwh).toFixed(2));
              const isKwhWarning = currentVal < item.prevKwh;
              const hasNewReading = diffKwh > 0;

              return (
                <div
                  key={item.meter.id}
                  className={`bg-white rounded-2xl border transition-all p-3.5 shadow-sm ${
                    hasNewReading
                      ? 'border-blue-300 bg-blue-50/10'
                      : 'border-slate-200 hover:border-slate-300'
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
                            value={currentVal}
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
                            diffKwh > 0
                              ? 'text-blue-700'
                              : diffKwh === 0
                              ? 'text-slate-400'
                              : 'text-red-600'
                          }`}
                        >
                          {diffKwh > 0 ? `+${diffKwh}` : '0'}
                        </span>
                      </div>
                    </div>

                    {/* Right: Solid Button (Blue "Save Block" if changed, Solid Green "Saved" if 0) */}
                    <div className="flex items-center justify-end shrink-0 min-w-[110px]">
                      {hasNewReading ? (
                        <button
                          type="button"
                          onClick={() => handleSaveBlock(item, currentVal)}
                          disabled={isKwhWarning}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-xs transition-all shadow-sm bg-blue-600 hover:bg-blue-700 text-white animate-in fade-in"
                        >
                          <Save className="w-4 h-4" />
                          <span>Save Block</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-xs bg-emerald-600 text-white shadow-sm cursor-default"
                        >
                          <Check className="w-4 h-4" />
                          <span>Saved</span>
                        </button>
                      )}
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
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold animate-in fade-in">
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
                      {savedTDials.mainKwh}
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
                      value={mainKwhVal}
                      onChange={(e) => setTypedMainKwh(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-300 font-mono font-bold text-slate-900 bg-white text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* Difference Only */}
                  <div className="p-2 rounded-lg bg-white border border-slate-200 flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-600 font-semibold">Difference:</span>
                    <span
                      className={`font-black text-sm ${
                        mainKwhDiff > 0 ? 'text-blue-700' : 'text-slate-400'
                      }`}
                    >
                      {mainKwhDiff > 0 ? `+${mainKwhDiff}` : '0'}
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
                      {savedTDials.mainKvah}
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
                      value={mainKvahVal}
                      onChange={(e) => setTypedMainKvah(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-300 font-mono font-bold text-slate-900 bg-white text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* Difference Only */}
                  <div className="p-2 rounded-lg bg-white border border-slate-200 flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-600 font-semibold">Difference:</span>
                    <span
                      className={`font-black text-sm ${
                        mainKvahDiff > 0 ? 'text-cyan-800' : 'text-slate-400'
                      }`}
                    >
                      {mainKvahDiff > 0 ? `+${mainKvahDiff}` : '0'}
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
                      {savedTDials.t750}
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
                      value={t750Val}
                      onChange={(e) => setTyped750(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-300 font-mono font-bold text-slate-900 bg-white text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* Difference Only */}
                  <div className="p-2 rounded-lg bg-white border border-slate-200 flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-600 font-semibold">Difference:</span>
                    <span
                      className={`font-black text-sm ${
                        t750Diff > 0 ? 'text-blue-700' : 'text-slate-400'
                      }`}
                    >
                      {t750Diff > 0 ? `+${t750Diff}` : '0'}
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
                      {savedTDials.t950}
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
                      value={t950Val}
                      onChange={(e) => setTyped950(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-300 font-mono font-bold text-slate-900 bg-white text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* Difference Only */}
                  <div className="p-2 rounded-lg bg-white border border-slate-200 flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-600 font-semibold">Difference:</span>
                    <span
                      className={`font-black text-sm ${
                        t950Diff > 0 ? 'text-blue-700' : 'text-slate-400'
                      }`}
                    >
                      {t950Diff > 0 ? `+${t950Diff}` : '0'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
              {hasTransformerChanged ? (
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all animate-in fade-in"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Main Incomer & Transformer Readings</span>
                </button>
              ) : (
                <button
                  type="button"
                  disabled
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-md shadow-emerald-500/20 cursor-default"
                >
                  <Check className="w-4 h-4" />
                  <span>Saved</span>
                </button>
              )}
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
