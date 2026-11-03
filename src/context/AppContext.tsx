import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import type {
  UserRole,
  UserProfile,
  Section,
  Meter,
  DailyReading,
  TransformerReading,
  ConsumptionAlert,
  EnquiryRecord,
  CostSettings,
} from '../types';
import { INITIAL_SECTIONS } from '../data/initialSections';
import { generateRealisticHistoricalData, DEFAULT_COST_SETTINGS } from '../data/sampleHistory';
import { api } from '../lib/api';

interface AppContextType {
  // Role & User
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  currentUser: UserProfile;

  // Data State
  sections: Section[];
  readings: DailyReading[];
  transformerReadings: TransformerReading[];
  alerts: ConsumptionAlert[];
  enquiries: EnquiryRecord[];
  costSettings: CostSettings;
  isLoading: boolean;
  isBackendConnected: boolean;

  // Operations
  addDailyReading: (reading: Omit<DailyReading, 'id' | 'createdAt'>) => Promise<void>;
  addTransformerReading: (reading: Omit<TransformerReading, 'id' | 'createdAt'>) => Promise<void>;
  updateSectionLimit: (sectionId: string, newLimitKwh: number) => Promise<void>;
  addMeterToSection: (sectionId: string, meter: Omit<Meter, 'id'>) => Promise<void>;
  updateMeter: (sectionId: string, meterId: string, updates: Partial<Meter>) => Promise<void>;
  updateCostSettings: (updates: Partial<CostSettings>) => Promise<void>;
  sendEnquiry: (enquiry: Omit<EnquiryRecord, 'id' | 'createdAt' | 'status'>) => Promise<void>;
  replyToEnquiry: (enquiryId: string, replyMessage: string) => Promise<void>;
  resolveAlert: (alertId: string) => Promise<void>;
  resetToDefaultData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const ROLE_PROFILES: Record<UserRole, UserProfile> = {
  plant_admin: {
    id: 'usr-plant-admin',
    email: 'plant.head@smruthi-organics.com',
    fullName: 'Dr. V. K. Sharma (Plant Admin / VP Ops)',
    role: 'plant_admin',
    department: 'Plant Operations',
  },
  electrical_admin: {
    id: 'usr-elec-admin',
    email: 'electrical.hod@smruthi-organics.com',
    fullName: 'Er. Rajesh K. More (Electrical Admin / Chief)',
    role: 'electrical_admin',
    department: 'Electrical Maintenance',
  },
  viewer: {
    id: 'usr-viewer',
    email: 'mgmt.viewer@smruthi-organics.com',
    fullName: 'Audit & Management Viewer',
    role: 'viewer',
    department: 'Management Information System',
  },
  reading_operator: {
    id: 'usr-operator',
    email: 'shift.operator@smruthi-organics.com',
    fullName: 'Ramesh Patil (Shift Reading Operator)',
    role: 'reading_operator',
    department: 'Substation Operations',
  },
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentRole, setCurrentRole] = useState<UserRole>(() => {
    const saved = localStorage.getItem('smruthi_current_role');
    return (saved as UserRole) || 'reading_operator';
  });
  const [isBackendConnected, setIsBackendConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [sections, setSections] = useState<Section[]>(() => {
    const saved = localStorage.getItem('smruthi_sections');
    return saved ? JSON.parse(saved) : INITIAL_SECTIONS;
  });

  const [costSettings, setCostSettings] = useState<CostSettings>(() => {
    const saved = localStorage.getItem('smruthi_costing');
    return saved ? JSON.parse(saved) : DEFAULT_COST_SETTINGS;
  });

  const [readings, setReadings] = useState<DailyReading[]>(() => {
    const saved = localStorage.getItem('smruthi_readings');
    if (saved) return JSON.parse(saved);
    const initial = generateRealisticHistoricalData();
    return initial.readings;
  });

  const [transformerReadings, setTransformerReadings] = useState<TransformerReading[]>(() => {
    const saved = localStorage.getItem('smruthi_transformers');
    if (saved) return JSON.parse(saved);
    const initial = generateRealisticHistoricalData();
    return initial.transformerReadings;
  });

  const [alerts, setAlerts] = useState<ConsumptionAlert[]>(() => {
    const saved = localStorage.getItem('smruthi_alerts');
    if (saved) return JSON.parse(saved);
    const initial = generateRealisticHistoricalData();
    return initial.alerts;
  });

  const [enquiries, setEnquiries] = useState<EnquiryRecord[]>(() => {
    const saved = localStorage.getItem('smruthi_enquiries');
    if (saved) return JSON.parse(saved);
    return [
      {
        id: 'enq-sample-1',
        sectionId: 'sec-9',
        sectionName: 'Compressor No. 1',
        date: new Date().toISOString().split('T')[0],
        limitKwh: 1400,
        consumedKwh: 1568,
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
        repliedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      },
    ];
  });

  // Local backups
  useEffect(() => {
    localStorage.setItem('smruthi_current_role', currentRole);
  }, [currentRole]);

  useEffect(() => {
    localStorage.setItem('smruthi_sections', JSON.stringify(sections));
  }, [sections]);

  useEffect(() => {
    localStorage.setItem('smruthi_costing', JSON.stringify(costSettings));
  }, [costSettings]);

  useEffect(() => {
    localStorage.setItem('smruthi_readings', JSON.stringify(readings));
  }, [readings]);

  useEffect(() => {
    localStorage.setItem('smruthi_transformers', JSON.stringify(transformerReadings));
  }, [transformerReadings]);

  useEffect(() => {
    localStorage.setItem('smruthi_alerts', JSON.stringify(alerts));
  }, [alerts]);

  useEffect(() => {
    localStorage.setItem('smruthi_enquiries', JSON.stringify(enquiries));
  }, [enquiries]);

  // Connect to Express & MongoDB backend
  useEffect(() => {
    async function initBackend() {
      setIsLoading(true);
      const health = await api.checkHealth();
      if (health && health.status === 'ok') {
        setIsBackendConnected(true);

        // Fetch live sections
        const secData = await api.getSections();
        if (secData && secData.length > 0) {
          const mapped: Section[] = secData.map((s: any) => ({
            id: s._id || s.id,
            code: s.code,
            name: s.name,
            description: s.description || '',
            dailyLimitKwh: s.dailyLimitKwh,
            category: s.category,
            meters: (s.meters || []).map((m: any) => ({
              id: m._id || m.meterCode,
              sectionId: s._id || s.id,
              meterCode: m.meterCode,
              meterName: m.meterName,
              meterType: m.meterType,
              kwhMf: m.kwhMf,
              kvahMf: m.kvahMf,
              contractDemandMf: m.contractDemandMf,
              isActive: m.isActive,
              notes: m.notes,
            })),
          }));
          setSections(mapped);
        }

        // Fetch cost settings
        const costData = await api.getCosting();
        if (costData) {
          setCostSettings({
            id: costData._id || costData.id,
            ratePerKwh: costData.ratePerKwh,
            effectiveDate: costData.effectiveDate,
            demandChargePerKva: costData.demandChargePerKva,
            fixedMonthlyCharges: costData.fixedMonthlyCharges,
            taxRatePercent: costData.taxRatePercent,
            fuelAdjustmentChargePerKwh: costData.fuelAdjustmentChargePerKwh,
            updatedAt: costData.updatedAt || new Date().toISOString(),
            updatedBy: costData.updatedBy,
          });
        }

        // Fetch readings
        const rData = await api.getReadings({ limit: 500 });
        if (rData && rData.length > 0) {
          setReadings(
            rData.map((r: any) => ({
              id: r._id || r.id,
              date: r.date,
              time: r.time,
              sectionId: r.sectionId,
              meterId: r.meterId,
              meterCode: r.meterCode,
              meterName: r.meterName,
              prevKwh: r.prevKwh,
              currKwh: r.currKwh,
              kwhMf: r.kwhMf,
              consumedKwh: r.consumedKwh,
              prevKvah: r.prevKvah,
              currKvah: r.currKvah,
              kvahMf: r.kvahMf,
              consumedKvah: r.consumedKvah,
              powerFactor: r.powerFactor,
              prevDemand: r.prevDemand,
              currDemand: r.currDemand,
              demandMf: r.demandMf,
              calculatedDemand: r.calculatedDemand,
              operatorName: r.operatorName,
              shift: r.shift,
              notes: r.notes,
              createdAt: r.createdAt || r.date,
            }))
          );
        }

        // Fetch transformers
        const tData = await api.getTransformers();
        if (tData && tData.length > 0) {
          setTransformerReadings(
            tData.map((t: any) => ({
              id: t._id || t.id,
              date: t.date,
              time: t.time,
              mainKwhUnits: t.mainKwhUnits,
              t750Prev: t.t750Prev,
              t750Curr: t.t750Curr,
              t750Mf: t.t750Mf,
              t750Units: t.t750Units,
              t950Prev: t.t950Prev,
              t950Curr: t.t950Curr,
              t950Mf: t.t950Mf,
              t950Units: t.t950Units,
              totalOutputUnits: t.totalOutputUnits,
              transformerLosses: t.transformerLosses,
              lossPercentage: t.lossPercentage,
              operatorName: t.operatorName,
              notes: t.notes,
              createdAt: t.createdAt || t.date,
            }))
          );
        }

        // Fetch alerts
        const aData = await api.getAlerts();
        if (aData && aData.length > 0) {
          setAlerts(
            aData.map((a: any) => ({
              id: a._id || a.id,
              date: a.date,
              sectionId: a.sectionId,
              sectionName: a.sectionName,
              limitKwh: a.limitKwh,
              consumedKwh: a.consumedKwh,
              exceededKwh: a.exceededKwh,
              exceededPercentage: a.exceededPercentage,
              status: a.status,
              createdAt: a.createdAt || a.date,
            }))
          );
        }

        // Fetch enquiries
        const eData = await api.getEnquiries();
        if (eData && eData.length > 0) {
          setEnquiries(
            eData.map((e: any) => ({
              id: e._id || e.id,
              alertId: e.alertId,
              sectionId: e.sectionId,
              sectionName: e.sectionName,
              date: e.date,
              consumedKwh: e.consumedKwh,
              limitKwh: e.limitKwh,
              exceededKwh: e.exceededKwh,
              subject: e.subject,
              message: e.message,
              sentBy: e.sentBy,
              sentByEmail: e.sentByEmail,
              sentTo: e.sentTo,
              sentToEmail: e.sentToEmail,
              status: e.status,
              replyMessage: e.replyMessage,
              repliedBy: e.repliedBy,
              repliedAt: e.repliedAt,
              createdAt: e.createdAt || e.date,
            }))
          );
        }
      } else {
        setIsBackendConnected(false);
      }
      setIsLoading(false);
    }

    initBackend();
  }, []);

  const currentUser = useMemo(() => ROLE_PROFILES[currentRole], [currentRole]);

  // Operations
  const addDailyReading = async (reading: Omit<DailyReading, 'id' | 'createdAt'>) => {
    const newId = `rd-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const fullReading: DailyReading = {
      ...reading,
      id: newId,
      createdAt: new Date().toISOString(),
    };

    setReadings((prev) => [fullReading, ...prev]);

    // Cache latest dial immediately for permanent refresh persistence
    try {
      const latestCache = JSON.parse(localStorage.getItem('smruthi_latest_dials') || '{}');
      latestCache[reading.meterId] = reading.currKwh;
      if (reading.meterCode) latestCache[reading.meterCode] = reading.currKwh;
      localStorage.setItem('smruthi_latest_dials', JSON.stringify(latestCache));
    } catch (e) {}

    // Check section limit violation
    const sec = sections.find((s) => s.id === reading.sectionId);
    if (sec) {
      const existingSecReadings = readings.filter(
        (r) => r.date === reading.date && r.sectionId === reading.sectionId && r.meterId !== reading.meterId
      );
      const totalSecConsumed =
        existingSecReadings.reduce((sum, r) => sum + r.consumedKwh, 0) + reading.consumedKwh;

      if (totalSecConsumed > sec.dailyLimitKwh) {
        const exceededKwh = Number((totalSecConsumed - sec.dailyLimitKwh).toFixed(1));
        const exceededPercentage = Number(((exceededKwh / sec.dailyLimitKwh) * 100).toFixed(1));

        setAlerts((prevAlerts) => {
          const alreadyAlerted = prevAlerts.some(
            (a) => a.date === reading.date && a.sectionId === sec.id
          );
          if (!alreadyAlerted) {
            const newAlert: ConsumptionAlert = {
              id: `alt-${Date.now()}`,
              date: reading.date,
              sectionId: sec.id,
              sectionName: sec.name,
              limitKwh: sec.dailyLimitKwh,
              consumedKwh: Number(totalSecConsumed.toFixed(1)),
              exceededKwh,
              exceededPercentage,
              status: 'active',
              createdAt: new Date().toISOString(),
            };
            return [newAlert, ...prevAlerts];
          }
          return prevAlerts;
        });
      }
    }

    if (isBackendConnected) {
      await api.addReading(reading);
    }
  };

  const addTransformerReading = async (tReading: Omit<TransformerReading, 'id' | 'createdAt'>) => {
    const newId = `tr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const full: TransformerReading = {
      ...tReading,
      id: newId,
      createdAt: new Date().toISOString(),
    };

    setTransformerReadings((prev) => [full, ...prev]);

    // Cache latest transformer dials immediately for refresh persistence
    try {
      const tCache = {
        mainKwhCurr: tReading.mainKwhCurr || tReading.mainKwhUnits,
        mainKvahCurr: tReading.mainKvahCurr || 0,
        t750Curr: tReading.t750Curr,
        t950Curr: tReading.t950Curr,
      };
      localStorage.setItem('smruthi_latest_transformer_dials', JSON.stringify(tCache));
    } catch (e) {}

    if (isBackendConnected) {
      await api.addTransformer(tReading);
    }
  };

  const updateSectionLimit = async (sectionId: string, newLimitKwh: number) => {
    setSections((prev) =>
      prev.map((s) => (s.id === sectionId ? { ...s, dailyLimitKwh: newLimitKwh } : s))
    );

    if (isBackendConnected) {
      await api.updateSectionLimit(sectionId, newLimitKwh);
    }
  };

  const addMeterToSection = async (sectionId: string, meterData: Omit<Meter, 'id'>) => {
    const meterId = `mtr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newMeter: Meter = { ...meterData, id: meterId };

    setSections((prev) =>
      prev.map((s) => (s.id === sectionId ? { ...s, meters: [...s.meters, newMeter] } : s))
    );

    if (isBackendConnected) {
      await api.addMeter(sectionId, meterData);
    }
  };

  const updateMeter = async (sectionId: string, meterId: string, updates: Partial<Meter>) => {
    setSections((prev) =>
      prev.map((s) => {
        if (s.id !== sectionId) return s;
        return {
          ...s,
          meters: s.meters.map((m) => (m.id === meterId ? { ...m, ...updates } : m)),
        };
      })
    );

    if (isBackendConnected) {
      await api.updateMeter(sectionId, meterId, updates);
    }
  };

  const updateCostSettings = async (updates: Partial<CostSettings>) => {
    const updated = {
      ...costSettings,
      ...updates,
      updatedAt: new Date().toISOString(),
      updatedBy: currentUser.fullName,
    };
    setCostSettings(updated);

    if (isBackendConnected) {
      await api.updateCosting(updated);
    }
  };

  const sendEnquiry = async (enquiryData: Omit<EnquiryRecord, 'id' | 'createdAt' | 'status'>) => {
    const newEnquiry: EnquiryRecord = {
      ...enquiryData,
      id: `enq-${Date.now()}`,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    setEnquiries((prev) => [newEnquiry, ...prev]);

    if (enquiryData.alertId) {
      setAlerts((prev) =>
        prev.map((a) => (a.id === enquiryData.alertId ? { ...a, status: 'enquiry_sent' } : a))
      );
    }

    if (isBackendConnected) {
      await api.sendEnquiry(enquiryData);
    }
  };

  const replyToEnquiry = async (enquiryId: string, replyMessage: string) => {
    const repliedAt = new Date().toISOString();
    setEnquiries((prev) =>
      prev.map((e) =>
        e.id === enquiryId
          ? {
              ...e,
              replyMessage,
              repliedBy: currentUser.fullName,
              repliedAt,
              status: 'resolved',
            }
          : e
      )
    );

    if (isBackendConnected) {
      await api.replyEnquiry(enquiryId, replyMessage, currentUser.fullName);
    }
  };

  const resolveAlert = async (alertId: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, status: 'resolved' } : a))
    );

    if (isBackendConnected) {
      await api.resolveAlert(alertId);
    }
  };

  const resetToDefaultData = () => {
    localStorage.clear();
    const fresh = generateRealisticHistoricalData();
    setSections(INITIAL_SECTIONS);
    setCostSettings(DEFAULT_COST_SETTINGS);
    setReadings(fresh.readings);
    setTransformerReadings(fresh.transformerReadings);
    setAlerts(fresh.alerts);
    window.location.reload();
  };

  return (
    <AppContext.Provider
      value={{
        currentRole,
        setCurrentRole,
        currentUser,
        sections,
        readings,
        transformerReadings,
        alerts,
        enquiries,
        costSettings,
        isLoading,
        isBackendConnected,
        addDailyReading,
        addTransformerReading,
        updateSectionLimit,
        addMeterToSection,
        updateMeter,
        updateCostSettings,
        sendEnquiry,
        replyToEnquiry,
        resolveAlert,
        resetToDefaultData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
