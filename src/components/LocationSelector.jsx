import React, { useState } from 'react';
import { MapPin, Navigation, ChevronDown, Search, Loader2 } from 'lucide-react';

const CITY_MAP = {
  'Mumbai': { lat: 19.0760, lng: 72.8777 },
  'Pune': { lat: 18.5204, lng: 73.8567 },
  'Bangalore': { lat: 12.9716, lng: 77.5946 },
  'Hyderabad': { lat: 17.3850, lng: 78.4867 },
  'Chennai': { lat: 13.0827, lng: 80.2707 },
  'Delhi': { lat: 28.6139, lng: 77.2090 },
  'Ahmedabad': { lat: 23.0225, lng: 72.5714 },
  'Kolkata': { lat: 22.5726, lng: 88.3639 },
  'Jaipur': { lat: 26.9124, lng: 75.7873 },
  'Chandigarh': { lat: 30.7333, lng: 76.7794 },
  'Lucknow': { lat: 26.8467, lng: 80.9462 },
  'Nagpur': { lat: 21.1458, lng: 79.0882 },
};

export default function LocationSelector({ onLocationChange, currentLocation, isDetecting }) {
  const [mode, setMode] = useState('auto'); // 'auto' | 'manual'
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedCity, setSelectedCity] = useState('');

  const filteredCities = Object.keys(CITY_MAP).filter(city =>
    city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAutoDetect = () => {
    setMode('auto');
    setSelectedCity('');
    setSearchQuery('');

    if ('geolocation' in navigator) {
      onLocationChange(null, true); // signal parent to re-detect
    }
  };

  const handleCitySelect = (cityName) => {
    const coords = CITY_MAP[cityName];
    if (coords) {
      setMode('manual');
      setSelectedCity(cityName);
      setSearchQuery(cityName);
      setShowDropdown(false);
      onLocationChange({ ...coords, cityName }, false);
    }
  };

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    setShowDropdown(val.length > 0);
    setSelectedCity('');
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const match = Object.keys(CITY_MAP).find(
      city => city.toLowerCase() === searchQuery.toLowerCase()
    );
    if (match) {
      handleCitySelect(match);
    }
  };

  const getLocationLabel = () => {
    if (isDetecting) return 'Syncing GPS...';
    if (mode === 'manual' && selectedCity) return selectedCity;
    if (currentLocation) {
      return `${currentLocation.lat.toFixed(4)}°N, ${currentLocation.lng.toFixed(4)}°E`;
    }
    return 'Location Offline';
  };

  return (
    <div className="bg-slate-900/40 backdrop-blur-md rounded-3xl p-6 border border-white/5 shadow-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MapPin className="w-6 h-6 text-blue-400 drop-shadow-md" />
          <h2 className="text-xl font-bold font-sans tracking-wide">Navigator</h2>
        </div>
        <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${isDetecting ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'}`}>
          <div className={`w-1.5 h-1.5 rounded-full ${isDetecting ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`} />
          {isDetecting ? 'UPDATING' : 'ONLINE'}
        </div>
      </div>

      {/* Mode Toggle Buttons */}
      <div className="flex p-1 bg-slate-950/50 rounded-2xl border border-white/5 shadow-inner gap-1">
        <button
          onClick={handleAutoDetect}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 ${
            mode === 'auto'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
              : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
          }`}
        >
          {isDetecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
          GPS Sync
        </button>

        <button
          onClick={() => { setMode('manual'); setShowDropdown(false); }}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 ${
            mode === 'manual'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30'
              : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
          }`}
        >
          <Search className="w-4 h-4" />
          Region List
        </button>
      </div>

      {/* Manual City Selector */}
      {mode === 'manual' && (
        <div className="space-y-4 animate-fadeIn">
          {/* Search Input */}
          <form onSubmit={handleSearchSubmit} className="relative group">
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={() => setShowDropdown(true)}
              placeholder="Query city database..."
              className="w-full bg-slate-950 border border-white/10 rounded-2xl px-5 py-3 text-sm focus:outline-none focus:border-blue-500/50 transition-all font-medium text-slate-200 placeholder-slate-600 pr-12 shadow-inner"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-blue-500 transition-colors">
              <ChevronDown className="w-4 h-4" />
            </div>
          </form>

          {/* City Dropdown */}
          {showDropdown && (
            <div className="bg-slate-900 border border-white/10 rounded-2xl max-h-[220px] overflow-y-auto shadow-2xl custom-scrollbar ring-1 ring-black/50">
              {filteredCities.length > 0 ? (
                filteredCities.map((city) => (
                  <button
                    key={city}
                    onClick={() => handleCitySelect(city)}
                    className={`w-full text-left px-5 py-3 text-sm hover:bg-white/5 transition-colors flex items-center justify-between group/btn ${
                      selectedCity === city ? 'bg-blue-600/20 text-blue-400' : 'text-slate-400'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <MapPin className={`w-3.5 h-3.5 transition-colors ${selectedCity === city ? 'text-blue-400' : 'text-slate-600 group-hover/btn:text-blue-400'}`} />
                      <span className="font-bold tracking-tight">{city}</span>
                    </div>
                    {selectedCity === city && <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />}
                  </button>
                ))
              ) : (
                <div className="px-5 py-4 text-xs font-black uppercase text-slate-600 text-center tracking-widest italic">
                  Database mismatch
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Current Location Display */}
      <div className="flex items-center gap-4 bg-slate-950/30 px-5 py-3 rounded-2xl border border-white/5 shadow-inner">
        <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shadow-sm">
          <Navigation className="w-4 h-4 text-blue-400" />
        </div>
        <div>
          <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Active Coordinate</h4>
          <span className="text-sm font-black text-slate-100 tracking-tight">
            {getLocationLabel()}
          </span>
        </div>
      </div>
    </div>
  );
}
