import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { MessageCircle, Mail } from 'lucide-react';
import { motion } from 'framer-motion';
import { trackInquiry } from '@/hooks/useInquiryTracking';
import { useAuth } from '@/hooks/useAuth';
import { buildWhatsAppUrl, openWhatsApp } from '@/lib/whatsapp';

interface Agent {
  id?: string;
  name: string;
  agency_name: string | null;
  phone?: string | null;
  email?: string;
  avatar_url?: string | null;
}

interface StickyContactCardProps {
  agent?: Agent | null;
  propertyId?: string;
  propertyTitle: string;
  className?: string;
  onContactClick?: () => void;
}

export function StickyContactCard({ 
  agent, 
  propertyId,
  propertyTitle, 
  className = '', 
  onContactClick,
}: StickyContactCardProps) {
  const { user } = useAuth();

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const whatsappMessage = `Hi, I'm interested in: ${propertyTitle}`;
  const whatsappUrl = agent?.phone 
    ? buildWhatsAppUrl(agent.phone, whatsappMessage)
    : '';

  const handleWhatsAppClick = () => {
    if (propertyId && agent?.id) {
      trackInquiry({
        propertyId,
        agentId: agent.id,
        inquiryType: 'whatsapp',
        userId: user?.id,
      });
    }

    openWhatsApp(whatsappUrl, agent?.phone || '', whatsappMessage);
  };

  const handleEmail = () => {
    if (agent?.email) {
      // Track the inquiry
      if (propertyId && agent.id) {
        trackInquiry({
          propertyId,
          agentId: agent.id,
          inquiryType: 'email',
          userId: user?.id,
        });
      }
      
      const subject = encodeURIComponent(`Inquiry: ${propertyTitle}`);
      window.location.href = `mailto:${agent.email}?subject=${subject}`;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className={className}
    >
      <Card className="shadow-lg border-border overflow-hidden">
        {/* Agent Header */}
        {agent && (
          <>
            <div className="p-5 flex items-center gap-3 bg-muted/30">
              <Avatar className="h-16 w-16 ring-2 ring-primary/20 ring-offset-2 ring-offset-background shadow-md border border-background">
                <AvatarImage 
                  src={agent.avatar_url || undefined} 
                  alt={agent.name}
                  className="object-cover"
                />
                <AvatarFallback className="bg-gradient-to-br from-primary/10 to-primary/20 text-primary font-semibold text-lg">
                  {getInitials(agent.name)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                {agent.id ? (
                  <Link 
                    to={`/agents/${agent.id}`} 
                    className="font-semibold text-foreground truncate block hover:text-primary hover:underline transition-colors"
                  >
                    {agent.name}
                  </Link>
                ) : (
                  <p className="font-semibold text-foreground truncate">{agent.name}</p>
                )}
                {agent.agency_name && (
                  <p className="text-sm text-muted-foreground truncate">{agent.agency_name}</p>
                )}
              </div>
            </div>
            <Separator />
          </>
        )}

        {/* Contact Buttons */}
        <CardContent className="p-5 space-y-3">
          {agent?.phone && whatsappUrl && (
            <Button 
              className="w-full gap-2" 
              size="lg"
              onClick={handleWhatsAppClick}
            >
              <MessageCircle className="h-5 w-5" />
              WhatsApp
            </Button>
          )}
          
          <Button 
            variant="outline" 
            className="w-full gap-1.5"
            onClick={handleEmail}
            disabled={!agent?.email}
          >
            <Mail className="h-4 w-4" />
            Email
          </Button>
          

          {!agent && (
            <Button 
              className="w-full" 
              size="lg"
              onClick={onContactClick}
            >
              Contact Agent
            </Button>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Mobile version - fixed bottom bar
interface MobileContactBarProps {
  agent?: Agent | null;
  propertyId?: string;
  propertyTitle: string;
}

export function MobileContactBar({ agent, propertyId, propertyTitle }: MobileContactBarProps) {
  const { user } = useAuth();

  const whatsappMessage = `Hi, I'm interested in: ${propertyTitle}`;
  const whatsappUrl = agent?.phone 
    ? buildWhatsAppUrl(agent.phone, whatsappMessage)
    : '';

  const handleWhatsAppClick = () => {
    if (propertyId && agent?.id) {
      trackInquiry({
        propertyId,
        agentId: agent.id,
        inquiryType: 'whatsapp',
        userId: user?.id,
      });
    }

    openWhatsApp(whatsappUrl, agent?.phone || '', whatsappMessage);
  };

  const handleScrollToContact = () => {
    const agentSection = document.getElementById('agent-contact-section');
    if (agentSection) {
      agentSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  if (agent?.phone && whatsappUrl) {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border p-4 z-50 md:hidden">
        <div className="max-w-lg mx-auto">
          <Button 
            className="w-full gap-2" 
            size="lg"
            onClick={handleWhatsAppClick}
          >
            <MessageCircle className="h-5 w-5" />
            WhatsApp
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border p-4 z-50 md:hidden">
      <div className="max-w-lg mx-auto">
        <Button 
          className="w-full gap-2" 
          size="lg"
          onClick={handleScrollToContact}
        >
          <MessageCircle className="h-5 w-5" />
          Contact Agent
        </Button>
      </div>
    </div>
  );
}

