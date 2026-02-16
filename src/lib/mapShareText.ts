/**
 * Build a human-readable description of the current map search from URL params.
 */
export function buildMapShareText(params: URLSearchParams): string {
  const parts: string[] = [];

  // Rooms
  const minRooms = params.get('min_rooms');
  if (minRooms) parts.push(`${minRooms}+ bed`);

  // Status
  const status = params.get('status');
  if (status === 'for_rent') {
    parts.push('rentals');
  } else if (status === 'projects') {
    parts.push('new projects');
  } else {
    parts.push('properties for sale');
  }

  // City
  const city = params.get('city');
  if (city) parts.push(`in ${city}`);

  // Price
  const minPrice = params.get('min_price');
  const maxPrice = params.get('max_price');
  if (minPrice || maxPrice) {
    const fmt = (v: string) => {
      const n = Number(v);
      if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
      if (n >= 1_000) return `${(n / 1_000).toFixed(n % 1_000 === 0 ? 0 : 1)}K`;
      return v;
    };
    if (minPrice && maxPrice) {
      parts.push(`${fmt(minPrice)}-${fmt(maxPrice)}`);
    } else if (minPrice) {
      parts.push(`from ${fmt(minPrice)}`);
    } else if (maxPrice) {
      parts.push(`up to ${fmt(maxPrice)}`);
    }
  }

  if (parts.length <= 1 && !city) {
    return 'Property search on BuyWise Israel';
  }

  return parts.join(' ') + ' | BuyWise Israel';
}
