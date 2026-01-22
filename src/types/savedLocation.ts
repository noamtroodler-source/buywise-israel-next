import { Home, Briefcase, Heart, Star, Building2, LucideIcon } from 'lucide-react';

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

export const LOCATION_ICONS: { value: LocationIcon; label: string; Icon: LucideIcon }[] = [
  { value: 'home', label: 'Home', Icon: Home },
  { value: 'briefcase', label: 'Work', Icon: Briefcase },
  { value: 'heart', label: 'Family', Icon: Heart },
  { value: 'star', label: 'Favorite', Icon: Star },
  { value: 'building', label: 'Place', Icon: Building2 },
];

export const MAX_SAVED_LOCATIONS = 5;

export function getLocationIcon(icon: LocationIcon): LucideIcon {
  return LOCATION_ICONS.find(i => i.value === icon)?.Icon || Building2;
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
