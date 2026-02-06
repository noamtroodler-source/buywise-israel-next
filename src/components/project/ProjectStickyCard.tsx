import { MessageCircle, Mail, Phone, Building, Shield, CheckCircle, User, TrendingUp, BookOpen, ChevronDown, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useFormatPrice } from '@/contexts/PreferencesContext';
import { Project, Developer, ProjectUnit } from '@/types/projects';
import { useProjectInquiryTracking } from '@/hooks/useProjectInquiryTracking';
import { buildWhatsAppUrl, openWhatsApp } from '@/lib/whatsapp';

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
  const { mutate: trackInquiry } = useProjectInquiryTracking();

  const displayPrice = selectedUnit?.price || project.price_from;

  const handleContactClick = () => {
    if (onContactClick) {
      onContactClick();
    } else {
      const section = document.getElementById('developer-section');
      section?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Build WhatsApp URLs using the helper
  const developerWhatsappUrl = developer?.phone 
    ? buildWhatsAppUrl(developer.phone, `Hi, I'm interested in ${project.name}`)
    : '';

  const agentWhatsappUrl = representingAgent?.phone 
    ? buildWhatsAppUrl(representingAgent.phone, `Hi ${representingAgent.name}, I'm interested in ${project.name}`)
    : '';

  // Track inquiry helpers
  const handleWhatsAppClick = (source: 'developer' | 'agent') => {
    if (developer) {
      trackInquiry({
        projectId: project.id,
        developerId: developer.id,
        inquiryType: 'whatsapp',
        projectName: project.name,
      });
    }
    const url = source === 'agent' ? agentWhatsappUrl : developerWhatsappUrl;
    openWhatsApp(url);
  };


  const handleEmailClick = (source: 'developer' | 'agent') => {
    if (developer) {
      trackInquiry({
        projectId: project.id,
        developerId: developer.id,
        inquiryType: 'email',
        projectName: project.name,
      });
    }
  };

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
              {representingAgent?.is_verified && (
              <Shield className="h-4 w-4 text-primary flex-shrink-0" />
            )}
          </div>
          {representingAgent?.agency_name && (
            <p className="text-sm text-muted-foreground truncate">
              {representingAgent.agency_name}
            </p>
          )}
          <p className="text-xs text-muted-foreground">Sales Representative</p>
        </div>
      </div>
      <div className="space-y-2">
        {agentWhatsappUrl && (
          <Button 
            className="w-full" 
            size="lg" 
            onClick={() => handleWhatsAppClick('agent')}
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            WhatsApp Agent
          </Button>
        )}
        <div className="grid grid-cols-2 gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            asChild
            className="col-span-2"
            onClick={() => handleEmailClick('agent')}
          >
            <a href={`mailto:${representingAgent?.email}`}>
              <Mail className="h-4 w-4 mr-1.5" />
              Email Agent
            </a>
          </Button>
        </div>
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
        {developerWhatsappUrl && (
          <Button 
            className="w-full" 
            size="lg" 
            onClick={() => handleWhatsAppClick('developer')}
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            WhatsApp Developer
          </Button>
        )}
        <Button 
          variant="outline" 
          size="sm"
          className="w-full"
          onClick={() => {
            handleEmailClick('developer');
            handleContactClick();
          }}
        >
          <Mail className="h-4 w-4 mr-1.5" />
          Email Developer
        </Button>
      </div>
    </div>
  );

  return (
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

          <Separator />

          {/* Buyer Protections */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Buyer Protections</h4>
            <div className="space-y-1.5">
              {buyerProtections.map((protection, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                  <span>{protection}</span>
                </div>
              ))}
            </div>
          </div>

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
  );
}

// Mobile Contact Bar
interface MobileContactBarProps {
  project: Project;
  developer?: Developer | null;
  representingAgent?: RepresentingAgent | null;
}

export function ProjectMobileContactBar({ project, developer, representingAgent }: MobileContactBarProps) {
  const { mutate: trackInquiry } = useProjectInquiryTracking();
  
  // Prioritize agent contact if assigned
  const primaryPhone = representingAgent?.phone || developer?.phone;
  
  const whatsappUrl = primaryPhone 
    ? buildWhatsAppUrl(primaryPhone, `Hi${representingAgent ? ` ${representingAgent.name}` : ''}, I'm interested in ${project.name}`)
    : '';

  const handleWhatsAppClick = () => {
    if (developer) {
      trackInquiry({
        projectId: project.id,
        developerId: developer.id,
        inquiryType: 'whatsapp',
        projectName: project.name,
      });
    }
    openWhatsApp(whatsappUrl);
  };


  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-sm border-t border-border lg:hidden z-50">
      <div className="max-w-lg mx-auto space-y-2">
        <div className="flex gap-3">
          {whatsappUrl ? (
            <Button className="flex-1" size="lg" onClick={handleWhatsAppClick}>
              <MessageCircle className="h-4 w-4 mr-2" />
              {representingAgent ? 'WhatsApp Agent' : 'WhatsApp'}
            </Button>
          ) : (
            <Button className="flex-1" size="lg">
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
  );
}
