-- ====================================================================
-- SMRUTHI ORGANICS – ELECTRICAL DEPARTMENT
-- INDUSTRIAL ENERGY MONITORING SYSTEM DATABASE SCHEMA & RLS POLICIES
-- Target: Supabase PostgreSQL (Free Tier Compatible, ₹0 Cost)
-- ====================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES / USERS TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('plant_admin', 'electrical_admin', 'viewer', 'reading_operator')),
    department TEXT DEFAULT 'Electrical',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. SECTIONS TABLE (21 Industrial Sections)
CREATE TABLE IF NOT EXISTS public.sections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    daily_limit_kwh NUMERIC(10, 2) NOT NULL DEFAULT 1000.00,
    category TEXT NOT NULL CHECK (category IN ('manufacturing', 'utilities', 'storage', 'qa_rd', 'general')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. METERS TABLE (Configurable Multiplying Factors per Meter)
CREATE TABLE IF NOT EXISTS public.meters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    section_id UUID NOT NULL REFERENCES public.sections(id) ON DELETE CASCADE,
    meter_code TEXT NOT NULL UNIQUE,
    meter_name TEXT NOT NULL,
    meter_type TEXT NOT NULL DEFAULT 'main' CHECK (meter_type IN ('main', 'submeter', 'transformer_750', 'transformer_950')),
    kwh_mf NUMERIC(10, 3) NOT NULL DEFAULT 1.000,
    kvah_mf NUMERIC(10, 3) NOT NULL DEFAULT 1.000,
    contract_demand_mf NUMERIC(10, 3) NOT NULL DEFAULT 1.000,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. DAILY METER READINGS TABLE
CREATE TABLE IF NOT EXISTS public.meter_readings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reading_date DATE NOT NULL,
    reading_time TIME NOT NULL DEFAULT '08:30:00',
    section_id UUID NOT NULL REFERENCES public.sections(id) ON DELETE CASCADE,
    meter_id UUID NOT NULL REFERENCES public.meters(id) ON DELETE CASCADE,
    
    -- KWH Readings & Units = (Current - Previous) * MF
    prev_kwh NUMERIC(14, 2) NOT NULL,
    curr_kwh NUMERIC(14, 2) NOT NULL,
    kwh_mf NUMERIC(10, 3) NOT NULL DEFAULT 1.000,
    consumed_kwh NUMERIC(14, 2) GENERATED ALWAYS AS (ROUND((curr_kwh - prev_kwh) * kwh_mf, 2)) STORED,
    
    -- KVAH Readings & Units = (Current - Previous) * MF
    prev_kvah NUMERIC(14, 2) NOT NULL,
    curr_kvah NUMERIC(14, 2) NOT NULL,
    kvah_mf NUMERIC(10, 3) NOT NULL DEFAULT 1.000,
    consumed_kvah NUMERIC(14, 2) GENERATED ALWAYS AS (ROUND((curr_kvah - prev_kvah) * kvah_mf, 2)) STORED,
    
    -- Power Factor = Difference in KWH / Difference in KVAH
    power_factor NUMERIC(5, 3) NOT NULL DEFAULT 0.950,
    
    -- Contract Demand = Difference * Contract Demand MF
    prev_demand NUMERIC(10, 2) DEFAULT 0,
    curr_demand NUMERIC(10, 2) DEFAULT 0,
    demand_mf NUMERIC(10, 3) NOT NULL DEFAULT 1.000,
    calculated_demand NUMERIC(10, 2) GENERATED ALWAYS AS (ROUND((curr_demand - prev_demand) * demand_mf, 2)) STORED,
    
    -- Operator & Shift details
    operator_name TEXT NOT NULL,
    operator_id UUID REFERENCES public.profiles(id),
    shift TEXT NOT NULL DEFAULT 'Shift 1 (Morning)',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT chk_kwh_positive CHECK (curr_kwh >= prev_kwh),
    CONSTRAINT chk_kvah_positive CHECK (curr_kvah >= prev_kvah),
    CONSTRAINT uq_daily_meter UNIQUE (reading_date, meter_id)
);

-- 5. TRANSFORMER READINGS TABLE
CREATE TABLE IF NOT EXISTS public.transformer_readings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reading_date DATE NOT NULL UNIQUE,
    reading_time TIME NOT NULL DEFAULT '08:30:00',
    main_kwh_units NUMERIC(14, 2) NOT NULL,
    
    -- 750 KVA Transformer Units = (Curr - Prev) * MF
    t750_prev NUMERIC(14, 2) NOT NULL,
    t750_curr NUMERIC(14, 2) NOT NULL,
    t750_mf NUMERIC(10, 3) NOT NULL DEFAULT 40.000,
    t750_units NUMERIC(14, 2) GENERATED ALWAYS AS (ROUND((t750_curr - t750_prev) * t750_mf, 2)) STORED,
    
    -- 950 KVA Transformer Units = (Curr - Prev) * MF
    t950_prev NUMERIC(14, 2) NOT NULL,
    t950_curr NUMERIC(14, 2) NOT NULL,
    t950_mf NUMERIC(10, 3) NOT NULL DEFAULT 50.000,
    t950_units NUMERIC(14, 2) GENERATED ALWAYS AS (ROUND((t950_curr - t950_prev) * t950_mf, 2)) STORED,
    
    -- Output, Losses & Loss Percentage
    total_output_units NUMERIC(14, 2) NOT NULL,
    transformer_losses NUMERIC(14, 2) NOT NULL,
    loss_percentage NUMERIC(6, 2) NOT NULL,
    
    operator_name TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT chk_t750_positive CHECK (t750_curr >= t750_prev),
    CONSTRAINT chk_t950_positive CHECK (t950_curr >= t950_prev)
);

-- 6. COST SETTINGS (Electricity Tariffs)
CREATE TABLE IF NOT EXISTS public.cost_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rate_per_kwh NUMERIC(8, 2) NOT NULL DEFAULT 8.75,
    effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
    demand_charge_per_kva NUMERIC(8, 2) NOT NULL DEFAULT 475.00,
    fixed_monthly_charges NUMERIC(10, 2) NOT NULL DEFAULT 18500.00,
    tax_rate_percent NUMERIC(5, 2) NOT NULL DEFAULT 6.00,
    fuel_adjustment_charge_per_kwh NUMERIC(6, 2) NOT NULL DEFAULT 0.42,
    updated_by TEXT NOT NULL DEFAULT 'Electrical Admin',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. CONSUMPTION ALERTS TABLE
CREATE TABLE IF NOT EXISTS public.consumption_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    alert_date DATE NOT NULL,
    section_id UUID NOT NULL REFERENCES public.sections(id) ON DELETE CASCADE,
    section_name TEXT NOT NULL,
    limit_kwh NUMERIC(10, 2) NOT NULL,
    consumed_kwh NUMERIC(10, 2) NOT NULL,
    exceeded_kwh NUMERIC(10, 2) NOT NULL,
    exceeded_percentage NUMERIC(6, 2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'enquiry_sent', 'resolved')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. ENQUIRIES TABLE (Plant Admin -> Electrical Admin)
CREATE TABLE IF NOT EXISTS public.enquiries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    alert_id UUID REFERENCES public.consumption_alerts(id) ON DELETE SET NULL,
    section_id UUID NOT NULL REFERENCES public.sections(id) ON DELETE CASCADE,
    section_name TEXT NOT NULL,
    enquiry_date DATE NOT NULL DEFAULT CURRENT_DATE,
    consumed_kwh NUMERIC(10, 2) NOT NULL,
    limit_kwh NUMERIC(10, 2) NOT NULL,
    exceeded_kwh NUMERIC(10, 2) NOT NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    sent_by TEXT NOT NULL,
    sent_by_email TEXT NOT NULL,
    sent_to TEXT NOT NULL DEFAULT 'Electrical Admin',
    sent_to_email TEXT NOT NULL DEFAULT 'electrical.admin@smruthi-organics.com',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_review', 'resolved')),
    reply_message TEXT,
    replied_by TEXT,
    replied_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meter_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transformer_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cost_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consumption_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enquiries ENABLE ROW LEVEL SECURITY;

-- Helper to check user role from profiles
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- SELECT policies: Authenticated users can view all operational records
CREATE POLICY "Allow authenticated read on profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read on sections" ON public.sections FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read on meters" ON public.meters FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read on meter_readings" ON public.meter_readings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read on transformer_readings" ON public.transformer_readings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read on cost_settings" ON public.cost_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read on consumption_alerts" ON public.consumption_alerts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read on enquiries" ON public.enquiries FOR SELECT TO authenticated USING (true);

-- Also allow anon read if needed for local dashboard display when testing with anon key
CREATE POLICY "Allow anon read for public dashboards" ON public.sections FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon read for public meters" ON public.meters FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon read for readings" ON public.meter_readings FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon read for transformers" ON public.transformer_readings FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon read for costing" ON public.cost_settings FOR SELECT TO anon USING (true);

-- ELECTRICAL ADMIN: Full write access
CREATE POLICY "Electrical admin modify sections" ON public.sections 
  FOR ALL TO authenticated USING (public.get_current_user_role() = 'electrical_admin');

CREATE POLICY "Electrical admin modify meters" ON public.meters 
  FOR ALL TO authenticated USING (public.get_current_user_role() = 'electrical_admin');

CREATE POLICY "Electrical admin modify cost_settings" ON public.cost_settings 
  FOR ALL TO authenticated USING (public.get_current_user_role() = 'electrical_admin');

CREATE POLICY "Electrical admin modify alerts" ON public.consumption_alerts 
  FOR ALL TO authenticated USING (public.get_current_user_role() = 'electrical_admin');

-- READING OPERATOR & ELECTRICAL ADMIN: Can insert/update meter readings and transformer readings
CREATE POLICY "Operators insert readings" ON public.meter_readings 
  FOR INSERT TO authenticated WITH CHECK (public.get_current_user_role() IN ('reading_operator', 'electrical_admin'));

CREATE POLICY "Operators update readings" ON public.meter_readings 
  FOR UPDATE TO authenticated USING (public.get_current_user_role() IN ('reading_operator', 'electrical_admin'));

CREATE POLICY "Operators insert transformer readings" ON public.transformer_readings 
  FOR INSERT TO authenticated WITH CHECK (public.get_current_user_role() IN ('reading_operator', 'electrical_admin'));

CREATE POLICY "Operators update transformer readings" ON public.transformer_readings 
  FOR UPDATE TO authenticated USING (public.get_current_user_role() IN ('reading_operator', 'electrical_admin'));

-- PLANT ADMIN & ELECTRICAL ADMIN: Enquiries
CREATE POLICY "Plant admin send enquiry" ON public.enquiries 
  FOR INSERT TO authenticated WITH CHECK (public.get_current_user_role() IN ('plant_admin', 'electrical_admin'));

CREATE POLICY "Admin update enquiry" ON public.enquiries 
  FOR UPDATE TO authenticated USING (public.get_current_user_role() IN ('plant_admin', 'electrical_admin'));

-- ====================================================================
-- SEED DATA: 21 PREDEFINED INDUSTRIAL SECTIONS & METERS
-- ====================================================================

INSERT INTO public.sections (code, name, description, daily_limit_kwh, category) VALUES
('SEC-A-BLK', 'A Block', 'Manufacturing Block A with primary reaction vessels & recovery units', 2800.00, 'manufacturing'),
('SEC-B-BLK', 'B Block', 'Manufacturing Block B synthesis and filtration plant', 3200.00, 'manufacturing'),
('SEC-C-BLK', 'C Block', 'C Block fine chemicals purification line', 2200.00, 'manufacturing'),
('SEC-D-BLK', 'D Block', 'D Block intermediate processing unit', 1900.00, 'manufacturing'),
('SEC-EG-BLK', 'E & G', 'E & G combined production and solvent recovery unit', 2500.00, 'manufacturing'),
('SEC-QC', 'QC', 'Quality Control laboratories, HVAC & instrumentation', 850.00, 'qa_rd'),
('SEC-RM-STR', 'RM Store', 'Raw Material storage warehouse, cooling & ventilation', 600.00, 'storage'),
('SEC-F-BLK', 'F Block', 'F Block active pharmaceutical ingredients line', 2100.00, 'manufacturing'),
('SEC-COMP-1', 'Compressor No. 1', 'Heavy utility reciprocating compressor unit 1', 1400.00, 'utilities'),
('SEC-COMP-2', 'Compressor No. 2', 'Heavy utility reciprocating compressor unit 2', 1400.00, 'utilities'),
('SEC-CT-PNL', 'CT Panel', 'Cooling Tower circulation pump panel & fan bank', 1750.00, 'utilities'),
('SEC-60TR-C3', '60TR Compressor No. 3', '60 Ton Refrigeration Chilling Plant Compressor', 1600.00, 'utilities'),
('SEC-SCREW-C4', 'Screw Compressor No. 4', 'High-efficiency screw chiller unit 4', 1800.00, 'utilities'),
('SEC-AIR-COMP', 'Air Compressor', 'Instrument air compressor station (Atlas Copco / ELGi)', 1100.00, 'utilities'),
('SEC-AIR-JET', 'Air Jet', 'Pneumatic air jet milling and micronizing system', 950.00, 'utilities'),
('SEC-BOILER', 'Boiler', 'Steam boiler house, feed pumps, ID/FD blowers & water softener', 1350.00, 'utilities'),
('SEC-FAB-SHD', 'Fab Shade', 'Mechanical fabrication, maintenance workshop & welding shed', 450.00, 'general'),
('SEC-MEE', 'MEE', 'Multiple Effect Evaporator (Zero Liquid Discharge plant)', 2600.00, 'utilities'),
('SEC-BIO', 'Biological', 'Biological Effluent Treatment Plant (ETP aeration & clarifier)', 1500.00, 'utilities'),
('SEC-RD', 'R&D', 'Research & Development pilot plant and analytical synthesis', 750.00, 'qa_rd'),
('SEC-FIRE-HYD', 'Fire Hydrant', 'Fire hydrant booster pumps, jockey pumps & emergency deluge', 350.00, 'general')
ON CONFLICT (code) DO NOTHING;

-- Seed default initial cost settings
INSERT INTO public.cost_settings (rate_per_kwh, effective_date, demand_charge_per_kva, fixed_monthly_charges, tax_rate_percent, fuel_adjustment_charge_per_kwh, updated_by)
VALUES (8.75, CURRENT_DATE, 475.00, 18500.00, 6.00, 0.42, 'System Initializer');
