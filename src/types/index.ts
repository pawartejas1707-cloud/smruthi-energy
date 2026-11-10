export type UserRole =
  | 'plant_admin'
  | 'electrical_admin'
  | 'viewer'
  | 'reading_operator'
  | 'block_a'
  | 'block_b'
  | 'block_c'
  | 'block_d'
  | 'block_eg'
  | 'block_f';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  department: string;
  createdAt?: string;
}

export interface Meter {
  id: string;
  sectionId: string;
  meterCode: string; // e.g. MTR-A1, MTR-A2
  meterName: string;
  meterType: 'main' | 'submeter' | 'transformer_750' | 'transformer_950';
  kwhMf: number; // Multiplying factor for KWH
  kvahMf: number; // Multiplying factor for KVAH
  contractDemandMf: number; // MF for contract demand
  isActive: boolean;
  notes?: string;
}

export interface Section {
  id: string;
  code: string;
  name: string;
  description: string;
  dailyLimitKwh: number; // Configurable daily consumption limit
  meters: Meter[];
  category: 'manufacturing' | 'utilities' | 'storage' | 'qa_rd' | 'general';
}

export interface DailyReading {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  sectionId: string;
  meterId: string;
  meterCode: string;
  meterName: string;
  
  // KWH
  prevKwh: number;
  currKwh: number;
  kwhMf: number;
  consumedKwh: number; // (curr - prev) * kwhMf
  
  // KVAH
  prevKvah: number;
  currKvah: number;
  kvahMf: number;
  consumedKvah: number; // (curr - prev) * kvahMf
  
  // Power Factor = consumedKwh / consumedKvah
  powerFactor: number;
  
  // Contract Demand
  prevDemand?: number;
  currDemand?: number;
  demandMf: number;
  calculatedDemand: number; // (currDemand - prevDemand) * demandMf
  
  // Metadata
  operatorName: string;
  operatorId?: string;
  shift: 'Shift 1 (Morning)' | 'Shift 2 (Evening)' | 'Shift 3 (Night)' | 'General Shift';
  notes?: string;
  createdAt: string;
}

export interface TransformerReading {
  id: string;
  date: string;
  time: string;
  mainKwhUnits: number; // Total Plant Main KWH Units
  mainKvahUnits?: number; // Total Plant Main KVAH Units
  mainKwhPrev?: number;
  mainKwhCurr?: number;
  mainKvahPrev?: number;
  mainKvahCurr?: number;
  
  // 750 KVA Transformer
  t750Prev: number;
  t750Curr: number;
  t750Mf: number;
  t750Units: number; // (t750Curr - t750Prev) * t750Mf
  
  // 950 KVA Transformer
  t950Prev: number;
  t950Curr: number;
  t950Mf: number;
  t950Units: number; // (t950Curr - t950Prev) * t950Mf
  
  // Automatic Calculations
  totalOutputUnits: number; // 750 + 950
  transformerLosses: number; // Main - Total Output
  lossPercentage: number; // (Losses / Main) * 100
  
  operatorName: string;
  notes?: string;
  createdAt: string;
}

export interface ConsumptionAlert {
  id: string;
  date: string;
  sectionId: string;
  sectionName: string;
  limitKwh: number;
  consumedKwh: number;
  exceededKwh: number;
  exceededPercentage: number;
  status: 'active' | 'enquiry_sent' | 'resolved';
  createdAt: string;
}

export interface EnquiryRecord {
  id: string;
  alertId?: string;
  sectionId: string;
  sectionName: string;
  date: string;
  consumedKwh: number;
  limitKwh: number;
  exceededKwh: number;
  subject: string;
  message: string;
  sentBy: string; // Plant Admin name
  sentByEmail: string;
  sentTo: string; // Electrical Admin or Block In-Charge
  sentToEmail: string;
  targetRole?: UserRole; // Sub-ID expected to respond (e.g. block_a, block_b, electrical_admin)
  status: 'pending' | 'in_review' | 'resolved';
  replyMessage?: string;
  repliedBy?: string;
  repliedAt?: string;
  createdAt: string;
}

export interface CostSettings {
  id: string;
  ratePerKwh: number; // e.g. ₹ 8.75
  effectiveDate: string; // YYYY-MM-DD
  demandChargePerKva: number; // e.g. ₹ 450 / kVA
  fixedMonthlyCharges: number; // e.g. ₹ 15000
  taxRatePercent: number; // e.g. 6.0%
  fuelAdjustmentChargePerKwh: number; // e.g. ₹ 0.45 / kWh
  updatedAt: string;
  updatedBy: string;
}

export interface BillEstimate {
  period: string;
  totalKwh: number;
  peakDemandKva: number;
  energyCharges: number;
  demandCharges: number;
  fuelAdjustmentCharges: number;
  fixedCharges: number;
  subtotal: number;
  taxAmount: number;
  totalBill: number;
  effectiveRate: number; // totalBill / totalKwh
}

export interface EmailAlertConfig {
  recipients: string[];
  monitoredBlocks: string[]; // e.g. ['A Block']
  isEnabled: boolean;
  smtpHost?: string;
  smtpPort?: number;
  smtpSecure?: boolean;
  smtpUser?: string;
  smtpPass?: string;
  fromAddress?: string;
  updatedAt?: string;
}

export interface EmailLog {
  id: string;
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
  sentAt: string;
}
