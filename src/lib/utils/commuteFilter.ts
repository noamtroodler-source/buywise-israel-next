import { getDistanceInMeters } from './geometry';

/** Average driving speed in Israel for rough commute estimation (km/h) */
const AVG_DRIVING_SPEED_KMH = 40;

/** Check if a commute destination is a saved location (vs preset city hub) */
export function isSavedLocationDest(dest: string | undefined): boolean {
  return !!dest && dest.startsWith('saved:');
}

/** Extract saved location ID from destination string */
export function getSavedLocationId(dest: string): string {
  return dest.replace('saved:', '');
}

/** Convert max commute minutes to approximate radius in meters */
export function commuteMinutesToMeters(minutes: number): number {
  return (minutes / 60) * AVG_DRIVING_SPEED_KMH * 1000;
}

/**
 * Filter properties by distance from a saved location.
 * Properties without lat/lng are excluded.
 */
export function filterByDistance<T extends { latitude: number | null; longitude: number | null }>(
  items: T[],
  center: { latitude: number; longitude: number },
  maxMinutes: number,
): T[] {
  const maxMeters = commuteMinutesToMeters(maxMinutes);
  return items.filter(item => {
    if (item.latitude == null || item.longitude == null) return false;
    const dist = getDistanceInMeters(
      [center.longitude, center.latitude],
      [item.longitude, item.latitude],
    );
    return dist <= maxMeters;
  });
}
