import { useSearchParams } from 'react-router-dom';
import { useCallback, useMemo } from 'react';

export type ListingType = 'for_sale' | 'for_rent' | 'projects';

export interface PropertyFilters {
  status: ListingType;
  city: string | null;
  minPrice: number | null;
  maxPrice: number | null;
  minRooms: number | null;
  maxRooms: number | null;
  propertyType: string | null;
  sortBy: string;
}

function toNum(v: string | null): number | null {
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export function useMapFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters: PropertyFilters = useMemo(() => ({
    status: (searchParams.get('status') as ListingType) || 'for_sale',
    city: searchParams.get('city'),
    minPrice: toNum(searchParams.get('min_price')),
    maxPrice: toNum(searchParams.get('max_price')),
    minRooms: toNum(searchParams.get('min_rooms')),
    maxRooms: toNum(searchParams.get('max_rooms')),
    propertyType: searchParams.get('property_type'),
    sortBy: searchParams.get('sort_by') || 'newest',
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
