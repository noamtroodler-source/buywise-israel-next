import { Share2, Link, MessageCircle, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ProjectShareButtonProps {
  projectSlug: string;
  projectName: string;
  className?: string;
  size?: 'sm' | 'default' | 'icon';
}

export function ProjectShareButton({ 
  projectSlug, 
  projectName, 
  className,
  size = 'icon'
}: ProjectShareButtonProps) {
  const projectUrl = `${window.location.origin}/projects/${projectSlug}`;
  const shareText = `Check out this project: ${projectName}`;

  const handleCopyLink = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(projectUrl);
      toast.success('Link copied to clipboard');
    } catch {
      toast.error('Failed to copy link');
    }
  };

  const handleWhatsApp = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `https://wa.me/?text=${encodeURIComponent(`${shareText}\n${projectUrl}`)}`;
    window.open(url, '_blank');
  };

  const handleTelegram = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `https://t.me/share/url?url=${encodeURIComponent(projectUrl)}&text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank');
  };

  const handleTriggerClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild onClick={handleTriggerClick}>
        <Button
          variant="ghost"
          size={size}
          className={cn(
            "h-8 w-8 bg-background/80 hover:bg-background text-muted-foreground hover:text-foreground transition-colors",
            className
          )}
        >
          <Share2 className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
        <DropdownMenuItem onClick={handleCopyLink}>
          <Link className="h-4 w-4 mr-2" />
          Copy Link
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleWhatsApp}>
          <MessageCircle className="h-4 w-4 mr-2" />
          WhatsApp
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleTelegram}>
          <Send className="h-4 w-4 mr-2" />
          Telegram
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
