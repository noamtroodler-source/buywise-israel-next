import { Link } from 'react-router-dom';
import { MessageCircle, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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

interface AgentContactSectionProps {
  agent?: Agent | null;
  propertyTitle: string;
  propertyId?: string;
}

export function AgentContactSection({ agent, propertyTitle, propertyId }: AgentContactSectionProps) {
  const { user } = useAuth();

  const whatsappUrl = agent?.phone 
    ? buildWhatsAppUrl(agent.phone, `Hi, I'm interested in the property: ${propertyTitle}`)
    : '';

  const handleWhatsAppClick = () => {
    if (propertyId && agent?.id) {
      trackInquiry({
        propertyId,
        agentId: agent.id,
        inquiryType: 'whatsapp',
        propertyTitle,
        userId: user?.id,
      });
    }

    openWhatsApp(whatsappUrl);
  };

  const handleEmail = () => {
    if (agent?.email) {
      // Track inquiry
      if (propertyId && agent.id) {
        trackInquiry({
          propertyId,
          agentId: agent.id,
          inquiryType: 'email',
          propertyTitle,
          userId: user?.id,
        });
      }
      const subject = encodeURIComponent(`Inquiry about: ${propertyTitle}`);
      window.open(`mailto:${agent.email}?subject=${subject}`, '_self');
    }
  };

  if (!agent) {
    return (
      <Card id="agent-contact-section">
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">No agent assigned to this property.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card id="agent-contact-section" className="border-border">
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          {/* Agent Info */}
          <div className="flex items-center gap-3 flex-1">
            <Avatar className="h-16 w-16 ring-2 ring-primary/20 ring-offset-2 ring-offset-background shadow-md border border-background">
              <AvatarImage 
                src={agent.avatar_url || undefined} 
                alt={agent.name}
                className="object-cover"
              />
              <AvatarFallback className="bg-gradient-to-br from-primary/10 to-primary/20 text-primary font-semibold text-lg">
                {agent.name.charAt(0)}{agent.name.split(' ')[1]?.charAt(0) || ''}
              </AvatarFallback>
            </Avatar>
            <div>
              {agent.id ? (
                <Link 
                  to={`/agents/${agent.id}`} 
                  className="font-semibold text-foreground hover:text-primary hover:underline transition-colors"
                >
                  {agent.name}
                </Link>
              ) : (
                <p className="font-semibold text-foreground">{agent.name}</p>
              )}
              {agent.agency_name && (
                <p className="text-sm text-muted-foreground">{agent.agency_name}</p>
              )}
            </div>
          </div>

          {/* Contact Buttons */}
          <div className="flex gap-2 flex-wrap sm:flex-nowrap">
            {agent.phone && whatsappUrl && (
              <Button 
                className="gap-2 flex-1 sm:flex-initial" 
                onClick={handleWhatsAppClick}
              >
                <MessageCircle className="h-4 w-4" />
                WhatsApp
              </Button>
            )}

            <Button 
              variant="outline" 
              className="gap-2 flex-1 sm:flex-initial"
              onClick={handleEmail}
              disabled={!agent.email}
            >
              <Mail className="h-4 w-4" />
              Email
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

