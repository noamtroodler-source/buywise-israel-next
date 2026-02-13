import type { ReactNode } from 'react';
import { Train, MapPin, Flame } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';

interface LayersMenuProps {
  activeLayers: Set<string>;
  onToggleLayer: (layerId: string) => void;
  children: ReactNode;
}

const LAYERS = [
  { id: 'trains', label: 'Train Stations', icon: Train, disabled: false },
  { id: 'neighborhoods', label: 'Neighborhoods', icon: MapPin, disabled: false },
  { id: 'heatmap', label: 'Price Heatmap', icon: Flame, disabled: true, badge: 'Soon' },
] as const;

export function LayersMenu({ activeLayers, onToggleLayer, children }: LayersMenuProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent side="left" align="end" className="w-56 p-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
          Map Layers
        </p>
        <div className="flex flex-col gap-2">
          {LAYERS.map((layer) => {
            const Icon = layer.icon;
            return (
              <label
                key={layer.id}
                className="flex items-center gap-3 py-1.5 cursor-pointer"
              >
                <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-sm flex-1">
                  {layer.label}
                  {layer.disabled && (
                    <span className="ml-1.5 text-[10px] font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                      {layer.badge}
                    </span>
                  )}
                </span>
                <Switch
                  checked={activeLayers.has(layer.id)}
                  onCheckedChange={() => onToggleLayer(layer.id)}
                  disabled={layer.disabled}
                  className="shrink-0"
                />
              </label>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
