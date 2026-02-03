import { useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Share2, Check } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface MapShareButtonProps {
  className?: string;
}

export function MapShareButton({ className }: MapShareButtonProps) {
  const isMobile = useIsMobile();
  
  const handleShare = useCallback(async () => {
    const url = window.location.href;
    
    // Try native share API on mobile
    if (isMobile && navigator.share) {
      try {
        await navigator.share({
          title: 'BuyWise Map Search',
          text: 'Check out this property search on BuyWise',
          url,
        });
        return;
      } catch (err) {
        // User cancelled or share failed, fall through to clipboard
        if ((err as Error).name === 'AbortError') return;
      }
    }
    
    // Copy to clipboard
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard', {
        description: 'Share it with others to show this exact map view',
        duration: 3000,
      });
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      toast.success('Link copied to clipboard');
    }
  }, [isMobile]);

  return (
    <div className={cn("bg-background rounded-lg shadow-md border overflow-hidden", className)}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-none map-toolbar-button"
            onClick={handleShare}
            aria-label="Share current map view"
          >
            <Share2 className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left">Share this view</TooltipContent>
      </Tooltip>
    </div>
  );
}
