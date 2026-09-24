import React, { useState } from 'react';
import { Product, SaleTransaction, Customer } from '../../types/retail';
import { MINISO_HISTORICAL_SALES, generatePredictiveForecast } from '../../data/minisoSalesDataset';
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
} from 'recharts';

interface StreamlitModeViewProps {
  products: Product[];
  transactions: SaleTransaction[];
  customers: Customer[];
  onOpenPos: () => void;
  onNavigateTab: (tab: string) => void;
  addToast?: (message: string, type?: 'success' | 'warning' | 'info') => void;
}

export const StreamlitModeView: React.FC<StreamlitModeViewProps> = ({
  products,
  transactions,
  customers,
  onOpenPos,
  onNavigateTab,
  addToast,
}) => {
  const [selectedPage, setSelectedPage] = useState<'Overview & Sales' | 'Predictive Demand Model (ARIMA)' | 'MINISO Historical Dataset (CSV)'>('Overview & Sales');
  const [safetyMultiplier, setSafetyMultiplier] = useState(1.38);
  const [showRawJson, setShowRawJson] = useState(false);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('All');
  const [minStockSlider, setMinStockSlider] = useState(10);
  const [isRerunning, setIsRerunning] = useState(false);
  const [modelAlgorithm, setModelAlgorithm] = useState<'ARIMA(2,1,2)' | 'Holt-Winters Multiplicative' | 'Ensemble Hybrid'>('ARIMA(2,1,2)');
  const [forecastHorizon, setForecastHorizon] = useState(30);
  const [dailyTarget, setDailyTarget] = useState(420);
  const [chartTimeSlice, setChartTimeSlice] = useState<'hourly' | '7days'>('hourly');

  // Daily Sales Volume vs Store Target data for Streamlit View
  const hourlyData = [
    { slot: '10:00 AM', actual: 28, target: Math.round(dailyTarget * 0.05), revenue: 7000 },
    { slot: '12:00 PM', actual: 52, target: Math.round(dailyTarget * 0.10), revenue: 13000 },
    { slot: '02:00 PM', actual: 64, target: Math.round(dailyTarget * 0.12), revenue: 16000 },
    { slot: '04:00 PM', actual: 78, target: Math.round(dailyTarget * 0.15), revenue: 19500 },
    { slot: '06:00 PM', actual: 108, target: Math.round(dailyTarget * 0.22), revenue: 27000 },
    { slot: '08:00 PM', actual: 125, target: Math.round(dailyTarget * 0.24), revenue: 31250 },
    { slot: '10:00 PM', actual: 70, target: Math.round(dailyTarget * 0.12), revenue: 17500 },
  ];

  const weeklyData = [
    { slot: 'Mon', actual: 380, target: dailyTarget, revenue: 95000 },
    { slot: 'Tue', actual: 410, target: dailyTarget, revenue: 102500 },
    { slot: 'Wed', actual: 395, target: dailyTarget, revenue: 98750 },
    { slot: 'Thu', actual: 435, target: dailyTarget, revenue: 108750 },
    { slot: 'Fri', actual: 485, target: dailyTarget, revenue: 121250 },
    { slot: 'Sat', actual: 560, target: Math.round(dailyTarget * 1.15), revenue: 140000 },
    { slot: 'Sun (Today)', actual: 525, target: dailyTarget, revenue: 131250 },
  ];

  const activeChartData = chartTimeSlice === 'hourly' ? hourlyData : weeklyData;
  const todayActualUnits = hourlyData.reduce((acc, d) => acc + d.actual, 0);
  const attainmentPct = Math.round((todayActualUnits / dailyTarget) * 100);

  const handleRerun = () => {
    setIsRerunning(true);
    setTimeout(() => {
      setIsRerunning(false);
      if (addToast) addToast('Streamlit state re-executed (Rerun complete)', 'info');
    }, 500);
  };

  const handleCopyStreamlitLink = () => {
    const streamlitUrl = `${window.location.origin}/?mode=streamlit`;
    navigator.clipboard?.writeText(streamlitUrl);
    if (addToast) addToast(`Copied Streamlit direct link: ${streamlitUrl}`, 'success');
  };

  const handleDownloadPythonApp = () => {
    // Fetch the updated local streamlit_app.py file directly
    fetch('/streamlit_app.py')
      .then(res => res.text())
      .then(text => {
        const blob = new Blob([text], { type: 'text/x-python' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'streamlit_app.py';
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        if (addToast) addToast('Downloaded upgraded turnkey streamlit_app.py!', 'success');
      })
      .catch(() => {
        if (addToast) addToast('Downloading fallback python script...', 'info');
      });
  };

  const filteredProducts = products.filter((p) => {
    if (selectedCategoryFilter !== 'All' && p.category !== selectedCategoryFilter.toLowerCase()) {
      return false;
    }
    return p.currentStock >= minStockSlider;
  });

  const { forecast, metrics } = generatePredictiveForecast(MINISO_HISTORICAL_SALES, {
    algorithm: modelAlgorithm,
    festiveSurgeFactor: safetyMultiplier,
    confidenceAlpha: 0.95,
    horizonDays: forecastHorizon,
  });

  const pred7DayTotal = forecast.slice(0, 7).reduce((acc, f) => acc + f.predictedSales, 0);
  const pred30DayTotal = forecast.reduce((acc, f) => acc + f.predictedSales, 0);
  const predUnitsTotal = forecast.reduce((acc, f) => acc + f.predictedUnits, 0);

  const handleDownloadCsv = () => {
    const headers = ['Date', 'DayOfWeek', 'Footfall', 'Transactions', 'UnitsSold', 'GrossSalesINR', 'TopCategory', 'TopSKU', 'TopItem', 'AvgBasketValueINR', 'FestiveEvent', 'FestiveLiftPct'];
    const rows = MINISO_HISTORICAL_SALES.map(r => [
      r.date,
      r.dayOfWeek,
      r.footfall,
      r.transactionsCount,
      r.unitsSold,
      r.grossSales,
      `"${r.topCategory}"`,
      r.topSellingSku,
      `"${r.topSellingItem}"`,
      r.avgBasketValue,
      `"${r.festiveEvent}"`,
      r.festiveLiftPercent,
    ].join(','));
    const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent([headers.join(','), ...rows].join('\n'));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', csvContent);
    downloadAnchor.setAttribute('download', 'miniso_sales_dataset.csv');
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="w-full bg-[#f0f2f6] text-[#262730] font-sans min-h-screen pb-16">
      {/* Streamlit Top Decorative Header Bar */}
      <div className="w-full h-1 bg-[#ff4b4b]"></div>
      <div className="bg-white px-6 py-2 border-b border-[#e6e9ef] flex items-center justify-between text-xs text-[#262730] shadow-xs">
        <div className="flex items-center gap-2 font-mono">
          <span className="font-bold text-[#ff4b4b]">streamlit</span>
          <span className="text-[#808495]">app.py</span>
          {isRerunning && <span className="animate-spin text-[#ff4b4b] material-symbols-outlined text-[14px]">sync</span>}
        </div>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={handleRerun}
            className="hover:text-[#ff4b4b] flex items-center gap-1 font-semibold cursor-pointer"
            title="Rerun Script (R)"
          >
            <span className="material-symbols-outlined text-[16px]">refresh</span>
            <span>Rerun</span>
          </button>
          <div className="h-3 w-px bg-[#e6e9ef]"></div>
          <span className="text-[#808495] font-mono">Running on http://localhost:8501</span>
          <div className="flex items-center gap-1 text-[#5e5e65]">
            <span className="material-symbols-outlined text-[16px]">more_vert</span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6 flex flex-col gap-6">
        {/* Streamlit Main Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-2xl font-bold text-[#262730]">
              <span>🛍️</span>
              <span>MINISO Smart Retail OS — Streamlit App</span>
            </div>
            <p className="text-sm text-[#808495]">
              Interactive data science and machine learning dashboard powered by Streamlit and MINISO Store #104 backend.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleCopyStreamlitLink}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#ff4b4b] hover:bg-[#ff3333] text-white font-semibold text-xs shadow-sm transition-all"
            >
              <span className="material-symbols-outlined text-[16px]">link</span>
              <span>Copy Streamlit Link</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadPythonApp}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white hover:bg-[#f0f2f6] text-[#262730] border border-[#e6e9ef] font-semibold text-xs shadow-xs transition-all"
            >
              <span className="material-symbols-outlined text-[16px]">download</span>
              <span>Download streamlit_app.py</span>
            </button>
          </div>
        </div>

        {/* Streamlit Platform Direct Access Callout */}
        <div className="bg-white p-4 rounded-xl border border-[#ff4b4b]/30 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#ff4b4b]/10 text-[#ff4b4b] flex items-center justify-center font-bold text-sm shrink-0">
              st
            </div>
            <div>
              <div className="font-bold text-[#262730] text-sm">Direct Streamlit Platform URL</div>
              <div className="font-mono text-[#808495] break-all">
                {typeof window !== 'undefined' ? `${window.location.origin}/?mode=streamlit` : 'https://ais-pre-iyez3lpf4rde4soqy5tpzi-717654492957.asia-east1.run.app/?mode=streamlit'}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleCopyStreamlitLink}
              className="px-3 py-1.5 rounded-md bg-[#f0f2f6] hover:bg-[#e6e9ef] text-[#262730] font-semibold flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[15px]">content_copy</span>
              <span>Copy URL</span>
            </button>
          </div>
        </div>

        {/* Streamlit-style Sidebar Widget Box */}
        <div className="bg-white p-4 rounded-xl border border-[#e6e9ef] shadow-sm flex flex-col gap-3">
          <span className="font-bold uppercase tracking-wider text-[#808495] text-xs">st.sidebar Navigation &amp; Widgets</span>
          <div className="flex items-center gap-4 flex-wrap text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold">st.selectbox("Page"):</span>
              <select
                value={selectedPage}
                onChange={(e) => setSelectedPage(e.target.value as any)}
                className="bg-[#f0f2f6] px-2.5 py-1.5 rounded-md outline-none border border-[#e6e9ef] font-semibold text-[#ff4b4b]"
              >
                <option value="Overview & Sales">Overview &amp; Sales</option>
                <option value="Predictive Demand Model (ARIMA)">Predictive Demand Model (ARIMA)</option>
                <option value="MINISO Historical Dataset (CSV)">MINISO Historical Dataset (CSV)</option>
              </select>
            </div>

            {selectedPage === 'Overview & Sales' && (
              <>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">st.selectbox("Category"):</span>
                  <select
                    value={selectedCategoryFilter}
                    onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                    className="bg-[#f0f2f6] px-2.5 py-1.5 rounded-md outline-none border border-[#e6e9ef] font-medium"
                  >
                    <option value="All">All Categories</option>
                    <option value="Toys">Toys</option>
                    <option value="Stationery">Stationery</option>
                    <option value="Beauty">Beauty</option>
                    <option value="Home">Home</option>
                    <option value="Gifts">Gifts</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">st.slider("Min Stock"):</span>
                  <input
                    type="range"
                    min="0"
                    max="50"
                    value={minStockSlider}
                    onChange={(e) => setMinStockSlider(Number(e.target.value))}
                    className="accent-[#ff4b4b] cursor-pointer"
                  />
                  <span className="font-mono font-bold text-[#ff4b4b]">{minStockSlider}</span>
                </div>
              </>
            )}

            {selectedPage === 'Predictive Demand Model (ARIMA)' && (
              <>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">st.selectbox("Algorithm"):</span>
                  <select
                    value={modelAlgorithm}
                    onChange={(e) => setModelAlgorithm(e.target.value as any)}
                    className="bg-[#f0f2f6] px-2.5 py-1.5 rounded-md outline-none border border-[#e6e9ef] font-medium"
                  >
                    <option value="ARIMA(2,1,2)">ARIMA(2,1,2)</option>
                    <option value="Holt-Winters Multiplicative">Holt-Winters Multiplicative</option>
                    <option value="Ensemble Hybrid">Ensemble Hybrid</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">st.slider("Festive Multiplier"):</span>
                  <input
                    type="range"
                    min="1.0"
                    max="1.8"
                    step="0.05"
                    value={safetyMultiplier}
                    onChange={(e) => setSafetyMultiplier(Number(e.target.value))}
                    className="accent-[#ff4b4b] cursor-pointer"
                  />
                  <span className="font-mono font-bold text-[#ff4b4b]">{safetyMultiplier}x</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">st.selectbox("Horizon"):</span>
                  <select
                    value={forecastHorizon}
                    onChange={(e) => setForecastHorizon(Number(e.target.value))}
                    className="bg-[#f0f2f6] px-2.5 py-1.5 rounded-md outline-none border border-[#e6e9ef] font-medium"
                  >
                    <option value={7}>7 Days</option>
                    <option value={14}>14 Days</option>
                    <option value={30}>30 Days</option>
                  </select>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Page Content: Overview & Sales */}
        {selectedPage === 'Overview & Sales' && (
          <>
            {/* Streamlit st.columns metric row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-xl border border-[#e6e9ef] shadow-sm flex flex-col gap-1">
                <span className="text-xs text-[#808495] font-semibold">st.metric("Total Catalog SKUs")</span>
                <span className="text-2xl font-bold text-[#262730]">{products.length}</span>
                <span className="text-xs text-[#006947] font-semibold flex items-center gap-0.5">
                  <span className="material-symbols-outlined text-[14px]">arrow_upward</span>
                  +12 new Diwali SKUs
                </span>
              </div>

              <div className="bg-white p-4 rounded-xl border border-[#e6e9ef] shadow-sm flex flex-col gap-1">
                <span className="text-xs text-[#808495] font-semibold">st.metric("Gross Store Revenue")</span>
                <span className="text-2xl font-bold text-[#262730] font-mono">
                  ₹{transactions.reduce((acc, t) => acc + t.total, 0).toLocaleString('en-IN')}
                </span>
                <span className="text-xs text-[#006947] font-semibold flex items-center gap-0.5">
                  <span className="material-symbols-outlined text-[14px]">arrow_upward</span>
                  +14.2% vs target
                </span>
              </div>

              <div className="bg-white p-4 rounded-xl border border-[#e6e9ef] shadow-sm flex flex-col gap-1">
                <span className="text-xs text-[#808495] font-semibold">st.metric("Total POS Receipts")</span>
                <span className="text-2xl font-bold text-[#262730]">{transactions.length}</span>
                <span className="text-xs text-[#808495]">Avg: ₹1,120 / basket</span>
              </div>

              <div className="bg-white p-4 rounded-xl border border-[#e6e9ef] shadow-sm flex flex-col gap-1">
                <span className="text-xs text-[#808495] font-semibold">st.metric("Loyalty Members")</span>
                <span className="text-2xl font-bold text-[#262730]">{customers.length}</span>
                <span className="text-xs text-[#006947] font-semibold">92% retention rate</span>
              </div>
            </div>

            {/* Daily Sales Volume Bar Chart vs Store Daily Target */}
            <div className="bg-white p-5 rounded-xl border border-[#e6e9ef] shadow-sm flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#e6e9ef] pb-3">
                <div>
                  <h3 className="text-sm font-bold text-[#262730] flex items-center gap-2">
                    <span>🎯</span>
                    <span>st.bar_chart — Daily Sales Volume vs Store Daily Target ({dailyTarget} units)</span>
                  </h3>
                  <p className="text-xs text-[#808495] mt-0.5">
                    Manager snapshot comparing intraday actual sold retail units against Store #104 pacing benchmark.
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-1 bg-[#f0f2f6] p-1 rounded-md text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => setChartTimeSlice('hourly')}
                      className={`px-2.5 py-1 rounded transition-all ${
                        chartTimeSlice === 'hourly' ? 'bg-white text-[#ff4b4b] shadow-xs' : 'text-[#808495]'
                      }`}
                    >
                      Today's Hourly Slots
                    </button>
                    <button
                      type="button"
                      onClick={() => setChartTimeSlice('7days')}
                      className={`px-2.5 py-1 rounded transition-all ${
                        chartTimeSlice === '7days' ? 'bg-white text-[#ff4b4b] shadow-xs' : 'text-[#808495]'
                      }`}
                    >
                      Past 7 Days
                    </button>
                  </div>
                  <div className="flex items-center gap-1 text-xs">
                    <span className="text-[#808495]">Target:</span>
                    <select
                      value={dailyTarget}
                      onChange={(e) => setDailyTarget(Number(e.target.value))}
                      className="bg-[#f0f2f6] border border-[#e6e9ef] rounded px-2 py-1 text-xs font-bold font-mono outline-none"
                    >
                      <option value={380}>380 units</option>
                      <option value={420}>420 units (Standard)</option>
                      <option value={450}>450 units</option>
                      <option value={500}>500 units (Festive)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Quick Stat Pill */}
              <div className="p-2.5 bg-[#f0f2f6] rounded-lg flex items-center justify-between text-xs flex-wrap gap-2">
                <span className="text-[#262730]">
                  <strong>Current Day Units:</strong> {todayActualUnits} / {dailyTarget} units (
                  <strong className="text-[#006947]">{attainmentPct}% target reached</strong>, +{todayActualUnits - dailyTarget} surplus)
                </span>
                <span className="text-[11px] text-[#006947] font-bold bg-[#6ffbbe]/30 px-2 py-0.5 rounded-full">
                  ✓ Target Attained
                </span>
              </div>

              <div className="w-full h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={activeChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e6e9ef" />
                    <XAxis dataKey="slot" tick={{ fontSize: 11, fill: '#808495', fontFamily: 'monospace' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#808495', fontFamily: 'monospace' }} unit=" u" />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const actual = payload.find(p => p.dataKey === 'actual')?.value as number || 0;
                          const target = payload.find(p => p.dataKey === 'target')?.value as number || 0;
                          return (
                            <div className="bg-[#262730] text-white p-2.5 rounded-lg text-xs font-mono">
                              <div className="font-bold text-[#fafafa] mb-1">{label}</div>
                              <div className="text-[#ff4b4b]">Actual: {actual} units</div>
                              <div className="text-[#cbd5e1]">Benchmark: {target} units</div>
                              <div className="text-[#6ffbbe] border-t border-white/20 pt-1 mt-1">
                                Variance: {actual - target >= 0 ? `+${actual - target}` : actual - target} units
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend verticalAlign="top" align="right" wrapperStyle={{ fontSize: 11 }} />
                    <ReferenceLine
                      y={chartTimeSlice === 'hourly' ? Math.round(dailyTarget / 7) : dailyTarget}
                      stroke="#ff4b4b"
                      strokeDasharray="4 4"
                    />
                    <Bar dataKey="actual" name="Actual Sales (Units)" fill="#ff4b4b" radius={[4, 4, 0, 0]} maxBarSize={32} />
                    <Bar dataKey="target" name="Target Benchmark (Units)" fill="#cbd5e1" radius={[4, 4, 0, 0]} maxBarSize={32} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Streamlit st.dataframe Table */}
            <div className="bg-white p-5 rounded-xl border border-[#e6e9ef] shadow-sm flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-[#e6e9ef] pb-2">
                <h3 className="text-sm font-bold text-[#262730]">
                  st.dataframe(inventory_master_df) — {filteredProducts.length} rows
                </h3>
                <span className="text-xs text-[#808495]">Click row to inspect</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-[#f0f2f6] text-[#262730] font-semibold border-b border-[#e6e9ef]">
                    <tr>
                      <th className="py-2 px-3">sku</th>
                      <th className="py-2 px-3">product_name</th>
                      <th className="py-2 px-3">category</th>
                      <th className="py-2 px-3 text-right">price_inr</th>
                      <th className="py-2 px-3 text-right">cost_inr</th>
                      <th className="py-2 px-3 text-right">stock_units</th>
                      <th className="py-2 px-3">status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e6e9ef]">
                    {filteredProducts.map((p) => (
                      <tr key={p.id} className="hover:bg-[#f0f2f6]/70">
                        <td className="py-2 px-3 text-[#ff4b4b] font-bold">{p.sku}</td>
                        <td className="py-2 px-3 font-sans font-medium text-[#262730]">{p.name}</td>
                        <td className="py-2 px-3 text-[#808495] capitalize">{p.category}</td>
                        <td className="py-2 px-3 text-right font-bold text-[#262730]">₹{p.sellingPrice}</td>
                        <td className="py-2 px-3 text-right text-[#808495]">₹{p.costPrice}</td>
                        <td className="py-2 px-3 text-right font-bold text-[#262730]">{p.currentStock}</td>
                        <td className="py-2 px-3">
                          <span className="text-[10px] px-2 py-0.5 rounded font-sans font-bold bg-[#f0f2f6]">
                            {p.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Page Content: Predictive Demand Model (ARIMA) */}
        {selectedPage === 'Predictive Demand Model (ARIMA)' && (
          <>
            {/* Model Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-xl border border-[#e6e9ef] shadow-sm flex flex-col gap-1">
                <span className="text-xs text-[#808495] font-semibold">st.metric("Predicted 7-Day Revenue")</span>
                <span className="text-2xl font-bold text-[#ff4b4b] font-mono">₹{pred7DayTotal.toLocaleString('en-IN')}</span>
                <span className="text-xs text-[#006947] font-semibold">+38.5% Diwali Lift</span>
              </div>
              <div className="bg-white p-4 rounded-xl border border-[#e6e9ef] shadow-sm flex flex-col gap-1">
                <span className="text-xs text-[#808495] font-semibold">st.metric("{forecastHorizon}-Day Unit Demand")</span>
                <span className="text-2xl font-bold text-[#262730] font-mono">{predUnitsTotal.toLocaleString('en-IN')} pcs</span>
                <span className="text-xs text-[#808495]">Gross: ₹{pred30DayTotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="bg-white p-4 rounded-xl border border-[#e6e9ef] shadow-sm flex flex-col gap-1">
                <span className="text-xs text-[#808495] font-semibold">st.metric("R² Variance Score")</span>
                <span className="text-2xl font-bold text-[#006947] font-mono">{metrics.r2Score}</span>
                <span className="text-xs text-[#808495]">MAPE: {metrics.mape}%</span>
              </div>
              <div className="bg-white p-4 rounded-xl border border-[#e6e9ef] shadow-sm flex flex-col gap-1">
                <span className="text-xs text-[#808495] font-semibold">st.metric("Model Confidence")</span>
                <span className="text-2xl font-bold text-[#262730] font-mono">{metrics.confidenceScore}%</span>
                <span className="text-xs text-[#808495]">RMSE: {metrics.rmse} units</span>
              </div>
            </div>

            {/* st.line_chart representation */}
            <div className="bg-white p-5 rounded-xl border border-[#e6e9ef] shadow-sm flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-[#e6e9ef] pb-2">
                <div>
                  <h3 className="text-sm font-bold text-[#262730]">
                    st.line_chart(forecast_df[['predicted_units', 'upper_bound', 'lower_bound']])
                  </h3>
                  <p className="text-xs text-[#808495]">Model: {modelAlgorithm} • Multiplier: {safetyMultiplier}x</p>
                </div>
                <span className="bg-[#ff4b4b]/10 text-[#ff4b4b] text-xs font-bold px-2 py-0.5 rounded">
                  Diwali Peak in Days 8–14
                </span>
              </div>

              <div className="h-60 flex items-end gap-1 px-2 pt-6 pb-2 border-b border-[#e6e9ef]">
                {forecast.map((f, i) => {
                  const maxUnits = 4500;
                  const barHeightPct = Math.min(100, Math.max(10, (f.predictedUnits / maxUnits) * 100));
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                      <div className="absolute bottom-full mb-1 hidden group-hover:flex flex-col bg-[#262730] text-white p-1.5 rounded text-[10px] z-30 pointer-events-none min-w-[120px]">
                        <span className="font-bold text-amber-300">{f.label}</span>
                        <span>Units: {f.predictedUnits} pcs</span>
                        <span>Gross: ₹{f.predictedSales.toLocaleString('en-IN')}</span>
                      </div>
                      <div 
                        className={`w-full rounded-t transition-all ${
                          f.isPeakEvent ? 'bg-[#ff4b4b]' : 'bg-[#262730]'
                        }`}
                        style={{ height: `${barHeightPct}%` }}
                      ></div>
                      <span className="text-[9px] text-[#808495] mt-1 font-mono truncate w-full text-center">
                        {i % 3 === 0 ? f.label : '•'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* Page Content: MINISO Historical Dataset (CSV) */}
        {selectedPage === 'MINISO Historical Dataset (CSV)' && (
          <div className="bg-white p-5 rounded-xl border border-[#e6e9ef] shadow-sm flex flex-col gap-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[#e6e9ef] pb-3">
              <div>
                <h3 className="text-sm font-bold text-[#262730]">
                  st.dataframe(miniso_historical_sales_df) — 90 Days Time-Series
                </h3>
                <p className="text-xs text-[#808495]">Phoenix Mall Flagship Store #104 daily footfall, receipts, units, and festive events.</p>
              </div>
              <button
                type="button"
                onClick={handleDownloadCsv}
                className="bg-[#ff4b4b] hover:bg-[#e03b3b] text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-sm transition-all flex items-center gap-1.5 cursor-pointer self-start md:self-auto"
              >
                <span className="material-symbols-outlined text-[16px]">file_download</span>
                <span>st.download_button("Download CSV")</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-[#f0f2f6] text-[#262730] font-semibold border-b border-[#e6e9ef]">
                  <tr>
                    <th className="py-2 px-3">date</th>
                    <th className="py-2 px-3">day</th>
                    <th className="py-2 px-3 text-right">footfall</th>
                    <th className="py-2 px-3 text-right">receipts</th>
                    <th className="py-2 px-3 text-right">units</th>
                    <th className="py-2 px-3 text-right">gross_sales_inr</th>
                    <th className="py-2 px-3">top_category</th>
                    <th className="py-2 px-3">event</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e6e9ef]">
                  {MINISO_HISTORICAL_SALES.slice(0, 30).map((r, i) => (
                    <tr key={i} className="hover:bg-[#f0f2f6]/70">
                      <td className="py-2 px-3 text-[#ff4b4b] font-bold">{r.date}</td>
                      <td className="py-2 px-3 font-sans text-[#808495]">{r.dayOfWeek}</td>
                      <td className="py-2 px-3 text-right text-[#262730]">{r.footfall.toLocaleString('en-IN')}</td>
                      <td className="py-2 px-3 text-right text-[#262730]">{r.transactionsCount}</td>
                      <td className="py-2 px-3 text-right font-bold text-[#ff4b4b]">{r.unitsSold}</td>
                      <td className="py-2 px-3 text-right font-bold text-[#006947]">₹{r.grossSales.toLocaleString('en-IN')}</td>
                      <td className="py-2 px-3 font-sans text-[#262730]">{r.topCategory}</td>
                      <td className="py-2 px-3 font-sans text-[#808495]">{r.festiveEvent}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Streamlit st.expander */}
        <div className="bg-white rounded-xl border border-[#e6e9ef] overflow-hidden shadow-sm">
          <button
            type="button"
            onClick={() => setShowRawJson(!showRawJson)}
            className="w-full p-4 text-left flex items-center justify-between text-xs font-bold text-[#262730] hover:bg-[#f0f2f6] cursor-pointer"
          >
            <span>st.expander("▶ Inspect Raw JSON Telemetry &amp; Java Engine State")</span>
            <span className="material-symbols-outlined text-[18px]">
              {showRawJson ? 'expand_less' : 'expand_more'}
            </span>
          </button>
          {showRawJson && (
            <div className="p-4 bg-[#262730] text-[#6ffbbe] font-mono text-xs overflow-x-auto max-h-60 border-t border-[#e6e9ef]">
              <pre>
                {JSON.stringify(
                  {
                    daemon: 'com.miniso.retail.sales.SalesEngineDaemon',
                    pid: 4182,
                    jvm_heap_mb: '342 / 1024',
                    db: 'mysql://localhost:3306/miniso_smart_retail',
                    active_transactions: transactions.length,
                    registered_customers: customers.length,
                    active_products: products.length,
                    model_metrics: metrics,
                  },
                  null,
                  2
                )}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
