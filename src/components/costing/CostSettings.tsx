import React, { useState } from 'react';
import {
  IndianRupee,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  HelpCircle,
  ShieldAlert,
  Calculator,
  Save,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { calculateBillEstimate, formatINR, formatUnits } from '../../lib/calculations';

export const CostSettingsView: React.FC = () => {
  const { costSettings, updateCostSettings, currentRole } = useApp();

  const isElectricalAdmin = currentRole === 'electrical_admin';

  // Form states
  const [ratePerKwh, setRatePerKwh] = useState<number>(costSettings.ratePerKwh);
  const [effectiveDate, setEffectiveDate] = useState<string>(costSettings.effectiveDate);
  const [demandChargePerKva, setDemandChargePerKva] = useState<number>(costSettings.demandChargePerKva);
  const [fixedMonthlyCharges, setFixedMonthlyCharges] = useState<number>(costSettings.fixedMonthlyCharges);
  const [taxRatePercent, setTaxRatePercent] = useState<number>(costSettings.taxRatePercent);
  const [fuelAdjustmentChargePerKwh, setFuelAdjustmentChargePerKwh] = useState<number>(
    costSettings.fuelAdjustmentChargePerKwh
  );

  const [isSaved, setIsSaved] = useState(false);

  // Bill Simulator
  const [simUnits, setSimUnits] = useState<number>(25000);
  const [simDemandKva, setSimDemandKva] = useState<number>(450);

  const simEstimate = calculateBillEstimate(
    simUnits,
    simDemandKva,
    {
      ...costSettings,
      ratePerKwh,
      demandChargePerKva,
      fixedMonthlyCharges,
      taxRatePercent,
      fuelAdjustmentChargePerKwh,
    },
    1
  );

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isElectricalAdmin) return;

    await updateCostSettings({
      ratePerKwh,
      effectiveDate,
      demandChargePerKva,
      fixedMonthlyCharges,
      taxRatePercent,
      fuelAdjustmentChargePerKwh,
    });

    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <IndianRupee className="w-5 h-5 text-emerald-400" />
            Electricity Cost Settings & HT Tariff Configuration
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Tariffs are dynamically applied to all consumption calculations and estimated bills. Never hardcoded.
          </p>
        </div>

        {!isElectricalAdmin && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-300">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <span>Tariff modification restricted to Electrical Admin</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tariff Settings Form (2 Cols) */}
        <div className="lg:col-span-2 rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-xl">
          <form onSubmit={handleSave} className="space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white">HT Industrial Tariff Parameters</h3>
              <span className="text-[11px] text-slate-400 font-mono">
                Last updated by: {costSettings.updatedBy}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Rate per Unit */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Electricity Rate per Unit (₹/kWh):
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-xs font-bold">
                    ₹
                  </span>
                  <input
                    type="number"
                    step="0.05"
                    required
                    value={ratePerKwh}
                    onChange={(e) => setRatePerKwh(parseFloat(e.target.value) || 0)}
                    disabled={!isElectricalAdmin}
                    className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm font-bold font-mono text-emerald-400 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Base HT energy charge per kWh consumed
                </span>
              </div>

              {/* Effective Date */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Effective Date of Tariff:
                </label>
                <div className="relative">
                  <input
                    type="date"
                    required
                    value={effectiveDate}
                    onChange={(e) => setEffectiveDate(e.target.value)}
                    disabled={!isElectricalAdmin}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Date from which this tariff schedule applies
                </span>
              </div>

              {/* Demand Charge per kVA */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Demand Charge Rate (₹/kVA):
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-xs font-bold">
                    ₹
                  </span>
                  <input
                    type="number"
                    step="1"
                    required
                    value={demandChargePerKva}
                    onChange={(e) => setDemandChargePerKva(parseFloat(e.target.value) || 0)}
                    disabled={!isElectricalAdmin}
                    className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Monthly billing demand charge per recorded kVA
                </span>
              </div>

              {/* Fixed Monthly Charges */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Fixed Monthly Charges (₹):
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-xs font-bold">
                    ₹
                  </span>
                  <input
                    type="number"
                    step="100"
                    required
                    value={fixedMonthlyCharges}
                    onChange={(e) => setFixedMonthlyCharges(parseFloat(e.target.value) || 0)}
                    disabled={!isElectricalAdmin}
                    className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Fixed monthly utility meter & connection fee
                </span>
              </div>

              {/* Electricity Duty / Tax % */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Electricity Duty / Tax (%):
                </label>
                <input
                  type="number"
                  step="0.5"
                  required
                  value={taxRatePercent}
                  onChange={(e) => setTaxRatePercent(parseFloat(e.target.value) || 0)}
                  disabled={!isElectricalAdmin}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Government statutory electricity tax / duty percentage
                </span>
              </div>

              {/* Fuel Adjustment Charge (FAC) per unit */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Fuel Adjustment Charge (FAC ₹/kWh):
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={fuelAdjustmentChargePerKwh}
                  onChange={(e) => setFuelAdjustmentChargePerKwh(parseFloat(e.target.value) || 0)}
                  disabled={!isElectricalAdmin}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Monthly DISCOM FAC surcharge per unit
                </span>
              </div>
            </div>

            {/* Save Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              <div>
                {isSaved && (
                  <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold">
                    <CheckCircle2 className="w-4 h-4" /> Tariffs Updated Successfully!
                  </span>
                )}
              </div>

              {isElectricalAdmin && (
                <button
                  type="submit"
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-950/40 transition-all"
                >
                  <Save className="w-4 h-4" />
                  Save Cost Settings
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Live Calculation Simulator (1 Col) */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <Calculator className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white">Live Tariff Simulator</h3>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs text-slate-400 block mb-1">
                Sample Units Consumed (kWh):
              </label>
              <input
                type="number"
                step="500"
                value={simUnits}
                onChange={(e) => setSimUnits(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-mono text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">
                Sample Peak Demand (kVA):
              </label>
              <input
                type="number"
                step="10"
                value={simDemandKva}
                onChange={(e) => setSimDemandKva(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-mono text-white focus:outline-none"
              />
            </div>
          </div>

          {/* Breakdown */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs font-mono">
            <div className="flex items-center justify-between text-slate-400">
              <span>Energy Charges:</span>
              <span className="text-white">{formatINR(simEstimate.energyCharges)}</span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>Demand Charges:</span>
              <span className="text-white">{formatINR(simEstimate.demandCharges)}</span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>FAC Surcharge:</span>
              <span className="text-white">{formatINR(simEstimate.fuelAdjustmentCharges)}</span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>Duty / Tax ({taxRatePercent}%):</span>
              <span className="text-white">{formatINR(simEstimate.taxAmount)}</span>
            </div>

            <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
              <span className="text-slate-300 font-bold">Estimated Bill:</span>
              <span className="text-lg font-bold text-emerald-400">
                {formatINR(simEstimate.totalBill)}
              </span>
            </div>

            <div className="text-[10px] text-slate-400 pt-1 text-right">
              Effective Real Cost: ₹{simEstimate.effectiveRate}/kWh
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
