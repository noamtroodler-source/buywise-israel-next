export type LocationIcon = 'home' | 'briefcase' | 'heart' | 'star' | 'building';

export interface SavedLocation {
  id: string;
  label: string;
  address: string;
  latitude: number;
  longitude: number;
  icon: LocationIcon;
  created_at: string;
}

export const LOCATION_ICONS: { value: LocationIcon; label: string; emoji: string }[] = [
  { value: 'home', label: 'Home', emoji: '🏠' },
  { value: 'briefcase', label: 'Work', emoji: '💼' },
  { value: 'heart', label: 'Family', emoji: '❤️' },
  { value: 'star', label: 'Favorite', emoji: '⭐' },
  { value: 'building', label: 'Place', emoji: '🏢' },
];

export const MAX_SAVED_LOCATIONS = 5;

export function getIconEmoji(icon: LocationIcon): string {
  return LOCATION_ICONS.find(i => i.value === icon)?.emoji || '📍';
}

export function suggestIconFromLabel(label: string): LocationIcon {
  const lower = label.toLowerCase();
  
  if (['mom', 'dad', 'parent', 'family', 'home', 'house'].some(k => lower.includes(k))) {
    return 'home';
  }
  if (['work', 'office', 'job', 'company'].some(k => lower.includes(k))) {
    return 'briefcase';
  }
  if (['love', 'partner', 'spouse', 'wife', 'husband', 'boyfriend', 'girlfriend'].some(k => lower.includes(k))) {
    return 'heart';
  }
  if (['gym', 'synagogue', 'shul', 'church', 'mosque', 'school', 'favorite'].some(k => lower.includes(k))) {
    return 'star';
  }
  
  return 'building';
}
