import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { MessageCircle, Mail, Globe, CalendarCheck } from 'lucide-react';
import { buildWhatsAppUrl, openWhatsApp } from '@/lib/whatsapp';
import type { TrustedProfessional } from '@/hooks/useTrustedProfessionals';

interface ProfessionalContactCardProps {
  professional: TrustedProfessional;
}

export function ProfessionalContactCard({ professional }: ProfessionalContactCardProps) {
  const whatsappNumber = professional.whatsapp || professional.phone;
  const whatsappUrl = whatsappNumber
    ? buildWhatsAppUrl(whatsappNumber, `Hi, I found ${professional.name} on BuyWise Israel and would like to connect.`)
    : '';

  return (
    <Card className="border-border/50">
      <CardContent className="p-5 space-y-3">
        <h3 className="font-semibold text-foreground text-sm">Get in Touch</h3>

        {whatsappUrl && (
          <Button className="w-full gap-2" onClick={() => openWhatsApp(whatsappUrl)}>
            <MessageCircle className="h-4 w-4" />
            WhatsApp
          </Button>
        )}

        {professional.email && (
          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={() => {
              window.location.href = `mailto:${professional.email}?subject=${encodeURIComponent(`Inquiry via BuyWise Israel — ${professional.name}`)}`;
            }}
          >
            <Mail className="h-4 w-4" />
            Email
          </Button>
        )}

        {professional.website && (
          <Button variant="outline" className="w-full gap-2" asChild>
            <a href={professional.website} target="_blank" rel="noopener noreferrer">
              <Globe className="h-4 w-4" />
              Visit Website
            </a>
          </Button>
        )}

        {professional.booking_url && (
          <Button variant="secondary" className="w-full gap-2" asChild>
            <a href={professional.booking_url} target="_blank" rel="noopener noreferrer">
              <CalendarCheck className="h-4 w-4" />
              Book Consultation
            </a>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
