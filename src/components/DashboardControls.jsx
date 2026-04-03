import React from 'react';
import { Battery, BatteryFull, BatteryMedium, BatteryLow, Zap, Clock } from 'lucide-react';

export default function DashboardControls({ battery, setBattery, selectedCar, setSelectedCar, carsData }) {
  // Calculate remaining range
  const remainingRange = Math.round((battery / 100) * selectedCar.maxRange);
  
  // Battery drain prediction: time = range / avgSpeed
  const hoursRemaining = (remainingRange / selectedCar.avgSpeed).toFixed(1);

  const getBatteryIcon = () => {
    if (battery > 80) return <BatteryFull className="text-emerald-500 w-8 h-8" />;
    if (battery > 30) return <BatteryMedium className="text-amber-500 w-8 h-8" />;
    return <BatteryLow className="text-red-500 w-8 h-8 animate-pulse" />;
  };

  const getRangeColor = () => {
    if (remainingRange > 200) return 'text-emerald-400';
    if (remainingRange > 50) return 'text-amber-400';
    return 'text-red-400';
  };

  return (
    <div className="bg-slate-900/40 backdrop-blur-md rounded-3xl p-6 border border-white/5 shadow-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Zap className="text-emerald-400 w-6 h-6 drop-shadow-md" />
          <h2 className="text-xl font-bold font-sans tracking-wide">EV Tracking</h2>
        </div>
        <div className="flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700">
           <span className="text-xl">{selectedCar.icon}</span>
           <select 
             value={selectedCar.id}
             onChange={(e) => setSelectedCar(carsData.find(c => c.id === e.target.value))}
             className="bg-transparent text-sm font-bold text-slate-200 focus:outline-none cursor-pointer"
           >
             {carsData.map(car => (
               <option key={car.id} value={car.id} className="bg-slate-900">{car.name}</option>
             ))}
           </select>
        </div>
      </div>

      {/* Main Content: Stacked vertically for sidebar stability */}
      <div className="space-y-8">
        {/* Battery Section */}
        <div className="bg-slate-950/30 p-5 rounded-2xl border border-white/5 shadow-inner">
          <div className="flex justify-between items-center mb-4">
            <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Energy Level</span>
            <div className="px-3 py-1 bg-emerald-500/20 rounded-lg border border-emerald-500/30">
               <span className="text-sm font-black text-emerald-400">{battery}%</span>
            </div>
          </div>
          
          <div className="relative pt-2 pb-6">
            <input 
              type="range" 
              min="1" 
              max="100" 
              value={battery}
              onChange={(e) => setBattery(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500 hover:accent-emerald-400 transition-all"
            />
            <div className="absolute inset-x-0 bottom-0 flex justify-between text-[10px] font-bold text-slate-600 uppercase tracking-tighter">
              <span>Depleted</span>
              <span>Charged</span>
            </div>
          </div>
        </div>

        {/* Info Cards Grid */}
        <div className="grid grid-cols-2 gap-4">
          {/* Range Card */}
          <div className="bg-slate-950/20 p-4 rounded-2xl border border-white/5 flex flex-col items-center justify-center text-center group hover:bg-slate-800/40 transition-colors">
            <div className="p-2 bg-emerald-500/10 rounded-xl mb-3 border border-emerald-500/20 group-hover:scale-110 transition-transform">
              {getBatteryIcon()}
            </div>
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Range</div>
            <div className={`text-xl font-black ${getRangeColor()} leading-none`}>
              {remainingRange}<span className="text-[10px] ml-0.5 opacity-60">km</span>
            </div>
          </div>

          {/* Time Card */}
          <div className="bg-slate-950/20 p-4 rounded-2xl border border-white/5 flex flex-col items-center justify-center text-center group hover:bg-slate-800/40 transition-colors">
            <div className="p-2 bg-blue-500/10 rounded-xl mb-3 border border-blue-500/20 group-hover:scale-110 transition-transform">
              <Clock className="text-blue-400 w-8 h-8" />
            </div>
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Time Left</div>
            <div className="text-xl font-black text-blue-400 leading-none">
              {hoursRemaining}<span className="text-[10px] ml-0.5 opacity-60">hrs</span>
            </div>
          </div>
        </div>
      </div>

      {remainingRange < 50 && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-sm font-bold flex items-center gap-2">
          <span>⚠️</span> Low Range! Next charging needed soon ({remainingRange} km left).
        </div>
      )}
    </div>
  );
}
