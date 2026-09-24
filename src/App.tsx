/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardView } from './components/views/DashboardView';
import { ProductsView } from './components/views/ProductsView';
import { SalesView } from './components/views/SalesView';
import { InventoryView } from './components/views/InventoryView';
import { CustomersView } from './components/views/CustomersView';
import { PredictionsView } from './components/views/PredictionsView';
import { FestivalsView } from './components/views/FestivalsView';
import { NotificationsView } from './components/views/NotificationsView';
import { ReportsView } from './components/views/ReportsView';
import { SettingsView } from './components/views/SettingsView';
import { StreamlitModeView } from './components/views/StreamlitModeView';
import { api } from './services/api';
import { INITIAL_TELEMETRY } from './data/mockData';
import { Product, SaleTransaction, Customer, PromoRule, OperationalAlert, SystemTelemetry, CartItem } from './types/retail';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

interface Toast {
  id: string;
  type: 'success' | 'warning' | 'info';
  message: string;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isStreamlitMode, setIsStreamlitMode] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  // App state
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<SaleTransaction[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [campaigns, setCampaigns] = useState<PromoRule[]>([]);
  const [alerts, setAlerts] = useState<OperationalAlert[]>([]);
  const [telemetry, setTelemetry] = useState<SystemTelemetry>(INITIAL_TELEMETRY);
  const [loading, setLoading] = useState<boolean>(true);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Check URL parameters for direct link to Streamlit or other tabs on mount
  useEffect(() => {
    const handleUrlState = () => {
      const params = new URLSearchParams(window.location.search);
      const hash = window.location.hash.toLowerCase();
      if (params.get('mode') === 'streamlit' || params.get('tab') === 'streamlit' || hash === '#streamlit') {
        setIsStreamlitMode(true);
      } else {
        const tabParam = params.get('tab');
        if (tabParam && ['dashboard', 'products', 'sales', 'inventory', 'customers', 'predictions', 'festivals', 'notifications', 'reports', 'settings'].includes(tabParam)) {
          setActiveTab(tabParam);
        }
      }
    };

    handleUrlState();
    window.addEventListener('popstate', handleUrlState);
    window.addEventListener('hashchange', handleUrlState);
    return () => {
      window.removeEventListener('popstate', handleUrlState);
      window.removeEventListener('hashchange', handleUrlState);
    };
  }, []);

  const handleSetStreamlitMode = (val: boolean) => {
    setIsStreamlitMode(val);
    try {
      const url = new URL(window.location.href);
      if (val) {
        url.searchParams.set('mode', 'streamlit');
      } else {
        url.searchParams.delete('mode');
      }
      window.history.replaceState(null, '', url.toString());
    } catch (e) {
      // safe fallback
    }
  };

  const addToast = (message: string, type: 'success' | 'warning' | 'info' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Initial data load
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [prodsData, txData, custData, campsData, alertsData, telemData] = await Promise.all([
          api.getProducts(),
          api.getTransactions(),
          api.getCustomers(),
          api.getCampaigns(),
          api.getAlerts(),
          api.getTelemetry(),
        ]);
        setProducts(prodsData);
        setTransactions(txData);
        setCustomers(custData);
        setCampaigns(campsData);
        setAlerts(alertsData);
        if (telemData) setTelemetry(telemData);
      } catch (err) {
        console.error('Failed to load initial data from backend API:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Handlers
  const handleAddProduct = async (productData: Partial<Product>) => {
    try {
      const newProduct = await api.createProduct(productData);
      setProducts(prev => [newProduct, ...prev]);
      addToast(`Product "${newProduct.name}" added to catalog`, 'success');
    } catch (err) {
      console.error(err);
      addToast('Failed to add product', 'warning');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      await api.deleteProduct(id);
      setProducts(prev => prev.filter(p => p.id !== id && p.sku !== id));
      addToast(`Product ${id} removed from catalog`, 'info');
    } catch (err) {
      console.error(err);
      addToast('Failed to delete product', 'warning');
    }
  };

  const handleCheckout = async (payload: {
    items: CartItem[];
    customerPhone: string;
    customerName: string;
    paymentMethod: 'UPI' | 'Card' | 'Cash';
    discountCode?: string;
  }) => {
    try {
      const res = await api.checkout(payload);
      if (res.transaction) {
        setTransactions(prev => [res.transaction, ...prev]);
      }
      // Update inventory stock locally
      setProducts(prev =>
        prev.map(p => {
          const cartItem = payload.items.find(i => i.product.sku === p.sku);
          if (cartItem) {
            const newStock = Math.max(0, p.currentStock - cartItem.quantity);
            return {
              ...p,
              currentStock: newStock,
              status: newStock <= 0 ? 'Out of Stock' : newStock < p.minLevel ? 'Low Stock' : 'In Stock',
            };
          }
          return p;
        })
      );
      addToast(`Sale #${res.transaction.id} completed (₹${res.transaction.total.toLocaleString('en-IN')})`, 'success');
    } catch (err) {
      console.error(err);
      addToast('Transaction failed', 'warning');
    }
  };

  const handleReorder = async (skuId: string, quantity: number) => {
    try {
      await api.reorderStock(skuId, quantity);
      setProducts(prev =>
        prev.map(p => {
          if (p.sku === skuId) {
            const updatedStock = p.currentStock + quantity;
            return {
              ...p,
              currentStock: updatedStock,
              status: updatedStock >= p.safetyMin ? 'In Stock' : 'Low Stock',
            };
          }
          return p;
        })
      );
      addToast(`Purchase Order created: +${quantity} units for ${skuId}`, 'success');
    } catch (err) {
      console.error(err);
      addToast('Failed to issue purchase order', 'warning');
    }
  };

  const handleAddCustomer = async (custData: Partial<Customer>) => {
    try {
      const newCust = await api.createCustomer(custData);
      setCustomers(prev => [newCust, ...prev]);
      addToast(`Loyalty customer ${newCust.name} enrolled`, 'success');
    } catch (err) {
      console.error(err);
      addToast('Failed to register customer', 'warning');
    }
  };

  const handleCreateCampaign = async (ruleData: Partial<PromoRule>) => {
    try {
      const newCamp = await api.createCampaign(ruleData);
      setCampaigns(prev => [newCamp, ...prev]);
      addToast(`Campaign "${newCamp.campaign}" published to registers`, 'success');
    } catch (err) {
      console.error(err);
      addToast('Failed to create campaign', 'warning');
    }
  };

  const handleSendBroadcast = async (payload: { message: string; audience: string; channels: string[] }) => {
    try {
      await api.sendBroadcast(payload);
      addToast(`Broadcast dispatched to active customers across ${payload.channels.join(', ')}`, 'success');
    } catch (err) {
      console.error(err);
      addToast('Broadcast failed', 'warning');
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#faf9f7] text-[#1a1c1b] font-sans antialiased select-none">
      {/* Sidebar Navigation */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={(tab) => {
          handleSetStreamlitMode(false);
          setActiveTab(tab);
        }} 
        isStreamlitMode={isStreamlitMode}
        setIsStreamlitMode={handleSetStreamlitMode}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden bg-[#faf9f7]">
        {/* Universal Top Header */}
        <Header 
          onSearch={(term) => setSearchTerm(term)}
          onOpenPos={() => {
            handleSetStreamlitMode(false);
            setActiveTab('sales');
          }}
          notificationCount={alerts.filter(a => a.priority === 'High Priority').length}
          onOpenNotifications={() => {
            handleSetStreamlitMode(false);
            setActiveTab('notifications');
          }}
        />

        {/* Dynamic Viewport */}
        <main className="flex-1 overflow-y-auto bg-[#faf9f7] p-6 lg:p-8 relative">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center space-y-4">
              <div className="w-10 h-10 border-3 border-[#e02020] border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs text-gray-400 font-mono tracking-wider">SYNCING WITH PHOENIX MALL STORE NODE #104...</p>
            </div>
          ) : isStreamlitMode || activeTab === 'streamlit' ? (
            <StreamlitModeView 
              products={products}
              transactions={transactions}
              customers={customers}
              onOpenPos={() => {
                handleSetStreamlitMode(false);
                setActiveTab('sales');
              }}
              onNavigateTab={(tab) => {
                handleSetStreamlitMode(false);
                setActiveTab(tab);
              }}
              addToast={addToast}
            />
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <DashboardView 
                  products={products} 
                  onOpenPos={() => setActiveTab('sales')}
                  onNavigateTab={(tab) => setActiveTab(tab)}
                  onOpenStreamlit={() => handleSetStreamlitMode(true)}
                  telemetry={telemetry}
                  addToast={addToast}
                />
              )}

              {activeTab === 'products' && (
                <ProductsView 
                  products={products}
                  onAddProduct={handleAddProduct}
                  onDeleteProduct={handleDeleteProduct}
                  addToast={addToast}
                />
              )}

              {activeTab === 'sales' && (
                <SalesView 
                  products={products}
                  transactions={transactions}
                  onCheckout={handleCheckout}
                  addToast={addToast}
                />
              )}

              {activeTab === 'inventory' && (
                <InventoryView 
                  products={products}
                  onReorder={handleReorder}
                  addToast={addToast}
                />
              )}

              {activeTab === 'customers' && (
                <CustomersView 
                  customers={customers}
                  onAddCustomer={handleAddCustomer}
                  addToast={addToast}
                />
              )}

              {activeTab === 'predictions' && (
                <PredictionsView 
                  onNavigateTab={(tab) => setActiveTab(tab)}
                  addToast={addToast}
                />
              )}

              {activeTab === 'festivals' && (
                <FestivalsView 
                  campaigns={campaigns}
                  onCreateCampaign={handleCreateCampaign}
                  onNavigateTab={(tab) => setActiveTab(tab)}
                  addToast={addToast}
                />
              )}

              {activeTab === 'notifications' && (
                <NotificationsView 
                  alerts={alerts}
                  onSendBroadcast={handleSendBroadcast}
                  onNavigateTab={(tab) => setActiveTab(tab)}
                  onClearAlerts={() => {
                    setAlerts(prev => prev.map(a => ({ ...a, read: true })));
                    addToast('All operational alerts marked as read', 'info');
                  }}
                  addToast={addToast}
                />
              )}

              {activeTab === 'reports' && (
                <ReportsView 
                  transactions={transactions}
                  products={products}
                />
              )}

              {activeTab === 'settings' && (
                <SettingsView 
                  telemetry={telemetry}
                  addToast={addToast}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* Floating Toast System */}
      <aside aria-label="Notifications" className="fixed bottom-6 right-6 z-50 flex flex-col space-y-2 pointer-events-none">
        {toasts.map(toast => (
          <div 
            key={toast.id}
            className={`pointer-events-auto flex items-center space-x-3 px-4 py-3 rounded-lg border shadow-2xl backdrop-blur-md transition-all duration-300 transform translate-y-0 text-sm max-w-sm ${
              toast.type === 'success' 
                ? 'bg-[#12221b]/95 border-emerald-500/40 text-emerald-300'
                : toast.type === 'warning'
                ? 'bg-[#2b1f13]/95 border-amber-500/40 text-amber-300'
                : 'bg-[#161f30]/95 border-blue-500/40 text-blue-300'
            }`}
          >
            {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
            {toast.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />}
            {toast.type === 'info' && <Info className="w-5 h-5 text-blue-400 shrink-0" />}
            <span className="font-medium text-xs text-white leading-tight flex-1">{toast.message}</span>
            <button 
              onClick={() => removeToast(toast.id)}
              className="text-gray-400 hover:text-white transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </aside>
    </div>
  );
}
