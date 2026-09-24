import React, { useState, useMemo } from 'react';
import { SaleTransaction, Product } from '../../types/retail';
import { MINISO_HISTORICAL_SALES } from '../../data/minisoSalesDataset';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

interface ReportsViewProps {
  transactions: SaleTransaction[];
  products: Product[];
}

export const ReportsView: React.FC<ReportsViewProps> = ({ transactions, products }) => {
  const [activeMetric, setActiveMetric] = useState<'both' | 'revenue' | 'volume'>('both');

  // Prepare last 30 days data from MINISO historical dataset
  const last30DaysData = useMemo(() => {
    return MINISO_HISTORICAL_SALES.slice(-30).map((record) => {
      const dateObj = new Date(record.date);
      const shortDate = dateObj.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
      return {
        date: record.date,
        shortDate,
        dayOfWeek: record.dayOfWeek,
        revenue: record.grossSales,
        volume: record.unitsSold,
        transactions: record.transactionsCount,
        footfall: record.footfall,
        event: record.festiveEvent,
        lift: record.festiveLiftPercent,
      };
    });
  }, []);

  // 30-day statistical rollups
  const total30DayRevenue = useMemo(() => last30DaysData.reduce((acc, d) => acc + d.revenue, 0), [last30DaysData]);
  const total30DayVolume = useMemo(() => last30DaysData.reduce((acc, d) => acc + d.volume, 0), [last30DaysData]);
  const avgDailyRevenue = Math.round(total30DayRevenue / last30DaysData.length);
  const peakDay = useMemo(() => {
    return [...last30DaysData].sort((a, b) => b.revenue - a.revenue)[0];
  }, [last30DaysData]);

  const totalSales = transactions.reduce((acc, t) => acc + t.total, 0);
  const totalTax = transactions.reduce((acc, t) => acc + t.tax, 0);
  const totalDiscounts = transactions.reduce((acc, t) => acc + t.discount, 0);

  // Export current 30-day analytics (sales volume, revenue, trends) as a CSV file
  const exportAnalyticsCsv = () => {
    const headers = [
      'Date',
      'DayOfWeek',
      'GrossRevenueINR',
      'SalesVolumeUnits',
      'TransactionsCount',
      'FootfallVisitors',
      'AvgOrderValueINR',
      'FestiveEvent',
      'FestiveLiftPct',
    ];

    const rows = last30DaysData.map((d) => [
      d.date,
      d.dayOfWeek,
      d.revenue,
      d.volume,
      d.transactions,
      d.footfall,
      Math.round(d.revenue / d.transactions),
      `"${d.event || 'Regular Trading'}"`,
      d.lift || 0,
    ].join(','));

    const summaryRows = [
      '',
      '# 30-Day Analytics Summary',
      `# Total Gross Revenue (INR),${total30DayRevenue}`,
      `# Total Units Sold,${total30DayVolume}`,
      `# Average Daily Revenue (INR),${avgDailyRevenue}`,
      `# Peak Day,${peakDay ? `${peakDay.date} (${peakDay.dayOfWeek} - INR ${peakDay.revenue})` : 'N/A'}`,
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent([headers.join(','), ...rows, ...summaryRows].join('\n'));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', csvContent);
    downloadAnchor.setAttribute('download', `miniso_store104_sales_trends_analytics_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const downloadReport = (format: string) => {
    if (format === 'csv') {
      const headers = ['TransactionID', 'Timestamp', 'CustomerName', 'CustomerPhone', 'PaymentMethod', 'TaxGST', 'TotalNetINR'];
      const rows = transactions.map((t) => [
        t.id,
        `"${t.time}"`,
        `"${t.customerName}"`,
        `"${t.customerPhone}"`,
        t.paymentMethod,
        t.tax,
        t.total,
      ].join(','));
      const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent([headers.join(','), ...rows].join('\n'));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', csvContent);
      downloadAnchor.setAttribute('download', `miniso_store104_transactions_ledger_${Date.now()}.csv`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      return;
    }

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify({
      store: 'MINISO Store #104 - Phoenix Mall, Mumbai',
      date: new Date().toLocaleDateString(),
      totalSales,
      totalTax,
      totalDiscounts,
      last30DaysAnalytics: {
        totalRevenue: total30DayRevenue,
        totalVolume: total30DayVolume,
        avgDailyRevenue,
        peakDay,
      },
      transactions,
      activeSkus: products.length,
    }, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `miniso_store104_financial_report_${Date.now()}.${format}`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Custom Chart Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload;
      return (
        <div className="bg-[#1a1c1b] text-white p-3 rounded-xl shadow-xl text-xs border border-gray-700 min-w-[200px]">
          <div className="flex items-center justify-between border-b border-gray-700 pb-1.5 mb-2">
            <span className="font-bold text-amber-300">{dataPoint.date} ({dataPoint.dayOfWeek})</span>
            {dataPoint.lift > 0 && (
              <span className="bg-[#bb0012] text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                +{dataPoint.lift}% Lift
              </span>
            )}
          </div>
          {dataPoint.event && dataPoint.event !== 'Regular Trading' && (
            <div className="text-[11px] text-red-300 font-semibold mb-1.5">
              🪔 {dataPoint.event}
            </div>
          )}
          <div className="flex flex-col gap-1 font-mono">
            <div className="flex items-center justify-between text-gray-200">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#bb0012]"></span>
                Gross Revenue:
              </span>
              <strong className="text-white">₹{dataPoint.revenue.toLocaleString('en-IN')}</strong>
            </div>
            <div className="flex items-center justify-between text-gray-200">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#006947]"></span>
                Units Sold:
              </span>
              <strong className="text-emerald-400">{dataPoint.volume.toLocaleString('en-IN')} pcs</strong>
            </div>
            <div className="flex items-center justify-between text-gray-400 text-[11px] pt-1 border-t border-gray-800">
              <span>POS Receipts:</span>
              <span>{dataPoint.transactions}</span>
            </div>
            <div className="flex items-center justify-between text-gray-400 text-[11px]">
              <span>Store Footfall:</span>
              <span>{dataPoint.footfall.toLocaleString('en-IN')} visitors</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col w-full gap-5 pb-12">
      {/* Header and Action Buttons */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-[#bb0012]/10 text-[#bb0012] text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
              Store Ledger &amp; Analytics
            </span>
            <span className="text-xs text-[#5e5e65] font-mono">Phoenix Mall Flagship Store #104</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold text-[#1a1c1b] tracking-tight">
            Store Financial &amp; Operations Reports
          </h1>
          <p className="text-sm text-[#5e5e65]">
            30-day historical sales volume and revenue trendline analytics, daily ledger audits, and cashier reconciliation.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
          <button
            type="button"
            onClick={exportAnalyticsCsv}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#006947] hover:bg-[#005237] text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
            title="Export 30-Day Sales Volume, Revenue, and Trends to CSV"
          >
            <span className="material-symbols-outlined text-[18px]">file_download</span>
            <span>Export Analytics CSV</span>
          </button>
          <button
            type="button"
            onClick={() => downloadReport('json')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white border border-[#efeeec] text-xs font-semibold text-[#1a1c1b] hover:bg-[#f4f3f1] shadow-sm transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            <span>Export JSON Audit</span>
          </button>
          <button
            type="button"
            onClick={() => downloadReport('csv')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#bb0012] text-white text-xs font-semibold hover:bg-[#e7151f] shadow-sm transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">table_chart</span>
            <span>Download CSV Ledger</span>
          </button>
        </div>
      </div>

      {/* Summary Rollup Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-[#efeeec] shadow-sm flex flex-col justify-between gap-1">
          <span className="text-xs text-[#5e5e65] uppercase font-semibold">30-Day Total Revenue</span>
          <div className="text-2xl font-bold text-[#1a1c1b] font-mono">₹{total30DayRevenue.toLocaleString('en-IN')}</div>
          <span className="text-xs text-[#006947] font-semibold flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">trending_up</span>
            Avg: ₹{avgDailyRevenue.toLocaleString('en-IN')} / day
          </span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-[#efeeec] shadow-sm flex flex-col justify-between gap-1">
          <span className="text-xs text-[#5e5e65] uppercase font-semibold">30-Day Sales Volume</span>
          <div className="text-2xl font-bold text-[#006947] font-mono">{total30DayVolume.toLocaleString('en-IN')} <span className="text-sm font-normal text-[#5e5e65]">units</span></div>
          <span className="text-xs text-[#5e5e65]">Past month total units moved</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-[#efeeec] shadow-sm flex flex-col justify-between gap-1">
          <span className="text-xs text-[#5e5e65] uppercase font-semibold">Peak Trading Record</span>
          <div className="text-2xl font-bold text-[#bb0012] font-mono">₹{peakDay ? peakDay.revenue.toLocaleString('en-IN') : '0'}</div>
          <span className="text-xs text-[#bb0012] font-semibold">{peakDay?.date} ({peakDay?.volume.toLocaleString('en-IN')} units)</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-[#efeeec] shadow-sm flex flex-col justify-between gap-1">
          <span className="text-xs text-[#5e5e65] uppercase font-semibold">Collected GST (18%)</span>
          <div className="text-2xl font-bold text-[#1a1c1b] font-mono">₹{totalTax.toFixed(2)}</div>
          <span className="text-xs text-[#5e5e65]">CGST 9% + SGST 9% Reconciled</span>
        </div>
      </div>

      {/* Recharts 30-Day Line Chart Card */}
      <div className="bg-white p-5 rounded-xl border border-[#efeeec] shadow-sm flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#f4f3f1]">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-[#1a1c1b]">
                Daily Sales Volume &amp; Revenue Trends (Last 30 Days)
              </h2>
              <span className="bg-[#006947]/10 text-[#006947] text-[11px] font-bold px-2 py-0.5 rounded">
                Live Recharts
              </span>
            </div>
            <p className="text-xs text-[#5e5e65]">
              Dual-axis time-series correlating daily gross sales revenue (₹ INR) with total physical units sold across Phoenix Mall Flagship.
            </p>
          </div>

          {/* Controls: Metric Toggle & CSV Export */}
          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
            <div className="flex items-center gap-1 bg-[#f4f3f1] p-1 rounded-lg border border-[#efeeec] text-xs">
              <button
                type="button"
                onClick={() => setActiveMetric('both')}
                className={`px-3 py-1 rounded-md font-semibold transition-all ${
                  activeMetric === 'both' ? 'bg-white text-[#1a1c1b] shadow-xs' : 'text-[#5e5e65] hover:text-[#1a1c1b]'
                }`}
              >
                Both
              </button>
              <button
                type="button"
                onClick={() => setActiveMetric('revenue')}
                className={`px-3 py-1 rounded-md font-semibold transition-all ${
                  activeMetric === 'revenue' ? 'bg-white text-[#bb0012] shadow-xs' : 'text-[#5e5e65] hover:text-[#1a1c1b]'
                }`}
              >
                Revenue Only
              </button>
              <button
                type="button"
                onClick={() => setActiveMetric('volume')}
                className={`px-3 py-1 rounded-md font-semibold transition-all ${
                  activeMetric === 'volume' ? 'bg-white text-[#006947] shadow-xs' : 'text-[#5e5e65] hover:text-[#1a1c1b]'
                }`}
              >
                Volume Only
              </button>
            </div>

            <button
              type="button"
              onClick={exportAnalyticsCsv}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-[#efeeec] hover:bg-[#f4f3f1] text-[#006947] text-xs font-semibold shadow-xs transition-all cursor-pointer"
              title="Export 30-Day Sales Volume and Revenue Trendline as CSV"
            >
              <span className="material-symbols-outlined text-[16px]">file_download</span>
              <span>Export Trends CSV</span>
            </button>
          </div>
        </div>

        {/* Recharts Container */}
        <div className="w-full h-80 pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={last30DaysData}
              margin={{ top: 10, right: 20, left: 10, bottom: 25 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f2" vertical={false} />
              <XAxis
                dataKey="shortDate"
                stroke="#808495"
                tick={{ fontSize: 11, fill: '#5e5e65' }}
                tickMargin={10}
                interval={2}
              />
              {/* Left Axis: Revenue */}
              {(activeMetric === 'both' || activeMetric === 'revenue') && (
                <YAxis
                  yAxisId="left"
                  stroke="#bb0012"
                  tick={{ fontSize: 11, fill: '#bb0012' }}
                  tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
                  width={55}
                  domain={['auto', 'auto']}
                />
              )}
              {/* Right Axis: Units Volume */}
              {(activeMetric === 'both' || activeMetric === 'volume') && (
                <YAxis
                  yAxisId="right"
                  orientation={activeMetric === 'volume' ? 'left' : 'right'}
                  stroke="#006947"
                  tick={{ fontSize: 11, fill: '#006947' }}
                  tickFormatter={(val) => `${val}u`}
                  width={50}
                  domain={['auto', 'auto']}
                />
              )}
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="top"
                align="right"
                wrapperStyle={{ paddingBottom: '10px', fontSize: '12px' }}
              />
              {(activeMetric === 'both' || activeMetric === 'revenue') && (
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="revenue"
                  name="Gross Revenue (₹)"
                  stroke="#bb0012"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#bb0012', strokeWidth: 1, stroke: '#ffffff' }}
                  activeDot={{ r: 6, fill: '#bb0012', stroke: '#ffffff', strokeWidth: 2 }}
                />
              )}
              {(activeMetric === 'both' || activeMetric === 'volume') && (
                <Line
                  yAxisId={activeMetric === 'volume' ? 'left' : 'right'}
                  type="monotone"
                  dataKey="volume"
                  name="Sales Volume (Units)"
                  stroke="#006947"
                  strokeWidth={2.5}
                  strokeDasharray={activeMetric === 'both' ? '4 4' : undefined}
                  dot={{ r: 3, fill: '#006947', strokeWidth: 1, stroke: '#ffffff' }}
                  activeDot={{ r: 6, fill: '#006947', stroke: '#ffffff', strokeWidth: 2 }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Chart Key Takeaway / Notes Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-[#f4f3f1] rounded-lg text-xs text-[#5e5e65]">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-[#1a1c1b]">Key Observations:</span>
            <span>Weekend footfall surges (+28% to +42%) account for 58% of gross monthly retail revenue.</span>
          </div>
          <div className="flex items-center gap-3 font-mono shrink-0">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-0.5 bg-[#bb0012]"></span>
              Solid: Revenue
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-0.5 bg-[#006947] border-b border-dashed border-[#006947]"></span>
              Dashed: Volume
            </span>
          </div>
        </div>
      </div>

      {/* Live Transaction Ledger Audit Log */}
      <div className="bg-white rounded-xl shadow-sm border border-[#efeeec] overflow-hidden flex flex-col">
        <div className="p-4 border-b border-[#f4f3f1] flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-[#1a1c1b]">Recent Store Register Ledger Entries</h3>
            <p className="text-xs text-[#5e5e65]">Synchronized with terminal Reg #02 thermal tape output</p>
          </div>
          <span className="bg-[#f4f3f1] text-[#5e5e65] text-xs font-mono px-2 py-0.5 rounded font-medium">
            {transactions.length} Total Receipts
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#f4f3f1] text-[#5e5e65] uppercase font-semibold text-[11px]">
              <tr>
                <th className="py-2.5 px-4">Transaction ID</th>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Customer Profile</th>
                <th className="py-2.5 px-3">Payment Tender</th>
                <th className="py-2.5 px-3 text-right">Tax (18% GST)</th>
                <th className="py-2.5 px-4 text-right">Total Net</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f4f3f1]">
              {transactions.map((t) => (
                <tr key={t.id} className="hover:bg-[#f4f3f1]/40 transition-colors">
                  <td className="py-2.5 px-4 font-mono font-bold text-[#1a1c1b]">{t.id}</td>
                  <td className="py-2.5 px-3 text-[#5e5e65]">{t.time}</td>
                  <td className="py-2.5 px-3">
                    <span className="font-medium text-[#1a1c1b]">{t.customerName}</span>
                    <span className="text-[#5e5e65] text-[11px] block">{t.customerPhone}</span>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className={`px-2 py-0.5 rounded font-semibold text-[10px] ${
                      t.paymentMethod === 'UPI'
                        ? 'bg-blue-50 text-blue-700'
                        : t.paymentMethod === 'Card'
                        ? 'bg-purple-50 text-purple-700'
                        : 'bg-emerald-50 text-emerald-700'
                    }`}>
                      {t.paymentMethod}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-[#5e5e65]">₹{t.tax.toFixed(2)}</td>
                  <td className="py-2.5 px-4 text-right font-mono font-bold text-[#1a1c1b]">
                    ₹{t.total.toLocaleString('en-IN')}.00
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
