import express from 'express';
import { SectionModel } from '../models/Section.js';
import { MeterReadingModel } from '../models/MeterReading.js';
import { TransformerReadingModel } from '../models/TransformerReading.js';
import { CostSettingsModel } from '../models/CostSettings.js';
import { AlertModel } from '../models/Alert.js';
import { EnquiryModel } from '../models/Enquiry.js';

const router = express.Router();

// 1. Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    system: 'Smruthi Organics Electrical Department',
    timestamp: new Date().toISOString(),
  });
});

// 2. Sections (21 Sections)
router.get('/sections', async (req, res) => {
  try {
    const sections = await SectionModel.find().sort({ createdAt: 1 });
    res.json(sections);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Helper to find a section by either MongoDB _id or custom code/id
async function findSection(idOrCode: string) {
  let sec = null;
  if (/^[0-9a-fA-F]{24}$/.test(idOrCode)) {
    sec = await SectionModel.findById(idOrCode);
  }
  if (!sec) {
    sec = await SectionModel.findOne({
      $or: [{ code: idOrCode }, { name: idOrCode }],
    });
  }
  return sec;
}

router.put('/sections/:id/limit', async (req, res) => {
  try {
    const { dailyLimitKwh } = req.body;
    let sec = await findSection(req.params.id);
    if (!sec) return res.status(404).json({ error: 'Section not found' });
    sec.dailyLimitKwh = dailyLimitKwh;
    await sec.save();
    res.json(sec);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/sections/:id/meters', async (req, res) => {
  try {
    const sec = await findSection(req.params.id);
    if (!sec) return res.status(404).json({ error: 'Section not found' });
    sec.meters.push(req.body);
    await sec.save();
    res.json(sec);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/sections/:id/meters/:meterId', async (req, res) => {
  try {
    const sec = await findSection(req.params.id);
    if (!sec) return res.status(404).json({ error: 'Section not found' });
    
    let meter = (sec.meters as any).id(req.params.meterId);
    if (!meter) {
      meter = sec.meters.find(
        (m: any) =>
          m.meterCode === req.params.meterId ||
          m._id?.toString() === req.params.meterId ||
          (m as any).id === req.params.meterId
      );
    }
    if (!meter) return res.status(404).json({ error: 'Meter not found' });
    Object.assign(meter, req.body);
    await sec.save();
    res.json(sec);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Daily Meter Readings
router.get('/readings', async (req, res) => {
  try {
    const { date, sectionId, meterId, limit = 500 } = req.query;
    const query: any = {};
    if (date) query.date = date;
    if (sectionId && sectionId !== 'all') query.sectionId = sectionId;
    if (meterId) query.meterId = meterId;

    const readings = await MeterReadingModel.find(query)
      .sort({ createdAt: -1, _id: -1, date: -1, time: -1 })
      .limit(Number(limit));
    res.json(readings);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/readings', async (req, res) => {
  try {
    const reading = new MeterReadingModel(req.body);
    await reading.save();

    // Check section limit violation and create alert if necessary
    try {
      const sec = await findSection(reading.sectionId);
      if (sec) {
        const todaySecReadings = await MeterReadingModel.find({
          date: reading.date,
          sectionId: reading.sectionId,
        });
        const totalConsumed = todaySecReadings.reduce((sum, r) => sum + r.consumedKwh, 0);

        if (totalConsumed > sec.dailyLimitKwh) {
          const exceededKwh = Number((totalConsumed - sec.dailyLimitKwh).toFixed(1));
          const exceededPercentage = Number(((exceededKwh / sec.dailyLimitKwh) * 100).toFixed(1));

          const existingAlert = await AlertModel.findOne({
            date: reading.date,
            sectionId: sec._id.toString(),
          });

          if (!existingAlert) {
            await AlertModel.create({
              date: reading.date,
              sectionId: sec._id.toString(),
              sectionName: sec.name,
              limitKwh: sec.dailyLimitKwh,
              consumedKwh: Number(totalConsumed.toFixed(1)),
              exceededKwh,
              exceededPercentage,
              status: 'active',
            });
          }
        }
      }
    } catch (alertErr) {
      console.warn('Alert check warning:', alertErr);
    }

    res.status(201).json(reading);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Transformer Readings & Losses
router.get('/transformers', async (req, res) => {
  try {
    const readings = await TransformerReadingModel.find()
      .sort({ createdAt: -1, _id: -1, date: -1 })
      .limit(100);
    res.json(readings);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/transformers', async (req, res) => {
  try {
    const reading = await TransformerReadingModel.findOneAndUpdate(
      { date: req.body.date },
      req.body,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    res.status(201).json(reading);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Cost Settings
router.get('/costing', async (req, res) => {
  try {
    const cost = await CostSettingsModel.findOne().sort({ effectiveDate: -1 });
    res.json(cost);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/costing', async (req, res) => {
  try {
    const cost = await CostSettingsModel.create(req.body);
    res.json(cost);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Alerts
router.get('/alerts', async (req, res) => {
  try {
    const alerts = await AlertModel.find().sort({ createdAt: -1 }).limit(100);
    res.json(alerts);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/alerts/:id/resolve', async (req, res) => {
  try {
    const alert = await AlertModel.findByIdAndUpdate(
      req.params.id,
      { status: 'resolved' },
      { new: true }
    );
    res.json(alert);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 7. Enquiries
router.get('/enquiries', async (req, res) => {
  try {
    const enquiries = await EnquiryModel.find().sort({ createdAt: -1 });
    res.json(enquiries);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/enquiries', async (req, res) => {
  try {
    const enq = new EnquiryModel(req.body);
    await enq.save();

    if (req.body.alertId) {
      await AlertModel.findByIdAndUpdate(req.body.alertId, { status: 'enquiry_sent' });
    }

    res.status(201).json(enq);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/enquiries/:id/reply', async (req, res) => {
  try {
    const { replyMessage, repliedBy } = req.body;
    const enq = await EnquiryModel.findByIdAndUpdate(
      req.params.id,
      {
        replyMessage,
        repliedBy,
        repliedAt: new Date(),
        status: 'resolved',
      },
      { new: true }
    );
    res.json(enq);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
