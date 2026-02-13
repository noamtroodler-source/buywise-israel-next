import { useSearchParams } from 'react-router-dom';
import { useCallback, useMemo } from 'react';

export type ListingType = 'for_sale' | 'for_rent' | 'projects';

export interface MapUrlFilters {
  status: ListingType;
  city: string | null;
  minPrice: number | null;
  maxPrice: number | null;
  minRooms: number | null;
  maxRooms: number | null;
  propertyType: string | null;
  propertyTypes: string[] | null;
  minBathrooms: number | null;
  minSize: number | null;
  maxSize: number | null;
  minFloor: number | null;
  maxFloor: number | null;
  minParking: number | null;
  maxDaysListed: number | null;
  features: string[] | null;
  sortBy: string;
  lat: number | null;
  lng: number | null;
  zoom: number | null;
  polygon: string | null;
}

function toNum(v: string | null): number | null {
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function toArray(v: string | null): string[] | null {
  if (!v) return null;
  return v.split(',').filter(Boolean);
}

export function useMapFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters: MapUrlFilters = useMemo(() => ({
    status: (searchParams.get('status') as ListingType) || 'for_sale',
    city: searchParams.get('city'),
    minPrice: toNum(searchParams.get('min_price')),
    maxPrice: toNum(searchParams.get('max_price')),
    minRooms: toNum(searchParams.get('min_rooms')),
    maxRooms: toNum(searchParams.get('max_rooms')),
    propertyType: searchParams.get('property_type'),
    propertyTypes: toArray(searchParams.get('property_types')),
    minBathrooms: toNum(searchParams.get('min_bathrooms')),
    minSize: toNum(searchParams.get('min_size')),
    maxSize: toNum(searchParams.get('max_size')),
    minFloor: toNum(searchParams.get('min_floor')),
    maxFloor: toNum(searchParams.get('max_floor')),
    minParking: toNum(searchParams.get('min_parking')),
    maxDaysListed: toNum(searchParams.get('max_days_listed')),
    features: toArray(searchParams.get('features')),
    sortBy: searchParams.get('sort_by') || 'newest',
    lat: toNum(searchParams.get('lat')),
    lng: toNum(searchParams.get('lng')),
    zoom: toNum(searchParams.get('zoom')),
    polygon: searchParams.get('polygon'),
  }), [searchParams]);

  const setFilter = useCallback(
    (key: string, value: string | number | null) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (value === null || value === '') {
          next.delete(key);
        } else {
          next.set(key, String(value));
        }
        return next;
      }, { replace: true });
    },
    [setSearchParams],
  );

  const setMultipleFilters = useCallback(
    (updates: Record<string, string | number | null>) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        for (const [key, value] of Object.entries(updates)) {
          if (value === null || value === '') {
            next.delete(key);
          } else {
            next.set(key, String(value));
          }
        }
        return next;
      }, { replace: true });
    },
    [setSearchParams],
  );

  return { filters, setFilter, setMultipleFilters };
}
