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
  X, 
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  href?: string;
  icon: React.ElementType;
}

interface OnboardingChecklistProps {
  agentProfile: {
    avatar_url?: string | null;
    neighborhoods_covered?: string[] | null;
  } | null;
  properties: {
    id: string;
    verification_status?: string;
    views_count?: number | null;
  }[];
  onDismiss: () => void;
}

export function OnboardingChecklist({ 
  agentProfile, 
  properties, 
  onDismiss 
}: OnboardingChecklistProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  // Calculate completion status for each item - check for optional enhancements
  // (bio, phone, languages are already collected during registration)
  const hasEnhancedProfile = Boolean(
    agentProfile?.avatar_url && 
    (agentProfile?.neighborhoods_covered?.length || 0) > 0
  );
  
  const hasAddedListing = properties.length > 0;
  
  const hasSubmittedListing = properties.some(
    p => p.verification_status === 'pending_review' || 
         p.verification_status === 'approved'
  );
  
  const hasApprovedListing = properties.some(
    p => p.verification_status === 'approved'
  );
  
  const hasReceivedViews = properties.some(
    p => (p.views_count || 0) > 0
  );

  const checklistItems: ChecklistItem[] = [
    {
      id: 'profile',
      title: 'Enhance your profile',
      description: 'Add a photo and coverage areas',
      completed: hasEnhancedProfile,
      href: '/agent/settings',
      icon: User,
    },
    {
      id: 'listing',
      title: 'Add your first listing',
      description: 'Create a property listing',
      completed: hasAddedListing,
      href: '/agent/properties/new',
      icon: Home,
    },
    {
      id: 'submit',
      title: 'Submit for review',
      description: 'Send listing for admin approval',
      completed: hasSubmittedListing,
      href: '/agent/properties',
      icon: Send,
    },
    {
      id: 'approved',
      title: 'Get listing approved',
      description: 'Listing goes live on the platform',
      completed: hasApprovedListing,
      icon: CheckCircle2,
    },
    {
      id: 'views',
      title: 'Get your first view',
      description: 'Buyers discover your listing',
      completed: hasReceivedViews,
      icon: Eye,
    },
  ];

  const completedCount = checklistItems.filter(item => item.completed).length;
  const progress = (completedCount / checklistItems.length) * 100;
  const isComplete = completedCount === checklistItems.length;

  // Don't show if all items are complete
  if (isComplete) {
    return null;
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Getting Started</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? 'Collapse' : 'Expand'}
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              className="h-8 w-8"
              onClick={onDismiss}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="flex items-center gap-3 mt-2">
          <Progress value={progress} className="flex-1 h-2" />
          <span className="text-sm font-medium text-muted-foreground">
            {completedCount}/{checklistItems.length}
          </span>
        </div>
      </CardHeader>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <CardContent className="pt-2">
              <div className="space-y-2">
                {checklistItems.map((item, index) => {
                  const Icon = item.icon;
                  const isNext = !item.completed && 
                    (index === 0 || checklistItems[index - 1].completed);
                  
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      {item.href && !item.completed ? (
                        <Link
                          to={item.href}
                          className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                            isNext 
                              ? 'bg-primary/10 hover:bg-primary/15 border border-primary/20' 
                              : 'hover:bg-muted/50'
                          }`}
                        >
                          <div className={`flex-shrink-0 ${
                            item.completed ? 'text-primary' : 'text-muted-foreground'
                          }`}>
                            {item.completed ? (
                              <CheckCircle2 className="h-5 w-5" />
                            ) : (
                              <Circle className="h-5 w-5" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`font-medium text-sm ${
                              item.completed ? 'text-muted-foreground line-through' : ''
                            }`}>
                              {item.title}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {item.description}
                            </p>
                          </div>
                          {isNext && (
                            <ChevronRight className="h-4 w-4 text-primary flex-shrink-0" />
                          )}
                        </Link>
                      ) : (
                        <div className="flex items-center gap-3 p-3 rounded-lg">
                          <div className={`flex-shrink-0 ${
                            item.completed ? 'text-primary' : 'text-muted-foreground'
                          }`}>
                            {item.completed ? (
                              <CheckCircle2 className="h-5 w-5" />
                            ) : (
                              <Circle className="h-5 w-5" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`font-medium text-sm ${
                              item.completed ? 'text-muted-foreground line-through' : ''
                            }`}>
                              {item.title}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {item.description}
                            </p>
                          </div>
                        </div>
                      )}
                    </motion.div>
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
