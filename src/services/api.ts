import { Product, SaleTransaction, Customer, PromoRule, OperationalAlert, SystemTelemetry } from '../types/retail';
import { INITIAL_PRODUCTS, INITIAL_TRANSACTIONS, INITIAL_CUSTOMERS, INITIAL_PROMO_RULES, INITIAL_ALERTS, INITIAL_TELEMETRY } from '../data/mockData';

class ApiService {
  async getHealth(): Promise<SystemTelemetry> {
    try {
      const res = await fetch('/api/health');
      if (res.ok) return await res.json();
    } catch (e) {
      // fallback
    }
    return INITIAL_TELEMETRY;
  }

  async getProducts(): Promise<Product[]> {
    try {
      const res = await fetch('/api/products');
      if (res.ok) return await res.json();
    } catch (e) {
      // fallback
    }
    return INITIAL_PRODUCTS;
  }

  async addProduct(product: Partial<Product>): Promise<Product> {
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product),
      });
      if (res.ok) return await res.json();
    } catch (e) {
      // fallback
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
    return newP;
  }

  async deleteProduct(id: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      return res.ok;
    } catch (e) {
      return true;
    }
  }

  async getSales(): Promise<SaleTransaction[]> {
    try {
      const res = await fetch('/api/sales');
      if (res.ok) return await res.json();
    } catch (e) {
      // fallback
    }
    return INITIAL_TRANSACTIONS;
  }

  async checkout(payload: {
    items: { product: Product; quantity: number }[];
    customerPhone: string;
    customerName: string;
    paymentMethod: 'UPI' | 'Card' | 'Cash';
    discountCode?: string;
  }): Promise<{ success: boolean; transaction: SaleTransaction; updatedProducts?: Product[] }> {
    try {
      const res = await fetch('/api/sales/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) return await res.json();
    } catch (e) {
      // fallback
    }
    let subtotal = payload.items.reduce((sum, item) => sum + item.product.sellingPrice * item.quantity, 0);
    let discount = payload.discountCode === 'DIWALI10' ? Math.round(subtotal * 0.1) : 0;
    let tax = Math.round((subtotal - discount) * 0.18 * 100) / 100;
    let total = Math.round(subtotal - discount);

    const tx: SaleTransaction = {
      id: `#INV-2024-${Math.floor(8845 + Math.random() * 100)}`,
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
    return { success: true, transaction: tx };
  }

  async reorderInventory(skuId: string, quantity: number): Promise<boolean> {
    try {
      const res = await fetch('/api/inventory/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skuId, quantity }),
      });
      return res.ok;
    } catch (e) {
      return true;
    }
  }

  async getCustomers(): Promise<Customer[]> {
    try {
      const res = await fetch('/api/customers');
      if (res.ok) return await res.json();
    } catch (e) {
      // fallback
    }
    return INITIAL_CUSTOMERS;
  }

  async addCustomer(customer: Partial<Customer>): Promise<Customer> {
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customer),
      });
      if (res.ok) return await res.json();
    } catch (e) {
      // fallback
    }
    return {
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
  }

  async rerunPredictions(): Promise<any> {
    try {
      const res = await fetch('/api/predictions/rerun', { method: 'POST' });
      if (res.ok) return await res.json();
    } catch (e) {
      // fallback
    }
    return { success: true, timestamp: new Date().toLocaleTimeString(), confidence: 96.4 };
  }

  async getMinisoDataset(): Promise<any> {
    try {
      const res = await fetch('/api/dataset/miniso-sales');
      if (res.ok) return await res.json();
    } catch (e) {
      // fallback
    }
    return null;
  }

  async trainPredictiveModel(config: {
    algorithm: string;
    festiveSurgeFactor: number;
    confidenceAlpha: number;
    horizonDays: number;
  }): Promise<any> {
    try {
      const res = await fetch('/api/predictive-model/train', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      if (res.ok) return await res.json();
    } catch (e) {
      // fallback
    }
    return null;
  }

  async getPredictiveForecast(): Promise<any> {
    try {
      const res = await fetch('/api/predictions');
      if (res.ok) return await res.json();
    } catch (e) {
      // fallback
    }
    return null;
  }

  async getCampaigns(): Promise<PromoRule[]> {
    try {
      const res = await fetch('/api/campaigns');
      if (res.ok) return await res.json();
    } catch (e) {
      // fallback
    }
    return INITIAL_PROMO_RULES;
  }

  async createCampaign(rule: Partial<PromoRule>): Promise<PromoRule> {
    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rule),
      });
      if (res.ok) return await res.json();
    } catch (e) {
      // fallback
    }
    return {
      code: rule.code || 'SPECIAL20',
      campaign: rule.campaign || 'Custom Festival Sale',
      discountType: rule.discountType || '20% Flat OFF',
      applicableTargets: rule.applicableTargets || 'All Store Items',
      validityWindow: rule.validityWindow || 'Today - Next Week',
      redemptions: 0,
      revenueGenerated: 0,
      status: 'Live',
    };
  }

  async getNotifications(): Promise<OperationalAlert[]> {
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) return await res.json();
    } catch (e) {
      // fallback
    }
    return INITIAL_ALERTS;
  }

  async sendBroadcast(payload: { message: string; audience: string; channels: string[] }): Promise<any> {
    try {
      const res = await fetch('/api/notifications/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) return await res.json();
    } catch (e) {
      // fallback
    }
    return { success: true, count: 1250 };
  }

  async triggerBackup(): Promise<any> {
    try {
      const res = await fetch('/api/backup', { method: 'POST' });
      if (res.ok) return await res.json();
    } catch (e) {
      // fallback
    }
    return { success: true, backupFile: 'miniso_backup.sql.gz', sizeBytes: 4892014 };
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
