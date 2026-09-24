import React, { useState } from 'react';
import { OperationalAlert } from '../../types/retail';

interface NotificationsViewProps {
  alerts: OperationalAlert[];
  onSendBroadcast: (payload: { message: string; audience: string; channels: string[] }) => Promise<void>;
  onNavigateTab: (tab: string) => void;
  onClearAlerts?: () => void;
  addToast?: (message: string, type?: 'success' | 'warning' | 'info') => void;
}

export const NotificationsView: React.FC<NotificationsViewProps> = ({
  alerts,
  onSendBroadcast,
  onNavigateTab,
  onClearAlerts,
  addToast,
}) => {
  const [selectedAudience, setSelectedAudience] = useState<'all' | 'gold' | 'lapsed' | 'pos'>('gold');
  const [channels, setChannels] = useState<{ sms: boolean; whatsapp: boolean; email: boolean; pos: boolean }>({
    sms: true,
    whatsapp: true,
    email: false,
    pos: false,
  });
  const [messageCopy, setMessageCopy] = useState(
    '🪔 Diwali Special Flash Sale! Enjoy 20% off all Sanrio plush toys & cosmetic items at MINISO Phoenix Mall. Valid this weekend only. Show code DIWALI20 at cash counter!'
  );
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [isFunnelModalOpen, setIsFunnelModalOpen] = useState(false);

  const audienceLabel =
    selectedAudience === 'all'
      ? 'All Customers'
      : selectedAudience === 'gold'
      ? 'Gold Members'
      : selectedAudience === 'lapsed'
      ? 'Lapsed Shoppers'
      : 'POS Terminals';

  const recipientCount =
    selectedAudience === 'all'
      ? '4,280'
      : selectedAudience === 'gold'
      ? '1,250'
      : selectedAudience === 'lapsed'
      ? '890'
      : '4 Stations';

  const insertToken = (token: string) => {
    setMessageCopy((prev) => prev + ' ' + token);
  };

  const handleDispatch = async () => {
    setIsSending(true);
    try {
      const activeChannels: string[] = [];
      if (channels.sms) activeChannels.push('SMS');
      if (channels.whatsapp) activeChannels.push('WhatsApp');
      if (channels.email) activeChannels.push('Email');
      if (channels.pos) activeChannels.push('POS Banner');

      await onSendBroadcast({
        message: messageCopy,
        audience: audienceLabel,
        channels: activeChannels,
      });

      setSendSuccess(true);
      setTimeout(() => setSendSuccess(false), 3000);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex flex-col w-full gap-5 pb-12">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs uppercase tracking-wider text-[#bb0012] font-bold">
              Store #104 Event Dispatch
            </span>
            <span className="text-[#5e5e65] text-xs">•</span>
            <span className="font-mono text-xs text-[#5e5e65]">Worker Thread: alerts_cron_daemon (PID 4419)</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold text-[#1a1c1b] tracking-tight">
            Notification Hub &amp; Automated Alerts
          </h1>
          <p className="text-sm text-[#5e5e65] max-w-2xl">
            Multi-channel event triggers, inventory safety warnings, and customer campaign push broadcasts
          </p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => setSettingsModalOpen(true)}
            className="bg-white hover:bg-[#f4f3f1] text-[#1a1c1b] text-xs font-semibold px-4 py-2.5 rounded-lg shadow-sm border border-[#efeeec] transition-all flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[18px]">tune</span>
            <span>Notification Settings</span>
          </button>
          <button
            type="button"
            onClick={() => document.getElementById('composeBroadcastSection')?.scrollIntoView({ behavior: 'smooth' })}
            className="bg-[#bb0012] hover:bg-[#e7151f] text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-md transition-all flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[18px]">campaign</span>
            <span>+ Compose Broadcast / Alert</span>
          </button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-[#efeeec] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-semibold text-[#5e5e65]">Active System Alerts</span>
            <span className="p-1 rounded-md bg-[#ffdad6] text-[#93000a]">
              <span className="material-symbols-outlined text-[18px]">warning</span>
            </span>
          </div>
          <div className="my-2 flex items-baseline gap-1">
            <span className="text-3xl font-bold text-[#1a1c1b]">8</span>
            <span className="text-xs text-[#ba1a1a] font-bold">Unread</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-[#5e5e65]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#ba1a1a] animate-ping"></span>
            <span>2 require manager approval</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-[#efeeec] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-semibold text-[#5e5e65]">Critical Warnings</span>
            <span className="p-1 rounded-md bg-[#ffdad6] text-[#93000a]">
              <span className="material-symbols-outlined text-[18px]">inventory_2</span>
            </span>
          </div>
          <div className="my-2 flex items-baseline gap-1">
            <span className="text-3xl font-bold text-[#ba1a1a]">3</span>
            <span className="text-xs text-[#ba1a1a] font-bold">Urgent</span>
          </div>
          <div className="flex items-center justify-between text-xs text-[#5e5e65]">
            <span>Lip tint, Plushies &amp; Hampers</span>
            <span className="font-mono text-[#bb0012] font-semibold">&lt;24h Runway</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-[#efeeec] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-semibold text-[#5e5e65]">Delivered Today</span>
            <span className="p-1 rounded-md bg-[#006947]/15 text-[#006947]">
              <span className="material-symbols-outlined text-[18px]">send</span>
            </span>
          </div>
          <div className="my-2 flex items-baseline gap-1">
            <span className="text-3xl font-bold text-[#1a1c1b]">1,420</span>
            <span className="text-xs text-[#006947] font-bold">SMS / Push</span>
          </div>
          <div className="text-xs text-[#5e5e65]">
            <strong className="text-[#006947] font-mono">98.4%</strong> open rate (Diwali Pre-sale)
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-[#efeeec] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-semibold text-[#5e5e65]">Store Cashier Memos</span>
            <span className="p-1 rounded-md bg-[#e4e1ea] text-[#1b1b21]">
              <span className="material-symbols-outlined text-[18px]">point_of_sale</span>
            </span>
          </div>
          <div className="my-2 flex items-baseline gap-1">
            <span className="text-3xl font-bold text-[#1a1c1b]">2</span>
            <span className="text-xs text-[#5e5e65] font-bold">Active</span>
          </div>
          <div className="flex items-center justify-between text-xs text-[#5e5e65]">
            <span>POS Terminal Pin #1 &amp; #3</span>
            <span className="font-mono text-[#006947] font-bold">Synced</span>
          </div>
        </div>
      </div>

      {/* 2 Column Center Grid: Operational vs Customer Outbound */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Manager & Operational Alerts */}
        <div className="lg:col-span-6 flex flex-col gap-4">
          <div className="flex items-center justify-between pb-1">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#bb0012] text-[22px]">notifications_active</span>
              <h2 className="text-base font-bold text-[#1a1c1b]">Manager &amp; Operational Alerts</h2>
            </div>
            <button
              type="button"
              onClick={() => {
                if (onClearAlerts) onClearAlerts();
                else if (addToast) addToast('All operational alerts marked as read.', 'info');
              }}
              className="text-xs text-[#bb0012] hover:underline font-semibold"
            >
              Mark All Read
            </button>
          </div>

          {alerts.map((al) => (
            <div
              key={al.id}
              className="bg-white p-4 rounded-xl shadow-sm border border-[#efeeec] flex flex-col gap-2 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      al.category === 'Critical Restock' || al.category === 'Festival Demand'
                        ? 'bg-[#ba1a1a]'
                        : 'bg-[#006947]'
                    }`}
                  ></span>
                  <span className="bg-[#ffdad6] text-[#93000a] text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                    {al.category}
                  </span>
                  <span className="bg-[#f4f3f1] text-[#5e5e65] text-[10px] font-semibold px-2 py-0.5 rounded-full">
                    {al.priority}
                  </span>
                </div>
                <span className="font-mono text-[10px] text-[#5e5e65]">{al.time}</span>
              </div>

              <div className="flex items-start gap-3 mt-1">
                {al.imageUrl ? (
                  <img
                    src={al.imageUrl}
                    alt={al.title}
                    referrerPolicy="no-referrer"
                    className="w-12 h-12 rounded-lg object-cover bg-[#f4f3f1] shrink-0 border border-black/5"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-[#f4f3f1] flex items-center justify-center shrink-0 text-2xl">
                    {al.category === 'Festival Demand' ? '🪔' : '🎯'}
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-[#1a1c1b]">{al.title}</h3>
                  <p className="text-xs text-[#5e5e65] mt-0.5 leading-snug">{al.description}</p>
                </div>
              </div>

              {al.metadata && (
                <div className="bg-[#f4f3f1] p-2 rounded-lg flex items-center justify-between text-xs text-[#5e5e65]">
                  <span className="font-mono text-[11px]">{al.metadata}</span>
                  {al.actionText && (
                    <button
                      type="button"
                      onClick={() => {
                        if (al.actionText === 'Trigger PO') {
                          if (addToast) addToast('PO #8812 approved & dispatched to Central Warehouse.', 'success');
                        } else {
                          onNavigateTab('predictions');
                        }
                      }}
                      className="bg-[#bb0012] hover:bg-[#e7151f] text-white font-semibold text-xs px-2.5 py-1 rounded shadow-sm"
                    >
                      {al.actionText}
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Right Column: Customer Broadcasts & Live Campaign Preview */}
        <div className="lg:col-span-6 flex flex-col gap-4">
          <div className="flex items-center justify-between pb-1">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#006947] text-[22px]">cell_tower</span>
              <h2 className="text-base font-bold text-[#1a1c1b]">Customer Broadcasts &amp; Outbound Logs</h2>
            </div>
            <span className="font-mono text-xs text-[#5e5e65]">Live Gateway: AWS SNS active</span>
          </div>

          {/* Active Campaign Delivery Card */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-[#efeeec] flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#006947] animate-pulse"></span>
                <span className="text-xs font-bold uppercase tracking-wider text-[#1a1c1b]">
                  Active Campaign Delivery
                </span>
              </div>
              <span className="bg-[#6ffbbe]/40 text-[#002113] font-mono text-[11px] px-2.5 py-0.5 rounded-full font-bold">
                Sent to 1,250 VIPs
              </span>
            </div>

            {/* Simulated Phone Message */}
            <div className="bg-[#f4f3f1] p-3.5 rounded-xl flex flex-col gap-2 border border-[#efeeec]">
              <div className="flex items-center justify-between text-xs pb-1 border-b border-[#efeeec]">
                <div className="flex items-center gap-1.5 font-bold text-[#1a1c1b]">
                  <span className="w-4 h-4 rounded bg-[#bb0012] flex items-center justify-center text-[9px] text-white">M</span>
                  <span>MINISO India • Phoenix Mall</span>
                </div>
                <span className="font-mono text-[10px] text-[#5e5e65]">Just now</span>
              </div>
              <div className="bg-white p-3 rounded-lg shadow-sm text-xs leading-relaxed text-[#1a1c1b]">
                <div className="font-bold mb-1">🎉 Diwali Special Offer! 🪔</div>
                Hello <strong className="text-[#bb0012]">Rhea</strong>! Get <strong className="text-[#bb0012]">20% OFF</strong> on selected luxury gift sets &amp; Sanrio plush toys at MINISO Phoenix Mall. Valid till Nov 04. Show code <span className="font-mono font-bold bg-[#f4f3f1] px-1 py-0.5 rounded">DIWALI20</span> at billing counter!
              </div>
              <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                <div className="bg-white p-2 rounded border border-[#efeeec]">
                  <span className="block text-[10px] text-[#5e5e65]">Dispatched</span>
                  <span className="font-mono text-xs font-bold text-[#1a1c1b]">1,250</span>
                </div>
                <div className="bg-white p-2 rounded border border-[#efeeec]">
                  <span className="block text-[10px] text-[#5e5e65]">Redemptions</span>
                  <span className="font-mono text-xs font-bold text-[#006947]">342 Store Uses</span>
                </div>
                <div className="bg-white p-2 rounded border border-[#efeeec]">
                  <span className="block text-[10px] text-[#5e5e65]">CTR Velocity</span>
                  <span className="font-mono text-xs font-bold text-[#bb0012]">27.3% CTR</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-[#5e5e65]">
              <span>Target Audience: <strong className="text-[#1a1c1b]">Gold &amp; Silver Members</strong></span>
              <button
                type="button"
                onClick={() => setIsFunnelModalOpen(true)}
                className="text-[#bb0012] font-semibold flex items-center gap-1 hover:underline"
              >
                <span>View Conversion Funnel</span>
                <span className="material-symbols-outlined text-[14px]">query_stats</span>
              </button>
            </div>
          </div>

          {/* Outbound 2: Back in Stock Alert */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-[#efeeec] flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="bg-[#6ffbbe]/40 text-[#002113] text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                Back in Stock Alert
              </span>
              <span className="text-[10px] text-[#5e5e65] font-mono">Delivered to 48 users</span>
            </div>
            <div className="text-xs text-[#1a1c1b]">
              "Sanrio Kuromi Plushie 30cm is back in stock! Sent to 48 waiting wishlist customers with reserve buttons."
            </div>
            <div className="flex justify-between text-xs font-mono text-[#006947] font-semibold pt-1 border-t border-[#f4f3f1]">
              <span>48 Notifications Sent</span>
              <span>39.5% Conversion</span>
            </div>
          </div>
        </div>
      </div>

      {/* Broadcast Dispatch Modal / Inline Composer */}
      <div id="composeBroadcastSection" className="bg-white p-6 rounded-xl shadow-sm border border-[#efeeec] flex flex-col gap-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2 pb-2 border-b border-[#f4f3f1]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#bb0012] text-white flex items-center justify-center">
              <span className="material-symbols-outlined text-[24px]">send_time_extension</span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#1a1c1b]">Broadcast Dispatch Modal / Inline Composer</h2>
              <p className="text-xs text-[#5e5e65]">Create real-time push broadcasts, targeted SMS promotions, or cashier POS screen memos</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 bg-[#f4f3f1] px-3 py-1.5 rounded-full text-xs font-mono text-[#1a1c1b]">
            <span className="material-symbols-outlined text-[16px] text-[#006947]">check_circle</span>
            <span>SMS Gateway Credits: 18,450 remaining</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Form Controls (7 cols) */}
          <div className="lg:col-span-7 flex flex-col gap-3.5 text-xs">
            {/* Target Audience */}
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-[#1a1c1b]">Target Audience Segment</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'all', label: 'All Customers', count: '4,280 Users', icon: 'groups' },
                  { id: 'gold', label: 'Gold Members', count: '1,250 VIPs', icon: 'stars' },
                  { id: 'lapsed', label: 'Lapsed Shoppers', count: '890 Users', icon: 'history_toggle_off' },
                  { id: 'pos', label: 'POS Terminals', count: '4 Screens', icon: 'point_of_sale' },
                ].map((aud) => (
                  <button
                    key={aud.id}
                    type="button"
                    onClick={() => setSelectedAudience(aud.id as any)}
                    className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                      selectedAudience === aud.id
                        ? 'bg-[#bb0012] text-white border-[#bb0012] font-semibold shadow-sm'
                        : 'bg-[#f4f3f1] text-[#1a1c1b] border-[#efeeec] hover:bg-[#e9e8e6]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[20px]">{aud.icon}</span>
                    <span className="font-bold">{aud.label}</span>
                    <span className="text-[10px] opacity-80">{aud.count}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Channels */}
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-[#1a1c1b]">Select Dispatch Channels</label>
              <div className="flex flex-wrap gap-2">
                <label className="flex items-center gap-2 bg-[#f4f3f1] px-3 py-1.5 rounded-lg cursor-pointer border border-[#efeeec]">
                  <input
                    type="checkbox"
                    checked={channels.sms}
                    onChange={(e) => setChannels({ ...channels, sms: e.target.checked })}
                    className="accent-[#bb0012]"
                  />
                  <span className="font-semibold">SMS Gateway</span>
                  <span className="font-mono text-[10px] text-[#5e5e65]">₹0.12/msg</span>
                </label>
                <label className="flex items-center gap-2 bg-[#f4f3f1] px-3 py-1.5 rounded-lg cursor-pointer border border-[#efeeec]">
                  <input
                    type="checkbox"
                    checked={channels.whatsapp}
                    onChange={(e) => setChannels({ ...channels, whatsapp: e.target.checked })}
                    className="accent-[#bb0012]"
                  />
                  <span className="font-semibold">WhatsApp Business</span>
                  <span className="font-mono text-[10px] text-[#006947] font-bold">Meta API</span>
                </label>
                <label className="flex items-center gap-2 bg-[#f4f3f1] px-3 py-1.5 rounded-lg cursor-pointer border border-[#efeeec]">
                  <input
                    type="checkbox"
                    checked={channels.email}
                    onChange={(e) => setChannels({ ...channels, email: e.target.checked })}
                    className="accent-[#bb0012]"
                  />
                  <span className="font-semibold">Email Push</span>
                </label>
                <label className="flex items-center gap-2 bg-[#f4f3f1] px-3 py-1.5 rounded-lg cursor-pointer border border-[#efeeec]">
                  <input
                    type="checkbox"
                    checked={channels.pos}
                    onChange={(e) => setChannels({ ...channels, pos: e.target.checked })}
                    className="accent-[#bb0012]"
                  />
                  <span className="font-semibold">POS Screen Banner</span>
                </label>
              </div>
            </div>

            {/* Message Copy */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-[#1a1c1b]">Message Copy</label>
                <div className="flex items-center gap-1 text-[11px]">
                  <span className="text-[#5e5e65]">Tokens:</span>
                  <button
                    type="button"
                    onClick={() => insertToken('{CustomerName}')}
                    className="bg-[#f4f3f1] px-1.5 py-0.5 rounded font-mono text-[#bb0012] font-semibold"
                  >
                    {'{CustomerName}'}
                  </button>
                  <button
                    type="button"
                    onClick={() => insertToken('{CouponCode}')}
                    className="bg-[#f4f3f1] px-1.5 py-0.5 rounded font-mono text-[#bb0012] font-semibold"
                  >
                    {'{CouponCode}'}
                  </button>
                </div>
              </div>
              <textarea
                rows={3}
                value={messageCopy}
                onChange={(e) => setMessageCopy(e.target.value)}
                className="w-full bg-[#f4f3f1] p-3 rounded-lg text-[#1a1c1b] outline-none border border-[#efeeec] resize-none"
              ></textarea>
              <div className="flex justify-between font-mono text-[10px] text-[#5e5e65]">
                <span>1 SMS Segment (GSM 7-bit)</span>
                <span>{messageCopy.length} / 320 characters</span>
              </div>
            </div>

            {/* Submit */}
            <div className="pt-2 flex items-center justify-between">
              <span className="text-xs text-[#5e5e65]">Estimated Delivery: Immediate via AWS SNS</span>
              <button
                type="button"
                onClick={handleDispatch}
                disabled={isSending}
                className="bg-[#bb0012] hover:bg-[#e7151f] text-white font-bold text-xs py-2.5 px-6 rounded-lg shadow-md flex items-center gap-1.5 transition-all"
              >
                <span className={`material-symbols-outlined text-[18px] ${isSending ? 'animate-spin' : ''}`}>
                  {isSending ? 'refresh' : sendSuccess ? 'done_all' : 'send'}
                </span>
                <span>{isSending ? 'Transmitting...' : sendSuccess ? 'Broadcast Dispatched!' : 'Send Notification Now'}</span>
              </button>
            </div>
          </div>

          {/* Right: Phone Simulator View (5 cols) */}
          <div className="lg:col-span-5 bg-[#f4f3f1] p-4 rounded-xl flex flex-col justify-between border border-[#efeeec]">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase text-[#5e5e65]">Device Rendering Preview</span>
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#5e5e65]"></span>
                  <span className="w-2 h-2 rounded-full bg-[#006947]"></span>
                </div>
              </div>

              {/* Phone Chassis */}
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#efeeec] flex flex-col gap-2">
                <div className="flex items-center justify-between text-[10px] font-mono text-[#5e5e65]">
                  <span>MINISO Messaging</span>
                  <span>18:42</span>
                </div>
                <div className="bg-[#f4f3f1] p-3 rounded-xl flex flex-col gap-1 border border-[#efeeec]">
                  <div className="flex items-center gap-1 text-[#bb0012] text-xs font-bold">
                    <span className="material-symbols-outlined text-[16px]">storefront</span>
                    <span>MINISO Phoenix Mall</span>
                  </div>
                  <p className="text-xs text-[#1a1c1b] leading-relaxed">
                    {messageCopy || 'Type message to preview...'}
                  </p>
                  <div className="mt-1 pt-1 flex items-center justify-between text-[10px] text-[#5e5e65] border-t border-[#efeeec]">
                    <span>Audience: <strong>{audienceLabel}</strong></span>
                    <span className="bg-[#ffdad6] text-[#93000a] font-bold px-1.5 py-0.2 rounded">
                      {recipientCount} recipients
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-2.5 rounded-lg mt-3 flex items-center justify-between text-xs text-[#5e5e65] border border-[#efeeec]">
              <span>Estimated Campaign Cost</span>
              <span className="font-mono font-bold text-[#1a1c1b]">₹150.00 (₹0.12 × 1,250)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      {settingsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-2xl p-6 shadow-2xl border border-[#efeeec] flex flex-col gap-4 text-xs">
            <div className="flex items-center justify-between border-b border-[#f4f3f1] pb-2">
              <h3 className="text-base font-bold text-[#1a1c1b]">Notification Hub Preferences</h3>
              <button
                type="button"
                onClick={() => setSettingsModalOpen(false)}
                className="p-1 rounded-full hover:bg-[#f4f3f1] text-[#5e5e65]"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
            <p className="text-[#5e5e65]">Configure thresholds for automatic trigger dispatches and manager push alerts.</p>
            <div className="space-y-2">
              <label className="flex items-center justify-between p-3 bg-[#f4f3f1] rounded-lg cursor-pointer">
                <div>
                  <div className="font-semibold text-[#1a1c1b]">Low Stock Threshold Warning</div>
                  <div className="text-[10px] text-[#5e5e65]">Dispatch alert when inventory &lt; 5 units</div>
                </div>
                <input type="checkbox" defaultChecked className="accent-[#bb0012] w-4 h-4" />
              </label>
              <label className="flex items-center justify-between p-3 bg-[#f4f3f1] rounded-lg cursor-pointer">
                <div>
                  <div className="font-semibold text-[#1a1c1b]">Festival Stockout Prediction Engine</div>
                  <div className="text-[10px] text-[#5e5e65]">Run daily sales velocity ML forecasting</div>
                </div>
                <input type="checkbox" defaultChecked className="accent-[#bb0012] w-4 h-4" />
              </label>
              <label className="flex items-center justify-between p-3 bg-[#f4f3f1] rounded-lg cursor-pointer">
                <div>
                  <div className="font-semibold text-[#1a1c1b]">SMS Delivery Throttling</div>
                  <div className="text-[10px] text-[#5e5e65]">Prevent messaging the same customer within 7 days</div>
                </div>
                <input type="checkbox" defaultChecked className="accent-[#bb0012] w-4 h-4" />
              </label>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-[#f4f3f1]">
              <button
                type="button"
                onClick={() => setSettingsModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-[#f4f3f1] text-[#1a1c1b] font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setSettingsModalOpen(false);
                  if (addToast) addToast('Notification gateway and throttling preferences saved.', 'success');
                }}
                className="px-4 py-2 rounded-lg bg-[#bb0012] text-white font-semibold"
              >
                Save Rules
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONVERSION FUNNEL MODAL */}
      {isFunnelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 border border-[#efeeec] flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-[#efeeec] pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#bb0012]">query_stats</span>
                <div>
                  <h3 className="text-base font-bold text-[#1a1c1b]">Broadcast Conversion Funnel</h3>
                  <span className="text-[10px] text-[#5e5e65]">Diwali VIP Gold Pass Broadcast</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsFunnelModalOpen(false)}
                className="p-1 rounded hover:bg-[#f4f3f1] text-[#5e5e65]"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-[#f4f3f1] rounded-xl flex items-center justify-between">
                <div>
                  <div className="font-semibold text-[#1a1c1b]">1. Delivered via WhatsApp &amp; SMS</div>
                  <div className="text-[10px] text-[#5e5e65]">Gateway receipt status verified</div>
                </div>
                <span className="font-mono font-bold text-sm text-[#1a1c1b]">1,250 msgs</span>
              </div>

              <div className="p-3 bg-[#f4f3f1] rounded-xl flex items-center justify-between">
                <div>
                  <div className="font-semibold text-[#1a1c1b]">2. Opened &amp; Read</div>
                  <div className="text-[10px] text-[#5e5e65]">Blue tick confirmation rate</div>
                </div>
                <span className="font-mono font-bold text-sm text-[#006947]">1,180 (94.4%)</span>
              </div>

              <div className="p-3 bg-[#f4f3f1] rounded-xl flex items-center justify-between">
                <div>
                  <div className="font-semibold text-[#1a1c1b]">3. Clicked Digital Coupon</div>
                  <div className="text-[10px] text-[#5e5e65]">Saved to Google / Apple Wallet</div>
                </div>
                <span className="font-mono font-bold text-sm text-[#bb0012]">342 (27.3%)</span>
              </div>

              <div className="p-3 bg-[#6ffbbe]/20 rounded-xl border border-[#6ffbbe]/40 flex items-center justify-between">
                <div>
                  <div className="font-bold text-[#006947]">4. In-Store Sales Attributed</div>
                  <div className="text-[10px] text-[#006947]">Redeemed at Phoenix Mall cash desk</div>
                </div>
                <span className="font-mono font-bold text-base text-[#006947]">₹2,42,800</span>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-[#efeeec]">
              <button
                type="button"
                onClick={() => setIsFunnelModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-[#bb0012] hover:bg-[#e7151f] text-white text-xs font-semibold"
              >
                Close Funnel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
