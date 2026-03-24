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
    
    const currentParams = searchParams.toString();
    const targetPath = value === 'map' ? '/map' : '/listings';
    navigate(`${targetPath}${currentParams ? `?${currentParams}` : ''}`);
  };

  return (
    <TooltipProvider>
      <ToggleGroup 
        type="single" 
        value={activeView} 
        onValueChange={handleViewChange}
        className={cn(
          "border border-border rounded-lg p-0.5 bg-muted/40",
          className
        )}
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <ToggleGroupItem 
              value="grid" 
              aria-label="Grid view"
              className={cn(
                "rounded-md px-3 py-1.5 text-sm gap-1.5 transition-all",
                "data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:shadow-sm",
                "data-[state=off]:text-muted-foreground data-[state=off]:hover:text-foreground",
                activeView === 'grid' && "font-medium"
              )}
            >
              <LayoutGrid className="h-4 w-4" />
              <span>Grid</span>
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
                "rounded-md px-3 py-1.5 text-sm gap-1.5 transition-all",
                "data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:shadow-sm",
                "data-[state=off]:text-muted-foreground data-[state=off]:hover:text-foreground",
                activeView === 'map' && "font-medium"
              )}
            >
              <Map className="h-4 w-4" />
              <span>Map</span>
            </ToggleGroupItem>
          </TooltipTrigger>
          <TooltipContent side="bottom">Map view</TooltipContent>
        </Tooltip>
      </ToggleGroup>
    </TooltipProvider>
  );
}
