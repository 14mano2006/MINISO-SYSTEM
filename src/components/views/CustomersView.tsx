import React, { useState } from 'react';
import { Customer } from '../../types/retail';

interface CustomersViewProps {
  customers: Customer[];
  onAddCustomer: (customer: Partial<Customer>) => Promise<void>;
  addToast?: (message: string, type?: 'success' | 'warning' | 'info') => void;
}

export const CustomersView: React.FC<CustomersViewProps> = ({
  customers,
  onAddCustomer,
  addToast,
}) => {
  const [selectedCustomer, setSelectedCustomer] = useState<Customer>(customers[0] || {} as Customer);
  const [segmentTab, setSegmentTab] = useState<'all' | 'frequent' | 'regular' | 'new'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [whatsAppPerkSent, setWhatsAppPerkSent] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isEditCustomerOpen, setIsEditCustomerOpen] = useState(false);

  // Edit customer form
  const [editTier, setEditTier] = useState('Gold Club');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');

  // New customer form
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustEmail, setNewCustEmail] = useState('');

  const handleSendPerk = () => {
    setWhatsAppPerkSent(true);
    if (addToast) addToast(`WhatsApp VIP voucher dispatched to ${selectedCustomer.name} (${selectedCustomer.phone})`, 'success');
    setTimeout(() => setWhatsAppPerkSent(false), 3500);
  };

  const handleExportCustomersCsv = () => {
    if (customers.length === 0) {
      if (addToast) addToast('No customers to export', 'warning');
      return;
    }
    const headers = ['CustomerID', 'Name', 'Phone', 'Email', 'Segment', 'TotalSpendINR', 'VisitCount', 'Points', 'MemberSince'];
    const rows = customers.map(c => [
      c.id,
      `"${c.name.replace(/"/g, '""')}"`,
      `'${c.phone}`,
      `"${c.email}"`,
      c.type,
      c.lifetimeSpend,
      c.ordersCount,
      c.loyaltyPoints,
      `"${c.memberSince}"`
    ].join(','));
    const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent([headers.join(','), ...rows].join('\n'));
    const link = document.createElement('a');
    link.setAttribute('href', csvContent);
    link.setAttribute('download', 'miniso_customer_directory.csv');
    document.body.appendChild(link);
    link.click();
    link.remove();
    if (addToast) addToast(`Exported ${customers.length} loyalty members to CSV`, 'success');
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName || !newCustPhone) return;
    await onAddCustomer({
      name: newCustName,
      phone: newCustPhone,
      email: newCustEmail || `${newCustName.toLowerCase().replace(/\s+/g, '')}@gmail.com`,
    });
    setIsRegisterOpen(false);
    setNewCustName('');
    setNewCustPhone('');
    setNewCustEmail('');
  };

  const filteredCustomers = customers.filter((c) => {
    if (segmentTab === 'frequent') return c.type === 'Frequent';
    if (segmentTab === 'regular') return c.type === 'Regular';
    if (segmentTab === 'new') return c.type === 'New';
    return true;
  }).filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone.includes(searchQuery) ||
    c.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col w-full gap-5 pb-12">
      {/* Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 text-[#5e5e65] text-xs uppercase tracking-wider font-semibold">
            <span>Store #104 Operations</span>
            <span>/</span>
            <span className="text-[#bb0012]">CRM &amp; Loyalty</span>
          </div>
          <h1 className="text-2xl font-bold text-[#1a1c1b] tracking-tight mt-1">
            Customer Directory &amp; Purchase Pattern Analytics
          </h1>
          <p className="text-sm text-[#5e5e65]">
            Track loyalty membership, customer lifetime value (LTV), and basket affinity across POS checkouts.
          </p>
        </div>
        <div className="flex items-center gap-2.5 self-start md:self-auto">
          <button
            type="button"
            onClick={handleExportCustomersCsv}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-white hover:bg-[#f4f3f1] text-[#1a1c1b] text-xs font-semibold shadow-sm border border-[#efeeec] transition-colors"
          >
            <span className="material-symbols-outlined text-[18px] text-[#5e5e65]">file_download</span>
            <span>Export Customer Segments</span>
          </button>
          <button
            type="button"
            onClick={() => setIsRegisterOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-[#bb0012] hover:bg-[#e7151f] text-white text-xs font-semibold shadow-md transition-all hover:scale-[1.01]"
          >
            <span className="material-symbols-outlined text-[18px]">person_add</span>
            <span>+ Register Loyalty Customer</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-[#efeeec] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#5e5e65] uppercase tracking-wider font-semibold">Total Customers</span>
            <div className="h-8 w-8 rounded-lg bg-[#f4f3f1] flex items-center justify-center text-[#5e5e65]">
              <span className="material-symbols-outlined text-[18px]">groups</span>
            </div>
          </div>
          <div className="my-2 flex items-baseline gap-1">
            <span className="text-3xl text-[#1a1c1b] font-bold">4,820</span>
            <span className="font-mono text-xs text-[#5e5e65]">profiles</span>
          </div>
          <div className="flex items-center gap-1 text-xs">
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-[#6ffbbe]/40 text-[#002113] font-bold">
              <span className="material-symbols-outlined text-[13px]">arrow_upward</span>+340
            </span>
            <span className="text-[#5e5e65]">new this month</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-[#efeeec] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#5e5e65] uppercase tracking-wider font-semibold">Returning Customers</span>
            <div className="h-8 w-8 rounded-lg bg-[#6ffbbe]/20 flex items-center justify-center text-[#006947]">
              <span className="material-symbols-outlined text-[18px]">repeat</span>
            </div>
          </div>
          <div className="my-2 flex items-baseline gap-1">
            <span className="text-3xl text-[#1a1c1b] font-bold">1,940</span>
            <span className="text-xs text-[#006947] font-bold bg-[#6ffbbe]/30 px-1.5 py-0.5 rounded">
              42.8% retention
            </span>
          </div>
          <div className="flex items-center gap-1 text-xs text-[#5e5e65]">
            <span className="font-mono text-[#006947] font-bold">+6.2%</span>
            <span>vs Q3 benchmark</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-[#efeeec] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#5e5e65] uppercase tracking-wider font-semibold">New Walk-in Customers</span>
            <div className="h-8 w-8 rounded-lg bg-[#e4e1ea] flex items-center justify-center text-[#1b1b21]">
              <span className="material-symbols-outlined text-[18px]">directions_walk</span>
            </div>
          </div>
          <div className="my-2 flex items-baseline gap-1">
            <span className="text-3xl text-[#1a1c1b] font-bold">2,880</span>
            <span className="font-mono text-xs text-[#5e5e65]">footfalls</span>
          </div>
          <div className="text-xs text-[#5e5e65]">59.7% of monthly mall walk-in base</div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-[#efeeec] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#5e5e65] uppercase tracking-wider font-semibold">Average Purchase Value</span>
            <div className="h-8 w-8 rounded-lg bg-[#ffdad6] flex items-center justify-center text-[#bb0012]">
              <span className="material-symbols-outlined text-[18px]">payments</span>
            </div>
          </div>
          <div className="my-2 flex items-baseline gap-1">
            <span className="text-3xl text-[#bb0012] font-bold">₹612.00</span>
            <span className="font-mono text-xs text-[#5e5e65]">/ basket</span>
          </div>
          <div className="flex items-center gap-1 text-xs">
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-[#ffdad6] text-[#93000b] font-bold">
              1.8x higher
            </span>
            <span className="text-[#5e5e65]">for Loyalty Members</span>
          </div>
        </div>
      </div>

      {/* Main Content Split: Left (7 Cols Table) & Right (5 Cols Detail Profile) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
        {/* Left Customer Table (7 Cols) */}
        <div className="xl:col-span-7 flex flex-col gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-[#efeeec] p-4 flex flex-col gap-3">
            {/* Tabs */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1 bg-[#f4f3f1] p-1 rounded-lg text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setSegmentTab('all')}
                  className={`px-3 py-1 rounded-md transition-all ${
                    segmentTab === 'all' ? 'bg-white text-[#1a1c1b] shadow-sm font-bold' : 'text-[#5e5e65]'
                  }`}
                >
                  All Customers <span className="ml-1 font-mono text-[#5e5e65]">4,820</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSegmentTab('frequent')}
                  className={`px-3 py-1 rounded-md transition-all ${
                    segmentTab === 'frequent' ? 'bg-white text-[#1a1c1b] shadow-sm font-bold' : 'text-[#5e5e65]'
                  }`}
                >
                  Frequent <span className="ml-1 font-mono">890</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSegmentTab('regular')}
                  className={`px-3 py-1 rounded-md transition-all ${
                    segmentTab === 'regular' ? 'bg-white text-[#1a1c1b] shadow-sm font-bold' : 'text-[#5e5e65]'
                  }`}
                >
                  Regular <span className="ml-1 font-mono">1,650</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSegmentTab('new')}
                  className={`px-3 py-1 rounded-md transition-all ${
                    segmentTab === 'new' ? 'bg-white text-[#1a1c1b] shadow-sm font-bold' : 'text-[#5e5e65]'
                  }`}
                >
                  New <span className="ml-1 font-mono">2,280</span>
                </button>
              </div>
              <span className="text-xs text-[#5e5e65]">Showing 1–{filteredCustomers.length} of 4,820</span>
            </div>

            {/* Search Bar */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#5e5e65] text-[18px]">
                  search
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by customer name, phone +91, email or member ID..."
                  className="w-full bg-[#f4f3f1] text-[#1a1c1b] placeholder:text-[#5e5e65] text-xs pl-9 pr-14 py-2 rounded-lg outline-none border border-transparent focus:border-[#bb0012]/30"
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 bg-[#e9e8e6] px-1 py-0.5 rounded text-[#5e5e65] font-mono text-[9px]">
                  F3
                </span>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-lg">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#f4f3f1] text-[#5e5e65] text-[11px] uppercase tracking-wider font-semibold">
                    <th className="py-2.5 px-3">Customer ID</th>
                    <th className="py-2.5 px-3">Profile</th>
                    <th className="py-2.5 px-2">Type</th>
                    <th className="py-2.5 px-2 text-right">Orders</th>
                    <th className="py-2.5 px-2 text-right">Spent</th>
                    <th className="py-2.5 px-3">Affinity</th>
                    <th className="py-2.5 px-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f4f3f1] text-xs">
                  {filteredCustomers.map((c) => {
                    const isSelected = selectedCustomer.id === c.id;
                    const initials = c.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .slice(0, 2);
                    return (
                      <tr
                        key={c.id}
                        onClick={() => setSelectedCustomer(c)}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? 'bg-[#ffdad6]/30 font-semibold' : 'hover:bg-[#f4f3f1]'
                        }`}
                      >
                        <td className="py-2.5 px-3 font-mono font-bold text-[#bb0012]">{c.id}</td>
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-7 h-7 rounded-full bg-[#bb0012] text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                              {initials}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="font-semibold text-[#1a1c1b] truncate">{c.name}</span>
                              <span className="text-[10px] text-[#5e5e65]">{c.phone}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-2.5 px-2">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              c.type === 'Frequent'
                                ? 'bg-[#e4e1ea] text-[#1b1b21]'
                                : c.type === 'Regular'
                                ? 'bg-[#f4f3f1] text-[#5e5e65]'
                                : 'bg-[#6ffbbe]/40 text-[#002113]'
                            }`}
                          >
                            {c.type}
                          </span>
                        </td>
                        <td className="py-2.5 px-2 text-right font-mono">{c.ordersCount}</td>
                        <td className="py-2.5 px-2 text-right font-mono font-bold text-[#1a1c1b]">
                          ₹{c.lifetimeSpend.toLocaleString('en-IN')}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="bg-[#f4f3f1] px-2 py-0.5 rounded text-[10px] text-[#5e5e65]">
                            {c.primaryAffinity}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              className="p-1 rounded text-[#bb0012] hover:bg-white"
                              title="View Profile"
                            >
                              <span className="material-symbols-outlined text-[16px]">visibility</span>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (addToast) addToast(`WhatsApp VIP 20% voucher dispatched to ${c.name} (${c.phone})`, 'success');
                              }}
                              className="p-1 rounded text-[#5e5e65] hover:text-[#006947]"
                              title="Send WhatsApp SMS"
                            >
                              <span className="material-symbols-outlined text-[16px]">sms</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[#f4f3f1] text-xs text-[#5e5e65]">
              <span>Page 1 of 964</span>
              <span className="font-mono text-[#006947]">Realtime Customer Telemetry Active</span>
            </div>
          </div>
        </div>

        {/* Right Deep-Dive Profile Panel (5 Cols) */}
        <div className="xl:col-span-5 flex flex-col gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-[#efeeec] p-5 flex flex-col gap-4">
            {/* Profile Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3.5">
                <div className="relative">
                  <img
                    alt={selectedCustomer.name}
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuCupDBnINqTvgQyOxSgMaof1UNhdDuCO9D_w-mwJnnLlAIqfS5chrINJROmEEVZPKJ5v88NuiV3ipDHm-IAtwa55KMRuNpM8H8MolW1FMASc7Ao_8A_VFYQNlgDH3kUCaMsSrvfYxxtrk2oCTPQs2N60kPhZ6WwuxnMkTHtKGErE5Cf8WUDjVHRTtlbf8q4xb7G_wjwQLBfyJmcnDd5dInA-EehIO7mSdW8ci8pzN05psunF4vQMjIMqQ"
                    className="w-14 h-14 rounded-xl object-cover shadow-sm border border-black/5"
                  />
                  <div className="absolute -bottom-1 -right-1 bg-[#006947] text-white rounded-full p-0.5" title="Verified Customer">
                    <span className="material-symbols-outlined text-[12px]">check</span>
                  </div>
                </div>
                <div className="flex flex-col">
                  <h2 className="text-lg font-bold text-[#1a1c1b]">{selectedCustomer.name}</h2>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#ffdad6] text-[#93000b] text-[10px] font-bold">
                      <span>MINISO {selectedCustomer.tier || 'Gold Club'} ⭐</span>
                    </span>
                  </div>
                  <span className="text-xs text-[#5e5e65] mt-1">
                    Loyalty Member since <strong className="text-[#1a1c1b]">{selectedCustomer.memberSince}</strong>
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditPhone(selectedCustomer.phone);
                  setEditEmail(selectedCustomer.email);
                  setEditTier(selectedCustomer.tier || 'Gold Club');
                  setIsEditCustomerOpen(true);
                }}
                className="p-1 rounded-lg hover:bg-[#f4f3f1] text-[#5e5e65]"
                title="Edit Customer"
              >
                <span className="material-symbols-outlined text-[18px]">edit</span>
              </button>
            </div>

            {/* Contact & Points stats */}
            <div className="grid grid-cols-2 gap-2.5 bg-[#f4f3f1] p-3 rounded-xl border border-[#efeeec] text-xs">
              <div className="flex flex-col gap-0.5">
                <span className="text-[#5e5e65]">Phone &amp; Email</span>
                <span className="font-mono text-xs font-semibold text-[#1a1c1b]">{selectedCustomer.phone}</span>
                <span className="text-[#5e5e65] text-[11px] truncate">{selectedCustomer.email}</span>
              </div>
              <div className="flex flex-col gap-0.5 bg-white p-2 rounded-lg shadow-sm border border-[#efeeec]">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-[#5e5e65]">Loyalty Points</span>
                  <span className="material-symbols-outlined text-[14px] text-[#bb0012]">stars</span>
                </div>
                <span className="text-base font-bold text-[#bb0012] font-mono">
                  {selectedCustomer.loyaltyPoints} pts
                </span>
                <span className="text-[10px] text-[#006947] font-semibold">
                  ₹{selectedCustomer.redeemableAmount} redeemable now
                </span>
              </div>
            </div>

            {/* Spend Breakdown Bar */}
            <div className="flex flex-col gap-1 bg-[#f4f3f1]/70 p-3 rounded-xl border border-[#efeeec]">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#5e5e65] uppercase font-semibold">Lifetime Spend Breakdown</span>
                <span className="font-mono font-bold text-[#1a1c1b]">
                  ₹{selectedCustomer.lifetimeSpend.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="w-full bg-[#e9e8e6] h-2 rounded-full overflow-hidden flex mt-1">
                <div className="bg-[#bb0012] h-full" style={{ width: '65%' }} title="In-store Store #104"></div>
                <div className="bg-[#5e5e65] h-full" style={{ width: '25%' }} title="Online App"></div>
                <div className="bg-[#00855b] h-full" style={{ width: '10%' }} title="Pop-ups"></div>
              </div>
              <div className="flex items-center justify-between text-[#5e5e65] text-[11px] mt-1">
                <span>{selectedCustomer.ordersCount} store visits recorded</span>
                <span>
                  Avg <strong className="text-[#1a1c1b] font-mono">₹{Math.round(selectedCustomer.lifetimeSpend / (selectedCustomer.ordersCount || 1))}</strong> / basket
                </span>
              </div>
            </div>

            {/* Category Basket Affinity */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#5e5e65] uppercase tracking-wider font-semibold">Category Basket Affinity</span>
                <span className="text-[#006947] font-semibold">High Repeat Affinity</span>
              </div>
              <div className="flex flex-col gap-2">
                {(selectedCustomer.basketAffinity || [
                  { category: 'Beauty & Skincare', percentage: 45, icon: 'face_3' },
                  { category: 'Toys & Sanrio Plushies', percentage: 35, icon: 'smart_toy' },
                  { category: 'Stationery & Desk', percentage: 20, icon: 'edit_note' },
                ]).map((aff, i) => (
                  <div key={i} className="flex flex-col gap-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 text-[#1a1c1b] font-medium">
                        <span className="material-symbols-outlined text-[15px] text-[#bb0012]">{aff.icon}</span>
                        {aff.category}
                      </span>
                      <span className="font-mono font-bold text-[#1a1c1b]">{aff.percentage}%</span>
                    </div>
                    <div className="w-full bg-[#f4f3f1] h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-[#bb0012] h-full rounded-full"
                        style={{ width: `${aff.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Store Receipts */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between pb-1 text-xs">
                <span className="text-[#5e5e65] uppercase tracking-wider font-semibold">Recent Store Receipts</span>
                <span className="text-[#bb0012] font-semibold">Full Ledger</span>
              </div>
              <div className="flex flex-col gap-1.5">
                {(selectedCustomer.recentReceipts || []).map((rc, i) => (
                  <div
                    key={i}
                    className="flex items-start justify-between p-2 bg-[#f4f3f1] rounded-lg hover:bg-[#efeeec] transition-colors text-xs"
                  >
                    <div className="flex flex-col">
                      <span className="font-semibold text-[#1a1c1b]">{rc.date}</span>
                      <span className="text-[11px] text-[#5e5e65]">{rc.items}</span>
                    </div>
                    <span className="font-mono font-bold text-[#1a1c1b]">₹{rc.amount}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Predictive Upsell Card */}
            <div className="bg-[#ffdad6]/40 p-3.5 rounded-xl border border-[#ffb4ab] flex flex-col gap-2 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-[#93000b] text-xs font-bold">
                  <span className="material-symbols-outlined text-[16px] text-[#bb0012]">auto_awesome</span>
                  <span>Predicted Next Upsell</span>
                </div>
                <span className="bg-[#bb0012] text-white font-mono text-[10px] font-bold px-2 py-0.5 rounded-full">
                  88% Affinity Match
                </span>
              </div>
              <div className="flex items-center justify-between mt-1">
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-[#1a1c1b]">Diwali Festive Hamper</span>
                  <span className="text-[11px] text-[#5e5e65]">Recommended based on plushie &amp; skincare combo purchases</span>
                </div>
                <span className="font-mono font-bold text-sm text-[#bb0012]">₹1,499</span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <button
                  type="button"
                  onClick={handleSendPerk}
                  className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded-lg shadow-sm transition-all flex items-center justify-center gap-1.5 ${
                    whatsAppPerkSent
                      ? 'bg-[#006947] text-white'
                      : 'bg-[#bb0012] hover:bg-[#e7151f] text-white'
                  }`}
                >
                  <span className="material-symbols-outlined text-[15px]">
                    {whatsAppPerkSent ? 'check_circle' : 'send'}
                  </span>
                  <span>{whatsAppPerkSent ? 'WhatsApp Sent to ' + selectedCustomer.name : 'Send WhatsApp Perk (10% Off)'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Register Customer Modal */}
      {isRegisterOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 border border-[#efeeec] flex flex-col gap-4 text-xs">
            <div className="flex items-center justify-between border-b border-[#f4f3f1] pb-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-[#bb0012]/10 text-[#bb0012] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">person_add</span>
                </div>
                <h3 className="text-base font-bold text-[#1a1c1b]">Register Loyalty Customer</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsRegisterOpen(false)}
                className="p-1 rounded-full hover:bg-[#f4f3f1] text-[#5e5e65]"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <form onSubmit={handleRegisterSubmit} className="space-y-3">
              <div className="flex flex-col gap-1">
                <label className="font-semibold text-[#5e5e65]">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Maya Kapoor"
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  className="w-full bg-[#f4f3f1] text-[#1a1c1b] px-3 py-2 rounded-lg outline-none border border-[#efeeec]"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-semibold text-[#5e5e65]">Mobile Number (+91) *</label>
                <input
                  type="text"
                  required
                  placeholder="+91 98200 12345"
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                  className="w-full bg-[#f4f3f1] text-[#1a1c1b] px-3 py-2 rounded-lg outline-none border border-[#efeeec]"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-semibold text-[#5e5e65]">Email Address (Optional)</label>
                <input
                  type="email"
                  placeholder="maya.k@example.com"
                  value={newCustEmail}
                  onChange={(e) => setNewCustEmail(e.target.value)}
                  className="w-full bg-[#f4f3f1] text-[#1a1c1b] px-3 py-2 rounded-lg outline-none border border-[#efeeec]"
                />
              </div>

              <div className="p-2.5 bg-[#f4f3f1] rounded-lg text-[11px] text-[#5e5e65]">
                Enrolling customer automatically grants 50 welcome points and signs them up for festival VIP WhatsApp discount codes.
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#f4f3f1]">
                <button
                  type="button"
                  onClick={() => setIsRegisterOpen(false)}
                  className="px-4 py-2 rounded-lg bg-[#f4f3f1] hover:bg-[#e9e8e6] text-[#1a1c1b] font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#bb0012] hover:bg-[#e7151f] text-white font-semibold shadow-sm"
                >
                  Enroll Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT CUSTOMER MODAL */}
      {isEditCustomerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 border border-[#efeeec] flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-[#efeeec] pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#bb0012]">edit</span>
                <div>
                  <h3 className="text-base font-bold text-[#1a1c1b]">Edit Customer Profile</h3>
                  <span className="text-[10px] text-[#5e5e65]">{selectedCustomer.name} • {selectedCustomer.id}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditCustomerOpen(false)}
                className="p-1 rounded hover:bg-[#f4f3f1] text-[#5e5e65]"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex flex-col gap-1">
                <label className="font-semibold text-[#5e5e65]">Membership Tier</label>
                <select
                  value={editTier}
                  onChange={(e) => setEditTier(e.target.value)}
                  className="w-full bg-[#f4f3f1] text-[#1a1c1b] px-3 py-2 rounded-lg outline-none border border-[#efeeec]"
                >
                  <option value="Silver Club">Silver Club</option>
                  <option value="Gold Club">Gold Club ⭐</option>
                  <option value="Platinum VIP">Platinum VIP 👑</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-semibold text-[#5e5e65]">Phone Number</label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full bg-[#f4f3f1] text-[#1a1c1b] font-mono px-3 py-2 rounded-lg outline-none border border-[#efeeec]"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-semibold text-[#5e5e65]">Email Address</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full bg-[#f4f3f1] text-[#1a1c1b] px-3 py-2 rounded-lg outline-none border border-[#efeeec]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#efeeec]">
              <button
                type="button"
                onClick={() => setIsEditCustomerOpen(false)}
                className="px-4 py-2 rounded-lg bg-[#f4f3f1] text-[#1a1c1b] text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  selectedCustomer.phone = editPhone;
                  selectedCustomer.email = editEmail;
                  selectedCustomer.tier = editTier as any;
                  setIsEditCustomerOpen(false);
                  if (addToast) addToast(`Profile updated for ${selectedCustomer.name}`, 'success');
                }}
                className="px-4 py-2 rounded-lg bg-[#bb0012] hover:bg-[#e7151f] text-white text-xs font-semibold"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
