import { lazy, Suspense, useState, useEffect, Component, ReactNode } from 'react';
import { MapPin, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGoogleMaps } from '@/components/maps/GoogleMapsProvider';
import { GoogleMiniMap } from '@/components/maps/GoogleMiniMap';

const PropertyMiniMap = lazy(() => 
  import('./PropertyMiniMap').then(module => ({ default: module.PropertyMiniMap }))
);

interface POIMarker {
  category: string;
  name: string;
  lat: number;
  lng: number;
}

interface Props {
  latitude: number;
  longitude: number;
  propertyTitle?: string;
  nearbyPOIs?: POIMarker[];
  draggable?: boolean;
  onPositionChange?: (lat: number, lng: number) => void;
}

// Simple inline error boundary for the map
interface ErrorBoundaryState {
  hasError: boolean;
}

class MapErrorBoundary extends Component<{ children: ReactNode; onError: () => void }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch() {
    this.props.onError();
  }

  render() {
    if (this.state.hasError) {
      return null;
    }
    return this.props.children;
  }
}

function MapFallback({ latitude, longitude }: { latitude?: number; longitude?: number }) {
  const openGoogleMaps = () => {
    if (latitude && longitude) {
      window.open(`https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`, '_blank');
    }
  };

  return (
    <div className="relative rounded-xl overflow-hidden border border-border h-[200px] sm:h-[240px] bg-muted flex items-center justify-center">
      <div className="text-center space-y-3">
        <MapPin className="h-8 w-8 mx-auto text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">Map loading...</p>
        {latitude && longitude && (
          <Button variant="outline" size="sm" onClick={openGoogleMaps} className="gap-2">
            <ExternalLink className="h-4 w-4" />
            View on Google Maps
          </Button>
        )}
      </div>
    </div>
  );
}

export function PropertyMiniMapWrapper({ 
  latitude, 
  longitude, 
  propertyTitle, 
  nearbyPOIs,
  draggable = false,
  onPositionChange,
}: Props) {
  const [hasError, setHasError] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const { isLoaded: googleMapsLoaded, loadError: googleMapsError } = useGoogleMaps();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return <MapFallback latitude={latitude} longitude={longitude} />;
  }

  // Prefer Google Maps if available
  if (googleMapsLoaded && !googleMapsError) {
    return (
      <GoogleMiniMap
        latitude={latitude}
        longitude={longitude}
        propertyTitle={propertyTitle}
        nearbyPOIs={nearbyPOIs}
        draggable={draggable}
        onPositionChange={onPositionChange}
      />
    );
  }

  // Fall back to Leaflet/OpenStreetMap
  if (hasError) {
    return <MapFallback latitude={latitude} longitude={longitude} />;
  }

  return (
    <MapErrorBoundary onError={() => setHasError(true)}>
      <Suspense fallback={<MapFallback latitude={latitude} longitude={longitude} />}>
        <PropertyMiniMap
          latitude={latitude}
          longitude={longitude}
          propertyTitle={propertyTitle}
          nearbyPOIs={nearbyPOIs}
        />
      </Suspense>
    </MapErrorBoundary>
  );
}
