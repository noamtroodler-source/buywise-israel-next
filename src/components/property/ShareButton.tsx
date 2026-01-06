import { Share2, Link, MessageCircle, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/hooks/use-toast";

interface ShareButtonProps {
  propertyId: string;
  propertyTitle: string;
  className?: string;
  size?: "sm" | "default";
}

export function ShareButton({ propertyId, propertyTitle, className = "", size = "default" }: ShareButtonProps) {
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
  };

  const handleWhatsApp = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText}\n${propertyUrl}`)}`;
    window.open(whatsappUrl, "_blank");
  };

  const handleTelegram = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(propertyUrl)}&text=${encodeURIComponent(shareText)}`;
    window.open(telegramUrl, "_blank");
  };

  const iconSize = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";
  const buttonSize = size === "sm" ? "h-7 w-7" : "h-8 w-8";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
        <Button
          variant="ghost"
          size="icon"
          className={`${buttonSize} rounded-full bg-background/80 backdrop-blur-sm hover:bg-background ${className}`}
        >
          <Share2 className={iconSize} />
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
        <DropdownMenuItem onClick={handleTelegram} className="cursor-pointer">
          <Send className="h-4 w-4 mr-2" />
          Telegram
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
