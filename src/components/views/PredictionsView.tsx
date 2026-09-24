import React, { useState, useEffect } from 'react';
import { RiskSKU } from '../../types/retail';
import { INITIAL_RISK_SKUS } from '../../data/mockData';
import { api } from '../../services/api';
import { MINISO_HISTORICAL_SALES, generatePredictiveForecast, MinisoDailySalesRecord, ForecastPoint, ModelMetrics } from '../../data/minisoSalesDataset';

interface PredictionsViewProps {
  onNavigateTab: (tab: string) => void;
  addToast?: (message: string, type?: 'success' | 'warning' | 'info') => void;
}

export const PredictionsView: React.FC<PredictionsViewProps> = ({ onNavigateTab, addToast }) => {
  const [riskItems] = useState<RiskSKU[]>(INITIAL_RISK_SKUS);
  const [riskFilter, setRiskFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [generatedPos, setGeneratedPos] = useState<Record<string, boolean>>({});
  const [viewMode, setViewMode] = useState<'forecast' | 'dataset'>('forecast');

  // Model Hyperparameters state
  const [algorithm, setAlgorithm] = useState<'ARIMA(2,1,2)' | 'Holt-Winters Multiplicative' | 'Ensemble Hybrid'>('ARIMA(2,1,2)');
  const [festiveSurgePct, setFestiveSurgePct] = useState<number>(38); // +38%
  const [confidenceAlpha, setConfidenceAlpha] = useState<number>(0.95);
  const [horizonDays, setHorizonDays] = useState<number>(30);
  const [isTraining, setIsTraining] = useState<boolean>(false);
  const [trainingMessage, setTrainingMessage] = useState<string | null>(null);

  // Model Results state
  const [forecastData, setForecastData] = useState<ForecastPoint[]>([]);
  const [modelMetrics, setModelMetrics] = useState<ModelMetrics | null>(null);

  // Dataset filter state
  const [datasetSearch, setDatasetSearch] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Initialize model on load
  useEffect(() => {
    const result = generatePredictiveForecast(MINISO_HISTORICAL_SALES, {
      algorithm,
      festiveSurgeFactor: 1 + festiveSurgePct / 100,
      confidenceAlpha,
      horizonDays,
    });
    setForecastData(result.forecast);
    setModelMetrics(result.metrics);
  }, []);

  const handleTrainModel = async () => {
    setIsTraining(true);
    setTrainingMessage(null);
    try {
      // Ping backend model training endpoint
      const res = await api.trainPredictiveModel({
        algorithm,
        festiveSurgeFactor: 1 + festiveSurgePct / 100,
        confidenceAlpha,
        horizonDays,
      });

      if (res && res.forecast && res.metrics) {
        setForecastData(res.forecast);
        setModelMetrics(res.metrics);
        setTrainingMessage(`✓ ${algorithm} calibrated successfully! R²: ${res.metrics.r2Score} | MAPE: ${res.metrics.mape}%`);
      } else {
        // Local fallback calculation
        const localRes = generatePredictiveForecast(MINISO_HISTORICAL_SALES, {
          algorithm,
          festiveSurgeFactor: 1 + festiveSurgePct / 100,
          confidenceAlpha,
          horizonDays,
        });
        setForecastData(localRes.forecast);
        setModelMetrics(localRes.metrics);
        setTrainingMessage(`✓ ${algorithm} trained successfully! R²: ${localRes.metrics.r2Score} | MAPE: ${localRes.metrics.mape}%`);
      }
      setTimeout(() => setTrainingMessage(null), 4000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsTraining(false);
    }
  };

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
    downloadAnchor.setAttribute('download', 'miniso_phoenix_mall_historical_sales.csv');
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleDownloadJson = () => {
    const jsonStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(MINISO_HISTORICAL_SALES, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonStr);
    downloadAnchor.setAttribute('download', 'miniso_sales_dataset.json');
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleGeneratePo = (skuId: string) => {
    setGeneratedPos((prev) => ({ ...prev, [skuId]: true }));
    setTimeout(() => {
      setGeneratedPos((prev) => ({ ...prev, [skuId]: false }));
      if (addToast) addToast(`Supplier Purchase Order dispatched for SKU ${skuId}. Estimated freight arrival: 48 Hours via Central Hub.`, 'success');
    }, 1000);
  };

  const filteredRiskItems = riskItems.filter((item) => {
    if (riskFilter === 'all') return true;
    return item.riskLevel === riskFilter;
  });

  const filteredDataset = MINISO_HISTORICAL_SALES.filter((row) => {
    const matchCat = categoryFilter === 'all' || row.topCategory.toLowerCase().includes(categoryFilter.toLowerCase());
    const matchSearch =
      row.date.includes(datasetSearch) ||
      row.festiveEvent.toLowerCase().includes(datasetSearch.toLowerCase()) ||
      row.topSellingItem.toLowerCase().includes(datasetSearch.toLowerCase()) ||
      row.dayOfWeek.toLowerCase().includes(datasetSearch.toLowerCase());
    return matchCat && matchSearch;
  });

  // Calculate dynamic totals from forecast
  const pred7DayTotal = forecastData.slice(0, 7).reduce((sum, f) => sum + f.predictedSales, 0);
  const pred30DayTotal = forecastData.reduce((sum, f) => sum + f.predictedSales, 0);
  const totalUnitsProjected = forecastData.reduce((sum, f) => sum + f.predictedUnits, 0);

  return (
    <div className="flex flex-col w-full gap-5 pb-12">
      {/* Page Header & Operational Triggers */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="bg-[#bb0012]/10 text-[#bb0012] text-xs px-2.5 py-0.5 rounded-full uppercase tracking-wider font-semibold">
              MINISO Machine Learning Suite
            </span>
            <span className="text-[#5e5e65] font-mono text-xs flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#006947] animate-pulse"></span>
              Model: {algorithm} • Conf: {modelMetrics ? modelMetrics.confidenceScore : 96.4}%
            </span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold text-[#1a1c1b] tracking-tight">
            Demand Prediction &amp; Sales Machine Learning Model
          </h1>
          <p className="text-sm text-[#5e5e65]">
            Trained on 90-day MINISO Phoenix Mall Flagship sales dataset with Diwali seasonal lift, 7-day cyclical shopping patterns, and Monte Carlo stockout risk estimation.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start lg:self-center flex-wrap">
          {/* Mode Switcher */}
          <div className="bg-[#f4f3f1] p-1 rounded-lg flex items-center gap-1 border border-[#efeeec]">
            <button
              type="button"
              onClick={() => setViewMode('forecast')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
                viewMode === 'forecast' ? 'bg-white text-[#1a1c1b] shadow-sm' : 'text-[#5e5e65] hover:text-[#1a1c1b]'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">trending_up</span>
              <span>Predictive Model</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('dataset')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
                viewMode === 'dataset' ? 'bg-white text-[#1a1c1b] shadow-sm' : 'text-[#5e5e65] hover:text-[#1a1c1b]'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">dataset</span>
              <span>MINISO Sales Dataset</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleDownloadCsv}
            className="bg-white text-[#1a1c1b] text-xs font-semibold px-3.5 py-2 rounded-lg shadow-sm border border-[#efeeec] hover:bg-[#f4f3f1] transition-all flex items-center gap-1.5"
            title="Download real CSV dataset"
          >
            <span className="material-symbols-outlined text-[18px] text-[#006947]">table_view</span>
            <span>Download Dataset (CSV)</span>
          </button>
        </div>
      </div>

      {trainingMessage && (
        <div className="bg-[#12221b] text-emerald-300 text-xs px-4 py-2.5 rounded-lg border border-emerald-500/30 flex items-center justify-between">
          <span className="font-mono font-medium">{trainingMessage}</span>
          <span className="text-[11px] opacity-75">Trained against {MINISO_HISTORICAL_SALES.length} historical daily records</span>
        </div>
      )}

      {/* Top 4 Forecast Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-[#efeeec] hover:shadow-md transition-shadow flex flex-col justify-between gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#5e5e65] uppercase tracking-wider font-semibold">Predicted 7-Day Sales</span>
            <span className="bg-[#006947]/10 text-[#006947] p-1.5 rounded-lg">
              <span className="material-symbols-outlined text-[18px]">query_stats</span>
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            <div className="text-2xl font-bold text-[#1a1c1b] tracking-tight font-mono">
              ₹{pred7DayTotal.toLocaleString('en-IN')}
            </div>
            <div className="flex items-center gap-1 text-[#006947] text-xs font-semibold">
              <span className="material-symbols-outlined text-[15px]">arrow_upward</span>
              <span>+38.5% Diwali surge anticipated</span>
            </div>
          </div>
          <span className="text-[11px] text-[#5e5e65]">Model confidence: <strong>{modelMetrics?.confidenceScore || 96.4}%</strong></span>
        </div>

        {/* Card 2 */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-[#efeeec] hover:shadow-md transition-shadow flex flex-col justify-between gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#5e5e65] uppercase tracking-wider font-semibold">Predicted {horizonDays}-Day Volume</span>
            <span className="bg-[#bb0012]/10 text-[#bb0012] p-1.5 rounded-lg">
              <span className="material-symbols-outlined text-[18px]">inventory</span>
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            <div className="text-2xl font-bold text-[#1a1c1b] tracking-tight font-mono">
              {totalUnitsProjected.toLocaleString('en-IN')} <span className="text-sm font-normal text-[#5e5e65]">units</span>
            </div>
            <div className="flex items-center gap-1 text-[#bb0012] text-xs font-semibold">
              <span className="material-symbols-outlined text-[15px]">trending_up</span>
              <span>₹{pred30DayTotal.toLocaleString('en-IN')} total gross</span>
            </div>
          </div>
          <span className="text-[11px] text-[#5e5e65]">Peak demand in days <strong>8–14</strong></span>
        </div>

        {/* Card 3 */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-[#efeeec] hover:shadow-md transition-shadow flex flex-col justify-between gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#5e5e65] uppercase tracking-wider font-semibold">Model Accuracy (R² / MAPE)</span>
            <span className="bg-sky-50 text-sky-700 p-1.5 rounded-lg">
              <span className="material-symbols-outlined text-[18px]">verified</span>
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            <div className="text-2xl font-bold text-[#1a1c1b] tracking-tight font-mono">
              R² = {modelMetrics?.r2Score || 0.952}
            </div>
            <div className="flex items-center gap-1 text-sky-700 text-xs font-semibold">
              <span className="material-symbols-outlined text-[15px]">check_circle</span>
              <span>MAPE: {modelMetrics?.mape || 3.8}% error margin</span>
            </div>
          </div>
          <span className="text-[11px] text-[#5e5e65]">RMSE: <strong>{modelMetrics?.rmse || 88.4} units/day</strong></span>
        </div>

        {/* Card 4 */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-[#efeeec] hover:shadow-md transition-shadow flex flex-col justify-between gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#5e5e65] uppercase tracking-wider font-semibold">High-Risk Stockout SKUs</span>
            <span className="bg-[#ffdad6] text-[#93000a] p-1.5 rounded-lg">
              <span className="material-symbols-outlined text-[18px]">warning</span>
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            <div className="text-2xl font-bold text-[#ba1a1a] tracking-tight">14 Products</div>
            <div className="flex items-center gap-1 text-[#ba1a1a] text-xs font-semibold">
              <span className="material-symbols-outlined text-[15px]">priority_high</span>
              <span>Urgent replenishment required</span>
            </div>
          </div>
          <div className="w-full bg-[#e9e8e6] h-1.5 rounded-full overflow-hidden mt-1">
            <div className="bg-[#ba1a1a] h-full rounded-full" style={{ width: '92%' }}></div>
          </div>
        </div>
      </div>

      {/* Main View Mode: Forecast & Interactive Model */}
      {viewMode === 'forecast' ? (
        <>
          {/* Interactive Model Hyperparameter Control Panel */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-[#efeeec] flex flex-col gap-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-[#f4f3f1]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#bb0012]/10 text-[#bb0012] flex items-center justify-center font-bold">
                  <span className="material-symbols-outlined text-[18px]">tune</span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#1a1c1b]">Interactive Model Hyperparameter Calibration</h3>
                  <p className="text-xs text-[#5e5e65]">Tune statistical parameters and festival lift multipliers to recalculate demand forecasts.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleTrainModel}
                disabled={isTraining}
                className="bg-[#bb0012] hover:bg-[#e7151f] text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-sm hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center gap-1.5 disabled:opacity-50 shrink-0"
              >
                <span className={`material-symbols-outlined text-[18px] ${isTraining ? 'animate-spin' : ''}`}>
                  {isTraining ? 'autorenew' : 'model_training'}
                </span>
                <span>{isTraining ? 'Calibrating Model...' : 'Train & Calibrate Model'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Algorithm */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#1a1c1b]">Forecasting Algorithm</label>
                <select
                  value={algorithm}
                  onChange={(e) => setAlgorithm(e.target.value as any)}
                  className="bg-[#f4f3f1] text-[#1a1c1b] text-xs py-2 px-2.5 rounded-lg border border-[#efeeec] outline-none font-medium cursor-pointer"
                >
                  <option value="ARIMA(2,1,2)">ARIMA(2,1,2) + 7-Day Seasonality</option>
                  <option value="Holt-Winters Multiplicative">Holt-Winters Multiplicative</option>
                  <option value="Ensemble Hybrid">Ensemble Hybrid (ARIMA + Poisson)</option>
                </select>
                <span className="text-[10px] text-[#5e5e65]">Best for retail POS transaction flow</span>
              </div>

              {/* Diwali Surge Multiplier */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center text-xs">
                  <label className="font-semibold text-[#1a1c1b]">Festive Lift Multiplier</label>
                  <span className="font-mono font-bold text-[#bb0012]">+{festiveSurgePct}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="80"
                  step="2"
                  value={festiveSurgePct}
                  onChange={(e) => setFestiveSurgePct(Number(e.target.value))}
                  className="accent-[#bb0012] cursor-pointer mt-1"
                />
                <span className="text-[10px] text-[#5e5e65]">Diwali Dhanteras &amp; Lakshmi Puja surge</span>
              </div>

              {/* Forecast Horizon */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#1a1c1b]">Forecast Horizon</label>
                <div className="flex items-center gap-1 bg-[#f4f3f1] p-1 rounded-lg border border-[#efeeec]">
                  {[7, 14, 30].map(days => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => setHorizonDays(days)}
                      className={`flex-1 py-1 text-xs font-semibold rounded-md transition-all ${
                        horizonDays === days ? 'bg-white text-[#1a1c1b] shadow-xs' : 'text-[#5e5e65]'
                      }`}
                    >
                      {days} Days
                    </button>
                  ))}
                </div>
                <span className="text-[10px] text-[#5e5e65]">Planning window for supplier replenishment</span>
              </div>

              {/* Confidence Interval */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#1a1c1b]">Confidence Interval (α)</label>
                <div className="flex items-center gap-1 bg-[#f4f3f1] p-1 rounded-lg border border-[#efeeec]">
                  {[0.90, 0.95, 0.99].map(alpha => (
                    <button
                      key={alpha}
                      type="button"
                      onClick={() => setConfidenceAlpha(alpha)}
                      className={`flex-1 py-1 text-xs font-semibold rounded-md transition-all ${
                        confidenceAlpha === alpha ? 'bg-white text-[#1a1c1b] shadow-xs' : 'text-[#5e5e65]'
                      }`}
                    >
                      {Math.round(alpha * 100)}%
                    </button>
                  ))}
                </div>
                <span className="text-[10px] text-[#5e5e65]">Monte Carlo upper/lower error bounds</span>
              </div>
            </div>
          </div>

          {/* Urgent Festival Highlight Callout Box */}
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[#ffdad6]/80 via-[#ffdad6]/30 to-[#f4f3f1] p-5 shadow-sm border border-[#ffb4ab]">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 relative z-10">
              <div className="flex items-start gap-3.5 max-w-3xl">
                <div className="w-11 h-11 rounded-xl bg-[#bb0012] text-white flex items-center justify-center shrink-0 shadow-md">
                  <span className="material-symbols-outlined text-[24px]">campaign</span>
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="bg-[#bb0012] text-white text-[11px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Urgent Action Required
                    </span>
                    <span className="text-sm font-bold text-[#1a1c1b]">
                      Diwali High-Velocity Out-of-Stock Warning (12 Days Remaining)
                    </span>
                  </div>
                  <p className="text-xs text-[#1a1c1b] leading-relaxed">
                    Statistical simulation indicates that <strong className="text-[#bb0012]">Sanrio Plush Toys (Kuromi, Cinnamoroll)</strong> and{' '}
                    <strong className="text-[#bb0012]">Festive Aromatherapy Diya Sets</strong> will exhaust completely 4.2 days prior to Diwali eve at current customer velocity.
                  </p>
                  <div className="flex items-center gap-4 text-[#5e5e65] text-xs mt-0.5 flex-wrap">
                    <span className="flex items-center gap-1 font-semibold text-[#006947]">
                      <span className="material-symbols-outlined text-[15px]">check_circle</span>
                      Recommended Allocation: +250 Gift Sets &amp; +180 Plush Toys
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[15px]">account_balance_wallet</span>
                      Required Capital: <strong className="text-[#1a1c1b]">₹1,65,000</strong>
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex sm:flex-row flex-col items-center gap-2.5 shrink-0 w-full lg:w-auto">
                <button
                  type="button"
                  onClick={() => {
                    if (addToast) addToast('All 14 automated purchase orders approved and transmitted to Central Bhiwandi Warehouse Hub!', 'success');
                    onNavigateTab('inventory');
                  }}
                  className="w-full sm:w-auto bg-[#bb0012] hover:bg-[#e7151f] text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-md transition-all flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[18px]">shopping_cart_checkout</span>
                  <span>Approve Automated Purchase Orders</span>
                </button>
              </div>
            </div>
          </div>

          {/* Main Visual Chart Card */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-[#efeeec] flex flex-col gap-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pb-2 border-b border-[#f4f3f1]">
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-[#1a1c1b]">
                    Fitted Demand Trajectory vs Forward Projected Sales ({horizonDays} Days)
                  </h2>
                  <span className="bg-[#f4f3f1] text-[#5e5e65] font-mono text-[11px] px-2 py-0.5 rounded font-medium">
                    {algorithm} • Conf {modelMetrics?.confidenceScore || 96.4}%
                  </span>
                </div>
                <p className="text-xs text-[#5e5e65]">
                  Time-series projection combining past 90-day baseline with festival lift ({festiveSurgePct}%) and {Math.round(confidenceAlpha * 100)}% confidence envelope.
                </p>
              </div>

              <div className="flex items-center gap-3.5 flex-wrap text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-0.5 bg-[#9e9e9e]"></div>
                  <span className="text-[#5e5e65]">Baseline Demand</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-0.5 bg-[#ba1a1a]"></div>
                  <span className="text-[#ba1a1a] font-semibold">Predicted Demand</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 bg-[#ba1a1a]/15 rounded-sm border border-[#ba1a1a]/30"></div>
                  <span className="text-[#5e5e65]">{Math.round(confidenceAlpha * 100)}% Confidence Bounds</span>
                </div>
              </div>
            </div>

            {/* Interactive Forecast Bar & Curve Visualization */}
            <div className="w-full overflow-x-auto py-2">
              <div className="min-w-[700px] h-64 flex items-end gap-1.5 pt-6 pb-2 px-2 relative border-b border-[#efeeec]">
                {/* Background Peak Highlight Area */}
                <div 
                  className="absolute top-2 bottom-6 bg-[#ba1a1a]/5 border-x border-dashed border-[#ba1a1a]/30 rounded flex items-start justify-center pt-1 pointer-events-none"
                  style={{ left: '26%', width: '22%' }}
                >
                  <span className="bg-[#bb0012] text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-xs">
                    🪔 Diwali Peak Surge (+{festiveSurgePct}%)
                  </span>
                </div>

                {forecastData.map((pt, idx) => {
                  const maxUnits = 4500;
                  const barHeightPct = Math.min(100, Math.max(15, (pt.predictedUnits / maxUnits) * 100));
                  const isPeak = pt.isPeakEvent;

                  return (
                    <div 
                      key={idx} 
                      className="flex-1 flex flex-col items-center justify-end h-full relative group cursor-pointer"
                    >
                      {/* Tooltip on hover */}
                      <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col bg-[#1a1c1b] text-white p-2.5 rounded-lg shadow-xl text-[11px] z-30 min-w-[160px] pointer-events-none">
                        <span className="font-bold text-amber-300">{pt.date} ({pt.label})</span>
                        {pt.eventLabel && <span className="text-red-400 font-semibold">{pt.eventLabel}</span>}
                        <div className="flex justify-between mt-1 text-gray-300">
                          <span>Units:</span>
                          <strong className="text-white font-mono">{pt.predictedUnits.toLocaleString('en-IN')} pcs</strong>
                        </div>
                        <div className="flex justify-between text-gray-300">
                          <span>Gross:</span>
                          <strong className="text-emerald-400 font-mono">₹{pt.predictedSales.toLocaleString('en-IN')}</strong>
                        </div>
                        <div className="flex justify-between text-gray-400 text-[10px] mt-0.5 border-t border-gray-700 pt-0.5">
                          <span>Bounds:</span>
                          <span>{pt.lowerBound} – {pt.upperBound}</span>
                        </div>
                      </div>

                      {/* Bar indicator */}
                      <div 
                        className={`w-full rounded-t transition-all duration-300 relative ${
                          isPeak 
                            ? 'bg-gradient-to-t from-[#bb0012] to-[#ff5449] shadow-sm' 
                            : 'bg-gradient-to-t from-[#d0d0d5] to-[#ba1a1a]/70 group-hover:bg-[#ba1a1a]'
                        }`}
                        style={{ height: `${barHeightPct}%` }}
                      >
                        {isPeak && (
                          <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-[10px] font-bold text-[#bb0012]">
                            ★
                          </div>
                        )}
                      </div>

                      {/* X-axis label */}
                      <span className="text-[10px] text-[#5e5e65] mt-1 truncate w-full text-center font-mono">
                        {idx % 3 === 0 ? pt.label : '•'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Model Diagnostic Summary Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3 bg-[#f4f3f1] rounded-lg text-xs">
              <div className="flex flex-col">
                <span className="text-[#5e5e65] text-[11px]">Model Architecture</span>
                <span className="font-semibold text-[#1a1c1b]">{modelMetrics?.algorithm || algorithm}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[#5e5e65] text-[11px]">Training Sample Size</span>
                <span className="font-semibold text-[#1a1c1b]">{MINISO_HISTORICAL_SALES.length} Daily Observations (Phoenix Mall)</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[#5e5e65] text-[11px]">Mean Abs % Error (MAPE)</span>
                <span className="font-semibold text-[#006947] font-mono">{modelMetrics?.mape || 3.8}% (High Precision)</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[#5e5e65] text-[11px]">AIC / Loss Function</span>
                <span className="font-semibold text-[#1a1c1b] font-mono">{modelMetrics?.aic || 418.5} • Last fit {modelMetrics?.lastTrained || 'Live'}</span>
              </div>
            </div>
          </div>

          {/* Stockout Risk SKU Table */}
          <div className="bg-white rounded-xl shadow-sm border border-[#efeeec] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-[#f4f3f1] flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex flex-col">
                <h3 className="font-bold text-sm text-[#1a1c1b]">High Risk Stockout Triage &amp; Replenishment Recommendations</h3>
                <p className="text-xs text-[#5e5e65]">SKUs where predicted 30-day demand exceeds on-hand safety inventory runway.</p>
              </div>

              <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
                <div className="flex items-center gap-1 bg-[#f4f3f1] p-1 rounded-lg border border-[#efeeec]">
                  {(['all', 'high', 'medium', 'low'] as const).map(tier => (
                    <button
                      key={tier}
                      type="button"
                      onClick={() => setRiskFilter(tier)}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-md capitalize transition-all ${
                        riskFilter === tier ? 'bg-white text-[#1a1c1b] shadow-xs' : 'text-[#5e5e65]'
                      }`}
                    >
                      {tier}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (addToast) addToast('Generated Purchase Orders for all 14 High/Medium risk SKUs. Queued in Central Logistics.', 'success');
                    onNavigateTab('inventory');
                  }}
                  className="bg-[#bb0012] text-white text-xs px-3.5 py-1.5 rounded-lg font-semibold flex items-center gap-1 hover:bg-[#e7151f] shadow-sm shrink-0"
                >
                  <span className="material-symbols-outlined text-[16px]">receipt_long</span>
                  <span>Generate All Pending POs</span>
                </button>
              </div>
            </div>

            <div className="w-full overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#f4f3f1] text-[#5e5e65] text-[11px] uppercase tracking-wider font-semibold">
                    <th className="py-2.5 px-4">Product &amp; SKU</th>
                    <th className="py-2.5 px-3 text-right">Physical Stock</th>
                    <th className="py-2.5 px-3 text-right">Pred. 7-Day Demand</th>
                    <th className="py-2.5 px-3 text-right">Pred. 30-Day Demand</th>
                    <th className="py-2.5 px-3 text-right">Recommended Addition</th>
                    <th className="py-2.5 px-3 text-center">Stockout Risk Level</th>
                    <th className="py-2.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f4f3f1] text-xs">
                  {filteredRiskItems.map((item) => {
                    const isPoDispatched = generatedPos[item.id];
                    return (
                      <tr key={item.id} className="hover:bg-[#f4f3f1]/50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-[#f4f3f1] flex items-center justify-center shrink-0 text-[#bb0012]">
                              <span className="material-symbols-outlined text-[18px]">
                                {item.riskLevel === 'high' ? 'warning' : 'inventory_2'}
                              </span>
                            </div>
                            <div className="flex flex-col">
                              <span className="font-semibold text-sm text-[#1a1c1b]">{item.name}</span>
                              <span className="font-mono text-[11px] text-[#5e5e65]">
                                {item.sku} • {item.tag}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-semibold text-[#ba1a1a]">
                          {item.physicalStock} pcs
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-[#1a1c1b]">{item.pred7DayDemand} pcs</td>
                        <td className="py-3 px-3 text-right font-mono font-semibold text-[#1a1c1b]">
                          {item.pred30DayDemand} pcs
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-[#bb0012]">
                          +{item.recommendedAddition} units
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              item.riskLevel === 'high'
                                ? 'bg-[#ffdad6] text-[#93000a]'
                                : item.riskLevel === 'medium'
                                ? 'bg-[#e4e1ea] text-[#1b1b21]'
                                : 'bg-[#6ffbbe]/40 text-[#002113]'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                item.riskLevel === 'high'
                                  ? 'bg-[#ba1a1a] animate-pulse'
                                  : item.riskLevel === 'medium'
                                  ? 'bg-[#5e5e65]'
                                  : 'bg-[#006947]'
                              }`}
                            ></span>
                            {item.riskLevel === 'high' ? 'High Risk' : item.riskLevel === 'medium' ? 'Medium Risk' : 'Low / Safe'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleGeneratePo(item.id)}
                            className={`text-xs font-semibold px-3 py-1.5 rounded-lg shadow-sm transition-all inline-flex items-center gap-1 ${
                              isPoDispatched
                                ? 'bg-[#006947] text-white'
                                : 'bg-[#bb0012] hover:bg-[#e7151f] text-white'
                            }`}
                          >
                            <span className="material-symbols-outlined text-[14px]">
                              {isPoDispatched ? 'check' : 'post_add'}
                            </span>
                            <span>{isPoDispatched ? 'PO Sent' : 'Generate Supplier PO'}</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* MINISO Historical Sales Dataset Explorer */
        <div className="bg-white rounded-xl shadow-sm border border-[#efeeec] overflow-hidden flex flex-col gap-4 p-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-[#f4f3f1]">
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="bg-[#006947]/10 text-[#006947] text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  Store #104 Daily Ledger
                </span>
                <span className="font-mono text-xs text-[#5e5e65]">90 Days • 105,420 Units • ₹1.12 Cr Revenue</span>
              </div>
              <h3 className="text-base font-bold text-[#1a1c1b] mt-1">MINISO Phoenix Mall Flagship Historical Sales Dataset</h3>
              <p className="text-xs text-[#5e5e65]">Real store transaction flow used to train ARIMA demand projection and stockout risk models.</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDownloadCsv}
                className="bg-[#006947] hover:bg-[#005237] text-white text-xs font-semibold px-3.5 py-2 rounded-lg shadow-sm transition-all flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">file_download</span>
                <span>Export CSV</span>
              </button>
              <button
                type="button"
                onClick={handleDownloadJson}
                className="bg-white hover:bg-[#f4f3f1] text-[#1a1c1b] text-xs font-semibold px-3.5 py-2 rounded-lg border border-[#efeeec] shadow-sm transition-all flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">data_object</span>
                <span>Export JSON</span>
              </button>
            </div>
          </div>

          {/* Dataset Filters */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#5e5e65] text-[18px]">
                search
              </span>
              <input
                type="text"
                placeholder="Search date, festival event, or top SKU..."
                value={datasetSearch}
                onChange={(e) => setDatasetSearch(e.target.value)}
                className="w-full bg-[#f4f3f1] text-[#1a1c1b] text-xs pl-9 pr-3 py-2 rounded-lg border border-[#efeeec] outline-none"
              />
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-[#f4f3f1] text-[#1a1c1b] text-xs py-2 px-3 rounded-lg border border-[#efeeec] outline-none cursor-pointer"
              >
                <option value="all">All Departments</option>
                <option value="toys">Toys &amp; Plushies</option>
                <option value="home">Home &amp; Festive</option>
                <option value="beauty">Beauty &amp; Perfumery</option>
                <option value="stationery">Stationery</option>
                <option value="collectibles">Collectibles / Blind Box</option>
              </select>
            </div>
          </div>

          {/* Dataset Table */}
          <div className="w-full overflow-x-auto rounded-lg border border-[#efeeec]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#f4f3f1] text-[#5e5e65] text-[11px] uppercase tracking-wider font-semibold">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Day</th>
                  <th className="py-2.5 px-3 text-right">Footfall</th>
                  <th className="py-2.5 px-3 text-right">Receipts</th>
                  <th className="py-2.5 px-3 text-right">Units Sold</th>
                  <th className="py-2.5 px-3 text-right">Gross Sales (₹)</th>
                  <th className="py-2.5 px-3">Top Merchandise Department</th>
                  <th className="py-2.5 px-3">Event / Seasonality Factor</th>
                  <th className="py-2.5 px-3 text-center">Festival Lift</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f4f3f1] text-xs font-mono">
                {filteredDataset.slice(0, 30).map((row, idx) => (
                  <tr key={idx} className="hover:bg-[#f4f3f1]/60 transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-[#1a1c1b]">{row.date}</td>
                    <td className="py-2.5 px-3 font-sans text-[#5e5e65]">{row.dayOfWeek}</td>
                    <td className="py-2.5 px-3 text-right text-[#1a1c1b]">{row.footfall.toLocaleString('en-IN')}</td>
                    <td className="py-2.5 px-3 text-right text-[#1a1c1b]">{row.transactionsCount.toLocaleString('en-IN')}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-[#bb0012]">{row.unitsSold.toLocaleString('en-IN')}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-[#006947]">₹{row.grossSales.toLocaleString('en-IN')}</td>
                    <td className="py-2.5 px-3 font-sans text-[#1a1c1b] truncate max-w-[180px]">
                      {row.topCategory}
                    </td>
                    <td className="py-2.5 px-3 font-sans">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                        row.festiveLiftPercent > 25 ? 'bg-amber-100 text-amber-900' : 'text-[#5e5e65]'
                      }`}>
                        {row.festiveEvent}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`font-bold ${row.festiveLiftPercent > 0 ? 'text-[#bb0012]' : 'text-gray-400'}`}>
                        {row.festiveLiftPercent > 0 ? `+${row.festiveLiftPercent}%` : '—'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between text-xs text-[#5e5e65] pt-1">
            <span>Showing top 30 of {filteredDataset.length} historical daily records</span>
            <span className="font-sans">Click <strong>Export CSV</strong> above for full uncompressed tabular dataset.</span>
          </div>
        </div>
      )}
    </div>
  );
};
