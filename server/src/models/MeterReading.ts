import mongoose, { Schema, Document } from 'mongoose';

export interface IMeterReading extends Document {
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  sectionId: string;
  meterId: string;
  meterCode: string;
  meterName: string;

  prevKwh: number;
  currKwh: number;
  kwhMf: number;
  consumedKwh: number;

  prevKvah: number;
  currKvah: number;
  kvahMf: number;
  consumedKvah: number;

  powerFactor: number;

  prevDemand: number;
  currDemand: number;
  demandMf: number;
  calculatedDemand: number;

  operatorName: string;
  shift: string;
  notes?: string;
  createdAt: Date;
}

const MeterReadingSchema = new Schema<IMeterReading>(
  {
    date: { type: String, required: true, index: true },
    time: { type: String, default: '08:30' },
    sectionId: { type: String, required: true, index: true },
    meterId: { type: String, required: true, index: true },
    meterCode: { type: String, required: true },
    meterName: { type: String, required: true },

    prevKwh: { type: Number, required: true },
    currKwh: { type: Number, required: true },
    kwhMf: { type: Number, required: true, default: 1.0 },
    consumedKwh: { type: Number, required: true },

    prevKvah: { type: Number, required: true },
    currKvah: { type: Number, required: true },
    kvahMf: { type: Number, required: true, default: 1.0 },
    consumedKvah: { type: Number, required: true },

    powerFactor: { type: Number, required: true, default: 0.95 },

    prevDemand: { type: Number, default: 0 },
    currDemand: { type: Number, default: 0 },
    demandMf: { type: Number, default: 1.0 },
    calculatedDemand: { type: Number, default: 0 },

    operatorName: { type: String, required: true },
    shift: { type: String, default: 'Shift 1 (Morning)' },
    notes: { type: String },
  },
  { timestamps: true }
);

MeterReadingSchema.index({ date: 1, meterId: 1 });

export const MeterReadingModel = mongoose.model<IMeterReading>('MeterReading', MeterReadingSchema);
