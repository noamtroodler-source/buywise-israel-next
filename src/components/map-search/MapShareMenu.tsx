import { useCallback } from 'react';
import { Copy, Mail, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { buildMapShareText } from '@/lib/mapShareText';
import { buildWhatsAppShareUrl, openWhatsApp } from '@/lib/whatsapp';
import { useShareTracking } from '@/hooks/useShareTracking';

// Inline WhatsApp icon to avoid lucide dependency
function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
      <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.832-1.438A9.955 9.955 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18a8 8 0 01-4.243-1.213l-.307-.184-2.87.853.853-2.87-.184-.307A8 8 0 1112 20z" />
    </svg>
  );
}

interface MapShareMenuProps {
  children: React.ReactNode;
}

export function MapShareMenu({ children }: MapShareMenuProps) {
  const { trackShare } = useShareTracking();

  const getShareData = useCallback(() => {
    const url = window.location.href;
    const text = buildMapShareText(new URLSearchParams(window.location.search));
    return { url, text };
  }, []);

  const handleCopyLink = useCallback(() => {
    const { url } = getShareData();
    navigator.clipboard.writeText(url).then(() => {
      toast.success('Link copied!', { description: 'Anyone with this link will see the same search.' });
    }).catch(() => {
      toast.error('Could not copy link');
    });
    trackShare({ entityType: 'tool', entityId: 'map_search', shareMethod: 'copy_link' });
  }, [getShareData, trackShare]);

  const handleWhatsApp = useCallback(() => {
    const { url, text } = getShareData();
    const message = `Check out this search on BuyWise Israel:\n${text.replace(' | BuyWise Israel', '')}\n${url}`;
    const waUrl = buildWhatsAppShareUrl(message);
    openWhatsApp(waUrl);
    trackShare({ entityType: 'tool', entityId: 'map_search', shareMethod: 'whatsapp' });
  }, [getShareData, trackShare]);

  const handleEmail = useCallback(() => {
    const { url, text } = getShareData();
    const subject = encodeURIComponent(text);
    const body = encodeURIComponent(`I found some interesting properties:\n\n${url}`);
    window.open(`mailto:?subject=${subject}&body=${body}`, '_self');
    trackShare({ entityType: 'tool', entityId: 'map_search', shareMethod: 'copy_link' });
  }, [getShareData, trackShare]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {children}
      </DropdownMenuTrigger>
      <DropdownMenuContent side="left" align="center" className="w-44 z-[9999]">
        <DropdownMenuItem onClick={handleCopyLink}>
          <Copy className="h-4 w-4 mr-2" />
          Copy Link
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleWhatsApp}>
          <WhatsAppIcon className="h-4 w-4 mr-2" />
          WhatsApp
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleEmail}>
          <Mail className="h-4 w-4 mr-2" />
          Email
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
