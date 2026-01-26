import { Share2, Link, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/hooks/use-toast";
import { buildWhatsAppShareUrl, openWhatsApp } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";
import { useShareTracking } from "@/hooks/useShareTracking";

interface ShareButtonProps {
  propertyId: string;
  propertyTitle: string;
  className?: string;
}

export function ShareButton({ propertyId, propertyTitle, className = "" }: ShareButtonProps) {
  const { trackShare } = useShareTracking();
  const propertyUrl = `${window.location.origin}/property/${propertyId}`;
  const shareText = `Check out this property: ${propertyTitle}`;

  const handleCopyLink = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(propertyUrl);
    toast({
      title: "Link copied!",
      description: "Property link copied to clipboard",
    });
    trackShare({ entityType: 'property', entityId: propertyId, shareMethod: 'copy_link' });
  };

  const handleWhatsApp = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const url = buildWhatsAppShareUrl(`${shareText}\n${propertyUrl}`);
    openWhatsApp(url);
    trackShare({ entityType: 'property', entityId: propertyId, shareMethod: 'whatsapp' });
  };


  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          className={cn(
            "h-8 w-8 rounded-md bg-background/80 hover:bg-background transition-colors text-muted-foreground hover:text-foreground",
            className
          )}
        >
          <Share2 className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40" onClick={(e) => e.stopPropagation()}>
        <DropdownMenuItem onClick={handleCopyLink} className="cursor-pointer">
          <Link className="h-4 w-4 mr-2" />
          Copy Link
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleWhatsApp} className="cursor-pointer">
          <MessageCircle className="h-4 w-4 mr-2" />
          WhatsApp
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
