import { Property } from '@/types/database';

export interface SmartSignal {
  text: string;
  type: 'social' | 'insight' | 'urgency';
}

/**
 * Returns the single most compelling signal for a property card.
 * Picks the highest-priority signal available from the property data.
 * This is the "Jobs principle" — one clear, interpreted signal, not clutter.
 */
export function getSmartSignal(property: Property): SmartSignal | null {
  const totalSaves = (property as any).total_saves as number | undefined;
  const viewsCount = property.views_count;
  const daysOnMarket = property.created_at
    ? Math.floor((Date.now() - new Date(property.created_at).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  // Priority 1: High saves = strong social proof
  if (totalSaves && totalSaves >= 5) {
    return { text: `Saved by ${totalSaves} buyers`, type: 'social' };
  }

  // Priority 2: High views = popular listing
  if (viewsCount && viewsCount >= 20) {
    return { text: `${viewsCount} views`, type: 'social' };
  }

  // Priority 3: Long on market = negotiation opportunity (sale only)
  if (property.listing_status === 'for_sale' && daysOnMarket !== null && daysOnMarket > 60) {
    return { text: 'On market a while — room to negotiate', type: 'insight' };
  }

  // Priority 4: Moderate saves
  if (totalSaves && totalSaves >= 2) {
    return { text: `Saved by ${totalSaves} buyers`, type: 'social' };
  }

  // Priority 5: Moderate views
  if (viewsCount && viewsCount >= 8) {
    return { text: `${viewsCount} views`, type: 'social' };
  }

  return null;
}
