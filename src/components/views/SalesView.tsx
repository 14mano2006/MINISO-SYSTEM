import React, { useState, useEffect } from 'react';
import { Product, SaleTransaction, CartItem } from '../../types/retail';

interface SalesViewProps {
  products: Product[];
  transactions: SaleTransaction[];
  onCheckout: (payload: {
    items: CartItem[];
    customerPhone: string;
    customerName: string;
    paymentMethod: 'UPI' | 'Card' | 'Cash';
    discountCode?: string;
  }) => Promise<void>;
  addToast?: (message: string, type?: 'success' | 'warning' | 'info') => void;
}

export const SalesView: React.FC<SalesViewProps> = ({
  products,
  transactions,
  onCheckout,
  addToast,
}) => {
  // POS Cart State initialized with the 3 exact items from the design
  const [cart, setCart] = useState<CartItem[]>([
    {
      product: products.find((p) => p.sku === 'MNS-TY-0842') || products[0],
      quantity: 1,
    },
    {
      product: products.find((p) => p.sku === 'MNS-HM-0219') || products[1],
      quantity: 2,
    },
    {
      product: products.find((p) => p.sku === 'MNS-ST-1104') || products[2],
      quantity: 1,
    },
  ]);

  const [barcodeInput, setBarcodeInput] = useState('');
  const [customerPhone, setCustomerPhone] = useState('+91 98204 11984');
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'Card' | 'Cash'>('UPI');
  const [promoCode, setPromoCode] = useState('DIWALI10');
  const [isProcessing, setIsProcessing] = useState(false);
  const [checkoutSuccessMessage, setCheckoutSuccessMessage] = useState<string | null>(null);
  const [printedReceipt, setPrintedReceipt] = useState<SaleTransaction | null>(null);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isTestingFeed, setIsTestingFeed] = useState(false);
  const [scannerError, setScannerError] = useState<string | null>(null);

  // Search filter for left ledger
  const [searchLedger, setSearchLedger] = useState('');
  const [methodFilter, setMethodFilter] = useState('all');

  // Export Sales Records CSV
  const handleExportSalesCsv = () => {
    if (transactions.length === 0) {
      if (addToast) addToast('No sales records to export', 'warning');
      return;
    }
    const headers = [
      'TransactionID',
      'DateTime',
      'CustomerName',
      'Phone',
      'PaymentMethod',
      'ItemsCount',
      'SubtotalINR',
      'TaxINR',
      'DiscountINR',
      'TotalINR',
      'Cashier',
      'Register',
      'Status'
    ];
    const rows = transactions.map(t => [
      t.id,
      `"${t.time}"`,
      `"${t.customerName.replace(/"/g, '""')}"`,
      `'${t.customerPhone}`,
      t.paymentMethod,
      t.itemsCount || 1,
      t.subtotal,
      t.tax,
      t.discount,
      t.total,
      `"${t.cashier}"`,
      t.registerId,
      'Completed'
    ].join(','));
    const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent([headers.join(','), ...rows].join('\n'));
    const link = document.createElement('a');
    link.setAttribute('href', csvContent);
    link.setAttribute('download', 'miniso_sales_records.csv');
    document.body.appendChild(link);
    link.click();
    link.remove();
    if (addToast) addToast(`Exported ${transactions.length} sales receipts to CSV`, 'success');
  };

  // Handle Cart item count changes
  const updateQuantity = (index: number, delta: number) => {
    setCart((prev) => {
      const updated = [...prev];
      const newQty = updated[index].quantity + delta;
      if (newQty <= 0) {
        return updated.filter((_, i) => i !== index);
      }
      updated[index].quantity = newQty;
      return updated;
    });
  };

  const removeItem = (index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  // Add item via barcode or search
  const handleAddItem = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!barcodeInput.trim()) return;

    const query = barcodeInput.toLowerCase().trim();
    const found = products.find(
      (p) =>
        p.barcode.includes(query) ||
        p.sku.toLowerCase().includes(query) ||
        p.name.toLowerCase().includes(query)
    );

    if (found) {
      setCart((prev) => {
        const existIdx = prev.findIndex((item) => item.product.id === found.id);
        if (existIdx >= 0) {
          const updated = [...prev];
          updated[existIdx].quantity += 1;
          return updated;
        }
        return [...prev, { product: found, quantity: 1 }];
      });
      setBarcodeInput('');
      setScannerError(null);
    } else {
      setScannerError(`No SKU found for "${barcodeInput}". Try "890423184910" or "Kuromi"`);
      if (addToast) addToast(`No product matched "${barcodeInput}"`, 'warning');
      setTimeout(() => setScannerError(null), 4000);
    }
  };

  // Calculations
  const subtotal = cart.reduce((acc, item) => acc + item.product.sellingPrice * item.quantity, 0);
  const discount = promoCode === 'DIWALI10' ? Math.round(subtotal * 0.1) : 0;
  const taxable = subtotal - discount;
  const gst = Math.round(taxable * 0.18 * 100) / 100;
  const grandTotal = Math.round(taxable + 0.25);

  const handleCompleteSale = async () => {
    if (cart.length === 0) {
      if (addToast) addToast('Cart is empty. Add products to proceed.', 'warning');
      return;
    }
    setIsProcessing(true);
    try {
      await onCheckout({
        items: cart,
        customerPhone,
        customerName: customerPhone.includes('98204') ? 'Rhea Singhania' : 'Store Customer',
        paymentMethod,
        discountCode: promoCode || undefined,
      });

      setCheckoutSuccessMessage(`Receipt #INV-2024-${8842 + transactions.length} Printed Successfully!`);
      // Reset cart with one sample product
      setTimeout(() => {
        setCart([]);
        setCheckoutSuccessMessage(null);
      }, 2500);
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Keyboard shortcut F12 to checkout, F2 to focus scanner
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F12') {
        e.preventDefault();
        handleCompleteSale();
      }
      if (e.key === 'F2') {
        e.preventDefault();
        document.getElementById('posBarcodeScanner')?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart, customerPhone, paymentMethod, promoCode]);

  const filteredTransactions = transactions.filter((tx) => {
    const matchSearch =
      tx.id.toLowerCase().includes(searchLedger.toLowerCase()) ||
      tx.customerName.toLowerCase().includes(searchLedger.toLowerCase()) ||
      tx.customerPhone.includes(searchLedger);
    const matchMethod = methodFilter === 'all' || tx.paymentMethod.toLowerCase() === methodFilter.toLowerCase();
    return matchSearch && matchMethod;
  });

  return (
    <div className="flex flex-col w-full gap-5 pb-12">
      {/* Top Banner / Title Header Area */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="bg-[#ffdad6] text-[#93000b] text-xs px-2.5 py-0.5 rounded-full uppercase tracking-wider font-bold">
              POS Terminal v2.4
            </span>
            <span className="text-[#5e5e65] text-xs">• Terminal ID: MIN-REG-02</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold text-[#1a1c1b] tracking-tight mt-1">
            Sales Transactions &amp; POS Billing Terminal
          </h1>
          <p className="text-sm text-[#5e5e65] mt-0.5">
            Process customer checkouts, track cashier registers, and audit daily sales records in real-time.
          </p>
        </div>
        <div className="flex items-center gap-2.5 self-start lg:self-center">
          <button
            type="button"
            onClick={() => setIsRegisterModalOpen(true)}
            className="bg-white hover:bg-[#f4f3f1] text-[#1a1c1b] text-xs font-semibold py-2.5 px-4 rounded-lg shadow-sm border border-[#efeeec] flex items-center gap-1.5 transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">receipt_long</span>
            <span>View Register Summary</span>
          </button>
          <button
            type="button"
            onClick={() => document.getElementById('posBarcodeScanner')?.focus()}
            className="bg-[#bb0012] hover:bg-[#e7151f] text-white text-xs font-semibold py-2.5 px-5 rounded-lg shadow-md hover:shadow-lg flex items-center gap-1.5 transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">add_shopping_cart</span>
            <span>+ New Quick Sale / POS</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-[#efeeec] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#5e5e65] uppercase tracking-wider font-semibold">Today's Sales</span>
            <div className="w-8 h-8 rounded-lg bg-[#ffdad6]/60 flex items-center justify-center text-[#bb0012]">
              <span className="material-symbols-outlined text-[18px]">payments</span>
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-[#1a1c1b]">₹48,920</span>
              <span className="text-xs text-[#5e5e65]">INR</span>
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="inline-flex items-center text-[#006947] text-xs font-bold bg-[#6ffbbe]/30 px-1.5 py-0.5 rounded">
                <span className="material-symbols-outlined text-[14px]">trending_up</span> +18.4%
              </span>
              <span className="text-xs text-[#5e5e65]">vs yesterday (₹41,300)</span>
            </div>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-[#efeeec] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#5e5e65] uppercase tracking-wider font-semibold">Today's Orders</span>
            <div className="w-8 h-8 rounded-lg bg-[#f4f3f1] flex items-center justify-center text-[#1a1c1b]">
              <span className="material-symbols-outlined text-[18px]">receipt</span>
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-[#1a1c1b]">{142 + transactions.length - 5}</span>
              <span className="text-xs text-[#5e5e65]">receipts</span>
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="inline-flex items-center text-[#006947] text-xs font-bold bg-[#6ffbbe]/30 px-1.5 py-0.5 rounded">
                <span className="material-symbols-outlined text-[14px]">arrow_upward</span> +12
              </span>
              <span className="text-xs text-[#5e5e65]">peak rate @ 13:00-14:30</span>
            </div>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-[#efeeec] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#5e5e65] uppercase tracking-wider font-semibold">Average Order Value</span>
            <div className="w-8 h-8 rounded-lg bg-[#f4f3f1] flex items-center justify-center text-[#1a1c1b]">
              <span className="material-symbols-outlined text-[18px]">shopping_bag</span>
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-[#1a1c1b]">₹344.50</span>
              <span className="text-xs text-[#5e5e65]">/ basket</span>
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="inline-flex items-center text-[#006947] text-xs font-bold bg-[#6ffbbe]/30 px-1.5 py-0.5 rounded">
                +5.2%
              </span>
              <span className="text-xs text-[#5e5e65]">upsell attach rate: 31%</span>
            </div>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-[#efeeec] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#5e5e65] uppercase tracking-wider font-semibold">October Target Pace</span>
            <span className="text-xs font-bold text-[#bb0012] bg-[#ffdad6]/60 px-2 py-0.5 rounded-full">89% Achieved</span>
          </div>
          <div className="mt-2.5">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold text-[#1a1c1b]">₹8,45,600</span>
              <span className="text-xs text-[#5e5e65]">Goal: ₹9.5L</span>
            </div>
            <div className="w-full bg-[#e9e8e6] rounded-full h-2 mt-2 overflow-hidden">
              <div className="bg-[#bb0012] h-full rounded-full transition-all duration-500" style={{ width: '89%' }}></div>
            </div>
            <div className="flex justify-between items-center mt-1.5 text-[11px] text-[#5e5e65]">
              <span>7 days remaining</span>
              <span className="font-mono font-semibold text-[#1a1c1b]">₹1,04,400 to target</span>
            </div>
          </div>
        </div>
      </div>

      {/* Two-Column Split Workspace (7 Cols Table + 5 Cols Live POS) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
        {/* Left: 7 Columns Recent Sales Records */}
        <div className="xl:col-span-7 flex flex-col gap-4">
          {/* Filter Toolbar */}
          <div className="bg-white p-3.5 rounded-xl shadow-sm border border-[#efeeec] flex flex-col gap-2.5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[20px] text-[#bb0012]">history</span>
                <h2 className="text-base font-bold text-[#1a1c1b]">Recent Sales Records</h2>
                <span className="bg-[#f4f3f1] text-[#5e5e65] font-mono text-xs px-2 py-0.5 rounded-full">
                  {transactions.length} total
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 bg-[#f4f3f1] px-3 py-1.5 rounded-lg text-[#1a1c1b] text-xs font-medium">
                  <span className="material-symbols-outlined text-[16px] text-[#5e5e65]">calendar_today</span>
                  <span>Today: Oct 24, 2024</span>
                </div>
                <button
                  type="button"
                  onClick={handleExportSalesCsv}
                  className="p-1.5 rounded-lg bg-[#f4f3f1] hover:bg-[#e9e8e6] text-[#5e5e65] hover:text-[#1a1c1b]"
                  title="Export CSV"
                >
                  <span className="material-symbols-outlined text-[18px]">download</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 pt-1 border-t border-[#f4f3f1]">
              <div className="sm:col-span-6 relative">
                <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-[#5e5e65] text-[16px]">
                  search
                </span>
                <input
                  type="text"
                  value={searchLedger}
                  onChange={(e) => setSearchLedger(e.target.value)}
                  placeholder="Search Bill # or customer..."
                  className="w-full bg-[#f4f3f1] text-[#1a1c1b] placeholder:text-[#5e5e65] text-xs pl-8 pr-3 py-2 rounded-lg outline-none border border-transparent focus:border-[#bb0012]/30"
                />
              </div>
              <div className="sm:col-span-3">
                <select
                  value={methodFilter}
                  onChange={(e) => setMethodFilter(e.target.value)}
                  className="w-full bg-[#f4f3f1] text-[#1a1c1b] text-xs px-2.5 py-2 rounded-lg outline-none cursor-pointer border border-[#efeeec]"
                >
                  <option value="all">All Payment Methods</option>
                  <option value="upi">UPI / QR</option>
                  <option value="card">Card (POS)</option>
                  <option value="cash">Store Cash</option>
                </select>
              </div>
              <div className="sm:col-span-3">
                <select className="w-full bg-[#f4f3f1] text-[#1a1c1b] text-xs px-2.5 py-2 rounded-lg outline-none cursor-pointer border border-[#efeeec]">
                  <option value="reg2">Reg #02 (Priya S.)</option>
                  <option value="reg1">Reg #01 (Arjun V.)</option>
                  <option value="all">All Registers</option>
                </select>
              </div>
            </div>
          </div>

          {/* Ledger Table */}
          <div className="bg-white rounded-xl shadow-sm border border-[#efeeec] overflow-hidden flex flex-col">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#f4f3f1] text-[#5e5e65] text-[11px] uppercase tracking-wider font-semibold">
                    <th className="py-2.5 px-3">Sale ID &amp; Time</th>
                    <th className="py-2.5 px-3">Customer</th>
                    <th className="py-2.5 px-3">Items Summary</th>
                    <th className="py-2.5 px-3 text-right">Subtotal &amp; Disc</th>
                    <th className="py-2.5 px-3 text-right">Total Paid</th>
                    <th className="py-2.5 px-3 text-center">Payment</th>
                    <th className="py-2.5 px-3 text-center">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f4f3f1] text-xs">
                  {filteredTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-[#f4f3f1]/60 transition-colors group">
                      <td className="py-3 px-3">
                        <div className="flex flex-col">
                          <span className="font-mono font-bold text-[#1a1c1b] group-hover:text-[#bb0012] transition-colors">
                            {tx.id}
                          </span>
                          <span className="text-[#5e5e65] text-[10px]">{tx.time}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex flex-col">
                          <span className="font-semibold text-[#1a1c1b] leading-tight">{tx.customerName}</span>
                          <span className="font-mono text-[10px] text-[#5e5e65]">{tx.customerPhone}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-[#1a1c1b] line-clamp-1 max-w-[150px]">{tx.itemsSummary}</span>
                      </td>
                      <td className="py-3 px-3 text-right font-mono">
                        <div className="flex flex-col items-end">
                          <span className="text-[#1a1c1b]">₹{tx.subtotal.toFixed(2)}</span>
                          {tx.discount > 0 && (
                            <span className="text-[#006947] text-[10px]">
                              -₹{tx.discount} ({tx.discountLabel || 'DISC'})
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-[#1a1c1b]">
                        ₹{tx.total.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            tx.paymentMethod === 'UPI'
                              ? 'bg-[#6ffbbe]/40 text-[#002113]'
                              : tx.paymentMethod === 'Card'
                              ? 'bg-[#e4e1ea] text-[#1b1b21]'
                              : 'bg-[#f4f3f1] text-[#1a1c1b]'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[12px]">
                            {tx.paymentMethod === 'UPI'
                              ? 'qr_code_2'
                              : tx.paymentMethod === 'Card'
                              ? 'credit_card'
                              : 'payments'}
                          </span>
                          {tx.paymentMethod}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => setPrintedReceipt(tx)}
                          className="p-1 rounded hover:bg-[#f4f3f1] text-[#5e5e65] hover:text-[#bb0012] transition-colors"
                          title="Print Receipt"
                        >
                          <span className="material-symbols-outlined text-[18px]">print</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-3 bg-[#f4f3f1]/50 flex items-center justify-between text-xs text-[#5e5e65]">
              <span>Showing {filteredTransactions.length} recorded POS transactions</span>
              <span className="font-mono text-[#006947] font-semibold">Live Realtime Sync</span>
            </div>
          </div>

          {/* Quick Operational Alerts / Cashier Drawer Snapshot */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-[#efeeec] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#6ffbbe]/30 text-[#006947] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[22px]">point_of_sale</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-[#5e5e65]">Register Cash In-Hand</span>
                  <span className="text-base font-bold text-[#1a1c1b] font-mono">₹14,250.00</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsRegisterModalOpen(true)}
                className="px-3 py-1.5 rounded-lg bg-[#f4f3f1] hover:bg-[#e9e8e6] text-[#1a1c1b] text-xs font-semibold"
              >
                Audit
              </button>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm border border-[#efeeec] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#ffdad6]/50 text-[#bb0012] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[22px]">sync_problem</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-[#5e5e65]">Pending Sync</span>
                  <span className="text-base font-bold text-[#1a1c1b]">0 Receipts</span>
                </div>
              </div>
              <span className="bg-[#6ffbbe]/30 text-[#006947] px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-[#006947]"></span> MySQL Live
              </span>
            </div>
          </div>
        </div>

        {/* Right: 5 Columns Interactive Live Point of Sale Terminal */}
        <div className="xl:col-span-5 flex flex-col gap-4 sticky top-20">
          <div className="bg-white rounded-xl shadow-md border border-[#efeeec] overflow-hidden flex flex-col">
            {/* POS Terminal Header */}
            <div className="p-3.5 bg-white flex items-center justify-between border-b border-[#efeeec]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-[#bb0012] text-white flex items-center justify-center font-bold text-sm shadow-sm">
                  M
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-[#1a1c1b]">POS Terminal</span>
                    <span className="h-2 w-2 rounded-full bg-[#006947]"></span>
                  </div>
                  <span className="text-[11px] text-[#5e5e65]">
                    Cashier: <strong>Priya Sharma</strong> • Reg #02
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="bg-[#f4f3f1] px-2 py-0.5 rounded text-[#5e5e65] font-mono text-xs">
                  ORDER #2024-{8842 + transactions.length}
                </span>
                <button
                  type="button"
                  onClick={() => setCart([])}
                  className="p-1 rounded-lg hover:bg-[#f4f3f1] text-[#5e5e65] hover:text-[#ba1a1a]"
                  title="Clear Basket"
                >
                  <span className="material-symbols-outlined text-[18px]">restart_alt</span>
                </button>
              </div>
            </div>

            {/* Barcode Scanner Input */}
            <form onSubmit={handleAddItem} className="p-3.5 bg-[#f4f3f1] flex flex-col gap-1 border-b border-[#efeeec]">
              <div className="flex items-center justify-between text-xs text-[#5e5e65] font-semibold">
                <span>Scan barcode or search item to add to basket</span>
                <span className="font-mono text-[10px] bg-[#e9e8e6] px-1.5 py-0.5 rounded">F2 / SCANNER</span>
              </div>
              <div className="relative flex items-center mt-1">
                <span className="material-symbols-outlined absolute left-3 text-[#bb0012] text-[20px]">
                  barcode_scanner
                </span>
                <input
                  type="text"
                  id="posBarcodeScanner"
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  placeholder="Scan SKU e.g. 890423184910 or Kuromi..."
                  className="w-full bg-white text-[#1a1c1b] placeholder:text-[#5e5e65] text-xs pl-10 pr-20 py-2.5 rounded-lg shadow-sm outline-none focus:ring-2 focus:ring-[#bb0012]/30 border border-[#efeeec]"
                />
                <button
                  type="submit"
                  className="absolute right-1.5 bg-[#e9e8e6] hover:bg-[#dadad8] text-[#1a1c1b] text-xs font-semibold px-3 py-1 rounded-md"
                >
                  + Add
                </button>
              </div>
            </form>

            {/* Active Cart Items */}
            <div className="p-3.5 flex flex-col gap-2.5 max-h-[300px] overflow-y-auto">
              <div className="flex items-center justify-between text-[#5e5e65] text-xs font-semibold">
                <span>ACTIVE BASKET ({cart.length} ITEMS)</span>
                {promoCode && (
                  <span className="text-[#006947] flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">local_offer</span> 1 Promo Applied
                  </span>
                )}
              </div>

              {cart.length === 0 ? (
                <div className="py-8 text-center text-xs text-[#5e5e65] flex flex-col items-center gap-2">
                  <span className="material-symbols-outlined text-[32px] text-[#5e5e65]/40">shopping_cart</span>
                  <span>Basket is empty. Scan an item above to start.</span>
                </div>
              ) : (
                cart.map((item, idx) => (
                  <div
                    key={`${item.product.id}-${idx}`}
                    className="p-2.5 bg-[#f4f3f1] rounded-xl flex items-center justify-between gap-2.5 group hover:bg-[#efeeec] transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={item.product.imageUrl}
                        alt={item.product.name}
                        referrerPolicy="no-referrer"
                        className="w-11 h-11 rounded-lg object-cover bg-white shrink-0 border border-black/5"
                      />
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-semibold text-[#1a1c1b] truncate max-w-[150px]">
                          {item.product.name}
                        </span>
                        <span className="font-mono text-[10px] text-[#5e5e65]">
                          ₹{item.product.sellingPrice.toFixed(2)} each
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      <div className="flex items-center bg-white rounded-lg shadow-sm border border-[#efeeec] overflow-hidden">
                        <button
                          type="button"
                          onClick={() => updateQuantity(idx, -1)}
                          className="w-6 h-6 flex items-center justify-center text-[#1a1c1b] hover:bg-[#f4f3f1] font-bold text-xs"
                        >
                          −
                        </button>
                        <span className="w-6 text-center font-mono text-xs font-semibold text-[#1a1c1b]">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(idx, 1)}
                          className="w-6 h-6 flex items-center justify-center text-[#1a1c1b] hover:bg-[#f4f3f1] font-bold text-xs"
                        >
                          +
                        </button>
                      </div>
                      <span className="font-mono font-bold text-[#1a1c1b] text-xs w-16 text-right">
                        ₹{(item.product.sellingPrice * item.quantity).toFixed(2)}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeItem(idx)}
                        className="text-[#5e5e65] hover:text-[#ba1a1a] p-1"
                        title="Remove"
                      >
                        <span className="material-symbols-outlined text-[16px]">delete_outline</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Calculations Breakdown Box */}
            <div className="p-3.5 bg-[#f4f3f1] flex flex-col gap-1.5 border-t border-[#efeeec] text-xs">
              <div className="flex justify-between items-center text-[#5e5e65]">
                <span>Subtotal ({cart.reduce((s, i) => s + i.quantity, 0)} items)</span>
                <span className="font-mono text-[#1a1c1b] font-medium">₹{subtotal.toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-[#006947] flex items-center gap-1 font-medium">
                    <span className="material-symbols-outlined text-[14px]">high_res</span>
                    Festive Promo ({promoCode}) - 10%
                  </span>
                  <span className="font-mono text-[#006947] font-semibold">-₹{discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between items-center text-[#5e5e65]">
                <span>CGST + SGST (18% inclusive ledger)</span>
                <span className="font-mono text-[#1a1c1b] font-medium">+₹{gst.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-[#5e5e65]">
                <span>Round off adj.</span>
                <span className="font-mono text-[#1a1c1b] font-medium">+₹0.25</span>
              </div>

              {/* Grand Total Bar */}
              <div className="bg-white p-3 rounded-xl mt-1 shadow-sm border border-[#efeeec] flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[10px] text-[#5e5e65] font-semibold uppercase tracking-wider">
                    Grand Total Due
                  </span>
                  <span className="text-2xl text-[#bb0012] font-black tracking-tight font-mono">
                    ₹{grandTotal.toLocaleString('en-IN')}.00
                  </span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[10px] text-[#006947] bg-[#6ffbbe]/30 px-2 py-0.5 rounded font-bold">
                    You Saved ₹{discount.toFixed(2)}
                  </span>
                  <span className="font-mono text-[10px] text-[#5e5e65] mt-0.5">
                    Points to Earn: {Math.floor(grandTotal * 0.01)} pts
                  </span>
                </div>
              </div>
            </div>

            {/* Customer & Payment Mode Selection */}
            <div className="p-3.5 bg-white flex flex-col gap-2.5">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-[#5e5e65] text-[16px]">
                    badge
                  </span>
                  <input
                    type="text"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="Customer Mobile (for loyalty &amp; SMS e-bill)"
                    className="w-full bg-[#f4f3f1] text-[#1a1c1b] text-xs pl-8 pr-3 py-1.5 rounded-lg outline-none border border-transparent focus:border-[#bb0012]/30"
                  />
                </div>
                <span className="bg-[#6ffbbe]/30 text-[#002113] text-[10px] font-bold px-2 py-1.5 rounded-lg flex items-center gap-1 shrink-0">
                  <span className="material-symbols-outlined text-[13px]">stars</span> Gold Member
                </span>
              </div>

              {/* Payment Mode Tabs */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('UPI')}
                  className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all ${
                    paymentMethod === 'UPI'
                      ? 'bg-[#bb0012] text-white shadow-sm font-semibold'
                      : 'bg-[#f4f3f1] text-[#1a1c1b] hover:bg-[#e9e8e6]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">qr_code_scanner</span>
                  <span className="text-xs mt-0.5">UPI / QR</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('Card')}
                  className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all ${
                    paymentMethod === 'Card'
                      ? 'bg-[#bb0012] text-white shadow-sm font-semibold'
                      : 'bg-[#f4f3f1] text-[#1a1c1b] hover:bg-[#e9e8e6]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">credit_card</span>
                  <span className="text-xs mt-0.5">Card (POS)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('Cash')}
                  className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all ${
                    paymentMethod === 'Cash'
                      ? 'bg-[#bb0012] text-white shadow-sm font-semibold'
                      : 'bg-[#f4f3f1] text-[#1a1c1b] hover:bg-[#e9e8e6]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">payments</span>
                  <span className="text-xs mt-0.5">Store Cash</span>
                </button>
              </div>

              {/* Payment Info Hint */}
              {paymentMethod === 'UPI' && (
                <div className="p-2.5 bg-[#f4f3f1] rounded-xl flex items-center justify-between gap-2 border border-[#efeeec]">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-white rounded-lg p-0.5 shadow-sm flex items-center justify-center">
                      <span className="material-symbols-outlined text-[#bb0012] text-[22px]">qr_code_2</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-[#1a1c1b]">Dynamic BharatPe / UPI QR Ready</span>
                      <span className="font-mono text-[10px] text-[#5e5e65]">
                        Customer display updated with ₹{grandTotal}
                      </span>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-[#006947] text-[18px]">check_circle</span>
                </div>
              )}

              {/* Checkout Primary Big Button */}
              <button
                type="button"
                onClick={handleCompleteSale}
                disabled={isProcessing}
                className="w-full bg-[#bb0012] hover:bg-[#e7151f] text-white font-bold py-3.5 px-4 rounded-xl shadow-lg hover:shadow-xl flex items-center justify-between transition-all active:scale-[0.99] mt-1"
              >
                <div className="flex items-center gap-2">
                  <span className={`material-symbols-outlined text-[22px] ${isProcessing ? 'animate-spin' : ''}`}>
                    {isProcessing ? 'sync' : 'receipt_long'}
                  </span>
                  <span className="text-sm font-bold">
                    {isProcessing ? 'Generating Bill...' : checkoutSuccessMessage ? checkoutSuccessMessage : 'Complete Sale & Print Java Bill'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-base font-extrabold">₹{grandTotal}.00</span>
                  <span className="bg-white/20 text-white font-mono text-[10px] px-1.5 py-0.5 rounded uppercase font-semibold">
                    F12
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* Peripheral Hardware Status */}
          <div className="bg-white p-3 rounded-xl shadow-sm border border-[#efeeec] flex items-center justify-between text-xs text-[#5e5e65]">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-[#006947]"></span>
                <span>Thermal Printer 80mm</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-[#006947]"></span>
                <span>Handheld Scanner</span>
              </div>
            </div>
            <button
              type="button"
              disabled={isTestingFeed}
              onClick={() => {
                setIsTestingFeed(true);
                setTimeout(() => {
                  setIsTestingFeed(false);
                  if (addToast) addToast('Thermal Receipt Printer 80mm: Test paper feed cut OK', 'success');
                }, 800);
              }}
              className="text-[#bb0012] hover:underline font-semibold text-[11px]"
            >
              {isTestingFeed ? 'Testing...' : 'Test Feed'}
            </button>
          </div>
        </div>
      </div>

      {/* Printed Receipt Modal Preview */}
      {printedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-sm rounded-xl p-5 shadow-2xl border border-[#efeeec] font-mono text-xs flex flex-col gap-3">
            <div className="text-center pb-2 border-b border-dashed border-[#5e5e65]/40">
              <div className="font-bold text-sm text-[#bb0012]">MINISO INDIA RETAIL</div>
              <div className="text-[10px] text-[#5e5e65]">Store #104 - Phoenix Marketcity, Mumbai</div>
              <div className="text-[10px] text-[#5e5e65]">GSTIN: 27AABCM9120F1ZT</div>
            </div>
            <div className="flex justify-between text-[11px]">
              <span>Receipt: {printedReceipt.id}</span>
              <span>{printedReceipt.time}</span>
            </div>
            <div className="text-[11px]">
              <div>Customer: {printedReceipt.customerName}</div>
              <div>Phone: {printedReceipt.customerPhone}</div>
              <div>Cashier: {printedReceipt.cashier} ({printedReceipt.registerId})</div>
            </div>
            <div className="py-2 border-t border-b border-dashed border-[#5e5e65]/40 space-y-1">
              <div className="flex justify-between">
                <span>Items Summary</span>
                <span>Amount</span>
              </div>
              <div className="flex justify-between text-[10px] text-[#5e5e65]">
                <span>{printedReceipt.itemsSummary}</span>
                <span>₹{printedReceipt.subtotal}</span>
              </div>
              {printedReceipt.discount > 0 && (
                <div className="flex justify-between text-[10px] text-[#006947]">
                  <span>Discount ({printedReceipt.discountLabel})</span>
                  <span>-₹{printedReceipt.discount}</span>
                </div>
              )}
            </div>
            <div className="flex justify-between font-bold text-sm">
              <span>TOTAL PAID ({printedReceipt.paymentMethod})</span>
              <span>₹{printedReceipt.total}.00</span>
            </div>
            <div className="text-center text-[10px] text-[#5e5e65] pt-2 border-t border-dashed border-[#5e5e65]/40">
              Thank you for shopping at MINISO!
              <br />
              Love Life, Love MINISO.
            </div>
            <button
              type="button"
              onClick={() => setPrintedReceipt(null)}
              className="mt-2 w-full py-2 rounded-lg bg-[#bb0012] text-white font-sans font-semibold text-xs"
            >
              Close Receipt
            </button>
          </div>
        </div>
      )}

      {/* CASH DRAWER & REGISTER AUDIT MODAL */}
      {isRegisterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 border border-[#efeeec] flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-[#efeeec] pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#bb0012]">point_of_sale</span>
                <div>
                  <h3 className="text-base font-bold text-[#1a1c1b]">POS Cash Drawer &amp; Shift Audit</h3>
                  <span className="text-[10px] text-[#5e5e65]">Terminal MIN-REG-02 • Shift Cashier: Priya Sharma</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsRegisterModalOpen(false)}
                className="p-1 rounded hover:bg-[#f4f3f1] text-[#5e5e65]"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between items-center p-2.5 bg-[#f4f3f1] rounded-lg">
                <span className="text-[#5e5e65]">Opening Float Balance:</span>
                <span className="font-mono font-bold text-[#1a1c1b]">₹5,000.00</span>
              </div>
              <div className="flex justify-between items-center p-2.5 bg-white border border-[#efeeec] rounded-lg">
                <span className="text-[#5e5e65]">Cash Tendered Today:</span>
                <span className="font-mono font-bold text-[#1a1c1b]">₹14,250.00</span>
              </div>
              <div className="flex justify-between items-center p-2.5 bg-white border border-[#efeeec] rounded-lg">
                <span className="text-[#5e5e65]">UPI Digital Collections:</span>
                <span className="font-mono font-bold text-[#006947]">₹28,420.00</span>
              </div>
              <div className="flex justify-between items-center p-2.5 bg-white border border-[#efeeec] rounded-lg">
                <span className="text-[#5e5e65]">Card Machine (POS):</span>
                <span className="font-mono font-bold text-[#1a1c1b]">₹6,250.00</span>
              </div>
              <div className="p-3 bg-[#6ffbbe]/20 rounded-xl border border-[#6ffbbe]/40 flex items-center justify-between">
                <div>
                  <span className="font-bold text-[#006947]">Cash Drawer Count:</span>
                  <div className="text-[10px] text-[#006947]">Calculated (Float + Cash)</div>
                </div>
                <span className="font-mono font-bold text-lg text-[#006947]">₹19,250.00</span>
              </div>
              <div className="flex justify-between items-center px-1 text-[11px] text-[#5e5e65]">
                <span>Discrepancy / Variance:</span>
                <span className="font-mono font-bold text-[#006947]">₹0.00 (Balanced ✓)</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#efeeec]">
              <button
                type="button"
                onClick={() => setIsRegisterModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-[#f4f3f1] hover:bg-[#e9e8e6] text-xs font-semibold text-[#1a1c1b]"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsRegisterModalOpen(false);
                  if (addToast) addToast('Shift register audit verified and reconciled (Discrepancy: ₹0.00)', 'success');
                }}
                className="px-4 py-2 rounded-lg bg-[#bb0012] hover:bg-[#e7151f] text-white text-xs font-semibold"
              >
                Reconcile &amp; Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
