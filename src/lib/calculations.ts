import { CostSettings, BillEstimate } from '../types';

/**
 * Calculate electrical energy units consumed
 * Formula: Units = (Current Reading − Previous Reading) × MF
 */
export function calculateUnits(currentReading: number, previousReading: number, mf: number): number {
  if (currentReading < previousReading) {
    throw new Error('Current reading cannot be lower than previous reading');
  }
  const diff = currentReading - previousReading;
  return Number((diff * mf).toFixed(2));
}

/**
 * Calculate Power Factor (PF)
 * Formula: PF = Difference in KWH ÷ Difference in KVAH
 * Safely handles 0, null, or division by zero.
 */
export function calculatePowerFactor(kwhDiff: number, kvahDiff: number): number {
  if (!kvahDiff || kvahDiff <= 0) {
    // If no consumption in the period, nominal PF is 1.0
    return 1.0;
  }
  if (kwhDiff <= 0) {
    return 0.0;
  }
  const pf = kwhDiff / kvahDiff;
  // Electrical PF is mathematically bounded between 0 and 1.0
  const clamped = Math.min(1.0, Math.max(0.0, pf));
  return Number(clamped.toFixed(3));
}

/**
 * Calculate Contract Demand
 * Formula: Contract Demand = Reading Difference × Contract Demand MF
 */
export function calculateContractDemand(curr: number, prev: number, demandMf: number): number {
  if (curr < prev) {
    return 0;
  }
  const diff = curr - prev;
  return Number((diff * demandMf).toFixed(2));
}

export interface TransformerLossResult {
  t750Units: number;
  t950Units: number;
  totalOutputUnits: number;
  transformerLosses: number;
  lossPercentage: number;
}

/**
 * Calculate Transformer Outputs and Losses
 * 1. 750 KVA transformer units = Reading Difference × MF
 * 2. 950 KVA transformer units = Reading Difference × MF
 * 3. Total transformer output = 750 KVA units + 950 KVA units
 * 4. Transformer losses = Main KWH units − Total Transformer Output
 * 5. Loss Percentage = (Transformer Losses ÷ Main KWH Units) × 100
 */
export function calculateTransformerLosses(
  mainKwhUnits: number,
  t750Curr: number,
  t750Prev: number,
  t750Mf: number,
  t950Curr: number,
  t950Prev: number,
  t950Mf: number
): TransformerLossResult {
  const t750Units = Number(((t750Curr - t750Prev) * t750Mf).toFixed(2));
  const t950Units = Number(((t950Curr - t950Prev) * t950Mf).toFixed(2));
  const totalOutputUnits = Number((t750Units + t950Units).toFixed(2));
  const transformerLosses = Number((mainKwhUnits - totalOutputUnits).toFixed(2));
  
  let lossPercentage = 0;
  if (mainKwhUnits > 0) {
    lossPercentage = Number(((transformerLosses / mainKwhUnits) * 100).toFixed(2));
  }

  return {
    t750Units: Math.max(0, t750Units),
    t950Units: Math.max(0, t950Units),
    totalOutputUnits,
    transformerLosses,
    lossPercentage,
  };
}

/**
 * Calculate estimated electricity bill based on dynamic CostSettings
 */
export function calculateBillEstimate(
  totalKwh: number,
  peakDemandKva: number,
  costSettings: CostSettings,
  periodDays: number = 1
): BillEstimate {
  const energyCharges = totalKwh * costSettings.ratePerKwh;
  const demandCharges = peakDemandKva * (costSettings.demandChargePerKva || 0);
  const fuelAdjustmentCharges = totalKwh * (costSettings.fuelAdjustmentChargePerKwh || 0);
  // Fixed charges prorated for period (default 30 days per month)
  const fixedCharges = ((costSettings.fixedMonthlyCharges || 0) / 30) * periodDays;
  
  const subtotal = energyCharges + demandCharges + fuelAdjustmentCharges + fixedCharges;
  const taxAmount = (subtotal * (costSettings.taxRatePercent || 0)) / 100;
  const totalBill = subtotal + taxAmount;
  const effectiveRate = totalKwh > 0 ? totalBill / totalKwh : costSettings.ratePerKwh;

  return {
    period: `${periodDays} Day(s)`,
    totalKwh: Number(totalKwh.toFixed(2)),
    peakDemandKva: Number(peakDemandKva.toFixed(2)),
    energyCharges: Number(energyCharges.toFixed(2)),
    demandCharges: Number(demandCharges.toFixed(2)),
    fuelAdjustmentCharges: Number(fuelAdjustmentCharges.toFixed(2)),
    fixedCharges: Number(fixedCharges.toFixed(2)),
    subtotal: Number(subtotal.toFixed(2)),
    taxAmount: Number(taxAmount.toFixed(2)),
    totalBill: Number(totalBill.toFixed(2)),
    effectiveRate: Number(effectiveRate.toFixed(2)),
  };
}

/**
 * Format currency in Indian Rupees (₹)
 */
export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format numbers with Indian comma separation
 */
export function formatUnits(units: number): string {
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 1,
  }).format(units);
}
