import React, { useState } from 'react';
import { PromoRule } from '../../types/retail';

interface FestivalsViewProps {
  campaigns: PromoRule[];
  onCreateCampaign: (rule: Partial<PromoRule>) => Promise<void>;
  onNavigateTab: (tab: string) => void;
  addToast?: (message: string, type?: 'success' | 'warning' | 'info') => void;
}

export const FestivalsView: React.FC<FestivalsViewProps> = ({
  campaigns,
  onCreateCampaign,
  onNavigateTab,
  addToast,
}) => {
  const [festivalSelect, setFestivalSelect] = useState('Diwali Mega Sale');
  const [campaignName, setCampaignName] = useState('Diwali Lights Festive Bundle 2024');
  const [discountType, setDiscountType] = useState<'percentage' | 'bogo'>('percentage');
  const [promoCodeInput, setPromoCodeInput] = useState('DIWALI20');
  const [isLaunching, setIsLaunching] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [isPerformanceModalOpen, setIsPerformanceModalOpen] = useState(false);
  const [isHyperparamModalOpen, setIsHyperparamModalOpen] = useState(false);

  const handleLaunchCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLaunching(true);
    try {
      await onCreateCampaign({
        code: promoCodeInput || `FEST-${Math.floor(10 + Math.random() * 90)}`,
        campaign: festivalSelect,
        discountType: discountType === 'percentage' ? '20% Flat OFF' : 'Buy 2 Get 1 Free',
        applicableTargets: 'Gift Hampers, Toys, Fragrances',
        validityWindow: 'Oct 25 - Nov 04',
      });
      if (addToast) addToast(`Campaign "${campaignName}" launched! Broadcasted live to all Phoenix Mall POS registers.`, 'success');
    } finally {
      setIsLaunching(false);
    }
  };

  const handleExportPromotionsCsv = () => {
    if (campaigns.length === 0) {
      if (addToast) addToast('No campaigns to export', 'warning');
      return;
    }
    const headers = ['Code', 'Campaign', 'DiscountType', 'ApplicableTargets', 'ValidityWindow', 'Redemptions', 'RevenueINR', 'TillStatus'];
    const rows = campaigns.map(c => [
      c.code,
      `"${c.campaign}"`,
      `"${c.discountType}"`,
      `"${c.applicableTargets}"`,
      `"${c.validityWindow}"`,
      c.redemptions,
      c.revenueGenerated,
      c.status
    ].join(','));
    const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent([headers.join(','), ...rows].join('\n'));
    const link = document.createElement('a');
    link.setAttribute('href', csvContent);
    link.setAttribute('download', 'miniso_promotions_ledger.csv');
    document.body.appendChild(link);
    link.click();
    link.remove();
    if (addToast) addToast(`Exported ${campaigns.length} promotion rules to CSV`, 'success');
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard?.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="flex flex-col w-full pb-12">
      {/* Top Context & Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="bg-[#bb0012]/10 text-[#bb0012] px-2.5 py-0.5 rounded-full text-xs uppercase tracking-wider font-bold flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">auto_graph</span>
              Seasonal Demand Engine
            </span>
            <span className="text-[#5e5e65] font-mono text-xs">SYNC ID: #FEST-2024-Q4</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold text-[#1a1c1b] tracking-tight">
            Festival Campaign Management &amp; Promotional Offers
          </h1>
          <p className="text-sm text-[#5e5e65] max-w-3xl">
            Align holiday spikes with automated inventory staging, discount schedules, and target customer segments across Phoenix Mall &amp; Regional Stores.
          </p>
        </div>
        <div className="flex items-center gap-2.5 self-start md:self-auto">
          <button
            type="button"
            onClick={() => setIsPerformanceModalOpen(true)}
            className="bg-white hover:bg-[#f4f3f1] text-[#1a1c1b] text-xs font-semibold px-4 py-2.5 rounded-lg shadow-sm border border-[#efeeec] flex items-center gap-1.5 transition-all"
          >
            <span className="material-symbols-outlined text-[18px] text-[#5e5e65]">history</span>
            <span>Offer Performance History</span>
          </button>
          <button
            type="button"
            onClick={() => document.getElementById('campaign-engine-form')?.scrollIntoView({ behavior: 'smooth' })}
            className="bg-[#bb0012] hover:bg-[#e7151f] text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-md hover:scale-[1.01] transition-all flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            <span>+ Create Festival Offer</span>
          </button>
        </div>
      </div>

      {/* Key Seasonal Metrics Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-[#efeeec] flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs uppercase text-[#5e5e65] tracking-wider font-semibold">Active Festival Surge</span>
            <span className="text-2xl font-bold text-[#1a1c1b] mt-0.5">+38.4%</span>
            <span className="text-xs text-[#006947] font-semibold mt-1 flex items-center gap-0.5">
              <span className="material-symbols-outlined text-[14px]">trending_up</span> Diwali vs Non-festive avg
            </span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-[#ffdad6] flex items-center justify-center text-[#bb0012]">
            <span className="material-symbols-outlined text-[22px]">electric_bolt</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-[#efeeec] flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs uppercase text-[#5e5e65] tracking-wider font-semibold">Staged Stock Reserved</span>
            <span className="text-2xl font-bold text-[#1a1c1b] mt-0.5">
              14,280 <span className="text-xs font-normal text-[#5e5e65]">pcs</span>
            </span>
            <span className="text-xs text-[#5e5e65] mt-1">Safety buffer: 82% met</span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-[#f4f3f1] flex items-center justify-center text-[#1a1c1b]">
            <span className="material-symbols-outlined text-[22px]">warehouse</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-[#efeeec] flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs uppercase text-[#5e5e65] tracking-wider font-semibold">Live Festival Vouchers</span>
            <span className="text-2xl font-bold text-[#bb0012] mt-0.5">{campaigns.length} Codes</span>
            <span className="text-xs text-[#006947] font-semibold mt-1 flex items-center gap-0.5">
              <span className="material-symbols-outlined text-[14px]">check_circle</span> 1,842 redemptions
            </span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-[#6ffbbe]/30 flex items-center justify-center text-[#002113]">
            <span className="material-symbols-outlined text-[22px]">loyalty</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-[#efeeec] flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs uppercase text-[#5e5e65] tracking-wider font-semibold">Target Audience Reach</span>
            <span className="text-2xl font-bold text-[#1a1c1b] mt-0.5">18,650</span>
            <span className="text-xs text-[#5e5e65] mt-1">SMS &amp; App Push Enabled</span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-[#e4e1ea] flex items-center justify-center text-[#1b1b21]">
            <span className="material-symbols-outlined text-[22px]">send_to_mobile</span>
          </div>
        </div>
      </div>

      {/* Upcoming Festival Spotlight Cards */}
      <div className="flex flex-col gap-3 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#bb0012] text-[22px]">celebration</span>
            <h2 className="text-base font-bold text-[#1a1c1b]">Upcoming Festival Spotlight</h2>
          </div>
          <span className="text-xs text-[#5e5e65] font-medium">Automated Stock Staging Algorithm v2.4</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Card 1: Diwali Mega Sale */}
          <div className="bg-white rounded-xl shadow-sm border border-[#efeeec] p-5 flex flex-col justify-between relative overflow-hidden transition-all hover:shadow-md">
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">🪔</span>
                  <div>
                    <h3 className="text-base font-bold text-[#1a1c1b] leading-tight">Diwali Mega Sale</h3>
                    <span className="text-xs text-[#5e5e65] font-semibold">Active Countdown: 12 Days Remaining · Nov 01</span>
                  </div>
                </div>
              </div>

              <div className="mt-1 mb-3 bg-[#ffdad6] text-[#93000a] px-2.5 py-1 rounded-lg flex items-center gap-1.5 text-xs font-bold">
                <span className="material-symbols-outlined text-[16px] text-[#ba1a1a]">emergency</span>
                <span>Urgent Stock Staging Required</span>
              </div>

              <div className="w-full h-32 rounded-lg overflow-hidden mb-3 relative shadow-sm">
                <img
                  className="w-full h-full object-cover"
                  alt="Diwali Showcase Area"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDSrNcDyTs8iIbUP6X7YdBowatC3w09Vo14XCoeELVaHpyzZTlBWz6MNHKiCLZWKM7eqz4Y4ynLoWjucTRjTrxW2CSsAr0ntD2hjY-cO5YRNWUJPGwKEzbWStR4AV46iaIoI5PSdchPGDxzO2fyspyhvjyDR646pguhcWoS_o6ZY5KNe8Zo8RlP-OWpJ_YFIldywegMu8eZ3tgY5sAlWJuiwQOHAsaAz9B9esHC52nB8wG9KtueijjWIQ"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-2.5">
                  <span className="text-white text-xs font-semibold">Seasonal Showcase Area 4A</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-3 bg-[#f4f3f1] p-2.5 rounded-lg text-xs">
                <div>
                  <span className="text-[#5e5e65] text-[10px] block font-medium">Expected Surge</span>
                  <span className="text-base font-bold text-[#bb0012]">+38%</span>
                </div>
                <div>
                  <span className="text-[#5e5e65] text-[10px] block font-medium">Stock Buffer</span>
                  <span className="text-base font-bold text-[#ba1a1a]">62% <span className="text-[10px] font-normal text-[#5e5e65]">(Gap: 380 pcs)</span></span>
                </div>
              </div>

              <div className="mb-3">
                <div className="flex justify-between text-[11px] text-[#5e5e65] mb-1">
                  <span>Prepared Warehouse Allocation</span>
                  <span className="font-bold text-[#1a1c1b]">62% (620 / 1,000 u)</span>
                </div>
                <div className="w-full bg-[#e9e8e6] h-2 rounded-full overflow-hidden flex">
                  <div className="bg-[#bb0012] h-full rounded-full" style={{ width: '62%' }}></div>
                </div>
              </div>

              <div className="mb-3">
                <span className="text-[#5e5e65] text-[11px] font-semibold uppercase tracking-wider block mb-1">Popular Focus Categories</span>
                <div className="flex flex-wrap gap-1 text-[11px]">
                  <span className="bg-[#f4f3f1] px-2 py-0.5 rounded text-[#1a1c1b]">Gift Sets</span>
                  <span className="bg-[#f4f3f1] px-2 py-0.5 rounded text-[#1a1c1b]">Scented Candles</span>
                  <span className="bg-[#f4f3f1] px-2 py-0.5 rounded text-[#1a1c1b]">Sanrio Toys</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onNavigateTab('inventory')}
              className="mt-2 w-full bg-[#bb0012] hover:bg-[#e7151f] text-white py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-sm"
            >
              <span className="material-symbols-outlined text-[16px]">inventory</span>
              <span>Resolve Staging Shortage (380u)</span>
            </button>
          </div>

          {/* Card 2: Christmas Carnival */}
          <div className="bg-white rounded-xl shadow-sm border border-[#efeeec] p-5 flex flex-col justify-between relative overflow-hidden transition-all hover:shadow-md">
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">🎄</span>
                  <div>
                    <h3 className="text-base font-bold text-[#1a1c1b] leading-tight">Christmas &amp; New Year</h3>
                    <span className="text-xs text-[#5e5e65] font-semibold">92 Days Remaining · Dec 25</span>
                  </div>
                </div>
              </div>

              <div className="mt-1 mb-3 bg-[#e4e1ea] text-[#1b1b21] px-2.5 py-1 rounded-lg flex items-center gap-1.5 text-xs font-bold">
                <span className="material-symbols-outlined text-[16px]">schedule</span>
                <span>Procurement Scheduled Nov 15</span>
              </div>

              <div className="w-full h-32 rounded-lg overflow-hidden mb-3 relative shadow-sm">
                <img
                  className="w-full h-full object-cover"
                  alt="Christmas Showcase"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBTQO4zVTD_LRQkFdBOC3zH1RtTJN8yHWXavAORNUU_SiZ82o4ERHyWuGbbBaH9aAj5VDckbO2zVOGsKzki6Ihb_f7vrV7u9u6-SnFRpW5gyRv0bq1IGbdIKoZUhvM2V8N_es2_8aryp45YcUrJhdCFk1dPistW-L15VKMoWqz5bCWwLutQVWQAHcVe86zaazcTrNKHLoVnzEG9RY7wcpcv32RGzKXUruqaxLr956cF3McE-X1YdYXcCQ"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-2.5">
                  <span className="text-white text-xs font-semibold">Seasonal Showcase Area 2B</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-3 bg-[#f4f3f1] p-2.5 rounded-lg text-xs">
                <div>
                  <span className="text-[#5e5e65] text-[10px] block font-medium">Expected Surge</span>
                  <span className="text-base font-bold text-[#1a1c1b]">+45%</span>
                </div>
                <div>
                  <span className="text-[#5e5e65] text-[10px] block font-medium">Stock Readiness</span>
                  <span className="text-base font-bold text-[#5e5e65]">28%</span>
                </div>
              </div>

              <div className="mb-3">
                <div className="flex justify-between text-[11px] text-[#5e5e65] mb-1">
                  <span>Forecast Pipeline Allocation</span>
                  <span className="font-bold text-[#1a1c1b]">28% (350 / 1,250 u)</span>
                </div>
                <div className="w-full bg-[#e9e8e6] h-2 rounded-full overflow-hidden flex">
                  <div className="bg-[#5e5e65] h-full rounded-full" style={{ width: '28%' }}></div>
                </div>
              </div>

              <div className="mb-3">
                <span className="text-[#5e5e65] text-[11px] font-semibold uppercase tracking-wider block mb-1">Popular Categories</span>
                <div className="flex flex-wrap gap-1 text-[11px]">
                  <span className="bg-[#f4f3f1] px-2 py-0.5 rounded text-[#1a1c1b]">Winter Plushies</span>
                  <span className="bg-[#f4f3f1] px-2 py-0.5 rounded text-[#1a1c1b]">Thermos Bottles</span>
                  <span className="bg-[#f4f3f1] px-2 py-0.5 rounded text-[#1a1c1b]">Party Stationery</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                if (addToast) addToast('PO Draft #XMAS-2024-01 approved and scheduled for automated release on Nov 15.', 'success');
              }}
              className="mt-2 w-full bg-[#f4f3f1] hover:bg-[#e9e8e6] text-[#1a1c1b] py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all border border-[#efeeec]"
            >
              <span className="material-symbols-outlined text-[16px]">assignment_turned_in</span>
              <span>Review Purchase Order Draft</span>
            </button>
          </div>

          {/* Card 3: Valentine's Day Blossom */}
          <div className="bg-white rounded-xl shadow-sm border border-[#efeeec] p-5 flex flex-col justify-between relative overflow-hidden transition-all hover:shadow-md">
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">💖</span>
                  <div>
                    <h3 className="text-base font-bold text-[#1a1c1b] leading-tight">Valentine's Day Blossom</h3>
                    <span className="text-xs text-[#5e5e65] font-semibold">140 Days Remaining · Feb 14</span>
                  </div>
                </div>
              </div>

              <div className="mt-1 mb-3 bg-[#f4f3f1] text-[#5e5e65] px-2.5 py-1 rounded-lg flex items-center gap-1.5 text-xs font-bold">
                <span className="material-symbols-outlined text-[16px]">edit_note</span>
                <span>Draft Forecast Mode</span>
              </div>

              <div className="w-full h-32 rounded-lg overflow-hidden mb-3 relative shadow-sm">
                <img
                  className="w-full h-full object-cover"
                  alt="Valentine Showcase"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuA_IM20P_vpjm8FhuW0hxtdsAvpw5PUGlfbcT5rir-A-kqHHPpcrhIzmTZk-RA5miO1n63L3X-0vhtJs0NrysGLJBLqHbqcEbSVpun8NF5iulJyq5cEnPg2obKpSnf5ypfHmAV-JXHD-budrByggPaVddfnLmFqTcsAdz9V0X7fi_YvzY7e9BCKdpRXShoJOzeoVis0f3GdvYdMGUwbi9xyDf4qIfsXqByQLKxDaN4-hxOQs3LeunCdkw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-2.5">
                  <span className="text-white text-xs font-semibold">Seasonal Showcase Frontline</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-3 bg-[#f4f3f1] p-2.5 rounded-lg text-xs">
                <div>
                  <span className="text-[#5e5e65] text-[10px] block font-medium">Expected Surge</span>
                  <span className="text-base font-bold text-[#1a1c1b]">+52%</span>
                </div>
                <div>
                  <span className="text-[#5e5e65] text-[10px] block font-medium">Historical Margin</span>
                  <span className="text-base font-bold text-[#006947]">48.2%</span>
                </div>
              </div>

              <div className="mb-3">
                <div className="flex justify-between text-[11px] text-[#5e5e65] mb-1">
                  <span>Historical Training Data Match</span>
                  <span className="font-bold text-[#1a1c1b]">94% Confidence</span>
                </div>
                <div className="w-full bg-[#e9e8e6] h-2 rounded-full overflow-hidden flex">
                  <div className="bg-[#006947] h-full rounded-full" style={{ width: '94%' }}></div>
                </div>
              </div>

              <div className="mb-3">
                <span className="text-[#5e5e65] text-[11px] font-semibold uppercase tracking-wider block mb-1">Popular Categories</span>
                <div className="flex flex-wrap gap-1 text-[11px]">
                  <span className="bg-[#f4f3f1] px-2 py-0.5 rounded text-[#1a1c1b]">Couple Keychains</span>
                  <span className="bg-[#f4f3f1] px-2 py-0.5 rounded text-[#1a1c1b]">Beauty Perfumes</span>
                  <span className="bg-[#f4f3f1] px-2 py-0.5 rounded text-[#1a1c1b]">Pink Plushies</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsHyperparamModalOpen(true)}
              className="mt-2 w-full bg-white hover:bg-[#f4f3f1] text-[#1a1c1b] py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all border border-[#efeeec] shadow-sm"
            >
              <span className="material-symbols-outlined text-[16px]">tune</span>
              <span>Configure AI Model Parameters</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bento Section: Campaign Engine & Stock Staging Simulation */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 mb-6">
        {/* Left: Campaign Promotion Engine (7 cols) */}
        <div className="xl:col-span-7 bg-white p-5 rounded-xl shadow-sm border border-[#efeeec] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#f4f3f1]">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-[#bb0012]/10 flex items-center justify-center text-[#bb0012]">
                  <span className="material-symbols-outlined text-[18px]">campaign</span>
                </div>
                <div>
                  <h2 className="text-base font-bold text-[#1a1c1b]">Campaign Promotion Engine</h2>
                  <span className="text-xs text-[#5e5e65]">Configure automated discount logic &amp; POS checkout triggers</span>
                </div>
              </div>
              <span className="bg-[#6ffbbe]/40 text-[#002113] px-2.5 py-0.5 rounded text-xs font-semibold">
                Java Engine v2.4 Active
              </span>
            </div>

            <form id="campaign-engine-form" onSubmit={handleLaunchCampaign} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div className="sm:col-span-5 flex flex-col gap-1">
                  <label className="text-[11px] uppercase font-semibold text-[#5e5e65]">Festival Selector</label>
                  <select
                    value={festivalSelect}
                    onChange={(e) => setFestivalSelect(e.target.value)}
                    className="w-full bg-[#f4f3f1] text-[#1a1c1b] py-2 px-2.5 rounded-lg outline-none border border-[#efeeec] cursor-pointer"
                  >
                    <option>Diwali Mega Sale 🪔</option>
                    <option>Christmas Carnival 🎄</option>
                    <option>Valentine's Day Blossom 💖</option>
                    <option>Custom Weekend Flash Sale ⚡</option>
                  </select>
                </div>
                <div className="sm:col-span-7 flex flex-col gap-1">
                  <label className="text-[11px] uppercase font-semibold text-[#5e5e65]">Campaign Name</label>
                  <input
                    type="text"
                    value={campaignName}
                    onChange={(e) => setCampaignName(e.target.value)}
                    className="w-full bg-[#f4f3f1] text-[#1a1c1b] py-2 px-3 rounded-lg outline-none border border-[#efeeec]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div className="sm:col-span-6 flex flex-col gap-1">
                  <label className="text-[11px] uppercase font-semibold text-[#5e5e65]">Target Product / Category</label>
                  <div className="bg-[#f4f3f1] p-1.5 rounded-lg flex flex-wrap gap-1 items-center border border-[#efeeec]">
                    <span className="bg-white text-[#1a1c1b] px-2 py-0.5 rounded text-[11px] font-semibold shadow-sm">
                      Gift Hampers
                    </span>
                    <span className="bg-white text-[#1a1c1b] px-2 py-0.5 rounded text-[11px] font-semibold shadow-sm">
                      Toys
                    </span>
                    <span className="bg-white text-[#1a1c1b] px-2 py-0.5 rounded text-[11px] font-semibold shadow-sm">
                      Fragrances
                    </span>
                  </div>
                </div>

                <div className="sm:col-span-6 flex flex-col gap-1">
                  <label className="text-[11px] uppercase font-semibold text-[#5e5e65]">Discount Structure</label>
                  <div className="grid grid-cols-2 gap-2">
                    <label className={`cursor-pointer p-2 rounded-lg flex items-center gap-1.5 border ${
                      discountType === 'percentage' ? 'bg-[#ffdad6]/40 border-[#bb0012] text-[#bb0012]' : 'bg-[#f4f3f1] border-[#efeeec] text-[#1a1c1b]'
                    }`}>
                      <input
                        type="radio"
                        checked={discountType === 'percentage'}
                        onChange={() => setDiscountType('percentage')}
                        className="accent-[#bb0012]"
                      />
                      <div className="flex flex-col">
                        <span className="font-bold">20% Flat OFF</span>
                        <span className="text-[10px] text-[#5e5e65]">Percentage rule</span>
                      </div>
                    </label>
                    <label className={`cursor-pointer p-2 rounded-lg flex items-center gap-1.5 border ${
                      discountType === 'bogo' ? 'bg-[#ffdad6]/40 border-[#bb0012] text-[#bb0012]' : 'bg-[#f4f3f1] border-[#efeeec] text-[#1a1c1b]'
                    }`}>
                      <input
                        type="radio"
                        checked={discountType === 'bogo'}
                        onChange={() => setDiscountType('bogo')}
                        className="accent-[#bb0012]"
                      />
                      <div className="flex flex-col">
                        <span className="font-bold">Buy 2 Get 1</span>
                        <span className="text-[10px] text-[#5e5e65]">Volume deal</span>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] uppercase font-semibold text-[#5e5e65]">Promo Coupon Code</label>
                  <input
                    type="text"
                    value={promoCodeInput}
                    onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())}
                    placeholder="e.g. DIWALI20"
                    className="w-full bg-[#f4f3f1] text-[#1a1c1b] font-mono font-bold py-2 px-3 rounded-lg outline-none border border-[#efeeec]"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] uppercase font-semibold text-[#5e5e65]">Target Customer Group</label>
                  <div className="bg-[#f4f3f1] py-2 px-3 rounded-lg flex items-center justify-between border border-[#efeeec]">
                    <span className="font-medium text-[#1a1c1b]">All Loyalty Members &amp; Walk-ins</span>
                    <span className="font-mono font-bold text-[#bb0012]">2,540 users</span>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLaunching}
                  className="w-full bg-[#bb0012] hover:bg-[#e7151f] text-white font-bold py-3 px-4 rounded-lg shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-[20px]">rocket_launch</span>
                  <span>{isLaunching ? 'Pushing to POS Registers...' : 'Launch Festival Campaign & Push to POS Registers'}</span>
                </button>
                <div className="flex items-center justify-center gap-1.5 mt-2 text-[#5e5e65] text-[11px]">
                  <span className="material-symbols-outlined text-[14px] text-[#006947]">lock_reset</span>
                  <span>Propagates instantly to Store #104 terminals via Java REST Service</span>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Right: Stock Staging Runway Simulation (5 cols) */}
        <div className="xl:col-span-5 bg-white p-5 rounded-xl shadow-sm border border-[#efeeec] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex flex-col">
                <h2 className="text-base font-bold text-[#1a1c1b]">Stock Staging Runway</h2>
                <span className="text-xs text-[#5e5e65]">Diwali peak traffic simulation (Oct 28 - Nov 03)</span>
              </div>
              <span className="bg-[#bb0012]/10 text-[#bb0012] font-mono text-xs px-2 py-0.5 rounded font-bold">
                Sim: 1.38x
              </span>
            </div>

            <div className="bg-[#f4f3f1] p-3.5 rounded-xl mb-3 border border-[#efeeec]">
              <div className="flex items-center justify-between text-[#5e5e65] text-xs mb-2">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-[#bb0012]"></span>
                  <span>Projected Demand (Units)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-[#006947]"></span>
                  <span>Floor Stock + Buffer</span>
                </div>
              </div>

              {/* Sparkline / Area SVG */}
              <svg className="w-full h-36 text-[#1a1c1b]" fill="none" viewBox="0 0 400 160">
                <line stroke="currentColor" strokeDasharray="4 4" strokeOpacity="0.1" x1="0" x2="400" y1="40" y2="40"></line>
                <line stroke="currentColor" strokeDasharray="4 4" strokeOpacity="0.1" x1="0" x2="400" y1="80" y2="80"></line>
                <line stroke="currentColor" strokeDasharray="4 4" strokeOpacity="0.1" x1="0" x2="400" y1="120" y2="120"></line>

                <path d="M 10 110 Q 70 100, 130 95 T 250 90 T 320 85 T 390 85" fill="none" stroke="#00855b" strokeWidth="2.5"></path>
                <path d="M 10 130 Q 70 120, 130 80 T 250 25 T 320 50 T 390 100" fill="none" stroke="#bb0012" strokeWidth="3"></path>

                <path d="M 210 50 L 250 25 L 290 38 L 290 88 L 250 90 L 210 92 Z" fill="#bb0012" fillOpacity="0.15"></path>

                <circle cx="250" cy="25" fill="#bb0012" r="4"></circle>
                <circle cx="250" cy="90" fill="#00855b" r="4"></circle>

                <text fill="#bb0012" fontFamily="Inter" fontSize="10" fontWeight="700" x="255" y="20">
                  PEAK: 1,840 units/day
                </text>
                <text fill="#00855b" fontFamily="Inter" fontSize="9" fontWeight="600" x="255" y="105">
                  Stock Cap: 1,220 units
                </text>
              </svg>

              <div className="flex justify-between text-[#5e5e65] font-mono text-[10px] pt-1 border-t border-[#efeeec]">
                <span>Oct 28</span>
                <span>Oct 30 (Dhanteras)</span>
                <span>Nov 01 (Diwali)</span>
                <span>Nov 03 (Bhai Dooj)</span>
              </div>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between p-2 rounded bg-[#ffdad6]/40 text-[#1a1c1b] border border-[#ffb4ab]">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#ba1a1a] text-[16px]">warning</span>
                  <span className="font-semibold">Fragrance Diffuser Gift Sets</span>
                </div>
                <span className="font-mono text-[#ba1a1a] font-bold">-180 units deficit</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-[#ffdad6]/40 text-[#1a1c1b] border border-[#ffb4ab]">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#ba1a1a] text-[16px]">warning</span>
                  <span className="font-semibold">Sanrio Kuromi Festival Plush 30cm</span>
                </div>
                <span className="font-mono text-[#ba1a1a] font-bold">-120 units deficit</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-[#6ffbbe]/20 text-[#1a1c1b] border border-[#6ffbbe]/40">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#006947] text-[16px]">check_circle</span>
                  <span className="font-semibold">Aroma Scented Ceramic Candles</span>
                </div>
                <span className="font-mono text-[#006947] font-bold">+80 units safe</span>
              </div>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-[#efeeec] flex items-center justify-between text-xs text-[#5e5e65]">
            <span>Central Warehouse Dispatch ETA:</span>
            <span className="font-mono text-[#1a1c1b] font-semibold">Tomorrow, 08:30 AM (Loading Dock B)</span>
          </div>
        </div>
      </div>

      {/* Active Promotional Rules Table */}
      <div className="bg-white rounded-xl shadow-sm border border-[#efeeec] p-5 flex flex-col">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-base font-bold text-[#1a1c1b]">Active Promotional Rules &amp; POS Ledger</h2>
            <p className="text-xs text-[#5e5e65]">Live discount codes currently mapped to Phoenix Mall barcode scanner tills</p>
          </div>
          <button
            type="button"
            onClick={handleExportPromotionsCsv}
            className="bg-[#f4f3f1] hover:bg-[#e9e8e6] text-[#1a1c1b] text-xs font-semibold px-3 py-1.5 rounded-lg border border-[#efeeec] flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[16px]">file_download</span>
            <span>Export CSV</span>
          </button>
        </div>

        <div className="w-full overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#f4f3f1] text-[#5e5e65] text-[11px] uppercase tracking-wider font-semibold">
                <th className="py-2.5 px-3">Promotion Code</th>
                <th className="py-2.5 px-3">Campaign / Festival</th>
                <th className="py-2.5 px-3">Discount Type</th>
                <th className="py-2.5 px-3">Applicable Targets</th>
                <th className="py-2.5 px-3">Validity Window</th>
                <th className="py-2.5 px-3 text-right">Redemptions</th>
                <th className="py-2.5 px-3 text-right">Revenue Generated</th>
                <th className="py-2.5 px-3 text-center">Till Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f4f3f1] text-xs">
              {campaigns.map((promo) => (
                <tr key={promo.code} className="hover:bg-[#f4f3f1]/50 transition-colors">
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-[#bb0012] bg-[#ffdad6]/50 px-2 py-0.5 rounded">
                        {promo.code}
                      </span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(promo.code)}
                        className="text-[#5e5e65] hover:text-[#bb0012]"
                        title="Copy promo code"
                      >
                        <span className="material-symbols-outlined text-[16px]">
                          {copiedCode === promo.code ? 'done' : 'content_copy'}
                        </span>
                      </button>
                    </div>
                  </td>
                  <td className="py-3 px-3 font-semibold text-[#1a1c1b]">{promo.campaign}</td>
                  <td className="py-3 px-3">
                    <span className="bg-[#f4f3f1] px-2 py-0.5 rounded text-[#1a1c1b] font-medium">
                      {promo.discountType}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-[#5e5e65]">{promo.applicableTargets}</td>
                  <td className="py-3 px-3 font-mono text-[#5e5e65]">{promo.validityWindow}</td>
                  <td className="py-3 px-3 font-mono text-right font-semibold text-[#1a1c1b]">
                    {promo.redemptions}
                  </td>
                  <td className="py-3 px-3 font-mono text-right font-bold text-[#1a1c1b]">
                    ₹{promo.revenueGenerated.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 uppercase tracking-wider ${
                        promo.status === 'Live'
                          ? 'bg-[#6ffbbe]/40 text-[#002113]'
                          : 'bg-[#f4f3f1] text-[#5e5e65]'
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          promo.status === 'Live' ? 'bg-[#006947]' : 'bg-[#5e5e65]'
                        }`}
                      ></span>
                      {promo.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-3 pt-3 border-t border-[#efeeec] flex flex-col sm:flex-row items-center justify-between text-xs text-[#5e5e65] gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[#1a1c1b]">Total Campaign Revenue MTD:</span>
            <span className="font-mono text-base font-bold text-[#bb0012]">₹1,403,300</span>
            <span className="bg-[#6ffbbe]/40 text-[#002113] text-[10px] px-2 py-0.5 rounded font-bold">+26.4% YoY</span>
          </div>
          <span className="font-mono">Page 1 of 1</span>
        </div>
      </div>

      {/* OFFER PERFORMANCE MODAL */}
      {isPerformanceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl p-6 border border-[#efeeec] flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-[#efeeec] pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#bb0012]">trending_up</span>
                <div>
                  <h3 className="text-base font-bold text-[#1a1c1b]">Festival Campaign Performance Audit</h3>
                  <span className="text-[10px] text-[#5e5e65]">Store #104 Phoenix Mall • Month-to-Date Records</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPerformanceModalOpen(false)}
                className="p-1 rounded hover:bg-[#f4f3f1] text-[#5e5e65]"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-[#f4f3f1] rounded-xl">
                <span className="text-[#5e5e65]">Total Redemptions MTD:</span>
                <div className="text-xl font-mono font-bold text-[#1a1c1b]">1,842 orders</div>
              </div>
              <div className="p-3 bg-[#f4f3f1] rounded-xl">
                <span className="text-[#5e5e65]">Attributed Gross Sales:</span>
                <div className="text-xl font-mono font-bold text-[#006947]">₹14,03,300</div>
              </div>
              <div className="p-3 bg-[#f4f3f1] rounded-xl">
                <span className="text-[#5e5e65]">Average Basket Lift:</span>
                <div className="text-xl font-mono font-bold text-[#bb0012]">+28.4%</div>
              </div>
              <div className="p-3 bg-[#f4f3f1] rounded-xl">
                <span className="text-[#5e5e65]">Top Coupon Code:</span>
                <div className="text-xl font-mono font-bold text-[#1a1c1b]">DIWALI20</div>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-[#efeeec]">
              <button
                type="button"
                onClick={() => setIsPerformanceModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-[#bb0012] hover:bg-[#e7151f] text-white text-xs font-semibold"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HYPERPARAMETER CALIBRATION MODAL */}
      {isHyperparamModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 border border-[#efeeec] flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-[#efeeec] pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#bb0012]">tune</span>
                <h3 className="text-base font-bold text-[#1a1c1b]">Seasonal AI Model Calibration</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsHyperparamModalOpen(false)}
                className="p-1 rounded hover:bg-[#f4f3f1] text-[#5e5e65]"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-[#1a1c1b]">Demand Surge Multiplier:</span>
                <span className="font-mono font-bold text-[#bb0012]">1.52x</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold text-[#1a1c1b]">Target Margin Floor:</span>
                <span className="font-mono font-bold text-[#006947]">48.0%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold text-[#1a1c1b]">Confidence Interval (Alpha):</span>
                <span className="font-mono font-bold text-[#1a1c1b]">95%</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#efeeec]">
              <button
                type="button"
                onClick={() => setIsHyperparamModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-[#f4f3f1] text-[#1a1c1b] text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsHyperparamModalOpen(false);
                  if (addToast) addToast('Valentine seasonal AI parameters calibrated & applied to forecast models!', 'success');
                }}
                className="px-4 py-2 rounded-lg bg-[#bb0012] hover:bg-[#e7151f] text-white text-xs font-semibold"
              >
                Apply Hyperparameters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
