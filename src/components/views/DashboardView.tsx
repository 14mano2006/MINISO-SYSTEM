import React, { useState, useMemo } from 'react';
import { Product, SystemTelemetry } from '../../types/retail';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';

interface DashboardViewProps {
  products: Product[];
  onOpenPos: () => void;
  onNavigateTab: (tab: string) => void;
  onOpenStreamlit?: () => void;
  telemetry: SystemTelemetry;
  addToast?: (message: string, type?: 'success' | 'warning' | 'info') => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  products,
  onOpenPos,
  onNavigateTab,
  onOpenStreamlit,
  telemetry,
  addToast,
}) => {
  const [timeRange, setTimeRange] = useState<'today' | '7d' | '30d'>('today');
  const [metricMode, setMetricMode] = useState<'revenue' | 'units'>('revenue');
  const [chartType, setChartType] = useState<'area' | 'bar'>('area');
  const [dailyTarget, setDailyTarget] = useState<number>(420);
  const [reorderedItems, setReorderedItems] = useState<Record<string, boolean>>({});
  const [showAiModal, setShowAiModal] = useState(false);

  // Intraday Hourly Volume & Revenue: Today vs Yesterday vs Target
  const hourlyData = [
    { slot: '10:00 AM', currentRevenue: 7000, previousRevenue: 6000, currentUnits: 28, previousUnits: 24, targetUnits: 21, targetRevenue: 5250 },
    { slot: '12:00 PM', currentRevenue: 13000, previousRevenue: 11500, currentUnits: 52, previousUnits: 46, targetUnits: 42, targetRevenue: 10500 },
    { slot: '02:00 PM', currentRevenue: 16000, previousRevenue: 14500, currentUnits: 64, previousUnits: 58, targetUnits: 50, targetRevenue: 12500 },
    { slot: '04:00 PM', currentRevenue: 19500, previousRevenue: 18000, currentUnits: 78, previousUnits: 72, targetUnits: 63, targetRevenue: 15750 },
    { slot: '06:00 PM', currentRevenue: 27000, previousRevenue: 23750, currentUnits: 108, previousUnits: 95, targetUnits: 92, targetRevenue: 23000 },
    { slot: '08:00 PM', currentRevenue: 31250, previousRevenue: 29500, currentUnits: 125, previousUnits: 118, targetUnits: 101, targetRevenue: 25250 },
    { slot: '10:00 PM', currentRevenue: 17500, previousRevenue: 16250, currentUnits: 70, previousUnits: 65, targetUnits: 51, targetRevenue: 12750 },
  ];

  // 7-Day Performance: Current Week vs Prior Week Same Day
  const sevenDayData = [
    { slot: 'Mon 18', currentRevenue: 95000, previousRevenue: 85000, currentUnits: 380, previousUnits: 340, targetUnits: dailyTarget, targetRevenue: dailyTarget * 250 },
    { slot: 'Tue 19', currentRevenue: 102500, previousRevenue: 91250, currentUnits: 410, previousUnits: 365, targetUnits: dailyTarget, targetRevenue: dailyTarget * 250 },
    { slot: 'Wed 20', currentRevenue: 98750, previousRevenue: 87500, currentUnits: 395, previousUnits: 350, targetUnits: dailyTarget, targetRevenue: dailyTarget * 250 },
    { slot: 'Thu 21', currentRevenue: 108750, previousRevenue: 95000, currentUnits: 435, previousUnits: 380, targetUnits: dailyTarget, targetRevenue: dailyTarget * 250 },
    { slot: 'Fri 22', currentRevenue: 121250, previousRevenue: 105000, currentUnits: 485, previousUnits: 420, targetUnits: dailyTarget, targetRevenue: dailyTarget * 250 },
    { slot: 'Sat 23', currentRevenue: 140000, previousRevenue: 122500, currentUnits: 560, previousUnits: 490, targetUnits: Math.round(dailyTarget * 1.15), targetRevenue: Math.round(dailyTarget * 1.15 * 250) },
    { slot: 'Today (Sun)', currentRevenue: 131250, previousRevenue: 115000, currentUnits: 525, previousUnits: 460, targetUnits: dailyTarget, targetRevenue: dailyTarget * 250 },
  ];

  // 30-Day Velocity Trajectory with Preceding Month Baseline
  const thirtyDayData = [
    { slot: 'Oct 01', currentRevenue: 78000, previousRevenue: 71000, currentUnits: 310, previousUnits: 285, targetUnits: dailyTarget, targetRevenue: dailyTarget * 250 },
    { slot: 'Oct 04', currentRevenue: 84000, previousRevenue: 76000, currentUnits: 335, previousUnits: 305, targetUnits: dailyTarget, targetRevenue: dailyTarget * 250 },
    { slot: 'Oct 07', currentRevenue: 92000, previousRevenue: 82000, currentUnits: 370, previousUnits: 330, targetUnits: dailyTarget, targetRevenue: dailyTarget * 250 },
    { slot: 'Oct 10', currentRevenue: 95000, previousRevenue: 86000, currentUnits: 380, previousUnits: 345, targetUnits: dailyTarget, targetRevenue: dailyTarget * 250 },
    { slot: 'Oct 13', currentRevenue: 88000, previousRevenue: 80000, currentUnits: 350, previousUnits: 320, targetUnits: dailyTarget, targetRevenue: dailyTarget * 250 },
    { slot: 'Oct 16', currentRevenue: 124000, previousRevenue: 110000, currentUnits: 495, previousUnits: 440, targetUnits: Math.round(dailyTarget * 1.15), targetRevenue: Math.round(dailyTarget * 1.15 * 250) },
    { slot: 'Oct 19', currentRevenue: 102500, previousRevenue: 91250, currentUnits: 410, previousUnits: 365, targetUnits: dailyTarget, targetRevenue: dailyTarget * 250 },
    { slot: 'Oct 21', currentRevenue: 108750, previousRevenue: 95000, currentUnits: 435, previousUnits: 380, targetUnits: dailyTarget, targetRevenue: dailyTarget * 250 },
    { slot: 'Oct 23', currentRevenue: 140000, previousRevenue: 122500, currentUnits: 560, previousUnits: 490, targetUnits: Math.round(dailyTarget * 1.15), targetRevenue: Math.round(dailyTarget * 1.15 * 250) },
    { slot: 'Today', currentRevenue: 131250, previousRevenue: 115000, currentUnits: 525, previousUnits: 460, targetUnits: dailyTarget, targetRevenue: dailyTarget * 250 },
  ];

  // Dynamic Chart Data mapping based on active metric
  const chartData = useMemo(() => {
    const raw = timeRange === 'today' ? hourlyData : timeRange === '7d' ? sevenDayData : thirtyDayData;
    return raw.map((item) => ({
      slot: item.slot,
      current: metricMode === 'revenue' ? item.currentRevenue : item.currentUnits,
      previous: metricMode === 'revenue' ? item.previousRevenue : item.previousUnits,
      target: metricMode === 'revenue' ? item.targetRevenue : item.targetUnits,
      currentRevenue: item.currentRevenue,
      previousRevenue: item.previousRevenue,
      currentUnits: item.currentUnits,
      previousUnits: item.previousUnits,
      targetUnits: item.targetUnits,
      targetRevenue: item.targetRevenue,
    }));
  }, [timeRange, metricMode, dailyTarget]);

  // Aggregate metrics
  const todayActualUnits = hourlyData.reduce((acc, d) => acc + d.currentUnits, 0); // 525 units
  const yesterdayActualUnits = hourlyData.reduce((acc, d) => acc + d.previousUnits, 0); // 478 units
  const todayRevenue = hourlyData.reduce((acc, d) => acc + d.currentRevenue, 0); // ₹1,31,250
  const yesterdayRevenue = hourlyData.reduce((acc, d) => acc + d.previousRevenue, 0); // ₹1,19,500
  const dayOverDayGrowth = Number((((todayActualUnits - yesterdayActualUnits) / yesterdayActualUnits) * 100).toFixed(1)); // +9.8%
  const achievementPct = Math.round((todayActualUnits / dailyTarget) * 100);
  const varianceUnits = todayActualUnits - dailyTarget;
  const isAhead = varianceUnits >= 0;

  const handleQuickReorder = (itemId: string) => {
    setReorderedItems((prev) => ({ ...prev, [itemId]: true }));
    if (addToast) addToast(`PO dispatched for ${itemId} to Central Warehouse (+50 units)`, 'success');
    setTimeout(() => {
      setReorderedItems((prev) => ({ ...prev, [itemId]: false }));
    }, 3500);
  };

  const lowStockAlerts = [
    { id: 'low-1', name: 'Sanrio Plush Toy (Kuromi)', current: 8, min: 30, reorderQty: 60 },
    { id: 'low-2', name: 'Pastel Thermal Bottle 450ml', current: 5, min: 25, reorderQty: 40 },
    { id: 'low-3', name: 'Cute Kitty Nail Polish Set', current: 3, min: 20, reorderQty: 50 },
    { id: 'low-4', name: 'Kawaii Highlighters Pack', current: 11, min: 40, reorderQty: 80 },
  ];

  return (
    <div className="flex flex-col w-full pb-10">
      {/* Top Command & Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center justify-center w-2 h-2 rounded-full bg-[#006947] animate-ping"></span>
            <span className="text-xs text-[#006947] uppercase tracking-widest font-bold">
              Store Ops Telemetry • {telemetry.node}
            </span>
          </div>
          <h1 className="text-2xl lg:text-3xl text-[#1a1c1b] font-bold tracking-tight leading-tight">
            Store Operations &amp; Intelligence Overview
          </h1>
          <p className="text-sm text-[#5e5e65] mt-0.5">
            Phoenix Mall Flagship • Real-time retail telemetry synced with Java backend
          </p>
        </div>
        <div className="flex items-center gap-2.5 self-start md:self-auto flex-wrap">
          <button
            type="button"
            onClick={() => {
              if (addToast) addToast('Telemetry & inventory synced with Phoenix Mall node', 'info');
            }}
            className="inline-flex items-center gap-1.5 bg-white text-[#1a1c1b] hover:bg-[#f4f3f1] text-sm font-semibold px-4 py-2.5 rounded-lg shadow-xs border border-[#efeeec] transition-all"
          >
            <span className="material-symbols-outlined text-[18px] text-[#006947]">sync</span>
            <span>Sync Live Telemetry</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigateTab('reports')}
            className="inline-flex items-center gap-1.5 bg-white text-[#1a1c1b] hover:bg-[#f4f3f1] text-sm font-semibold px-4 py-2.5 rounded-lg shadow-sm border border-[#efeeec] transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">file_download</span>
            <span>Export Day Summary</span>
          </button>
          <button
            type="button"
            onClick={onOpenPos}
            className="inline-flex items-center gap-1.5 bg-[#bb0012] text-white hover:bg-[#e7151f] text-sm font-semibold px-4 py-2.5 rounded-lg shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">add_shopping_cart</span>
            <span>+ New Bill / POS Sale</span>
          </button>
        </div>
      </div>

      {/* Top 4 Summary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
        {/* KPI 1: Total Sales */}
        <div className="glass-card rounded-2xl p-5 shadow-xs hover:shadow-md hover:-translate-y-1 transition-all duration-300 border border-[#efeeec]/90 flex flex-col justify-between group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs uppercase tracking-wider text-[#5e5e65] font-semibold">Total Gross Sales</span>
            <div className="w-9 h-9 rounded-xl bg-[#6ffbbe]/30 flex items-center justify-center text-[#002113] group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-[19px]">payments</span>
            </div>
          </div>
          <div className="flex items-baseline justify-between gap-1">
            <span className="text-3xl text-[#1a1c1b] font-bold tracking-tight">₹8,45,600</span>
            <div className="flex items-center gap-0.5 bg-[#6ffbbe]/40 text-[#002113] text-xs px-2 py-0.5 rounded-full font-bold">
              <span className="material-symbols-outlined text-[14px]">arrow_upward</span>
              <span>14.2%</span>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-[#5e5e65] text-xs pt-1 border-t border-[#f4f3f1]">
            <span>vs last month (₹7,40,300)</span>
            <svg className="w-16 h-5 text-[#006947] overflow-visible" fill="none" viewBox="0 0 64 20">
              <path d="M0 16 Q 16 12 24 14 T 40 8 T 64 2" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
            </svg>
          </div>
        </div>

        {/* KPI 2: Total Orders */}
        <div className="glass-card rounded-2xl p-5 shadow-xs hover:shadow-md hover:-translate-y-1 transition-all duration-300 border border-[#efeeec]/90 flex flex-col justify-between group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs uppercase tracking-wider text-[#5e5e65] font-semibold">Total POS Receipts</span>
            <div className="w-9 h-9 rounded-xl bg-[#e4e1ea] flex items-center justify-center text-[#1b1b21] group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-[19px]">receipt_long</span>
            </div>
          </div>
          <div className="flex items-baseline justify-between gap-1">
            <span className="text-3xl text-[#1a1c1b] font-bold tracking-tight">2,458</span>
            <span className="text-xs bg-[#e9e8e6] text-[#5e5e65] px-2 py-0.5 rounded-full font-semibold">98.2% Succeeded</span>
          </div>
          <div className="mt-4 flex items-center justify-between text-[#5e5e65] text-xs pt-1 border-t border-[#f4f3f1]">
            <span>Avg ticket size: <strong className="text-[#1a1c1b] font-mono">₹344</strong></span>
            <span className="font-mono text-xs text-[#006947] font-semibold">+8.4% AOV</span>
          </div>
        </div>

        {/* KPI 3: Active Products */}
        <div className="glass-card rounded-2xl p-5 shadow-xs hover:shadow-md hover:-translate-y-1 transition-all duration-300 border border-[#efeeec]/90 flex flex-col justify-between group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs uppercase tracking-wider text-[#5e5e65] font-semibold">Catalog SKUs</span>
            <div className="w-9 h-9 rounded-xl bg-[#e9e8e6] flex items-center justify-center text-[#1a1c1b] group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-[19px]">inventory</span>
            </div>
          </div>
          <div className="flex items-baseline justify-between gap-1">
            <span className="text-3xl text-[#1a1c1b] font-bold tracking-tight">{products.length * 156}</span>
            <span className="text-xs bg-[#6ffbbe]/40 text-[#002113] px-2 py-0.5 rounded-full font-bold">94% In-Stock</span>
          </div>
          <div className="mt-4 flex items-center justify-between text-[#5e5e65] text-xs pt-1 border-t border-[#f4f3f1]">
            <span>Across 6 active aisles</span>
            <span className="font-mono text-xs text-[#5e5e65]">48 New Arrivals</span>
          </div>
        </div>

        {/* KPI 4: Low Stock Alert */}
        <div className="glass-card rounded-2xl p-5 shadow-xs hover:shadow-md hover:-translate-y-1 transition-all duration-300 border border-[#efeeec]/90 flex flex-col justify-between group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs uppercase tracking-wider text-[#ba1a1a] font-semibold">Low Stock Threshold</span>
            <div className="w-9 h-9 rounded-xl bg-[#ffdad6] flex items-center justify-center text-[#93000a] group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-[19px]">warning</span>
            </div>
          </div>
          <div className="flex items-baseline justify-between gap-1">
            <span className="text-3xl text-[#ba1a1a] font-bold tracking-tight">18 Items</span>
            <span className="text-xs bg-[#ffdad6] text-[#93000a] px-2 py-0.5 rounded-full font-bold">Action Req.</span>
          </div>
          <div className="mt-4 flex items-center justify-between text-[#ba1a1a] text-xs pt-1 border-t border-[#f4f3f1] cursor-pointer" onClick={() => onNavigateTab('inventory')}>
            <span className="font-medium">Needs immediate replenishment</span>
            <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          </div>
        </div>
      </div>

      {/* Analytics Row (8 cols + 4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-6">
        {/* Left: Sales & Revenue Velocity Chart (8 cols) */}
        <div className="lg:col-span-8 glass-card rounded-2xl p-5 shadow-xs hover:shadow-md transition-all duration-300 border border-white/60 flex flex-col justify-between">
          <div>
            {/* Header & Interactive Selectors */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#bb0012] animate-pulse"></span>
                  <h2 className="text-lg text-[#1a1c1b] font-bold tracking-tight">
                    {timeRange === 'today'
                      ? "Today's Intraday Performance vs Yesterday"
                      : timeRange === '7d'
                      ? '7-Day Turnover Velocity vs Prior Week'
                      : '30-Day Sales Trajectory vs Previous Cycle'}
                  </h2>
                </div>
                <p className="text-xs text-[#5e5e65] mt-0.5">
                  {timeRange === 'today'
                    ? "Hourly store trading curve comparing today's volume & revenue with yesterday's baseline"
                    : timeRange === '7d'
                    ? "Day-by-day performance compared to the corresponding day of last week"
                    : "Rolling monthly velocity curve compared with the preceding 30-day baseline"}
                </p>
              </div>

              {/* View & Metric Controls */}
              <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
                {/* Time Range Selector */}
                <div className="inline-flex glass-subtle p-1 rounded-xl border border-[#efeeec]">
                  {(['today', '7d', '30d'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTimeRange(t)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                        timeRange === t
                          ? 'bg-white text-[#bb0012] font-bold shadow-xs'
                          : 'text-[#5e5e65] hover:text-[#1a1c1b]'
                      }`}
                    >
                      {t === 'today' ? 'Today vs Yesterday' : t === '7d' ? 'Past 7 Days' : 'Past 30 Days'}
                    </button>
                  ))}
                </div>

                {/* Metric & Chart Mode Toggles */}
                <div className="inline-flex glass-subtle p-1 rounded-xl border border-[#efeeec]">
                  <button
                    type="button"
                    onClick={() => setMetricMode('revenue')}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                      metricMode === 'revenue'
                        ? 'bg-white text-[#1a1c1b] font-bold shadow-xs'
                        : 'text-[#5e5e65] hover:text-[#1a1c1b]'
                    }`}
                    title="View Gross Revenue in Rupees"
                  >
                    ₹ Revenue
                  </button>
                  <button
                    type="button"
                    onClick={() => setMetricMode('units')}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                      metricMode === 'units'
                        ? 'bg-white text-[#1a1c1b] font-bold shadow-xs'
                        : 'text-[#5e5e65] hover:text-[#1a1c1b]'
                    }`}
                    title="View Volume in Units Sold"
                  >
                    Units Sold
                  </button>
                </div>

                {/* Chart Style Toggle: Area vs Bar */}
                <div className="inline-flex glass-subtle p-1 rounded-xl border border-[#efeeec]">
                  <button
                    type="button"
                    onClick={() => setChartType('area')}
                    className={`p-1.5 rounded-lg transition-all ${
                      chartType === 'area'
                        ? 'bg-white text-[#bb0012] shadow-xs'
                        : 'text-[#5e5e65] hover:text-[#1a1c1b]'
                    }`}
                    title="Area Curve View"
                  >
                    <span className="material-symbols-outlined text-[16px] block">show_chart</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setChartType('bar')}
                    className={`p-1.5 rounded-lg transition-all ${
                      chartType === 'bar'
                        ? 'bg-white text-[#bb0012] shadow-xs'
                        : 'text-[#5e5e65] hover:text-[#1a1c1b]'
                    }`}
                    title="Grouped Bar View"
                  >
                    <span className="material-symbols-outlined text-[16px] block">bar_chart</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Metric Callouts Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4 glass-subtle p-3.5 rounded-xl border border-[#efeeec]">
              <div className="flex flex-col">
                <span className="text-xs text-[#5e5e65] font-medium">
                  {timeRange === 'today' ? "Today's Peak Turn" : timeRange === '7d' ? 'Best Daily Run' : 'Peak Period Surge'}
                </span>
                <span className="font-mono text-base font-bold text-[#1a1c1b]">
                  {timeRange === 'today' ? '₹31,250' : timeRange === '7d' ? '₹1,40,000' : '₹1,40,000'}
                  <span className="text-xs text-[#5e5e65] font-normal ml-1.5 font-sans">
                    ({timeRange === 'today' ? '125 units' : timeRange === '7d' ? '560 units' : '560 units'})
                  </span>
                </span>
                <span className="text-[11px] text-[#006947] font-semibold mt-0.5">
                  {timeRange === 'today' ? '08:00 PM (+5.9% vs yesterday)' : timeRange === '7d' ? 'Sat Oct 23 (+14.3% WoW)' : 'Diwali Surge ramp-up'}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-[#5e5e65] font-medium">Period Growth</span>
                <span className="font-mono text-base font-bold text-[#006947]">
                  {timeRange === 'today' ? '+9.8% DoD' : timeRange === '7d' ? '+14.2% WoW' : '+16.5% MoM'}
                </span>
                <span className="text-[11px] text-[#5e5e65] mt-0.5">
                  {timeRange === 'today'
                    ? 'Today ₹1,31,250 vs Yesterday ₹1,19,500'
                    : timeRange === '7d'
                    ? 'Current 7D ₹8,45,600 vs Prior 7D ₹7,40,300'
                    : 'vs Preceding 30-Day Period'}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-[#5e5e65] font-medium">Target Attainment</span>
                <span className="font-mono text-base font-bold text-[#006947]">
                  {achievementPct}%{' '}
                  <span className="text-xs text-[#006947] font-sans font-semibold">
                    ({isAhead ? `+${varianceUnits} surplus` : `${varianceUnits} deficit`})
                  </span>
                </span>
                <span className="text-[11px] text-[#5e5e65] mt-0.5">
                  Store Target: <strong>{dailyTarget} units/day</strong>
                </span>
              </div>
            </div>

            {/* Recharts Animated Interactive Chart Container */}
            <div className="w-full h-72 pt-1">
              <ResponsiveContainer width="100%" height="100%">
                {chartType === 'area' ? (
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="currentAreaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#bb0012" stopOpacity={0.28} />
                        <stop offset="100%" stopColor="#bb0012" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="prevAreaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6366f1" stopOpacity={0.18} />
                        <stop offset="100%" stopColor="#6366f1" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0efe9" />
                    <XAxis
                      dataKey="slot"
                      tick={{ fontSize: 11, fill: '#5e5e65', fontFamily: 'monospace' }}
                      axisLine={{ stroke: '#efeeec' }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#5e5e65', fontFamily: 'monospace' }}
                      axisLine={{ stroke: '#efeeec' }}
                      tickLine={false}
                      tickFormatter={(val) => metricMode === 'revenue' ? `₹${(val / 1000).toFixed(0)}k` : `${val}u`}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const dataObj = payload[0]?.payload;
                          const currentVal = dataObj?.current ?? 0;
                          const prevVal = dataObj?.previous ?? 0;
                          const diff = currentVal - prevVal;
                          const pct = prevVal > 0 ? ((diff / prevVal) * 100).toFixed(1) : '0';
                          return (
                            <div className="glass-card-dark text-white p-3 rounded-xl shadow-2xl border border-white/10 text-xs font-sans min-w-[230px] backdrop-blur-md">
                              <div className="font-bold text-xs text-[#e3e2e0] border-b border-white/10 pb-1.5 mb-2 font-mono flex items-center justify-between">
                                <span>{label}</span>
                                <span className="text-[10px] text-[#6ffbbe] font-normal">
                                  {timeRange === 'today' ? 'Today vs Yesterday' : timeRange === '7d' ? 'Week-over-Week' : '30-Day Trend'}
                                </span>
                              </div>
                              <div className="space-y-1.5">
                                <div className="flex justify-between items-center">
                                  <span className="text-[#a1a1aa] flex items-center gap-1.5">
                                    <span className="w-2.5 h-2.5 rounded-sm bg-[#bb0012]"></span>
                                    {timeRange === 'today' ? "Today's Performance:" : 'Current Period:'}
                                  </span>
                                  <span className="font-mono font-bold text-white">
                                    {metricMode === 'revenue' ? `₹${currentVal.toLocaleString('en-IN')}` : `${currentVal} units`}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-[#a1a1aa] flex items-center gap-1.5">
                                    <span className="w-2.5 h-2.5 rounded-sm bg-[#6366f1]"></span>
                                    {timeRange === 'today' ? "Yesterday's Baseline:" : 'Previous Baseline:'}
                                  </span>
                                  <span className="font-mono font-semibold text-[#cbd5e1]">
                                    {metricMode === 'revenue' ? `₹${prevVal.toLocaleString('en-IN')}` : `${prevVal} units`}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center pt-1.5 border-t border-white/10">
                                  <span className="text-[#a1a1aa]">Performance Delta:</span>
                                  <span className={`font-mono font-bold ${diff >= 0 ? 'text-[#6ffbbe]' : 'text-[#ffb4ab]'}`}>
                                    {diff >= 0 ? `+${metricMode === 'revenue' ? `₹${diff.toLocaleString('en-IN')}` : `${diff}u`} (+${pct}%)` : `${metricMode === 'revenue' ? `₹${diff.toLocaleString('en-IN')}` : `${diff}u`} (${pct}%)`}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center text-[10px] text-[#94a3b8] pt-0.5">
                                  <span>Units sold:</span>
                                  <span className="font-mono text-white">{dataObj.currentUnits}u (vs {dataObj.previousUnits}u prev)</span>
                                </div>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: 8, fontSize: 11 }} />
                    <Area
                      type="monotone"
                      dataKey="current"
                      name={timeRange === 'today' ? "Today's Sales" : 'Current Period'}
                      stroke="#bb0012"
                      strokeWidth={2.5}
                      fill="url(#currentAreaGrad)"
                      animationDuration={600}
                    />
                    <Area
                      type="monotone"
                      dataKey="previous"
                      name={timeRange === 'today' ? "Yesterday's Sales" : 'Previous Cycle'}
                      stroke="#6366f1"
                      strokeWidth={2}
                      strokeDasharray="4 4"
                      fill="url(#prevAreaGrad)"
                      animationDuration={600}
                    />
                  </AreaChart>
                ) : (
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }} barGap={4}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0efe9" />
                    <XAxis
                      dataKey="slot"
                      tick={{ fontSize: 11, fill: '#5e5e65', fontFamily: 'monospace' }}
                      axisLine={{ stroke: '#efeeec' }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#5e5e65', fontFamily: 'monospace' }}
                      axisLine={{ stroke: '#efeeec' }}
                      tickLine={false}
                      tickFormatter={(val) => metricMode === 'revenue' ? `₹${(val / 1000).toFixed(0)}k` : `${val}u`}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const dataObj = payload[0]?.payload;
                          const currentVal = dataObj?.current ?? 0;
                          const prevVal = dataObj?.previous ?? 0;
                          const diff = currentVal - prevVal;
                          const pct = prevVal > 0 ? ((diff / prevVal) * 100).toFixed(1) : '0';
                          return (
                            <div className="glass-card-dark text-white p-3 rounded-xl shadow-2xl border border-white/10 text-xs font-sans min-w-[230px] backdrop-blur-md">
                              <div className="font-bold text-xs text-[#e3e2e0] border-b border-white/10 pb-1.5 mb-2 font-mono flex items-center justify-between">
                                <span>{label}</span>
                                <span className="text-[10px] text-[#6ffbbe] font-normal">Bar Comparison</span>
                              </div>
                              <div className="space-y-1.5">
                                <div className="flex justify-between items-center">
                                  <span className="text-[#a1a1aa] flex items-center gap-1.5">
                                    <span className="w-2.5 h-2.5 rounded-sm bg-[#bb0012]"></span>
                                    {timeRange === 'today' ? "Today:" : 'Current:'}
                                  </span>
                                  <span className="font-mono font-bold text-white">
                                    {metricMode === 'revenue' ? `₹${currentVal.toLocaleString('en-IN')}` : `${currentVal} units`}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-[#a1a1aa] flex items-center gap-1.5">
                                    <span className="w-2.5 h-2.5 rounded-sm bg-[#6366f1]"></span>
                                    {timeRange === 'today' ? "Yesterday:" : 'Previous:'}
                                  </span>
                                  <span className="font-mono font-semibold text-[#cbd5e1]">
                                    {metricMode === 'revenue' ? `₹${prevVal.toLocaleString('en-IN')}` : `${prevVal} units`}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center pt-1.5 border-t border-white/10">
                                  <span className="text-[#a1a1aa]">Growth Delta:</span>
                                  <span className={`font-mono font-bold ${diff >= 0 ? 'text-[#6ffbbe]' : 'text-[#ffb4ab]'}`}>
                                    {diff >= 0 ? `+${diff.toLocaleString('en-IN')} (+${pct}%)` : `${diff.toLocaleString('en-IN')} (${pct}%)`}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: 8, fontSize: 11 }} />
                    <Bar
                      dataKey="current"
                      name={timeRange === 'today' ? "Today's Sales" : 'Current Period'}
                      fill="#bb0012"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={28}
                      animationDuration={600}
                    />
                    <Bar
                      dataKey="previous"
                      name={timeRange === 'today' ? "Yesterday's Baseline" : 'Previous Cycle'}
                      fill="#6366f1"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={28}
                      animationDuration={600}
                    />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>

          {/* Footer Bar */}
          <div className="flex items-center justify-between pt-3 mt-3 glass-subtle px-4 py-2.5 rounded-xl border border-[#efeeec]">
            <div className="flex items-center gap-4 text-xs font-medium flex-wrap">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-1 bg-[#bb0012] rounded-full"></span>
                <span className="text-[#1a1c1b]">
                  {timeRange === 'today' ? `Today (₹${todayRevenue.toLocaleString('en-IN')})` : `Current 7 Days (₹8,45,600)`}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-1 bg-[#6366f1] rounded-full"></span>
                <span className="text-[#5e5e65]">
                  {timeRange === 'today' ? `Yesterday (₹${yesterdayRevenue.toLocaleString('en-IN')})` : `Prior 7 Days (₹7,40,300)`}
                </span>
              </div>
            </div>
            <span className="font-mono text-xs text-[#006947] font-bold">
              ARIMA(2,1,2) Pacing Confidence: 96.4%
            </span>
          </div>
        </div>

        {/* Right: Festival Demand Prediction Spotlight (4 cols) */}
        <div className="lg:col-span-4 glass-card rounded-2xl shadow-sm border border-[#efeeec]/90 p-5 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute -right-12 -top-12 w-48 h-48 rounded-full bg-[#bb0012]/15 blur-3xl animate-glow-pulse pointer-events-none"></div>
          <div className="flex flex-col gap-4 relative z-10">
            {/* Festive Badge Banner */}
            <div className="bg-gradient-to-r from-[#bb0012] via-[#d60e1d] to-[#e7151f] p-4 rounded-xl text-white flex flex-col gap-1.5 shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold tracking-wider uppercase bg-white/20 backdrop-blur-xs px-2 py-0.5 rounded">
                  Upcoming Festival
                </span>
                <span className="text-sm font-bold">🪔 12 Days Left</span>
              </div>
              <h3 className="text-xl font-bold tracking-tight mt-0.5">Diwali Mega Surge</h3>
              <p className="text-xs text-white/90 leading-tight">
                Demand forecast indicates intense basket affinity toward plush gift bundles &amp; novelty decor.
              </p>
            </div>

            {/* Predicted Impact Stats */}
            <div className="glass-subtle p-3.5 rounded-xl flex flex-col gap-2 border border-[#efeeec]/70">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#5e5e65]">Projected Footfall Spike</span>
                <span className="text-base text-[#bb0012] font-bold">+38%</span>
              </div>
              <div className="w-full bg-[#e9e8e6] h-2 rounded-full overflow-hidden">
                <div className="bg-[#bb0012] h-full rounded-full transition-all duration-500" style={{ width: '78%' }}></div>
              </div>
              <div className="flex items-center justify-between text-[11px] text-[#5e5e65]">
                <span>Historical baseline: 1,800 units/wk</span>
                <span className="font-bold text-[#1a1c1b]">Target: 2,480 units</span>
              </div>
            </div>

            {/* Stock Readiness Progress Meter */}
            <div className="glass-subtle p-3.5 rounded-xl flex flex-col gap-1.5 border border-[#efeeec]/70">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#1a1c1b]">Diwali Preparedness Index</span>
                <span className="text-xs font-bold text-[#1a1c1b]">62% Stocked</span>
              </div>
              <div className="w-full bg-[#e9e8e6] h-2.5 rounded-full overflow-hidden">
                <div className="bg-[#006947] h-full rounded-full transition-all duration-500" style={{ width: '62%' }}></div>
              </div>
              <span className="text-[11px] text-[#5e5e65]">Current buffer safe for 8 days. Warehouse dispatch pending.</span>
            </div>

            {/* Urgent Restock Alert Callout */}
            <div className="bg-[#ffdad6]/80 backdrop-blur-xs p-3 rounded-xl flex items-start gap-2.5 border border-[#ffb4ab]">
              <span className="material-symbols-outlined text-[#93000a] text-[20px] shrink-0 mt-0.5">priority_high</span>
              <p className="text-xs text-[#93000a] leading-snug">
                <strong>Critical Alert:</strong> Gift Sets &amp; Sanrio Plush Toys will run out in <strong>4 days</strong> at current velocity. Recommended buffer: <strong>+450 units</strong>.
              </p>
            </div>
          </div>

          <div className="mt-4 pt-1">
            <button
              type="button"
              onClick={() => setShowAiModal(true)}
              className="w-full bg-[#1a1c1b] hover:bg-[#2f3130] text-white font-semibold text-sm py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm hover:shadow hover:-translate-y-0.5"
            >
              <span className="material-symbols-outlined text-[18px]">psychology</span>
              <span>View AI Allocation Plan</span>
            </button>
          </div>
        </div>
      </div>

      {/* Middle Row: Top Selling Products (7 cols) + Low Stock Alert & Reorder Watch (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-6">
        {/* Left: Top Selling Products Table (7 cols) */}
        <div className="lg:col-span-7 bg-white p-5 rounded-xl shadow-sm border border-[#efeeec] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#f4f3f1] flex items-center justify-center text-[#bb0012]">
                  <span className="material-symbols-outlined text-[20px]">stars</span>
                </div>
                <div>
                  <h2 className="text-base text-[#1a1c1b] font-bold">Top Selling Products</h2>
                  <p className="text-xs text-[#5e5e65]">Ranked by volumetric throughput &amp; basket frequency</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onNavigateTab('products')}
                className="text-xs text-[#bb0012] hover:underline font-semibold flex items-center gap-0.5"
              >
                <span>View All SKUs</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-[#f4f3f1] text-[#5e5e65] text-[11px] uppercase tracking-wider font-semibold">
                    <th className="py-2.5 px-3 rounded-l-lg">Product Description</th>
                    <th className="py-2.5 px-2">Category</th>
                    <th className="py-2.5 px-2 text-right">Sold</th>
                    <th className="py-2.5 px-2 text-right">Revenue</th>
                    <th className="py-2.5 px-3 text-right rounded-r-lg">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f4f3f1] text-xs">
                  {products.slice(0, 5).map((prod) => (
                    <tr key={prod.id} className="hover:bg-[#f4f3f1]/70 transition-colors group">
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={prod.imageUrl}
                            alt={prod.name}
                            referrerPolicy="no-referrer"
                            className="w-9 h-9 rounded-lg object-cover bg-[#f4f3f1] shrink-0 border border-black/5"
                          />
                          <div className="flex flex-col min-w-0">
                            <span className="font-semibold text-[#1a1c1b] truncate group-hover:text-[#bb0012] transition-colors">
                              {prod.name}
                            </span>
                            <span className="font-mono text-[11px] text-[#5e5e65]">{prod.sku}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 px-2">
                        <span className="bg-[#f4f3f1] text-[#5e5e65] text-[10px] px-2 py-0.5 rounded-full font-semibold capitalize">
                          {prod.category}
                        </span>
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono font-bold text-[#1a1c1b]">
                        {prod.dailySales ? prod.dailySales * 32 : 140}
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono font-semibold text-[#1a1c1b]">
                        ₹{((prod.dailySales ? prod.dailySales * 32 : 140) * prod.sellingPrice).toLocaleString('en-IN')}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                            prod.status === 'In Stock'
                              ? 'bg-[#6ffbbe]/40 text-[#002113]'
                              : prod.status === 'Critical'
                              ? 'bg-[#ffdad6] text-[#93000a]'
                              : 'bg-[#fffbeb] text-[#b45309]'
                          }`}
                        >
                          {prod.currentStock} in stock
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 pt-2 flex items-center justify-between text-[#5e5e65] text-xs border-t border-[#f4f3f1]">
            <span>Displaying Top 5 of 1,250 registered items</span>
            <span className="text-xs text-[#006947] font-semibold flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">sync</span> POS Data Live (3s ago)
            </span>
          </div>
        </div>

        {/* Right: Low Stock Alert & Reorder Watch (5 cols) */}
        <div className="lg:col-span-5 bg-white p-5 rounded-xl shadow-sm border border-[#efeeec] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#ffdad6] flex items-center justify-center text-[#ba1a1a]">
                  <span className="material-symbols-outlined text-[20px]">crisis_alert</span>
                </div>
                <div>
                  <h2 className="text-base text-[#1a1c1b] font-bold">Low Stock Alert</h2>
                  <p className="text-xs text-[#5e5e65]">Threshold below safety buffer (Reorder Watchlist)</p>
                </div>
              </div>
              <span className="text-xs bg-[#ffdad6] text-[#93000a] px-2.5 py-0.5 rounded-full font-bold">4 Urgent</span>
            </div>

            <div className="flex flex-col gap-2.5">
              {lowStockAlerts.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-lg bg-[#f4f3f1] flex items-center justify-between hover:bg-[#efeeec] transition-colors"
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-semibold text-[#1a1c1b]">{item.name}</span>
                    <div className="flex items-center gap-1.5 font-mono text-xs">
                      <span className="text-[#ba1a1a] font-bold">Current: {item.current} units</span>
                      <span className="text-[#5e5e65]">• Min: {item.min}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleQuickReorder(item.id)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-sm transition-all active:scale-95 ${
                      reorderedItems[item.id]
                        ? 'bg-[#006947] text-white'
                        : 'bg-[#bb0012] hover:bg-[#e7151f] text-white'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[14px]">
                      {reorderedItems[item.id] ? 'done' : 'local_shipping'}
                    </span>
                    <span>{reorderedItems[item.id] ? 'PO Created' : `Reorder +${item.reorderQty}`}</span>
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-2">
            <button
              type="button"
              onClick={() => onNavigateTab('inventory')}
              className="w-full bg-[#f4f3f1] hover:bg-[#e9e8e6] text-[#1a1c1b] font-semibold text-xs py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors border border-[#efeeec]"
            >
              <span className="material-symbols-outlined text-[18px]">rule_folder</span>
              <span>Batch Create Supplier PO (4 Items)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Row: Customer Insights & Basket Affinity */}
      <div className="flex flex-col gap-3 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#bb0012] text-[20px]">insights</span>
            <h2 className="text-base font-bold text-[#1a1c1b]">Customer Insights &amp; Basket Affinity</h2>
          </div>
          <span className="font-mono text-xs text-[#5e5e65]">Telemetry based on 2,458 checkout baskets</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-[#efeeec] flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#5e5e65]">Top Revenue Driver</span>
              <span className="material-symbols-outlined text-[#bb0012] text-[18px]">category</span>
            </div>
            <div>
              <span className="text-sm font-bold text-[#1a1c1b] block">Toys &amp; Blind Boxes</span>
              <span className="font-mono text-sm text-[#bb0012] font-semibold">34% of total sales</span>
            </div>
            <div className="mt-2 text-[#5e5e65] text-xs">Lead margin contributor (+41% markup)</div>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm border border-[#efeeec] flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#5e5e65]">Velocity Leader</span>
              <span className="material-symbols-outlined text-[#006947] text-[18px]">verified</span>
            </div>
            <div>
              <span className="text-sm font-bold text-[#1a1c1b] block truncate">Sanrio Blind Box V2</span>
              <span className="font-mono text-sm text-[#006947] font-semibold">18.4 items/hr peak</span>
            </div>
            <div className="mt-2 text-[#5e5e65] text-xs">92% checkout rate when placed at counter</div>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm border border-[#efeeec] flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#5e5e65]">Loyalty Retention</span>
              <span className="material-symbols-outlined text-[#5e5e65] text-[18px]">loyalty</span>
            </div>
            <div>
              <span className="text-sm font-bold text-[#1a1c1b] block">42.8% Repeat Rate</span>
              <span className="font-mono text-sm text-[#1a1c1b] font-semibold">1,052 Loyalty Members</span>
            </div>
            <div className="mt-2 text-[#5e5e65] text-xs">+6.2% increase post-WhatsApp membership</div>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm border border-[#efeeec] flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#5e5e65]">Basket Affinity</span>
              <span className="material-symbols-outlined text-[#bb0012] text-[18px]">hub</span>
            </div>
            <div>
              <span className="text-sm font-bold text-[#1a1c1b] block">Plushies + Gel Pens</span>
              <span className="font-mono text-sm text-[#bb0012] font-semibold">68% Cross-Add Rate</span>
            </div>
            <div className="mt-2 text-[#5e5e65] text-xs">Evening rush window: 18:00 - 21:00 PM</div>
          </div>
        </div>
      </div>

      {/* Realtime Java Backend Sync Indicator Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between p-3.5 bg-[#f4f3f1] rounded-xl text-[#5e5e65] text-xs border border-[#efeeec]">
        <div className="flex items-center gap-2 mb-2 sm:mb-0">
          <span className="w-2.5 h-2.5 rounded-full bg-[#006947] animate-pulse"></span>
          <span>
            MINISO Central In-Store Engine connected:{' '}
            <code className="font-mono text-xs text-[#1a1c1b]">
              com.miniso.retail.sales.SalesEngineDaemon (PID: {telemetry.pid})
            </code>
          </span>
        </div>
        <div className="flex items-center gap-4 text-xs font-mono">
          <span>Latency: <strong className="text-[#1a1c1b]">{telemetry.latencyMs}ms</strong></span>
          <span>
            Memory: <strong className="text-[#1a1c1b]">{telemetry.jvmHeapUsed}MB / {telemetry.jvmHeapMax}MB JVM Heap</strong>
          </span>
        </div>
      </div>

      {/* AI Allocation Plan Modal */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl p-6 border border-[#efeeec] flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-[#f4f3f1] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-[#bb0012]/10 text-[#bb0012] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">psychology</span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#1a1c1b]">AI Allocation Plan — Diwali Mega Surge</h3>
                  <span className="text-xs text-[#5e5e65]">Store #104 Inventory Buffer Optimizer</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAiModal(false)}
                className="p-1 rounded-full hover:bg-[#f4f3f1] text-[#5e5e65]"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="space-y-3 text-xs text-[#1a1c1b]">
              <div className="bg-[#f4f3f1] p-3 rounded-lg flex items-center justify-between">
                <span>Calculated Additional Buffer Needed</span>
                <span className="font-mono font-bold text-sm text-[#bb0012]">+450 Units</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between p-2 rounded bg-white border border-[#efeeec]">
                  <span>Sanrio Plush Toys (Kuromi &amp; Cinnamoroll)</span>
                  <span className="font-mono font-bold text-[#006947]">+180 units recommended</span>
                </div>
                <div className="flex justify-between p-2 rounded bg-white border border-[#efeeec]">
                  <span>Festive Diwali Scented Candle Gift Hampers</span>
                  <span className="font-mono font-bold text-[#006947]">+150 units recommended</span>
                </div>
                <div className="flex justify-between p-2 rounded bg-white border border-[#efeeec]">
                  <span>Pastel Thermal Flasks &amp; Accessories</span>
                  <span className="font-mono font-bold text-[#006947]">+120 units recommended</span>
                </div>
              </div>
              <p className="text-[11px] text-[#5e5e65] leading-relaxed">
                Dispatch route: Direct Express from Central Bhiwandi Warehouse Hub. Estimated delivery transit: 36-48 hours. Prevents ₹2,40,000 in lost festival opportunity revenue.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#f4f3f1]">
              <button
                type="button"
                onClick={() => setShowAiModal(false)}
                className="px-4 py-2 rounded-lg bg-[#f4f3f1] hover:bg-[#e9e8e6] text-[#1a1c1b] text-xs font-semibold"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAiModal(false);
                  onNavigateTab('inventory');
                }}
                className="px-4 py-2 rounded-lg bg-[#bb0012] hover:bg-[#e7151f] text-white text-xs font-semibold shadow-sm"
              >
                Go to Reorder &amp; Dispatch PO
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
