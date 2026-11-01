import React, { useMemo } from 'react';
import { Zap, History, IndianRupee, Activity, TrendingUp, TrendingDown } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { calculateBillEstimate, formatINR, formatUnits } from '../../lib/calculations';

export const SummaryCards: React.FC = () => {
  const { readings, costSettings } = useApp();

  const metrics = useMemo(() => {
    // Determine today and yesterday dates based on available readings
    const today = new Date().toISOString().split('T')[0];
    const yestDate = new Date();
    yestDate.setDate(yestDate.getDate() - 1);
    const yesterday = yestDate.toISOString().split('T')[0];

    // Total readings today
    const todayReadings = readings.filter((r) => r.date === today);
    let todayKwh = todayReadings.reduce((sum, r) => sum + r.consumedKwh, 0);

    // If today has no readings yet (e.g. before morning shift reading), pick the latest date in readings
    let effectiveDate = today;
    if (todayReadings.length === 0 && readings.length > 0) {
      // Find the most recent date available in readings
      const sortedDates = Array.from(new Set(readings.map((r) => r.date))).sort().reverse();
      effectiveDate = sortedDates[0];
      const effReadings = readings.filter((r) => r.date === effectiveDate);
      todayKwh = effReadings.reduce((sum, r) => sum + r.consumedKwh, 0);
    }

    // Previous date (yesterday relative to effectiveDate)
    const effDateObj = new Date(effectiveDate);
    effDateObj.setDate(effDateObj.getDate() - 1);
    const prevDateStr = effDateObj.toISOString().split('T')[0];

    const prevReadings = readings.filter((r) => r.date === prevDateStr);
    const yesterdayKwh = prevReadings.reduce((sum, r) => sum + r.consumedKwh, 0);

    // Percentage change
    let changePercent = 0;
    if (yesterdayKwh > 0) {
      changePercent = Number((((todayKwh - yesterdayKwh) / yesterdayKwh) * 100).toFixed(1));
    }

    // Daily Average Load (kW) = Total Energy Consumed in 24 Hours / 24 Hours
    const dailyAvgLoadKw = Number((todayKwh / 24).toFixed(1));

    // Peak Contract Demand today
    const peakDemandKva = Math.max(
      ...readings.filter((r) => r.date === effectiveDate).map((r) => r.calculatedDemand || 0),
      450
    );

    // Estimated electricity bill for today's consumption
    const billEstimate = calculateBillEstimate(todayKwh, peakDemandKva, costSettings, 1);

    // Monthly projection estimate (prorated)
    const monthlyProjectedKwh = todayKwh * 30;
    const monthlyBillEstimate = calculateBillEstimate(monthlyProjectedKwh, peakDemandKva, costSettings, 30);

    return {
      effectiveDate,
      prevDateStr,
      todayKwh,
      yesterdayKwh,
      changePercent,
      dailyAvgLoadKw,
      peakDemandKva,
      todayBill: billEstimate.totalBill,
      monthlyBill: monthlyBillEstimate.totalBill,
      effectiveRate: billEstimate.effectiveRate,
    };
  }, [readings, costSettings]);

  const cards = [
    {
      title: "Today's Total Electricity Consumption",
      subtitle: `All 21 sections combined (${metrics.effectiveDate})`,
      value: `${formatUnits(metrics.todayKwh)} kWh`,
      icon: Zap,
      accent: 'from-amber-500/20 to-amber-600/5 text-amber-400 border-amber-500/30',
      iconBg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      extra: (
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <span>Active Feeders: </span>
          <span className="text-slate-200 font-semibold">21 Sections (23 Meters)</span>
        </div>
      ),
    },
    {
      title: "Yesterday's Total Electricity Consumption",
      subtitle: `Recorded on ${metrics.prevDateStr}`,
      value: `${formatUnits(metrics.yesterdayKwh)} kWh`,
      icon: History,
      accent: 'from-blue-500/20 to-blue-600/5 text-blue-400 border-blue-500/30',
      iconBg: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      extra: (
        <div className="flex items-center gap-1.5 text-xs">
          {metrics.changePercent > 0 ? (
            <span className="flex items-center gap-1 text-red-400 font-medium">
              <TrendingUp className="w-3.5 h-3.5" /> +{metrics.changePercent}% vs yesterday
            </span>
          ) : (
            <span className="flex items-center gap-1 text-emerald-400 font-medium">
              <TrendingDown className="w-3.5 h-3.5" /> {metrics.changePercent}% vs yesterday
            </span>
          )}
        </div>
      ),
    },
    {
      title: 'Estimated Electricity Bill',
      subtitle: `Tariff: ₹${costSettings.ratePerKwh}/kWh + Demand & Tax`,
      value: formatINR(metrics.todayBill),
      icon: IndianRupee,
      accent: 'from-emerald-500/20 to-emerald-600/5 text-emerald-400 border-emerald-500/30',
      iconBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      extra: (
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>30-Day Projected:</span>
          <span className="text-emerald-300 font-semibold font-mono">
            {formatINR(metrics.monthlyBill)}
          </span>
        </div>
      ),
    },
    {
      title: 'Daily Average Load',
      subtitle: 'Average connected industrial active load',
      value: `${formatUnits(metrics.dailyAvgLoadKw)} kW`,
      icon: Activity,
      accent: 'from-cyan-500/20 to-cyan-600/5 text-cyan-400 border-cyan-500/30',
      iconBg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
      extra: (
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>Peak Demand:</span>
          <span className="text-cyan-300 font-semibold font-mono">
            {metrics.peakDemandKva} kVA
          </span>
        </div>
      ),
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className={`relative overflow-hidden rounded-2xl bg-gradient-to-br bg-slate-900 border p-5 shadow-lg shadow-black/20 transition-all duration-200 hover:border-slate-600 ${card.accent}`}
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                  {card.title}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">{card.subtitle}</p>
              </div>
              <div className={`p-2.5 rounded-xl border shrink-0 ${card.iconBg}`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>

            <div className="text-2xl lg:text-3xl font-bold font-mono tracking-tight text-white mb-3">
              {card.value}
            </div>

            <div className="pt-2 border-t border-slate-800/80">{card.extra}</div>
          </div>
        );
      })}
    </div>
  );
};
