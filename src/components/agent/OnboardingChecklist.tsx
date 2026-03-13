import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle2, 
  Circle, 
  User, 
  Home, 
  Send, 
  Eye, 
  ChevronDown,
  ChevronUp,
  Share2
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

interface OnboardingChecklistProps {
  agentProfile: {
    avatar_url?: string | null;
    bio?: string | null;
    languages?: string[] | null;
    specializations?: string[] | null;
    social_links?: {
      linkedin?: string;
      instagram?: string;
      facebook?: string;
    } | null;
  } | null;
  properties: {
    id: string;
    verification_status?: string;
    views_count?: number | null;
  }[];
}

export function OnboardingChecklist({ 
  agentProfile, 
  properties, 
}: OnboardingChecklistProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const profileEnhancements = [
    Boolean(agentProfile?.avatar_url),
    Boolean(agentProfile?.bio && agentProfile.bio.length > 10),
    (agentProfile?.languages?.length || 0) > 0,
    (agentProfile?.specializations?.length || 0) > 0,
  ];
  const hasEnhancedProfile = profileEnhancements.filter(Boolean).length >= 3;
  
  const hasAddedListing = properties.length > 0;
  const hasSubmittedListing = properties.some(
    p => p.verification_status === 'pending_review' || p.verification_status === 'approved'
  );
  const hasApprovedListing = properties.some(p => p.verification_status === 'approved');
  const hasReceivedViews = properties.some(p => (p.views_count || 0) > 0);
  const hasSocialLinks = Boolean(
    agentProfile?.social_links?.linkedin ||
    agentProfile?.social_links?.instagram ||
    agentProfile?.social_links?.facebook
  );

  const checklistItems: ChecklistItem[] = [
    {
      id: 'profile',
      label: 'Enhance your profile',
      description: 'Add a photo, bio, and expertise',
      isComplete: hasEnhancedProfile,
      link: '/agent/settings',
      icon: User,
    },
    {
      id: 'socials',
      label: 'Add your social links',
      description: 'Connect LinkedIn, Instagram, or Facebook',
      isComplete: hasSocialLinks,
      link: '/agent/settings',
      icon: Share2,
    },
    {
      id: 'listing',
      label: 'Add your first listing',
      description: 'Create a property listing',
      isComplete: hasAddedListing,
      link: '/agent/properties/new',
      icon: Home,
    },
    {
      id: 'submit',
      label: 'Submit for review',
      description: 'Send listing for admin approval',
      isComplete: hasSubmittedListing,
      link: '/agent/properties',
      icon: Send,
    },
    {
      id: 'approved',
      label: 'Get listing approved',
      description: 'Listing goes live on the platform',
      isComplete: hasApprovedListing,
      icon: CheckCircle2,
    },
    {
      id: 'views',
      label: 'Get your first view',
      description: 'Buyers discover your listing',
      isComplete: hasReceivedViews,
      icon: Eye,
    },
  ];

  const completedCount = checklistItems.filter(item => item.isComplete).length;
  const completionPercentage = Math.round((completedCount / checklistItems.length) * 100);

  if (completionPercentage === 100) {
    return null;
  }

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
                {checklistItems.map((item) => {
                  const content = (
                    <>
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
                        <item.icon className="h-4 w-4 flex-shrink-0 text-primary" />
                      )}
                    </>
                  );

                  const rowClass = cn(
                    "flex items-center gap-3 p-3 rounded-xl transition-colors",
                    item.isComplete
                      ? "bg-primary/5"
                      : "bg-muted/30 hover:bg-muted/50",
                    !item.isComplete && item.link && "cursor-pointer"
                  );

                  if (!item.isComplete && item.link) {
                    return (
                      <Link key={item.id} to={item.link} className={rowClass}>
                        {content}
                      </Link>
                    );
                  }

                  return (
                    <div key={item.id} className={rowClass}>
                      {content}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
