import React, { useState } from 'react';
import { Product, SystemTelemetry } from '../../types/retail';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  Cell
} from 'recharts';

interface DailyVolumeChartItem {
  slot: string;
  today?: number;
  yesterday?: number;
  actual?: number;
  previousWeek?: number;
  previousPeriod?: number;
  target?: number;
  todayRevenue?: number;
  yesterdayRevenue?: number;
  revenue?: number;
  prevRevenue?: number;
}

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
  const [timeRange, setTimeRange] = useState<'today' | '7d' | '30d' | '6m'>('30d');
  const [reorderedItems, setReorderedItems] = useState<Record<string, boolean>>({});
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(620);
  const [showAiModal, setShowAiModal] = useState(false);
  const [showStreamlitDeployModal, setShowStreamlitDeployModal] = useState(false);

  // Daily Sales Volume vs Store Target State
  const [dailyTarget, setDailyTarget] = useState<number>(420);
  const [chartViewMode, setChartViewMode] = useState<'today-vs-yesterday' | '7days' | '14days'>('today-vs-yesterday');

  // Intraday Hourly Volume: Today vs Yesterday vs Target
  const hourlyComparisonData = [
    { slot: '10:00 AM', today: 28, yesterday: 24, target: Math.round(dailyTarget * 0.05), todayRevenue: 7000, yesterdayRevenue: 6000 },
    { slot: '12:00 PM', today: 52, yesterday: 46, target: Math.round(dailyTarget * 0.10), todayRevenue: 13000, yesterdayRevenue: 11500 },
    { slot: '02:00 PM', today: 64, yesterday: 58, target: Math.round(dailyTarget * 0.12), todayRevenue: 16000, yesterdayRevenue: 14500 },
    { slot: '04:00 PM', today: 78, yesterday: 72, target: Math.round(dailyTarget * 0.15), todayRevenue: 19500, yesterdayRevenue: 18000 },
    { slot: '06:00 PM', today: 108, yesterday: 95, target: Math.round(dailyTarget * 0.22), todayRevenue: 27000, yesterdayRevenue: 23750 },
    { slot: '08:00 PM', today: 125, yesterday: 118, target: Math.round(dailyTarget * 0.24), todayRevenue: 31250, yesterdayRevenue: 29500 },
    { slot: '10:00 PM', today: 70, yesterday: 65, target: Math.round(dailyTarget * 0.12), todayRevenue: 17500, yesterdayRevenue: 16250 },
  ];

  // 7-Day Performance: Current Week vs Prior Week Same Day
  const weeklyComparisonData = [
    { slot: 'Mon Oct 18', actual: 380, previousWeek: 340, target: dailyTarget, revenue: 95000, prevRevenue: 85000 },
    { slot: 'Tue Oct 19', actual: 410, previousWeek: 365, target: dailyTarget, revenue: 102500, prevRevenue: 91250 },
    { slot: 'Wed Oct 20', actual: 395, previousWeek: 350, target: dailyTarget, revenue: 98750, prevRevenue: 87500 },
    { slot: 'Thu Oct 21', actual: 435, previousWeek: 380, target: dailyTarget, revenue: 108750, prevRevenue: 95000 },
    { slot: 'Fri Oct 22', actual: 485, previousWeek: 420, target: dailyTarget, revenue: 121250, prevRevenue: 105000 },
    { slot: 'Sat Oct 23', actual: 560, previousWeek: 490, target: Math.round(dailyTarget * 1.15), revenue: 140000, prevRevenue: 122500 },
    { slot: 'Sun Oct 24 (Today)', actual: 525, previousWeek: 460, target: dailyTarget, revenue: 131250, prevRevenue: 115000 },
  ];

  // 14-Day Consecutive Daily Historical Volume vs Target & Baseline
  const fourteenDayData = [
    { slot: 'Oct 11', actual: 355, previousPeriod: 320, target: dailyTarget, revenue: 88750 },
    { slot: 'Oct 12', actual: 368, previousPeriod: 335, target: dailyTarget, revenue: 92000 },
    { slot: 'Oct 13', actual: 342, previousPeriod: 310, target: dailyTarget, revenue: 85500 },
    { slot: 'Oct 14', actual: 385, previousPeriod: 345, target: dailyTarget, revenue: 96250 },
    { slot: 'Oct 15', actual: 420, previousPeriod: 375, target: dailyTarget, revenue: 105000 },
    { slot: 'Oct 16', actual: 495, previousPeriod: 440, target: Math.round(dailyTarget * 1.15), revenue: 123750 },
    { slot: 'Oct 17', actual: 465, previousPeriod: 415, target: dailyTarget, revenue: 116250 },
    { slot: 'Oct 18', actual: 380, previousPeriod: 340, target: dailyTarget, revenue: 95000 },
    { slot: 'Oct 19', actual: 410, previousPeriod: 365, target: dailyTarget, revenue: 102500 },
    { slot: 'Oct 20', actual: 395, previousPeriod: 350, target: dailyTarget, revenue: 98750 },
    { slot: 'Oct 21', actual: 435, previousPeriod: 380, target: dailyTarget, revenue: 108750 },
    { slot: 'Oct 22', actual: 485, previousPeriod: 420, target: dailyTarget, revenue: 121250 },
    { slot: 'Oct 23', actual: 560, previousPeriod: 490, target: Math.round(dailyTarget * 1.15), revenue: 140000 },
    { slot: 'Today', actual: 525, previousPeriod: 460, target: dailyTarget, revenue: 131250 },
  ];

  const currentChartData: DailyVolumeChartItem[] = 
    chartViewMode === 'today-vs-yesterday' 
      ? hourlyComparisonData 
      : chartViewMode === '7days' 
      ? weeklyComparisonData 
      : fourteenDayData;

  const todayActualUnits = hourlyComparisonData.reduce((acc, d) => acc + d.today, 0); // 525 units
  const yesterdayActualUnits = hourlyComparisonData.reduce((acc, d) => acc + d.yesterday, 0); // 478 units
  const todayRevenue = hourlyComparisonData.reduce((acc, d) => acc + d.todayRevenue, 0); // ₹1,31,250
  const yesterdayRevenue = hourlyComparisonData.reduce((acc, d) => acc + d.yesterdayRevenue, 0); // ₹1,19,500
  const dayOverDayGrowth = Number((((todayActualUnits - yesterdayActualUnits) / yesterdayActualUnits) * 100).toFixed(1)); // +9.8%
  const achievementPct = Math.round((todayActualUnits / dailyTarget) * 100);
  const varianceUnits = todayActualUnits - dailyTarget;
  const isAhead = varianceUnits >= 0;
  const sevenDayPriorAvg = Math.round(weeklyComparisonData.reduce((acc, d) => acc + d.previousWeek, 0) / 7);

  const handleQuickReorder = (itemId: string) => {
    setReorderedItems((prev) => ({ ...prev, [itemId]: true }));
    if (addToast) addToast(`PO dispatched for ${itemId} to Central Warehouse (+50 units)`, 'success');
    setTimeout(() => {
      setReorderedItems((prev) => ({ ...prev, [itemId]: false }));
    }, 3500);
  };

  const handleCopyStreamlitUrl = () => {
    const devUrl = 'https://ais-dev-iyez3lpf4rde4soqy5tpzi-717654492957.asia-east1.run.app/?mode=streamlit';
    navigator.clipboard?.writeText(devUrl);
    if (addToast) addToast(`Copied Streamlit web URL: ${devUrl}`, 'success');
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
            onClick={() => setShowStreamlitDeployModal(true)}
            className="inline-flex items-center gap-1.5 bg-[#f0f2f6] hover:bg-[#e6e9ef] text-[#262730] text-sm font-semibold px-4 py-2.5 rounded-lg shadow-xs border border-[#e6e9ef] transition-all"
          >
            <span className="material-symbols-outlined text-[18px] text-[#ff4b4b]">cloud_upload</span>
            <span>Deploy to Web (Streamlit)</span>
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
        {/* Left: Sales Velocity & Line/Area Chart (8 cols) */}
        <div className="lg:col-span-8 glass-card rounded-2xl p-5 shadow-xs hover:shadow-md transition-all duration-300 border border-[#efeeec]/90 flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#bb0012] animate-pulse"></span>
                  <h2 className="text-lg text-[#1a1c1b] font-bold">
                    {timeRange === 'today'
                      ? "Today's Intraday Velocity vs Yesterday"
                      : timeRange === '7d'
                      ? '7-Day Turnover Velocity vs Prior Week'
                      : timeRange === '30d'
                      ? '30-Day Revenue Velocity vs Previous Cycle'
                      : '6-Month Trajectory vs H1 Baseline'}
                  </h2>
                </div>
                <p className="text-xs text-[#5e5e65]">
                  {timeRange === 'today'
                    ? "Hourly store turnover pacing compared to yesterday's trading curve"
                    : timeRange === '7d'
                    ? 'Daily sales trajectory compared with previous week same-day baseline'
                    : timeRange === '30d'
                    ? 'Monthly store pacing with preceding 30-day comparative run'
                    : 'Semi-annual festive ramp-up compared to previous half-year trend'}
                </p>
              </div>
              {/* Timeframe selector */}
              <div className="inline-flex glass-subtle p-1 rounded-xl self-start border border-[#efeeec]/80">
                {(['today', '7d', '30d', '6m'] as const).map((t) => (
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
                    {t === 'today' ? "Today vs Yesterday" : t === '7d' ? '7 Days' : t === '30d' ? '30 Days' : '6 Months'}
                  </button>
                ))}
              </div>
            </div>

            {/* Metric Callouts Strip */}
            <div className="grid grid-cols-3 gap-3 mb-4 glass-subtle p-3 rounded-xl border border-[#efeeec]/70">
              <div>
                <span className="text-xs text-[#5e5e65] block font-medium">
                  {timeRange === 'today' ? "Peak Hourly Turn" : timeRange === '7d' ? 'Best Daily Run' : 'Peak Period Turn'}
                </span>
                <span className="font-mono text-base font-bold text-[#1a1c1b]">
                  {timeRange === 'today' ? '₹31,250' : timeRange === '7d' ? '₹1,40,000' : timeRange === '30d' ? '₹42,150' : '₹9,80,000'}
                </span>
                <span className="text-xs text-[#006947] block font-semibold">
                  {timeRange === 'today' ? '08:00 PM (+5.9% vs Yest)' : timeRange === '7d' ? 'Sat Rush (+14.3% WoW)' : '+14.2% vs baseline'}
                </span>
              </div>
              <div>
                <span className="text-xs text-[#5e5e65] block font-medium">Comparative Growth</span>
                <span className="font-mono text-base font-bold text-[#006947]">
                  {timeRange === 'today' ? '+9.8% DoD' : timeRange === '7d' ? '+14.2% WoW' : '+14.2% YoY'}
                </span>
                <span className="text-xs text-[#5e5e65] block">
                  {timeRange === 'today' ? 'vs Yesterday (₹1,19,500)' : timeRange === '7d' ? 'vs Prior 7D (₹7,40,300)' : 'vs Prior Cycle'}
                </span>
              </div>
              <div>
                <span className="text-xs text-[#5e5e65] block font-medium">Peak Demand Window</span>
                <span className="font-mono text-base font-bold text-[#1a1c1b]">18:00 - 21:00</span>
                <span className="text-xs text-[#bb0012] font-semibold block">Evening Surge Active</span>
              </div>
            </div>

            {/* SVG Interactive Area Chart */}
            <div className="relative w-full h-64 mt-2">
              <svg className="w-full h-full cursor-crosshair" preserveAspectRatio="none" viewBox="0 0 760 220">
                <defs>
                  <linearGradient id="minisoAreaGrad" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#bb0012" stopOpacity="0.30"></stop>
                    <stop offset="100%" stopColor="#bb0012" stopOpacity="0.00"></stop>
                  </linearGradient>
                  <linearGradient id="secondaryAreaGrad" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity="0.20"></stop>
                    <stop offset="100%" stopColor="#6366f1" stopOpacity="0.00"></stop>
                  </linearGradient>
                </defs>
                {/* Horizontal Grid lines */}
                <line stroke="#efeeec" strokeWidth="1" x1="0" x2="760" y1="30" y2="30"></line>
                <line stroke="#efeeec" strokeWidth="1" x1="0" x2="760" y1="80" y2="80"></line>
                <line stroke="#efeeec" strokeWidth="1" x1="0" x2="760" y1="130" y2="130"></line>
                <line stroke="#efeeec" strokeWidth="1" x1="0" x2="760" y1="180" y2="180"></line>

                {/* Area 2 (Prior Cycle / Previous Day Comparison) */}
                <path 
                  d={timeRange === 'today'
                    ? "M 10 180 Q 120 160 200 145 T 360 125 T 480 80 T 600 50 T 750 100 L 750 210 L 10 210 Z"
                    : timeRange === '7d'
                    ? "M 10 180 Q 120 165 220 170 T 360 145 T 480 110 T 600 65 T 750 85 L 750 210 L 10 210 Z"
                    : "M 10 160 Q 90 150 160 145 T 310 130 T 460 140 T 610 120 T 750 110 L 750 210 L 10 210 Z"
                  } 
                  fill="url(#secondaryAreaGrad)"
                ></path>
                <path 
                  d={timeRange === 'today'
                    ? "M 10 180 Q 120 160 200 145 T 360 125 T 480 80 T 600 50 T 750 100"
                    : timeRange === '7d'
                    ? "M 10 180 Q 120 165 220 170 T 360 145 T 480 110 T 600 65 T 750 85"
                    : "M 10 160 Q 90 150 160 145 T 310 130 T 460 140 T 610 120 T 750 110"
                  } 
                  fill="none" 
                  stroke="#6366f1" 
                  strokeDasharray="4 4" 
                  strokeWidth="2"
                ></path>

                {/* Area 1 (Current Period Sales) */}
                <path 
                  d={timeRange === 'today'
                    ? "M 10 170 Q 120 150 200 130 T 360 110 T 480 60 T 600 30 T 750 80 L 750 210 L 10 210 Z"
                    : timeRange === '7d'
                    ? "M 10 160 Q 120 140 220 150 T 360 120 T 480 80 T 600 35 T 750 50 L 750 210 L 10 210 Z"
                    : "M 10 150 Q 80 140 140 90 T 260 110 T 380 60 T 500 120 T 620 40 T 750 55 L 750 210 L 10 210 Z"
                  } 
                  fill="url(#minisoAreaGrad)"
                ></path>
                <path 
                  d={timeRange === 'today'
                    ? "M 10 170 Q 120 150 200 130 T 360 110 T 480 60 T 600 30 T 750 80"
                    : timeRange === '7d'
                    ? "M 10 160 Q 120 140 220 150 T 360 120 T 480 80 T 600 35 T 750 50"
                    : "M 10 150 Q 80 140 140 90 T 260 110 T 380 60 T 500 120 T 620 40 T 750 55"
                  } 
                  fill="none" 
                  stroke="#bb0012" 
                  strokeLinecap="round" 
                  strokeWidth="3"
                ></path>

                {/* Active Interactive Data Points */}
                <circle cx={timeRange === 'today' ? 200 : 140} cy={timeRange === 'today' ? 130 : 90} fill="#bb0012" r="4.5" className="cursor-pointer hover:scale-125 transition-transform" onClick={() => setHoveredPoint(140)}></circle>
                <circle cx={timeRange === 'today' ? 480 : 380} cy={timeRange === 'today' ? 60 : 60} fill="#bb0012" r="4.5" className="cursor-pointer hover:scale-125 transition-transform" onClick={() => setHoveredPoint(380)}></circle>
                <circle cx={timeRange === 'today' ? 600 : 620} cy={timeRange === 'today' ? 30 : 40} fill="#bb0012" r="6" stroke="#ffffff" strokeWidth="2.5" className="cursor-pointer animate-pulse hover:scale-125 transition-transform" onClick={() => setHoveredPoint(620)}></circle>
              </svg>

              {/* Floating Data Annotation Tooltip */}
              {hoveredPoint === 620 && (
                <div className="absolute left-[72%] top-[8%] -translate-x-1/2 glass-card-dark text-white p-3 rounded-xl shadow-2xl pointer-events-none flex flex-col items-start gap-1 border border-white/10 z-10 backdrop-blur-md min-w-[210px]">
                  <span className="text-[10px] text-[#e3e2e0] uppercase tracking-wider font-semibold">
                    {timeRange === 'today' ? '08:00 PM Intraday Surge' : timeRange === '7d' ? 'Sat Oct 23 Peak Run' : 'Oct 24 • Saturday Rush'}
                  </span>
                  <div className="flex items-center justify-between w-full font-mono text-xs">
                    <span className="text-[#a1a1aa]">Current:</span>
                    <span className="text-[#6ffbbe] font-bold">
                      {timeRange === 'today' ? '₹31,250' : timeRange === '7d' ? '₹1,40,000' : '₹38,420'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between w-full font-mono text-xs">
                    <span className="text-[#a1a1aa]">Previous:</span>
                    <span className="text-[#cbd5e1]">
                      {timeRange === 'today' ? '₹29,500' : timeRange === '7d' ? '₹1,22,500' : '₹31,500'}
                    </span>
                  </div>
                  <div className="text-[10px] text-[#6ffbbe] font-mono border-t border-white/10 pt-1 w-full flex justify-between">
                    <span>Performance Delta:</span>
                    <span className="font-bold">+5.9% (+₹1,750)</span>
                  </div>
                </div>
              )}
            </div>

            {/* Axis Labels */}
            <div className="flex justify-between text-[#5e5e65] font-mono text-xs mt-1 px-2">
              {timeRange === 'today' ? (
                <>
                  <span>10:00 AM</span>
                  <span>12:00 PM</span>
                  <span>02:00 PM</span>
                  <span>04:00 PM</span>
                  <span>06:00 PM</span>
                  <span>08:00 PM</span>
                  <span>10:00 PM</span>
                </>
              ) : timeRange === '7d' ? (
                <>
                  <span>Mon 18</span>
                  <span>Tue 19</span>
                  <span>Wed 20</span>
                  <span>Thu 21</span>
                  <span>Fri 22</span>
                  <span>Sat 23</span>
                  <span>Today</span>
                </>
              ) : timeRange === '30d' ? (
                <>
                  <span>Oct 01</span>
                  <span>Oct 07</span>
                  <span>Oct 14</span>
                  <span>Oct 21 (Diwali Prep)</span>
                  <span>Oct 28</span>
                  <span>Today</span>
                </>
              ) : (
                <>
                  <span>May</span>
                  <span>Jun</span>
                  <span>Jul</span>
                  <span>Aug</span>
                  <span>Sep</span>
                  <span>Oct (Festive)</span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 mt-3 glass-subtle px-4 py-2.5 rounded-xl border border-[#efeeec]/70">
            <div className="flex items-center gap-4 text-xs font-medium flex-wrap">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-1 bg-[#bb0012] rounded-full"></span>
                <span className="text-[#1a1c1b]">
                  {timeRange === 'today' ? 'Today (₹1,31,250)' : timeRange === '7d' ? 'Current 7 Days (₹8,45,600)' : 'Current Cycle (₹8,45,600)'}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-1 bg-[#6366f1] rounded-full"></span>
                <span className="text-[#5e5e65]">
                  {timeRange === 'today' ? 'Yesterday (₹1,19,500)' : timeRange === '7d' ? 'Prior 7 Days (₹7,40,300)' : 'Previous 30 Days'}
                </span>
              </div>
            </div>
            <span className="font-mono text-xs text-[#006947] font-bold">
              Java ML Engine: ARIMA Trend Fit 96.4%
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

      {/* Recharts Daily Sales Volume vs Store Target Bar Chart (with Previous Days Data) */}
      <div className="glass-card rounded-2xl shadow-sm border border-[#efeeec]/90 p-5 mb-6 flex flex-col gap-4">
        {/* Card Header & Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-[#f4f3f1] pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#ffdad6]/70 text-[#bb0012] flex items-center justify-center shrink-0 shadow-xs">
              <span className="material-symbols-outlined text-[24px]">bar_chart</span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base lg:text-lg font-bold text-[#1a1c1b] tracking-tight">
                  Daily Sales Volume vs Store Daily Target
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#6ffbbe]/40 text-[#002113] uppercase tracking-wider flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#006947] animate-pulse"></span>
                  Pacing Ahead ({achievementPct}%)
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#f4f3f1] text-[#6366f1]">
                  +{dayOverDayGrowth}% vs Yesterday
                </span>
              </div>
              <p className="text-xs text-[#5e5e65]">
                Multi-day and intraday comparison giving managers a clear snapshot of current performance against Store #104 daily target of {dailyTarget} units and previous days' data
              </p>
            </div>
          </div>

          {/* Controls: Time slice selector & Target Calibration */}
          <div className="flex items-center gap-2 self-start lg:self-auto flex-wrap">
            <div className="flex items-center gap-1 glass-subtle p-1 rounded-xl border border-[#efeeec]/80 text-xs">
              <button
                type="button"
                onClick={() => setChartViewMode('today-vs-yesterday')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all duration-200 ${
                  chartViewMode === 'today-vs-yesterday'
                    ? 'bg-white text-[#bb0012] shadow-xs'
                    : 'text-[#5e5e65] hover:text-[#1a1c1b]'
                }`}
              >
                Today vs Yesterday (Hourly)
              </button>
              <button
                type="button"
                onClick={() => setChartViewMode('7days')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all duration-200 ${
                  chartViewMode === '7days'
                    ? 'bg-white text-[#bb0012] shadow-xs'
                    : 'text-[#5e5e65] hover:text-[#1a1c1b]'
                }`}
              >
                Past 7 Days (vs Prior Week)
              </button>
              <button
                type="button"
                onClick={() => setChartViewMode('14days')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all duration-200 ${
                  chartViewMode === '14days'
                    ? 'bg-white text-[#bb0012] shadow-xs'
                    : 'text-[#5e5e65] hover:text-[#1a1c1b]'
                }`}
              >
                Past 14 Days
              </button>
            </div>

            <div className="flex items-center gap-1.5 glass-subtle px-2.5 py-1.5 rounded-xl border border-[#efeeec]/80 text-xs">
              <span className="text-[#5e5e65] font-medium">Daily Target:</span>
              <select
                value={dailyTarget}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setDailyTarget(val);
                  if (addToast) addToast(`Store target adjusted to ${val} units/day`, 'info');
                }}
                className="bg-white border border-[#efeeec] rounded px-2 py-0.5 text-xs font-mono font-bold text-[#1a1c1b] outline-none cursor-pointer"
              >
                <option value={380}>380 units</option>
                <option value={420}>420 units (Standard)</option>
                <option value={450}>450 units</option>
                <option value={500}>500 units (Festive)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Manager Summary Quick Strip (Today vs Previous Days vs Target) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 glass-subtle p-3 rounded-xl border border-[#efeeec]/70">
          <div className="flex flex-col">
            <span className="text-[11px] text-[#5e5e65]">Today's Target Volume</span>
            <span className="text-lg font-bold font-mono text-[#1a1c1b]">
              {dailyTarget} <span className="text-xs font-normal text-[#5e5e65]">units</span>
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] text-[#5e5e65]">Actual Sold Today</span>
            <span className="text-lg font-bold font-mono text-[#bb0012]">
              {todayActualUnits} <span className="text-xs font-normal text-[#5e5e65]">units</span>
            </span>
            <span className="text-[11px] text-[#5e5e65] font-mono">₹{todayRevenue.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] text-[#5e5e65]">Yesterday's Sold Volume</span>
            <span className="text-lg font-bold font-mono text-[#6366f1]">
              {yesterdayActualUnits} <span className="text-xs font-normal text-[#5e5e65]">units</span>
            </span>
            <span className="text-[11px] text-[#006947] font-semibold">
              +{dayOverDayGrowth}% Day-over-Day
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] text-[#5e5e65]">Target Attainment</span>
            <span className="text-lg font-bold font-mono text-[#006947]">
              {achievementPct}%{' '}
              <span className="text-xs font-normal text-[#006947] font-sans">
                ({isAhead ? `+${varianceUnits} surplus` : `${varianceUnits} deficit`})
              </span>
            </span>
            <span className="text-[11px] text-[#5e5e65]">7-Day Baseline: ~{sevenDayPriorAvg}u/d</span>
          </div>
        </div>

        {/* Recharts BarChart Container */}
        <div className="w-full h-72 pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={currentChartData}
              margin={{ top: 12, right: 10, left: -10, bottom: 0 }}
              barGap={4}
            >
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
                unit=" u"
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const dataObj = payload[0]?.payload;
                    const todayVal = dataObj?.today ?? dataObj?.actual ?? 0;
                    const prevVal = dataObj?.yesterday ?? dataObj?.previousWeek ?? dataObj?.previousPeriod ?? 0;
                    const targetVal = dataObj?.target ?? 0;
                    const dodDiff = todayVal - prevVal;
                    const dodPct = prevVal > 0 ? ((dodDiff / prevVal) * 100).toFixed(1) : '0';

                    return (
                      <div className="glass-card-dark text-white p-3.5 rounded-xl shadow-2xl border border-white/10 text-xs font-sans min-w-[240px] backdrop-blur-md">
                        <div className="font-bold text-xs text-[#e3e2e0] border-b border-white/10 pb-1.5 mb-2 font-mono flex items-center justify-between">
                          <span>{label}</span>
                          <span className="text-[10px] text-[#6ffbbe] font-normal">
                            {chartViewMode === 'today-vs-yesterday' 
                              ? 'Today vs Yesterday' 
                              : chartViewMode === '7days' 
                              ? 'Week-over-Week' 
                              : '14-Day Trajectory'}
                          </span>
                        </div>
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center">
                            <span className="text-[#a1a1aa] flex items-center gap-1.5">
                              <span className="w-2.5 h-2.5 rounded-sm bg-[#bb0012]"></span>
                              {chartViewMode === 'today-vs-yesterday' ? "Today's Volume:" : "Current Day Volume:"}
                            </span>
                            <span className="font-mono font-bold text-white">{todayVal} units</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-[#a1a1aa] flex items-center gap-1.5">
                              <span className="w-2.5 h-2.5 rounded-sm bg-[#6366f1]"></span>
                              {chartViewMode === 'today-vs-yesterday' 
                                ? "Yesterday's Volume:" 
                                : chartViewMode === '7days' 
                                ? "Prior Week Same Day:" 
                                : "Prior Period Baseline:"}
                            </span>
                            <span className="font-mono font-semibold text-[#cbd5e1]">{prevVal} units</span>
                          </div>
                          {targetVal > 0 && (
                            <div className="flex justify-between items-center">
                              <span className="text-[#a1a1aa] flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-sm bg-[#cbd5e1]"></span>
                                Pacing Benchmark:
                              </span>
                              <span className="font-mono text-[#cbd5e1]">{targetVal} units</span>
                            </div>
                          )}
                          <div className="flex justify-between items-center pt-1.5 border-t border-white/10">
                            <span className="text-[#a1a1aa]">Comparative Delta:</span>
                            <span className={`font-mono font-bold ${dodDiff >= 0 ? 'text-[#6ffbbe]' : 'text-[#ffb4ab]'}`}>
                              {dodDiff >= 0 ? `+${dodDiff}u (+${dodPct}%)` : `${dodDiff}u (${dodPct}%)`}
                            </span>
                          </div>
                          {dataObj?.todayRevenue && (
                            <div className="flex justify-between items-center text-[11px] text-[#a1a1aa] pt-0.5">
                              <span>Today's Slot Revenue:</span>
                              <span className="font-mono text-white">₹{dataObj.todayRevenue.toLocaleString('en-IN')}</span>
                            </div>
                          )}
                          {dataObj?.yesterdayRevenue && (
                            <div className="flex justify-between items-center text-[10px] text-[#94a3b8]">
                              <span>Yesterday's Slot Revenue:</span>
                              <span className="font-mono text-[#cbd5e1]">₹{dataObj.yesterdayRevenue.toLocaleString('en-IN')}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend 
                verticalAlign="top"
                align="right"
                wrapperStyle={{ paddingBottom: 8, fontSize: 11 }}
                iconType="rect"
              />
              <ReferenceLine 
                y={chartViewMode === 'today-vs-yesterday' ? Math.round(dailyTarget / 7) : dailyTarget} 
                stroke="#d97706" 
                strokeDasharray="4 4"
                label={{ 
                  value: chartViewMode === 'today-vs-yesterday' ? `Avg Target Slot (${Math.round(dailyTarget/7)}u)` : `Daily Target (${dailyTarget}u)`, 
                  fill: '#b45309', 
                  fontSize: 10,
                  position: 'insideTopRight'
                }} 
              />
              {chartViewMode === 'today-vs-yesterday' ? (
                <>
                  <Bar 
                    dataKey="today" 
                    name="Today's Actual Volume (Units)" 
                    fill="#bb0012" 
                    radius={[4, 4, 0, 0]}
                    maxBarSize={30}
                  />
                  <Bar 
                    dataKey="yesterday" 
                    name="Yesterday's Volume (Units)" 
                    fill="#6366f1" 
                    radius={[4, 4, 0, 0]}
                    maxBarSize={30}
                  />
                  <Bar 
                    dataKey="target" 
                    name="Target Benchmark (Units)" 
                    fill="#cbd5e1" 
                    radius={[4, 4, 0, 0]}
                    maxBarSize={30}
                  />
                </>
              ) : chartViewMode === '7days' ? (
                <>
                  <Bar 
                    dataKey="actual" 
                    name="Current Week Volume (Units)" 
                    fill="#bb0012" 
                    radius={[4, 4, 0, 0]}
                    maxBarSize={30}
                  />
                  <Bar 
                    dataKey="previousWeek" 
                    name="Prior Week Same Day (Units)" 
                    fill="#6366f1" 
                    radius={[4, 4, 0, 0]}
                    maxBarSize={30}
                  />
                  <Bar 
                    dataKey="target" 
                    name="Daily Target Benchmark (Units)" 
                    fill="#cbd5e1" 
                    radius={[4, 4, 0, 0]}
                    maxBarSize={30}
                  />
                </>
              ) : (
                <>
                  <Bar 
                    dataKey="actual" 
                    name="Daily Sold Volume (Units)" 
                    fill="#bb0012" 
                    radius={[4, 4, 0, 0]}
                    maxBarSize={16}
                  />
                  <Bar 
                    dataKey="previousPeriod" 
                    name="Prior Period Baseline (Units)" 
                    fill="#6366f1" 
                    radius={[4, 4, 0, 0]}
                    maxBarSize={16}
                  />
                </>
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Manager Insights Footer */}
        <div className="p-3.5 glass-subtle rounded-xl flex flex-col sm:flex-row items-center justify-between text-xs text-[#5e5e65] gap-2 border border-[#efeeec]/70">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-[#006947]">verified</span>
            <span>
              <strong>Manager Performance Snapshot:</strong> Peak hourly sales volume peaked at <strong>08:00 PM (125 units)</strong> vs yesterday's <strong>118 units</strong> (+5.9% DoD). Today's total of <strong>{todayActualUnits} units</strong> is pacing <strong>+{varianceUnits} units (+{achievementPct}%) ahead</strong> of the store daily {dailyTarget}-unit target.
            </span>
          </div>
          <span className="font-mono text-[11px] text-[#006947] shrink-0 font-bold bg-[#6ffbbe]/30 px-3 py-1 rounded-full border border-[#006947]/20">
            Status: Target Exceeded (+{varianceUnits}u) ✓
          </span>
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

      {/* STREAMLIT CLOUD DEPLOYMENT MODAL */}
      {showStreamlitDeployModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl p-6 border border-[#efeeec] flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#efeeec] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-[#ff4b4b]/10 text-[#ff4b4b] flex items-center justify-center font-bold text-sm">
                  st
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#1a1c1b]">Deploy MINISO OS to the Web using Streamlit</h3>
                  <span className="text-xs text-[#5e5e65]">Turnkey deployment instructions for Streamlit Community Cloud</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowStreamlitDeployModal(false)}
                className="p-1 rounded hover:bg-[#f4f3f1] text-[#5e5e65]"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* URL Explanation Banner */}
            <div className="p-3.5 bg-[#fef2f2] border border-[#fecaca] rounded-xl text-xs flex flex-col gap-1.5 text-[#991b1b]">
              <div className="flex items-center gap-1.5 font-bold">
                <span className="material-symbols-outlined text-[18px]">info</span>
                <span>Why did the previous link show "404 Page not found"?</span>
              </div>
              <p className="leading-relaxed text-[#7f1d1d]">
                The URL with <code className="bg-white/80 px-1 py-0.5 rounded font-mono text-[11px]">ais-pre-...</code> is the pre-release container that only serves after explicit publishing. The active live working server running your application is the <strong>Development App URL</strong>:
              </p>
              <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-[#fecaca] font-mono text-[11px] text-[#1a1c1b] break-all">
                <span>https://ais-dev-iyez3lpf4rde4soqy5tpzi-717654492957.asia-east1.run.app/?mode=streamlit</span>
                <button
                  type="button"
                  onClick={handleCopyStreamlitUrl}
                  className="ml-2 px-2.5 py-1 bg-[#ff4b4b] text-white rounded font-sans font-semibold text-[10px] shrink-0"
                >
                  Copy URL
                </button>
              </div>
            </div>

            {/* Deployment Steps to Streamlit Cloud */}
            <div className="space-y-3 text-xs">
              <h4 className="font-bold text-[#1a1c1b] text-sm">How to Deploy to Streamlit Community Cloud (Free):</h4>
              
              <div className="p-3 bg-[#faf9f7] rounded-xl border border-[#efeeec] flex flex-col gap-1">
                <div className="font-bold text-[#1a1c1b]">Step 1: Download Deployment Files</div>
                <p className="text-[#5e5e65]">All files needed (<code className="font-mono">streamlit_app.py</code>, <code className="font-mono">requirements.txt</code>, <code className="font-mono">.streamlit/config.toml</code>) are ready in this repository:</p>
                <div className="flex items-center gap-2 pt-1 flex-wrap">
                  <a
                    href="/api/streamlit/download"
                    download="streamlit_app.py"
                    className="px-3 py-1.5 bg-white border border-[#efeeec] rounded-lg font-semibold text-[#1a1c1b] hover:bg-[#f4f3f1] flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[15px]">download</span>
                    Download streamlit_app.py
                  </a>
                  <a
                    href="/requirements.txt"
                    download="requirements.txt"
                    className="px-3 py-1.5 bg-white border border-[#efeeec] rounded-lg font-semibold text-[#1a1c1b] hover:bg-[#f4f3f1] flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[15px]">download</span>
                    Download requirements.txt
                  </a>
                </div>
              </div>

              <div className="p-3 bg-[#faf9f7] rounded-xl border border-[#efeeec] flex flex-col gap-1">
                <div className="font-bold text-[#1a1c1b]">Step 2: Push to a GitHub Repository</div>
                <p className="text-[#5e5e65]">Create a repository on GitHub (e.g. <code className="font-mono">miniso-retail-streamlit</code>) and push the files:</p>
                <pre className="bg-[#1a1c1b] text-[#6ffbbe] p-2 rounded-lg font-mono text-[11px] overflow-x-auto">
git init && git add . && git commit -m "MINISO Streamlit App"
git remote add origin https://github.com/YOUR_USERNAME/miniso-retail-streamlit.git
git push -u origin main
                </pre>
              </div>

              <div className="p-3 bg-[#faf9f7] rounded-xl border border-[#efeeec] flex flex-col gap-1">
                <div className="font-bold text-[#1a1c1b]">Step 3: Deploy on Streamlit Cloud</div>
                <p className="text-[#5e5e65]">
                  Go to <a href="https://share.streamlit.io" target="_blank" rel="noreferrer" className="text-[#ff4b4b] underline font-semibold">share.streamlit.io</a>, log in with GitHub, click <strong>"New app"</strong>, select your repository and branch, specify <code className="font-mono">streamlit_app.py</code> as Main file path, and click <strong>"Deploy"</strong>!
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[#efeeec]">
              <button
                type="button"
                onClick={() => {
                  setShowStreamlitDeployModal(false);
                  if (onOpenStreamlit) onOpenStreamlit();
                }}
                className="px-4 py-2 rounded-lg bg-[#f0f2f6] text-[#262730] text-xs font-semibold hover:bg-[#e6e9ef]"
              >
                Open Streamlit Mode Now
              </button>
              <button
                type="button"
                onClick={() => setShowStreamlitDeployModal(false)}
                className="px-4 py-2 rounded-lg bg-[#bb0012] text-white text-xs font-semibold hover:bg-[#e7151f]"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
