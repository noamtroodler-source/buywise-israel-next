import { MapPin } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface MapListPanelProps {
  resultCount: number;
}

export function MapListPanel({ resultCount }: MapListPanelProps) {
  return (
    <div className="hidden lg:flex flex-col border-l border-border bg-background min-h-0">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-border">
        <span className="text-sm font-semibold text-foreground">
          {resultCount.toLocaleString()} results
        </span>
        <button
          disabled
          className="text-xs text-muted-foreground cursor-not-allowed"
        >
          Sort ▾
        </button>
      </div>

      {/* Empty state */}
      <ScrollArea className="flex-1">
        <div className="flex flex-col items-center justify-center h-full min-h-[400px] px-6 text-center">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
            <MapPin className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground mb-1">No properties yet</p>
          <p className="text-xs text-muted-foreground max-w-[240px]">
            Move the map or adjust filters to find properties in your desired area.
          </p>
        </div>
      </ScrollArea>
    </div>
  );
}
