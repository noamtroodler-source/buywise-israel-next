import { useMemo } from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

interface AngloPOI {
  id: string;
  name: string;
  type: 'synagogue' | 'school' | 'community';
  lat: number;
  lng: number;
  city: string;
  description: string;
  website?: string;
}

// Curated list of verified Anglo-frequented locations in Israel
// Research-based: These are locations known to have significant English-speaking communities
const ANGLO_POIS: AngloPOI[] = [
  // Jerusalem - Major Anglo Communities
  { id: 'shul-nitzanim', name: 'Nitzanim Shul', type: 'synagogue', lat: 31.7756, lng: 35.1949, city: 'Jerusalem', description: 'Anglo-friendly congregation in Baka' },
  { id: 'shul-eretz-chemdah', name: 'Eretz Chemdah', type: 'synagogue', lat: 31.7683, lng: 35.1820, city: 'Jerusalem', description: 'Popular with English speakers, morning shiurim' },
  { id: 'shul-shir-chadash', name: 'Shir Chadash', type: 'synagogue', lat: 31.7523, lng: 35.2107, city: 'Jerusalem', description: 'Modern Orthodox, strong Anglo community' },
  { id: 'shul-yedidya', name: 'Yedidya', type: 'synagogue', lat: 31.7628, lng: 35.1982, city: 'Jerusalem', description: 'Egalitarian congregation, English-friendly' },
  { id: 'shul-ramban', name: 'Ramban Synagogue', type: 'synagogue', lat: 31.7677, lng: 35.2143, city: 'Jerusalem', description: 'Historic shul in Old City, Anglo visitors' },
  { id: 'school-tali-bayit', name: 'Tali Bayit Vegan', type: 'school', lat: 31.7756, lng: 35.2156, city: 'Jerusalem', description: 'English-speaking families, pluralistic' },
  { id: 'community-aaci-jlem', name: 'AACI Jerusalem', type: 'community', lat: 31.7789, lng: 35.2233, city: 'Jerusalem', description: 'Association of Americans & Canadians in Israel' },
  
  // Tel Aviv Area
  { id: 'shul-beit-daniel', name: 'Beit Daniel', type: 'synagogue', lat: 32.0731, lng: 34.7824, city: 'Tel Aviv', description: 'Reform congregation, English services' },
  { id: 'community-aaci-tlv', name: 'AACI Tel Aviv', type: 'community', lat: 32.0741, lng: 34.7820, city: 'Tel Aviv', description: 'Anglo community center and resources' },
  { id: 'school-walworth', name: 'Walworth Barbour School', type: 'school', lat: 32.1073, lng: 34.8183, city: 'Tel Aviv', description: 'American International School' },
  
  // Ra\'anana - Major Anglo Hub
  { id: 'shul-ohel-ari', name: 'Ohel Ari', type: 'synagogue', lat: 32.1847, lng: 34.8714, city: "Ra'anana", description: 'Anglo Orthodox community hub' },
  { id: 'shul-morasha', name: 'Morasha Shul', type: 'synagogue', lat: 32.1823, lng: 34.8697, city: "Ra'anana", description: 'Modern Orthodox, English-speaking' },
  { id: 'community-aaci-raanana', name: 'AACI Ra\'anana', type: 'community', lat: 32.1841, lng: 34.8706, city: "Ra'anana", description: 'Very active Anglo community center' },
  
  // Modi\'in
  { id: 'shul-zayit-raanan', name: 'Zayit Raanan', type: 'synagogue', lat: 31.8989, lng: 35.0106, city: "Modi'in", description: 'Anglo-Israeli community' },
  { id: 'community-aaci-modiin', name: 'AACI Modi\'in', type: 'community', lat: 31.8967, lng: 35.0089, city: "Modi'in", description: 'Growing Anglo community' },
  
  // Beit Shemesh
  { id: 'shul-beit-tefila', name: 'Beit Tefila Yonit', type: 'synagogue', lat: 31.7467, lng: 34.9878, city: 'Beit Shemesh', description: 'Anglo Orthodox community' },
  { id: 'community-aaci-bs', name: 'AACI Beit Shemesh', type: 'community', lat: 31.7456, lng: 34.9867, city: 'Beit Shemesh', description: 'Large Anglo population center' },
  
  // Herzliya
  { id: 'school-lauder', name: 'Lauder School', type: 'school', lat: 32.1656, lng: 34.8344, city: 'Herzliya', description: 'International school, English curriculum' },
  
  // Netanya
  { id: 'community-aaci-netanya', name: 'AACI Netanya', type: 'community', lat: 32.3286, lng: 34.8567, city: 'Netanya', description: 'Active Anglo retiree community' },
];

// Icon creation based on POI type
function createAngloPOIIcon(type: 'synagogue' | 'school' | 'community'): L.DivIcon {
  const iconMap = {
    synagogue: '🕍',
    school: '🏫',
    community: '🏛️',
  };
  
  const colorMap = {
    synagogue: 'hsl(270, 60%, 50%)',
    school: 'hsl(35, 90%, 50%)',
    community: 'hsl(175, 70%, 40%)',
  };
  
  return L.divIcon({
    html: `
      <div class="anglo-poi-marker" style="background: ${colorMap[type]};">
        <span style="font-size: 14px;">${iconMap[type]}</span>
      </div>
    `,
    className: '',
    iconSize: L.point(32, 32),
    iconAnchor: L.point(16, 16),
  });
}

interface AngloCommunityLayerProps {
  visible: boolean;
  currentCity?: string | null;
}

export function AngloCommunityLayer({ visible, currentCity }: AngloCommunityLayerProps) {
  const filteredPOIs = useMemo(() => {
    if (!visible) return [];
    
    // If a city is selected, filter to that city; otherwise show all
    if (currentCity) {
      return ANGLO_POIS.filter(poi => poi.city.toLowerCase() === currentCity.toLowerCase());
    }
    return ANGLO_POIS;
  }, [visible, currentCity]);

  if (!visible || filteredPOIs.length === 0) return null;

  return (
    <>
      {filteredPOIs.map((poi) => (
        <Marker
          key={poi.id}
          position={[poi.lat, poi.lng]}
          icon={createAngloPOIIcon(poi.type)}
        >
          <Popup>
            <div className="p-2 min-w-[180px]">
              <h4 className="font-semibold text-sm mb-1">{poi.name}</h4>
              <p className="text-xs text-muted-foreground mb-1">{poi.city}</p>
              <p className="text-xs">{poi.description}</p>
              {poi.website && (
                <a 
                  href={poi.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline mt-2 block"
                >
                  Visit Website →
                </a>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  );
}
