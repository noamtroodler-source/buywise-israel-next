import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from '@/vendor/react-leaflet';
import { DivIcon } from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface POIMarker {
  category: string;
  name: string;
  lat: number;
  lng: number;
}

interface PropertyMiniMapProps {
  latitude: number;
  longitude: number;
  propertyTitle?: string;
  nearbyPOIs?: POIMarker[];
}

const categoryColors: Record<string, string> = {
  'Synagogues': 'hsl(270, 70%, 55%)',
  'Schools': 'hsl(38, 95%, 55%)',
  'Shopping': 'hsl(160, 65%, 45%)',
  'Transport': 'hsl(210, 80%, 55%)',
  'Healthcare': 'hsl(0, 80%, 55%)',
  'Parks & Recreation': 'hsl(142, 70%, 45%)',
  'Landmark': 'hsl(199, 89%, 48%)',
  'Saved': 'hsl(270, 95%, 60%)',
  'Searched': 'hsl(38, 92%, 50%)',
};

export function PropertyMiniMap({ 
  latitude, 
  longitude, 
  propertyTitle = 'Property',
  nearbyPOIs = []
}: PropertyMiniMapProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Don't render on server or before mount to avoid hydration issues
  if (!isClient) {
    return null;
  }

  // Property marker - larger, primary color
  const propertyIcon = new DivIcon({
    className: 'property-marker',
    html: `
      <div style="
        width: 32px;
        height: 32px;
        background: hsl(213, 94%, 45%);
        border-radius: 50%;
        border: 2px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
          <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
        </svg>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
  });

  // POI markers - smaller, category-colored
  const getPOIIcon = (category: string) => {
    const color = categoryColors[category] || 'hsl(220, 10%, 50%)';
    
    return new DivIcon({
      className: 'poi-marker',
      html: `
        <div style="
          width: 20px;
          height: 20px;
          background: ${color};
          border-radius: 50%;
          border: 2px solid white;
          box-shadow: 0 1px 4px rgba(0,0,0,0.25);
        "></div>
      `,
      iconSize: [20, 20],
      iconAnchor: [10, 20],
    });
  };

  return (
    <div className="relative rounded-xl overflow-hidden border border-border h-[200px] sm:h-[240px]">
      <MapContainer
        key={`${latitude}-${longitude}`}
        center={[latitude, longitude]}
        zoom={15}
        scrollWheelZoom={false}
        className="h-full w-full z-0"
        zoomControl={false}
        attributionControl={true}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        
        {/* Property Marker */}
        <Marker position={[latitude, longitude]} icon={propertyIcon}>
          <Popup>
            <span className="font-medium">{propertyTitle}</span>
          </Popup>
        </Marker>
        
        {/* POI Markers */}
        {nearbyPOIs.map((poi, index) => (
          <Marker 
            key={index} 
            position={[poi.lat, poi.lng]} 
            icon={getPOIIcon(poi.category)}
          >
            <Popup>
              <div>
                <strong className="block">{poi.name}</strong>
                <span className="text-xs text-muted-foreground">{poi.category}</span>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      
      {/* Subtle overlay gradient at bottom for attribution readability */}
      <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-black/10 to-transparent pointer-events-none" />
    </div>
  );
}
