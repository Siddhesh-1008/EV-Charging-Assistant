import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import L from 'leaflet';

// Fix for default marker icons in Leaflet with Vite
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

// Custom icon for user location
const userIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Custom icon for EV stations (Normal Mode)
const evIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Custom icon for route stops
const stopIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Component to dynamically update map center
function ChangeView({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

// Component to dynamically fit route bounds
function FitBounds({ coords }) {
  const map = useMap();
  useEffect(() => {
    if (coords && coords.length > 1) {
      const bounds = L.latLngBounds(coords);
      map.fitBounds(bounds, { padding: [100, 100] });
    }
  }, [coords, map]);
  return null;
}

export default function MapArea({ userLocation, stations, tripRoute, selectedStation, selectedCar, onProgressUpdate, isEmergency, emergencyTarget }) {
  const [carPos, setCarPos] = useState(null);
  const animationRef = useRef(null);

  // Default to center of India if no location
  const defaultCenter = [20.5937, 78.9629];
  const center = userLocation ? [userLocation.lat, userLocation.lng] : defaultCenter;
  const zoom = userLocation ? (tripRoute ? 6 : 13) : 5;

  // Extract path coords from tripRoute - BLOCKED if Emergency
  let polylineCoords = null;
  if (!isEmergency && tripRoute && userLocation) {
    polylineCoords = [
      [userLocation.lat, userLocation.lng],
      ...tripRoute.stops.map(s => [s.lat, s.lng]),
      [tripRoute.destination.lat, tripRoute.destination.lng]
    ];
  }

  // Single station route (Normal Mode) - BLOCKED if Emergency
  let singleRouteCoords = null;
  if (!isEmergency && selectedStation && userLocation && !tripRoute) {
    singleRouteCoords = [
      [userLocation.lat, userLocation.lng],
      [selectedStation.lat, selectedStation.lng]
    ];
  }

  // Emergency Rescue Path (RED)
  let emergencyCoords = null;
  if (isEmergency && emergencyTarget && userLocation) {
    emergencyCoords = [
        [userLocation.lat, userLocation.lng],
        [emergencyTarget.lat, emergencyTarget.lng]
    ];
  }

  // Animation logic for Trip Route
  useEffect(() => {
    if (tripRoute && polylineCoords && polylineCoords.length > 1) {
      let currentStep = 0;
      let isCharging = false;
      setCarPos(polylineCoords[0]);
      
      const animateStatus = (status, nextStop = null) => {
        if (onProgressUpdate) {
            onProgressUpdate({ status, nextStop });
        }
      };

      animateStatus("Moving", tripRoute.stops[0] || tripRoute.destination);

      animationRef.current = setInterval(() => {
        if (isCharging) {
          isCharging = false;
          currentStep++;
          if (currentStep < polylineCoords.length) {
            const nextTarget = currentStep < polylineCoords.length - 1 
                               ? tripRoute.stops[currentStep] 
                               : tripRoute.destination;
            animateStatus("Moving", nextTarget);
          }
          return;
        }

        if (currentStep < polylineCoords.length - 1) {
          const end = polylineCoords[currentStep + 1];
          
          // Move car to next point
          setCarPos(end);
          
          // Index for stops check: we just arrived at end (polylineCoords[currentStep+1])
          // If currentStep+1 matches a stop index (1 to length-2)
          const arrivedAtIndex = currentStep + 1;
          const stopIndex = arrivedAtIndex - 1; // stops are 0-indexed in tripRoute.stops

          if (stopIndex >= 0 && stopIndex < tripRoute.stops.length) {
             isCharging = true;
             animateStatus("Charging", tripRoute.stops[stopIndex]);
          } else {
             currentStep++;
             if (currentStep === polylineCoords.length - 1) {
                animateStatus("Reached");
                clearInterval(animationRef.current);
             }
          }
        }
      }, 1200); // 1.2s intervals for smoother pacing

      return () => clearInterval(animationRef.current);
    } else {
      setCarPos(null);
      if (onProgressUpdate) onProgressUpdate(null);
    }
  }, [tripRoute]);

  // Dynamic Car Emoji Icon
  const carMarkerIcon = L.divIcon({
    html: `<div style="
      font-size: 32px; 
      transition: all 1.2s linear;
      transform: translate(-50%, -50%);
      filter: drop-shadow(0 4px 6px rgba(0,0,0,0.3));
    ">${selectedCar.icon || '🚗'}</div>`,
    className: 'custom-car-icon',
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  });

  return (
    <div className="w-full h-full rounded-3xl overflow-hidden relative z-10 shadow-2xl border border-white/5 ring-1 ring-white/10 group">
      {/* Map Overlay Glow */}
      <div className="absolute inset-0 pointer-events-none border-[12px] border-slate-900/10 z-20 rounded-3xl" />
      <MapContainer center={center} zoom={zoom} className="w-full h-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        
        {/* View Management */}
        {!tripRoute && !selectedStation && !emergencyTarget && <ChangeView center={center} zoom={zoom} />}
        {tripRoute && !isEmergency && <FitBounds coords={polylineCoords} />}
        {singleRouteCoords && !isEmergency && <FitBounds coords={singleRouteCoords} />}
        {emergencyTarget && emergencyCoords && <FitBounds coords={emergencyCoords} />}

        {/* Start Position Marker */}
        {userLocation && !carPos && (
          <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
            <Popup className="text-slate-900 font-semibold">
               {isEmergency ? '⚠️ Stranded Location' : 'Current Location'}
            </Popup>
          </Marker>
        )}

        {/* Animated Moveable Car */}
        {carPos && (
          <Marker position={carPos} icon={carMarkerIcon}>
            <Popup className="text-slate-900 font-semibold tracking-tight">
              <div className="flex items-center gap-2">
                <span>{selectedCar.icon}</span>
                <span>{selectedCar.name}</span>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Trip Mode Polyline (Green) */}
        {polylineCoords && (
          <Polyline 
            positions={polylineCoords} 
            color="#10b981" 
            weight={6} 
            opacity={0.8}
            lineCap="round"
            lineJoin="round"
          />
        )}

        {/* Normal Mode Selection Route (Blue) */}
        {singleRouteCoords && (
          <Polyline 
            positions={singleRouteCoords} 
            color="#3b82f6" 
            weight={6} 
            opacity={0.8}
            dashArray="10, 15"
            lineCap="round"
          />
        )}

        {/* Emergency Rescue Route (Red) */}
        {emergencyCoords && (
          <Polyline 
            positions={emergencyCoords} 
            color="#ef4444" 
            weight={6} 
            opacity={0.9}
            lineCap="round"
            lineJoin="round"
          />
        )}

        {/* Emergency Target Highlight */}
        {isEmergency && emergencyTarget && (
           <Marker position={[emergencyTarget.lat, emergencyTarget.lng]} icon={stopIcon}>
              <Popup className="text-slate-900">
                 <div className="font-black text-red-600 uppercase tracking-tighter text-xs mb-1">Rescue Destination</div>
                 <div className="font-bold">{emergencyTarget.name}</div>
              </Popup>
           </Marker>
        )}

        {/* Selected Hub Highlight in Normal Mode */}
        {selectedStation && !tripRoute && !isEmergency && (
          <Marker position={[selectedStation.lat, selectedStation.lng]} icon={stopIcon}>
            <Popup className="text-slate-900">
               <div className="font-black text-blue-600 uppercase tracking-tighter text-xs mb-1">Navigation Target</div>
               <div className="font-bold">{selectedStation.name}</div>
            </Popup>
          </Marker>
        )}

        {/* Route Stops */}
        {tripRoute && tripRoute.stops.map(station => (
          <Marker 
            key={`route-stop-${station.name}`} 
            position={[station.lat, station.lng]}
            icon={stopIcon}
          >
            <Popup className="text-slate-900">
              <div className="font-bold text-lg mb-1 text-blue-600">Stop {station.step}: {station.name}</div>
              <div className="text-sm space-y-1 font-medium">
                <p><b>⚡ Speed:</b> {station.fastCharging ? 'HyperCharge+' : 'Standard'}</p>
                {station.hasHotel && <p className="text-indigo-600"><b>🏨 Lodging:</b> {station.hotelName}</p>}
                {station.price && <p><b>💳 Rate:</b> {station.price}</p>}
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Destination Marker */}
        {tripRoute && (
          <Marker 
            position={[tripRoute.destination.lat, tripRoute.destination.lng]} 
            icon={userIcon}
          >
            <Popup className="text-slate-900 font-bold text-amber-600">🏁 {tripRoute.destination.cityName}</Popup>
          </Marker>
        )}

        {/* Nearby Potential Hubs */}
        {!tripRoute && stations.map(station => (
          <Marker 
            key={station.id} 
            position={[station.lat, station.lng]}
            icon={evIcon}
            opacity={isEmergency ? 0.2 : (selectedStation?.id === station.id ? 0.2 : 1)}
          >
            <Popup className="text-slate-900">
              <div className="font-bold text-lg mb-1">{station.name}</div>
              <div className="text-sm space-y-1 font-medium">
                <p><b>Status:</b> {station.status || 'Available'}</p>
                {station.fastCharging && <p><b>⚡ Fast Charging:</b> Yes</p>}
                {station.hasHotel && <p className="text-indigo-600"><b>🏨 Hotel:</b> {station.hotelName}</p>}
                {station.connectors && <p><b>🔌 Connectors:</b> {station.connectors.join(', ')}</p>}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

