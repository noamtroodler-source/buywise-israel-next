import { useState, useEffect, useRef, useCallback } from 'react';
import { Drawer as DrawerPrimitive } from 'vaul';
import { MapPin } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { MobileCardCarousel } from './MobileCardCarousel';
import { MapListCard } from './MapListCard';
import { MapProjectCard } from './MapProjectCard';
import { Property, SortOption } from '@/types/database';
import { Project } from '@/types/projects';
import type { MapItem } from '@/types/mapItem';

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price ↑' },
  { value: 'price_desc', label: 'Price ↓' },
  { value: 'size_desc', label: 'Largest' },
  { value: 'rooms_desc', label: 'Most rooms' },
  { value: 'price_drop', label: 'Price drops' },
];

const SNAP_POINTS = ['148px', '50%', 1] as const;

interface MobileMapSheetProps {
  items: MapItem[];
  totalCount: number;
  isLoading: boolean;
  isFetching?: boolean;
  hasNextPage: boolean;
  loadMore: () => void;
  sortBy: SortOption;
  onSortChange: (value: SortOption) => void;
  hoveredPropertyId?: string | null;
  onCardHover?: (id: string | null) => void;
  activeSnap: string | number | null;
  onSnapChange: (snap: string | number | null) => void;
}

export function MobileMapSheet({
  items,
  totalCount,
  isLoading,
  isFetching = false,
  hasNextPage,
  loadMore,
  sortBy,
  onSortChange,
  hoveredPropertyId,
  onCardHover,
  activeSnap,
  onSnapChange,
}: MobileMapSheetProps) {
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
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) loadMore(); },
      { rootMargin: '200px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore]);

  const isPeek = activeSnap === SNAP_POINTS[0];
  const showList = !isPeek;

  return (
    <DrawerPrimitive.Root
      open
      modal={false}
      snapPoints={SNAP_POINTS as any}
      activeSnapPoint={activeSnap}
      setActiveSnapPoint={onSnapChange as any}
      shouldScaleBackground={false}
    >
      <DrawerPrimitive.Portal>
        <DrawerPrimitive.Content
          className="fixed inset-x-0 bottom-0 z-[42] flex flex-col rounded-t-xl border-t border-border bg-background shadow-lg"
          style={{ maxHeight: '100dvh' }}
        >
          <div className="flex justify-center pt-2 pb-1">
            <div className="h-1.5 w-10 rounded-full bg-muted" />
          </div>

          {isFetching && !isLoading && (
            <Progress className="h-0.5 rounded-none" indicatorClassName="bg-primary" />
          )}

          <div className="flex items-center justify-between px-4 pb-2">
            <span className="text-sm font-semibold text-foreground">
              {totalCount.toLocaleString()} results
            </span>
            {showList && (
              <Select value={sortBy} onValueChange={(v) => onSortChange(v as SortOption)}>
                <SelectTrigger className="w-[120px] h-7 text-xs">
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
            )}
          </div>

          {isPeek && <MobileCardCarousel items={items} />}

          {showList && (
            <div className="flex-1 overflow-y-auto px-4 pb-4">
              {isLoading ? (
                <div className="grid grid-cols-1 gap-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-28 w-full rounded-lg" />
                  ))}
                </div>
              ) : items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <MapPin className="h-8 w-8 text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground">No properties in this area</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
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
                  {hasNextPage && <div ref={sentinelRef} className="h-1" />}
                </div>
              )}
            </div>
          )}
        </DrawerPrimitive.Content>
      </DrawerPrimitive.Portal>
    </DrawerPrimitive.Root>
  );
}
