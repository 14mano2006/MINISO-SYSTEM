import React, { useState } from 'react';
import { Product } from '../../types/retail';

interface ProductsViewProps {
  products: Product[];
  onAddProduct: (product: Partial<Product>) => Promise<void>;
  onDeleteProduct: (id: string) => Promise<void>;
  addToast?: (message: string, type?: 'success' | 'warning' | 'info') => void;
}

export const ProductsView: React.FC<ProductsViewProps> = ({
  products,
  onAddProduct,
  onDeleteProduct,
  addToast,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [stockFilter, setStockFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<string[]>(['MNS-TY-0842', 'MNS-ST-1104']);

  // CSV Import state
  const [importCsvText, setImportCsvText] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  // Modal form states
  const [formData, setFormData] = useState({
    name: '',
    category: 'toys',
    barcode: '89042318' + Math.floor(1000 + Math.random() * 9000),
    sellingPrice: 599,
    costPrice: 280,
    festiveDiscount: 10,
    currentStock: 120,
    minLevel: 25,
    shelfLocation: 'Aisle B-04',
  });
  const [isSaving, setIsSaving] = useState(false);

  const categories = [
    { id: 'all', label: 'All Products', count: products.length, dot: null },
    { id: 'toys', label: 'Toys', count: products.filter(p => p.category === 'toys').length, dot: 'bg-rose-400' },
    { id: 'stationery', label: 'Stationery', count: products.filter(p => p.category === 'stationery').length, dot: 'bg-sky-400' },
    { id: 'beauty', label: 'Beauty', count: products.filter(p => p.category === 'beauty').length, dot: 'bg-purple-400' },
    { id: 'accessories', label: 'Accessories', count: products.filter(p => p.category === 'accessories').length, dot: 'bg-amber-400' },
    { id: 'home', label: 'Home', count: products.filter(p => p.category === 'home').length, dot: 'bg-teal-400' },
    { id: 'gifts', label: 'Gifts', count: products.filter(p => p.category === 'gifts').length, dot: 'bg-emerald-400' },
  ];

  const filteredProducts = products.filter((p) => {
    const matchCat = selectedCategory === 'all' || p.category === selectedCategory;
    const matchSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.barcode.includes(searchQuery);
    const matchStock =
      stockFilter === 'all' ||
      (stockFilter === 'in_stock' && p.status === 'In Stock') ||
      (stockFilter === 'low_stock' && (p.status === 'Low Stock' || p.status === 'Critical')) ||
      (stockFilter === 'out_of_stock' && p.status === 'Out of Stock');
    return matchCat && matchSearch && matchStock;
  });

  const handleSelectProduct = (id: string) => {
    setSelectedProducts((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedProducts(filteredProducts.map((p) => p.id));
    } else {
      setSelectedProducts([]);
    }
  };

  // Export CSV Functionality
  const exportProductsToCsv = (itemsToExport: Product[], filename = 'miniso_product_catalog.csv') => {
    if (itemsToExport.length === 0) {
      if (addToast) addToast('No products to export', 'warning');
      return;
    }
    const headers = [
      'SKU',
      'Name',
      'Category',
      'Barcode',
      'SellingPriceINR',
      'CostPriceINR',
      'GrossMarginPct',
      'CurrentStock',
      'SafetyMin',
      'ShelfLocation',
      'Status'
    ];

    const rows = itemsToExport.map(p => {
      const margin = p.sellingPrice > 0 ? Math.round(((p.sellingPrice - p.costPrice) / p.sellingPrice) * 100) : 0;
      return [
        p.sku,
        `"${p.name.replace(/"/g, '""')}"`,
        p.category,
        `'${p.barcode}`,
        p.sellingPrice,
        p.costPrice,
        `${margin}%`,
        p.currentStock,
        p.safetyMin,
        `"${p.shelfLocation || 'Aisle 01'}"`,
        p.status
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent([headers.join(','), ...rows].join('\n'));
    const link = document.createElement('a');
    link.setAttribute('href', csvContent);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();

    if (addToast) addToast(`Exported ${itemsToExport.length} products to CSV`, 'success');
  };

  const handleExportSelected = () => {
    const selectedItems = products.filter(p => selectedProducts.includes(p.id));
    if (selectedItems.length === 0) {
      exportProductsToCsv(filteredProducts, 'miniso_filtered_catalog.csv');
    } else {
      exportProductsToCsv(selectedItems, 'miniso_selected_skus.csv');
    }
  };

  const handleDownloadCsvTemplate = () => {
    const headers = ['Name', 'Category', 'Barcode', 'SellingPrice', 'CostPrice', 'Stock', 'MinStock', 'Location'];
    const sampleRows = [
      ['Miniso Sanrio Plush Keychain', 'toys', '890423189901', '399', '180', '150', '30', 'Aisle B-01'],
      ['Kawaii Pastel Gel Pen Set 6pc', 'stationery', '890423189902', '199', '80', '240', '40', 'Aisle A-03'],
      ['Cherry Blossom Hand Lotion 50ml', 'beauty', '890423189903', '249', '110', '90', '20', 'Aisle C-02'],
    ];
    const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent([headers.join(','), ...sampleRows.map(r => r.join(','))].join('\n'));
    const link = document.createElement('a');
    link.setAttribute('href', csvContent);
    link.setAttribute('download', 'miniso_sku_import_template.csv');
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handleProcessCsvImport = async () => {
    if (!importCsvText.trim()) {
      if (addToast) addToast('Please paste CSV data or choose a template', 'warning');
      return;
    }
    setIsImporting(true);
    try {
      const lines = importCsvText.trim().split('\n');
      let importedCount = 0;
      // skip header if present
      const startIdx = lines[0].toLowerCase().includes('name') ? 1 : 0;
      for (let i = startIdx; i < lines.length; i++) {
        const parts = lines[i].split(',').map(s => s.trim().replace(/^["']|["']$/g, ''));
        if (parts.length >= 2 && parts[0]) {
          await onAddProduct({
            name: parts[0],
            category: (parts[1] || 'toys') as any,
            categoryLabel: (parts[1] || 'toys').toUpperCase(),
            barcode: parts[2] || ('89042318' + Math.floor(1000 + Math.random() * 9000)),
            sellingPrice: Number(parts[3]) || 499,
            costPrice: Number(parts[4]) || 220,
            currentStock: Number(parts[5]) || 100,
            minLevel: Number(parts[6]) || 20,
            safetyMin: Number(parts[6]) || 20,
            shelfLocation: parts[7] || 'Aisle A-01',
          });
          importedCount++;
        }
      }
      setIsImportModalOpen(false);
      setImportCsvText('');
      if (addToast) addToast(`Successfully imported ${importedCount} SKUs into catalog!`, 'success');
    } catch (err) {
      console.error(err);
      if (addToast) addToast('Failed to parse and import CSV', 'warning');
    } finally {
      setIsImporting(false);
    }
  };

  const handleSubmitModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;
    setIsSaving(true);
    try {
      await onAddProduct({
        name: formData.name,
        category: formData.category as any,
        categoryLabel: formData.category.charAt(0).toUpperCase() + formData.category.slice(1),
        barcode: formData.barcode,
        sellingPrice: Number(formData.sellingPrice),
        costPrice: Number(formData.costPrice),
        currentStock: Number(formData.currentStock),
        minLevel: Number(formData.minLevel),
        safetyMin: Number(formData.minLevel),
        shelfLocation: formData.shelfLocation,
        festiveDiscount: Number(formData.festiveDiscount),
      });
      setIsModalOpen(false);
      setFormData({
        name: '',
        category: 'toys',
        barcode: '89042318' + Math.floor(1000 + Math.random() * 9000),
        sellingPrice: 599,
        costPrice: 280,
        festiveDiscount: 10,
        currentStock: 120,
        minLevel: 25,
        shelfLocation: 'Aisle B-04',
      });
      if (addToast) addToast(`Added SKU ${formData.name}`, 'success');
    } catch (err) {
      console.error(err);
      if (addToast) addToast('Error adding product', 'warning');
    } finally {
      setIsSaving(false);
    }
  };

  // Products to print barcodes for
  const printProducts = selectedProducts.length > 0
    ? products.filter(p => selectedProducts.includes(p.id))
    : filteredProducts.slice(0, 8);

  return (
    <div className="flex flex-col w-full gap-5 pb-12">
      {/* Top Banner / Title Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full bg-[#e9e8e6] text-[#5e5e65] text-xs uppercase tracking-wider font-semibold">
              Store Master
            </span>
            <span className="text-[#5e5e65] text-xs">•</span>
            <span className="text-[#006947] text-xs font-semibold flex items-center gap-1">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#006947] animate-pulse"></span>
              Sync: Live 3306 DB
            </span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold text-[#1a1c1b] tracking-tight leading-tight">
            Product Catalog &amp; SKU Master
          </h1>
          <p className="text-sm text-[#5e5e65] max-w-2xl">
            Manage retail inventory, pricing tier hierarchies, optical barcode mappings, and category catalog for Phoenix Mall Store #104.
          </p>
        </div>

        {/* Global CTA Buttons */}
        <div className="flex items-center gap-2.5 self-start md:self-auto shrink-0 flex-wrap">
          <button
            type="button"
            onClick={() => exportProductsToCsv(products)}
            className="flex items-center gap-1.5 bg-white hover:bg-[#f4f3f1] text-[#1a1c1b] text-xs font-semibold px-3.5 py-2.5 rounded-lg shadow-sm border border-[#efeeec] transition-all"
            title="Download full catalog CSV"
          >
            <span className="material-symbols-outlined text-[18px] text-[#5e5e65]">download</span>
            <span>Export CSV</span>
          </button>
          <button
            type="button"
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center gap-1.5 bg-white hover:bg-[#f4f3f1] text-[#1a1c1b] text-xs font-semibold px-3.5 py-2.5 rounded-lg shadow-sm border border-[#efeeec] transition-all"
          >
            <span className="material-symbols-outlined text-[18px] text-[#5e5e65]">upload_file</span>
            <span>Import CSV/Excel</span>
          </button>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 bg-[#bb0012] hover:bg-[#e7151f] text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span>+ Add New Product</span>
          </button>
        </div>
      </div>

      {/* Metric Quick Rollup Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-[#efeeec] flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs text-[#5e5e65] font-medium">Total Active Catalog</span>
            <span className="text-xl font-bold text-[#1a1c1b] tracking-tight">
              {products.length} <span className="text-xs font-normal text-[#5e5e65]">SKUs</span>
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#f4f3f1] flex items-center justify-center text-[#bb0012]">
            <span className="material-symbols-outlined text-[22px]">category</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-[#efeeec] flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs text-[#5e5e65] font-medium">Stock Value (Selling)</span>
            <span className="text-xl font-bold text-[#1a1c1b] tracking-tight">
              ₹{(products.reduce((acc, p) => acc + p.sellingPrice * p.currentStock, 0) / 100000).toFixed(1)}L
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#6ffbbe]/20 flex items-center justify-center text-[#006947]">
            <span className="material-symbols-outlined text-[22px]">currency_rupee</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-[#efeeec] flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs text-[#5e5e65] font-medium">Low Stock Alerts</span>
            <span className="text-xl font-bold text-[#ba1a1a] tracking-tight">
              {products.filter(p => p.status === 'Low Stock' || p.status === 'Critical').length}{' '}
              <span className="text-xs font-normal text-[#5e5e65]">Items</span>
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#ffdad6] flex items-center justify-center text-[#ba1a1a]">
            <span className="material-symbols-outlined text-[22px]">warning</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-[#efeeec] flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs text-[#5e5e65] font-medium">Avg Gross Margin</span>
            <span className="text-xl font-bold text-[#006947] tracking-tight">
              {Math.round(
                products.reduce((acc, p) => acc + ((p.sellingPrice - p.costPrice) / (p.sellingPrice || 1)) * 100, 0) /
                  (products.length || 1)
              )}%
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#f4f3f1] flex items-center justify-center text-[#006947]">
            <span className="material-symbols-outlined text-[22px]">trending_up</span>
          </div>
        </div>
      </div>

      {/* Category Pills Strip */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {categories.map((cat) => {
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-[#bb0012] text-white shadow-sm'
                  : 'bg-white hover:bg-[#f4f3f1] text-[#1a1c1b] border border-[#efeeec]'
              }`}
            >
              {cat.dot && <span className={`w-2 h-2 rounded-full ${cat.dot}`} />}
              <span>{cat.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  isActive ? 'bg-white/20 text-white' : 'bg-[#f4f3f1] text-[#5e5e65]'
                }`}
              >
                {cat.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Filter and Bulk Action Controls */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 bg-white p-3 rounded-xl shadow-sm border border-[#efeeec]">
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          {/* Search Box */}
          <div className="relative min-w-[240px] flex-1 max-w-md">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#5e5e65] text-[18px]">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by SKU, Product Name or Barcode..."
              className="w-full bg-[#f4f3f1] text-[#1a1c1b] placeholder:text-[#5e5e65] text-xs pl-9 pr-4 py-2 rounded-lg outline-none border border-transparent focus:border-[#bb0012]/30 focus:bg-white transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#5e5e65] hover:text-[#1a1c1b]"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            )}
          </div>

          {/* Stock Filter Select */}
          <div className="flex items-center gap-2">
            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value)}
              className="bg-[#f4f3f1] text-[#1a1c1b] text-xs px-3 py-2 rounded-lg outline-none border border-transparent focus:border-[#bb0012]/30 cursor-pointer"
            >
              <option value="all">All Inventory Statuses</option>
              <option value="in_stock">In Stock Only</option>
              <option value="low_stock">Low Stock &amp; Critical</option>
              <option value="out_of_stock">Out of Stock Only</option>
            </select>
          </div>
        </div>

        {/* Bulk Actions Strip */}
        <div className="flex items-center gap-2 justify-end pt-1 xl:pt-0">
          <span className="text-xs text-[#5e5e65] hidden lg:inline">
            Selected: <strong className="text-[#1a1c1b] font-semibold">{selectedProducts.length} items</strong>
          </span>
          <button
            type="button"
            onClick={handleExportSelected}
            className="flex items-center gap-1 bg-[#f4f3f1] hover:bg-[#e9e8e6] text-[#1a1c1b] text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors border border-[#efeeec]"
          >
            <span className="material-symbols-outlined text-[16px]">file_download</span>
            <span>Export Selected</span>
          </button>
          <button
            type="button"
            onClick={() => setIsPrintModalOpen(true)}
            className="flex items-center gap-1 bg-[#f4f3f1] hover:bg-[#e9e8e6] text-[#1a1c1b] text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors border border-[#efeeec]"
          >
            <span className="material-symbols-outlined text-[16px]">print</span>
            <span>Print Labels</span>
          </button>
        </div>
      </div>

      {/* Primary Products Data Table */}
      <div className="bg-white rounded-xl shadow-sm border border-[#efeeec] overflow-hidden flex flex-col">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#f4f3f1] text-[#5e5e65] text-[11px] uppercase tracking-wider font-semibold border-b border-[#efeeec]">
                <th className="py-3 px-4 w-10">
                  <input
                    type="checkbox"
                    checked={filteredProducts.length > 0 && selectedProducts.length === filteredProducts.length}
                    onChange={handleSelectAll}
                    className="rounded border-[#efeeec] text-[#bb0012] focus:ring-0 cursor-pointer"
                  />
                </th>
                <th className="py-3 px-4">SKU / Code</th>
                <th className="py-3 px-4">Product Details</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4 text-right">Selling Price</th>
                <th className="py-3 px-4 text-right">Cost (INR)</th>
                <th className="py-3 px-4 text-right">Margin</th>
                <th className="py-3 px-4 text-right">Floor Stock</th>
                <th className="py-3 px-4">Shelf / Bay</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#efeeec] text-xs">
              {filteredProducts.map((prod) => {
                const isChecked = selectedProducts.includes(prod.id);
                const marginPct = prod.sellingPrice > 0 ? Math.round(((prod.sellingPrice - prod.costPrice) / prod.sellingPrice) * 100) : 0;
                return (
                  <tr
                    key={prod.id}
                    className={`hover:bg-[#faf9f7] transition-colors ${isChecked ? 'bg-[#ffdad6]/20' : ''}`}
                  >
                    <td className="py-3 px-4">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleSelectProduct(prod.id)}
                        className="rounded border-[#efeeec] text-[#bb0012] focus:ring-0 cursor-pointer"
                      />
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-[#1a1c1b]">
                      <div className="flex flex-col">
                        <span>{prod.sku}</span>
                        <span className="text-[10px] text-[#5e5e65]">{prod.barcode}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-col max-w-xs">
                        <span className="font-semibold text-[#1a1c1b] truncate" title={prod.name}>
                          {prod.name}
                        </span>
                        {prod.festiveDiscount && prod.festiveDiscount > 0 ? (
                          <span className="text-[10px] text-[#bb0012] font-semibold flex items-center gap-1">
                            <span className="material-symbols-outlined text-[12px]">celebration</span>
                            Diwali {prod.festiveDiscount}% Off
                          </span>
                        ) : (
                          <span className="text-[10px] text-[#5e5e65]">Standard retail shelf item</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full bg-[#f4f3f1] text-[#1a1c1b] text-[10px] font-semibold uppercase tracking-wider">
                        {prod.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-[#1a1c1b] font-mono">
                      ₹{prod.sellingPrice}
                    </td>
                    <td className="py-3 px-4 text-right text-[#5e5e65] font-mono">
                      ₹{prod.costPrice}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span
                        className={`font-semibold font-mono text-[11px] ${
                          marginPct >= 50
                            ? 'text-[#006947]'
                            : marginPct >= 35
                            ? 'text-[#047857]'
                            : 'text-[#b45309]'
                        }`}
                      >
                        {marginPct}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold">
                      <div className="flex flex-col items-end">
                        <span
                          className={
                            prod.currentStock <= prod.safetyMin
                              ? 'text-[#ba1a1a] font-bold'
                              : 'text-[#1a1c1b]'
                          }
                        >
                          {prod.currentStock} pcs
                        </span>
                        <span className="text-[10px] text-[#5e5e65]">Min: {prod.safetyMin}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-[#5e5e65] font-mono text-[11px]">
                      {prod.shelfLocation || 'Aisle 01'}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          prod.status === 'In Stock'
                            ? 'bg-[#6ffbbe]/40 text-[#002113]'
                            : prod.status === 'Critical'
                            ? 'bg-[#ffdad6] text-[#93000b]'
                            : prod.status === 'Low Stock'
                            ? 'bg-[#ffe08b]/40 text-[#241a00]'
                            : 'bg-[#f4f3f1] text-[#5e5e65]'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            prod.status === 'In Stock'
                              ? 'bg-[#047857]'
                              : prod.status === 'Critical'
                              ? 'bg-[#dc2626] animate-pulse'
                              : prod.status === 'Low Stock'
                              ? 'bg-[#b45309]'
                              : 'bg-[#5e5e65]'
                          }`}
                        ></span>
                        {prod.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1 text-[#5e5e65]">
                        <button
                          type="button"
                          onClick={() => setDetailProduct(prod)}
                          className="p-1 hover:bg-[#f4f3f1] rounded text-[#5e5e65] hover:text-[#1a1c1b]"
                          title="View Details"
                        >
                          <span className="material-symbols-outlined text-[18px]">visibility</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteProduct(prod.id)}
                          className="p-1 hover:bg-[#ffdad6] rounded text-[#5e5e65] hover:text-[#ba1a1a]"
                          title="Delete SKU"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="p-3 bg-[#f4f3f1]/70 flex items-center justify-between text-xs text-[#5e5e65]">
          <span>
            Showing <strong className="text-[#1a1c1b]">{filteredProducts.length}</strong> of{' '}
            <strong className="text-[#1a1c1b]">{products.length}</strong> products
          </span>
          <span className="font-mono text-[#006947] font-semibold">Active JDBC PreparedStatement Ready</span>
        </div>
      </div>

      {/* DETAIL SKU MODAL */}
      {detailProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl p-6 border border-[#efeeec] flex flex-col gap-4">
            <div className="flex items-start justify-between border-b border-[#efeeec] pb-3">
              <div>
                <span className="text-[11px] font-mono text-[#bb0012] font-semibold">{detailProduct.sku}</span>
                <h3 className="text-lg font-bold text-[#1a1c1b]">{detailProduct.name}</h3>
                <span className="text-xs text-[#5e5e65]">Category: {detailProduct.category.toUpperCase()}</span>
              </div>
              <button
                type="button"
                onClick={() => setDetailProduct(null)}
                className="p-1 rounded hover:bg-[#f4f3f1] text-[#5e5e65]"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Barcode Preview Representation */}
            <div className="bg-[#faf9f7] p-3 rounded-xl border border-[#efeeec] flex flex-col items-center">
              <span className="text-[10px] text-[#5e5e65] font-mono uppercase mb-1">EAN-13 Optical Barcode</span>
              <div className="h-10 w-48 bg-white border border-[#efeeec] rounded flex items-center justify-center tracking-widest font-mono text-sm font-bold text-[#1a1c1b]">
                ||| | |||| || | ||| ||
              </div>
              <span className="font-mono text-xs font-semibold text-[#1a1c1b] mt-1">{detailProduct.barcode}</span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-[#f4f3f1] rounded-lg">
                <span className="text-[#5e5e65]">Selling Price</span>
                <div className="text-base font-bold text-[#1a1c1b] font-mono">₹{detailProduct.sellingPrice}</div>
              </div>
              <div className="p-3 bg-[#f4f3f1] rounded-lg">
                <span className="text-[#5e5e65]">Cost Price</span>
                <div className="text-base font-bold text-[#1a1c1b] font-mono">₹{detailProduct.costPrice}</div>
              </div>
              <div className="p-3 bg-[#f4f3f1] rounded-lg">
                <span className="text-[#5e5e65]">Current Stock</span>
                <div className="text-base font-bold text-[#006947] font-mono">{detailProduct.currentStock} units</div>
              </div>
              <div className="p-3 bg-[#f4f3f1] rounded-lg">
                <span className="text-[#5e5e65]">Shelf Location</span>
                <div className="text-base font-bold text-[#1a1c1b] font-mono">{detailProduct.shelfLocation || 'Aisle B-02'}</div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[#efeeec]">
              <button
                type="button"
                onClick={() => {
                  setSelectedProducts([detailProduct.id]);
                  setDetailProduct(null);
                  setIsPrintModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#f4f3f1] hover:bg-[#e9e8e6] text-xs font-semibold text-[#1a1c1b]"
              >
                <span className="material-symbols-outlined text-[16px]">print</span>
                <span>Print Barcode Label</span>
              </button>
              <button
                type="button"
                onClick={() => setDetailProduct(null)}
                className="px-4 py-2 rounded-lg bg-[#bb0012] text-white text-xs font-semibold hover:bg-[#e7151f]"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BARCODE LABELS PRINT MODAL */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl p-6 border border-[#efeeec] flex flex-col gap-4 max-h-[85vh] overflow-hidden">
            <div className="flex items-center justify-between border-b border-[#efeeec] pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#bb0012]">print</span>
                <h3 className="text-base font-bold text-[#1a1c1b]">
                  80mm Thermal Barcode Label Print Preview ({printProducts.length} items)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsPrintModalOpen(false)}
                className="p-1 rounded hover:bg-[#f4f3f1] text-[#5e5e65]"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-2 grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#faf9f7] rounded-xl border border-[#efeeec]">
              {printProducts.map((p) => (
                <div key={p.id} className="bg-white p-3 rounded-lg border border-[#e6e9ef] shadow-xs flex flex-col items-center text-center font-mono text-xs">
                  <div className="font-bold text-[11px] text-[#bb0012]">MINISO INDIA STORE #104</div>
                  <div className="text-[10px] font-sans font-semibold text-[#1a1c1b] truncate max-w-full my-0.5">{p.name}</div>
                  <div className="h-8 w-36 bg-gray-100 flex items-center justify-center font-bold tracking-widest text-xs text-[#1a1c1b] my-1">
                    ||| | |||| || | ||| ||
                  </div>
                  <div className="text-[10px] text-[#5e5e65]">{p.barcode}</div>
                  <div className="text-xs font-bold text-[#1a1c1b] mt-1">MRP: ₹{p.sellingPrice} (INCL. TAXES)</div>
                  <div className="text-[9px] text-[#808495]">{p.shelfLocation || 'Aisle 01'}</div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[#efeeec] text-xs">
              <span className="text-[#5e5e65]">Printer: 80mm ESC/POS USB Port Ready</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsPrintModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-[#f4f3f1] hover:bg-[#e9e8e6] text-[#1a1c1b] font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    window.print();
                    if (addToast) addToast('Labels sent to thermal barcode printer', 'success');
                    setIsPrintModalOpen(false);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#bb0012] hover:bg-[#e7151f] text-white font-semibold"
                >
                  <span className="material-symbols-outlined text-[16px]">print</span>
                  <span>Print 80mm Labels</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CSV IMPORT MODAL */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl p-6 border border-[#efeeec] flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-[#efeeec] pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#bb0012]">upload_file</span>
                <h3 className="text-base font-bold text-[#1a1c1b]">Import SKUs from CSV / Excel</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="p-1 rounded hover:bg-[#f4f3f1] text-[#5e5e65]"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="flex items-center justify-between bg-[#f4f3f1] p-3 rounded-xl border border-[#efeeec] text-xs">
              <span className="text-[#5e5e65]">Need sample format?</span>
              <button
                type="button"
                onClick={handleDownloadCsvTemplate}
                className="text-[#bb0012] font-semibold hover:underline flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[16px]">download</span>
                Download Sample CSV Template
              </button>
            </div>

            <div className="flex flex-col gap-1 text-xs">
              <label className="font-semibold text-[#1a1c1b]">
                Paste CSV Content (or use sample rows):
              </label>
              <textarea
                rows={6}
                value={importCsvText}
                onChange={(e) => setImportCsvText(e.target.value)}
                placeholder="Name,Category,Barcode,SellingPrice,CostPrice,Stock,MinStock,Location
Miniso Plush Keychain,toys,890423189911,399,180,120,25,Aisle B-02
Pastel Note Diary,stationery,890423189912,199,90,140,30,Aisle A-01"
                className="w-full bg-[#faf9f7] font-mono text-xs p-3 rounded-lg border border-[#efeeec] outline-none focus:border-[#bb0012]/40"
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[#efeeec]">
              <button
                type="button"
                onClick={() => {
                  setImportCsvText(`Name,Category,Barcode,SellingPrice,CostPrice,Stock,MinStock,Location
Sanrio Kuromi Water Bottle 600ml,home,890423189955,699,310,120,20,Aisle B-01
Strawberry Lip Balm 10g,beauty,890423189956,199,85,250,40,Aisle C-03
Mini Cable Organizer 3pk,accessories,890423189957,149,60,180,30,Aisle D-02`);
                }}
                className="text-xs text-[#5e5e65] hover:text-[#1a1c1b] underline"
              >
                Load Sample Data
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-[#f4f3f1] text-[#1a1c1b] text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isImporting}
                  onClick={handleProcessCsvImport}
                  className="px-4 py-2 rounded-lg bg-[#bb0012] hover:bg-[#e7151f] text-white text-xs font-semibold"
                >
                  {isImporting ? 'Processing...' : 'Import SKUs'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADD PRODUCT MODAL BACKDROP & PANEL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-[#efeeec]">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-[#f4f3f1] flex items-center justify-between shrink-0 border-b border-[#efeeec]">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-[#bb0012]/10 text-[#bb0012] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">add_box</span>
                </div>
                <div className="flex flex-col">
                  <h2 className="text-base font-bold text-[#1a1c1b] leading-tight">
                    Add New Product (SKU Entry)
                  </h2>
                  <span className="text-xs text-[#5e5e65]">Store #104 • Java Inventory Engine &amp; JDBC Mapping</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-full hover:bg-white text-[#5e5e65] hover:text-[#1a1c1b]"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitModal} className="p-6 overflow-y-auto flex flex-col gap-4 flex-1 text-xs">
              {/* Row 1: ID & Name */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="font-semibold text-[#5e5e65]">Product ID (Auto)</label>
                  <input
                    type="text"
                    readOnly
                    value="MNS-2024-1251"
                    className="w-full bg-[#f4f3f1] text-[#1a1c1b] font-mono px-3 py-2 rounded-lg cursor-not-allowed outline-none border border-[#efeeec]"
                  />
                </div>
                <div className="sm:col-span-2 flex flex-col gap-1">
                  <label className="font-semibold text-[#5e5e65]">
                    Product Name <span className="text-[#ba1a1a]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sanrio Cinnamoroll Desk Fan 5V"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-[#f4f3f1] text-[#1a1c1b] px-3 py-2 rounded-lg outline-none focus:bg-white focus:ring-2 focus:ring-[#bb0012]/20 border border-transparent focus:border-[#bb0012]/30"
                  />
                </div>
              </div>

              {/* Row 2: Category & Barcode */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="font-semibold text-[#5e5e65]">
                    Category <span className="text-[#ba1a1a]">*</span>
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-[#f4f3f1] text-[#1a1c1b] px-3 py-2 rounded-lg outline-none cursor-pointer border border-[#efeeec]"
                  >
                    <option value="toys">Toys</option>
                    <option value="stationery">Stationery</option>
                    <option value="beauty">Beauty</option>
                    <option value="accessories">Accessories</option>
                    <option value="home">Home</option>
                    <option value="gifts">Gifts</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-[#5e5e65]">
                      Optical Barcode / EAN-13 <span className="text-[#ba1a1a]">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, barcode: '89042318' + Math.floor(1000 + Math.random() * 9000) })}
                      className="font-mono text-[10px] text-[#bb0012] cursor-pointer hover:underline"
                    >
                      Auto-Gen
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.barcode}
                      onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                      className="w-full bg-[#f4f3f1] text-[#1a1c1b] font-mono pl-9 pr-3 py-2 rounded-lg outline-none border border-[#efeeec]"
                    />
                    <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-[18px] text-[#5e5e65]">
                      qr_code_scanner
                    </span>
                  </div>
                </div>
              </div>

              {/* Row 3: Pricing Structure */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-[#f4f3f1] rounded-xl border border-[#efeeec]">
                <div className="flex flex-col gap-1">
                  <label className="font-semibold text-[#5e5e65]">
                    Selling Price (₹) <span className="text-[#ba1a1a]">*</span>
                  </label>
                  <input
                    type="number"
                    step="1"
                    required
                    value={formData.sellingPrice}
                    onChange={(e) => setFormData({ ...formData, sellingPrice: Number(e.target.value) })}
                    className="w-full bg-white text-[#1a1c1b] font-mono px-3 py-2 rounded-lg outline-none border border-[#efeeec]"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-semibold text-[#5e5e65]">Cost Price (₹)</label>
                  <input
                    type="number"
                    step="1"
                    value={formData.costPrice}
                    onChange={(e) => setFormData({ ...formData, costPrice: Number(e.target.value) })}
                    className="w-full bg-white text-[#1a1c1b] font-mono px-3 py-2 rounded-lg outline-none border border-[#efeeec]"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-semibold text-[#5e5e65]">Festive Discount (%)</label>
                  <input
                    type="number"
                    max="90"
                    min="0"
                    value={formData.festiveDiscount}
                    onChange={(e) => setFormData({ ...formData, festiveDiscount: Number(e.target.value) })}
                    className="w-full bg-white text-[#1a1c1b] font-mono px-3 py-2 rounded-lg outline-none border border-[#efeeec]"
                  />
                </div>
              </div>

              {/* Row 4: Inventory & Alerts */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="font-semibold text-[#5e5e65]">
                    Initial Stock Quantity <span className="text-[#ba1a1a]">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.currentStock}
                    onChange={(e) => setFormData({ ...formData, currentStock: Number(e.target.value) })}
                    className="w-full bg-[#f4f3f1] text-[#1a1c1b] font-mono px-3 py-2 rounded-lg outline-none border border-[#efeeec]"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-semibold text-[#5e5e65]">
                    Minimum Stock Alert Threshold <span className="text-[#ba1a1a]">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.minLevel}
                    onChange={(e) => setFormData({ ...formData, minLevel: Number(e.target.value) })}
                    className="w-full bg-[#f4f3f1] text-[#1a1c1b] font-mono px-3 py-2 rounded-lg outline-none border border-[#efeeec]"
                  />
                </div>
              </div>

              {/* Row 5: Shelf Location Tag */}
              <div className="flex flex-col gap-1">
                <label className="font-semibold text-[#5e5e65]">Shelf Location &amp; Bay Tag</label>
                <input
                  type="text"
                  value={formData.shelfLocation}
                  onChange={(e) => setFormData({ ...formData, shelfLocation: e.target.value })}
                  placeholder="e.g. Aisle B-04 / Bay 04A-R2"
                  className="w-full bg-[#f4f3f1] text-[#1a1c1b] px-3 py-2 rounded-lg outline-none border border-[#efeeec]"
                />
              </div>

              {/* Java Sync Note */}
              <div className="p-3 bg-[#f4f3f1] rounded-lg flex items-center gap-2.5 text-[#5e5e65]">
                <span className="material-symbols-outlined text-[18px] text-[#006947] shrink-0">check_circle</span>
                <span className="text-[11px] leading-tight">
                  Trigger will dispatch a Java JDBC PreparedStatement to update the master inventory table, recompute safety stocks, and broadcast SKU barcode to POS registers immediately.
                </span>
              </div>

              {/* Modal Footer Buttons */}
              <div className="pt-2 flex items-center justify-between border-t border-[#efeeec]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-[#f4f3f1] hover:bg-[#e9e8e6] text-[#1a1c1b] font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-1.5 bg-[#bb0012] hover:bg-[#e7151f] text-white font-semibold px-5 py-2.5 rounded-lg shadow-md transition-all"
                >
                  <span className="material-symbols-outlined text-[18px]">cloud_upload</span>
                  <span>{isSaving ? 'Synchronizing...' : 'Save & Synchronize to Java DB'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
