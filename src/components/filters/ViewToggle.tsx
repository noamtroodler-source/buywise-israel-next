import { useNavigate, useSearchParams } from 'react-router-dom';
import { LayoutGrid, Map } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface ViewToggleProps {
  activeView: 'grid' | 'map';
  className?: string;
  size?: 'default' | 'sm';
}

export function ViewToggle({ activeView, className, size = 'default' }: ViewToggleProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const handleViewChange = (value: string) => {
    if (!value || value === activeView) return;
    
    // Preserve all current URL params when switching views
    const currentParams = searchParams.toString();
    const targetPath = value === 'map' ? '/map' : '/listings';
    navigate(`${targetPath}${currentParams ? `?${currentParams}` : ''}`);
  };

  const isSmall = size === 'sm';

  return (
    <TooltipProvider>
      <ToggleGroup 
        type="single" 
        value={activeView} 
        onValueChange={handleViewChange}
        className={cn(
          "border rounded-lg p-0.5 bg-muted/30",
          isSmall && "rounded-md",
          className
        )}
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <ToggleGroupItem 
              value="grid" 
              aria-label="Grid view"
              className={cn(
                "rounded-md data-[state=on]:bg-background data-[state=on]:shadow-sm",
                isSmall ? "h-7 w-7 p-0" : "px-3 py-1.5 text-sm gap-1.5",
                activeView === 'grid' && "font-medium"
              )}
            >
              <LayoutGrid className={cn(isSmall ? "h-3.5 w-3.5" : "h-4 w-4")} />
              {!isSmall && <span className="hidden sm:inline">Grid</span>}
            </ToggleGroupItem>
          </TooltipTrigger>
          <TooltipContent side="bottom">Grid view</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <ToggleGroupItem 
              value="map" 
              aria-label="Map view"
              className={cn(
                "rounded-md data-[state=on]:bg-background data-[state=on]:shadow-sm",
                isSmall ? "h-7 w-7 p-0" : "px-3 py-1.5 text-sm gap-1.5",
                activeView === 'map' && "font-medium"
              )}
            >
              <Map className={cn(isSmall ? "h-3.5 w-3.5" : "h-4 w-4")} />
              {!isSmall && <span className="hidden sm:inline">Map</span>}
            </ToggleGroupItem>
          </TooltipTrigger>
          <TooltipContent side="bottom">Map view</TooltipContent>
        </Tooltip>
      </ToggleGroup>
    </TooltipProvider>
  );
}
