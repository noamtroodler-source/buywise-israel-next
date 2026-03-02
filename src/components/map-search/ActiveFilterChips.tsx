import { memo, useMemo } from 'react';
import { X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { usePreferences } from '@/contexts/PreferencesContext';
import { PROPERTY_TYPE_LABELS } from '@/lib/seo/constants';
import type { PropertyFilters } from '@/types/database';

interface FilterChip {
  key: string;
  label: string;
  clearKeys: string[];
}

function formatCompact(n: number, currency: 'ILS' | 'USD'): string {
  const sym = currency === 'USD' ? '$' : '₪';
  if (n >= 1_000_000) {
    const m = n / 1_000_000;
    return `${sym}${m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)}M`;
  }
  if (n >= 1_000) return `${sym}${Math.round(n / 1_000)}K`;
  return `${sym}${n}`;
}

function buildChips(filters: PropertyFilters, currency: 'ILS' | 'USD'): FilterChip[] {
  const chips: FilterChip[] = [];

  // Price range
  if (filters.min_price || filters.max_price) {
    const label = filters.min_price && filters.max_price
      ? `${formatCompact(filters.min_price, currency)}–${formatCompact(filters.max_price, currency)}`
      : filters.min_price
        ? `From ${formatCompact(filters.min_price, currency)}`
        : `Up to ${formatCompact(filters.max_price!, currency)}`;
    chips.push({ key: 'price', label, clearKeys: ['min_price', 'max_price'] });
  }

  // Rooms
  if (filters.min_rooms || filters.max_rooms) {
    const label = filters.min_rooms && filters.max_rooms
      ? `${filters.min_rooms}–${filters.max_rooms} beds`
      : filters.min_rooms
        ? `${filters.min_rooms}+ beds`
        : `Up to ${filters.max_rooms} beds`;
    chips.push({ key: 'rooms', label, clearKeys: ['min_rooms', 'max_rooms'] });
  }

  // Property types
  if (filters.property_types?.length) {
    const labels = filters.property_types.map(t => PROPERTY_TYPE_LABELS[t] || t);
    const label = labels.length <= 2 ? labels.join(', ') : `${labels.length} types`;
    chips.push({ key: 'types', label, clearKeys: ['property_types'] });
  } else if (filters.property_type) {
    chips.push({ key: 'types', label: PROPERTY_TYPE_LABELS[filters.property_type] || filters.property_type, clearKeys: ['property_type'] });
  }

  // Bathrooms
  if (filters.min_bathrooms) {
    chips.push({ key: 'baths', label: `${filters.min_bathrooms}+ baths`, clearKeys: ['min_bathrooms'] });
  }

  // Size
  if (filters.min_size || filters.max_size) {
    const label = filters.min_size && filters.max_size
      ? `${filters.min_size}–${filters.max_size} m²`
      : filters.min_size
        ? `${filters.min_size}+ m²`
        : `Up to ${filters.max_size} m²`;
    chips.push({ key: 'size', label, clearKeys: ['min_size', 'max_size'] });
  }

  // Floor
  if (filters.min_floor || filters.max_floor) {
    const label = filters.min_floor && filters.max_floor
      ? `Floor ${filters.min_floor}–${filters.max_floor}`
      : filters.min_floor
        ? `Floor ${filters.min_floor}+`
        : `Floor up to ${filters.max_floor}`;
    chips.push({ key: 'floor', label, clearKeys: ['min_floor', 'max_floor'] });
  }

  // Parking
  if (filters.min_parking) {
    chips.push({ key: 'parking', label: `${filters.min_parking}+ parking`, clearKeys: ['min_parking'] });
  }

  // Days listed
  if (filters.max_days_listed) {
    chips.push({ key: 'days', label: `Last ${filters.max_days_listed}d`, clearKeys: ['max_days_listed'] });
  }

  // Features
  if (filters.features?.length) {
    for (const f of filters.features) {
      const label = f.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      chips.push({ key: `feature-${f}`, label, clearKeys: ['features'] });
    }
  }

  // Commute
  if (filters.commute_destination && filters.max_commute_minutes) {
    const dest = filters.commute_destination === 'tel_aviv' ? 'Tel Aviv' : 'Jerusalem';
    chips.push({ key: 'commute', label: `≤${filters.max_commute_minutes}min to ${dest}`, clearKeys: ['commute_destination', 'max_commute_minutes'] });
  }

  return chips;
}

interface ActiveFilterChipsProps {
  filters: PropertyFilters;
  onFiltersChange: (filters: PropertyFilters) => void;
  className?: string;
}

export const ActiveFilterChips = memo(function ActiveFilterChips({
  filters,
  onFiltersChange,
  className,
}: ActiveFilterChipsProps) {
  const { currency } = usePreferences();
  const chips = useMemo(() => buildChips(filters, currency), [filters, currency]);

  if (chips.length === 0) return null;

  const handleRemove = (chip: FilterChip) => {
    const updated = { ...filters };
    for (const key of chip.clearKeys) {
      (updated as any)[key] = undefined;
    }
    // Special handling: removing one feature from features array
    if (chip.key.startsWith('feature-') && filters.features) {
      const featureName = chip.key.replace('feature-', '');
      const remaining = filters.features.filter(f => f !== featureName);
      updated.features = remaining.length > 0 ? remaining : undefined;
    }
    onFiltersChange(updated);
  };

  return (
    <div className={`flex flex-wrap gap-1.5 ${className ?? ''}`}>
      {chips.map((chip) => (
        <Badge
          key={chip.key}
          variant="secondary"
          className="gap-1 pl-2 pr-1 py-0.5 text-xs font-medium cursor-pointer hover:bg-destructive/10 transition-colors"
          onClick={() => handleRemove(chip)}
        >
          {chip.label}
          <X className="h-3 w-3 text-muted-foreground" />
        </Badge>
      ))}
    </div>
  );
});
