import mongoose, { Schema, Document } from 'mongoose';

export interface ICostSettings extends Document {
  ratePerKwh: number;
  effectiveDate: string;
  demandChargePerKva: number;
  fixedMonthlyCharges: number;
  taxRatePercent: number;
  fuelAdjustmentChargePerKwh: number;
  updatedBy: string;
  updatedAt: Date;
}

const CostSettingsSchema = new Schema<ICostSettings>(
  {
    ratePerKwh: { type: Number, required: true, default: 8.75 },
    effectiveDate: { type: String, required: true },
    demandChargePerKva: { type: Number, default: 475.0 },
    fixedMonthlyCharges: { type: Number, default: 18500.0 },
    taxRatePercent: { type: Number, default: 6.0 },
    fuelAdjustmentChargePerKwh: { type: Number, default: 0.42 },
    updatedBy: { type: String, default: 'Electrical Admin' },
  },
  { timestamps: true }
);

export const CostSettingsModel = mongoose.model<ICostSettings>('CostSettings', CostSettingsSchema);
