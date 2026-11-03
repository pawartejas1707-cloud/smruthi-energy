import mongoose, { Schema, Document } from 'mongoose';

export interface ITransformerReading extends Document {
  date: string; // YYYY-MM-DD
  time: string;
  mainKwhUnits: number;
  mainKvahUnits?: number;
  mainKwhPrev?: number;
  mainKwhCurr?: number;
  mainKvahPrev?: number;
  mainKvahCurr?: number;

  t750Prev: number;
  t750Curr: number;
  t750Mf: number;
  t750Units: number;

  t950Prev: number;
  t950Curr: number;
  t950Mf: number;
  t950Units: number;

  totalOutputUnits: number;
  transformerLosses: number;
  lossPercentage: number;

  operatorName: string;
  notes?: string;
  createdAt: Date;
}

const TransformerReadingSchema = new Schema<ITransformerReading>(
  {
    date: { type: String, required: true, unique: true, index: true },
    time: { type: String, default: '08:30' },
    mainKwhUnits: { type: Number, required: true },
    mainKvahUnits: { type: Number },
    mainKwhPrev: { type: Number },
    mainKwhCurr: { type: Number },
    mainKvahPrev: { type: Number },
    mainKvahCurr: { type: Number },

    t750Prev: { type: Number, required: true },
    t750Curr: { type: Number, required: true },
    t750Mf: { type: Number, default: 40 },
    t750Units: { type: Number, required: true },

    t950Prev: { type: Number, required: true },
    t950Curr: { type: Number, required: true },
    t950Mf: { type: Number, default: 50 },
    t950Units: { type: Number, required: true },

    totalOutputUnits: { type: Number, required: true },
    transformerLosses: { type: Number, required: true },
    lossPercentage: { type: Number, required: true },

    operatorName: { type: String, required: true },
    notes: { type: String },
  },
  { timestamps: true }
);

export const TransformerReadingModel = mongoose.model<ITransformerReading>(
  'TransformerReading',
  TransformerReadingSchema
);
