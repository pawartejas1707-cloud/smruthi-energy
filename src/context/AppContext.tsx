import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
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
import { supabase, isSupabaseConfigured } from '../lib/supabase';

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
  isSupabaseLive: boolean;
  
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
  const [currentRole, setCurrentRole] = useState<UserRole>('electrical_admin');
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

  const [isLoading, setIsLoading] = useState(false);

  // Sync to local state backup
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

  // Load from Supabase if configured
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;

    async function fetchSupabaseData() {
      setIsLoading(true);
      try {
        // Fetch sections
        const { data: secData } = await supabase!.from('sections').select('*, meters(*)');
        if (secData && secData.length > 0) {
          const mapped: Section[] = secData.map((s: any) => ({
            id: s.id,
            code: s.code,
            name: s.name,
            description: s.description || '',
            dailyLimitKwh: Number(s.daily_limit_kwh),
            category: s.category,
            meters: (s.meters || []).map((m: any) => ({
              id: m.id,
              sectionId: m.section_id,
              meterCode: m.meter_code,
              meterName: m.meter_name,
              meterType: m.meter_type,
              kwhMf: Number(m.kwh_mf),
              kvahMf: Number(m.kvah_mf),
              contractDemandMf: Number(m.contract_demand_mf),
              isActive: m.is_active,
              notes: m.notes,
            })),
          }));
          setSections(mapped);
        }

        // Fetch cost settings
        const { data: costData } = await supabase!
          .from('cost_settings')
          .select('*')
          .order('effective_date', { ascending: false })
          .limit(1);
        if (costData && costData.length > 0) {
          const c = costData[0];
          setCostSettings({
            id: c.id,
            ratePerKwh: Number(c.rate_per_kwh),
            effectiveDate: c.effective_date,
            demandChargePerKva: Number(c.demand_charge_per_kva),
            fixedMonthlyCharges: Number(c.fixed_monthly_charges),
            taxRatePercent: Number(c.tax_rate_percent),
            fuelAdjustmentChargePerKwh: Number(c.fuel_adjustment_charge_per_kwh),
            updatedAt: c.updated_at,
            updatedBy: c.updated_by,
          });
        }
      } catch (err) {
        console.warn('Supabase fetch notice: using cached/offline data', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchSupabaseData();
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

    // Check if section limit exceeded for this day
    const sec = sections.find((s) => s.id === reading.sectionId);
    if (sec) {
      // Sum all readings for this section on this day
      const existingSecReadings = readings.filter(
        (r) => r.date === reading.date && r.sectionId === reading.sectionId && r.meterId !== reading.meterId
      );
      const totalSecConsumed =
        existingSecReadings.reduce((sum, r) => sum + r.consumedKwh, 0) + reading.consumedKwh;

      if (totalSecConsumed > sec.dailyLimitKwh) {
        const exceededKwh = Number((totalSecConsumed - sec.dailyLimitKwh).toFixed(1));
        const exceededPercentage = Number(((exceededKwh / sec.dailyLimitKwh) * 100).toFixed(1));

        // Create alert if not already logged today
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

    // Sync to Supabase if live
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('meter_readings').insert({
          reading_date: reading.date,
          reading_time: reading.time,
          section_id: reading.sectionId,
          meter_id: reading.meterId,
          prev_kwh: reading.prevKwh,
          curr_kwh: reading.currKwh,
          kwh_mf: reading.kwhMf,
          prev_kvah: reading.prevKvah,
          curr_kvah: reading.currKvah,
          kvah_mf: reading.kvahMf,
          power_factor: reading.powerFactor,
          prev_demand: reading.prevDemand || 0,
          curr_demand: reading.currDemand || 0,
          demand_mf: reading.demandMf,
          operator_name: reading.operatorName,
          shift: reading.shift,
          notes: reading.notes,
        });
      } catch (err) {
        console.error('Supabase write error:', err);
      }
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

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('transformer_readings').insert({
          reading_date: tReading.date,
          reading_time: tReading.time,
          main_kwh_units: tReading.mainKwhUnits,
          t750_prev: tReading.t750Prev,
          t750_curr: tReading.t750Curr,
          t750_mf: tReading.t750Mf,
          t950_prev: tReading.t950Prev,
          t950_curr: tReading.t950Curr,
          t950_mf: tReading.t950Mf,
          total_output_units: tReading.totalOutputUnits,
          transformer_losses: tReading.transformerLosses,
          loss_percentage: tReading.lossPercentage,
          operator_name: tReading.operatorName,
          notes: tReading.notes,
        });
      } catch (err) {
        console.error('Supabase transformer write error:', err);
      }
    }
  };

  const updateSectionLimit = async (sectionId: string, newLimitKwh: number) => {
    setSections((prev) =>
      prev.map((s) => (s.id === sectionId ? { ...s, dailyLimitKwh: newLimitKwh } : s))
    );

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('sections').update({ daily_limit_kwh: newLimitKwh }).eq('id', sectionId);
      } catch (err) {
        console.error('Supabase update limit error:', err);
      }
    }
  };

  const addMeterToSection = async (sectionId: string, meterData: Omit<Meter, 'id'>) => {
    const meterId = `mtr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newMeter: Meter = { ...meterData, id: meterId };

    setSections((prev) =>
      prev.map((s) => (s.id === sectionId ? { ...s, meters: [...s.meters, newMeter] } : s))
    );

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('meters').insert({
          section_id: sectionId,
          meter_code: meterData.meterCode,
          meter_name: meterData.meterName,
          meter_type: meterData.meterType,
          kwh_mf: meterData.kwhMf,
          kvah_mf: meterData.kvahMf,
          contract_demand_mf: meterData.contractDemandMf,
          is_active: meterData.isActive,
          notes: meterData.notes,
        });
      } catch (err) {
        console.error('Supabase add meter error:', err);
      }
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

    if (isSupabaseConfigured && supabase) {
      try {
        const dbUpdates: any = {};
        if (updates.meterCode) dbUpdates.meter_code = updates.meterCode;
        if (updates.meterName) dbUpdates.meter_name = updates.meterName;
        if (updates.kwhMf !== undefined) dbUpdates.kwh_mf = updates.kwhMf;
        if (updates.kvahMf !== undefined) dbUpdates.kvah_mf = updates.kvahMf;
        if (updates.contractDemandMf !== undefined) dbUpdates.contract_demand_mf = updates.contractDemandMf;
        if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;
        await supabase.from('meters').update(dbUpdates).eq('id', meterId);
      } catch (err) {
        console.error('Supabase update meter error:', err);
      }
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

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('cost_settings').insert({
          rate_per_kwh: updated.ratePerKwh,
          effective_date: updated.effectiveDate,
          demand_charge_per_kva: updated.demandChargePerKva,
          fixed_monthly_charges: updated.fixedMonthlyCharges,
          tax_rate_percent: updated.taxRatePercent,
          fuel_adjustment_charge_per_kwh: updated.fuelAdjustmentChargePerKwh,
          updated_by: updated.updatedBy,
        });
      } catch (err) {
        console.error('Supabase cost update error:', err);
      }
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

    // Update alert status to enquiry_sent
    if (enquiryData.alertId) {
      setAlerts((prev) =>
        prev.map((a) => (a.id === enquiryData.alertId ? { ...a, status: 'enquiry_sent' } : a))
      );
    }

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('enquiries').insert({
          alert_id: enquiryData.alertId,
          section_id: enquiryData.sectionId,
          section_name: enquiryData.sectionName,
          enquiry_date: enquiryData.date,
          consumed_kwh: enquiryData.consumedKwh,
          limit_kwh: enquiryData.limitKwh,
          exceeded_kwh: enquiryData.exceededKwh,
          subject: enquiryData.subject,
          message: enquiryData.message,
          sent_by: enquiryData.sentBy,
          sent_by_email: enquiryData.sentByEmail,
          sent_to: enquiryData.sentTo,
          sent_to_email: enquiryData.sentToEmail,
        });
      } catch (err) {
        console.error('Supabase send enquiry error:', err);
      }
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

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase
          .from('enquiries')
          .update({
            reply_message: replyMessage,
            replied_by: currentUser.fullName,
            replied_at: repliedAt,
            status: 'resolved',
          })
          .eq('id', enquiryId);
      } catch (err) {
        console.error('Supabase reply error:', err);
      }
    }
  };

  const resolveAlert = async (alertId: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, status: 'resolved' } : a))
    );

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('consumption_alerts').update({ status: 'resolved' }).eq('id', alertId);
      } catch (err) {
        console.error('Supabase resolve alert error:', err);
      }
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
        isSupabaseLive: isSupabaseConfigured,
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
