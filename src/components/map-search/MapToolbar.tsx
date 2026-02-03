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
  Keyboard,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { DrawMode } from './DrawControl';
import { MapShareButton } from './MapShareButton';
import { useIsMobile } from '@/hooks/use-mobile';

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
  // Keyboard shortcuts
  onShowKeyboardShortcuts?: () => void;
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
  onShowKeyboardShortcuts,
}: MapToolbarProps) {
  const isMobile = useIsMobile();
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
    <div 
      className="absolute top-4 right-4 z-[1000] flex flex-col gap-1"
      role="toolbar"
      aria-label="Map controls"
      aria-orientation="vertical"
    >
      {/* Zoom Controls */}
      <div className="bg-background rounded-lg shadow-md border overflow-hidden">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-none border-b map-toolbar-button"
              onClick={handleZoomIn}
              aria-label="Zoom in (keyboard: +)"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">Zoom in (+)</TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-none map-toolbar-button"
              onClick={handleZoomOut}
              aria-label="Zoom out (keyboard: -)"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">Zoom out (-)</TooltipContent>
        </Tooltip>
      </div>
      
      {/* Location Control */}
      <div className="bg-background rounded-lg shadow-md border overflow-hidden">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-none map-toolbar-button"
              onClick={handleLocate}
              aria-label="Find my location (keyboard: L)"
            >
              <Locate className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">My location (L)</TooltipContent>
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
                  "h-9 w-9 rounded-none map-toolbar-button",
                  showSavedLocations && "bg-primary/10 text-primary"
                )}
                onClick={onToggleSavedLocations}
                aria-label={showSavedLocations ? 'Hide saved places (keyboard: S)' : 'Show saved places (keyboard: S)'}
                aria-pressed={showSavedLocations}
              >
                <MapPin className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              {showSavedLocations ? 'Hide saved places (S)' : 'Show saved places (S)'}
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
                    "h-9 w-9 rounded-none map-toolbar-button",
                    (drawMode || hasDrawnPolygon) && "bg-primary/10 text-primary"
                  )}
                  aria-label="Draw to search area (keyboard: D)"
                  aria-expanded={drawMenuOpen}
                >
                  <PenTool className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent side="left">Draw to search (D)</TooltipContent>
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
                "h-9 w-9 rounded-none border-b map-toolbar-button",
                showTrainStations && "bg-primary/10 text-primary"
              )}
              onClick={onToggleTrainStations}
              aria-label={showTrainStations ? 'Hide train stations (keyboard: T)' : 'Show train stations (keyboard: T)'}
              aria-pressed={showTrainStations}
            >
              <Train className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">
            {showTrainStations ? 'Hide train stations (T)' : 'Show train stations (T)'}
          </TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-9 w-9 rounded-none map-toolbar-button",
                showPriceHeatmap && "bg-primary/10 text-primary"
              )}
              onClick={onTogglePriceHeatmap}
              aria-label={showPriceHeatmap ? 'Hide price heatmap (keyboard: H)' : 'Show price heatmap (keyboard: H)'}
              aria-pressed={showPriceHeatmap}
            >
              <Thermometer className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">
            {showPriceHeatmap ? 'Hide price heatmap (H)' : 'Show price heatmap (H)'}
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Share Button */}
      <MapShareButton />
      
      {/* Keyboard Shortcuts - Desktop only */}
      {!isMobile && onShowKeyboardShortcuts && (
        <div className="bg-background rounded-lg shadow-md border overflow-hidden">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-none map-toolbar-button"
                onClick={onShowKeyboardShortcuts}
                aria-label="Show keyboard shortcuts"
              >
                <Keyboard className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">Keyboard shortcuts (?)</TooltipContent>
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
              className="h-9 w-9 rounded-none map-toolbar-button"
              onClick={handleResetView}
              aria-label="Reset map view to default (keyboard: R)"
            >
              <Layers className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">Reset view (R)</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}
