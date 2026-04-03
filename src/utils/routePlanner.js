import { calculateDistance } from './distance';

/**
 * Generates an optimized EV charging route from start to destination.
 * 
 * @param {Object} start {lat, lng, cityName}
 * @param {Object} dest {lat, lng, cityName}
 * @param {number} currentBattery Current battery percentage
 * @param {number} maxRange Maximum range of the vehicle at 100% (km)
 * @param {Array} allStations Array of all available stations
 * @returns {Array} List of stops
 */
export function calculateTripStops(start, dest, currentBattery, maxRange, allStations) {
  const totalDistance = calculateDistance(start.lat, start.lng, dest.lat, dest.lng);
  
  // Safe margin - we don't want to run the battery to 0. We plan to charge at 20%
  const usableRange = maxRange * 0.8;
  const initialRange = (currentBattery / 100) * maxRange;

  const stops = [];
  let currentLocation = { ...start };
  let remainingRange = initialRange;
  let distanceCovered = 0;

  let loopSafety = 0;
  const visitedStops = new Set(); // Prevent duplicate station hopping

  // Simple straight-line path interpolation
  while (distanceCovered + remainingRange < totalDistance && loopSafety < 15) {
    loopSafety++;

    // Calculate how far we can safely go
    const targetDistance = distanceCovered + remainingRange - 30; // 30km safety buffer
    if (targetDistance <= distanceCovered) {
      break; // Can't progress safely, risk of infinite loop
    }

    // Interpolate waypoint coordinates at 'targetDistance' along the line
    const ratio = targetDistance / totalDistance;
    const waypointLat = start.lat + (dest.lat - start.lat) * ratio;
    const waypointLng = start.lng + (dest.lng - start.lng) * ratio;

    // Find stations within a reasonable radius of this waypoint
    // Prioritize stations with hotels (+ fast charging)
    const candidates = allStations
      .filter(s => !visitedStops.has(s.id)) // Skip already visited stops
      .map(station => {
        const distToStation = calculateDistance(currentLocation.lat, currentLocation.lng, station.lat, station.lng);
        const distFromWaypoint = calculateDistance(waypointLat, waypointLng, station.lat, station.lng);
        return {
          ...station,
          distToStation,
          distFromWaypoint
        };
      })
      // Must be reachable
      .filter(s => s.distToStation <= remainingRange)
      // Sort by best match (closest to ideal waypoint, having hotels, fast charging)
      .sort((a, b) => {
        let scoreA = a.distFromWaypoint;
        let scoreB = b.distFromWaypoint;

        // Reward hotels and fast charging (by artificially decreasing their distance score)
        if (a.hasHotel) scoreA -= 50;
        if (b.hasHotel) scoreB -= 50;
        if (a.fastCharging) scoreA -= 20;
        if (b.fastCharging) scoreB -= 20;

        return scoreA - scoreB;
      });

    if (candidates.length === 0) {
      // No station found, route is broken
      break;
    }

    // Pick top candidate
    const bestStop = candidates[0];
    visitedStops.add(bestStop.id); // Mark as visited
    
    stops.push({
      step: stops.length + 1,
      type: 'charge',
      name: bestStop.name,
      lat: bestStop.lat,
      lng: bestStop.lng,
      city: bestStop.city,
      distanceFromLast: bestStop.distToStation,
      fastCharging: bestStop.fastCharging,
      hasHotel: bestStop.hasHotel,
      hotelName: bestStop.hotelName,
      price: bestStop.price,
      connectors: bestStop.connectors
    });

    // Update state for next leg
    distanceCovered += bestStop.distToStation; // Approximate
    currentLocation = { lat: bestStop.lat, lng: bestStop.lng };
    remainingRange = usableRange; // Assume we charged back to 100% (or 80% usable)
  }

  return {
    success: distanceCovered + remainingRange >= totalDistance || stops.length > 0,
    totalDistance,
    stops
  };
}
