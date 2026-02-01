import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { MessageCircle, Mail, Share2, Heart, BookOpen, ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';
import { trackInquiry } from '@/hooks/useInquiryTracking';
import { useAuth } from '@/hooks/useAuth';
import { buildWhatsAppUrl, openWhatsApp } from '@/lib/whatsapp';
import { cn } from '@/lib/utils';

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
  onSave?: () => void;
  isSaved?: boolean;
}

export function StickyContactCard({ 
  agent, 
  propertyId,
  propertyTitle, 
  className = '', 
  onContactClick,
  onSave,
  isSaved,
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
              <Avatar className="h-16 w-16 ring-2 ring-border">
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

          {/* Permission to Slow Down */}
          <div className="pt-3 border-t border-border/50 mt-3">
            <p className="text-xs text-muted-foreground text-center mb-2">
              Not ready to reach out?
            </p>
            <div className="flex gap-2">
              {onSave && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="flex-1 text-xs" 
                  onClick={onSave}
                >
                  <Heart className={cn("h-3.5 w-3.5 mr-1", isSaved && "fill-primary text-primary")} />
                  {isSaved ? 'Saved' : 'Save'}
                </Button>
              )}
              <Button 
                variant="ghost" 
                size="sm" 
                className={cn("text-xs", onSave ? "flex-1" : "w-full")} 
                asChild
              >
                <Link to="/guides/talking-to-professionals">
                  <BookOpen className="h-3.5 w-3.5 mr-1" />
                  Prepare first
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Mobile version - fixed bottom bar with enhanced actions
interface MobileContactBarProps {
  agent?: Agent | null;
  propertyId?: string;
  propertyTitle: string;
  price?: number;
  isSaved?: boolean;
  onSave?: () => void;
  onShare?: () => void;
}

export function MobileContactBar({ 
  agent, 
  propertyId, 
  propertyTitle,
  price,
  isSaved,
  onSave,
  onShare,
}: MobileContactBarProps) {
  const { user } = useAuth();
  const [isVisible, setIsVisible] = useState(false);

  const whatsappMessage = `Hi, I'm interested in: ${propertyTitle}`;
  const whatsappUrl = agent?.phone 
    ? buildWhatsAppUrl(agent.phone, whatsappMessage)
    : '';

  // Show bar after scrolling past hero section
  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

  const formatCompactPrice = (value: number) => {
    if (value >= 1000000) {
      return `₪${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `₪${Math.round(value / 1000)}K`;
    }
    return `₪${value}`;
  };

  return (
    <motion.div 
      initial={{ y: 100, opacity: 0 }}
      animate={{ 
        y: isVisible ? 0 : 100, 
        opacity: isVisible ? 1 : 0 
      }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border px-4 py-3 z-50 md:hidden pb-safe"
    >
      <div className="max-w-lg mx-auto space-y-2">
        {/* Price display */}
        {price && (
          <div className="text-center">
            <span className="text-lg font-bold text-foreground">{formatCompactPrice(price)}</span>
          </div>
        )}
        
        {/* Action buttons row */}
        <div className="flex items-center gap-2">
          {/* Share button */}
          {onShare && (
            <Button 
              variant="outline" 
              size="icon"
              onClick={onShare}
              className="flex-shrink-0"
            >
              <Share2 className="h-4 w-4" />
            </Button>
          )}
          
          {/* Save button */}
          {onSave && (
            <Button 
              variant="outline" 
              size="icon"
              onClick={onSave}
              className="flex-shrink-0"
            >
              <Heart className={cn("h-4 w-4", isSaved && "fill-primary text-primary")} />
            </Button>
          )}
          
          {/* Main CTA */}
          {agent?.phone && whatsappUrl ? (
            <Button 
              className="flex-1 gap-2" 
              size="lg"
              onClick={handleWhatsAppClick}
            >
              <MessageCircle className="h-5 w-5" />
              WhatsApp
            </Button>
          ) : (
            <Button 
              className="flex-1 gap-2" 
              size="lg"
              onClick={handleScrollToContact}
            >
              <MessageCircle className="h-5 w-5" />
              Contact Agent
            </Button>
          )}
        </div>

        {/* Permission to Slow Down - Collapsible */}
        <Collapsible>
          <CollapsibleTrigger className="w-full text-center py-1">
            <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
              Not ready? That's okay
              <ChevronDown className="h-3 w-3" />
            </span>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2 space-y-2">
            <p className="text-xs text-muted-foreground text-center">
              Take your time. There's no rush.
            </p>
            <div className="flex gap-2">
              {onSave && (
                <Button variant="outline" size="sm" className="flex-1" onClick={onSave}>
                  Save for later
                </Button>
              )}
              <Button variant="outline" size="sm" className={cn(onSave ? "flex-1" : "w-full")} asChild>
                <Link to="/guides/talking-to-professionals">
                  Prepare first
                </Link>
              </Button>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </motion.div>
  );
}

