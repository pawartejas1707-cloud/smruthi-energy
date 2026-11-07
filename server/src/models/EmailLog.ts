import mongoose, { Schema, Document } from 'mongoose';

export interface IEmailLog extends Document {
  sectionName: string;
  sectionCode?: string;
  date: string;
  consumedKwh: number;
  limitKwh: number;
  exceededKwh: number;
  exceededPercentage: number;
  recipients: string[];
  subject: string;
  bodySnippet: string;
  status: 'sent' | 'simulated' | 'failed';
  error?: string;
  messageId?: string;
  previewUrl?: string;
  sentAt: Date;
  createdAt: Date;
}

const EmailLogSchema = new Schema<IEmailLog>(
  {
    sectionName: { type: String, required: true },
    sectionCode: { type: String, default: '' },
    date: { type: String, required: true },
    consumedKwh: { type: Number, required: true },
    limitKwh: { type: Number, required: true },
    exceededKwh: { type: Number, required: true },
    exceededPercentage: { type: Number, required: true },
    recipients: { type: [String], required: true },
    subject: { type: String, required: true },
    bodySnippet: { type: String, default: '' },
    status: { type: String, enum: ['sent', 'simulated', 'failed'], default: 'sent' },
    error: { type: String, default: '' },
    messageId: { type: String, default: '' },
    previewUrl: { type: String, default: '' },
    sentAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const EmailLogModel = mongoose.model<IEmailLog>('EmailLog', EmailLogSchema);
