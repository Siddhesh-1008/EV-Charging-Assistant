import React, { useState, useEffect, useMemo, useCallback } from 'react';
import MapArea from './components/MapArea';
import DashboardControls from './components/DashboardControls';
import StationList from './components/StationList';
import AIChatbot from './components/AIChatbot';
import LocationSelector from './components/LocationSelector';
import TripPlanner from './components/TripPlanner';
import { calculateDistance } from './utils/distance';
import stationsData from './data/stations.json';
import carsData from './data/cars.json';
import { Zap } from 'lucide-react';

function App() {
  const [userLocation, setUserLocation] = useState(null);
  const [battery, setBattery] = useState(100);
  const [selectedCar, setSelectedCar] = useState(carsData[0]);
  const [stations, setStations] = useState(stationsData);
  const [errorMsg, setErrorMsg] = useState('');
  const [isDetecting, setIsDetecting] = useState(true);

  const [appMode, setAppMode] = useState('normal'); // 'normal' | 'trip'
  const [tripRoute, setTripRoute] = useState(null);
  const [tripEconomics, setTripEconomics] = useState(null);
  const [tripStatus, setTripStatus] = useState(null); // { status, nextStop }
  const [selectedStation, setSelectedStation] = useState(null); // tracking clicked station for routing
  const [emergencyTarget, setEmergencyTarget] = useState(null);

  // Auto-detect location on mount
  const detectLocation = useCallback(() => {
    setIsDetecting(true);
    setErrorMsg('');

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setIsDetecting(false);
        },
        (error) => {
          console.warn("Location error:", error.message);
          // Fallback location (Delhi)
          setUserLocation({ lat: 28.6139, lng: 77.2090 });
          setErrorMsg('Auto-detect failed. Using Delhi as default. You can select a city manually.');
          setIsDetecting(false);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      setUserLocation({ lat: 28.6139, lng: 77.2090 });
      setErrorMsg('Geolocation not supported. Using default location.');
      setIsDetecting(false);
    }
  }, []);

  useEffect(() => {
    detectLocation();
  }, [detectLocation]);

  // Handle location changes from LocationSelector
  const handleLocationChange = useCallback((location, shouldAutoDetect) => {
    if (shouldAutoDetect) {
      detectLocation();
    } else if (location) {
      setUserLocation({ lat: location.lat, lng: location.lng });
      setErrorMsg('');
      setIsDetecting(false);
    }
  }, [detectLocation]);

  const handleRouteGenerated = (routeData) => {
    setTripRoute(routeData); // { destination, stops, economics }
    if (routeData.economics) {
      setTripEconomics(routeData.economics);
    }
  };

  // Compute reachable stations
  const reachableStations = useMemo(() => {
    if (!userLocation) return [];
    
    const maxReachableDist = (battery / 100) * selectedCar.maxRange;
    
    let filtered = stations.map(station => {
      const dist = calculateDistance(
        userLocation.lat, userLocation.lng,
        station.lat, station.lng
      );
      return { ...station, distance: dist };
    });

    return filtered
      .filter(s => s.distance <= maxReachableDist)
      .sort((a, b) => a.distance - b.distance);
      
  }, [userLocation, battery, stations, selectedCar.maxRange]);

  const isEmergency = useMemo(() => {
    return battery < 10 && reachableStations.length === 0;
  }, [battery, reachableStations]);

  const closestHelpStation = useMemo(() => {
    if (!userLocation) return null;
    return [...stations]
      .map(s => ({ ...s, distance: calculateDistance(userLocation.lat, userLocation.lng, s.lat, s.lng) }))
      .sort((a, b) => a.distance - b.distance)[0];
  }, [userLocation, stations]);

  // Clear trip if emergency triggered
  useEffect(() => {
    if (isEmergency) {
      setTripRoute(null);
      setTripEconomics(null);
      setSelectedStation(null);
      setTripStatus(null);
    }
  }, [isEmergency]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-blue-900 text-slate-100 selection:bg-emerald-500/30">
      <div className="p-4 md:p-8 flex flex-col max-w-[1400px] mx-auto gap-6 h-screen overflow-y-auto">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900/40 backdrop-blur-md p-4 rounded-3xl border border-white/5 shadow-2xl">
          <div>
            <h1 className="text-3xl md:text-5xl font-black bg-gradient-to-r from-emerald-300 via-blue-400 to-indigo-400 bg-clip-text text-transparent flex items-center gap-3">
              <Zap className="w-10 h-10 text-emerald-400 drop-shadow-lg" />
              GenAI Charge Assist
            </h1>
            <p className="text-blue-200/70 mt-1 font-medium tracking-wide">Smart EV routing and real-time range estimation</p>
          </div>
          
          <div className="flex flex-col items-end gap-3">
            {errorMsg && (
              <div className="bg-amber-500/10 backdrop-blur border border-amber-500/30 text-amber-400 px-4 py-2 rounded-xl text-sm font-semibold shadow-lg">
                {errorMsg}
              </div>
            )}
            
            <div className="bg-slate-950/50 backdrop-blur-md p-1.5 rounded-2xl flex gap-1 border border-white/10 shadow-inner">
              <button 
                onClick={() => { setAppMode('normal'); setTripRoute(null); setTripEconomics(null); setSelectedStation(null); }}
                className={`px-5 py-2 rounded-xl text-sm font-bold transition-all duration-300 ${appMode === 'normal' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
              >
                Normal Mode
              </button>
              <button 
                onClick={() => { setAppMode('trip'); setTripRoute(null); setTripEconomics(null); setSelectedStation(null); }}
                className={`px-5 py-2 rounded-xl text-sm font-bold transition-all duration-300 ${appMode === 'trip' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
              >
                Trip Planner Mode
              </button>
            </div>
          </div>
        </header>

        {/* Main Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">
          
          {/* Left Column: Location, Controls & List */}
          <div className="lg:col-span-4 xl:col-span-4 flex flex-col gap-6 order-2 lg:order-1 h-full overflow-y-auto pr-2 pb-10">
            <LocationSelector
              onLocationChange={handleLocationChange}
              currentLocation={userLocation}
              isDetecting={isDetecting}
            />
            <DashboardControls 
              battery={battery} 
              setBattery={setBattery} 
              selectedCar={selectedCar}
              setSelectedCar={setSelectedCar}
              carsData={carsData}
            />
            <div className="flex-1">
               {appMode === 'normal' ? (
                  <StationList 
                    stations={reachableStations} 
                    userLocation={userLocation} 
                    onStationClick={setSelectedStation}
                    selectedStationId={selectedStation?.id}
                  />
               ) : (
                  <TripPlanner 
                    userLocation={userLocation}
                    battery={battery}
                    maxRange={selectedCar.maxRange}
                    selectedCar={selectedCar}
                    stations={stations}
                    onRouteGenerated={handleRouteGenerated}
                    tripStatus={tripStatus}
                    isEmergency={isEmergency}
                    closestHelpStation={closestHelpStation}
                    setEmergencyTarget={setEmergencyTarget}
                  />
               )}
            </div>
          </div>

          {/* Right Column: Map */}
          <div className="lg:col-span-8 xl:col-span-8 h-[500px] lg:h-full order-1 lg:order-2 rounded-3xl overflow-hidden shadow-2xl border border-white/10 ring-1 ring-white/5 relative bg-slate-900/50 backdrop-blur-xl">
            <MapArea 
              userLocation={userLocation} 
              stations={appMode === 'normal' ? reachableStations : []} 
              tripRoute={appMode === 'trip' ? tripRoute : null}
              selectedStation={appMode === 'normal' ? selectedStation : null}
              selectedCar={selectedCar}
              appMode={appMode}
              onProgressUpdate={setTripStatus}
              isEmergency={isEmergency}
              emergencyTarget={emergencyTarget}
            />
          </div>

        </div>

        {/* Chatbot */}
        <AIChatbot 
          contextData={{
            carModel: selectedCar.name,
            batteryCapacity: selectedCar.batteryCapacity,
            battery,
            range: Math.round((battery / 100) * selectedCar.maxRange),
            avgSpeed: selectedCar.avgSpeed,
            stations: reachableStations.slice(0, 3),
            tripStatus: tripStatus ? tripStatus.status : "Idle",
            tripEconomics,
            isEmergency
          }} 
        />
      </div>
    </div>
  );
}

export default App;
