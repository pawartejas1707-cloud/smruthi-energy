import mongoose, { Schema, Document } from 'mongoose';

export interface IMeter {
  meterCode: string;
  meterName: string;
  meterType: 'main' | 'submeter' | 'transformer_750' | 'transformer_950';
  kwhMf: number;
  kvahMf: number;
  contractDemandMf: number;
  isActive: boolean;
  notes?: string;
}

export interface ISection extends Document {
  code: string;
  name: string;
  description: string;
  dailyLimitKwh: number;
  category: 'manufacturing' | 'utilities' | 'storage' | 'qa_rd' | 'general';
  meters: IMeter[];
  createdAt: Date;
  updatedAt: Date;
}

const MeterSchema = new Schema<IMeter>(
  {
    meterCode: { type: String, required: true },
    meterName: { type: String, required: true },
    meterType: {
      type: String,
      enum: ['main', 'submeter', 'transformer_750', 'transformer_950'],
      default: 'main',
    },
    kwhMf: { type: Number, required: true, default: 1.0 },
    kvahMf: { type: Number, required: true, default: 1.0 },
    contractDemandMf: { type: Number, required: true, default: 1.0 },
    isActive: { type: Boolean, default: true },
    notes: { type: String },
  },
  { _id: true }
);

const SectionSchema = new Schema<ISection>(
  {
    code: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    description: { type: String, default: '' },
    dailyLimitKwh: { type: Number, required: true, default: 1000 },
    category: {
      type: String,
      enum: ['manufacturing', 'utilities', 'storage', 'qa_rd', 'general'],
      default: 'manufacturing',
    },
    meters: [MeterSchema],
  },
  { timestamps: true }
);

export const SectionModel = mongoose.model<ISection>('Section', SectionSchema);
