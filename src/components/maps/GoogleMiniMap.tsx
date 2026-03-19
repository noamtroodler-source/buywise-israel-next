import { useCallback, useState, useEffect, useRef } from 'react';
import { GoogleMap, Marker, InfoWindow } from '@react-google-maps/api';
import { useGoogleMaps } from './GoogleMapsProvider';
import { MapPin, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MapInfoCard } from '@/components/map-search/MapInfoCard';

interface POIMarker {
  category: string;
  name: string;
  lat: number;
  lng: number;
}

interface GoogleMiniMapProps {
  latitude: number;
  longitude: number;
  propertyTitle?: string;
  nearbyPOIs?: POIMarker[];
  draggable?: boolean;
  onPositionChange?: (lat: number, lng: number) => void;
  onError?: () => void;
}

const categoryColors: Record<string, string> = {
  'Synagogues': '#8b5cf6',
  'Schools': '#f59e0b',
  'Shopping': '#10b981',
  'Transport': '#3b82f6',
  'Healthcare': '#ef4444',
  'Parks & Recreation': '#22c55e',
  'Landmark': '#0ea5e9',
  'Saved': '#a855f7',
  'Searched': '#f59e0b',
};

const mapStyles = [
  {
    featureType: 'poi',
    elementType: 'labels',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'transit',
    elementType: 'labels',
    stylers: [{ visibility: 'simplified' }],
  },
];

const containerStyle = {
  width: '100%',
  height: '100%',
};

export function GoogleMiniMap({
  latitude,
  longitude,
  propertyTitle = 'Property',
  nearbyPOIs = [],
  draggable = false,
  onPositionChange,
  onError,
}: GoogleMiniMapProps) {
  const { isLoaded, loadError } = useGoogleMaps();
  const [selectedPOI, setSelectedPOI] = useState<POIMarker | null>(null);
  const [markerPosition, setMarkerPosition] = useState({ lat: latitude, lng: longitude });
  const [mapLoaded, setMapLoaded] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const center = { lat: latitude, lng: longitude };

  // Timeout: if map doesn't fire onLoad within 5s, trigger error fallback
  useEffect(() => {
    if (isLoaded && !loadError && !mapLoaded) {
      timeoutRef.current = setTimeout(() => {
        if (!mapLoaded) {
          console.warn('Google Map failed to load within timeout');
          onError?.();
        }
      }, 5000);
    }
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [isLoaded, loadError, mapLoaded, onError]);

  // If context reports error (e.g. auth failure), propagate immediately
  useEffect(() => {
    if (loadError) {
      onError?.();
    }
  }, [loadError, onError]);

  const handleMapLoad = useCallback(() => {
    setMapLoaded(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  const handleMarkerDragEnd = useCallback((e: google.maps.MapMouseEvent) => {
    if (e.latLng && onPositionChange) {
      const newLat = e.latLng.lat();
      const newLng = e.latLng.lng();
      setMarkerPosition({ lat: newLat, lng: newLng });
      onPositionChange(newLat, newLng);
    }
  }, [onPositionChange]);

  const openGoogleMaps = () => {
    window.open(
      `https://www.google.com/maps/search/?api=1&query=${markerPosition.lat},${markerPosition.lng}`,
      '_blank'
    );
  };

  if (loadError || !isLoaded) {
    return (
      <div className="relative rounded-xl overflow-hidden border border-border h-[200px] sm:h-[240px] bg-muted flex items-center justify-center">
        <div className="text-center space-y-3">
          <MapPin className="h-8 w-8 mx-auto text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            {loadError ? 'Map unavailable' : 'Loading map...'}
          </p>
          <Button variant="outline" size="sm" onClick={openGoogleMaps} className="gap-2">
            <ExternalLink className="h-4 w-4" />
            View on Google Maps
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative rounded-xl overflow-hidden border border-border h-[200px] sm:h-[240px]">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={15}
        onLoad={handleMapLoad}
        options={{
          styles: mapStyles,
          disableDefaultUI: true,
          zoomControl: true,
          scrollwheel: false,
          gestureHandling: draggable ? 'cooperative' : 'none',
        }}
      >
        <Marker
          position={markerPosition}
          draggable={draggable}
          onDragEnd={handleMarkerDragEnd}
          icon={{
            path: google.maps.SymbolPath.CIRCLE,
            scale: 12,
            fillColor: '#2563eb',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2,
          }}
          title={propertyTitle}
        />

        {nearbyPOIs.map((poi, index) => (
          <Marker
            key={index}
            position={{ lat: poi.lat, lng: poi.lng }}
            onClick={() => setSelectedPOI(poi)}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: categoryColors[poi.category] || '#6b7280',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 2,
            }}
          />
        ))}

        {selectedPOI && (
          <InfoWindow
            position={{ lat: selectedPOI.lat, lng: selectedPOI.lng }}
            onCloseClick={() => setSelectedPOI(null)}
          >
            <MapInfoCard
              name={selectedPOI.name}
              subtitle={selectedPOI.category}
            />
          </InfoWindow>
        )}
      </GoogleMap>

      <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-black/10 to-transparent pointer-events-none" />
      
      {draggable && (
        <div className="absolute top-2 left-2 bg-background/90 backdrop-blur-sm rounded-md px-2 py-1 text-xs text-muted-foreground shadow-sm">
          Drag pin to adjust
        </div>
      )}
    </div>
  );
}
