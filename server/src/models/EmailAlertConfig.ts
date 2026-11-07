import mongoose, { Schema, Document } from 'mongoose';

export interface IEmailAlertConfig extends Document {
  recipients: string[];
  monitoredBlocks: string[];
  isEnabled: boolean;
  smtpHost?: string;
  smtpPort?: number;
  smtpSecure?: boolean;
  smtpUser?: string;
  smtpPass?: string;
  fromAddress?: string;
  createdAt: Date;
  updatedAt: Date;
}

const EmailAlertConfigSchema = new Schema<IEmailAlertConfig>(
  {
    recipients: {
      type: [String],
      default: ['plant.head@smruthi-organics.com', 'electrical.hod@smruthi-organics.com'],
    },
    monitoredBlocks: {
      type: [String],
      default: ['A Block'], // Specifically monitors A Block by default as requested
    },
    isEnabled: { type: Boolean, default: true },
    smtpHost: { type: String, default: '' },
    smtpPort: { type: Number, default: 587 },
    smtpSecure: { type: Boolean, default: false },
    smtpUser: { type: String, default: '' },
    smtpPass: { type: String, default: '' },
    fromAddress: {
      type: String,
      default: 'Smruthi Organics Electrical Dept <alerts@smruthi-organics.com>',
    },
  },
  { timestamps: true }
);

export const EmailAlertConfigModel = mongoose.model<IEmailAlertConfig>(
  'EmailAlertConfig',
  EmailAlertConfigSchema
);
