/**
 * Geometry utilities for map operations
 */

export type Polygon = [number, number][]; // Array of [lng, lat] coordinates

/**
 * Check if a point is inside a polygon using the ray-casting algorithm
 * @param point - [lng, lat] coordinates of the point to check
 * @param polygon - Array of [lng, lat] coordinates forming the polygon
 * @returns boolean indicating if point is inside polygon
 */
export function isPointInPolygon(point: [number, number], polygon: Polygon): boolean {
  const [x, y] = point;
  let inside = false;
  
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0], yi = polygon[i][1];
    const xj = polygon[j][0], yj = polygon[j][1];
    
    if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }
  
  return inside;
}

/**
 * Check if a point is inside a circle
 * @param point - [lng, lat] coordinates
 * @param center - [lng, lat] center of circle
 * @param radiusMeters - radius in meters
 * @returns boolean
 */
export function isPointInCircle(
  point: [number, number], 
  center: [number, number], 
  radiusMeters: number
): boolean {
  const distance = getDistanceInMeters(point, center);
  return distance <= radiusMeters;
}

/**
 * Calculate distance between two points using Haversine formula
 * @param point1 - [lng, lat]
 * @param point2 - [lng, lat]
 * @returns distance in meters
 */
export function getDistanceInMeters(
  point1: [number, number], 
  point2: [number, number]
): number {
  const R = 6371000; // Earth's radius in meters
  const lat1 = toRadians(point1[1]);
  const lat2 = toRadians(point2[1]);
  const deltaLat = toRadians(point2[1] - point1[1]);
  const deltaLng = toRadians(point2[0] - point1[0]);

  const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
            Math.cos(lat1) * Math.cos(lat2) *
            Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Check if map bounds contain a city center (approximate check)
 * @param bounds - {north, south, east, west}
 * @param cityCenter - [lat, lng]
 * @returns boolean
 */
export function boundsContainPoint(
  bounds: { north: number; south: number; east: number; west: number },
  point: [number, number] // [lat, lng] format
): boolean {
  const [lat, lng] = point;
  return lat <= bounds.north && 
         lat >= bounds.south && 
         lng <= bounds.east && 
         lng >= bounds.west;
}

/**
 * Convert Leaflet LatLng array to [lng, lat] polygon format
 */
export function latLngsToPolygon(latLngs: Array<{ lat: number; lng: number }>): Polygon {
  return latLngs.map(ll => [ll.lng, ll.lat] as [number, number]);
}

/**
 * Serialize polygon to URL-safe string
 */
export function serializePolygon(polygon: Polygon): string {
  return polygon.map(([lng, lat]) => `${lat.toFixed(6)},${lng.toFixed(6)}`).join(';');
}

/**
 * Deserialize polygon from URL string
 */
export function deserializePolygon(str: string): Polygon | null {
  try {
    const points = str.split(';').map(coord => {
      const [lat, lng] = coord.split(',').map(Number);
      return [lng, lat] as [number, number];
    });
    if (points.some(p => isNaN(p[0]) || isNaN(p[1]))) return null;
    return points;
  } catch {
    return null;
  }
}
