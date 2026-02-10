import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Layers, Train, Users, Thermometer, MapPin, Hexagon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LayersMenuProps {
  showTrainStations: boolean;
  onToggleTrainStations: () => void;
  showAngloCommunity: boolean;
  onToggleAngloCommunity: () => void;
  showPriceHeatmap: boolean;
  onTogglePriceHeatmap: () => void;
  showSavedLocations: boolean;
  onToggleSavedLocations: () => void;
  hasSavedLocations: boolean;
  showNeighborhoodBoundaries?: boolean;
  onToggleNeighborhoodBoundaries?: () => void;
  buttonClassName?: string;
  iconClassName?: string;
}

const LAYERS = [
  { key: 'neighborhoods', label: 'Neighborhoods', icon: Hexagon },
  { key: 'trainStations', label: 'Train Stations', icon: Train },
  { key: 'angloCommunity', label: 'Anglo Community', icon: Users },
  { key: 'priceHeatmap', label: 'Price Heatmap', icon: Thermometer },
  { key: 'savedLocations', label: 'Saved Locations', icon: MapPin },
] as const;

export function LayersMenu({
  showTrainStations,
  onToggleTrainStations,
  showAngloCommunity,
  onToggleAngloCommunity,
  showPriceHeatmap,
  onTogglePriceHeatmap,
  showSavedLocations,
  onToggleSavedLocations,
  hasSavedLocations,
  showNeighborhoodBoundaries = true,
  onToggleNeighborhoodBoundaries,
  buttonClassName,
  iconClassName,
}: LayersMenuProps) {
  const layerStates: Record<string, { checked: boolean; toggle: () => void }> = {
    neighborhoods: { checked: showNeighborhoodBoundaries, toggle: onToggleNeighborhoodBoundaries || (() => {}) },
    trainStations: { checked: showTrainStations, toggle: onToggleTrainStations },
    angloCommunity: { checked: showAngloCommunity, toggle: onToggleAngloCommunity },
    priceHeatmap: { checked: showPriceHeatmap, toggle: onTogglePriceHeatmap },
    savedLocations: { checked: showSavedLocations, toggle: onToggleSavedLocations },
  };

  const activeCount = useMemo(() => {
    let count = 0;
    if (showNeighborhoodBoundaries) count++;
    if (showTrainStations) count++;
    if (showAngloCommunity) count++;
    if (showPriceHeatmap) count++;
    if (hasSavedLocations && showSavedLocations) count++;
    return count;
  }, [showNeighborhoodBoundaries, showTrainStations, showAngloCommunity, showPriceHeatmap, showSavedLocations, hasSavedLocations]);

  const visibleLayers = LAYERS.filter(
    l => (l.key !== 'savedLocations' || hasSavedLocations) && (l.key !== 'neighborhoods' || onToggleNeighborhoodBoundaries)
  );

  return (
    <Popover>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn(buttonClassName, 'relative')}
              aria-label="Map layers"
            >
              <Layers className={iconClassName} />
              {activeCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
                  {activeCount}
                </span>
              )}
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent side="left">Map layers</TooltipContent>
      </Tooltip>

      <PopoverContent side="left" align="start" className="w-56 p-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
          Layers
        </p>
        <div className="space-y-1">
          {visibleLayers.map(({ key, label, icon: Icon }) => {
            const state = layerStates[key];
            return (
              <label
                key={key}
                className="flex items-center gap-3 px-2 py-1.5 rounded-md hover:bg-accent/50 cursor-pointer transition-colors"
              >
                <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-sm flex-1">{label}</span>
                <Switch
                  checked={state.checked}
                  onCheckedChange={state.toggle}
                  className="scale-75"
                />
              </label>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
