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
  onContactClick?: () => void;
}

export function StickyContactCard({ agent, propertyTitle, className = '', onContactClick }: StickyContactCardProps) {
  const handleContactClick = () => {
    if (onContactClick) {
      onContactClick();
    } else {
      // Scroll to agent section
      const agentSection = document.getElementById('agent-contact-section');
      if (agentSection) {
        agentSection.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className={className}
    >
      <Card className="shadow-lg border-border">
        <CardContent className="p-6 space-y-4">
          <Button 
            className="w-full" 
            size="lg"
            onClick={handleContactClick}
          >
            Contact agent
          </Button>
          
          {agent && (
            <p className="text-center text-sm text-muted-foreground">
              {agent.name}{agent.agency_name && ` • ${agent.agency_name}`}
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Mobile version - fixed bottom bar
export function MobileContactBar({ agent, propertyTitle }: StickyContactCardProps) {
  const handleContactClick = () => {
    const agentSection = document.getElementById('agent-contact-section');
    if (agentSection) {
      agentSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border p-4 z-50 md:hidden">
      <div className="max-w-lg mx-auto">
        <Button 
          className="w-full" 
          size="lg"
          onClick={handleContactClick}
        >
          Contact agent
        </Button>
      </div>
    </div>
  );
}
