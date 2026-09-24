import React, { useState } from 'react';
import { api } from '../services/api';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isStreamlitMode?: boolean;
  setIsStreamlitMode?: (val: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isStreamlitMode,
  setIsStreamlitMode,
}) => {
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [backupSuccess, setBackupSuccess] = useState(false);

  const handleBackup = async () => {
    setIsBackingUp(true);
    try {
      await api.triggerBackup();
      setBackupSuccess(true);
      setTimeout(() => setBackupSuccess(false), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsBackingUp(false);
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
    { id: 'products', label: 'Products', icon: 'category' },
    { id: 'sales', label: 'Sales', icon: 'point_of_sale' },
    { id: 'inventory', label: 'Inventory', icon: 'inventory_2' },
    { id: 'customers', label: 'Customers', icon: 'group' },
    { id: 'predictions', label: 'Predictions', icon: 'trending_up' },
    { id: 'festivals', label: 'Festivals & Offers', icon: 'celebration' },
    { id: 'notifications', label: 'Notifications', icon: 'notifications' },
    { id: 'reports', label: 'Reports', icon: 'analytics' },
    { id: 'settings', label: 'Settings', icon: 'settings' },
  ];

  return (
    <aside className="w-72 shrink-0 h-screen bg-white/95 backdrop-blur-md border-r border-[#efeeec] shadow-[0_1px_8px_rgba(0,0,0,0.03)] z-30 flex flex-col justify-between overflow-y-auto select-none">
      <div className="p-4 flex flex-col gap-4">
        {/* Logo and Brand header */}
        <div className="flex items-center justify-between pb-2 border-b border-[#f4f3f1]">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-[#bb0012] flex items-center justify-center text-white font-extrabold text-xl shadow-xs tracking-tighter hover:scale-105 transition-transform">
              M
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-[18px] text-[#1a1c1b] tracking-tight leading-none">MINISO</span>
              <span className="text-[11px] text-[#bb0012] font-bold tracking-wider uppercase mt-0.5">SMART RETAIL</span>
            </div>
          </div>
          <span className="glass-subtle text-[#5e5e65] text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-semibold border border-[#efeeec]">
            Live OS
          </span>
        </div>

        {/* Navigation list */}
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => {
            const isActive = activeTab === item.id && !isStreamlitMode;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setActiveTab(item.id);
                  if (setIsStreamlitMode) setIsStreamlitMode(false);
                }}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm transition-all duration-200 text-left w-full ${
                  isActive
                    ? 'bg-[#bb0012] text-white font-semibold shadow-[0_4px_12px_rgba(187,0,18,0.25)] scale-[1.01]'
                    : 'text-[#5e5e65] hover:bg-[#f4f3f1]/90 hover:text-[#1a1c1b] hover:translate-x-0.5 font-medium'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Info: Java Engine & DB status */}
      <div className="p-4 border-t border-[#f4f3f1]">
        <div className="glass-subtle p-3 rounded-xl flex flex-col gap-1.5 border border-[#efeeec]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#1a1c1b]">Java Core Engine v2.4</span>
            <span className="h-2 w-2 rounded-full bg-[#006947] animate-pulse" title="Engine Live"></span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-[#5e5e65] font-mono">
            <span className="material-symbols-outlined text-[14px] text-[#006947]">database</span>
            <span>DB: MySQL Localhost:3306</span>
          </div>
          <button
            type="button"
            onClick={handleBackup}
            disabled={isBackingUp}
            className="mt-1 w-full bg-white hover:bg-[#e9e8e6] text-[#1a1c1b] text-xs font-semibold py-1.5 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-xs hover:shadow-sm"
          >
            <span className={`material-symbols-outlined text-[16px] ${isBackingUp ? 'animate-spin' : ''}`}>
              {backupSuccess ? 'check_circle' : 'cloud_sync'}
            </span>
            <span>{isBackingUp ? 'Backing up...' : backupSuccess ? 'Backup Saved!' : 'Quick Backup'}</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
