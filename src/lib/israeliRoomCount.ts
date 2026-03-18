/**
 * Converts BuyWise's split room fields into the Israeli government standard room count.
 *
 * Israeli government data (CBS, Nadlan.gov.il, sold_transactions, city_price_history,
 * neighborhood_price_history) counts ALL rooms — bedrooms + living room + office + mamad, etc.
 *
 * BuyWise stores:
 *   - `bedrooms` = sleeping bedrooms only (e.g. 4)
 *   - `additional_rooms` = living room, mamad, office, etc. (e.g. 2)
 *
 * So a "4-bedroom + 2 additional" BuyWise listing = 6-room in government terms.
 *
 * If `additional_rooms` is null/0 (older listings), falls back to bedrooms alone.
 */
export function getIsraeliRoomCount(
  bedrooms: number | null,
  additionalRooms?: number | null
): number | null {
  if (bedrooms == null) return null;
  return bedrooms + (additionalRooms || 0);
}
