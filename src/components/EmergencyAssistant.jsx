import React, { useState } from 'react';
import { ShieldAlert, Truck, Hotel, Phone, Zap, Navigation } from 'lucide-react';

export default function EmergencyAssistant({ closestHelpStation, onSelectAction }) {
  const [activeAction, setActiveAction] = useState(null);

  const emergencyActions = [
    {
      id: 'van',
      name: 'Mobile Charging Van',
      icon: Zap,
      desc: 'Rapid DC charging delivered to your location.',
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      action: () => onSelectAction(null, 'Mobile charging van dispatched to your coordinates.')
    },
    {
      id: 'tow',
      name: 'Tow Service',
      icon: Truck,
      desc: 'Towing to the nearest high-speed city hub.',
      color: 'border-red-500/30 text-red-100 bg-red-500/10 shadow-lg shadow-red-500/20',
      action: () => onSelectAction(closestHelpStation, 'Tow service requested to nearest hub.')
    },
    {
      id: 'hotel',
      name: 'Hotel Hub',
      icon: Hotel,
      desc: 'Stay at the nearest hotel with AC charging.',
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
      action: () => onSelectAction(closestHelpStation, 'Route to nearest Charging Hotel found.')
    }
  ];

  const handleAction = (item) => {
    setActiveAction(item.id);
    item.action();
  };

  return (
    <div className="space-y-4 animate-fadeIn">
      <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-red-500 p-2 rounded-lg">
            <ShieldAlert className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-black text-red-400 uppercase tracking-tighter">Emergency Protocol Active</h3>
            <p className="text-[10px] text-red-400/60 font-medium">Select a rescue option to continue.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {emergencyActions.map((item) => (
            <button
              key={item.id}
              onClick={() => handleAction(item)}
              className={`flex items-start gap-4 p-4 rounded-xl border transition-all text-left ${activeAction === item.id ? 'border-red-500 bg-red-500/20' : 'border-white/5 bg-white/5 hover:bg-white/10'}`}
            >
              <div className={`p-2 rounded-lg ${item.bg || 'bg-white/5'}`}>
                <item.icon className={`w-5 h-5 ${item.color || 'text-slate-400'}`} />
              </div>
              <div>
                <div className="text-xs font-black text-slate-100 italic">{item.name}</div>
                <p className="text-[10px] text-slate-400 font-medium mt-0.5">{item.desc}</p>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-6 pt-6 border-t border-red-500/20 flex items-center justify-between">
           <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-red-400" />
              <span className="text-xs font-black text-red-400 tracking-wider">SOS: 1800-EV-SOS</span>
           </div>
           <button className="text-[10px] font-black text-slate-500 uppercase hover:text-white transition-colors">Call Help</button>
        </div>
      </div>

      {activeAction && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl flex items-center gap-3 animate-slideDown">
             <Navigation className="w-5 h-5 text-emerald-400" />
             <div className="text-[11px] font-bold text-emerald-400">Rescue route updated on map. Stay where you are.</div>
          </div>
      )}
    </div>
  );
}
