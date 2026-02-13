import { Map, List } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileMapListToggleProps {
  activeView: 'map' | 'list';
  onToggle: (view: 'map' | 'list') => void;
}

export function MobileMapListToggle({ activeView, onToggle }: MobileMapListToggleProps) {
  return (
    <div className="absolute bottom-[160px] left-1/2 -translate-x-1/2 z-[45]">
      <div className="flex rounded-full border border-border bg-background/95 backdrop-blur-sm shadow-lg p-0.5">
        <button
          onClick={() => onToggle('map')}
          className={cn(
            'flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium transition-colors',
            activeView === 'map'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <Map className="h-3.5 w-3.5" />
          Map
        </button>
        <button
          onClick={() => onToggle('list')}
          className={cn(
            'flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium transition-colors',
            activeView === 'list'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <List className="h-3.5 w-3.5" />
          List
        </button>
      </div>
    </div>
  );
}
