import { RefObject, useCallback } from 'react';
import L from 'leaflet';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  ZoomIn, 
  ZoomOut, 
  Locate, 
  MapPin,
  Layers,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MapToolbarProps {
  mapRef: RefObject<L.Map | null>;
  showSavedLocations: boolean;
  onToggleSavedLocations: () => void;
  hasSavedLocations: boolean;
  searchAsMove: boolean;
  onSearchAsMoveChange: (value: boolean) => void;
}

export function MapToolbar({
  mapRef,
  showSavedLocations,
  onToggleSavedLocations,
  hasSavedLocations,
}: MapToolbarProps) {
  const handleZoomIn = useCallback(() => {
    if (mapRef.current) {
      mapRef.current.zoomIn();
    }
  }, [mapRef]);

  const handleZoomOut = useCallback(() => {
    if (mapRef.current) {
      mapRef.current.zoomOut();
    }
  }, [mapRef]);

  const handleLocate = useCallback(() => {
    if (!mapRef.current) return;
    
    mapRef.current.locate({ setView: true, maxZoom: 14 });
  }, [mapRef]);

  const handleResetView = useCallback(() => {
    if (mapRef.current) {
      // Reset to Israel view
      mapRef.current.flyTo([31.5, 34.8], 8, { duration: 1 });
    }
  }, [mapRef]);

  return (
    <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-1">
      {/* Zoom Controls */}
      <div className="bg-background rounded-lg shadow-md border overflow-hidden">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-none border-b"
              onClick={handleZoomIn}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">Zoom in</TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-none"
              onClick={handleZoomOut}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">Zoom out</TooltipContent>
        </Tooltip>
      </div>
      
      {/* Location Control */}
      <div className="bg-background rounded-lg shadow-md border overflow-hidden">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-none"
              onClick={handleLocate}
            >
              <Locate className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">My location</TooltipContent>
        </Tooltip>
      </div>
      
      {/* Saved Locations Toggle */}
      {hasSavedLocations && (
        <div className="bg-background rounded-lg shadow-md border overflow-hidden">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-9 w-9 rounded-none",
                  showSavedLocations && "bg-primary/10 text-primary"
                )}
                onClick={onToggleSavedLocations}
              >
                <MapPin className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              {showSavedLocations ? 'Hide saved places' : 'Show saved places'}
            </TooltipContent>
          </Tooltip>
        </div>
      )}
      
      {/* Reset View */}
      <div className="bg-background rounded-lg shadow-md border overflow-hidden">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-none"
              onClick={handleResetView}
            >
              <Layers className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">Reset view</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}
