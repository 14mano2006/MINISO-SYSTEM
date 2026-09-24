import React, { useState } from 'react';
import { Product } from '../../types/retail';

interface InventoryViewProps {
  products: Product[];
  onReorder: (skuId: string, quantity: number) => Promise<void>;
  addToast?: (message: string, type?: 'success' | 'warning' | 'info') => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  products,
  onReorder,
  addToast,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'critical' | 'toys' | 'stationery' | 'beauty'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dispatchedPos, setDispatchedPos] = useState<Record<string, boolean>>({});
  const [batchDispatched, setBatchDispatched] = useState(false);
  const [isBatchEditModalOpen, setIsBatchEditModalOpen] = useState(false);

  // Batch PO Quantities
  const [batchItems, setBatchItems] = useState([
    { sku: 'MNS-TY-0842', name: 'Kuromi Plushie 30cm', qty: 180, unitCost: 320 },
    { sku: 'MNS-TY-1102', name: 'Cinnamoroll Desktop Fan', qty: 200, unitCost: 450 },
    { sku: 'MNS-HM-0219', name: 'Pastel Water Bottle 750ml', qty: 120, unitCost: 180 },
    { sku: 'MNS-BT-0412', name: 'Velvet Lip Tint Cherry', qty: 100, unitCost: 110 },
    { sku: 'MNS-GF-0901', name: 'Diwali Festive Gift Set', qty: 150, unitCost: 390 },
  ]);

  const handleReorderClick = async (skuId: string, qty: number) => {
    setDispatchedPos((prev) => ({ ...prev, [skuId]: true }));
    await onReorder(skuId, qty);
    setTimeout(() => {
      setDispatchedPos((prev) => ({ ...prev, [skuId]: false }));
    }, 4000);
  };

  const handleBatchDispatch = async () => {
    setBatchDispatched(true);
    try {
      for (const item of batchItems) {
        await onReorder(item.sku, item.qty);
      }
      if (addToast) {
        const totalAmount = batchItems.reduce((acc, i) => acc + i.qty * i.unitCost, 0);
        addToast(`Batch #PO-2024-DIWALI-09 (${batchItems.length} POs totaling ₹${totalAmount.toLocaleString('en-IN')}) dispatched to Miniso Central Warehouse Pune!`, 'success');
      }
    } catch (e) {
      if (addToast) addToast('Error dispatching batch POs', 'warning');
    } finally {
      setBatchDispatched(false);
    }
  };

  const handleExportStockSheet = () => {
    if (products.length === 0) {
      if (addToast) addToast('No products to export', 'warning');
      return;
    }
    const headers = [
      'SKU',
      'ProductName',
      'Category',
      'CurrentStock',
      'SafetyMin',
      'UnitCostINR',
      'SellingPriceINR',
      'ShelfLocation',
      'InventoryStatus',
      'ReorderSuggested'
    ];
    const rows = products.map(p => {
      const suggest = p.currentStock <= p.safetyMin ? p.safetyMin * 3 - p.currentStock : 0;
      return [
        p.sku,
        `"${p.name.replace(/"/g, '""')}"`,
        p.category,
        p.currentStock,
        p.safetyMin,
        p.costPrice,
        p.sellingPrice,
        `"${p.shelfLocation || 'Aisle 01'}"`,
        p.status,
        suggest
      ].join(',');
    });
    const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent([headers.join(','), ...rows].join('\n'));
    const link = document.createElement('a');
    link.setAttribute('href', csvContent);
    link.setAttribute('download', 'miniso_inventory_audit_sheet.csv');
    document.body.appendChild(link);
    link.click();
    link.remove();
    if (addToast) addToast(`Exported ${products.length} stock items to CSV`, 'success');
  };

  const filteredProducts = products.filter((p) => {
    if (filterType === 'critical') return p.status === 'Critical' || p.status === 'Out of Stock';
    if (filterType === 'toys') return p.category === 'toys';
    if (filterType === 'stationery') return p.category === 'stationery';
    if (filterType === 'beauty') return p.category === 'beauty';
    return true;
  }).filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col w-full gap-5 pb-12">
      {/* Header Section */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4 pb-1">
        <div className="flex flex-col gap-1 max-w-3xl">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-[#e9e8e6] text-[#5e5e65] text-xs uppercase tracking-wider font-semibold">
              Store Node #104
            </span>
            <span className="text-[#5e5e65] text-xs">•</span>
            <span className="text-[#006947] text-xs font-semibold flex items-center gap-1">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#006947] animate-pulse"></span> Sync Active (3s ago)
            </span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold text-[#1a1c1b] tracking-tight">
            Inventory Stock Levels &amp; Replenishment Monitor
          </h1>
          <p className="text-sm text-[#5e5e65]">
            Real-time stock tracking, stockout velocity analysis, and automated purchase reorder triggers for lifestyle retail floor.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleExportStockSheet}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white text-[#1a1c1b] text-xs font-semibold shadow-sm border border-[#efeeec] hover:bg-[#f4f3f1] transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            <span>Export Stock Sheet</span>
          </button>
          <button
            type="button"
            onClick={handleBatchDispatch}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#bb0012] text-white text-xs font-semibold shadow-md hover:bg-[#e7151f] transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">bolt</span>
            <span>{batchDispatched ? 'Generating POs...' : 'Generate AI Reorder Recommendations'}</span>
          </button>
        </div>
      </div>

      {/* KPI Grid: 5 Core Health Indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {/* Card 1 */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-[#efeeec] flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#5e5e65] mb-2">
            <span className="text-xs uppercase tracking-wider font-semibold">Total Tracked SKUs</span>
            <span className="material-symbols-outlined text-[20px] text-[#5e5e65]">inventory</span>
          </div>
          <div>
            <div className="text-2xl font-bold text-[#1a1c1b] tracking-tight">1,250</div>
            <div className="mt-1 text-xs text-[#5e5e65]">Active catalog count</div>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-[#efeeec] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase tracking-wider font-semibold text-[#5e5e65]">In Stock</span>
            <span className="material-symbols-outlined text-[20px] text-[#006947]">check_circle</span>
          </div>
          <div>
            <div className="text-2xl font-bold text-[#1a1c1b] tracking-tight">1,142</div>
            <div className="mt-1 flex items-center gap-1 text-xs text-[#006947] font-semibold">
              <span className="px-1.5 py-0.5 rounded bg-[#6ffbbe]/40 text-[#002113]">91.3% ratio</span>
              <span className="text-[#5e5e65] font-normal">Optimal Runway</span>
            </div>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-[#efeeec] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase tracking-wider font-semibold text-[#5e5e65]">Low Stock</span>
            <span className="material-symbols-outlined text-[20px] text-[#b45309]">warning</span>
          </div>
          <div>
            <div className="text-2xl font-bold text-[#1a1c1b] tracking-tight">76</div>
            <div className="mt-1 flex items-center gap-1 text-xs text-[#5e5e65]">
              <span className="px-1.5 py-0.5 rounded bg-[#fffbeb] text-[#b45309] font-bold">Action Needed</span>
              <span>Under safety min</span>
            </div>
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-[#efeeec] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase tracking-wider font-semibold text-[#5e5e65]">Critical / Stockout</span>
            <span className="material-symbols-outlined text-[20px] text-[#ba1a1a]">report_problem</span>
          </div>
          <div>
            <div className="text-2xl font-bold text-[#ba1a1a] tracking-tight">32</div>
            <div className="mt-1 flex items-center gap-1 text-xs text-[#5e5e65]">
              <span className="px-1.5 py-0.5 rounded bg-[#ffdad6] text-[#93000a] font-bold">Urgent PO</span>
              <span>Stockout risk</span>
            </div>
          </div>
        </div>

        {/* Card 5 */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-[#efeeec] flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#5e5e65] mb-2">
            <span className="text-xs uppercase tracking-wider font-semibold">Asset Valuation</span>
            <span className="material-symbols-outlined text-[20px] text-[#5e5e65]">payments</span>
          </div>
          <div>
            <div className="text-2xl font-bold text-[#1a1c1b] tracking-tight font-mono">₹42,80,500</div>
            <div className="mt-1 flex items-center gap-1 text-xs text-[#006947] font-semibold">
              <span className="material-symbols-outlined text-[15px]">trending_up</span>
              <span>Cost basis verified</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stock Health Distribution Visualizer Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-[#efeeec] flex flex-col gap-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-[#1a1c1b]">Store Fleet Stock Health Distribution</span>
            <span className="px-2 py-0.5 rounded-full bg-[#f4f3f1] text-[#5e5e65] font-mono text-xs">
              N=1,250 SKUs
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#006947]"></span>
              <span className="text-[#1a1c1b]">Healthy (91.3% - 1,142)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#b45309]"></span>
              <span className="text-[#1a1c1b]">Warning / Low (6.1% - 76)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#bb0012]"></span>
              <span className="text-[#1a1c1b]">Critical / Exhausted (2.6% - 32)</span>
            </div>
          </div>
        </div>

        {/* Multi-segmented track */}
        <div className="w-full h-3.5 rounded-full bg-[#f4f3f1] overflow-hidden flex shadow-inner">
          <div className="h-full bg-[#006947] transition-all duration-500" style={{ width: '91.3%' }} title="Healthy: 91.3%"></div>
          <div className="h-full bg-[#b45309] transition-all duration-500" style={{ width: '6.1%' }} title="Low: 6.1%"></div>
          <div className="h-full bg-[#bb0012] transition-all duration-500" style={{ width: '2.6%' }} title="Critical: 2.6%"></div>
        </div>

        <div className="flex justify-between items-center text-[#5e5e65] font-mono text-[11px] pt-1">
          <span>Auto-Replenish Buffer Floor: 7 Days Velocity</span>
          <span>Safety Threshold Coefficient: k = 1.35</span>
        </div>
      </div>

      {/* Inventory Filter Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setFilterType('all')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
              filterType === 'all'
                ? 'bg-[#1a1c1b] text-white shadow-sm'
                : 'bg-white hover:bg-[#f4f3f1] text-[#1a1c1b] border border-[#efeeec]'
            }`}
          >
            All Inventory ({products.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('critical')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
              filterType === 'critical'
                ? 'bg-[#bb0012] text-white shadow-sm'
                : 'bg-white hover:bg-[#f4f3f1] text-[#1a1c1b] border border-[#efeeec]'
            }`}
          >
            Critical Only ({products.filter((p) => p.status === 'Critical' || p.status === 'Out of Stock').length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('toys')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
              filterType === 'toys'
                ? 'bg-[#1a1c1b] text-white shadow-sm'
                : 'bg-white hover:bg-[#f4f3f1] text-[#1a1c1b] border border-[#efeeec]'
            }`}
          >
            Toys &amp; Collectibles (248)
          </button>
          <button
            type="button"
            onClick={() => setFilterType('stationery')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
              filterType === 'stationery'
                ? 'bg-[#1a1c1b] text-white shadow-sm'
                : 'bg-white hover:bg-[#f4f3f1] text-[#1a1c1b] border border-[#efeeec]'
            }`}
          >
            Stationery (189)
          </button>
          <button
            type="button"
            onClick={() => setFilterType('beauty')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
              filterType === 'beauty'
                ? 'bg-[#1a1c1b] text-white shadow-sm'
                : 'bg-white hover:bg-[#f4f3f1] text-[#1a1c1b] border border-[#efeeec]'
            }`}
          >
            Beauty &amp; Fragrance (312)
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1 md:w-60">
            <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-[#5e5e65] text-[16px]">
              filter_list
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter current list..."
              className="w-full bg-white text-[#1a1c1b] text-xs pl-8 pr-3 py-1.5 rounded-lg outline-none border border-[#efeeec]"
            />
          </div>
        </div>
      </div>

      {/* Comprehensive Inventory Table */}
      <div className="bg-white rounded-xl shadow-sm border border-[#efeeec] overflow-hidden flex flex-col">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#f4f3f1] text-[#5e5e65] text-[11px] uppercase tracking-wider font-semibold">
                <th className="py-2.5 px-4">Product Details</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3 text-right font-mono">Physical Stock</th>
                <th className="py-2.5 px-3 text-right font-mono">Safety Min</th>
                <th className="py-2.5 px-3 text-right font-mono">Daily Sales</th>
                <th className="py-2.5 px-3 text-right font-mono">Runway</th>
                <th className="py-2.5 px-3 text-right font-mono">Rec. Order Qty</th>
                <th className="py-2.5 px-3 text-center">Stock Status</th>
                <th className="py-2.5 px-4 text-right">Quick Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f4f3f1] text-xs">
              {filteredProducts.map((prod) => {
                const isDispatched = dispatchedPos[prod.id];
                const isCritical = prod.status === 'Critical' || prod.status === 'Out of Stock';
                const isLow = prod.status === 'Low Stock';
                return (
                  <tr
                    key={prod.id}
                    className={`hover:bg-[#f4f3f1]/60 transition-colors ${
                      isCritical ? 'bg-red-50/20' : ''
                    }`}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={prod.imageUrl}
                          alt={prod.name}
                          referrerPolicy="no-referrer"
                          className="w-12 h-12 rounded-lg object-cover bg-[#f4f3f1] shrink-0 border border-black/5"
                        />
                        <div className="flex flex-col">
                          <span className="font-semibold text-sm text-[#1a1c1b]">{prod.name}</span>
                          <div className="flex items-center gap-1.5 font-mono text-[11px] text-[#5e5e65]">
                            <span>SKU: {prod.sku}</span>
                            <span>•</span>
                            <span>{prod.shelfLocation || 'Bay 04A-R2'}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2.5 py-0.5 rounded-full bg-[#f4f3f1] text-[#1a1c1b] text-xs capitalize font-medium">
                        {prod.category}
                      </span>
                    </td>
                    <td
                      className={`py-3 px-3 text-right font-mono font-bold ${
                        isCritical ? 'text-[#ba1a1a]' : isLow ? 'text-[#b45309]' : 'text-[#006947]'
                      }`}
                    >
                      {prod.currentStock}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-[#5e5e65]">{prod.minLevel}</td>
                    <td className="py-3 px-3 text-right font-mono">
                      {prod.dailySales || 6} <span className="text-[10px] text-[#5e5e65]">u/d</span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold">
                      {isCritical ? (
                        <span className="inline-flex items-center gap-1 text-[#ba1a1a]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#ba1a1a] animate-ping"></span>
                          {prod.runwayDays || 1} Days
                        </span>
                      ) : (
                        <span className={isLow ? 'text-[#b45309]' : 'text-[#006947]'}>
                          {prod.runwayDays || 12} Days
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-[#1a1c1b]">
                      +{prod.recOrderQty || 50} units
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                          prod.status === 'In Stock'
                            ? 'bg-[#ecfdf5] text-[#047857]'
                            : prod.status === 'Critical'
                            ? 'bg-[#ffdad6] text-[#93000a]'
                            : 'bg-[#fffbeb] text-[#b45309]'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            prod.status === 'In Stock'
                              ? 'bg-[#047857]'
                              : prod.status === 'Critical'
                              ? 'bg-[#ba1a1a] animate-pulse'
                              : 'bg-[#b45309]'
                          }`}
                        ></span>
                        {prod.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {prod.status === 'In Stock' ? (
                        <span className="text-xs text-[#5e5e65] italic">Sufficient</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleReorderClick(prod.id, prod.recOrderQty || 50)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-all ${
                            isDispatched
                              ? 'bg-[#006947] text-white'
                              : 'bg-[#bb0012] hover:bg-[#e7151f] text-white'
                          }`}
                        >
                          {isDispatched ? 'PO Dispatched' : 'Reorder PO'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="p-3 bg-[#f4f3f1] flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[#5e5e65]">
          <span>Showing {filteredProducts.length} critical flagged SKUs of 1,250 cataloged</span>
          <span className="font-mono text-[#006947] font-semibold">Velocity model: 30-Day Rolling Poisson</span>
        </div>
      </div>

      {/* Bottom Section: Automated Supplier Reorder Batch Suggestion Banner */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-white via-[#f4f3f1] to-[#e9e8e6] p-6 shadow-sm border border-[#efeeec]">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-3.5 max-w-3xl">
            <div className="p-2.5 rounded-xl bg-[#bb0012] text-white shadow-sm shrink-0 mt-0.5">
              <span className="material-symbols-outlined text-[26px]">local_shipping</span>
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#bb0012]">
                  Automated Supplier Reorder Batch Suggestion
                </span>
                <span className="h-1.5 w-1.5 rounded-full bg-[#bb0012]"></span>
                <span className="font-mono text-xs text-[#5e5e65]">Batch #PO-2023-DIWALI-09</span>
              </div>
              <p className="text-sm font-semibold text-[#1a1c1b] leading-snug">
                Java Engine Reorder Optimizer calculated <span className="text-[#bb0012]">5 purchase orders</span>{' '}
                totaling <span className="font-mono font-bold text-[#1a1c1b]">₹1,48,200</span> needed before the Diwali rush.
              </p>
              <div className="flex flex-wrap items-center gap-4 text-[#5e5e65] text-xs mt-1">
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[15px] text-[#1a1c1b]">warehouse</span>
                  <span>Supplier: <strong className="text-[#1a1c1b]">Miniso Central Warehouse Pune</strong></span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[15px] text-[#006947]">schedule</span>
                  <span>Estimated Delivery: <strong className="text-[#1a1c1b]">48 hours</strong></span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[15px] text-[#b45309]">electric_bolt</span>
                  <span>Predicted Stockout Shield: <strong className="text-[#1a1c1b]">99.4%</strong></span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setIsBatchEditModalOpen(true)}
              className="px-4 py-2 rounded-lg bg-white text-[#1a1c1b] text-xs font-semibold shadow-sm hover:bg-[#f4f3f1] border border-[#efeeec] text-center"
            >
              Edit Quantities
            </button>
            <button
              type="button"
              onClick={handleBatchDispatch}
              className="flex items-center justify-center gap-1.5 px-5 py-2 rounded-lg bg-[#bb0012] text-white text-xs font-semibold shadow-md hover:bg-[#e7151f] transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">assignment_turned_in</span>
              <span>Review &amp; Dispatch Purchase Order</span>
            </button>
          </div>
        </div>
      </div>

      {/* BATCH PO QUANTITY EDITOR MODAL */}
      {isBatchEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl p-6 border border-[#efeeec] flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-[#efeeec] pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#bb0012]">edit_note</span>
                <div>
                  <h3 className="text-base font-bold text-[#1a1c1b]">Adjust Batch Replenishment Quantities</h3>
                  <span className="text-[10px] text-[#5e5e65]">Batch #PO-2024-DIWALI-09 • Central Hub Dispatch</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsBatchEditModalOpen(false)}
                className="p-1 rounded hover:bg-[#f4f3f1] text-[#5e5e65]"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
              {batchItems.map((item, idx) => (
                <div key={item.sku} className="p-3 bg-[#faf9f7] rounded-xl border border-[#efeeec] flex items-center justify-between gap-3 text-xs">
                  <div className="flex flex-col flex-1">
                    <span className="font-semibold text-[#1a1c1b]">{item.name}</span>
                    <span className="text-[10px] font-mono text-[#5e5e65]">{item.sku} • ₹{item.unitCost}/unit</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const updated = [...batchItems];
                        updated[idx].qty = Math.max(10, updated[idx].qty - 20);
                        setBatchItems(updated);
                      }}
                      className="w-7 h-7 rounded bg-white border border-[#efeeec] font-bold text-[#1a1c1b] hover:bg-[#f4f3f1]"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      value={item.qty}
                      onChange={(e) => {
                        const updated = [...batchItems];
                        updated[idx].qty = Math.max(0, Number(e.target.value));
                        setBatchItems(updated);
                      }}
                      className="w-16 px-2 py-1 rounded bg-white border border-[#efeeec] text-center font-mono font-bold text-[#1a1c1b] outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const updated = [...batchItems];
                        updated[idx].qty += 20;
                        setBatchItems(updated);
                      }}
                      className="w-7 h-7 rounded bg-white border border-[#efeeec] font-bold text-[#1a1c1b] hover:bg-[#f4f3f1]"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3 bg-[#f4f3f1] rounded-xl flex items-center justify-between text-xs">
              <span className="font-semibold text-[#5e5e65]">Total Batch Estimated Cost:</span>
              <span className="font-mono font-bold text-sm text-[#006947]">
                ₹{batchItems.reduce((acc, i) => acc + i.qty * i.unitCost, 0).toLocaleString('en-IN')}
              </span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#efeeec]">
              <button
                type="button"
                onClick={() => setIsBatchEditModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-[#f4f3f1] text-[#1a1c1b] text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsBatchEditModalOpen(false);
                  if (addToast) addToast('Batch purchase order quantities updated!', 'success');
                }}
                className="px-4 py-2 rounded-lg bg-[#bb0012] hover:bg-[#e7151f] text-white text-xs font-semibold"
              >
                Save Quantities
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
