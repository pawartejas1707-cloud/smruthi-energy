# SMRUTHI ORGANICS LIMITED – ELECTRICAL DEPARTMENT
## Industrial Electrical Energy Monitoring & Substation Management System

A production-ready, lightweight, and accurate Industrial Electrical Energy Monitoring System designed specifically for the Electrical Department of **Smruthi Organics Limited**.

Built with **React + TypeScript + Vite + Tailwind CSS + Recharts + Supabase PostgreSQL** with an initial hosting & database cost of **₹0**.

---

### 1. Technology & Free Tier Architecture (₹0 Cost)

| Layer | Technology | Free Tier Allocation | Cost |
| :--- | :--- | :--- | :--- |
| **Frontend** | React 18 / TypeScript / Vite | Unlimited builds | ₹0 |
| **Styling** | Tailwind CSS (Industrial Dark Theme) | Integrated asset compiler | ₹0 |
| **Database** | Supabase PostgreSQL | 500 MB database, 50k MAU, SSL encrypted | ₹0 |
| **Security** | Supabase Row Level Security (RLS) | Database-level table access policies | ₹0 |
| **Charts** | Recharts Financial/Industrial Trends | Responsive share-market charts | ₹0 |
| **Hosting** | Vercel Free Plan | 100 GB bandwidth, Global Edge CDN, SSL | ₹0 |
| **Export** | SheetJS (XLSX) & Native CSV | Zero paid server dependencies | ₹0 |

---

### 2. Department Sections (All 21 Industrial Sections)

The system is configured with all 21 physical plant sections:

1. **A Block** (*MTR-A1 Feeder Main Meter & MTR-A2 Aux Meter*)
2. **B Block** (*MTR-B1 Reaction Meter & MTR-B2 Utilities Meter*)
3. **C Block** (*MTR-C1 Master Meter*)
4. **D Block** (*MTR-D1 MCC Incomer*)
5. **E & G** (*MTR-EG1 Combined Panel Meter*)
6. **QC** (*MTR-QC1 Laboratory Meter*)
7. **RM Store** (*MTR-RM1 Warehouse Feeder*)
8. **F Block** (*MTR-F1 API Line Meter*)
9. **Compressor No. 1** (*MTR-CMP1 Motor Incomer*)
10. **Compressor No. 2** (*MTR-CMP2 Motor Incomer*)
11. **CT Panel** (*MTR-CT1 Cooling Tower MCC*)
12. **60TR Compressor No. 3** (*MTR-60TR Chilling Plant*)
13. **Screw Compressor No. 4** (*MTR-SC4 Screw Chiller*)
14. **Air Compressor** (*MTR-ACMP Instrument Air*)
15. **Air Jet** (*MTR-AJ1 Micronizer Panel*)
16. **Boiler** (*MTR-BLR Steam House Feeder*)
17. **Fab Shade** (*MTR-FAB Workshop Shed*)
18. **MEE** (*MTR-MEE Multiple Effect Evaporator*)
19. **Biological** (*MTR-BIO ETP Treatment Plant*)
20. **R&D** (*MTR-RD Pilot Plant Feeder*)
21. **Fire Hydrant** (*MTR-FHYD Emergency Pump House*)

Electrical Admin can add new submeters or reconfigure multiplying factors (MF) dynamically.

---

### 3. Automatic Electrical Calculations

#### 1. Energy Consumption
$$\text{Units (kWh)} = (\text{Current Reading} - \text{Previous Reading}) \times \text{MF}$$

#### 2. Power Factor (PF)
$$\text{PF} = \frac{\Delta\text{KWH}}{\Delta\text{KVAH}}$$
- Automatically handled for zero/missing entries.
- High efficiency indicator ($\ge 0.95$) vs. low PF warning.

#### 3. Contract Demand
$$\text{Contract Demand (kVA)} = (\text{Current} - \text{Previous}) \times \text{Contract Demand MF}$$

#### 4. Step-Down Transformer Loss Calculation
1. **750 KVA Transformer Units**: $(\text{Current} - \text{Previous}) \times \text{MF}$
2. **950 KVA Transformer Units**: $(\text{Current} - \text{Previous}) \times \text{MF}$
3. **Total Transformer Output**: $\text{750 KVA Units} + \text{950 KVA Units}$
4. **Transformer Losses**: $\text{Main Plant KWH Units} - \text{Total Transformer Output}$
5. **Loss Percentage**: $\left(\frac{\text{Transformer Losses}}{\text{Main Plant KWH Units}}\right) \times 100\%$

#### 5. Estimated Electricity Bill
$$\text{Bill} = (\text{Units} \times \text{Rate/kWh}) + (\text{Demand} \times \text{Demand Rate}) + \text{Fixed Charges} + (\text{Units} \times \text{FAC}) + \text{Duty/Tax}$$

---

### 4. Four User Roles & Permission Model

| User Role | Dashboard & Graphs | Meter Reading Entry | Configure Limits / MFs / Tariffs | Limit Exceeded Enquiries |
| :--- | :---: | :---: | :---: | :---: |
| **Plant Admin** | Full View | Disabled | Disabled | Dispatch Direct Email Enquiries |
| **Electrical Admin** | Full View | Add / Edit | Full Configuration Rights | Full Access & Respond to Enquiries |
| **Reading Operator** | Full View | Enter Daily Logs | Disabled | View Alerts |
| **Viewer** | View Only | Disabled | Disabled | View Only |

*Use the quick role switcher in the top navigation bar to test and verify permission boundaries.*

---

### 5. Production Deployment Instructions (Free Plan)

#### Step 1: Deploy Supabase PostgreSQL Database (₹0)
1. Sign up on [supabase.com](https://supabase.com).
2. Create a new project: `smruthi-energy`.
3. Go to the **SQL Editor** in Supabase.
4. Copy the entire contents of [`supabase/schema.sql`](supabase/schema.sql) and click **Run**.
5. Copy your **Project URL** and **Anon API Key** from `Project Settings -> API`.

#### Step 2: Configure Environment Variables
Create a `.env.local` file in the project root:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
*(You can also click the "Supabase Setup (₹0)" button directly in the web UI header to connect interactively).*

#### Step 3: Deploy to Vercel (₹0)
1. Push this project to GitHub.
2. Sign in to [vercel.com](https://vercel.com) and click **Add New Project**.
3. Import your GitHub repository.
4. Add the `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` environment variables.
5. Click **Deploy**. Your industrial energy portal is live on a secure HTTPS address!

---

### 6. Local Development

```bash
# Install dependencies
npm install

# Start local development server
npm run dev

# Run production build & typecheck
npm run build

# Preview production build locally
npm run preview
```
