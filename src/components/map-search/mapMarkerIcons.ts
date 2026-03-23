/**
 * Branded SVG map marker icons for all map layers.
 * Uses BuyWise Israel brand palette with clean, professional pin markers.
 */

// Brand-aligned category colors
export const MARKER_COLORS = {
  train: '#0472E6',      // Brand primary blue
  saved_home: '#7c3aed', // Purple
  saved_work: '#0472E6', // Brand primary
  saved_heart: '#e11d48', // Rose
  saved_star: '#d97706', // Amber
  saved_default: '#6b7280', // Gray
  shul: '#be185d',       // Rose/magenta
  school: '#d97706',     // Amber
  medical: '#dc2626',    // Red
  mikveh: '#7c3aed',     // Violet
  grocery: '#059669',    // Emerald
  community: '#0472E6',  // Brand primary
  landmark: '#0472E6',   // Brand primary
  supermarket: '#059669', // Emerald
  anchor_default: '#6b7280',
} as const;

// SVG path data for each icon category (16×16 viewBox)
const ICON_PATHS: Record<string, string> = {
  train: 'M11 1H5a3 3 0 00-3 3v7a3 3 0 003 3l-1 2h1l1-1.5h4L11 16h1l-1-2a3 3 0 003-3V4a3 3 0 00-3-3zM5 2.5h6A1.5 1.5 0 0112.5 4v3h-9V4A1.5 1.5 0 015 2.5zM3.5 11V8.5h9V11a1.5 1.5 0 01-1.5 1.5H5A1.5 1.5 0 013.5 11zm2 .25a.75.75 0 100 1.5.75.75 0 000-1.5zm5 0a.75.75 0 100 1.5.75.75 0 000-1.5z',
  shul: 'M8 1L3 5v1h1v6H3v1h10v-1h-1V6h1V5L8 1zm0 2l3 2.2V6H5v-.8L8 3zM5.5 7h2v2h-2V7zm3 0h2v2h-2V7zM7 10h2v3H7v-3z',
  school: 'M8 1L1 4.5 8 8l5.5-2.75V10h1V4.5L8 1zM3 6.25v3.5L8 12.5l5-2.75V6.25L8 9 3 6.25z',
  medical: 'M6 2v4H2v4h4v4h4v-4h4V6h-4V2H6z',
  mikveh: 'M2 10c1-2 2-3 3-3s2 1 3 3c1-2 2-3 3-3s2 1 3 3M2 13c1-2 2-3 3-3s2 1 3 3c1-2 2-3 3-3s2 1 3 3M4 3v4M8 1v6M12 3v4',
  grocery: 'M1 1h2l1.5 8h7L14 3H4M6.5 12.5a1 1 0 11-2 0 1 1 0 012 0zM12.5 12.5a1 1 0 11-2 0 1 1 0 012 0z',
  heart: 'M8 14s-5.5-3.5-5.5-7A3 3 0 018 4.5 3 3 0 0113.5 7C13.5 10.5 8 14 8 14z',
  star: 'M8 1l2.2 4.5L15 6.2l-3.5 3.4.8 4.9L8 12.1 3.7 14.5l.8-4.9L1 6.2l4.8-.7L8 1z',
  home: 'M8 1L1 7h2v6h4V9h2v4h4V7h2L8 1z',
  briefcase: 'M6 3V2a1 1 0 011-1h2a1 1 0 011 1v1h3a1 1 0 011 1v3H2V4a1 1 0 011-1h3zm0 0h4M2 8v4a1 1 0 001 1h10a1 1 0 001-1V8',
  building: 'M3 14V3a1 1 0 011-1h8a1 1 0 011 1v11M5 4h2M5 7h2M5 10h2M9 4h2M9 7h2M9 10h2M7 14v-3h2v3',
  landmark: 'M8 1l-1 3H3l4 3-1.5 4L8 9l2.5 2L9 7l4-3H9L8 1z',
};

/**
 * Creates a branded SVG pin marker as a data URL.
 * Clean circle with white icon inside, plus subtle drop shadow.
 */
function createPinSvg(color: string, iconPath: string, isStroke = false): string {
  const iconRendering = isStroke
    ? `<path d="${iconPath}" fill="none" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" transform="translate(7,6.5) scale(1.125)"/>`
    : `<path d="${iconPath}" fill="white" transform="translate(7,6.5) scale(1.125)"/>`;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
    <defs>
      <filter id="s" x="-20%" y="-10%" width="140%" height="150%">
        <feDropShadow dx="0" dy="1" stdDeviation="1.5" flood-color="#000" flood-opacity="0.2"/>
      </filter>
    </defs>
    <circle cx="16" cy="15" r="13" fill="${color}" stroke="white" stroke-width="2" filter="url(#s)"/>
    ${iconRendering}
  </svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

// Stroke-based icons (paths designed as strokes, not fills)
const STROKE_ICONS = new Set(['mikveh', 'grocery', 'briefcase']);

/** Get a branded marker icon config for Google Maps */
export function getBrandedMarkerIcon(
  category: string,
  scale = 1,
): google.maps.Icon {
  const color = (MARKER_COLORS as Record<string, string>)[category] || MARKER_COLORS.anchor_default;
  const iconPath = ICON_PATHS[category] || ICON_PATHS.building;
  const isStroke = STROKE_ICONS.has(category);
  const size = Math.round(32 * scale);

  return {
    url: createPinSvg(color, iconPath, isStroke),
    scaledSize: new google.maps.Size(size, size),
    anchor: new google.maps.Point(size / 2, size / 2),
  };
}

/** Get saved location marker icon based on icon type */
export function getSavedLocationMarkerIcon(iconType: string): google.maps.Icon {
  const colorKey = `saved_${iconType}` as keyof typeof MARKER_COLORS;
  const color = MARKER_COLORS[colorKey] || MARKER_COLORS.saved_default;
  const iconPath = ICON_PATHS[iconType] || ICON_PATHS.building;
  const isStroke = STROKE_ICONS.has(iconType);

  return {
    url: createPinSvg(color, iconPath, isStroke),
    scaledSize: new google.maps.Size(32, 32),
    anchor: new google.maps.Point(16, 16),
  };
}

/** Get train station marker icon */
export function getTrainMarkerIcon(): google.maps.Icon {
  return getBrandedMarkerIcon('train');
}

/** Category color for LayersMenu indicators */
export function getLayerColor(layerId: string): string {
  const map: Record<string, string> = {
    trains: MARKER_COLORS.train,
    saved: MARKER_COLORS.saved_heart,
    shuls: MARKER_COLORS.shul,
    schools: MARKER_COLORS.school,
    medical: MARKER_COLORS.medical,
    mikvehs: MARKER_COLORS.mikveh,
    grocery: MARKER_COLORS.grocery,
  };
  return map[layerId] || MARKER_COLORS.anchor_default;
}
