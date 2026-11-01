# SMRUTHI ORGANICS LIMITED – ELECTRICAL DEPARTMENT
## Industrial Electrical Energy Monitoring System

A production-ready, lightweight, and robust industrial full-stack energy management platform architected for **Smruthi Organics Limited – Electrical Department**.

Engineered using **React 18 + TypeScript + Vite + Tailwind CSS + Node.js Express Backend + MongoDB Atlas + Render Free Tier (₹0 Cost)**.

---

### 1. Full-Stack Architecture (₹0 Free Tier)

| Component | Technology | Free Tier Allocation | Cost |
| :--- | :--- | :--- | :--- |
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Recharts | Built & served by Node.js backend | ₹0 |
| **Backend API** | Node.js, Express 5, TypeScript | Free Render Web Service (750 free hrs/mo) | ₹0 |
| **Database** | MongoDB Atlas (M0 Free Cluster) | 512 MB permanent document storage, daily backups | ₹0 |
| **Hosting** | Render.com Free Tier | Monorepo deployment with automated CI/CD from GitHub | ₹0 |
| **Export Engine** | SheetJS (XLSX) & Native CSV | Zero paid cloud functions | ₹0 |

---

### 2. The 21 Plant Sections & Meters

The database schema initializes all 21 industrial sections:

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

---

### 3. Electrical Calculations Engine

#### 1. Active Energy Units
$$\text{Units (kWh)} = (\text{Current Reading} - \text{Previous Reading}) \times \text{MF}$$

#### 2. Power Factor (PF)
$$\text{PF} = \frac{\Delta\text{KWH}}{\Delta\text{KVAH}}$$
*(Safely handles zero/missing entries, clamps to industrial 0.0 - 1.0 range)*

#### 3. Contract Demand
$$\text{Contract Demand (kVA)} = (\text{Current} - \text{Previous}) \times \text{Contract Demand MF}$$

#### 4. Step-Down Transformer Loss Calculations
1. **750 KVA Transformer Units**: $(\text{Current} - \text{Previous}) \times \text{MF}$
2. **950 KVA Transformer Units**: $(\text{Current} - \text{Previous}) \times \text{MF}$
3. **Total Transformer Output**: $\text{750 KVA Units} + \text{950 KVA Units}$
4. **Transformer Losses**: $\text{Main Plant KWH Units} - \text{Total Transformer Output}$
5. **Loss Percentage**: $\left(\frac{\text{Transformer Losses}}{\text{Main Plant KWH Units}}\right) \times 100\%$

#### 5. Estimated Dynamic Electricity Bill
$$\text{Total Bill} = (\text{Units} \times \text{Rate}) + (\text{Demand} \times \text{Demand Rate}) + \text{Fixed Charges} + (\text{Units} \times \text{FAC}) + \text{Tax/Duty}$$

---

### 4. Production Deployment on Render + MongoDB Atlas

#### Step 1: Create Free MongoDB Atlas Database
1. Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas) and register a free account.
2. Create an **M0 Free Cluster** (Shared).
3. Under **Security → Database Access**: Create a username and password (e.g. `smruthi_admin`).
4. Under **Security → Network Access**: Add IP `0.0.0.0/0` (Allow from anywhere).
5. Click **Connect → Drivers** and copy your MongoDB connection URI:
   ```
   mongodb+srv://<username>:<password>@cluster0.mongodb.net/smruthi_energy?retryWrites=true&w=majority
   ```

#### Step 2: Deploy to Render.com (₹0 Web Service)
1. Sign in to [render.com](https://render.com) with GitHub.
2. Click **New +** → **Web Service**.
3. Select your repository: `pawartejas1707-cloud/smruthi-energy`.
4. Render will detect the configuration automatically or set:
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`
5. In **Environment Variables**, add:
   - `MONGODB_URI`: *(your MongoDB Atlas URI from Step 1)*
   - `NODE_ENV`: `production`
6. Click **Deploy Web Service**.

Render will build both the frontend and backend, connect to MongoDB Atlas, automatically seed the 21 sections, and serve the application on a free HTTPS URL!

---

### 5. Local Development Commands

```bash
# 1. Install all dependencies (frontend + backend)
npm install

# 2. Start the Express + MongoDB backend (hot reloading)
npm run dev:server

# 3. Start the Vite React development server
npm run dev

# 4. Build both frontend and backend for production
npm run build

# 5. Start production server locally (serves both API & Frontend on http://localhost:5000)
npm start
```
