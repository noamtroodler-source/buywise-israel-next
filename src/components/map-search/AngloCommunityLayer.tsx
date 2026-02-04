import { useMemo } from 'react';
import { Marker, Popup, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import { renderToString } from 'react-dom/server';
import { 
  ShoppingCart, 
  Users, 
  Trees, 
  Coffee, 
  UtensilsCrossed, 
  GraduationCap, 
  Stethoscope, 
  Dumbbell 
} from 'lucide-react';
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

// Star of David SVG path for synagogue icon
const StarOfDavidIcon = () => (
  <svg 
    width="14" 
    height="14" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <polygon points="12 2 22 20 2 20" />
    <polygon points="12 22 2 4 22 4" />
  </svg>
);

// Get the appropriate icon component for each category
function getCategoryIcon(category: AngloCategory): React.ReactNode {
  const iconProps = { size: 14, strokeWidth: 2 };
  
  switch (category) {
    case 'synagogue':
      return <StarOfDavidIcon />;
    case 'supermarket':
      return <ShoppingCart {...iconProps} />;
    case 'community_center':
      return <Users {...iconProps} />;
    case 'park':
      return <Trees {...iconProps} />;
    case 'cafe':
      return <Coffee {...iconProps} />;
    case 'restaurant':
      return <UtensilsCrossed {...iconProps} />;
    case 'school':
      return <GraduationCap {...iconProps} />;
    case 'medical':
      return <Stethoscope {...iconProps} />;
    case 'fitness':
      return <Dumbbell {...iconProps} />;
    default:
      return <Users {...iconProps} />;
  }
}

// Icon creation based on category using Lucide icons
function createAngloSpotIcon(category: AngloCategory): L.DivIcon {
  const iconHtml = renderToString(getCategoryIcon(category));
  
  return L.divIcon({
    html: `<div class="anglo-poi-marker">${iconHtml}</div>`,
    className: '',
    iconSize: L.point(28, 28),
    iconAnchor: L.point(14, 14),
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
          <Tooltip 
            direction="top" 
            offset={[0, -16]}
            className="anglo-spot-tooltip"
          >
            <span className="font-medium text-xs">{spot.name}</span>
          </Tooltip>
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
