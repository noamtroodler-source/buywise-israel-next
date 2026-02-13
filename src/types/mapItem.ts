import type { Property } from '@/types/database';
import type { Project } from '@/types/projects';

export type MapItem =
  | { type: 'property'; data: Property }
  | { type: 'project'; data: Project };

/**
 * Merge two sorted arrays (properties + projects) by a common sort key
 * into a single interleaved array of MapItem.
 */
export function mergeIntoMapItems(
  properties: Property[],
  projects: Project[],
  sortBy?: string,
): MapItem[] {
  const propItems: MapItem[] = properties.map(p => ({ type: 'property', data: p }));
  const projItems: MapItem[] = projects.map(p => ({ type: 'project', data: p }));
  const all = [...propItems, ...projItems];

  // Sort the merged array
  all.sort((a, b) => {
    switch (sortBy) {
      case 'price_asc':
        return getPrice(a) - getPrice(b);
      case 'price_desc':
        return getPrice(b) - getPrice(a);
      case 'newest':
      default:
        return new Date(getCreatedAt(b)).getTime() - new Date(getCreatedAt(a)).getTime();
    }
  });

  return all;
}

function getPrice(item: MapItem): number {
  if (item.type === 'property') return item.data.price ?? 0;
  return item.data.price_from ?? 0;
}

function getCreatedAt(item: MapItem): string {
  return item.data.created_at;
}

/** Get a unique ID for a MapItem */
export function getMapItemId(item: MapItem): string {
  return item.type === 'property' ? item.data.id : `project-${item.data.id}`;
}
