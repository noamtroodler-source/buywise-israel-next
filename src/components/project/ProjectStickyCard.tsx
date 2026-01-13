import { MessageCircle, Mail, Phone, Building, Shield, Clock, CheckCircle, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useFormatPrice } from '@/contexts/PreferencesContext';
import { Project, Developer, ProjectUnit } from '@/types/projects';

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

  const displayPrice = selectedUnit?.price || project.price_from;

  const handleContactClick = () => {
    if (onContactClick) {
      onContactClick();
    } else {
      const section = document.getElementById('developer-section');
      section?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Calculate months to completion
  const monthsToCompletion = project.completion_date 
    ? Math.max(0, Math.ceil((new Date(project.completion_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30)))
    : null;

  const developerWhatsappUrl = developer?.phone 
    ? `https://wa.me/${developer.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hi, I'm interested in ${project.name}`)}`
    : null;

  const agentWhatsappUrl = representingAgent?.phone 
    ? `https://wa.me/${representingAgent.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hi ${representingAgent.name}, I'm interested in ${project.name}`)}`
    : null;

  const quickFacts = [
    { 
      label: 'Starting from', 
      value: formatPrice(displayPrice || 0, project.currency || 'ILS') 
    },
    { 
      label: 'Completion', 
      value: project.completion_date 
        ? new Date(project.completion_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
        : 'TBD'
    },
    { 
      label: 'Units remaining', 
      value: project.available_units 
        ? `${project.available_units} of ${project.total_units || '—'}` 
        : `${project.total_units || '—'} total`
    },
  ];

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
            <span className="font-semibold truncate">{representingAgent?.name}</span>
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
          <Button className="w-full" size="lg" asChild>
            <a href={agentWhatsappUrl} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="h-4 w-4 mr-2" />
              WhatsApp Agent
            </a>
          </Button>
        )}
        <div className="grid grid-cols-2 gap-2">
          {representingAgent?.phone && (
            <Button variant="outline" size="sm" asChild>
              <a href={`tel:${representingAgent.phone}`}>
                <Phone className="h-4 w-4 mr-1.5" />
                Call
              </a>
            </Button>
          )}
          <Button 
            variant="outline" 
            size="sm" 
            asChild
            className={representingAgent?.phone ? '' : 'col-span-2'}
          >
            <a href={`mailto:${representingAgent?.email}`}>
              <Mail className="h-4 w-4 mr-1.5" />
              Email
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
                className="font-semibold truncate hover:text-primary transition-colors"
              >
                {developer.name}
              </Link>
              {developer.is_verified && (
                <Shield className="h-4 w-4 text-primary flex-shrink-0" />
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {developer.total_projects || 0} Projects
            </p>
          </div>
        </div>
      )}
      <div className="space-y-2">
        {developerWhatsappUrl && (
          <Button className="w-full" size="lg" asChild>
            <a href={developerWhatsappUrl} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="h-4 w-4 mr-2" />
              WhatsApp Developer
            </a>
          </Button>
        )}
        <div className="grid grid-cols-2 gap-2">
          {developer?.phone && (
            <Button variant="outline" size="sm" asChild>
              <a href={`tel:${developer.phone}`}>
                <Phone className="h-4 w-4 mr-1.5" />
                Call
              </a>
            </Button>
          )}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleContactClick}
            className={developer?.phone ? '' : 'col-span-2'}
          >
            <Mail className="h-4 w-4 mr-1.5" />
            Email
          </Button>
        </div>
        {developer && (
          <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1">
            <Clock className="h-3 w-3" />
            Usually responds within 24 hours
          </p>
        )}
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

          {/* Quick Facts */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Quick Facts</h4>
            <div className="space-y-2">
              {quickFacts.map((fact, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{fact.label}</span>
                  <span className="font-medium">{fact.value}</span>
                </div>
              ))}
              {monthsToCompletion !== null && monthsToCompletion > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Time to delivery</span>
                  <span className="font-medium">~{monthsToCompletion} months</span>
                </div>
              )}
            </div>
          </div>

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
  // Prioritize agent contact if assigned
  const primaryContact = representingAgent || developer;
  const primaryPhone = representingAgent?.phone || developer?.phone;
  const primaryName = representingAgent?.name || developer?.name || 'the team';
  
  const whatsappUrl = primaryPhone 
    ? `https://wa.me/${primaryPhone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hi${representingAgent ? ` ${representingAgent.name}` : ''}, I'm interested in ${project.name}`)}`
    : null;

  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-sm border-t border-border lg:hidden z-50">
      <div className="flex gap-3 max-w-lg mx-auto">
        {whatsappUrl ? (
          <Button className="flex-1" size="lg" asChild>
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="h-4 w-4 mr-2" />
              {representingAgent ? 'WhatsApp Agent' : 'WhatsApp'}
            </a>
          </Button>
        ) : (
          <Button className="flex-1" size="lg">
            <Mail className="h-4 w-4 mr-2" />
            Request Info
          </Button>
        )}
        {primaryPhone && (
          <Button variant="outline" size="lg" asChild>
            <a href={`tel:${primaryPhone}`}>
              <Phone className="h-4 w-4" />
            </a>
          </Button>
        )}
      </div>
    </div>
  );
}
