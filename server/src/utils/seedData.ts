import { SectionModel } from '../models/Section.js';
import { CostSettingsModel } from '../models/CostSettings.js';
import { MeterReadingModel } from '../models/MeterReading.js';
import { TransformerReadingModel } from '../models/TransformerReading.js';
import { AlertModel } from '../models/Alert.js';
import { EnquiryModel } from '../models/Enquiry.js';
import { UserModel } from '../models/User.js';

export const INITIAL_21_SECTIONS = [
  {
    code: 'SEC-A-BLK',
    name: 'A Block',
    description: 'Manufacturing Block A with primary reaction vessels & recovery units',
    dailyLimitKwh: 2800,
    category: 'manufacturing',
    meters: [
      {
        meterCode: 'MTR-A1',
        meterName: 'A1 Feeder Main Meter',
        meterType: 'main',
        kwhMf: 40,
        kvahMf: 40,
        contractDemandMf: 1.0,
        isActive: true,
        notes: 'Primary 415V incomer for A-Block reactor hall',
      },
      {
        meterCode: 'MTR-A2',
        meterName: 'A2 Feeder Aux Meter',
        meterType: 'submeter',
        kwhMf: 20,
        kvahMf: 20,
        contractDemandMf: 0.5,
        isActive: true,
        notes: 'Secondary feed for reflux pumps and condenser loop',
      },
    ],
  },
  {
    code: 'SEC-B-BLK',
    name: 'B Block',
    description: 'Manufacturing Block B synthesis and filtration plant',
    dailyLimitKwh: 3200,
    category: 'manufacturing',
    meters: [
      {
        meterCode: 'MTR-B1',
        meterName: 'B1 Main Reaction Meter',
        meterType: 'main',
        kwhMf: 40,
        kvahMf: 40,
        contractDemandMf: 1.0,
        isActive: true,
        notes: 'Main 400A feeder to B-Block MCC panel',
      },
      {
        meterCode: 'MTR-B2',
        meterName: 'B2 Utilities & Drying Meter',
        meterType: 'submeter',
        kwhMf: 20,
        kvahMf: 20,
        contractDemandMf: 0.5,
        isActive: true,
        notes: 'Centrifuge and fluid bed dryer section',
      },
    ],
  },
  {
    code: 'SEC-C-BLK',
    name: 'C Block',
    description: 'C Block fine chemicals purification line',
    dailyLimitKwh: 2200,
    category: 'manufacturing',
    meters: [
      {
        meterCode: 'MTR-C1',
        meterName: 'C Block Master Meter',
        meterType: 'main',
        kwhMf: 30,
        kvahMf: 30,
        contractDemandMf: 0.75,
        isActive: true,
      },
    ],
  },
  {
    code: 'SEC-D-BLK',
    name: 'D Block',
    description: 'D Block intermediate processing unit',
    dailyLimitKwh: 1900,
    category: 'manufacturing',
    meters: [
      {
        meterCode: 'MTR-D1',
        meterName: 'D Block MCC Incomer',
        meterType: 'main',
        kwhMf: 25,
        kvahMf: 25,
        contractDemandMf: 0.65,
        isActive: true,
      },
    ],
  },
  {
    code: 'SEC-EG-BLK',
    name: 'E & G',
    description: 'E & G combined production and solvent recovery unit',
    dailyLimitKwh: 2500,
    category: 'manufacturing',
    meters: [
      {
        meterCode: 'MTR-EG1',
        meterName: 'E & G Combined Panel Meter',
        meterType: 'main',
        kwhMf: 30,
        kvahMf: 30,
        contractDemandMf: 0.8,
        isActive: true,
      },
    ],
  },
  {
    code: 'SEC-QC',
    name: 'QC',
    description: 'Quality Control laboratories, HVAC & instrumentation',
    dailyLimitKwh: 850,
    category: 'qa_rd',
    meters: [
      {
        meterCode: 'MTR-QC1',
        meterName: 'QC Central Lab Incomer',
        meterType: 'submeter',
        kwhMf: 10,
        kvahMf: 10,
        contractDemandMf: 0.25,
        isActive: true,
      },
    ],
  },
  {
    code: 'SEC-RM-STR',
    name: 'RM Store',
    description: 'Raw Material storage warehouse, cooling & ventilation',
    dailyLimitKwh: 600,
    category: 'storage',
    meters: [
      {
        meterCode: 'MTR-RM1',
        meterName: 'RM Store Main Feeder',
        meterType: 'submeter',
        kwhMf: 10,
        kvahMf: 10,
        contractDemandMf: 0.2,
        isActive: true,
      },
    ],
  },
  {
    code: 'SEC-F-BLK',
    name: 'F Block',
    description: 'F Block active pharmaceutical ingredients line',
    dailyLimitKwh: 2100,
    category: 'manufacturing',
    meters: [
      {
        meterCode: 'MTR-F1',
        meterName: 'F Block Panel Meter',
        meterType: 'main',
        kwhMf: 25,
        kvahMf: 25,
        contractDemandMf: 0.6,
        isActive: true,
      },
    ],
  },
  {
    code: 'SEC-COMP-1',
    name: 'Compressor No. 1',
    description: 'Heavy utility reciprocating compressor unit 1',
    dailyLimitKwh: 1400,
    category: 'utilities',
    meters: [
      {
        meterCode: 'MTR-CMP1',
        meterName: 'Compressor 1 Motor Incomer',
        meterType: 'main',
        kwhMf: 20,
        kvahMf: 20,
        contractDemandMf: 0.5,
        isActive: true,
      },
    ],
  },
  {
    code: 'SEC-COMP-2',
    name: 'Compressor No. 2',
    description: 'Heavy utility reciprocating compressor unit 2',
    dailyLimitKwh: 1400,
    category: 'utilities',
    meters: [
      {
        meterCode: 'MTR-CMP2',
        meterName: 'Compressor 2 Motor Incomer',
        meterType: 'main',
        kwhMf: 20,
        kvahMf: 20,
        contractDemandMf: 0.5,
        isActive: true,
      },
    ],
  },
  {
    code: 'SEC-CT-PNL',
    name: 'CT Panel',
    description: 'Cooling Tower circulation pump panel & fan bank',
    dailyLimitKwh: 1750,
    category: 'utilities',
    meters: [
      {
        meterCode: 'MTR-CT1',
        meterName: 'Cooling Tower Main MCC',
        meterType: 'main',
        kwhMf: 25,
        kvahMf: 25,
        contractDemandMf: 0.6,
        isActive: true,
      },
    ],
  },
  {
    code: 'SEC-60TR-C3',
    name: '60TR Compressor No. 3',
    description: '60 Ton Refrigeration Chilling Plant Compressor',
    dailyLimitKwh: 1600,
    category: 'utilities',
    meters: [
      {
        meterCode: 'MTR-60TR',
        meterName: '60TR Chiller Motor Feeder',
        meterType: 'main',
        kwhMf: 20,
        kvahMf: 20,
        contractDemandMf: 0.5,
        isActive: true,
      },
    ],
  },
  {
    code: 'SEC-SCREW-C4',
    name: 'Screw Compressor No. 4',
    description: 'High-efficiency screw chiller unit 4',
    dailyLimitKwh: 1800,
    category: 'utilities',
    meters: [
      {
        meterCode: 'MTR-SC4',
        meterName: 'Screw Compressor 4 Panel',
        meterType: 'main',
        kwhMf: 25,
        kvahMf: 25,
        contractDemandMf: 0.65,
        isActive: true,
      },
    ],
  },
  {
    code: 'SEC-AIR-COMP',
    name: 'Air Compressor',
    description: 'Instrument air compressor station (Atlas Copco / ELGi)',
    dailyLimitKwh: 1100,
    category: 'utilities',
    meters: [
      {
        meterCode: 'MTR-ACMP',
        meterName: 'Air Compressor Incomer',
        meterType: 'main',
        kwhMf: 15,
        kvahMf: 15,
        contractDemandMf: 0.4,
        isActive: true,
      },
    ],
  },
  {
    code: 'SEC-AIR-JET',
    name: 'Air Jet',
    description: 'Pneumatic air jet milling and micronizing system',
    dailyLimitKwh: 950,
    category: 'utilities',
    meters: [
      {
        meterCode: 'MTR-AJ1',
        meterName: 'Air Jet Pulverizer Panel',
        meterType: 'main',
        kwhMf: 15,
        kvahMf: 15,
        contractDemandMf: 0.35,
        isActive: true,
      },
    ],
  },
  {
    code: 'SEC-BOILER',
    name: 'Boiler',
    description: 'Steam boiler house, feed pumps, ID/FD blowers & water softener',
    dailyLimitKwh: 1350,
    category: 'utilities',
    meters: [
      {
        meterCode: 'MTR-BLR',
        meterName: 'Boiler House Feeder',
        meterType: 'main',
        kwhMf: 20,
        kvahMf: 20,
        contractDemandMf: 0.45,
        isActive: true,
      },
    ],
  },
  {
    code: 'SEC-FAB-SHD',
    name: 'Fab Shade',
    description: 'Mechanical fabrication, maintenance workshop & welding shed',
    dailyLimitKwh: 450,
    category: 'general',
    meters: [
      {
        meterCode: 'MTR-FAB',
        meterName: 'Fab Shed Panel Meter',
        meterType: 'submeter',
        kwhMf: 5,
        kvahMf: 5,
        contractDemandMf: 0.15,
        isActive: true,
      },
    ],
  },
  {
    code: 'SEC-MEE',
    name: 'MEE',
    description: 'Multiple Effect Evaporator (Zero Liquid Discharge plant)',
    dailyLimitKwh: 2600,
    category: 'utilities',
    meters: [
      {
        meterCode: 'MTR-MEE',
        meterName: 'MEE Plant Main Panel',
        meterType: 'main',
        kwhMf: 35,
        kvahMf: 35,
        contractDemandMf: 0.85,
        isActive: true,
      },
    ],
  },
  {
    code: 'SEC-BIO',
    name: 'Biological',
    description: 'Biological Effluent Treatment Plant (ETP aeration & clarifier)',
    dailyLimitKwh: 1500,
    category: 'utilities',
    meters: [
      {
        meterCode: 'MTR-BIO',
        meterName: 'Biological ETP MCC',
        meterType: 'main',
        kwhMf: 20,
        kvahMf: 20,
        contractDemandMf: 0.5,
        isActive: true,
      },
    ],
  },
  {
    code: 'SEC-RD',
    name: 'R&D',
    description: 'Research & Development pilot plant and analytical synthesis',
    dailyLimitKwh: 750,
    category: 'qa_rd',
    meters: [
      {
        meterCode: 'MTR-RD',
        meterName: 'R&D Pilot Plant Feeder',
        meterType: 'submeter',
        kwhMf: 10,
        kvahMf: 10,
        contractDemandMf: 0.25,
        isActive: true,
      },
    ],
  },
  {
    code: 'SEC-FIRE-HYD',
    name: 'Fire Hydrant',
    description: 'Fire hydrant booster pumps, jockey pumps & emergency deluge',
    dailyLimitKwh: 350,
    category: 'general',
    meters: [
      {
        meterCode: 'MTR-FHYD',
        meterName: 'Fire Fighting Pump House',
        meterType: 'submeter',
        kwhMf: 15,
        kvahMf: 15,
        contractDemandMf: 0.3,
        isActive: true,
      },
    ],
  },
];

export async function seedInitialDatabase() {
  const sectionCount = await SectionModel.countDocuments();
  if (sectionCount === 0) {
    console.log('🌱 [Seeding MongoDB]: Inserting 21 Department Sections...');
    await SectionModel.insertMany(INITIAL_21_SECTIONS);
  }

  const costCount = await CostSettingsModel.countDocuments();
  if (costCount === 0) {
    console.log('🌱 [Seeding MongoDB]: Inserting Default HT Cost Settings...');
    await CostSettingsModel.create({
      ratePerKwh: 8.75,
      effectiveDate: '2026-04-01',
      demandChargePerKva: 475.0,
      fixedMonthlyCharges: 18500.0,
      taxRatePercent: 6.0,
      fuelAdjustmentChargePerKwh: 0.42,
      updatedBy: 'Electrical Admin (Chief Engineer)',
    });
  }

  const readingsCount = await MeterReadingModel.countDocuments();
  if (readingsCount === 0) {
    console.log('🌱 [Seeding MongoDB]: Generating 30 days of realistic industrial readings...');
    const sections = await SectionModel.find();
    const today = new Date();

    const meterDials: Record<string, { kwh: number; kvah: number; demand: number }> = {};
    sections.forEach((sec) => {
      sec.meters.forEach((mtr) => {
        meterDials[mtr.meterCode] = {
          kwh: 124500.0 + Math.random() * 50000,
          kvah: 131000.0 + Math.random() * 52000,
          demand: 180.0 + Math.random() * 40,
        };
      });
    });

    let t750Dial = 284500.0;
    let t950Dial = 362100.0;

    const readingsToInsert = [];
    const transformersToInsert = [];
    const alertsToInsert = [];

    for (let d = 30; d >= 0; d--) {
      const dateObj = new Date(today);
      dateObj.setDate(today.getDate() - d);
      const dateStr = dateObj.toISOString().split('T')[0];

      let dayTotalKwh = 0;

      for (const sec of sections) {
        let secDayKwh = 0;

        for (const mtr of sec.meters) {
          const dial = meterDials[mtr.meterCode];
          const baseTarget =
            (sec.dailyLimitKwh / sec.meters.length) * (0.85 + Math.random() * 0.28);
          let actualKwh = baseTarget;
          if (d <= 3 && (sec.code === 'SEC-COMP-1' || sec.code === 'SEC-A-BLK')) {
            actualKwh = sec.dailyLimitKwh * 1.12;
          }

          const diffKwh = actualKwh / mtr.kwhMf;
          const prevKwh = Number(dial.kwh.toFixed(1));
          const currKwh = Number((prevKwh + diffKwh).toFixed(1));
          dial.kwh = currKwh;

          const targetPf = 0.94 + Math.random() * 0.04;
          const actualKvah = actualKwh / targetPf;
          const diffKvah = actualKvah / mtr.kvahMf;
          const prevKvah = Number(dial.kvah.toFixed(1));
          const currKvah = Number((prevKvah + diffKvah).toFixed(1));
          dial.kvah = currKvah;

          const consumedKwh = Number(((currKwh - prevKwh) * mtr.kwhMf).toFixed(1));
          const consumedKvah = Number(((currKvah - prevKvah) * mtr.kvahMf).toFixed(1));
          const pf =
            consumedKvah > 0 ? Number((consumedKwh / consumedKvah).toFixed(3)) : 0.95;

          const demandDiff = 25.0 + Math.random() * 15.0;
          const prevDemand = Number(dial.demand.toFixed(1));
          const currDemand = Number((prevDemand + demandDiff).toFixed(1));
          dial.demand = currDemand;
          const calculatedDemand = Number((demandDiff * mtr.contractDemandMf).toFixed(1));

          readingsToInsert.push({
            date: dateStr,
            time: '08:30',
            sectionId: sec._id.toString(),
            meterId: (mtr as any)._id?.toString() || mtr.meterCode,
            meterCode: mtr.meterCode,
            meterName: mtr.meterName,
            prevKwh,
            currKwh,
            kwhMf: mtr.kwhMf,
            consumedKwh,
            prevKvah,
            currKvah,
            kvahMf: mtr.kvahMf,
            consumedKvah,
            powerFactor: Math.min(1.0, Math.max(0.0, pf)),
            prevDemand,
            currDemand,
            demandMf: mtr.contractDemandMf,
            calculatedDemand,
            operatorName: d % 2 === 0 ? 'Ramesh Patil (Tech-1)' : 'Suresh Shinde (Tech-2)',
            shift: 'Shift 1 (Morning)',
            notes: 'Routine 24h reading cycle completed at 08:30 AM',
          });

          secDayKwh += consumedKwh;
        }

        dayTotalKwh += secDayKwh;

        if (secDayKwh > sec.dailyLimitKwh) {
          const exceededKwh = Number((secDayKwh - sec.dailyLimitKwh).toFixed(1));
          const exceededPercentage = Number(((exceededKwh / sec.dailyLimitKwh) * 100).toFixed(1));
          alertsToInsert.push({
            date: dateStr,
            sectionId: sec._id.toString(),
            sectionName: sec.name,
            limitKwh: sec.dailyLimitKwh,
            consumedKwh: Number(secDayKwh.toFixed(1)),
            exceededKwh,
            exceededPercentage,
            status: d === 0 ? 'active' : 'resolved',
          });
        }
      }

      const mainKwhUnits = dayTotalKwh;
      const lossRatio = 0.028 + Math.random() * 0.008;
      const totalOutputUnits = Number((mainKwhUnits * (1 - lossRatio)).toFixed(1));
      const t750Units = Number((totalOutputUnits * 0.44).toFixed(1));
      const t950Units = Number((totalOutputUnits - t750Units).toFixed(1));

      const t750Prev = Number(t750Dial.toFixed(1));
      const t750Curr = Number((t750Prev + t750Units / 40).toFixed(1));
      t750Dial = t750Curr;

      const t950Prev = Number(t950Dial.toFixed(1));
      const t950Curr = Number((t950Prev + t950Units / 50).toFixed(1));
      t950Dial = t950Curr;

      const transformerLosses = Number((mainKwhUnits - totalOutputUnits).toFixed(1));
      const lossPercentage = Number(((transformerLosses / mainKwhUnits) * 100).toFixed(2));

      transformersToInsert.push({
        date: dateStr,
        time: '08:30',
        mainKwhUnits: Number(mainKwhUnits.toFixed(1)),
        t750Prev,
        t750Curr,
        t750Mf: 40,
        t750Units,
        t950Prev,
        t950Curr,
        t950Mf: 50,
        t950Units,
        totalOutputUnits,
        transformerLosses,
        lossPercentage,
        operatorName: 'Ramesh Patil (Tech-1)',
        notes: 'Transformer yard logging with oil level & temp OK',
      });
    }

    await MeterReadingModel.insertMany(readingsToInsert);
    await TransformerReadingModel.insertMany(transformersToInsert);
    await AlertModel.insertMany(alertsToInsert);

    // Initial enquiry sample
    await EnquiryModel.create({
      sectionId: 'sec-9',
      sectionName: 'Compressor No. 1',
      date: new Date().toISOString().split('T')[0],
      consumedKwh: 1568,
      limitKwh: 1400,
      exceededKwh: 168,
      subject: 'Excess consumption on Compressor No. 1 during afternoon cycle',
      message:
        'Compressor No. 1 has exceeded its daily threshold by 168 kWh (12%). Please check unloader valve leakage and cooling temperature immediately.',
      sentBy: 'Dr. V. K. Sharma (Plant Admin / VP Ops)',
      sentByEmail: 'plant.head@smruthi-organics.com',
      sentTo: 'Er. Rajesh K. More (Electrical Admin)',
      sentToEmail: 'electrical.hod@smruthi-organics.com',
      status: 'in_review',
      replyMessage: 'Technician dispatched to inspect unloader valve and suction pressure filter.',
      repliedBy: 'Er. Rajesh K. More',
      repliedAt: new Date(),
    });

    console.log('✅ [MongoDB Seed Complete]: 30 days of data, 21 sections, and transformer records initialized.');
  }
}
