import { useNavigate, useSearchParams } from 'react-router-dom';
import { LayoutGrid, Map } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { cn } from '@/lib/utils';

interface ViewToggleProps {
  activeView: 'grid' | 'map';
  className?: string;
}

export function ViewToggle({ activeView, className }: ViewToggleProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const handleViewChange = (value: string) => {
    if (!value || value === activeView) return;
    
    // Preserve all current URL params when switching views
    const currentParams = searchParams.toString();
    const targetPath = value === 'map' ? '/map' : '/listings';
    navigate(`${targetPath}${currentParams ? `?${currentParams}` : ''}`);
  };

  return (
    <ToggleGroup 
      type="single" 
      value={activeView} 
      onValueChange={handleViewChange}
      className={cn("border rounded-lg p-0.5 bg-muted/30", className)}
    >
      <ToggleGroupItem 
        value="grid" 
        aria-label="Grid view"
        className={cn(
          "px-3 py-1.5 text-sm gap-1.5 rounded-md data-[state=on]:bg-background data-[state=on]:shadow-sm",
          activeView === 'grid' && "font-medium"
        )}
      >
        <LayoutGrid className="h-4 w-4" />
        <span className="hidden sm:inline">Grid</span>
      </ToggleGroupItem>
      <ToggleGroupItem 
        value="map" 
        aria-label="Map view"
        className={cn(
          "px-3 py-1.5 text-sm gap-1.5 rounded-md data-[state=on]:bg-background data-[state=on]:shadow-sm",
          activeView === 'map' && "font-medium"
        )}
      >
        <Map className="h-4 w-4" />
        <span className="hidden sm:inline">Map</span>
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
