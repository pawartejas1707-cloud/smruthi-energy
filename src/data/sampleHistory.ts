import { DailyReading, TransformerReading, ConsumptionAlert, CostSettings } from '../types';
import { INITIAL_SECTIONS } from './initialSections';
import { calculatePowerFactor } from '../lib/calculations';

export const DEFAULT_COST_SETTINGS: CostSettings = {
  id: 'cost-default',
  ratePerKwh: 8.75, // Standard HT Industrial tariff in ₹/kWh
  effectiveDate: '2026-04-01',
  demandChargePerKva: 475.0, // ₹ per kVA of billing demand
  fixedMonthlyCharges: 18500.0, // Fixed grid connection charges
  taxRatePercent: 6.0, // Electricity duty %
  fuelAdjustmentChargePerKwh: 0.42, // FAC per unit
  updatedAt: new Date().toISOString(),
  updatedBy: 'Electrical Admin (Chief Engineer)',
};

/**
 * Generate 30 days of realistic industrial readings for Smruthi Organics
 */
export function generateRealisticHistoricalData(): {
  readings: DailyReading[];
  transformerReadings: TransformerReading[];
  alerts: ConsumptionAlert[];
} {
  const readings: DailyReading[] = [];
  const transformerReadings: TransformerReading[] = [];
  const alerts: ConsumptionAlert[] = [];

  const today = new Date();
  
  // Track running meter dials for realistic sequential readings
  const meterDials: Record<string, { kwh: number; kvah: number; demand: number }> = {};

  INITIAL_SECTIONS.forEach((sec) => {
    sec.meters.forEach((mtr) => {
      // Base counter starting values
      meterDials[mtr.id] = {
        kwh: 124500.0 + Math.random() * 50000,
        kvah: 131000.0 + Math.random() * 52000,
        demand: 180.0 + Math.random() * 40,
      };
    });
  });

  // Base transformer meters
  let t750Dial = 284500.0;
  let t950Dial = 362100.0;

  // Generate 30 days backwards up to today
  for (let d = 30; d >= 0; d--) {
    const dateObj = new Date(today);
    dateObj.setDate(today.getDate() - d);
    const dateStr = dateObj.toISOString().split('T')[0];

    let dayTotalKwh = 0;

    INITIAL_SECTIONS.forEach((sec) => {
      let secDayKwh = 0;

      sec.meters.forEach((mtr) => {
        const dial = meterDials[mtr.id];
        
        // Target consumption per meter based on section limit
        const baseTarget = (sec.dailyLimitKwh / sec.meters.length) * (0.85 + Math.random() * 0.28);
        // Occasionally let a couple of specific sections exceed limit to test alerts (e.g. Compressor 1, MEE, A Block)
        let actualConsumedKwh = baseTarget;
        if (d <= 3 && (sec.code === 'SEC-COMP-1' || sec.code === 'SEC-A-BLK')) {
          actualConsumedKwh = sec.dailyLimitKwh * 1.12; // 12% over limit
        }

        const readingDiffKwh = actualConsumedKwh / mtr.kwhMf;
        const prevKwh = Number(dial.kwh.toFixed(1));
        const currKwh = Number((prevKwh + readingDiffKwh).toFixed(1));
        dial.kwh = currKwh;

        // KVAH reading with realistic power factor (0.93 - 0.98)
        const targetPf = 0.94 + Math.random() * 0.04;
        const actualConsumedKvah = actualConsumedKwh / targetPf;
        const readingDiffKvah = actualConsumedKvah / mtr.kvahMf;
        const prevKvah = Number(dial.kvah.toFixed(1));
        const currKvah = Number((prevKvah + readingDiffKvah).toFixed(1));
        dial.kvah = currKvah;

        const consumedKwh = Number(((currKwh - prevKwh) * mtr.kwhMf).toFixed(1));
        const consumedKvah = Number(((currKvah - prevKvah) * mtr.kvahMf).toFixed(1));
        const pf = calculatePowerFactor(consumedKwh, consumedKvah);

        // Contract demand
        const demandDiff = 25.0 + Math.random() * 15.0;
        const prevDemand = Number(dial.demand.toFixed(1));
        const currDemand = Number((prevDemand + demandDiff).toFixed(1));
        dial.demand = currDemand;
        const calculatedDemand = Number((demandDiff * mtr.contractDemandMf).toFixed(1));

        readings.push({
          id: `rd-${dateStr}-${mtr.id}`,
          date: dateStr,
          time: '08:30',
          sectionId: sec.id,
          meterId: mtr.id,
          meterCode: mtr.meterCode,
          meterName: mtr.meterName,
          prevKwh,
          currKwh,
          kwhMf: mtr.kwhMf,
          consumedKwh,
          prevKvah,
          currKvah,
          kvahMf: mtr.kvahMf,
          consumedKvah,
          powerFactor: pf,
          prevDemand,
          currDemand,
          demandMf: mtr.contractDemandMf,
          calculatedDemand,
          operatorName: d % 2 === 0 ? 'Ramesh Patil (Tech-1)' : 'Suresh Shinde (Tech-2)',
          shift: 'Shift 1 (Morning)',
          notes: 'Routine 24h reading cycle completed at 08:30 AM',
          createdAt: `${dateStr}T08:30:00Z`,
        });

        secDayKwh += consumedKwh;
      });

      dayTotalKwh += secDayKwh;

      // Check section limit violation for alerts
      if (secDayKwh > sec.dailyLimitKwh) {
        const exceededKwh = Number((secDayKwh - sec.dailyLimitKwh).toFixed(1));
        const exceededPercentage = Number(((exceededKwh / sec.dailyLimitKwh) * 100).toFixed(1));
        alerts.push({
          id: `alt-${dateStr}-${sec.id}`,
          date: dateStr,
          sectionId: sec.id,
          sectionName: sec.name,
          limitKwh: sec.dailyLimitKwh,
          consumedKwh: Number(secDayKwh.toFixed(1)),
          exceededKwh,
          exceededPercentage,
          status: d === 0 ? 'active' : 'resolved',
          createdAt: `${dateStr}T08:35:00Z`,
        });
      }
    });

    // Transformer calculations for this day
    const mainKwhUnits = dayTotalKwh;
    // 750 KVA delivers ~42% of plant load, 950 KVA delivers ~55%, leaving ~2.5 - 3.5% transformer losses
    const lossRatio = 0.028 + Math.random() * 0.008; // ~3% loss
    const totalOutputUnits = Number((mainKwhUnits * (1 - lossRatio)).toFixed(1));
    const t750Units = Number((totalOutputUnits * 0.44).toFixed(1));
    const t950Units = Number((totalOutputUnits - t750Units).toFixed(1));

    const t750Mf = 40;
    const t950Mf = 50;

    const t750Prev = Number(t750Dial.toFixed(1));
    const t750Curr = Number((t750Prev + t750Units / t750Mf).toFixed(1));
    t750Dial = t750Curr;

    const t950Prev = Number(t950Dial.toFixed(1));
    const t950Curr = Number((t950Prev + t950Units / t950Mf).toFixed(1));
    t950Dial = t950Curr;

    const transformerLosses = Number((mainKwhUnits - totalOutputUnits).toFixed(1));
    const lossPercentage = Number(((transformerLosses / mainKwhUnits) * 100).toFixed(2));

    transformerReadings.push({
      id: `tr-${dateStr}`,
      date: dateStr,
      time: '08:30',
      mainKwhUnits: Number(mainKwhUnits.toFixed(1)),
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
      operatorName: 'Ramesh Patil (Tech-1)',
      notes: 'Transformer yard logging with oil level & temp OK',
      createdAt: `${dateStr}T08:30:00Z`,
    });
  }

  return { readings, transformerReadings, alerts };
}
