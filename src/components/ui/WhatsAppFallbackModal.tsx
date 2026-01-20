import { useState, useEffect } from 'react';
import QRCode from 'react-qr-code';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Copy, ExternalLink, QrCode, MessageSquare, Phone, Check, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { buildMobileWhatsAppUrl, setFallbackModalCallback } from '@/lib/whatsapp';

interface WhatsAppFallbackModalProps {
  children: React.ReactNode;
}

export function WhatsAppFallbackModal({ children }: WhatsAppFallbackModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [url, setUrl] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  useEffect(() => {
    // Register the callback to show this modal
    setFallbackModalCallback((newUrl, newPhone, newMessage) => {
      setUrl(newUrl);
      setPhone(newPhone);
      setMessage(newMessage);
      setIsOpen(true);
    });

    return () => {
      setFallbackModalCallback(null);
    };
  }, []);

  const handleCopy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedItem(label);
      toast.success(`${label} copied!`);
      setTimeout(() => setCopiedItem(null), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  const handleTryWhatsAppWeb = () => {
    // Force open web.whatsapp.com in a new tab
    const webUrl = phone 
      ? `https://web.whatsapp.com/send?phone=${phone}${message ? `&text=${encodeURIComponent(message)}` : ''}`
      : url;
    window.open(webUrl, '_blank');
    setIsOpen(false);
  };

  // Generate QR code URL (use wa.me for mobile scanning)
  const qrUrl = phone ? buildMobileWhatsAppUrl(phone, message) : url;

  return (
    <>
      {children}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              WhatsApp Was Blocked
            </DialogTitle>
            <DialogDescription>
              Your browser or an extension blocked WhatsApp. Try these alternatives:
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {/* QR Code Section */}
            <div className="flex flex-col items-center gap-3 p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <QrCode className="h-4 w-4" />
                <span>Scan with your phone</span>
              </div>
              <div className="bg-white p-3 rounded-lg">
                <QRCode value={qrUrl} size={160} />
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Open your phone camera and scan to open WhatsApp
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              <Button
                variant="default"
                className="w-full gap-2"
                onClick={handleTryWhatsAppWeb}
              >
                <ExternalLink className="h-4 w-4" />
                Try WhatsApp Web
              </Button>

              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={() => handleCopy(url, 'Link')}
              >
                {copiedItem === 'Link' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                Copy WhatsApp Link
              </Button>

              {phone && (
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => handleCopy(`+${phone}`, 'Phone')}
                >
                  {copiedItem === 'Phone' ? <Check className="h-4 w-4" /> : <Phone className="h-4 w-4" />}
                  Copy Phone Number
                </Button>
              )}

              {message && (
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => handleCopy(message, 'Message')}
                >
                  {copiedItem === 'Message' ? <Check className="h-4 w-4" /> : <MessageSquare className="h-4 w-4" />}
                  Copy Message Text
                </Button>
              )}
            </div>

            {/* Help Text */}
            <p className="text-xs text-muted-foreground text-center px-2">
              💡 Tip: If you have an ad blocker or privacy extension, try disabling it for this site.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
