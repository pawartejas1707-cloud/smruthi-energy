import React, { useMemo } from 'react';
import { Zap, History, Activity, ShieldCheck, TrendingUp, TrendingDown } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatUnits } from '../../lib/calculations';

export const PlantAdminSummaryCards: React.FC = () => {
  const { readings } = useApp();

  const metrics = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const yestDate = new Date();
    yestDate.setDate(yestDate.getDate() - 1);
    const yesterday = yestDate.toISOString().split('T')[0];

    const todayReadings = readings.filter((r) => r.date === today);
    let todayKwh = todayReadings.reduce((sum, r) => sum + r.consumedKwh, 0);

    let effectiveDate = today;
    if (todayReadings.length === 0 && readings.length > 0) {
      const sortedDates = Array.from(new Set(readings.map((r) => r.date))).sort().reverse();
      effectiveDate = sortedDates[0];
      const effReadings = readings.filter((r) => r.date === effectiveDate);
      todayKwh = effReadings.reduce((sum, r) => sum + r.consumedKwh, 0);
    }

    const effDateObj = new Date(effectiveDate);
    effDateObj.setDate(effDateObj.getDate() - 1);
    const prevDateStr = effDateObj.toISOString().split('T')[0];

    const prevReadings = readings.filter((r) => r.date === prevDateStr);
    const yesterdayKwh = prevReadings.reduce((sum, r) => sum + r.consumedKwh, 0);

    let changePercent = 0;
    if (yesterdayKwh > 0) {
      changePercent = Number((((todayKwh - yesterdayKwh) / yesterdayKwh) * 100).toFixed(1));
    }

    // Daily Average Load (kW) = Total Energy in 24h / 24h
    const dailyAvgLoadKw = Number((todayKwh / 24).toFixed(1));

    // Peak Demand in kVA today
    const peakDemandKva = Math.max(
      ...readings.filter((r) => r.date === effectiveDate).map((r) => r.calculatedDemand || 0),
      450
    );

    const contractDemandTotal = 1200; // Contract demand kVA
    const demandUtilization = Number(((peakDemandKva / contractDemandTotal) * 100).toFixed(1));

    return {
      effectiveDate,
      prevDateStr,
      todayKwh,
      yesterdayKwh,
      changePercent,
      dailyAvgLoadKw,
      peakDemandKva,
      contractDemandTotal,
      demandUtilization,
    };
  }, [readings]);

  const cards = [
    {
      title: "Today's Total Electricity Consumption",
      subtitle: `All 21 sections combined (${metrics.effectiveDate})`,
      value: `${formatUnits(metrics.todayKwh)} kWh`,
      icon: Zap,
      iconBg: 'bg-amber-100 text-amber-700 border-amber-200',
      borderAccent: 'border-l-4 border-l-amber-500',
      extra: (
        <div className="flex items-center justify-between text-xs text-slate-600 font-medium">
          <span>Active Feeders:</span>
          <span className="font-bold text-slate-900">21 Sections (23 Meters)</span>
        </div>
      ),
    },
    {
      title: "Yesterday's Total Electricity Consumption",
      subtitle: `Recorded on ${metrics.prevDateStr}`,
      value: `${formatUnits(metrics.yesterdayKwh)} kWh`,
      icon: History,
      iconBg: 'bg-blue-100 text-blue-700 border-blue-200',
      borderAccent: 'border-l-4 border-l-blue-500',
      extra: (
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-600 font-medium">Day-on-Day Variance:</span>
          {metrics.changePercent > 0 ? (
            <span className="inline-flex items-center gap-1 font-bold text-red-600">
              <TrendingUp className="w-3.5 h-3.5" /> +{metrics.changePercent}%
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 font-bold text-emerald-600">
              <TrendingDown className="w-3.5 h-3.5" /> {metrics.changePercent}%
            </span>
          )}
        </div>
      ),
    },
    {
      title: 'Daily Average Connected Load',
      subtitle: '24-hour continuous active load',
      value: `${formatUnits(metrics.dailyAvgLoadKw)} kW`,
      icon: Activity,
      iconBg: 'bg-indigo-100 text-indigo-700 border-indigo-200',
      borderAccent: 'border-l-4 border-l-indigo-500',
      extra: (
        <div className="flex items-center justify-between text-xs text-slate-600 font-medium">
          <span>Plant Load Status:</span>
          <span className="inline-flex items-center gap-1 font-bold text-indigo-700">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            Normal Industrial Load
          </span>
        </div>
      ),
    },
    {
      title: 'Peak Contract Demand',
      subtitle: `Contract Limit: ${metrics.contractDemandTotal} kVA`,
      value: `${metrics.peakDemandKva} kVA`,
      icon: ShieldCheck,
      iconBg: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      borderAccent: 'border-l-4 border-l-emerald-500',
      extra: (
        <div className="flex items-center justify-between text-xs text-slate-600 font-medium">
          <span>Demand Utilization:</span>
          <span className="font-bold text-emerald-700 font-mono">
            {metrics.demandUtilization}% of 1,200 kVA
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
            className={`rounded-2xl bg-white border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all duration-200 ${card.borderAccent}`}
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  {card.title}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">{card.subtitle}</p>
              </div>
              <div className={`p-2.5 rounded-xl border shrink-0 ${card.iconBg}`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>

            <div className="text-2xl lg:text-3xl font-extrabold font-mono tracking-tight text-slate-900 mb-3">
              {card.value}
            </div>

            <div className="pt-2.5 border-t border-slate-100">{card.extra}</div>
          </div>
        );
      })}
    </div>
  );
};
