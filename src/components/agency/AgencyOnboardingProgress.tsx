import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle2, Circle, X, ChevronDown, ChevronUp,
  Image, FileText, Phone, Globe, MapPin, Briefcase, Users, Home, Share2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface ChecklistItem {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  isComplete: boolean;
  link?: string;
}

interface AgencyOnboardingProgressProps {
  agency: {
    logo_url: string | null;
    description: string | null;
    phone: string | null;
    website: string | null;
    cities_covered: string[] | null;
    specializations: string[] | null;
    social_links?: {
      linkedin?: string;
      instagram?: string;
      facebook?: string;
    } | null;
  };
  teamCount: number;
  listingsCount?: number;
}

export function AgencyOnboardingProgress({ agency, teamCount, listingsCount = 0 }: AgencyOnboardingProgressProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isDismissed, setIsDismissed] = useState(false);

  // Check local storage for dismissed state
  useEffect(() => {
    const dismissed = localStorage.getItem('agency_onboarding_dismissed');
    if (dismissed === 'true') {
      setIsDismissed(true);
    }
  }, []);

  const checklistItems: ChecklistItem[] = [
    {
      id: 'logo',
      label: 'Upload agency logo',
      description: 'Add a professional logo to build trust',
      icon: Image,
      isComplete: !!agency.logo_url,
      link: '/agency/settings',
    },
    {
      id: 'description',
      label: 'Add description (150+ chars)',
      description: 'Tell clients about your agency',
      icon: FileText,
      isComplete: (agency.description?.length || 0) >= 150,
      link: '/agency/settings',
    },
    {
      id: 'phone',
      label: 'Add contact phone',
      description: 'Let clients reach you directly',
      icon: Phone,
      isComplete: !!agency.phone,
      link: '/agency/settings',
    },
    {
      id: 'website',
      label: 'Add website',
      description: 'Link to your company website',
      icon: Globe,
      isComplete: !!agency.website,
      link: '/agency/settings',
    },
    {
      id: 'socials',
      label: 'Add social links',
      description: 'Connect LinkedIn, Instagram, or Facebook',
      icon: Share2,
      isComplete: !!(agency.social_links?.linkedin || agency.social_links?.instagram || agency.social_links?.facebook),
      link: '/agency/settings#social-links',
    },
    {
      id: 'cities',
      label: 'Select service areas (3+)',
      description: 'Show where you operate',
      icon: MapPin,
      isComplete: (agency.cities_covered?.length || 0) >= 3,
      link: '/agency/settings',
    },
    {
      id: 'specializations',
      label: 'Choose specializations',
      description: 'Highlight your expertise',
      icon: Briefcase,
      isComplete: (agency.specializations?.length || 0) >= 1,
      link: '/agency/settings',
    },
    {
      id: 'team',
      label: 'Add additional team member',
      description: 'Invite someone to join your agency',
      icon: Users,
      isComplete: teamCount >= 2,
      link: '/agency/team',
    },
    {
      id: 'listing',
      label: 'First listing published',
      description: 'Get your first property live',
      icon: Home,
      isComplete: listingsCount >= 1,
      link: '/agency/properties/new',
    },
  ];

  const completedCount = checklistItems.filter(item => item.isComplete).length;
  const completionPercentage = Math.round((completedCount / checklistItems.length) * 100);

  // Don't show if dismissed or 100% complete
  if (isDismissed || completionPercentage === 100) {
    return null;
  }

  const handleDismiss = () => {
    localStorage.setItem('agency_onboarding_dismissed', 'true');
    setIsDismissed(true);
  };

  return (
    <Card className="rounded-2xl border-primary/20 bg-gradient-to-br from-primary/5 to-transparent overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="text-lg">Complete Your Profile</CardTitle>
            <span className="text-sm text-muted-foreground">
              {completedCount}/{checklistItems.length} steps
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="rounded-lg"
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="rounded-lg text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <Progress value={completionPercentage} className="h-2" />
      </CardHeader>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <CardContent className="pt-2 pb-4">
              <div className="grid gap-2">
                {checklistItems.map((item) => (
                  <div
                    key={item.id}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-xl transition-colors",
                      item.isComplete 
                        ? "bg-primary/5" 
                        : "bg-muted/30 hover:bg-muted/50"
                    )}
                  >
                    <div className={cn(
                      "flex-shrink-0",
                      item.isComplete ? "text-primary" : "text-muted-foreground"
                    )}>
                      {item.isComplete ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : (
                        <Circle className="h-5 w-5" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "font-medium text-sm",
                        item.isComplete && "line-through text-muted-foreground"
                      )}>
                        {item.label}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {item.description}
                      </p>
                    </div>

                    {!item.isComplete && item.link && (
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                        className="rounded-lg text-primary hover:text-primary hover:bg-primary/10"
                      >
                        <Link to={item.link}>
                          <item.icon className="h-4 w-4" />
                        </Link>
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
