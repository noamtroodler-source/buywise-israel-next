import { Phone, MessageCircle, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface Agent {
  name: string;
  agency_name: string | null;
  phone?: string | null;
  email?: string;
  avatar_url?: string | null;
}

interface AgentContactSectionProps {
  agent?: Agent | null;
  propertyTitle: string;
}

export function AgentContactSection({ agent, propertyTitle }: AgentContactSectionProps) {
  const handleWhatsApp = () => {
    if (agent?.phone) {
      const message = encodeURIComponent(`Hi, I'm interested in the property: ${propertyTitle}`);
      window.open(`https://wa.me/${agent.phone.replace(/\D/g, '')}?text=${message}`, '_blank');
    }
  };

  const handleCall = () => {
    if (agent?.phone) {
      window.open(`tel:${agent.phone}`, '_self');
    }
  };

  const handleEmail = () => {
    if (agent?.email) {
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
            {agent.avatar_url ? (
              <img 
                src={agent.avatar_url} 
                alt={agent.name}
                className="h-14 w-14 rounded-full object-cover"
              />
            ) : (
              <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xl font-bold">
                {agent.name.charAt(0)}
              </div>
            )}
            <div>
              <p className="font-semibold text-foreground">{agent.name}</p>
              {agent.agency_name && (
                <p className="text-sm text-muted-foreground">{agent.agency_name}</p>
              )}
            </div>
          </div>

          {/* Contact Buttons */}
          <div className="flex gap-2 flex-wrap sm:flex-nowrap">
            <Button 
              className="gap-2 flex-1 sm:flex-initial" 
              onClick={handleWhatsApp}
              disabled={!agent.phone}
            >
              <MessageCircle className="h-4 w-4" />
              WhatsApp
            </Button>
            
            <Button 
              variant="outline" 
              className="gap-2 flex-1 sm:flex-initial"
              onClick={handleCall}
              disabled={!agent.phone}
            >
              <Phone className="h-4 w-4" />
              Call
            </Button>

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
