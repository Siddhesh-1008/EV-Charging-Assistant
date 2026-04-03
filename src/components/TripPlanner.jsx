import React, { useState } from 'react';
import { Route, MapPin, Zap, Hotel, Navigation, CheckCircle2, CircleDollarSign, Fuel, TrendingDown, ShieldAlert } from 'lucide-react';
import { calculateTripStops } from '../utils/routePlanner';
import EmergencyAssistant from './EmergencyAssistant';

import citiesData from '../data/cities.json';

const CITY_MAP = citiesData;

export default function TripPlanner({ userLocation, battery, maxRange, stations, onRouteGenerated, tripStatus, selectedCar, isEmergency, closestHelpStation, setEmergencyTarget }) {
  const [destination, setDestination] = useState('');
  const [tripPlan, setTripPlan] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handlePlanTrip = () => {
    if (isEmergency) return; // Safety lock
    if (!destination) {
      setErrorMsg('Please select a destination city.');
      return;
    }
    const destCoords = CITY_MAP[destination];
    if (!destCoords) {
      setErrorMsg('Invalid destination selected.');
      return;
    }
    if (!userLocation) {
      setErrorMsg('Start location not detected yet.');
      return;
    }

    setErrorMsg('');
    const plan = calculateTripStops(
      userLocation,
      { ...destCoords, cityName: destination },
      battery,
      maxRange,
      stations
    );
    
    const econ = {
        ev: Math.round(plan.totalDistance * (selectedCar.batteryCapacity / selectedCar.maxRange) * EV_UNIT_PRICE),
        petrol: Math.round((plan.totalDistance / PETROL_MILEAGE) * PETROL_PRICE),
        diesel: Math.round((plan.totalDistance / DIESEL_MILEAGE) * DIESEL_PRICE),
        savings: Math.round(((plan.totalDistance / PETROL_MILEAGE) * PETROL_PRICE) - (plan.totalDistance * (selectedCar.batteryCapacity / selectedCar.maxRange) * EV_UNIT_PRICE))
    };

    setTripPlan({
      ...plan,
      destinationName: destination,
      destinationCoords: destCoords
    });

    onRouteGenerated({
      destination: { ...destCoords, cityName: destination },
      stops: plan.stops,
      economics: econ
    });
  };

  const showBatteryWarning = tripPlan && tripPlan.totalDistance > (battery / 100) * maxRange;

  // Journey Economics Constants (India Averages)
  const PETROL_PRICE = 106.3; // INR per litre
  const DIESEL_PRICE = 94.2;  // INR per litre
  const EV_UNIT_PRICE = 18.5; // INR per kWh (Rapid DC charging avg)
  
  const PETROL_MILEAGE = 14.5; // km/L (Typical SUV average)
  const DIESEL_MILEAGE = 18.2; // km/L
  
  // Cost Calculations
  let economics = null;
  if (tripPlan) {
    const evEff = selectedCar.batteryCapacity / selectedCar.maxRange; // kWh per km
    const evTotalKwh = tripPlan.totalDistance * evEff;
    const evCost = Math.round(evTotalKwh * EV_UNIT_PRICE);
    
    const petrolCost = Math.round((tripPlan.totalDistance / PETROL_MILEAGE) * PETROL_PRICE);
    const dieselCost = Math.round((tripPlan.totalDistance / DIESEL_MILEAGE) * DIESEL_PRICE);
    
    economics = {
        ev: evCost,
        petrol: petrolCost,
        diesel: dieselCost,
        savings: petrolCost - evCost
    };
  }

  return (
    <div className="bg-slate-900/40 backdrop-blur-md rounded-3xl border border-white/5 shadow-2xl h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-slate-700 bg-slate-800/50">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <CircleDollarSign className="w-5 h-5 text-emerald-500" />
          Journey Economics
        </h2>
        <p className="text-sm text-slate-400 mt-1 font-medium tracking-tight">Real-time cost analysis and fuel comparison.</p>
      </div>

      <div className="p-5 border-b border-slate-700 flex flex-col gap-4">
        <div>
          <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Destination City</label>
          <select 
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            disabled={isEmergency}
            className={`w-full bg-slate-950/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500/50 transition-all text-slate-200 placeholder-slate-600 shadow-inner ${isEmergency ? 'opacity-50 cursor-not-allowed text-slate-500' : ''}`}
          >
            <option value="" className="bg-slate-900">-- Select Target --</option>
            {Object.keys(CITY_MAP).map(city => (
              <option key={city} value={city} className="bg-slate-900">{city}</option>
            ))}
          </select>
        </div>

        {errorMsg && <p className="text-red-400 text-[10px] font-black uppercase italic tracking-wider">{errorMsg}</p>}

        <button 
          onClick={handlePlanTrip}
          disabled={isEmergency}
          className={`w-full font-black uppercase tracking-wider text-xs py-3.5 rounded-xl transition-all shadow-lg active:scale-95 flex justify-center items-center gap-2 ${isEmergency ? 'bg-red-600/50 text-red-100 cursor-not-allowed border border-red-500/50 shadow-red-500/10' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20'}`}
        >
          {isEmergency ? <ShieldAlert className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
          {isEmergency ? 'Emergency Lock Active' : 'Calculate Logistics'}
        </button>
      </div>

      {/* Results / Emergency Panel */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
        {isEmergency ? (
           <div className="space-y-6 animate-fadeIn">
              <div className="bg-red-600/20 border border-red-500/40 p-5 rounded-2xl ring-1 ring-red-500/20">
                 <div className="text-red-400 text-xs font-black uppercase tracking-widest mb-2 flex items-center gap-2">
                    <Zap className="w-4 h-4 animate-pulse" />
                    Critical Range Failure
                 </div>
                 <p className="text-red-100 text-[11px] font-bold leading-relaxed">
                    ⚠️ Emergency Risk: Battery too low and no nearby charging stations. 
                    Please seek emergency assistance or towing before planning a trip.
                 </p>
              </div>
              
              <EmergencyAssistant 
                closestHelpStation={closestHelpStation} 
                onSelectAction={(target) => setEmergencyTarget(target)} 
              />
           </div>
        ) : !tripPlan ? (
          <div className="text-center text-slate-600 py-20 flex flex-col items-center opacity-40">
            <Route className="w-16 h-16 mb-4" />
            <p className="text-sm font-black uppercase tracking-[0.2em]">Idle Mode</p>
            <p className="text-xs mt-2 max-w-[200px]">Define your destination to initiate economic analysis.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Journey Economics Overview */}
            <div className="grid grid-cols-1 gap-3 animate-fadeIn">
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-5 relative overflow-hidden group">
                   <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform">
                      <TrendingDown className="w-12 h-12 text-emerald-400" />
                   </div>
                   <div className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Estimated Savings</div>
                   <div className="text-3xl font-black text-emerald-400">₹{economics.savings.toLocaleString()}</div>
                   <p className="text-[10px] text-emerald-400/60 font-medium mt-1 uppercase tracking-tighter">Compared to modern Petrol crossover</p>
                </div>

                <div className="grid grid-cols-3 gap-3">
                   <div className="bg-blue-500/5 border border-white/5 rounded-2xl p-4 text-center">
                      <Zap className="w-4 h-4 text-blue-400 mx-auto mb-2" />
                      <div className="text-[9px] font-bold text-slate-500 uppercase mb-1">EV CHARGE</div>
                      <div className="text-xs font-black text-slate-100 italic">₹{economics.ev}</div>
                   </div>
                   <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-4 text-center">
                      <Fuel className="w-4 h-4 text-red-400/50 mx-auto mb-2" />
                      <div className="text-[9px] font-bold text-slate-500 uppercase mb-1">PETROL</div>
                      <div className="text-xs font-black text-slate-100/50 italic line-through">₹{economics.petrol}</div>
                   </div>
                   <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-4 text-center">
                      <Fuel className="w-4 h-4 text-amber-600/50 mx-auto mb-2" />
                      <div className="text-[9px] font-bold text-slate-500 uppercase mb-1">DIESEL</div>
                      <div className="text-xs font-black text-slate-100/50 italic line-through">₹{economics.diesel}</div>
                   </div>
                </div>
            </div>

            {/* Live Navigation Status */}
            {tripStatus && (
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-5 rounded-2xl shadow-xl ring-1 ring-white/5">
                 <div className="flex justify-between items-center mb-4">
                    <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em]">Live Telemetry</span>
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${tripStatus.status === 'Moving' ? 'bg-emerald-400 animate-pulse' : 'bg-blue-400 animate-bounce'}`} />
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        tripStatus.status === 'Moving' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        tripStatus.status === 'Charging' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                        'bg-amber-500 text-slate-900'
                      }`}>
                        {tripStatus.status}
                      </span>
                    </div>
                 </div>
                 
                 {tripStatus.nextStop && tripStatus.status !== 'Reached' ? (
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-slate-950/50 border border-white/10 flex items-center justify-center shadow-inner">
                         {tripStatus.status === 'Charging' ? <Zap className="w-6 h-6 text-blue-400" /> : <Navigation className="w-6 h-6 text-emerald-400" />}
                      </div>
                      <div className="flex-1">
                         <div className="text-sm font-black text-slate-100">{tripStatus.nextStop.name || tripStatus.nextStop.cityName}</div>
                         <div className="flex items-center justify-between mt-1">
                           <div className="text-xs text-slate-400 font-medium lowercase">Next destination target</div>
                           <div className="text-xs font-bold text-white bg-white/5 px-2 py-0.5 rounded-lg border border-white/5">
                            {Math.round(tripStatus.nextStop.distanceFromLast || tripPlan.totalDistance)} km
                           </div>
                         </div>
                      </div>
                   </div>
                 ) : (
                   <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl flex items-center gap-3">
                      <div className="bg-emerald-500 p-2 rounded-lg">
                        <CheckCircle2 className="w-5 h-5 text-slate-900" />
                      </div>
                      <div>
                        <div className="text-sm font-black text-emerald-400 uppercase tracking-tighter">Mission Accomplished</div>
                        <div className="text-xs text-emerald-400/60 font-medium">Destination reached safely.</div>
                      </div>
                   </div>
                 )}
              </div>
            )}

            {/* Battery Risk Alert */}
            {showBatteryWarning && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-100 px-5 py-4 rounded-2xl text-sm font-medium flex items-start gap-4">
                <span className="text-2xl leading-none">⚡</span>
                <span><span className="font-black text-red-400 block mb-1">RANGE DEPLETED AT DESTINATION</span> This route exceeds your current battery range. Plan for additional charging stops.</span>
              </div>
            )}

            {/* Timeline */}
            <div className="relative pl-10 space-y-8 before:absolute before:inset-y-2 before:left-[19px] before:w-[2px] before:bg-gradient-to-b before:from-emerald-500 before:via-blue-500 before:to-amber-500 before:rounded-full">
              {/* Start Node */}
              <div className="relative group">
                <div className="absolute -left-[31px] top-0 w-10 h-10 rounded-full bg-slate-950 border-4 border-emerald-500 flex items-center justify-center shrink-0 z-10 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                  <MapPin className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="bg-white/5 p-4 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors">
                  <h4 className="font-black text-[11px] uppercase tracking-[0.2em] text-emerald-400 mb-1">Departure</h4>
                  <div className="text-lg font-bold text-slate-100">Current Position</div>
                  <p className="text-sm text-slate-400 mt-1 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> {battery}% Battery Level
                  </p>
                </div>
              </div>

              {/* Intermediate Stops */}
              {tripPlan.stops.map((stop, idx) => (
                <div key={stop.step} className="relative group">
                  <div className="absolute -left-[31px] top-0 w-10 h-10 rounded-full bg-slate-950 border-4 border-blue-500 flex items-center justify-center shrink-0 z-10 shadow-[0_0_15px_rgba(59,130,246,0.3)] group-hover:scale-110 transition-transform">
                    <Zap className="w-4 h-4 text-blue-500" />
                  </div>
                  <div className="bg-white/5 p-5 rounded-2xl border border-white/5 hover:bg-white/10 transition-all hover:translate-x-1">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-black text-[11px] uppercase tracking-[0.2em] text-blue-400 mb-1">Stop {idx + 1}: Logistics Hub</h4>
                        <div className="text-xl font-bold text-slate-100">{stop.name}</div>
                      </div>
                      <div className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-lg font-mono text-sm text-blue-400 font-black">
                        +{Math.round(stop.distanceFromLast)} km
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mb-4">
                      {stop.fastCharging && (
                        <span className="bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border border-emerald-500/20">HyperCharge ⚡</span>
                      )}
                      <span className="bg-slate-950/50 text-slate-400 px-3 py-1 rounded-full text-[10px] font-bold uppercase border border-white/10">{stop.price}</span>
                    </div>

                    {stop.hasHotel && (
                      <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-xl p-4 flex items-center gap-4">
                        <div className="bg-indigo-500/20 p-2 rounded-lg">
                          <Hotel className="w-6 h-6 text-indigo-400" />
                        </div>
                        <div>
                          <h5 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Recommended Stay</h5>
                          <p className="text-sm font-bold text-slate-100 mt-0.5">{stop.hotelName}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* End Node */}
              <div className="relative group">
                <div className="absolute -left-[31px] top-0 w-10 h-10 rounded-full bg-slate-950 border-4 border-amber-500 flex items-center justify-center shrink-0 z-10 shadow-[0_0_15px_rgba(245,158,11,0.3)]">
                  <CheckCircle2 className="w-4 h-4 text-amber-500" />
                </div>
                <div className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 p-5 rounded-2xl border border-amber-500/20">
                  <h4 className="font-black text-[11px] uppercase tracking-[0.2em] text-amber-400 mb-1">Final Destination</h4>
                  <div className="text-xl font-bold text-slate-100">{tripPlan.destinationName}</div>
                  <div className="flex items-center justify-between mt-3">
                    <p className="text-sm text-slate-400 font-medium">Route Distance Total</p>
                    <span className="text-lg font-black text-white">{Math.round(tripPlan.totalDistance)} km</span>
                  </div>
                  {!tripPlan.success && (
                    <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-200 font-medium italic">
                      Warning: Could not find sufficient charging stations to complete this route reliably.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
