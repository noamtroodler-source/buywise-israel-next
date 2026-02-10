import { RefObject, useCallback, useState } from 'react';
import L from 'leaflet';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  ZoomIn, 
  ZoomOut, 
  Locate, 
  PenTool,
  Square,
  Circle,
  Share2,
  Keyboard,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { LayersMenu } from './LayersMenu';
import type { DrawMode } from './DrawControl';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from 'sonner';

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
  showAngloCommunity: boolean;
  onToggleAngloCommunity: () => void;
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
  showAngloCommunity,
  onToggleAngloCommunity,
  onShowKeyboardShortcuts,
}: MapToolbarProps) {
  const isMobile = useIsMobile();
  const [drawMenuOpen, setDrawMenuOpen] = useState(false);

  const buttonSize = isMobile ? 'h-11 w-11' : 'h-8 w-8';
  const iconSize = isMobile ? 'h-4 w-4' : 'h-3.5 w-3.5';

  const handleZoomIn = useCallback(() => {
    mapRef.current?.zoomIn();
  }, [mapRef]);

  const handleZoomOut = useCallback(() => {
    mapRef.current?.zoomOut();
  }, [mapRef]);

  const handleLocate = useCallback(() => {
    mapRef.current?.locate({ setView: true, maxZoom: 14 });
  }, [mapRef]);

  const handleDrawModeSelect = (mode: DrawMode) => {
    onDrawModeChange(mode);
    setDrawMenuOpen(false);
  };

  const handleShare = useCallback(async () => {
    const url = window.location.href;
    if (isMobile && navigator.share) {
      try {
        await navigator.share({ title: 'BuyWise Map Search', text: 'Check out this property search on BuyWise', url });
        return;
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard', { description: 'Share it with others to show this exact map view', duration: 3000 });
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      toast.success('Link copied to clipboard');
    }
  }, [isMobile]);

  const btnBase = cn(buttonSize, 'rounded-md transition-colors hover:bg-accent/60');
  const btnActive = 'bg-primary text-primary-foreground hover:bg-primary/90';

  return (
    <div 
      className={cn("absolute right-4 z-[40] flex flex-col gap-1.5", isMobile ? "top-14" : "top-4")}
      role="toolbar"
      aria-label="Map controls"
      aria-orientation="vertical"
    >
      {/* Group 1: Navigation */}
      <div className="map-toolbar-group">
        <div className="flex flex-col gap-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className={btnBase} onClick={handleZoomIn} aria-label="Zoom in (+)">
                <ZoomIn className={iconSize} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">Zoom in (+)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className={btnBase} onClick={handleZoomOut} aria-label="Zoom out (-)">
                <ZoomOut className={iconSize} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">Zoom out (-)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className={btnBase} onClick={handleLocate} aria-label="Find my location (L)">
                <Locate className={iconSize} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">My location (L)</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Group 2: Tools */}
      <div className="map-toolbar-group">
        <div className="flex flex-col gap-0.5">
          {/* Draw Tool */}
          <DropdownMenu open={drawMenuOpen} onOpenChange={setDrawMenuOpen}>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(btnBase, (drawMode || hasDrawnPolygon) && btnActive)}
                    aria-label="Draw to search (D)"
                    aria-expanded={drawMenuOpen}
                  >
                    <PenTool className={iconSize} />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent side="left">Draw to search (D)</TooltipContent>
            </Tooltip>
            <DropdownMenuContent side="left" align="start">
              <DropdownMenuItem onClick={() => handleDrawModeSelect('rectangle')} className={cn(drawMode === 'rectangle' && 'bg-accent')}>
                <Square className="h-4 w-4 mr-2" /> Rectangle
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDrawModeSelect('polygon')} className={cn(drawMode === 'polygon' && 'bg-accent')}>
                <PenTool className="h-4 w-4 mr-2" /> Freehand
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDrawModeSelect('circle')} className={cn(drawMode === 'circle' && 'bg-accent')}>
                <Circle className="h-4 w-4 mr-2" /> Circle
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Share */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className={btnBase} onClick={handleShare} aria-label="Share this view">
                <Share2 className={iconSize} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">Share this view</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Group 3: Layers */}
      <div className="map-toolbar-group">
        <LayersMenu
          showTrainStations={showTrainStations}
          onToggleTrainStations={onToggleTrainStations}
          showAngloCommunity={showAngloCommunity}
          onToggleAngloCommunity={onToggleAngloCommunity}
          showPriceHeatmap={showPriceHeatmap}
          onTogglePriceHeatmap={onTogglePriceHeatmap}
          showSavedLocations={showSavedLocations}
          onToggleSavedLocations={onToggleSavedLocations}
          hasSavedLocations={hasSavedLocations}
          buttonClassName={btnBase}
          iconClassName={iconSize}
        />
      </div>

      {/* Keyboard shortcuts - desktop only */}
      {!isMobile && onShowKeyboardShortcuts && (
        <div className="map-toolbar-group">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className={btnBase} onClick={onShowKeyboardShortcuts} aria-label="Keyboard shortcuts (?)">
                <Keyboard className={iconSize} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">Keyboard shortcuts (?)</TooltipContent>
          </Tooltip>
        </div>
      )}
    </div>
  );
}
