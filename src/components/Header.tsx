import React from 'react';

interface HeaderProps {
  onSearch?: (term: string) => void;
  onOpenPos?: () => void;
  notificationCount?: number;
  onOpenNotifications?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onSearch,
  onOpenPos,
  notificationCount = 3,
  onOpenNotifications,
}) => {
  return (
    <header className="h-16 shrink-0 w-full bg-white/95 backdrop-blur-md border-b border-[#efeeec] shadow-[0_1px_4px_rgba(0,0,0,0.03)] z-20 flex items-center justify-between px-6">
      {/* Global Search Bar */}
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        <div className="relative w-full">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#5e5e65] text-[20px]">
            search
          </span>
          <input
            type="text"
            placeholder="Search products, SKU, sales receipts, customer phones..."
            onChange={(e) => onSearch && onSearch(e.target.value)}
            className="w-full bg-[#f4f3f1] text-[#1a1c1b] placeholder:text-[#5e5e65] text-sm pl-10 pr-12 py-2 rounded-lg outline-none focus:bg-white focus:ring-2 focus:ring-[#bb0012]/20 transition-all border border-transparent focus:border-[#bb0012]/30"
          />
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 bg-[#e9e8e6] px-1.5 py-0.5 rounded text-[#5e5e65] text-[11px] font-mono font-semibold">
            ⌘K
          </div>
        </div>
      </div>

      {/* Right Telemetry & Profile area */}
      <div className="flex items-center gap-4">
        {/* Store Location */}
        <div className="hidden md:flex items-center gap-2 bg-[#f4f3f1] px-3 py-1.5 rounded-full text-xs font-medium text-[#1a1c1b]">
          <span className="h-2 w-2 rounded-full bg-[#006947] animate-pulse"></span>
          <span>Store #104 - Phoenix Mall, Mumbai</span>
        </div>

        {/* Festival Alert Chip */}
        <div className="hidden lg:flex items-center gap-1.5 bg-[#ffdad6] text-[#93000a] px-3 py-1.5 rounded-full text-xs font-bold">
          <span>🪔</span>
          <span>Diwali Prep: 12d left</span>
        </div>

        {/* Notifications Icon Button */}
        <button
          type="button"
          onClick={onOpenNotifications}
          className="relative p-2 rounded-full hover:bg-[#f4f3f1] text-[#5e5e65] hover:text-[#1a1c1b] transition-colors"
          title="View Notifications & Alerts"
        >
          <span className="material-symbols-outlined text-[24px]">notifications</span>
          {notificationCount > 0 && (
            <span className="absolute top-1 right-1 bg-[#bb0012] text-white text-[10px] h-4 w-4 rounded-full flex items-center justify-center font-bold">
              {notificationCount}
            </span>
          )}
        </button>

        {/* Admin Profile */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-[#efeeec]">
          <img
            alt="Priya Sharma"
            className="w-8 h-8 rounded-full object-cover shadow-sm ring-1 ring-black/5"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAJFq8ou07Th8M-mtrmNt2UD9BlLHweWe9dbcm3YnHP5pDNVsc442HYXkdzjJRkNqY0AXeJ5O1QwHKaDe6xS48bbv9i4nDQ2AzP8a7v8AMtlDmpm__NbFlSHxMz9kmpwWqLMurExCJejuiYpXk-y-NZXisXtx6IEdprfYLb42lM-lE3eQPgWdZJlzZA6sjx3xxqnU6uJ9q49KiYsmUbKuU6McKnxkbTLeKN5gUvNlKXIBFCToD-T4gnUg"
          />
          <div className="flex flex-col text-left">
            <span className="text-xs font-semibold text-[#1a1c1b] leading-tight">Priya Sharma</span>
            <span className="bg-[#e4e1ea] text-[#64636b] text-[9px] px-1.5 py-0.2 rounded font-bold uppercase tracking-wider w-fit">
              Store Admin
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
