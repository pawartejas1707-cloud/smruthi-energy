import mongoose, { Schema, Document } from 'mongoose';

export interface IAlert extends Document {
  date: string;
  sectionId: string;
  sectionName: string;
  limitKwh: number;
  consumedKwh: number;
  exceededKwh: number;
  exceededPercentage: number;
  status: 'active' | 'enquiry_sent' | 'resolved';
  createdAt: Date;
}

const AlertSchema = new Schema<IAlert>(
  {
    date: { type: String, required: true, index: true },
    sectionId: { type: String, required: true },
    sectionName: { type: String, required: true },
    limitKwh: { type: Number, required: true },
    consumedKwh: { type: Number, required: true },
    exceededKwh: { type: Number, required: true },
    exceededPercentage: { type: Number, required: true },
    status: { type: String, enum: ['active', 'enquiry_sent', 'resolved'], default: 'active' },
  },
  { timestamps: true }
);

export const AlertModel = mongoose.model<IAlert>('Alert', AlertSchema);
