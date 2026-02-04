import { useMemo } from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import angloSpotsData from '@/data/anglo-spots.json';

type AngloCategory = 
  | 'synagogue' 
  | 'supermarket' 
  | 'community_center' 
  | 'park' 
  | 'cafe' 
  | 'restaurant' 
  | 'school' 
  | 'medical' 
  | 'fitness';

interface AngloSpot {
  name: string;
  name_he: string;
  category: AngloCategory;
  address: string;
  lat: number;
  lng: number;
  description: string;
}

interface CitySpots {
  city: string;
  spots: AngloSpot[];
}

// Flatten the data into a single array with city info
const ALL_ANGLO_SPOTS: (AngloSpot & { city: string })[] = (angloSpotsData as CitySpots[]).flatMap(
  cityData => cityData.spots.map(spot => ({ ...spot, city: cityData.city }))
);

// Icon creation based on category
function createAngloSpotIcon(category: AngloCategory): L.DivIcon {
  const iconMap: Record<AngloCategory, string> = {
    synagogue: '🕍',
    supermarket: '🛒',
    community_center: '🏛️',
    park: '🌳',
    cafe: '☕',
    restaurant: '🍽️',
    school: '🏫',
    medical: '🏥',
    fitness: '💪',
  };
  
  const colorMap: Record<AngloCategory, string> = {
    synagogue: 'hsl(270, 60%, 50%)',
    supermarket: 'hsl(145, 60%, 40%)',
    community_center: 'hsl(175, 70%, 40%)',
    park: 'hsl(120, 50%, 45%)',
    cafe: 'hsl(30, 70%, 50%)',
    restaurant: 'hsl(0, 65%, 50%)',
    school: 'hsl(35, 90%, 50%)',
    medical: 'hsl(200, 70%, 50%)',
    fitness: 'hsl(320, 60%, 50%)',
  };
  
  return L.divIcon({
    html: `
      <div class="anglo-poi-marker" style="background: ${colorMap[category]};">
        <span style="font-size: 14px;">${iconMap[category]}</span>
      </div>
    `,
    className: '',
    iconSize: L.point(32, 32),
    iconAnchor: L.point(16, 16),
  });
}

// Format category for display
function formatCategory(category: AngloCategory): string {
  const labels: Record<AngloCategory, string> = {
    synagogue: 'Synagogue',
    supermarket: 'Supermarket',
    community_center: 'Community Center',
    park: 'Park',
    cafe: 'Café',
    restaurant: 'Restaurant',
    school: 'School',
    medical: 'Medical',
    fitness: 'Fitness',
  };
  return labels[category];
}

interface AngloCommunityLayerProps {
  visible: boolean;
  currentCity?: string | null;
}

export function AngloCommunityLayer({ visible, currentCity }: AngloCommunityLayerProps) {
  const filteredSpots = useMemo(() => {
    if (!visible) return [];
    
    // If a city is selected, filter to that city; otherwise show all
    if (currentCity) {
      return ALL_ANGLO_SPOTS.filter(
        spot => spot.city.toLowerCase() === currentCity.toLowerCase()
      );
    }
    return ALL_ANGLO_SPOTS;
  }, [visible, currentCity]);

  if (!visible || filteredSpots.length === 0) return null;

  return (
    <>
      {filteredSpots.map((spot, index) => (
        <Marker
          key={`${spot.city}-${spot.name}-${index}`}
          position={[spot.lat, spot.lng]}
          icon={createAngloSpotIcon(spot.category)}
        >
          <Popup>
            <div className="p-2 min-w-[200px]">
              <h4 className="font-semibold text-sm mb-0.5">{spot.name}</h4>
              <p className="text-xs text-muted-foreground mb-1" dir="rtl">{spot.name_he}</p>
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className="text-xs px-1.5 py-0.5 bg-muted rounded">
                  {formatCategory(spot.category)}
                </span>
                <span className="text-xs text-muted-foreground">•</span>
                <span className="text-xs text-muted-foreground">{spot.city}</span>
              </div>
              <p className="text-xs leading-relaxed">{spot.description}</p>
              {spot.address && (
                <p className="text-xs text-muted-foreground mt-1.5">📍 {spot.address}</p>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  );
}
