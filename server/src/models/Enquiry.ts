import mongoose, { Schema, Document } from 'mongoose';

export interface IEnquiry extends Document {
  alertId?: string;
  sectionId: string;
  sectionName: string;
  date: string;
  consumedKwh: number;
  limitKwh: number;
  exceededKwh: number;
  subject: string;
  message: string;
  sentBy: string;
  sentByEmail: string;
  sentTo: string;
  sentToEmail: string;
  status: 'pending' | 'in_review' | 'resolved';
  replyMessage?: string;
  repliedBy?: string;
  repliedAt?: Date;
  createdAt: Date;
}

const EnquirySchema = new Schema<IEnquiry>(
  {
    alertId: { type: String },
    sectionId: { type: String, required: true },
    sectionName: { type: String, required: true },
    date: { type: String, required: true },
    consumedKwh: { type: Number, required: true },
    limitKwh: { type: Number, required: true },
    exceededKwh: { type: Number, required: true },
    subject: { type: String, required: true },
    message: { type: String, required: true },
    sentBy: { type: String, required: true },
    sentByEmail: { type: String, required: true },
    sentTo: { type: String, default: 'Er. Rajesh K. More (Electrical Admin)' },
    sentToEmail: { type: String, default: 'electrical.hod@smruthi-organics.com' },
    status: { type: String, enum: ['pending', 'in_review', 'resolved'], default: 'pending' },
    replyMessage: { type: String },
    repliedBy: { type: String },
    repliedAt: { type: Date },
  },
  { timestamps: true }
);

export const EnquiryModel = mongoose.model<IEnquiry>('Enquiry', EnquirySchema);
