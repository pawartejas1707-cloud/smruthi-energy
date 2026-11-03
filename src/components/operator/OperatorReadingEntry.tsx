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
  FileSpreadsheet,
  Cpu,
  BookmarkCheck,
  RotateCcw,
  Save,
  Check,
  AlertTriangle,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { calculatePowerFactor, calculateContractDemand, formatUnits } from '../../lib/calculations';
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

  // Sub-navigation: 'card' (single section card) | 'table' (all 21 sections log sheet) | 'transformer' (substation 750 & 950 KVA)
  const [entryMode, setEntryMode] = useState<'card' | 'table' | 'transformer'>('card');

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

  // ----------------------------------------------------
  // MODE 1: SINGLE SECTION CARD ENTRY
  // ----------------------------------------------------
  const [selectedSectionId, setSelectedSectionId] = useState<string>(sections[0]?.id || '');
  const activeSection = useMemo(
    () => sections.find((s) => s.id === selectedSectionId) || sections[0],
    [sections, selectedSectionId]
  );

  const [selectedMeterId, setSelectedMeterId] = useState<string>(
    activeSection?.meters[0]?.id || ''
  );

  useEffect(() => {
    if (activeSection && activeSection.meters.length > 0) {
      // If current selected meter doesn't belong to this section, select first
      if (!activeSection.meters.some((m) => m.id === selectedMeterId)) {
        setSelectedMeterId(activeSection.meters[0].id);
      }
    }
  }, [activeSection]);

  const activeMeter = useMemo(
    () => activeSection?.meters.find((m) => m.id === selectedMeterId) || activeSection?.meters[0],
    [activeSection, selectedMeterId]
  );

  // Retrieve the latest logged previous reading for this meter
  const previousRecord = useMemo(() => {
    if (!activeMeter) return null;
    const meterLogs = readings
      .filter((r) => r.meterId === activeMeter.id || r.meterCode === activeMeter.meterCode)
      .sort((a, b) => new Date(b.date + ' ' + b.time).getTime() - new Date(a.date + ' ' + a.time).getTime());
    return meterLogs[0] || null;
  }, [readings, activeMeter]);

  // Card mode input values
  const [cardPrevKwh, setCardPrevKwh] = useState<number>(0);
  const [cardCurrKwh, setCardCurrKwh] = useState<number>(0);
  const [cardPrevKvah, setCardPrevKvah] = useState<number>(0);
  const [cardCurrKvah, setCardCurrKvah] = useState<number>(0);
  const [cardPrevDemand, setCardPrevDemand] = useState<number>(0);
  const [cardCurrDemand, setCardCurrDemand] = useState<number>(0);
  const [cardNotes, setCardNotes] = useState<string>('');
  const [cardSaveSuccess, setCardSaveSuccess] = useState<string | null>(null);

  // Multiplying factors directly from permanent settings
  const kwhMf = activeMeter?.kwhMf || 1;
  const kvahMf = activeMeter?.kvahMf || 1;
  const demandMf = activeMeter?.contractDemandMf || 1;

  // Sync inputs when activeMeter or previous record changes
  useEffect(() => {
    if (previousRecord) {
      setCardPrevKwh(previousRecord.currKwh);
      setCardCurrKwh(Number((previousRecord.currKwh + 15).toFixed(2)));
      setCardPrevKvah(previousRecord.currKvah);
      setCardCurrKvah(Number((previousRecord.currKvah + 16).toFixed(2)));
      setCardPrevDemand(previousRecord.currDemand || 0);
      setCardCurrDemand(Number(((previousRecord.currDemand || 0) + 5).toFixed(2)));
    } else {
      setCardPrevKwh(1000);
      setCardCurrKwh(1015);
      setCardPrevKvah(1000);
      setCardCurrKvah(1016);
      setCardPrevDemand(50);
      setCardCurrDemand(55);
    }
    setCardNotes('');
    setCardSaveSuccess(null);
  }, [activeMeter, previousRecord]);

  // Live Calculations for Card Mode
  const cardCalculations = useMemo(() => {
    let diffKwh = cardCurrKwh - cardPrevKwh;
    let diffKvah = cardCurrKvah - cardPrevKvah;
    let consumedKwh = 0;
    let consumedKvah = 0;
    let powerFactor = 1.0;
    let calculatedDemand = 0;
    let errorKwh = '';
    let errorKvah = '';

    if (cardCurrKwh < cardPrevKwh) {
      errorKwh = `Current dial (${cardCurrKwh}) cannot be lower than previous dial (${cardPrevKwh}).`;
    } else {
      consumedKwh = Number((diffKwh * kwhMf).toFixed(2));
    }

    if (cardCurrKvah < cardPrevKvah) {
      errorKvah = `Current KVAH (${cardCurrKvah}) cannot be lower than previous KVAH (${cardPrevKvah}).`;
    } else {
      consumedKvah = Number((diffKvah * kvahMf).toFixed(2));
    }

    if (!errorKwh && !errorKvah) {
      powerFactor = calculatePowerFactor(consumedKwh, consumedKvah);
      calculatedDemand = calculateContractDemand(cardCurrDemand, cardPrevDemand, demandMf);
    }

    const isValid = !errorKwh && !errorKvah && cardCurrKwh >= cardPrevKwh && cardCurrKvah >= cardPrevKvah;

    return {
      diffKwh: Number(diffKwh.toFixed(2)),
      diffKvah: Number(diffKvah.toFixed(2)),
      consumedKwh,
      consumedKvah,
      powerFactor,
      calculatedDemand,
      errorKwh,
      errorKvah,
      isValid,
    };
  }, [cardPrevKwh, cardCurrKwh, kwhMf, cardPrevKvah, cardCurrKvah, kvahMf, cardPrevDemand, cardCurrDemand, demandMf]);

  const handleCardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardCalculations.isValid || !activeMeter || !activeSection) return;

    await addDailyReading({
      date: readingDate,
      time: readingTime,
      sectionId: activeSection.id,
      meterId: activeMeter.id,
      meterCode: activeMeter.meterCode,
      meterName: activeMeter.meterName,
      prevKwh: cardPrevKwh,
      currKwh: cardCurrKwh,
      kwhMf,
      consumedKwh: cardCalculations.consumedKwh,
      prevKvah: cardPrevKvah,
      currKvah: cardCurrKvah,
      kvahMf,
      consumedKvah: cardCalculations.consumedKvah,
      powerFactor: cardCalculations.powerFactor,
      prevDemand: cardPrevDemand,
      currDemand: cardCurrDemand,
      demandMf,
      calculatedDemand: cardCalculations.calculatedDemand,
      operatorName,
      shift,
      notes: cardNotes,
    });

    setCardSaveSuccess(`Reading for ${activeMeter.meterCode} (${activeMeter.meterName}) saved successfully!`);
    
    // Automatically advance previous to current for immediate next reading
    setTimeout(() => {
      setCardPrevKwh(cardCurrKwh);
      setCardPrevKvah(cardCurrKvah);
      setCardPrevDemand(cardCurrDemand);
      setCardSaveSuccess(null);
    }, 2500);
  };

  // ----------------------------------------------------
  // MODE 2: COMPLETE 21-SECTIONS TABLE LOG SHEET
  // ----------------------------------------------------
  // Flat list of all meters across all 21 sections
  const allMetersList = useMemo(() => {
    const list: Array<{
      section: Section;
      meter: Meter;
      prevKwh: number;
      prevKvah: number;
      lastDate: string;
    }> = [];

    sections.forEach((sec) => {
      sec.meters.forEach((m) => {
        const lastLog = readings
          .filter((r) => r.meterId === m.id || r.meterCode === m.meterCode)
          .sort((a, b) => new Date(b.date + ' ' + b.time).getTime() - new Date(a.date + ' ' + a.time).getTime())[0];

        list.push({
          section: sec,
          meter: m,
          prevKwh: lastLog ? lastLog.currKwh : 1000,
          prevKvah: lastLog ? lastLog.currKvah : 1000,
          lastDate: lastLog ? `${lastLog.date} ${lastLog.time}` : 'Initial Dial',
        });
      });
    });

    return list;
  }, [sections, readings]);

  // Table form state: meterId -> { currKwh, currKvah, notes, saved: boolean }
  const [tableState, setTableState] = useState<
    Record<string, { currKwh: number; currKvah: number; saved: boolean }>
  >({});

  // Initialize table rows with sensible defaults based on previous
  useEffect(() => {
    const initial: Record<string, { currKwh: number; currKvah: number; saved: boolean }> = {};
    allMetersList.forEach((item) => {
      initial[item.meter.id] = {
        currKwh: Number((item.prevKwh + 15).toFixed(2)),
        currKvah: Number((item.prevKvah + 16).toFixed(2)),
        saved: false,
      };
    });
    setTableState(initial);
  }, [allMetersList.length]);

  const handleTableInputChange = (
    meterId: string,
    field: 'currKwh' | 'currKvah',
    value: number
  ) => {
    setTableState((prev) => ({
      ...prev,
      [meterId]: {
        ...(prev[meterId] || { currKwh: 0, currKvah: 0, saved: false }),
        [field]: value,
        saved: false,
      },
    }));
  };

  const handleSaveTableRow = async (item: {
    section: Section;
    meter: Meter;
    prevKwh: number;
    prevKvah: number;
  }) => {
    const row = tableState[item.meter.id];
    if (!row) return;

    if (row.currKwh < item.prevKwh || row.currKvah < item.prevKvah) {
      alert(`Error for ${item.meter.meterCode}: Current reading cannot be less than previous reading!`);
      return;
    }

    const diffKwh = row.currKwh - item.prevKwh;
    const diffKvah = row.currKvah - item.prevKvah;
    const consumedKwh = Number((diffKwh * item.meter.kwhMf).toFixed(2));
    const consumedKvah = Number((diffKvah * item.meter.kvahMf).toFixed(2));
    const powerFactor = calculatePowerFactor(consumedKwh, consumedKvah);

    await addDailyReading({
      date: readingDate,
      time: readingTime,
      sectionId: item.section.id,
      meterId: item.meter.id,
      meterCode: item.meter.meterCode,
      meterName: item.meter.meterName,
      prevKwh: item.prevKwh,
      currKwh: row.currKwh,
      kwhMf: item.meter.kwhMf,
      consumedKwh,
      prevKvah: item.prevKvah,
      currKvah: row.currKvah,
      kvahMf: item.meter.kvahMf,
      consumedKvah,
      powerFactor,
      prevDemand: 0,
      currDemand: 0,
      demandMf: item.meter.contractDemandMf,
      calculatedDemand: 0,
      operatorName,
      shift,
    });

    setTableState((prev) => ({
      ...prev,
      [item.meter.id]: {
        ...prev[item.meter.id],
        saved: true,
      },
    }));
  };

  const [tableBatchSuccess, setTableBatchSuccess] = useState(false);
  const handleSaveAllTableRows = async () => {
    for (const item of allMetersList) {
      const row = tableState[item.meter.id];
      if (row && !row.saved) {
        await handleSaveTableRow(item);
      }
    }
    setTableBatchSuccess(true);
    setTimeout(() => setTableBatchSuccess(false), 3000);
  };

  // ----------------------------------------------------
  // MODE 3: TRANSFORMER SUBSTATION YARD (750 & 950 KVA)
  // ----------------------------------------------------
  const lastTransformerLog = transformerReadings[0];
  const [tMainKwh, setTMainKwh] = useState<number>(lastTransformerLog ? lastTransformerLog.mainKwhUnits + 1000 : 25000);
  const [t750Prev, setT750Prev] = useState<number>(lastTransformerLog ? lastTransformerLog.t750Curr : 12000);
  const [t750Curr, setT750Curr] = useState<number>(lastTransformerLog ? lastTransformerLog.t750Curr + 300 : 12300);
  const [t750Mf, setT750Mf] = useState<number>(lastTransformerLog ? lastTransformerLog.t750Mf : 40);

  const [t950Prev, setT950Prev] = useState<number>(lastTransformerLog ? lastTransformerLog.t950Curr : 15000);
  const [t950Curr, setT950Curr] = useState<number>(lastTransformerLog ? lastTransformerLog.t950Curr + 310 : 15310);
  const [t950Mf, setT950Mf] = useState<number>(lastTransformerLog ? lastTransformerLog.t950Mf : 40);

  const [tNotes, setTNotes] = useState<string>('');
  const [tSaveSuccess, setTSaveSuccess] = useState(false);

  const transformerCalculations = useMemo(() => {
    const t750Units = Math.max(0, Number(((t750Curr - t750Prev) * t750Mf).toFixed(1)));
    const t950Units = Math.max(0, Number(((t950Curr - t950Prev) * t950Mf).toFixed(1)));
    const totalOutputUnits = Number((t750Units + t950Units).toFixed(1));
    const transformerLosses = Number((tMainKwh - totalOutputUnits).toFixed(1));
    const lossPercentage = tMainKwh > 0 ? Number(((transformerLosses / tMainKwh) * 100).toFixed(2)) : 0;

    return {
      t750Units,
      t950Units,
      totalOutputUnits,
      transformerLosses,
      lossPercentage,
    };
  }, [tMainKwh, t750Prev, t750Curr, t750Mf, t950Prev, t950Curr, t950Mf]);

  const handleSaveTransformer = async (e: React.FormEvent) => {
    e.preventDefault();
    await addTransformerReading({
      date: readingDate,
      time: readingTime,
      mainKwhUnits: tMainKwh,
      t750Prev,
      t750Curr,
      t750Mf,
      t750Units: transformerCalculations.t750Units,
      t950Prev,
      t950Curr,
      t950Mf,
      t950Units: transformerCalculations.t950Units,
      totalOutputUnits: transformerCalculations.totalOutputUnits,
      transformerLosses: transformerCalculations.transformerLosses,
      lossPercentage: transformerCalculations.lossPercentage,
      operatorName,
      notes: tNotes,
    });

    setTSaveSuccess(true);
    setTimeout(() => {
      setTSaveSuccess(false);
      setT750Prev(t750Curr);
      setT950Prev(t950Curr);
    }, 2500);
  };

  // Recent logs logged today for quick operator confirmation
  const todayReadings = useMemo(() => {
    return readings.filter((r) => r.date === readingDate).slice(0, 8);
  }, [readings, readingDate]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Shift & Operator Details Header Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-blue-50 border border-blue-200 text-blue-700">
                <Zap className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                  Daily Shift Meter Reading Entry
                </h2>
                <p className="text-xs text-slate-500">
                  Select a section, verify the previous reference dial, and enter current reading.
                </p>
              </div>
            </div>
          </div>

          {/* Shift Controls */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">
                Date:
              </label>
              <input
                type="date"
                value={readingDate}
                onChange={(e) => setReadingDate(e.target.value)}
                className="w-full px-2 py-1 rounded-lg border border-slate-300 font-mono font-medium text-slate-900 bg-white focus:outline-none focus:border-blue-500 text-xs"
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
                className="w-full px-2 py-1 rounded-lg border border-slate-300 font-mono font-medium text-slate-900 bg-white focus:outline-none focus:border-blue-500 text-xs"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">
                Shift:
              </label>
              <select
                value={shift}
                onChange={(e: any) => setShift(e.target.value)}
                className="w-full px-2 py-1 rounded-lg border border-slate-300 font-medium text-slate-900 bg-white focus:outline-none focus:border-blue-500 text-xs"
              >
                <option value="Shift 1 (Morning)">Shift 1 (08:00 - 16:00)</option>
                <option value="Shift 2 (Evening)">Shift 2 (16:00 - 00:00)</option>
                <option value="Shift 3 (Night)">Shift 3 (00:00 - 08:00)</option>
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
                placeholder="Operator Name"
                className="w-full px-2 py-1 rounded-lg border border-slate-300 font-medium text-slate-900 bg-white focus:outline-none focus:border-blue-500 text-xs truncate"
              />
            </div>
          </div>
        </div>

        {/* View Mode Switcher Pills */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Entry Mode:</span>
            <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200">
              <button
                type="button"
                onClick={() => setEntryMode('card')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  entryMode === 'card'
                    ? 'bg-white text-blue-700 shadow-sm border border-slate-200/80'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Section Card Entry</span>
              </button>

              <button
                type="button"
                onClick={() => setEntryMode('table')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  entryMode === 'table'
                    ? 'bg-white text-blue-700 shadow-sm border border-slate-200/80'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>21-Section Log Sheet (Table)</span>
              </button>

              <button
                type="button"
                onClick={() => setEntryMode('transformer')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  entryMode === 'transformer'
                    ? 'bg-white text-blue-700 shadow-sm border border-slate-200/80'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Cpu className="w-3.5 h-3.5" />
                <span>Transformer Yard (750 & 950 KVA)</span>
              </button>
            </div>
          </div>

          <div className="text-xs text-slate-500 font-medium">
            Permanent Multiplying Factors configured in Settings are active.
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* MODE 1: SECTION CARD ENTRY */}
      {/* ---------------------------------------------------- */}
      {entryMode === 'card' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
          <form onSubmit={handleCardSubmit} className="space-y-6">
            {/* Section & Meter Dropdowns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  1. Select Plant Section (1 of 21 Sections):
                </label>
                <select
                  value={selectedSectionId}
                  onChange={(e) => setSelectedSectionId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                >
                  {sections.map((s, idx) => (
                    <option key={s.id} value={s.id}>
                      {idx + 1}. {s.name} ({s.code}) — Daily Threshold: {formatUnits(s.dailyLimitKwh)} kWh
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  2. Select Section Meter:
                </label>
                <select
                  value={selectedMeterId}
                  onChange={(e) => setSelectedMeterId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                >
                  {activeSection?.meters.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.meterCode} — {m.meterName} [Permanent KWH MF: {m.kwhMf}]
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* THREE READING PANELS: KWH, KVAH, CONTRACT DEMAND */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* 1. ACTIVE ENERGY (KWH) */}
              <div className="rounded-xl border-2 border-blue-200 bg-blue-50/20 p-4 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-blue-100">
                  <span className="text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-blue-600" /> 1. Active Energy (KWH)
                  </span>
                  <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                    MF: {kwhMf}
                  </span>
                </div>

                {/* USER REQUIREMENT: HIGH VISIBILITY PREVIOUS READING REFERENCE */}
                <div className="p-3 rounded-xl bg-blue-100/70 border border-blue-200">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-blue-900 mb-0.5">
                    <span className="flex items-center gap-1">
                      <BookmarkCheck className="w-3.5 h-3.5 text-blue-700" />
                      Previous Reading (Reference):
                    </span>
                    <span className="text-[10px] text-blue-700">
                      {previousRecord ? `${previousRecord.date} (${previousRecord.time})` : 'Baseline'}
                    </span>
                  </div>
                  <div className="text-xl font-mono font-black text-blue-950">
                    {cardPrevKwh}{' '}
                    <span className="text-xs font-semibold text-blue-700">kWh</span>
                  </div>
                </div>

                {/* Current Dial Input */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Enter Current Dial (KWH):
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={cardCurrKwh}
                    onChange={(e) => setCardCurrKwh(parseFloat(e.target.value) || 0)}
                    placeholder="Enter current reading"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-600 text-sm"
                  />
                </div>

                {/* Live Auto Calculation */}
                <div className="p-2.5 rounded-lg bg-white border border-slate-200 space-y-1 text-xs font-mono">
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Difference (Curr - Prev):</span>
                    <span className="font-bold text-slate-900">{cardCalculations.diffKwh}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600 pt-1 border-t border-slate-100">
                    <span className="font-semibold text-slate-800">Consumed Units:</span>
                    <span className="text-base font-black text-blue-700">
                      {formatUnits(cardCalculations.consumedKwh)} kWh
                    </span>
                  </div>
                </div>

                {cardCalculations.errorKwh && (
                  <div className="p-2 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-1.5 font-medium">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{cardCalculations.errorKwh}</span>
                  </div>
                )}
              </div>

              {/* 2. APPARENT ENERGY (KVAH) */}
              <div className="rounded-xl border-2 border-cyan-200 bg-cyan-50/20 p-4 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-cyan-100">
                  <span className="text-xs font-bold text-cyan-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-cyan-600" /> 2. Apparent Energy (KVAH)
                  </span>
                  <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-100 text-cyan-800">
                    MF: {kvahMf}
                  </span>
                </div>

                {/* Previous KVAH Reference */}
                <div className="p-3 rounded-xl bg-cyan-100/70 border border-cyan-200">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-cyan-900 mb-0.5">
                    <span className="flex items-center gap-1">
                      <BookmarkCheck className="w-3.5 h-3.5 text-cyan-700" />
                      Previous Reading (Reference):
                    </span>
                    <span className="text-[10px] text-cyan-700">
                      {previousRecord ? `${previousRecord.date} (${previousRecord.time})` : 'Baseline'}
                    </span>
                  </div>
                  <div className="text-xl font-mono font-black text-cyan-950">
                    {cardPrevKvah}{' '}
                    <span className="text-xs font-semibold text-cyan-700">kVAh</span>
                  </div>
                </div>

                {/* Current KVAH Input */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Enter Current Dial (KVAH):
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={cardCurrKvah}
                    onChange={(e) => setCardCurrKvah(parseFloat(e.target.value) || 0)}
                    placeholder="Enter current reading"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-cyan-200 focus:border-cyan-600 text-sm"
                  />
                </div>

                {/* Live Auto Calculation */}
                <div className="p-2.5 rounded-lg bg-white border border-slate-200 space-y-1 text-xs font-mono">
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Difference (Curr - Prev):</span>
                    <span className="font-bold text-slate-900">{cardCalculations.diffKvah}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600 pt-1 border-t border-slate-100">
                    <span className="font-semibold text-slate-800">Consumed Units:</span>
                    <span className="text-base font-black text-cyan-700">
                      {formatUnits(cardCalculations.consumedKvah)} kVAh
                    </span>
                  </div>
                </div>

                {cardCalculations.errorKvah && (
                  <div className="p-2 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-1.5 font-medium">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{cardCalculations.errorKvah}</span>
                  </div>
                )}
              </div>

              {/* 3. CONTRACT DEMAND (KVA) */}
              <div className="rounded-xl border-2 border-purple-200 bg-purple-50/20 p-4 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-purple-100">
                  <span className="text-xs font-bold text-purple-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Calculator className="w-4 h-4 text-purple-600" /> 3. Contract Demand
                  </span>
                  <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-800">
                    MF: {demandMf}
                  </span>
                </div>

                {/* Previous Demand Reference */}
                <div className="p-3 rounded-xl bg-purple-100/70 border border-purple-200">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-purple-900 mb-0.5">
                    <span className="flex items-center gap-1">
                      <BookmarkCheck className="w-3.5 h-3.5 text-purple-700" />
                      Previous Demand (Reference):
                    </span>
                    <span className="text-[10px] text-purple-700">Baseline</span>
                  </div>
                  <div className="text-xl font-mono font-black text-purple-950">
                    {cardPrevDemand}{' '}
                    <span className="text-xs font-semibold text-purple-700">kVA</span>
                  </div>
                </div>

                {/* Current Demand Input */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Enter Current Demand (kVA):
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={cardCurrDemand}
                    onChange={(e) => setCardCurrDemand(parseFloat(e.target.value) || 0)}
                    placeholder="Enter current demand"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-600 text-sm"
                  />
                </div>

                {/* Calculated Demand */}
                <div className="p-2.5 rounded-lg bg-white border border-slate-200 space-y-1 text-xs font-mono">
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Demand Multiplying Factor:</span>
                    <span className="font-bold text-slate-900">{demandMf}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600 pt-1 border-t border-slate-100">
                    <span className="font-semibold text-slate-800">Calculated Demand:</span>
                    <span className="text-base font-black text-purple-700">
                      {formatUnits(cardCalculations.calculatedDemand)} kVA
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* LIVE AUTOMATIC POWER FACTOR (PF) CARD */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div
                  className={`p-3 rounded-xl border ${
                    cardCalculations.powerFactor >= 0.95
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                      : 'bg-amber-50 border-amber-200 text-amber-700'
                  }`}
                >
                  <Activity className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs text-slate-600 font-medium block">
                    Automatic Power Factor: <code className="text-slate-800 font-mono">PF = Consumed KWH ÷ Consumed KVAH</code>
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-mono text-2xl font-black text-slate-900">
                      {cardCalculations.powerFactor}
                    </span>
                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                        cardCalculations.powerFactor >= 0.95
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {cardCalculations.powerFactor >= 0.95
                        ? '✅ Optimal Power Factor'
                        : '⚠️ Low PF — Check APFC Panel'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-xs font-mono text-slate-500 text-left sm:text-right">
                <div>Formula: {formatUnits(cardCalculations.consumedKwh)} kWh ÷ {formatUnits(cardCalculations.consumedKvah)} kVAh</div>
                <div className="text-[11px] text-slate-400">Target Standard: &gt; 0.95</div>
              </div>
            </div>

            {/* Shift Observation Notes */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Shift Observation / Feeder Notes (Optional):
              </label>
              <input
                type="text"
                value={cardNotes}
                onChange={(e) => setCardNotes(e.target.value)}
                placeholder="e.g., Feeder operating under normal load, no tripping recorded"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 bg-white"
              />
            </div>

            {/* Submit Button & Confirmation Toast */}
            <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-xs text-slate-500">
                Next reading will automatically advance previous reference dials.
              </div>

              <div className="flex items-center gap-3">
                {cardSaveSuccess && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold animate-in fade-in">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>{cardSaveSuccess}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!cardCalculations.isValid}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Meter Reading</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODE 2: COMPLETE 21-SECTIONS TABLE LOG SHEET */}
      {/* ---------------------------------------------------- */}
      {entryMode === 'table' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-blue-600" />
                21-Section Plant Daily Log Sheet
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Sequential shift entry with previous reading visible in reference column for every section.
              </p>
            </div>

            <div className="flex items-center gap-3">
              {tableBatchSuccess && (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>All rows saved!</span>
                </div>
              )}

              <button
                type="button"
                onClick={handleSaveAllTableRows}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-all"
              >
                <Save className="w-4 h-4" />
                <span>Save All Entered Rows</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200">
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Section & Meter</th>
                  <th className="py-2.5 px-3 text-center bg-blue-50/60 text-blue-900 border-x border-blue-200">
                    📌 Prev KWH
                  </th>
                  <th className="py-2.5 px-3">Curr KWH (Input)</th>
                  <th className="py-2.5 px-3 text-center">MF</th>
                  <th className="py-2.5 px-3 text-right">Consumed (kWh)</th>
                  <th className="py-2.5 px-3 text-center bg-cyan-50/60 text-cyan-900 border-x border-cyan-200">
                    📌 Prev KVAH
                  </th>
                  <th className="py-2.5 px-3">Curr KVAH (Input)</th>
                  <th className="py-2.5 px-3 text-center">PF</th>
                  <th className="py-2.5 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {allMetersList.map((item, idx) => {
                  const row = tableState[item.meter.id] || {
                    currKwh: item.prevKwh + 15,
                    currKvah: item.prevKvah + 16,
                    saved: false,
                  };

                  const diffKwh = Math.max(0, row.currKwh - item.prevKwh);
                  const diffKvah = Math.max(0, row.currKvah - item.prevKvah);
                  const units = Number((diffKwh * item.meter.kwhMf).toFixed(1));
                  const pf = calculatePowerFactor(units, diffKvah * item.meter.kvahMf);

                  return (
                    <tr
                      key={item.meter.id}
                      className={`hover:bg-slate-50/70 transition-colors ${
                        row.saved ? 'bg-emerald-50/20' : ''
                      }`}
                    >
                      <td className="py-2.5 px-3 font-mono text-slate-400">{idx + 1}</td>
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-slate-900">{item.section.name}</div>
                        <div className="text-[11px] text-blue-700 font-mono">
                          {item.meter.meterCode} — {item.meter.meterName}
                        </div>
                      </td>

                      {/* Visible Previous KWH Reference */}
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-blue-900 bg-blue-50/40 border-x border-blue-100">
                        {item.prevKwh}
                      </td>

                      {/* Current KWH Input */}
                      <td className="py-2.5 px-3">
                        <input
                          type="number"
                          step="0.01"
                          value={row.currKwh}
                          onChange={(e) =>
                            handleTableInputChange(
                              item.meter.id,
                              'currKwh',
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="w-24 px-2 py-1 rounded-lg border border-slate-300 font-mono font-bold text-slate-900 text-xs bg-white focus:outline-none focus:border-blue-500"
                        />
                      </td>

                      <td className="py-2.5 px-3 text-center font-mono font-semibold text-slate-600">
                        {item.meter.kwhMf}
                      </td>

                      <td className="py-2.5 px-3 text-right font-mono font-bold text-blue-700">
                        {formatUnits(units)}
                      </td>

                      {/* Visible Previous KVAH Reference */}
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-cyan-900 bg-cyan-50/40 border-x border-cyan-100">
                        {item.prevKvah}
                      </td>

                      {/* Current KVAH Input */}
                      <td className="py-2.5 px-3">
                        <input
                          type="number"
                          step="0.01"
                          value={row.currKvah}
                          onChange={(e) =>
                            handleTableInputChange(
                              item.meter.id,
                              'currKvah',
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="w-24 px-2 py-1 rounded-lg border border-slate-300 font-mono font-bold text-slate-900 text-xs bg-white focus:outline-none focus:border-cyan-500"
                        />
                      </td>

                      <td className="py-2.5 px-3 text-center font-mono font-bold">
                        <span
                          className={
                            pf >= 0.95 ? 'text-emerald-700' : 'text-amber-600'
                          }
                        >
                          {pf}
                        </span>
                      </td>

                      <td className="py-2.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleSaveTableRow(item)}
                          disabled={row.saved}
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg font-bold text-xs transition-all ${
                            row.saved
                              ? 'bg-emerald-100 text-emerald-800 cursor-default'
                              : 'bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700 border border-slate-200'
                          }`}
                        >
                          {row.saved ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>Saved</span>
                            </>
                          ) : (
                            <>
                              <Save className="w-3.5 h-3.5" />
                              <span>Save</span>
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODE 3: TRANSFORMER YARD (750 & 950 KVA) */}
      {/* ---------------------------------------------------- */}
      {entryMode === 'transformer' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
          <form onSubmit={handleSaveTransformer} className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-blue-600" />
                  Substation Transformer Yard (750 KVA & 950 KVA)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Record Main 11 kV Incomer, 750 KVA & 950 KVA step-down readings to compute transformer losses.
                </p>
              </div>

              {tSaveSuccess && (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Transformer reading committed!</span>
                </div>
              )}
            </div>

            {/* Incomer Units Input */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Main 11 KV Incomer Energy Consumption (kWh Units):
              </label>
              <input
                type="number"
                step="1"
                required
                value={tMainKwh}
                onChange={(e) => setTMainKwh(parseFloat(e.target.value) || 0)}
                className="w-full sm:w-72 px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-sm"
              />
              <span className="text-[11px] text-slate-500 block mt-1">
                HT Incomer feeder from MSEDCL / Grid substation
              </span>
            </div>

            {/* Dual Transformer Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* 750 KVA */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="text-xs font-bold text-slate-900 uppercase">
                    Transformer No. 1 (750 KVA)
                  </span>
                  <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                    MF: {t750Mf}
                  </span>
                </div>

                {/* Visible Previous Reference */}
                <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-200">
                  <div className="text-[11px] font-semibold text-blue-800">📌 Previous Dial (Reference):</div>
                  <div className="text-base font-mono font-black text-blue-950">{t750Prev}</div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Current Dial (750 KVA):
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={t750Curr}
                    onChange={(e) => setT750Curr(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold text-slate-900 bg-white focus:outline-none focus:border-blue-500 text-xs"
                  />
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-xs font-mono">
                  <span className="text-slate-600">Calculated Output:</span>
                  <span className="font-bold text-blue-700">
                    {formatUnits(transformerCalculations.t750Units)} kWh
                  </span>
                </div>
              </div>

              {/* 950 KVA */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="text-xs font-bold text-slate-900 uppercase">
                    Transformer No. 2 (950 KVA)
                  </span>
                  <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                    MF: {t950Mf}
                  </span>
                </div>

                {/* Visible Previous Reference */}
                <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-200">
                  <div className="text-[11px] font-semibold text-blue-800">📌 Previous Dial (Reference):</div>
                  <div className="text-base font-mono font-black text-blue-950">{t950Prev}</div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Current Dial (950 KVA):
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={t950Curr}
                    onChange={(e) => setT950Curr(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold text-slate-900 bg-white focus:outline-none focus:border-blue-500 text-xs"
                  />
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-xs font-mono">
                  <span className="text-slate-600">Calculated Output:</span>
                  <span className="font-bold text-blue-700">
                    {formatUnits(transformerCalculations.t950Units)} kWh
                  </span>
                </div>
              </div>
            </div>

            {/* Transformer Loss Calculation Summary Card */}
            <div className="p-4 rounded-xl bg-slate-100/70 border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-[11px] font-semibold text-slate-500 uppercase">Total Combined Output</div>
                <div className="text-lg font-mono font-black text-slate-900">
                  {formatUnits(transformerCalculations.totalOutputUnits)} kWh
                </div>
              </div>

              <div>
                <div className="text-[11px] font-semibold text-slate-500 uppercase">Transformer Losses</div>
                <div className="text-lg font-mono font-black text-amber-700">
                  {formatUnits(transformerCalculations.transformerLosses)} kWh
                </div>
              </div>

              <div>
                <div className="text-[11px] font-semibold text-slate-500 uppercase">Loss Percentage</div>
                <div
                  className={`text-lg font-mono font-black ${
                    transformerCalculations.lossPercentage <= 3
                      ? 'text-emerald-700'
                      : 'text-amber-700'
                  }`}
                >
                  {transformerCalculations.lossPercentage}%
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex items-center justify-end">
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all"
              >
                <Save className="w-4 h-4" />
                <span>Save Transformer Yard Log</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* RECENT SHIFT READINGS SUMMARY TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <BookmarkCheck className="w-4 h-4 text-emerald-600" />
            Today's Logged Readings ({todayReadings.length} entries for {readingDate})
          </h3>
          <span className="text-xs text-slate-500">Live Database Logs</span>
        </div>

        {todayReadings.length === 0 ? (
          <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
            No readings recorded for today yet. Use the entry forms above to log your shift readings.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <th className="py-2 px-3">Time</th>
                  <th className="py-2 px-3">Meter</th>
                  <th className="py-2 px-3">Prev KWH</th>
                  <th className="py-2 px-3">Curr KWH</th>
                  <th className="py-2 px-3 text-center">MF</th>
                  <th className="py-2 px-3 text-right font-bold text-blue-800">Units (kWh)</th>
                  <th className="py-2 px-3 text-center">PF</th>
                  <th className="py-2 px-3">Shift</th>
                  <th className="py-2 px-3">Operator</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {todayReadings.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="py-2 px-3 text-slate-500">{r.time}</td>
                    <td className="py-2 px-3 font-sans font-bold text-slate-800">{r.meterCode}</td>
                    <td className="py-2 px-3 text-slate-600">{r.prevKwh}</td>
                    <td className="py-2 px-3 text-slate-900 font-bold">{r.currKwh}</td>
                    <td className="py-2 px-3 text-center text-slate-500">{r.kwhMf}</td>
                    <td className="py-2 px-3 text-right text-blue-700 font-bold">
                      {formatUnits(r.consumedKwh)}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <span className={r.powerFactor >= 0.95 ? 'text-emerald-700' : 'text-amber-600'}>
                        {r.powerFactor}
                      </span>
                    </td>
                    <td className="py-2 px-3 font-sans text-slate-500 text-[11px]">{r.shift}</td>
                    <td className="py-2 px-3 font-sans text-slate-600 text-[11px]">{r.operatorName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
