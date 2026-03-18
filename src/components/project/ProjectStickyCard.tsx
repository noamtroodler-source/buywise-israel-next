import { useState } from 'react';
import { MessageCircle, Mail, Phone, Building, Shield, CheckCircle, User, TrendingUp, BookOpen, ChevronDown, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useFormatPrice } from '@/contexts/PreferencesContext';
import { Project, Developer, ProjectUnit } from '@/types/projects';
import { useProjectInquiryTracking } from '@/hooks/useProjectInquiryTracking';
import { buildWhatsAppUrl, openWhatsApp } from '@/lib/whatsapp';
import { InquiryModal, InquiryChannel, InquiryFormData } from '@/components/shared/InquiryModal';
import { trackProjectInquiry } from '@/hooks/useProjectInquiryTracking';
import { useAuth } from '@/hooks/useAuth';

interface RepresentingAgent {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  agency_name: string | null;
  is_verified: boolean | null;
}

interface ProjectStickyCardProps {
  project: Project;
  developer?: Developer | null;
  representingAgent?: RepresentingAgent | null;
  selectedUnit?: ProjectUnit | null;
  onContactClick?: () => void;
}

export function ProjectStickyCard({ project, developer, representingAgent, selectedUnit, onContactClick }: ProjectStickyCardProps) {
  const formatPrice = useFormatPrice();
  const { user } = useAuth();
  const [inquiryChannel, setInquiryChannel] = useState<InquiryChannel | null>(null);
  const [inquiryTarget, setInquiryTarget] = useState<'agent' | 'developer'>('agent');

  const displayPrice = selectedUnit?.price || project.price_from;

  const handleContactClick = () => {
    if (onContactClick) {
      onContactClick();
    } else {
      const section = document.getElementById('developer-section');
      section?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const openInquiryModal = (channel: InquiryChannel, target: 'agent' | 'developer') => {
    setInquiryTarget(target);
    setInquiryChannel(channel);
  };

  const handleInquirySubmit = (data: InquiryFormData) => {
    const channel = inquiryChannel!;
    const target = inquiryTarget;
    setInquiryChannel(null);

    if (developer) {
      trackProjectInquiry({
        projectId: project.id,
        developerId: developer.id,
        inquiryType: channel,
        projectName: project.name,
        userId: user?.id,
        name: data.name,
        email: data.email,
        phone: data.phone,
        message: data.message,
        buyerContextSnapshot: data.buyerContextSnapshot,
      });
    }

    if (channel === 'whatsapp') {
      const phone = target === 'agent' ? representingAgent?.phone : developer?.phone;
      if (phone) {
        const msg = data.message || `Hi, I'm interested in ${project.name}`;
        const url = buildWhatsAppUrl(phone, msg);
        openWhatsApp(url);
      }
    } else if (channel === 'email') {
      const email = target === 'agent' ? representingAgent?.email : developer?.email;
      if (email) {
        const subject = encodeURIComponent(`Inquiry about ${project.name}`);
        const body = encodeURIComponent(data.message || '');
        window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
      }
    }
  };

  const contactName = inquiryTarget === 'agent' 
    ? (representingAgent?.name || 'the agent')
    : (developer?.name || 'the developer');

  const buyerProtections = [
    'Bank guarantee (Law of Sale)',
    'Fixed payment schedule',
    '1-year warranty on delivery',
  ];

  // Agent Contact Section
  const AgentContactSection = () => (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <Avatar className="h-12 w-12">
          <AvatarImage src={representingAgent?.avatar_url || undefined} alt={representingAgent?.name} />
          <AvatarFallback className="bg-primary/10">
            <User className="h-6 w-6 text-primary" />
          </AvatarFallback>
        </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              {representingAgent?.id ? (
                <Link 
                  to={`/agents/${representingAgent.id}`}
                  className="font-semibold truncate hover:text-primary hover:underline transition-colors inline-flex items-center gap-1"
                >
                  {representingAgent?.name}
                  <ChevronRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                </Link>
              ) : (
                <span className="font-semibold truncate">{representingAgent?.name}</span>
              )}
          </div>
          {representingAgent?.agency_name && (
            <p className="text-sm text-muted-foreground truncate">
              {representingAgent.agency_name}
            </p>
          )}
        </div>
      </div>
      <div className="space-y-2">
        {representingAgent?.phone && (
          <Button 
            className="w-full" 
            size="lg" 
            onClick={() => openInquiryModal('whatsapp', 'agent')}
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            WhatsApp Agent
          </Button>
        )}
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full"
          onClick={() => openInquiryModal('email', 'agent')}
        >
          <Mail className="h-4 w-4 mr-1.5" />
          Email Agent
        </Button>
      </div>
    </div>
  );

  // Developer Contact Section
  const DeveloperContactSection = () => (
    <div className="space-y-3">
      {developer && (
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12 rounded-lg">
            <AvatarImage src={developer.logo_url || undefined} alt={developer.name} className="object-contain" />
            <AvatarFallback className="rounded-lg bg-primary/10">
              <Building className="h-6 w-6 text-primary" />
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <Link 
                to={`/developers/${developer.slug}`}
                className="font-semibold truncate hover:text-primary transition-colors inline-flex items-center gap-1"
              >
                {developer.name}
                <ChevronRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
              </Link>
            </div>
            <p className="text-sm text-muted-foreground">
              {developer.total_projects || 0} Projects
            </p>
          </div>
        </div>
      )}
      <div className="space-y-2">
        {developer?.phone && (
          <Button 
            className="w-full" 
            size="lg" 
            onClick={() => openInquiryModal('whatsapp', 'developer')}
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            WhatsApp Developer
          </Button>
        )}
        <Button 
          variant="outline" 
          size="sm"
          className="w-full"
          onClick={() => openInquiryModal('email', 'developer')}
        >
          <Mail className="h-4 w-4 mr-1.5" />
          Email Developer
        </Button>
      </div>
    </div>
  );

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="shadow-lg border-primary/10">
          <CardContent className="p-5 space-y-4">

            {/* Contact Section - Tabbed if both agent and developer exist */}
            {representingAgent ? (
              <Tabs defaultValue="agent" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="agent" className="text-xs">Sales Agent</TabsTrigger>
                  <TabsTrigger value="developer" className="text-xs">Developer</TabsTrigger>
                </TabsList>
                <TabsContent value="agent" className="mt-3">
                  <AgentContactSection />
                </TabsContent>
                <TabsContent value="developer" className="mt-3">
                  <DeveloperContactSection />
                </TabsContent>
              </Tabs>
            ) : (
              <DeveloperContactSection />
            )}


            {/* Permission to Slow Down */}
            <div className="pt-3 border-t border-border/50 mt-3">
              <p className="text-xs text-muted-foreground text-center mb-2">
                Not ready to reach out?
              </p>
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full text-xs" 
                asChild
              >
                <Link to="/guides/new-vs-resale">
                  <BookOpen className="h-3.5 w-3.5 mr-1" />
                  Read the new-build guide first
                </Link>
              </Button>
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
          agentName={contactName}
          propertyTitle={project.name}
          onSubmit={handleInquirySubmit}
        />
      )}
    </>
  );
}

// Mobile Contact Bar
interface MobileContactBarProps {
  project: Project;
  developer?: Developer | null;
  representingAgent?: RepresentingAgent | null;
}

export function ProjectMobileContactBar({ project, developer, representingAgent }: MobileContactBarProps) {
  const { user } = useAuth();
  const [inquiryChannel, setInquiryChannel] = useState<InquiryChannel | null>(null);
  
  const primaryPhone = representingAgent?.phone || developer?.phone;
  const contactName = representingAgent?.name || developer?.name || 'the developer';

  const handleInquirySubmit = (data: InquiryFormData) => {
    const channel = inquiryChannel!;
    setInquiryChannel(null);

    if (developer) {
      trackProjectInquiry({
        projectId: project.id,
        developerId: developer.id,
        inquiryType: channel,
        projectName: project.name,
        userId: user?.id,
        name: data.name,
        email: data.email,
        phone: data.phone,
        message: data.message,
        buyerContextSnapshot: data.buyerContextSnapshot,
      });
    }

    if (channel === 'whatsapp' && primaryPhone) {
      const msg = data.message || `Hi${representingAgent ? ` ${representingAgent.name}` : ''}, I'm interested in ${project.name}`;
      const url = buildWhatsAppUrl(primaryPhone, msg);
      openWhatsApp(url);
    }
  };

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-sm border-t border-border lg:hidden z-50">
        <div className="max-w-lg mx-auto space-y-2">
          <div className="flex gap-3">
            {primaryPhone ? (
              <Button className="flex-1" size="lg" onClick={() => setInquiryChannel('whatsapp')}>
                <MessageCircle className="h-4 w-4 mr-2" />
                {representingAgent ? 'WhatsApp Agent' : 'WhatsApp'}
              </Button>
            ) : (
              <Button className="flex-1" size="lg" onClick={() => setInquiryChannel('email')}>
                <Mail className="h-4 w-4 mr-2" />
                Request Info
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
            <CollapsibleContent className="pt-2">
              <Button variant="outline" size="sm" className="w-full" asChild>
                <Link to="/guides/new-vs-resale">
                  Read the new-build guide first
                </Link>
              </Button>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </div>

      {/* Inquiry Modal */}
      {inquiryChannel && (
        <InquiryModal
          isOpen={true}
          onClose={() => setInquiryChannel(null)}
          channel={inquiryChannel}
          agentName={contactName}
          propertyTitle={project.name}
          onSubmit={handleInquirySubmit}
        />
      )}
    </>
  );
}
