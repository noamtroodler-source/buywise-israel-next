import { RefObject, useCallback, useState } from 'react';
import L from 'leaflet';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  ZoomIn, 
  ZoomOut, 
  Locate, 
  MapPin,
  Layers,
  Square,
  PenTool,
  Circle,
  X,
  Train,
  Thermometer,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { DrawMode } from './DrawControl';

interface MapToolbarProps {
  mapRef: RefObject<L.Map | null>;
  showSavedLocations: boolean;
  onToggleSavedLocations: () => void;
  hasSavedLocations: boolean;
  searchAsMove: boolean;
  onSearchAsMoveChange: (value: boolean) => void;
  // Draw mode props
  drawMode: DrawMode;
  onDrawModeChange: (mode: DrawMode) => void;
  hasDrawnPolygon: boolean;
  onClearPolygon: () => void;
  // Layer toggles
  showTrainStations: boolean;
  onToggleTrainStations: () => void;
  showPriceHeatmap: boolean;
  onTogglePriceHeatmap: () => void;
}

export function MapToolbar({
  mapRef,
  showSavedLocations,
  onToggleSavedLocations,
  hasSavedLocations,
  drawMode,
  onDrawModeChange,
  hasDrawnPolygon,
  onClearPolygon,
  showTrainStations,
  onToggleTrainStations,
  showPriceHeatmap,
  onTogglePriceHeatmap,
}: MapToolbarProps) {
  const [drawMenuOpen, setDrawMenuOpen] = useState(false);

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

  const handleDrawModeSelect = (mode: DrawMode) => {
    onDrawModeChange(mode);
    setDrawMenuOpen(false);
  };

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

      {/* Draw Tools */}
      <div className="bg-background rounded-lg shadow-md border overflow-hidden">
        <DropdownMenu open={drawMenuOpen} onOpenChange={setDrawMenuOpen}>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-9 w-9 rounded-none",
                    (drawMode || hasDrawnPolygon) && "bg-primary/10 text-primary"
                  )}
                >
                  <PenTool className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent side="left">Draw to search</TooltipContent>
          </Tooltip>
          <DropdownMenuContent side="left" align="start">
            <DropdownMenuItem 
              onClick={() => handleDrawModeSelect('rectangle')}
              className={cn(drawMode === 'rectangle' && 'bg-accent')}
            >
              <Square className="h-4 w-4 mr-2" />
              Rectangle
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => handleDrawModeSelect('polygon')}
              className={cn(drawMode === 'polygon' && 'bg-accent')}
            >
              <PenTool className="h-4 w-4 mr-2" />
              Freehand
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => handleDrawModeSelect('circle')}
              className={cn(drawMode === 'circle' && 'bg-accent')}
            >
              <Circle className="h-4 w-4 mr-2" />
              Circle
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        {/* Clear Drawing Button */}
        {hasDrawnPolygon && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-none border-t text-destructive hover:text-destructive"
                onClick={onClearPolygon}
              >
                <X className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">Clear drawing</TooltipContent>
          </Tooltip>
        )}
      </div>

      {/* Layer Toggles */}
      <div className="bg-background rounded-lg shadow-md border overflow-hidden">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-9 w-9 rounded-none border-b",
                showTrainStations && "bg-primary/10 text-primary"
              )}
              onClick={onToggleTrainStations}
            >
              <Train className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">
            {showTrainStations ? 'Hide train stations' : 'Show train stations'}
          </TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-9 w-9 rounded-none",
                showPriceHeatmap && "bg-primary/10 text-primary"
              )}
              onClick={onTogglePriceHeatmap}
            >
              <Thermometer className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">
            {showPriceHeatmap ? 'Hide price heatmap' : 'Show price heatmap'}
          </TooltipContent>
        </Tooltip>
      </div>
      
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
