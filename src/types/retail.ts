export interface Product {
  id: string;
  sku: string;
  name: string;
  category: 'toys' | 'stationery' | 'beauty' | 'accessories' | 'home' | 'gifts';
  categoryLabel: string;
  barcode: string;
  sellingPrice: number;
  costPrice: number;
  currentStock: number;
  minLevel: number;
  safetyMin: number;
  status: 'In Stock' | 'Low Stock' | 'Critical' | 'Out of Stock';
  imageUrl: string;
  shelfLocation?: string;
  dailySales?: number;
  runwayDays?: number;
  recOrderQty?: number;
  festiveDiscount?: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface SaleTransaction {
  id: string;
  time: string;
  customerName: string;
  customerPhone: string;
  isGuest?: boolean;
  itemsSummary: string;
  subtotal: number;
  discount: number;
  discountLabel?: string;
  tax: number;
  total: number;
  paymentMethod: 'UPI' | 'Card' | 'Cash';
  registerId: string;
  cashier: string;
  itemsCount: number;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  tier: 'Gold Club' | 'Silver Member' | 'Regular' | 'New';
  type: 'Frequent' | 'Regular' | 'New';
  ordersCount: number;
  lifetimeSpend: number;
  memberSince: string;
  loyaltyPoints: number;
  redeemableAmount: number;
  lastVisited: string;
  primaryAffinity: string;
  basketAffinity: {
    category: string;
    percentage: number;
    icon: string;
  }[];
  recentReceipts: {
    date: string;
    terminal: string;
    items: string;
    amount: number;
  }[];
  predictedUpsell?: {
    title: string;
    reason: string;
    price: number;
    matchRate: number;
  };
}

export interface RiskSKU {
  id: string;
  name: string;
  sku: string;
  tag: string;
  category: string;
  physicalStock: number;
  pred7DayDemand: number;
  pred30DayDemand: number;
  recommendedAddition: number;
  riskLevel: 'high' | 'medium' | 'low';
}

export interface PromoRule {
  code: string;
  campaign: string;
  discountType: string;
  applicableTargets: string;
  validityWindow: string;
  redemptions: number;
  revenueGenerated: number;
  status: 'Live' | 'Scheduled' | 'Expired';
}

export interface OperationalAlert {
  id: string;
  title: string;
  description: string;
  time: string;
  priority: 'High Priority' | 'Normal' | 'Info';
  category: 'Critical Restock' | 'Festival Demand' | 'Purchase Reorder' | 'Sales Milestone';
  imageUrl?: string;
  actionText?: string;
  metadata?: string;
}

export interface SystemTelemetry {
  storeId: string;
  storeName: string;
  node: string;
  pid: number;
  dbStatus: string;
  dbHost: string;
  latencyMs: number;
  jvmHeapUsed: number;
  jvmHeapMax: number;
  lastSyncTime: string;
  isLive: boolean;
}
