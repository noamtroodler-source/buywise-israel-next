import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

import { MessageCircle, Mail, Share2, Heart, BookOpen, ChevronRight, ShieldCheck, Users, Building2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { trackInquiry } from '@/hooks/useInquiryTracking';
import { useAuth } from '@/hooks/useAuth';
import { buildWhatsAppUrl, openWhatsApp, getEffectivePhone } from '@/lib/whatsapp';
import { cn } from '@/lib/utils';
import { InquiryModal, InquiryChannel, InquiryFormData } from '@/components/shared/InquiryModal';

interface Agent {
  id?: string;
  name: string;
  agency_name: string | null;
  phone?: string | null;
  email?: string;
  avatar_url?: string | null;
  agency?: {
    id?: string;
    name?: string | null;
    slug?: string | null;
    logo_url?: string | null;
  } | null;
}

interface StickyContactCardProps {
  agent?: Agent | null;
  propertyId?: string;
  propertyTitle: string;
  className?: string;
  onContactClick?: () => void;
  onSave?: () => void;
  isSaved?: boolean;
  isPartner?: boolean; // BuyWise Partner agency
  /** Number of secondary co-listing agencies on the property (excludes primary). */
  coAgentCount?: number;
}

export function StickyContactCard({
  agent,
  propertyId,
  propertyTitle,
  className = '',
  onContactClick,
  onSave,
  isSaved,
  isPartner,
  coAgentCount = 0,
}: StickyContactCardProps) {
  const { user } = useAuth();
  const [inquiryChannel, setInquiryChannel] = useState<InquiryChannel | null>(null);

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const scrollToCoListing = () => {
    const el = document.getElementById('co-listing-agents');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleInquirySubmit = (data: InquiryFormData) => {
    setInquiryChannel(null);

    if (propertyId && agent?.id) {
      trackInquiry({
        propertyId,
        agentId: agent.id,
        inquiryType: inquiryChannel!,
        propertyTitle,
        userId: user?.id,
        name: data.name,
        email: data.email,
        phone: data.phone,
        message: data.message,
        buyerContextSnapshot: data.buyerContextSnapshot,
      });
    }

    if (inquiryChannel === 'whatsapp') {
      const phone = getEffectivePhone(agent?.phone);
      const whatsappMessage = data.message || `Hi, I'm interested in: ${propertyTitle}`;
      const url = buildWhatsAppUrl(phone, whatsappMessage);
      openWhatsApp(url, phone, whatsappMessage);
    } else if (inquiryChannel === 'email' && agent?.email) {
      const subject = encodeURIComponent(`Inquiry: ${propertyTitle}`);
      const body = encodeURIComponent(data.message || '');
      window.location.href = `mailto:${agent.email}?subject=${subject}&body=${body}`;
    }
  };

  const canWhatsApp = true; // Always show WhatsApp - use fallback phone if needed
  const canEmail = !!(agent?.email);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className={className}
      >
        <Card className="shadow-lg border-border overflow-hidden">
          {/* Agent or Agency Header */}
          {agent ? (
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
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <p className="text-xs font-medium text-muted-foreground">Agent</p>
                    {isPartner && (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-semibold">
                        <ShieldCheck className="h-2.5 w-2.5" />
                        BuyWise Partner
                      </span>
                    )}
                  </div>
                  {agent.id ? (
                    <Link
                      to={`/agents/${agent.id}`}
                      className="font-semibold text-foreground truncate hover:text-primary hover:underline transition-colors inline-flex items-center gap-1"
                    >
                      {agent.name}
                      <ChevronRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                    </Link>
                  ) : (
                    <p className="font-semibold text-foreground truncate">{agent.name}</p>
                  )}
                  {agent.agency_name && (
                    <p className="text-sm text-muted-foreground truncate">{agent.agency_name}</p>
                  )}
                  {(() => {
                    const agencyName = agent.agency?.name || agent.agency_name;
                    if (!agencyName) return null;
                    const agencySlug = agent.agency?.slug;
                    const agencyLogo = agent.agency?.logo_url;
                    const inner = (
                      <span className="inline-flex items-center gap-1.5 min-w-0">
                        <Avatar className="h-4 w-4 flex-shrink-0">
                          <AvatarImage src={agencyLogo || undefined} alt={agencyName} />
                          <AvatarFallback className="bg-muted">
                            <Building2 className="h-2.5 w-2.5 text-muted-foreground" />
                          </AvatarFallback>
                        </Avatar>
                        <span className="truncate">{agencyName}</span>
                      </span>
                    );
                    return agencySlug ? (
                      <Link
                        to={`/agencies/${agencySlug}`}
                        className="mt-0.5 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary hover:underline transition-colors max-w-full"
                      >
                        {inner}
                        <ChevronRight className="h-3 w-3 flex-shrink-0" />
                      </Link>
                    ) : (
                      <p className="mt-0.5 text-sm text-muted-foreground truncate">{inner}</p>
                    );
                  })()}
                </div>
              </div>
              <Separator />
            </>
          ) : null}

          {/* Contact Buttons */}
          <CardContent className="p-5 space-y-3">
            {canWhatsApp && (
              <Button 
                className="w-full gap-2" 
                size="lg"
                onClick={() => setInquiryChannel('whatsapp')}
              >
                <MessageCircle className="h-5 w-5" />
                WhatsApp
              </Button>
            )}
            
            {canEmail && (
              <Button 
                variant="outline" 
                className="w-full gap-1.5"
                onClick={() => setInquiryChannel('email')}
              >
                <Mail className="h-4 w-4" />
                Email
              </Button>
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

      {/* Inquiry Modal */}
      {inquiryChannel && (
        <InquiryModal
          isOpen={true}
          onClose={() => setInquiryChannel(null)}
          channel={inquiryChannel}
          agentName={agent?.name || 'the agent'}
          propertyTitle={propertyTitle}
          onSubmit={handleInquirySubmit}
        />
      )}
    </>
  );
}

// Mobile version - fixed bottom bar
interface MobileContactBarProps {
  agent?: Agent | null;
  propertyId?: string;
  propertyTitle: string;
  price?: number;
  isSaved?: boolean;
  onSave?: () => void;
  onShare?: () => void;
  /** Number of secondary co-listing agencies on the property. */
  coAgentCount?: number;
}

export function MobileContactBar({
  agent,
  propertyId,
  propertyTitle,
  price,
  isSaved,
  onSave,
  onShare,
  coAgentCount = 0,
}: MobileContactBarProps) {
  const { user } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [inquiryChannel, setInquiryChannel] = useState<InquiryChannel | null>(null);

  // Show bar after scrolling past hero section
  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleInquirySubmit = (data: InquiryFormData) => {
    const channel = inquiryChannel!;
    setInquiryChannel(null);

    if (propertyId && agent?.id) {
      trackInquiry({
        propertyId,
        agentId: agent.id,
        inquiryType: channel,
        propertyTitle,
        userId: user?.id,
        name: data.name,
        email: data.email,
        phone: data.phone,
        message: data.message,
        buyerContextSnapshot: data.buyerContextSnapshot,
      });
    }

    if (channel === 'whatsapp') {
      const phone = getEffectivePhone(agent?.phone);
      const whatsappMessage = data.message || `Hi, I'm interested in: ${propertyTitle}`;
      const url = buildWhatsAppUrl(phone, whatsappMessage);
      openWhatsApp(url, phone, whatsappMessage);
    }
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

  const canWhatsApp = true; // Always show WhatsApp

  return (
    <>
      <motion.div 
        initial={{ y: 100, opacity: 0 }}
        animate={{ 
          y: isVisible ? 0 : 100, 
          opacity: isVisible ? 1 : 0 
        }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="fixed bottom-16 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border px-4 py-3 z-50 lg:hidden pb-safe"
      >
        <div className="max-w-lg mx-auto space-y-2">
          {price && (
            <div className="text-center">
              <span className="text-lg font-bold text-foreground">{formatCompactPrice(price)}</span>
            </div>
          )}

          <div className="flex items-center gap-2">
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
            
            {canWhatsApp ? (
              <Button 
                className="flex-1 gap-2" 
                size="lg"
                onClick={() => setInquiryChannel('whatsapp')}
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
        </div>
      </motion.div>

      {/* Inquiry Modal */}
      {inquiryChannel && (
        <InquiryModal
          isOpen={true}
          onClose={() => setInquiryChannel(null)}
          channel={inquiryChannel}
          agentName={agent?.name || 'the agent'}
          propertyTitle={propertyTitle}
          onSubmit={handleInquirySubmit}
        />
      )}
    </>
  );
}
