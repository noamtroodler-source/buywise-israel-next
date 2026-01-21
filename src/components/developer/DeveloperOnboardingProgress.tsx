import { motion } from 'framer-motion';
import { Check, User, Image, Building2, CheckCircle2, ChevronDown, ChevronUp, Share2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useDeveloperProfile } from '@/hooks/useDeveloperProfile';
import { useDeveloperProjects } from '@/hooks/useDeveloperProjects';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface ChecklistItem {
  id: string;
  label: string;
  description: string;
  icon: typeof User;
  isComplete: boolean;
  action?: () => void;
  actionLabel?: string;
}

export function DeveloperOnboardingProgress() {
  const navigate = useNavigate();
  const { data: developer } = useDeveloperProfile();
  const { data: projects = [] } = useDeveloperProjects();
  const [isExpanded, setIsExpanded] = useState(true);

  const approvedProjects = projects.filter(p => p.verification_status === 'approved');

  const checklistItems: ChecklistItem[] = [
    {
      id: 'profile',
      label: 'Complete your profile',
      description: 'Add company details, description, and contact info',
      icon: User,
      isComplete: !!(developer?.name && developer?.email && developer?.description),
      action: () => navigate('/developer/settings'),
      actionLabel: 'Edit Profile',
    },
    {
      id: 'logo',
      label: 'Upload company logo',
      description: 'Add your brand logo to build trust',
      icon: Image,
      isComplete: !!developer?.logo_url,
      action: () => navigate('/developer/settings'),
      actionLabel: 'Add Logo',
    },
    {
      id: 'socials',
      label: 'Add social links',
      description: 'Connect LinkedIn, Instagram, or Facebook',
      icon: Share2,
      isComplete: !!(developer?.linkedin_url || developer?.instagram_url || developer?.facebook_url),
      action: () => navigate('/developer/settings'),
      actionLabel: 'Add Socials',
    },
    {
      id: 'first_project',
      label: 'Add your first project',
      description: 'List a new development to attract buyers',
      icon: Building2,
      isComplete: projects.length > 0,
      action: () => navigate('/developer/projects/new'),
      actionLabel: 'Add Project',
    },
    {
      id: 'approved_project',
      label: 'Get a project approved',
      description: 'Your project will go live after admin review',
      icon: CheckCircle2,
      isComplete: approvedProjects.length > 0,
    },
  ];

  const completedCount = checklistItems.filter(item => item.isComplete).length;
  const progress = (completedCount / checklistItems.length) * 100;

  // Hide if all complete
  if (progress === 100 && developer?.onboarding_completed_at) {
    return null;
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
      <CardContent className="p-4">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-lg font-semibold text-primary">
                {completedCount}/{checklistItems.length}
              </span>
            </div>
            <div className="text-left">
              <h3 className="font-semibold">Getting Started</h3>
              <p className="text-sm text-muted-foreground">
                {progress === 100 
                  ? "You're all set! 🎉" 
                  : `Complete your setup to start attracting buyers`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Progress value={progress} className="w-24 h-2" />
            {isExpanded ? (
              <ChevronUp className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
        </button>

        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-4 space-y-2"
          >
            {checklistItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg transition-colors",
                    item.isComplete 
                      ? "bg-green-50 dark:bg-green-950/20" 
                      : "bg-muted/50 hover:bg-muted"
                  )}
                >
                  <div className={cn(
                    "h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0",
                    item.isComplete 
                      ? "bg-green-100 dark:bg-green-900/50" 
                      : "bg-background"
                  )}>
                    {item.isComplete ? (
                      <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                    ) : (
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "text-sm font-medium",
                      item.isComplete && "text-muted-foreground line-through"
                    )}>
                      {item.label}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {item.description}
                    </p>
                  </div>
                  {!item.isComplete && item.action && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        item.action?.();
                      }}
                    >
                      {item.actionLabel}
                    </Button>
                  )}
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}
