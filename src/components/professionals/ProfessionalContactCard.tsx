import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { MessageCircle, Mail, Globe, CalendarCheck, MapPin } from 'lucide-react';
import { ProfileShareMenu } from '@/components/shared/ProfileShareMenu';
import { buildWhatsAppUrl, openWhatsApp } from '@/lib/whatsapp';
import type { TrustedProfessional } from '@/hooks/useTrustedProfessionals';

interface ProfessionalContactCardProps {
  professional: TrustedProfessional;
  accentColor?: string;
}

export function ProfessionalContactCard({ professional, accentColor }: ProfessionalContactCardProps) {
  const whatsappNumber = professional.whatsapp || professional.phone;
  const whatsappUrl = whatsappNumber
    ? buildWhatsAppUrl(whatsappNumber, `Hi, I found ${professional.name} on BuyWise Israel and would like to connect.`)
    : '';

  return (
    <Card className="border-border/50 overflow-hidden">
      {accentColor && (
        <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, ${accentColor}, ${accentColor}60)` }} />
      )}
      <CardContent className="p-5 space-y-3">
        <h3 className="font-semibold text-foreground text-sm">Get in Touch</h3>

        {whatsappUrl && (
          <Button
            variant="outline"
            className="w-full gap-2"
            style={accentColor ? { borderColor: `${accentColor}30`, color: accentColor } : undefined}
            onClick={() => openWhatsApp(whatsappUrl)}
          >
            <MessageCircle className="h-4 w-4" />
            WhatsApp
          </Button>
        )}

        {professional.email && (
          <Button
            variant="outline"
            className="w-full gap-2"
            style={accentColor ? { borderColor: `${accentColor}30`, color: accentColor } : undefined}
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
          <Button
            className="w-full gap-2 text-white font-semibold"
            style={accentColor ? { backgroundColor: accentColor } : undefined}
            asChild
          >
            <a href={professional.booking_url} target="_blank" rel="noopener noreferrer">
              <CalendarCheck className="h-4 w-4" />
              Book Consultation
            </a>
          </Button>
        )}

        <div className="flex items-center justify-center pt-1">
          <ProfileShareMenu
            name={professional.name}
            profileType="agent"
            variant="ghost"
            size="sm"
            label="Share Profile"
          />
        </div>

        {professional.office_address && (
          <div className="flex items-start gap-2 pt-2 border-t border-border/50">
            <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground leading-relaxed">{professional.office_address}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
