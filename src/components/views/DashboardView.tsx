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
  const [chartViewMode, setChartViewMode] = useState<'hourly' | '7days'>('hourly');

  // Today's Intraday Hourly Volume vs Target
  const hourlySalesVolumeData = [
    { slot: '10:00 AM', actual: 28, target: Math.round(dailyTarget * 0.05), revenue: 7000 },
    { slot: '12:00 PM', actual: 52, target: Math.round(dailyTarget * 0.10), revenue: 13000 },
    { slot: '02:00 PM', actual: 64, target: Math.round(dailyTarget * 0.12), revenue: 16000 },
    { slot: '04:00 PM', actual: 78, target: Math.round(dailyTarget * 0.15), revenue: 19500 },
    { slot: '06:00 PM', actual: 108, target: Math.round(dailyTarget * 0.22), revenue: 27000 },
    { slot: '08:00 PM', actual: 125, target: Math.round(dailyTarget * 0.24), revenue: 31250 },
    { slot: '10:00 PM', actual: 70, target: Math.round(dailyTarget * 0.12), revenue: 17500 },
  ];

  // 7-Day Performance vs Daily Store Target
  const weeklySalesVolumeData = [
    { slot: 'Mon Oct 18', actual: 380, target: dailyTarget, revenue: 95000 },
    { slot: 'Tue Oct 19', actual: 410, target: dailyTarget, revenue: 102500 },
    { slot: 'Wed Oct 20', actual: 395, target: dailyTarget, revenue: 98750 },
    { slot: 'Thu Oct 21', actual: 435, target: dailyTarget, revenue: 108750 },
    { slot: 'Fri Oct 22', actual: 485, target: dailyTarget, revenue: 121250 },
    { slot: 'Sat Oct 23', actual: 560, target: Math.round(dailyTarget * 1.15), revenue: 140000 },
    { slot: 'Sun Oct 24 (Today)', actual: 525, target: dailyTarget, revenue: 131250 },
  ];

  const currentChartData = chartViewMode === 'hourly' ? hourlySalesVolumeData : weeklySalesVolumeData;
  const todayActualUnits = hourlySalesVolumeData.reduce((acc, d) => acc + d.actual, 0); // 525 units
  const todayRevenue = hourlySalesVolumeData.reduce((acc, d) => acc + d.revenue, 0); // ₹1,31,250
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
        <div className="bg-white p-5 rounded-xl shadow-sm border border-[#efeeec] hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs uppercase tracking-wider text-[#5e5e65] font-semibold">Total Gross Sales</span>
            <div className="w-8 h-8 rounded-lg bg-[#6ffbbe]/30 flex items-center justify-center text-[#002113]">
              <span className="material-symbols-outlined text-[18px]">payments</span>
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
        <div className="bg-white p-5 rounded-xl shadow-sm border border-[#efeeec] hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs uppercase tracking-wider text-[#5e5e65] font-semibold">Total POS Receipts</span>
            <div className="w-8 h-8 rounded-lg bg-[#e4e1ea] flex items-center justify-center text-[#1b1b21]">
              <span className="material-symbols-outlined text-[18px]">receipt_long</span>
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
        <div className="bg-white p-5 rounded-xl shadow-sm border border-[#efeeec] hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs uppercase tracking-wider text-[#5e5e65] font-semibold">Catalog SKUs</span>
            <div className="w-8 h-8 rounded-lg bg-[#e9e8e6] flex items-center justify-center text-[#1a1c1b]">
              <span className="material-symbols-outlined text-[18px]">inventory</span>
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
        <div className="bg-white p-5 rounded-xl shadow-sm border border-[#efeeec] hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs uppercase tracking-wider text-[#ba1a1a] font-semibold">Low Stock Threshold</span>
            <div className="w-8 h-8 rounded-lg bg-[#ffdad6] flex items-center justify-center text-[#93000a]">
              <span className="material-symbols-outlined text-[18px]">warning</span>
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
        <div className="lg:col-span-8 bg-white p-5 rounded-xl shadow-sm border border-[#efeeec] flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-lg text-[#1a1c1b] font-bold">Sales Analytics &amp; Revenue Velocity</h2>
                <p className="text-xs text-[#5e5e65]">Daily store turnover and footfall throughput patterns</p>
              </div>
              {/* Timeframe selector */}
              <div className="inline-flex bg-[#f4f3f1] p-1 rounded-lg self-start">
                {(['today', '7d', '30d', '6m'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTimeRange(t)}
                    className={`px-3 py-1 rounded text-xs transition-all ${
                      timeRange === t
                        ? 'bg-white text-[#1a1c1b] font-bold shadow-sm'
                        : 'text-[#5e5e65] hover:text-[#1a1c1b]'
                    }`}
                  >
                    {t === 'today' ? 'Today' : t === '7d' ? '7 Days' : t === '30d' ? '30 Days' : '6 Months'}
                  </button>
                ))}
              </div>
            </div>

            {/* Metric Callouts Strip */}
            <div className="grid grid-cols-3 gap-3 mb-4 bg-[#f4f3f1] p-3 rounded-lg">
              <div>
                <span className="text-xs text-[#5e5e65] block font-medium">Peak Daily Turn</span>
                <span className="font-mono text-base font-bold text-[#1a1c1b]">₹42,150</span>
                <span className="text-xs text-[#006947] block font-semibold">Sat Peak</span>
              </div>
              <div>
                <span className="text-xs text-[#5e5e65] block font-medium">Basket Conversion</span>
                <span className="font-mono text-base font-bold text-[#1a1c1b]">68.4%</span>
                <span className="text-xs text-[#5e5e65] block">+3.1% vs avg</span>
              </div>
              <div>
                <span className="text-xs text-[#5e5e65] block font-medium">Rush Window</span>
                <span className="font-mono text-base font-bold text-[#1a1c1b]">18:00 - 21:00</span>
                <span className="text-xs text-[#bb0012] font-semibold block">Evening Surge</span>
              </div>
            </div>

            {/* SVG Interactive Area Chart */}
            <div className="relative w-full h-64 mt-2">
              <svg className="w-full h-full cursor-crosshair" preserveAspectRatio="none" viewBox="0 0 760 220">
                <defs>
                  <linearGradient id="minisoAreaGrad" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#bb0012" stopOpacity="0.25"></stop>
                    <stop offset="100%" stopColor="#bb0012" stopOpacity="0.00"></stop>
                  </linearGradient>
                  <linearGradient id="secondaryAreaGrad" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#006947" stopOpacity="0.15"></stop>
                    <stop offset="100%" stopColor="#006947" stopOpacity="0.00"></stop>
                  </linearGradient>
                </defs>
                {/* Horizontal Grid lines */}
                <line stroke="#efeeec" strokeWidth="1" x1="0" x2="760" y1="30" y2="30"></line>
                <line stroke="#efeeec" strokeWidth="1" x1="0" x2="760" y1="80" y2="80"></line>
                <line stroke="#efeeec" strokeWidth="1" x1="0" x2="760" y1="130" y2="130"></line>
                <line stroke="#efeeec" strokeWidth="1" x1="0" x2="760" y1="180" y2="180"></line>

                {/* Area 2 (Prior Cycle Comparison) */}
                <path d="M 10 160 Q 90 150 160 145 T 310 130 T 460 140 T 610 120 T 750 110 L 750 210 L 10 210 Z" fill="url(#secondaryAreaGrad)"></path>
                <path d="M 10 160 Q 90 150 160 145 T 310 130 T 460 140 T 610 120 T 750 110" fill="none" stroke="#00855b" strokeDasharray="4 4" strokeWidth="1.5"></path>

                {/* Area 1 (Current Period Sales) */}
                <path d="M 10 150 Q 80 140 140 90 T 260 110 T 380 60 T 500 120 T 620 40 T 750 55 L 750 210 L 10 210 Z" fill="url(#minisoAreaGrad)"></path>
                <path d="M 10 150 Q 80 140 140 90 T 260 110 T 380 60 T 500 120 T 620 40 T 750 55" fill="none" stroke="#bb0012" strokeLinecap="round" strokeWidth="3"></path>

                {/* Active Data Points */}
                <circle cx="140" cy="90" fill="#bb0012" r="4" className="cursor-pointer" onClick={() => setHoveredPoint(140)}></circle>
                <circle cx="380" cy="60" fill="#bb0012" r="4" className="cursor-pointer" onClick={() => setHoveredPoint(380)}></circle>
                <circle cx="620" cy="40" fill="#bb0012" r="6" stroke="#ffffff" strokeWidth="2" className="cursor-pointer animate-pulse" onClick={() => setHoveredPoint(620)}></circle>
              </svg>

              {/* Floating Data Annotation Tooltip */}
              {hoveredPoint === 620 && (
                <div className="absolute left-[72%] top-[8%] -translate-x-1/2 bg-[#1a1c1b] text-white p-2.5 px-3 rounded-lg shadow-xl pointer-events-none flex flex-col items-start gap-0.5 border border-white/10 z-10">
                  <span className="text-[10px] text-[#e3e2e0] uppercase tracking-wider font-semibold">Oct 24 • Saturday Rush</span>
                  <div className="flex items-center gap-2 font-mono font-bold text-sm">
                    <span className="text-[#6ffbbe]">₹38,420</span>
                    <span className="text-[#e3e2e0] font-normal text-xs">| 112 orders</span>
                  </div>
                </div>
              )}
            </div>

            {/* Axis Labels */}
            <div className="flex justify-between text-[#5e5e65] font-mono text-xs mt-1 px-2">
              <span>Oct 01</span>
              <span>Oct 07</span>
              <span>Oct 14</span>
              <span>Oct 21 (Diwali Prep)</span>
              <span>Oct 28</span>
              <span>Today</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 mt-3 bg-[#f4f3f1] px-4 py-2 rounded-lg">
            <div className="flex items-center gap-4 text-xs font-medium">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-1 bg-[#bb0012] rounded-full"></span>
                <span className="text-[#1a1c1b]">Current Cycle (₹8,45,600)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-1 bg-[#006947] rounded-full"></span>
                <span className="text-[#5e5e65]">Previous 30 Days</span>
              </div>
            </div>
            <span className="font-mono text-xs text-[#006947] font-bold">Java ML Engine: ARIMA Trend Fit 96.4%</span>
          </div>
        </div>

        {/* Right: Festival Demand Prediction Spotlight (4 cols) */}
        <div className="lg:col-span-4 bg-white p-5 rounded-xl shadow-sm border border-[#efeeec] flex flex-col justify-between relative overflow-hidden">
          <div className="absolute -right-12 -top-12 w-44 h-44 rounded-full bg-[#bb0012]/10 blur-2xl pointer-events-none"></div>
          <div className="flex flex-col gap-4 relative z-10">
            {/* Festive Badge Banner */}
            <div className="bg-gradient-to-r from-[#bb0012] to-[#e7151f] p-4 rounded-xl text-white flex flex-col gap-1.5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold tracking-wider uppercase bg-white/20 px-2 py-0.5 rounded">
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
            <div className="bg-[#f4f3f1] p-3.5 rounded-xl flex flex-col gap-2">
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
            <div className="bg-[#f4f3f1] p-3.5 rounded-xl flex flex-col gap-1.5">
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
            <div className="bg-[#ffdad6]/70 p-3 rounded-lg flex items-start gap-2.5 border border-[#ffb4ab]">
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
              className="w-full bg-[#1a1c1b] hover:bg-[#2f3130] text-white font-semibold text-sm py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm"
            >
              <span className="material-symbols-outlined text-[18px]">psychology</span>
              <span>View AI Allocation Plan</span>
            </button>
          </div>
        </div>
      </div>

      {/* Recharts Daily Sales Volume vs Store Target Bar Chart */}
      <div className="bg-white rounded-xl shadow-sm border border-[#efeeec] p-5 mb-6 flex flex-col gap-4">
        {/* Card Header & Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-[#f4f3f1] pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#ffdad6]/60 text-[#bb0012] flex items-center justify-center shrink-0">
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
              </div>
              <p className="text-xs text-[#5e5e65]">
                Intraday throughput snapshot giving managers a real-time comparison against Store #104 daily target of {dailyTarget} units
              </p>
            </div>
          </div>

          {/* Controls: Slot toggle & Target Calibration */}
          <div className="flex items-center gap-2 self-start lg:self-auto flex-wrap">
            <div className="flex items-center gap-1 bg-[#f4f3f1] p-1 rounded-lg border border-[#efeeec] text-xs">
              <button
                type="button"
                onClick={() => setChartViewMode('hourly')}
                className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
                  chartViewMode === 'hourly'
                    ? 'bg-white text-[#bb0012] shadow-xs'
                    : 'text-[#5e5e65] hover:text-[#1a1c1b]'
                }`}
              >
                Today's Hourly Slots
              </button>
              <button
                type="button"
                onClick={() => setChartViewMode('7days')}
                className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
                  chartViewMode === '7days'
                    ? 'bg-white text-[#bb0012] shadow-xs'
                    : 'text-[#5e5e65] hover:text-[#1a1c1b]'
                }`}
              >
                Past 7 Days
              </button>
            </div>

            <div className="flex items-center gap-1.5 bg-[#f4f3f1] px-2.5 py-1.5 rounded-lg border border-[#efeeec] text-xs">
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

        {/* Manager Summary Quick Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#faf9f7] p-3 rounded-xl border border-[#efeeec]">
          <div className="flex flex-col">
            <span className="text-[11px] text-[#5e5e65]">Today's Target Volume</span>
            <span className="text-lg font-bold font-mono text-[#1a1c1b]">
              {dailyTarget} <span className="text-xs font-normal text-[#5e5e65]">units</span>
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] text-[#5e5e65]">Actual Sold Volume</span>
            <span className="text-lg font-bold font-mono text-[#bb0012]">
              {todayActualUnits} <span className="text-xs font-normal text-[#5e5e65]">units</span>
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
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] text-[#5e5e65]">Attributed Day Sales</span>
            <span className="text-lg font-bold font-mono text-[#1a1c1b]">
              ₹{todayRevenue.toLocaleString('en-IN')}
            </span>
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
                    const actualVal = (payload.find(p => p.dataKey === 'actual')?.value as number) || 0;
                    const targetVal = (payload.find(p => p.dataKey === 'target')?.value as number) || 0;
                    const diff = actualVal - targetVal;
                    const dataObj = payload[0]?.payload;
                    return (
                      <div className="bg-[#1a1c1b] text-white p-3 rounded-xl shadow-xl border border-white/10 text-xs font-sans min-w-[210px]">
                        <div className="font-bold text-xs text-[#e3e2e0] border-b border-white/10 pb-1 mb-2 font-mono">
                          {label}
                        </div>
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center">
                            <span className="text-[#a1a1aa] flex items-center gap-1.5">
                              <span className="w-2.5 h-2.5 rounded-sm bg-[#bb0012]"></span>
                              Actual Sold Volume:
                            </span>
                            <span className="font-mono font-bold text-white">{actualVal} units</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-[#a1a1aa] flex items-center gap-1.5">
                              <span className="w-2.5 h-2.5 rounded-sm bg-[#94a3b8]"></span>
                              Pacing Target:
                            </span>
                            <span className="font-mono font-semibold text-[#cbd5e1]">{targetVal} units</span>
                          </div>
                          <div className="flex justify-between items-center pt-1 border-t border-white/10">
                            <span className="text-[#a1a1aa]">Performance Variance:</span>
                            <span className={`font-mono font-bold ${diff >= 0 ? 'text-[#6ffbbe]' : 'text-[#ffb4ab]'}`}>
                              {diff >= 0 ? `+${diff} units (Ahead)` : `${diff} units (Behind)`}
                            </span>
                          </div>
                          {dataObj?.revenue && (
                            <div className="flex justify-between items-center text-[10px] text-[#a1a1aa] pt-0.5">
                              <span>Period Turnover:</span>
                              <span className="font-mono text-white">₹{dataObj.revenue.toLocaleString('en-IN')}</span>
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
                y={chartViewMode === 'hourly' ? Math.round(dailyTarget / 7) : dailyTarget} 
                stroke="#d97706" 
                strokeDasharray="4 4"
                label={{ 
                  value: chartViewMode === 'hourly' ? `Avg Target Slot (${Math.round(dailyTarget/7)}u)` : `Daily Target (${dailyTarget}u)`, 
                  fill: '#b45309', 
                  fontSize: 10,
                  position: 'insideTopRight'
                }} 
              />
              <Bar 
                dataKey="actual" 
                name="Actual Sales Volume (Units)" 
                fill="#bb0012" 
                radius={[4, 4, 0, 0]}
                maxBarSize={38}
              />
              <Bar 
                dataKey="target" 
                name="Target Benchmark (Units)" 
                fill="#cbd5e1" 
                radius={[4, 4, 0, 0]}
                maxBarSize={38}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Manager Insights Footer */}
        <div className="p-3 bg-[#f4f3f1] rounded-lg flex flex-col sm:flex-row items-center justify-between text-xs text-[#5e5e65] gap-2">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-[#006947]">verified</span>
            <span>
              <strong>Intraday Manager Insight:</strong> Peak sales volume peaked at <strong>08:00 PM (125 units)</strong>, exceeding slot target by <strong>+30 units</strong>. Store is pacing <strong>+25.0% ahead</strong> of the daily {dailyTarget}-unit objective.
            </span>
          </div>
          <span className="font-mono text-[11px] text-[#006947] shrink-0 font-semibold">
            Status: Daily Target Exceeded ✓
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
