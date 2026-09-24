import { Product, SaleTransaction, Customer, PromoRule, OperationalAlert, SystemTelemetry } from '../types/retail';
import { INITIAL_PRODUCTS, INITIAL_TRANSACTIONS, INITIAL_CUSTOMERS, INITIAL_PROMO_RULES, INITIAL_ALERTS, INITIAL_TELEMETRY } from '../data/mockData';

// Helper to safely execute JSON fetch without SyntaxError on static hosts (like Netlify)
// where client-side rewrite rules return index.html (text/html) with 200 status for /api/* routes.
async function safeJsonFetch<T>(url: string, options?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(url, options);
    const contentType = res.headers.get('content-type');
    if (res.ok && contentType && contentType.includes('application/json')) {
      return (await res.json()) as T;
    }
  } catch (e) {
    // Offline or network error
  }
  return null;
}

// LocalStorage Persistence keys for static hosts (Netlify, Vercel, GitHub Pages)
const STORAGE_KEYS = {
  PRODUCTS: 'miniso_retail_products',
  SALES: 'miniso_retail_sales',
  CUSTOMERS: 'miniso_retail_customers',
  CAMPAIGNS: 'miniso_retail_campaigns',
  ALERTS: 'miniso_retail_alerts',
};

function getStored<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    if (item) return JSON.parse(item);
  } catch (e) {
    // LocalStorage disabled or quota exceeded
  }
  return fallback;
}

function setStored<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    // Ignored
  }
}

class ApiService {
  async getHealth(): Promise<SystemTelemetry> {
    const data = await safeJsonFetch<SystemTelemetry>('/api/health');
    if (data) return data;
    return INITIAL_TELEMETRY;
  }

  async getProducts(): Promise<Product[]> {
    const data = await safeJsonFetch<Product[]>('/api/products');
    if (data && Array.isArray(data)) {
      setStored(STORAGE_KEYS.PRODUCTS, data);
      return data;
    }
    return getStored<Product[]>(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
  }

  async addProduct(product: Partial<Product>): Promise<Product> {
    const serverProduct = await safeJsonFetch<Product>('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product),
    });

    if (serverProduct) {
      const current = getStored<Product[]>(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
      setStored(STORAGE_KEYS.PRODUCTS, [serverProduct, ...current]);
      return serverProduct;
    }

    const newP: Product = {
      id: `MNS-2024-${Math.floor(1000 + Math.random() * 9000)}`,
      sku: product.sku || `MNS-2024-${Math.floor(1000 + Math.random() * 9000)}`,
      name: product.name || 'New Item',
      category: product.category || 'toys',
      categoryLabel: product.categoryLabel || 'Toys',
      barcode: product.barcode || '890423180000',
      sellingPrice: product.sellingPrice || 499,
      costPrice: product.costPrice || 200,
      currentStock: product.currentStock || 50,
      minLevel: product.minLevel || 15,
      safetyMin: product.safetyMin || 25,
      status: (product.currentStock || 50) > 20 ? 'In Stock' : 'Low Stock',
      imageUrl: product.imageUrl || 'https://lh3.googleusercontent.com/aida-public/AB6AXuAUmtgeONPWAxRKTjrrHU_l_qgoWSYXmHbHpeQ6D79FUBraIOT0LNdPvgEM29Uw7ywJs_xEOqgkDt5brOhAfG75S82ekhDYElf3vqQ4DKiSo9THX3phGGWBS_jftYzXgk4hiTp9EwtqMuJq7A0dI9g6qlyG5LufM8Lkmevnr5oP9nVUNL3i9nTmbUjLVQmX7J7pPgTqW7AI4fi6mVzO0H6uPMx69LfTV_s3fXBRB_Jdl7u2-M7f6EcQmA',
      dailySales: 5,
      runwayDays: 10,
    };

    const current = getStored<Product[]>(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
    setStored(STORAGE_KEYS.PRODUCTS, [newP, ...current]);
    return newP;
  }

  async deleteProduct(id: string): Promise<boolean> {
    await safeJsonFetch(`/api/products/${id}`, { method: 'DELETE' });
    const current = getStored<Product[]>(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
    setStored(STORAGE_KEYS.PRODUCTS, current.filter(p => p.id !== id && p.sku !== id));
    return true;
  }

  async getSales(): Promise<SaleTransaction[]> {
    const data = await safeJsonFetch<SaleTransaction[]>('/api/sales');
    if (data && Array.isArray(data)) {
      setStored(STORAGE_KEYS.SALES, data);
      return data;
    }
    return getStored<SaleTransaction[]>(STORAGE_KEYS.SALES, INITIAL_TRANSACTIONS);
  }

  async checkout(payload: {
    items: { product: Product; quantity: number }[];
    customerPhone: string;
    customerName: string;
    paymentMethod: 'UPI' | 'Card' | 'Cash';
    discountCode?: string;
  }): Promise<{ success: boolean; transaction: SaleTransaction; updatedProducts?: Product[] }> {
    const serverResult = await safeJsonFetch<{ success: boolean; transaction: SaleTransaction; updatedProducts?: Product[] }>('/api/sales/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (serverResult && serverResult.transaction) {
      const currentSales = getStored<SaleTransaction[]>(STORAGE_KEYS.SALES, INITIAL_TRANSACTIONS);
      setStored(STORAGE_KEYS.SALES, [serverResult.transaction, ...currentSales]);
      return serverResult;
    }

    let subtotal = payload.items.reduce((sum, item) => sum + item.product.sellingPrice * item.quantity, 0);
    let discount = payload.discountCode === 'DIWALI10' ? Math.round(subtotal * 0.1) : 0;
    let tax = Math.round((subtotal - discount) * 0.18 * 100) / 100;
    let total = Math.round(subtotal - discount);

    const tx: SaleTransaction = {
      id: `#INV-2024-${Math.floor(8845 + Math.random() * 1000)}`,
      time: 'Just now',
      customerName: payload.customerName || 'Walk-in Customer',
      customerPhone: payload.customerPhone || 'Guest Terminal',
      itemsSummary: `${payload.items.length} items (${payload.items.map(i => i.product.name.split(' ')[0]).join(', ')})`,
      subtotal,
      discount,
      discountLabel: discount > 0 ? payload.discountCode : undefined,
      tax,
      total,
      paymentMethod: payload.paymentMethod,
      registerId: 'Reg #02',
      cashier: 'Priya Sharma',
      itemsCount: payload.items.reduce((s, i) => s + i.quantity, 0),
    };

    const currentSales = getStored<SaleTransaction[]>(STORAGE_KEYS.SALES, INITIAL_TRANSACTIONS);
    setStored(STORAGE_KEYS.SALES, [tx, ...currentSales]);

    // Update local products stock
    const currentProds = getStored<Product[]>(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
    const updatedProds = currentProds.map(p => {
      const inCart = payload.items.find(i => i.product.sku === p.sku || i.product.id === p.id);
      if (inCart) {
        const remaining = Math.max(0, p.currentStock - inCart.quantity);
        return {
          ...p,
          currentStock: remaining,
          status: (remaining === 0 ? 'Out of Stock' : remaining < p.minLevel ? 'Low Stock' : 'In Stock') as any
        };
      }
      return p;
    });
    setStored(STORAGE_KEYS.PRODUCTS, updatedProds);

    return { success: true, transaction: tx, updatedProducts: updatedProds };
  }

  async reorderInventory(skuId: string, quantity: number): Promise<boolean> {
    await safeJsonFetch('/api/inventory/reorder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ skuId, quantity }),
    });

    const currentProds = getStored<Product[]>(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
    const updated = currentProds.map(p => {
      if (p.sku === skuId || p.id === skuId) {
        const newStock = p.currentStock + quantity;
        return {
          ...p,
          currentStock: newStock,
          status: (newStock >= p.safetyMin ? 'In Stock' : 'Low Stock') as any
        };
      }
      return p;
    });
    setStored(STORAGE_KEYS.PRODUCTS, updated);
    return true;
  }

  async getCustomers(): Promise<Customer[]> {
    const data = await safeJsonFetch<Customer[]>('/api/customers');
    if (data && Array.isArray(data)) {
      setStored(STORAGE_KEYS.CUSTOMERS, data);
      return data;
    }
    return getStored<Customer[]>(STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS);
  }

  async addCustomer(customer: Partial<Customer>): Promise<Customer> {
    const serverCust = await safeJsonFetch<Customer>('/api/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(customer),
    });

    if (serverCust) {
      const current = getStored<Customer[]>(STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS);
      setStored(STORAGE_KEYS.CUSTOMERS, [serverCust, ...current]);
      return serverCust;
    }

    const newCust: Customer = {
      id: `MNS-CUS-${Math.floor(1099 + Math.random() * 50)}`,
      name: customer.name || 'New Member',
      phone: customer.phone || '+91 98000 00000',
      email: customer.email || 'customer@miniso.com',
      tier: 'Regular',
      type: 'New',
      ordersCount: 1,
      lifetimeSpend: 599,
      memberSince: 'Oct 2024',
      loyaltyPoints: 60,
      redeemableAmount: 6,
      lastVisited: 'Just now',
      primaryAffinity: 'Toys',
      basketAffinity: [{ category: 'Toys', percentage: 100, icon: 'smart_toy' }],
      recentReceipts: [{ date: 'Today', terminal: 'Reg #02', items: 'Welcome Purchase', amount: 599 }],
    };

    const current = getStored<Customer[]>(STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS);
    setStored(STORAGE_KEYS.CUSTOMERS, [newCust, ...current]);
    return newCust;
  }

  async rerunPredictions(): Promise<any> {
    const data = await safeJsonFetch('/api/predictions/rerun', { method: 'POST' });
    if (data) return data;
    return { success: true, timestamp: new Date().toLocaleTimeString(), confidence: 96.4 };
  }

  async getMinisoDataset(): Promise<any> {
    return await safeJsonFetch('/api/dataset/miniso-sales');
  }

  async trainPredictiveModel(config: {
    algorithm: string;
    festiveSurgeFactor: number;
    confidenceAlpha: number;
    horizonDays: number;
  }): Promise<any> {
    return await safeJsonFetch('/api/predictive-model/train', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
  }

  async getPredictiveForecast(): Promise<any> {
    return await safeJsonFetch('/api/predictions');
  }

  async getCampaigns(): Promise<PromoRule[]> {
    const data = await safeJsonFetch<PromoRule[]>('/api/campaigns');
    if (data && Array.isArray(data)) {
      setStored(STORAGE_KEYS.CAMPAIGNS, data);
      return data;
    }
    return getStored<PromoRule[]>(STORAGE_KEYS.CAMPAIGNS, INITIAL_PROMO_RULES);
  }

  async createCampaign(rule: Partial<PromoRule>): Promise<PromoRule> {
    const serverCamp = await safeJsonFetch<PromoRule>('/api/campaigns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rule),
    });

    if (serverCamp) {
      const current = getStored<PromoRule[]>(STORAGE_KEYS.CAMPAIGNS, INITIAL_PROMO_RULES);
      setStored(STORAGE_KEYS.CAMPAIGNS, [serverCamp, ...current]);
      return serverCamp;
    }

    const newCamp: PromoRule = {
      code: rule.code || 'SPECIAL20',
      campaign: rule.campaign || 'Custom Festival Sale',
      discountType: rule.discountType || '20% Flat OFF',
      applicableTargets: rule.applicableTargets || 'All Store Items',
      validityWindow: rule.validityWindow || 'Today - Next Week',
      redemptions: 0,
      revenueGenerated: 0,
      status: 'Live',
    };

    const current = getStored<PromoRule[]>(STORAGE_KEYS.CAMPAIGNS, INITIAL_PROMO_RULES);
    setStored(STORAGE_KEYS.CAMPAIGNS, [newCamp, ...current]);
    return newCamp;
  }

  async getNotifications(): Promise<OperationalAlert[]> {
    const data = await safeJsonFetch<OperationalAlert[]>('/api/notifications');
    if (data && Array.isArray(data)) {
      setStored(STORAGE_KEYS.ALERTS, data);
      return data;
    }
    return getStored<OperationalAlert[]>(STORAGE_KEYS.ALERTS, INITIAL_ALERTS);
  }

  async sendBroadcast(payload: { message: string; audience: string; channels: string[] }): Promise<any> {
    const serverRes = await safeJsonFetch('/api/notifications/broadcast', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return serverRes || { success: true, count: 1250 };
  }

  async triggerBackup(): Promise<any> {
    const serverRes = await safeJsonFetch('/api/backup', { method: 'POST' });
    return serverRes || { success: true, backupFile: 'miniso_backup.sql.gz', sizeBytes: 4892014 };
  }

  // Aliases for convenience
  async getTransactions(): Promise<SaleTransaction[]> {
    return this.getSales();
  }

  async getAlerts(): Promise<OperationalAlert[]> {
    return this.getNotifications();
  }

  async getTelemetry(): Promise<SystemTelemetry> {
    return this.getHealth();
  }

  async createProduct(product: Partial<Product>): Promise<Product> {
    return this.addProduct(product);
  }

  async createTransaction(payload: any): Promise<SaleTransaction> {
    const res = await this.checkout(payload);
    return res.transaction;
  }

  async reorderStock(skuId: string, quantity: number): Promise<{ success: boolean; product?: any }> {
    const success = await this.reorderInventory(skuId, quantity);
    return { success };
  }

  async createCustomer(customer: Partial<Customer>): Promise<Customer> {
    return this.addCustomer(customer);
  }
}

export const api = new ApiService();
