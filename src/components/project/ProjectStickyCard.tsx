import { MessageCircle, Mail, Phone, Building, Shield, Clock, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useFormatPrice } from '@/contexts/PreferencesContext';
import { Project, Developer, ProjectUnit } from '@/types/projects';

interface ProjectStickyCardProps {
  project: Project;
  developer?: Developer | null;
  selectedUnit?: ProjectUnit | null;
  onContactClick?: () => void;
}

export function ProjectStickyCard({ project, developer, selectedUnit, onContactClick }: ProjectStickyCardProps) {
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

  const whatsappUrl = developer?.phone 
    ? `https://wa.me/${developer.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hi, I'm interested in ${project.name}`)}`
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <Card className="shadow-lg border-primary/10">
        <CardContent className="p-5 space-y-4">
          {/* Developer Header */}
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

          <Separator />

          {/* Contact Buttons */}
          <div className="space-y-2">
            {whatsappUrl && (
              <Button className="w-full" size="lg" asChild>
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
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
export function ProjectMobileContactBar({ project, developer }: { project: Project; developer?: Developer | null }) {
  const whatsappUrl = developer?.phone 
    ? `https://wa.me/${developer.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hi, I'm interested in ${project.name}`)}`
    : null;

  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-sm border-t border-border lg:hidden z-50">
      <div className="flex gap-3 max-w-lg mx-auto">
        {whatsappUrl ? (
          <Button className="flex-1" size="lg" asChild>
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="h-4 w-4 mr-2" />
              WhatsApp
            </a>
          </Button>
        ) : (
          <Button className="flex-1" size="lg">
            <Mail className="h-4 w-4 mr-2" />
            Request Info
          </Button>
        )}
        {developer?.phone && (
          <Button variant="outline" size="lg" asChild>
            <a href={`tel:${developer.phone}`}>
              <Phone className="h-4 w-4" />
            </a>
          </Button>
        )}
      </div>
    </div>
  );
}
