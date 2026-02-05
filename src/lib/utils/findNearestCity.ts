 import { getDistanceInMeters } from './geometry';
 
 interface CityWithCoords {
   name: string;
   center_lat?: number | null;
   center_lng?: number | null;
 }
 
 const MAX_RADIUS_METERS = 50000; // 50km - generous radius to find nearest city
 
 /**
  * Find the nearest city from a list based on user coordinates
  * @param userCoords - { lat, lng } of user's position
  * @param cities - Array of cities with center_lat/center_lng
  * @returns The nearest city within range, or null if none found
  */
 export function findNearestCity(
   userCoords: { lat: number; lng: number },
   cities: CityWithCoords[]
 ): CityWithCoords | null {
   let nearestCity: CityWithCoords | null = null;
   let minDistance = Infinity;
 
   for (const city of cities) {
     if (city.center_lat == null || city.center_lng == null) continue;
 
     // getDistanceInMeters expects [lng, lat] format
     const distance = getDistanceInMeters(
       [userCoords.lng, userCoords.lat],
       [city.center_lng, city.center_lat]
     );
 
     if (distance < minDistance && distance <= MAX_RADIUS_METERS) {
       minDistance = distance;
       nearestCity = city;
     }
   }
 
   return nearestCity;
 }