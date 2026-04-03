import React, { useMemo } from 'react';
import { MapPin, Navigation, Zap, Clock, Hotel, Star, ShieldCheck } from 'lucide-react';

export default function StationList({ stations, userLocation, onStationClick, selectedStationId }) {
  if (!userLocation) {
    return (
      <div className="bg-slate-900/40 backdrop-blur-md rounded-3xl p-10 border border-white/5 shadow-2xl text-center h-full flex flex-col justify-center items-center">
        <div className="bg-blue-500/20 p-4 rounded-3xl mb-4">
          <Navigation className="w-10 h-10 text-blue-400 animate-pulse" />
        </div>
        <h3 className="text-xl font-black text-white mb-2">Locating Navigator...</h3>
        <p className="text-slate-400 text-sm max-w-[200px]">Please allow location access to sync nearby charging hubs.</p>
      </div>
    );
  }

  if (stations.length === 0) {
    return (
      <div className="bg-slate-900/40 backdrop-blur-md rounded-3xl p-10 border border-white/5 shadow-2xl text-center h-full flex flex-col justify-center items-center">
        <div className="bg-slate-800/50 p-4 rounded-3xl mb-4">
          <MapPin className="w-10 h-10 text-slate-500" />
        </div>
        <h3 className="text-xl font-black text-slate-300 mb-2">Out of Range</h3>
        <p className="text-slate-500 text-sm max-w-[200px]">No stations found within your current battery safety zone.</p>
      </div>
    );
  }

  const getScore = (station) => {
    let score = station.distance || 0;
    if (station.fastCharging) score -= 5;
    if (station.hasHotel) score -= 15;
    if (station.status === 'Available') score -= 5;
    return score;
  };

  const rankedStations = [...stations].sort((a, b) => getScore(a) - getScore(b));

  const getAvailabilityColor = (status) => {
    if (status === 'Available') return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    if (status === 'Moderate') return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    return 'bg-red-500/10 text-red-500 border-red-500/20';
  };

  return (
    <div className="bg-slate-900/40 backdrop-blur-md rounded-3xl border border-white/5 shadow-2xl h-full flex flex-col overflow-hidden">
      <div className="p-6 border-b border-white/5 bg-white/5">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-black flex items-center gap-2 uppercase tracking-widest text-slate-100">
            <div className="bg-blue-600 w-2 h-6 rounded-full" />
            Nearby Hubs
          </h2>
          <span className="bg-white/10 px-3 py-1 rounded-full text-[10px] font-black text-slate-300 border border-white/5">
            {stations.length} AVAILABLE
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {rankedStations.map((station, idx) => (
          <div 
            key={station.id} 
            onClick={() => onStationClick && onStationClick(station)}
            className={`group relative bg-white/5 hover:bg-white/10 rounded-2xl p-5 border transition-all duration-500 cursor-pointer hover:translate-y-[-2px] hover:shadow-2xl hover:shadow-blue-500/10 ${
              selectedStationId === station.id 
                ? 'border-blue-500 bg-blue-500/5 shadow-[0_0_15px_rgba(59,130,246,0.2)]' 
                : 'border-white/5 hover:border-blue-500/30'
            }`}
          >
            {/* Top Badges */}
            <div className="flex gap-2 mb-3">
              {idx === 0 && (
                <span className="flex items-center gap-1.5 bg-amber-500/20 text-amber-400 px-3 py-1 rounded-full text-[9px] uppercase font-black border border-amber-500/30">
                  <Star className="w-3 h-3" /> Efficiency Choice
                </span>
              )}
              {idx > 0 && idx < 3 && (
                <span className="flex items-center gap-1.5 bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-[9px] uppercase font-black border border-blue-500/30">
                  <ShieldCheck className="w-3 h-3" /> Vetted Hub
                </span>
              )}
            </div>

            <div className="flex justify-between items-start mb-3">
              <h3 className="font-bold text-lg text-slate-100 pr-4 group-hover:text-blue-300 transition-colors tracking-tight">
                {station.name}
              </h3>
              <div className="bg-slate-950/50 px-3 py-1 rounded-xl border border-white/5 font-black text-xs text-blue-400 shadow-inner">
                {station.distance ? station.distance.toFixed(1) : '—'} km
              </div>
            </div>

            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                <MapPin className="w-4 h-4 text-slate-400" />
              </div>
              <span className="text-sm font-medium text-slate-400">{station.city || 'Regional Area'}</span>
            </div>

            <div className="flex flex-wrap gap-2 text-[10px] uppercase font-black tracking-wider">
              {station.fastCharging && (
                <span className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 px-3 py-1.5 rounded-xl border border-emerald-500/20 shadow-sm">
                  <Zap className="w-3 h-3" /> HyperCharge
                </span>
              )}
              
              {station.hasHotel && (
                <span className="flex items-center gap-1.5 bg-indigo-500/10 text-indigo-400 px-3 py-1.5 rounded-xl border border-indigo-500/20 shadow-sm">
                  <Hotel className="w-3 h-3" /> Lodging
                </span>
              )}

              <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border shadow-sm ${getAvailabilityColor(station.status)}`}>
                <Clock className="w-3 h-3 text-current" /> {station.status === 'In Use' ? 'Full' : (station.status || 'Free')}
              </span>
            </div>
            
            {station.connectors && station.connectors.length > 0 && (
              <div className="mt-4 pt-4 border-t border-white/5 flex flex-wrap gap-2">
                {station.connectors.map(conn => (
                  <span key={conn} className="text-[9px] font-black tracking-[0.1em] text-slate-500 bg-slate-950/50 px-2.5 py-1 rounded-lg border border-white/5">
                    {conn}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
