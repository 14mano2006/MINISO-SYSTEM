import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { INITIAL_PRODUCTS, INITIAL_TRANSACTIONS, INITIAL_CUSTOMERS, INITIAL_RISK_SKUS, INITIAL_PROMO_RULES, INITIAL_ALERTS, INITIAL_TELEMETRY } from './src/data/mockData.ts';
import { MINISO_HISTORICAL_SALES, generatePredictiveForecast } from './src/data/minisoSalesDataset.ts';
import { Product, SaleTransaction, Customer, PromoRule, OperationalAlert } from './src/types/retail.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;
  const isProd = process.env.NODE_ENV === 'production';

  app.use(express.json());

  // In-memory persistent state across active backend session
  let products: Product[] = [...INITIAL_PRODUCTS];
  let transactions: SaleTransaction[] = [...INITIAL_TRANSACTIONS];
  let customers: Customer[] = [...INITIAL_CUSTOMERS];
  let promoRules: PromoRule[] = [...INITIAL_PROMO_RULES];
  let alerts: OperationalAlert[] = [...INITIAL_ALERTS];
  let telemetry = { ...INITIAL_TELEMETRY };

  // ==================== REST API ROUTES ====================

  // System Health / Telemetry
  app.get('/api/health', (req: Request, res: Response) => {
    telemetry.latencyMs = Math.floor(Math.random() * 8) + 10;
    telemetry.jvmHeapUsed = Math.floor(340 + Math.random() * 15);
    res.json(telemetry);
  });

  // Products CRUD
  app.get('/api/products', (req: Request, res: Response) => {
    res.json(products);
  });

  app.post('/api/products', (req: Request, res: Response) => {
    const newProduct: Product = {
      id: req.body.id || `MNS-2024-${Math.floor(1000 + Math.random() * 9000)}`,
      sku: req.body.sku || `MNS-2024-${Math.floor(1000 + Math.random() * 9000)}`,
      name: req.body.name,
      category: req.body.category || 'toys',
      categoryLabel: req.body.categoryLabel || req.body.category || 'Toys',
      barcode: req.body.barcode || `${Math.floor(890423180000 + Math.random() * 99999)}`,
      sellingPrice: Number(req.body.sellingPrice) || 499,
      costPrice: Number(req.body.costPrice) || 200,
      currentStock: Number(req.body.currentStock) || 50,
      minLevel: Number(req.body.minLevel) || 15,
      safetyMin: Number(req.body.safetyMin) || 20,
      status: Number(req.body.currentStock) > 20 ? 'In Stock' : (Number(req.body.currentStock) > 0 ? 'Low Stock' : 'Out of Stock'),
      imageUrl: req.body.imageUrl || 'https://lh3.googleusercontent.com/aida-public/AB6AXuAUmtgeONPWAxRKTjrrHU_l_qgoWSYXmHbHpeQ6D79FUBraIOT0LNdPvgEM29Uw7ywJs_xEOqgkDt5brOhAfG75S82ekhDYElf3vqQ4DKiSo9THX3phGGWBS_jftYzXgk4hiTp9EwtqMuJq7A0dI9g6qlyG5LufM8Lkmevnr5oP9nVUNL3i9nTmbUjLVQmX7J7pPgTqW7AI4fi6mVzO0H6uPMx69LfTV_s3fXBRB_Jdl7u2-M7f6EcQmA',
      shelfLocation: req.body.shelfLocation || 'Aisle 02',
      dailySales: Math.floor(Math.random() * 10) + 2,
      runwayDays: Math.floor((Number(req.body.currentStock) || 50) / 6),
      recOrderQty: 50,
      festiveDiscount: Number(req.body.festiveDiscount) || 0
    };
    products.unshift(newProduct);
    res.status(201).json(newProduct);
  });

  app.put('/api/products/:id', (req: Request, res: Response) => {
    const idx = products.findIndex(p => p.id === req.params.id);
    if (idx !== -1) {
      products[idx] = { ...products[idx], ...req.body };
      res.json(products[idx]);
    } else {
      res.status(404).json({ error: 'Product not found' });
    }
  });

  app.delete('/api/products/:id', (req: Request, res: Response) => {
    products = products.filter(p => p.id !== req.params.id);
    res.json({ success: true });
  });

  // Sales & POS Checkout
  app.get('/api/sales', (req: Request, res: Response) => {
    res.json(transactions);
  });

  app.post('/api/sales/checkout', (req: Request, res: Response) => {
    const { items, customerPhone, customerName, paymentMethod, discountCode } = req.body;
    
    let subtotal = 0;
    items.forEach((item: any) => {
      subtotal += item.product.sellingPrice * item.quantity;
      // live decrement inventory
      const prod = products.find(p => p.id === item.product.id);
      if (prod) {
        prod.currentStock = Math.max(0, prod.currentStock - item.quantity);
        if (prod.currentStock === 0) prod.status = 'Out of Stock';
        else if (prod.currentStock < prod.minLevel) prod.status = 'Critical';
        else if (prod.currentStock < prod.safetyMin) prod.status = 'Low Stock';
      }
    });

    let discount = 0;
    let discountLabel = '';
    if (discountCode === 'DIWALI10' || discountCode === 'FESTIVE') {
      discount = Math.round(subtotal * 0.1);
      discountLabel = discountCode;
    }

    const tax = Math.round((subtotal - discount) * 0.18 * 100) / 100;
    const total = Math.round((subtotal - discount) + 0.25); // rounding logic

    const newTx: SaleTransaction = {
      id: `#INV-2024-${Math.floor(8843 + transactions.length)}`,
      time: 'Just now',
      customerName: customerName || 'Walk-in Customer',
      customerPhone: customerPhone || 'Guest Terminal',
      itemsSummary: `${items.length} items (${items.map((i: any) => i.product.name.split(' ')[0]).slice(0, 3).join(', ')})`,
      subtotal,
      discount,
      discountLabel,
      tax,
      total,
      paymentMethod: paymentMethod || 'UPI',
      registerId: 'Reg #02',
      cashier: 'Priya Sharma',
      itemsCount: items.reduce((acc: number, cur: any) => acc + cur.quantity, 0)
    };

    transactions.unshift(newTx);

    // Update customer spend if registered
    const existingCust = customers.find(c => c.phone.includes(customerPhone.slice(-6)));
    if (existingCust) {
      existingCust.ordersCount += 1;
      existingCust.lifetimeSpend += total;
      existingCust.loyaltyPoints += Math.floor(total * 0.01);
      existingCust.recentReceipts.unshift({
        date: 'Today • POS Reg #02',
        terminal: 'Reg #02',
        items: newTx.itemsSummary,
        amount: total
      });
    }

    res.json({ success: true, transaction: newTx, updatedProducts: products });
  });

  // Inventory Reorder PO
  app.post('/api/inventory/reorder', (req: Request, res: Response) => {
    const { skuId, quantity } = req.body;
    const prod = products.find(p => p.id === skuId || p.sku === skuId);
    if (prod) {
      prod.currentStock += Number(quantity) || 50;
      prod.status = 'In Stock';
    }
    alerts.unshift({
      id: `ALT-${Date.now()}`,
      title: `Supplier PO Dispatched: ${prod ? prod.name : 'SKU Reorder'}`,
      description: `Purchase order for +${quantity || 50} units dispatched to Central Warehouse (Bhiwandi Hub).`,
      time: 'Just now',
      priority: 'Normal',
      category: 'Purchase Reorder',
      metadata: `PO #${Math.floor(1000 + Math.random() * 9000)} • Transit ETA: 48h`
    });
    res.json({ success: true, message: 'PO generated and queued to Java Logistics Engine', products });
  });

  // Customer Management
  app.get('/api/customers', (req: Request, res: Response) => {
    res.json(customers);
  });

  app.post('/api/customers', (req: Request, res: Response) => {
    const newCust: Customer = {
      id: `MNS-CUS-${1097 + customers.length}`,
      name: req.body.name,
      phone: req.body.phone,
      email: req.body.email || `${req.body.name.toLowerCase().replace(/\s+/g, '.')}@gmail.com`,
      tier: 'Regular',
      type: 'New',
      ordersCount: 1,
      lifetimeSpend: Number(req.body.initialSpend) || 650,
      memberSince: 'Oct 2024',
      loyaltyPoints: 65,
      redeemableAmount: 6,
      lastVisited: 'Just now',
      primaryAffinity: req.body.primaryAffinity || 'Lifestyle',
      basketAffinity: [
        { category: 'Lifestyle & Toys', percentage: 70, icon: 'smart_toy' },
        { category: 'Stationery', percentage: 30, icon: 'edit_note' },
      ],
      recentReceipts: [
        { date: 'Today • POS Reg #02', terminal: 'Reg #02', items: 'Welcome Enrollment Purchase', amount: Number(req.body.initialSpend) || 650 }
      ]
    };
    customers.unshift(newCust);
    res.status(201).json(newCust);
  });

  // MINISO Historical Sales Dataset API
  app.get('/api/dataset/miniso-sales', (req: Request, res: Response) => {
    const totalRevenue = MINISO_HISTORICAL_SALES.reduce((acc, r) => acc + r.grossSales, 0);
    const totalUnits = MINISO_HISTORICAL_SALES.reduce((acc, r) => acc + r.unitsSold, 0);
    const totalTx = MINISO_HISTORICAL_SALES.reduce((acc, r) => acc + r.transactionsCount, 0);
    const avgBasket = Math.round(totalRevenue / totalTx);

    res.json({
      store: 'MINISO Phoenix Mall Flagship, Mumbai (#104)',
      period: 'Past 90 Days (Daily Granularity)',
      recordCount: MINISO_HISTORICAL_SALES.length,
      summary: {
        totalRevenue,
        totalUnits,
        totalTransactions: totalTx,
        avgBasketValue: avgBasket,
        topCategory: 'Toys & Plushies (Sanrio Collection)',
      },
      data: MINISO_HISTORICAL_SALES,
    });
  });

  // Download MINISO Sales Dataset as CSV
  app.get('/api/dataset/miniso-sales/download', (req: Request, res: Response) => {
    const headers = ['Date', 'DayOfWeek', 'Footfall', 'Transactions', 'UnitsSold', 'GrossSalesINR', 'TopCategory', 'TopSKU', 'TopItem', 'AvgBasketValueINR', 'FestiveEvent', 'FestiveLiftPct', 'DiscountPct'];
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
      r.promoDiscountActive,
    ].join(','));

    const csvContent = [headers.join(','), ...rows].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="miniso_sales_dataset.csv"');
    res.send(csvContent);
  });

  // Demand Prediction & Machine Learning Models
  let currentModelConfig = {
    algorithm: 'ARIMA(2,1,2)' as 'ARIMA(2,1,2)' | 'Holt-Winters Multiplicative' | 'Ensemble Hybrid',
    festiveSurgeFactor: 1.38,
    confidenceAlpha: 0.95,
    horizonDays: 30,
  };

  app.get('/api/predictions', (req: Request, res: Response) => {
    const { forecast, metrics } = generatePredictiveForecast(MINISO_HISTORICAL_SALES, currentModelConfig);
    const pred7Day = forecast.slice(0, 7).reduce((acc, f) => acc + f.predictedSales, 0);
    const pred30Day = forecast.reduce((acc, f) => acc + f.predictedSales, 0);

    res.json({
      model: currentModelConfig.algorithm,
      confidence: metrics.confidenceScore,
      predicted7DaySales: pred7Day,
      predicted30DaySales: pred30Day,
      peakGrowth: `+${Math.round((currentModelConfig.festiveSurgeFactor - 1) * 100)}%`,
      riskSkus: INITIAL_RISK_SKUS,
      lastTrained: metrics.lastTrained,
      metrics,
      forecast,
      currentConfig: currentModelConfig,
    });
  });

  app.post('/api/predictive-model/train', (req: Request, res: Response) => {
    const { algorithm, festiveSurgeFactor, confidenceAlpha, horizonDays } = req.body;
    if (algorithm) currentModelConfig.algorithm = algorithm;
    if (festiveSurgeFactor) currentModelConfig.festiveSurgeFactor = Number(festiveSurgeFactor);
    if (confidenceAlpha) currentModelConfig.confidenceAlpha = Number(confidenceAlpha);
    if (horizonDays) currentModelConfig.horizonDays = Number(horizonDays);

    const { forecast, metrics } = generatePredictiveForecast(MINISO_HISTORICAL_SALES, currentModelConfig);
    const pred7Day = forecast.slice(0, 7).reduce((acc, f) => acc + f.predictedSales, 0);
    const pred30Day = forecast.reduce((acc, f) => acc + f.predictedSales, 0);

    res.json({
      success: true,
      message: `${currentModelConfig.algorithm} model re-trained successfully with ${MINISO_HISTORICAL_SALES.length} samples.`,
      metrics,
      forecast,
      predicted7DaySales: pred7Day,
      predicted30DaySales: pred30Day,
      peakGrowth: `+${Math.round((currentModelConfig.festiveSurgeFactor - 1) * 100)}%`,
      riskSkus: INITIAL_RISK_SKUS,
      currentConfig: currentModelConfig,
    });
  });

  app.post('/api/predictions/rerun', (req: Request, res: Response) => {
    const { forecast, metrics } = generatePredictiveForecast(MINISO_HISTORICAL_SALES, currentModelConfig);
    res.json({
      success: true,
      message: 'ARIMA & Poisson model re-calibrated successfully against live Diwali sales velocity',
      timestamp: new Date().toLocaleTimeString(),
      confidence: metrics.confidenceScore,
      updatedRiskCount: 14,
      forecast,
      metrics,
    });
  });

  // Campaigns & Promotions
  app.get('/api/campaigns', (req: Request, res: Response) => {
    res.json(promoRules);
  });

  app.post('/api/campaigns', (req: Request, res: Response) => {
    const newPromo: PromoRule = {
      code: req.body.code || `FEST-${Math.floor(10 + Math.random() * 90)}`,
      campaign: req.body.campaign || 'Diwali Mega Sale 🪔',
      discountType: req.body.discountType || '20% Flat OFF',
      applicableTargets: req.body.applicableTargets || 'Selected Categories',
      validityWindow: req.body.validityWindow || 'Oct 25 - Nov 04',
      redemptions: 0,
      revenueGenerated: 0,
      status: 'Live',
    };
    promoRules.unshift(newPromo);
    res.status(201).json(newPromo);
  });

  // Notifications Broadcast Dispatch
  app.get('/api/notifications', (req: Request, res: Response) => {
    res.json(alerts);
  });

  app.post('/api/notifications/broadcast', (req: Request, res: Response) => {
    const { message, audience, channels } = req.body;
    const newAlert: OperationalAlert = {
      id: `BRD-${Date.now()}`,
      title: `Campaign Broadcast Dispatched to ${audience || 'VIP Members'}`,
      description: message || 'Diwali Special Offer broadcast sent.',
      time: 'Just now',
      priority: 'Normal',
      category: 'Sales Milestone',
      metadata: `Channels: ${(channels || ['SMS', 'WhatsApp']).join(', ')} • 1,250 Delivered`
    };
    alerts.unshift(newAlert);
    res.json({ success: true, alert: newAlert, recipientCount: 1250 });
  });

  // Database Backup Snapshot
  app.post('/api/backup', (req: Request, res: Response) => {
    res.json({
      success: true,
      backupFile: `miniso_db_store104_${new Date().toISOString().replace(/[:.]/g, '-')}.sql.gz`,
      sizeBytes: 4892014,
      tablesArchived: ['products', 'sales_ledger', 'customers', 'inventory_lots', 'promotions'],
      status: 'Synced with Central Java Daemon (PID: 4182)'
    });
  });

  // Standalone Streamlit Python Script Download
  app.get('/api/streamlit/download', (req: Request, res: Response) => {
    const filePath = path.resolve(__dirname, 'streamlit_app.py');
    res.download(filePath, 'streamlit_app.py');
  });

  // ==================== VITE MIDDLEWARE / STATIC FILES ====================

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`[MINISO Retail OS] Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('[MINISO Retail OS] Server initialization failed:', err);
  process.exit(1);
});
