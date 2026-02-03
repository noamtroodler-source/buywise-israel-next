import { useCallback } from 'react';
import { PropertyFilters as PropertyFiltersType } from '@/types/database';
import { cn } from '@/lib/utils';

interface MobileQuickFiltersProps {
  filters: PropertyFiltersType;
  onFiltersChange: (filters: PropertyFiltersType) => void;
  listingType: 'for_sale' | 'for_rent';
}

interface QuickFilter {
  key: string;
  label: string;
  apply: (filters: PropertyFiltersType) => PropertyFiltersType;
  isActive: (filters: PropertyFiltersType) => boolean;
}

export function MobileQuickFilters({
  filters,
  onFiltersChange,
  listingType,
}: MobileQuickFiltersProps) {
  // Define quick filters based on listing type
  const priceFilters: QuickFilter[] = listingType === 'for_rent'
    ? [
        {
          key: 'price-under-5k',
          label: 'Under ₪5K',
          apply: (f) => ({ ...f, max_price: 5000 }),
          isActive: (f) => f.max_price === 5000,
        },
        {
          key: 'price-5k-10k',
          label: '₪5K-10K',
          apply: (f) => ({ ...f, min_price: 5000, max_price: 10000 }),
          isActive: (f) => f.min_price === 5000 && f.max_price === 10000,
        },
        {
          key: 'price-10k-plus',
          label: '₪10K+',
          apply: (f) => ({ ...f, min_price: 10000 }),
          isActive: (f) => f.min_price === 10000 && !f.max_price,
        },
      ]
    : [
        {
          key: 'price-under-2m',
          label: 'Under ₪2M',
          apply: (f) => ({ ...f, max_price: 2000000 }),
          isActive: (f) => f.max_price === 2000000,
        },
        {
          key: 'price-2m-4m',
          label: '₪2M-4M',
          apply: (f) => ({ ...f, min_price: 2000000, max_price: 4000000 }),
          isActive: (f) => f.min_price === 2000000 && f.max_price === 4000000,
        },
        {
          key: 'price-4m-plus',
          label: '₪4M+',
          apply: (f) => ({ ...f, min_price: 4000000 }),
          isActive: (f) => f.min_price === 4000000 && !f.max_price,
        },
      ];

  const roomFilters: QuickFilter[] = [
    {
      key: 'rooms-2plus',
      label: '2+ rooms',
      apply: (f) => ({ ...f, min_rooms: 2 }),
      isActive: (f) => f.min_rooms === 2,
    },
    {
      key: 'rooms-3plus',
      label: '3+ rooms',
      apply: (f) => ({ ...f, min_rooms: 3 }),
      isActive: (f) => f.min_rooms === 3,
    },
    {
      key: 'rooms-4plus',
      label: '4+ rooms',
      apply: (f) => ({ ...f, min_rooms: 4 }),
      isActive: (f) => f.min_rooms === 4,
    },
  ];

  const typeFilters: QuickFilter[] = [
    {
      key: 'type-apartment',
      label: 'Apartment',
      apply: (f) => ({ ...f, property_type: 'apartment' }),
      isActive: (f) => f.property_type === 'apartment',
    },
    {
      key: 'type-house',
      label: 'House',
      apply: (f) => ({ ...f, property_type: 'house' }),
      isActive: (f) => f.property_type === 'house',
    },
    {
      key: 'type-penthouse',
      label: 'Penthouse',
      apply: (f) => ({ ...f, property_type: 'penthouse' }),
      isActive: (f) => f.property_type === 'penthouse',
    },
  ];

  const allFilters = [...priceFilters, ...roomFilters, ...typeFilters];

  const handleFilterClick = useCallback((filter: QuickFilter) => {
    if (filter.isActive(filters)) {
      // Clear the filter
      const newFilters = { ...filters };
      if (filter.key.startsWith('price-')) {
        delete newFilters.min_price;
        delete newFilters.max_price;
      } else if (filter.key.startsWith('rooms-')) {
        delete newFilters.min_rooms;
      } else if (filter.key.startsWith('type-')) {
        delete newFilters.property_type;
      }
      onFiltersChange(newFilters);
    } else {
      onFiltersChange(filter.apply(filters));
    }
  }, [filters, onFiltersChange]);

  return (
    <div className="mobile-quick-filters" role="group" aria-label="Quick filters">
      {allFilters.map((filter) => (
        <button
          key={filter.key}
          onClick={() => handleFilterClick(filter)}
          className={cn(
            "quick-filter-chip",
            filter.isActive(filters) && "active"
          )}
          aria-pressed={filter.isActive(filters)}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
}
