import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { MessageCircle, Phone, Mail, Clock, TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { motion } from 'framer-motion';
import { useFormatPricePerArea } from '@/contexts/PreferencesContext';

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
  // Quick facts data
  pricePerSqm?: number;
  daysOnMarket?: number;
  cityAvgPricePerSqm?: number;
  currency?: string;
}

export function StickyContactCard({ 
  agent, 
  propertyTitle, 
  className = '', 
  onContactClick,
  pricePerSqm,
  daysOnMarket,
  cityAvgPricePerSqm,
  currency = 'ILS'
}: StickyContactCardProps) {
  const formatPricePerArea = useFormatPricePerArea();

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleWhatsApp = () => {
    if (agent?.phone) {
      const cleanPhone = agent.phone.replace(/\D/g, '');
      const message = encodeURIComponent(`Hi, I'm interested in: ${propertyTitle}`);
      window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
    }
  };

  const handleCall = () => {
    if (agent?.phone) {
      window.location.href = `tel:${agent.phone}`;
    }
  };

  const handleEmail = () => {
    if (agent?.email) {
      const subject = encodeURIComponent(`Inquiry: ${propertyTitle}`);
      window.location.href = `mailto:${agent.email}?subject=${subject}`;
    }
  };

  // Calculate comparison to city average
  const getComparisonInfo = () => {
    if (!pricePerSqm || !cityAvgPricePerSqm) return null;
    const diff = ((pricePerSqm - cityAvgPricePerSqm) / cityAvgPricePerSqm) * 100;
    const absDiff = Math.abs(diff);
    
    if (absDiff < 2) {
      return { label: 'At market average', icon: Minus, className: 'text-muted-foreground' };
    } else if (diff < 0) {
      return { label: `${absDiff.toFixed(0)}% below avg`, icon: TrendingDown, className: 'text-primary' };
    } else {
      return { label: `${absDiff.toFixed(0)}% above avg`, icon: TrendingUp, className: 'text-muted-foreground' };
    }
  };

  const comparison = getComparisonInfo();

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
              <Avatar className="h-12 w-12 border-2 border-background">
                <AvatarImage src={agent.avatar_url || undefined} alt={agent.name} />
                <AvatarFallback className="bg-primary/10 text-primary font-medium">
                  {getInitials(agent.name)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="font-semibold text-foreground truncate">{agent.name}</p>
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
          {agent?.phone && (
            <Button 
              className="w-full gap-2" 
              size="lg"
              onClick={handleWhatsApp}
            >
              <MessageCircle className="h-5 w-5" />
              WhatsApp
            </Button>
          )}
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="flex-1 gap-1.5"
              onClick={handleCall}
              disabled={!agent?.phone}
            >
              <Phone className="h-4 w-4" />
              Call
            </Button>
            <Button 
              variant="outline" 
              className="flex-1 gap-1.5"
              onClick={handleEmail}
              disabled={!agent?.email}
            >
              <Mail className="h-4 w-4" />
              Email
            </Button>
          </div>
          
          {agent && (
            <p className="text-xs text-center text-muted-foreground flex items-center justify-center gap-1">
              <Clock className="h-3 w-3" />
              Usually responds within 2 hours
            </p>
          )}

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

        {/* Quick Facts */}
        {(pricePerSqm || daysOnMarket !== undefined || comparison) && (
          <>
            <Separator />
            <div className="p-5 space-y-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Quick Facts</p>
              
              <div className="space-y-2.5">
                {pricePerSqm && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Price per m²</span>
                    <span className="font-medium">{formatPricePerArea(pricePerSqm, currency)}</span>
                  </div>
                )}
                
                {daysOnMarket !== undefined && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Days on market</span>
                    <span className="font-medium">{daysOnMarket === 0 ? 'Today' : daysOnMarket}</span>
                  </div>
                )}
                
                {comparison && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">vs City average</span>
                    <span className={`font-medium flex items-center gap-1 ${comparison.className}`}>
                      <comparison.icon className="h-3.5 w-3.5" />
                      {comparison.label}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </Card>
    </motion.div>
  );
}

// Mobile version - fixed bottom bar
export function MobileContactBar({ agent, propertyTitle }: { agent?: Agent | null; propertyTitle: string }) {
  const handleWhatsApp = () => {
    if (agent?.phone) {
      const cleanPhone = agent.phone.replace(/\D/g, '');
      const message = encodeURIComponent(`Hi, I'm interested in: ${propertyTitle}`);
      window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
    }
  };

  const handleContact = () => {
    if (agent?.phone) {
      handleWhatsApp();
    } else {
      const agentSection = document.getElementById('agent-contact-section');
      if (agentSection) {
        agentSection.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border p-4 z-50 md:hidden">
      <div className="max-w-lg mx-auto flex gap-2">
        <Button 
          className="flex-1 gap-2" 
          size="lg"
          onClick={handleContact}
        >
          <MessageCircle className="h-5 w-5" />
          {agent?.phone ? 'WhatsApp' : 'Contact Agent'}
        </Button>
        {agent?.phone && (
          <Button 
            variant="outline" 
            size="lg"
            onClick={() => window.location.href = `tel:${agent.phone}`}
          >
            <Phone className="h-5 w-5" />
          </Button>
        )}
      </div>
    </div>
  );
}
