import { useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { MapListCard } from './MapListCard';
import { MapProjectCard } from './MapProjectCard';
import { Property, SortOption, PropertyFilters } from '@/types/database';
import { Project } from '@/types/projects';
import type { MapItem } from '@/types/mapItem';
import { ActiveFilterChips } from './ActiveFilterChips';

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: Low → High' },
  { value: 'price_desc', label: 'Price: High → Low' },
  { value: 'size_desc', label: 'Largest' },
  { value: 'rooms_desc', label: 'Most rooms' },
  { value: 'price_drop', label: 'Price drops' },
];

interface MapListPanelProps {
  items: MapItem[];
  totalCount: number;
  propertyCount?: number;
  projectCount?: number;
  isLoading: boolean;
  isFetching: boolean;
  hasNextPage: boolean;
  loadMore: () => void;
  sortBy: SortOption;
  onSortChange: (value: SortOption) => void;
  hoveredPropertyId?: string | null;
  onCardHover?: (id: string | null) => void;
  onClearFilters?: () => void;
  filters?: PropertyFilters;
  onFiltersChange?: (filters: PropertyFilters) => void;
}

function CardSkeleton() {
  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <Skeleton className="aspect-[16/10] w-full rounded-none" />
      <div className="p-3 space-y-2">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
  );
}

export function MapListPanel({
  items,
  totalCount,
  propertyCount,
  projectCount,
  isLoading,
  isFetching,
  hasNextPage,
  loadMore,
  sortBy,
  onSortChange,
  hoveredPropertyId,
  onCardHover,
  onClearFilters,
  filters,
  onFiltersChange,
}: MapListPanelProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  useEffect(() => {
    if (!hoveredPropertyId) return;
    const el = cardRefs.current.get(hoveredPropertyId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [hoveredPropertyId]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) loadMore();
      },
      { rootMargin: '200px' }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore]);

  const showEmpty = !isLoading && items.length === 0;

  return (
    <div className="hidden lg:flex flex-col border-l border-border bg-background min-h-0">
      {isFetching && !isLoading && (
        <Progress value={undefined} className="h-0.5 w-full rounded-none shrink-0" />
      )}

      <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-foreground">
            {totalCount.toLocaleString()} results
          </span>
          {propertyCount != null && projectCount != null && projectCount > 0 && (
            <span className="text-xs text-muted-foreground">
              {propertyCount.toLocaleString()} properties · {projectCount.toLocaleString()} projects
            </span>
          )}
        </div>
        <Select value={sortBy} onValueChange={(v) => onSortChange(v as SortOption)}>
          <SelectTrigger className="w-[150px] h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value} className="text-xs">
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filters && onFiltersChange && (
        <div className="shrink-0 px-4 pt-2">
          <ActiveFilterChips filters={filters} onFiltersChange={onFiltersChange} />
        </div>
      )}

      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-4 p-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : showEmpty ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[400px] px-6 text-center">
            <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-4">
              <Search className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground mb-1">No properties found</p>
            <p className="text-xs text-muted-foreground max-w-[260px] mb-4">
              Try zooming out, removing filters, or searching a different area.
            </p>
            {onClearFilters && (
              <Button variant="outline" size="sm" onClick={onClearFilters} className="gap-1.5">
                <X className="h-3.5 w-3.5" />
                Clear filters
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 p-4">
            {items.map((item) => {
              if (item.type === 'project') {
                const project = item.data as Project;
                const itemId = `project-${project.id}`;
                return (
                  <div
                    key={itemId}
                    ref={(el) => {
                      if (el) cardRefs.current.set(itemId, el);
                      else cardRefs.current.delete(itemId);
                    }}
                  >
                    <MapProjectCard
                      project={project}
                      isHovered={hoveredPropertyId === itemId}
                      onHover={() => onCardHover?.(itemId)}
                      onHoverEnd={() => onCardHover?.(null)}
                    />
                  </div>
                );
              }
              const property = item.data as Property;
              return (
                <div
                  key={property.id}
                  ref={(el) => {
                    if (el) cardRefs.current.set(property.id, el);
                    else cardRefs.current.delete(property.id);
                  }}
                >
                  <MapListCard
                    property={property}
                    isHovered={hoveredPropertyId === property.id}
                    onHover={() => onCardHover?.(property.id)}
                    onHoverEnd={() => onCardHover?.(null)}
                  />
                </div>
              );
            })}
            {hasNextPage && <div ref={sentinelRef} className="col-span-2 h-1" />}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
