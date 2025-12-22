import { Phone, MessageCircle, Calendar, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';

interface Agent {
  name: string;
  agency_name: string | null;
  phone?: string | null;
  email?: string;
  avatar_url?: string | null;
}

interface StickyContactCardProps {
  agent?: Agent | null;
  propertyTitle: string;
  className?: string;
}

export function StickyContactCard({ agent, propertyTitle, className = '' }: StickyContactCardProps) {
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
      <Card className={`${className}`}>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">No agent assigned to this property.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className={className}
    >
      <Card className="shadow-lg border-border">
        <CardContent className="p-6 space-y-5">
          <h3 className="font-semibold text-lg text-foreground">Contact Agent</h3>
          
          {/* Agent Info */}
          <div className="flex items-center gap-3">
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

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button 
              className="w-full gap-2" 
              size="lg"
              onClick={handleWhatsApp}
              disabled={!agent.phone}
            >
              <MessageCircle className="h-5 w-5" />
              WhatsApp
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full gap-2" 
              size="lg"
              onClick={handleCall}
              disabled={!agent.phone}
            >
              <Phone className="h-5 w-5" />
              Call Agent
            </Button>

            <Button 
              variant="outline" 
              className="w-full gap-2" 
              size="lg"
              onClick={handleEmail}
              disabled={!agent.email}
            >
              <Mail className="h-5 w-5" />
              Send Email
            </Button>

            <Button 
              variant="ghost" 
              className="w-full gap-2 text-muted-foreground hover:text-foreground" 
              size="lg"
            >
              <Calendar className="h-5 w-5" />
              Schedule a Tour
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Mobile version - fixed bottom bar
export function MobileContactBar({ agent, propertyTitle }: StickyContactCardProps) {
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

  if (!agent) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border p-4 z-50 md:hidden">
      <div className="flex gap-3 max-w-lg mx-auto">
        <Button 
          className="flex-1 gap-2" 
          onClick={handleWhatsApp}
          disabled={!agent.phone}
        >
          <MessageCircle className="h-4 w-4" />
          WhatsApp
        </Button>
        <Button 
          variant="outline" 
          className="flex-1 gap-2"
          onClick={handleCall}
          disabled={!agent.phone}
        >
          <Phone className="h-4 w-4" />
          Call
        </Button>
      </div>
    </div>
  );
}
