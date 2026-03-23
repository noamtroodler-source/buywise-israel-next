import type { ReactNode } from 'react';
import { Train, Heart, BookOpen, GraduationCap, Stethoscope, Droplets, ShoppingCart } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { getLayerColor } from './mapMarkerIcons';

interface LayersMenuProps {
  activeLayers: Set<string>;
  onToggleLayer: (layerId: string) => void;
  children: ReactNode;
}

const LAYERS = [
  { id: 'trains', label: 'Train Stations', icon: Train },
  { id: 'saved', label: 'My Places', icon: Heart },
  { id: 'shuls', label: 'Shuls', icon: BookOpen },
  { id: 'schools', label: 'Schools', icon: GraduationCap },
  { id: 'medical', label: 'Medical', icon: Stethoscope },
  { id: 'mikvehs', label: 'Mikvehs', icon: Droplets },
  { id: 'grocery', label: 'Grocery', icon: ShoppingCart },
] as const;

export function LayersMenu({ activeLayers, onToggleLayer, children }: LayersMenuProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent side="left" align="end" className="w-60 p-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Map Layers
        </p>
        <div className="flex flex-col gap-1">
          {LAYERS.map((layer) => {
            const Icon = layer.icon;
            const isActive = activeLayers.has(layer.id);
            const color = getLayerColor(layer.id);
            return (
              <label
                key={layer.id}
                className="flex items-center gap-3 py-2 px-2 cursor-pointer rounded-lg hover:bg-muted/50 transition-colors"
              >
                <span
                  className="flex items-center justify-center h-7 w-7 rounded-full shrink-0"
                  style={{
                    backgroundColor: isActive ? `${color}18` : 'hsl(var(--muted))',
                  }}
                >
                  <Icon
                    className="h-3.5 w-3.5"
                    style={{ color: isActive ? color : 'hsl(var(--muted-foreground))' }}
                  />
                </span>
                <span className="text-sm flex-1 font-medium text-foreground">
                  {layer.label}
                </span>
                <Switch
                  checked={isActive}
                  onCheckedChange={() => onToggleLayer(layer.id)}
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
