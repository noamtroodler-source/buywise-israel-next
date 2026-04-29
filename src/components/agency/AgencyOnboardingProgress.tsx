import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  CheckCircle2, Circle, Image, Users, Home, UploadCloud, Send, Wrench
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
  link: string;
  action: string;
  count?: number;
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
  pendingRequests?: number;
  listingsCount?: number;
  liveListingsCount?: number;
  toReviewCount?: number;
  readyToSubmitCount?: number;
}

export function AgencyOnboardingProgress({
  agency,
  teamCount,
  pendingRequests = 0,
  listingsCount = 0,
  liveListingsCount = 0,
  toReviewCount = 0,
  readyToSubmitCount = 0,
}: AgencyOnboardingProgressProps) {
  const profileComplete = Boolean(
    agency.logo_url &&
    (agency.description?.length || 0) >= 150 &&
    agency.phone &&
    agency.website &&
    (agency.cities_covered?.length || 0) >= 3 &&
    (agency.specializations?.length || 0) >= 1 &&
    (agency.social_links?.linkedin || agency.social_links?.instagram || agency.social_links?.facebook)
  );

  const checklistItems: ChecklistItem[] = [
    {
      id: 'profile',
      label: 'Complete agency profile',
      description: 'Logo, description, contact info, service areas, and specializations',
      icon: Image,
      isComplete: profileComplete,
      link: '/agency/settings',
      action: 'Open settings',
    },
    {
      id: 'team',
      label: 'Invite your team',
      description: pendingRequests > 0 ? `${pendingRequests} join request${pendingRequests === 1 ? '' : 's'} waiting` : 'Send invite links and approve agents',
      icon: Users,
      isComplete: teamCount >= 2,
      link: '/agency/team',
      action: pendingRequests > 0 ? 'Review requests' : 'Manage team',
      count: pendingRequests || teamCount,
    },
    {
      id: 'inventory',
      label: 'Add or import inventory',
      description: 'Create listings manually or import existing inventory',
      icon: UploadCloud,
      isComplete: listingsCount > 0,
      link: '/agency/import',
      action: listingsCount > 0 ? 'View inventory' : 'Import listings',
      count: listingsCount,
    },
    {
      id: 'fix',
      label: 'Fix listings needing required info',
      description: toReviewCount > 0 ? `${toReviewCount} listing${toReviewCount === 1 ? '' : 's'} need core details` : 'Required fields are handled',
      icon: Wrench,
      isComplete: listingsCount > 0 && toReviewCount === 0,
      link: '/agency/listings?status=to_review',
      action: 'Review listings',
      count: toReviewCount,
    },
    {
      id: 'submit',
      label: 'Submit ready listings for review',
      description: `${readyToSubmitCount} listing${readyToSubmitCount === 1 ? '' : 's'} ready for BuyWise review`,
      icon: Send,
      isComplete: readyToSubmitCount === 0 && listingsCount > 0 && toReviewCount === 0,
      link: '/agency/listings?status=ready_to_submit',
      action: 'Submit batch',
      count: readyToSubmitCount,
    },
    {
      id: 'live',
      label: 'Get first listing live',
      description: liveListingsCount > 0 ? 'Your first live listing completes launch' : 'Listings go live after BuyWise review',
      icon: Home,
      isComplete: liveListingsCount >= 1,
      link: '/agency/listings?status=live',
      action: 'View live listings',
      count: liveListingsCount,
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
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-lg">Launch your BuyWise presence</CardTitle>
            <p className="text-sm text-muted-foreground">{completedCount}/{checklistItems.length} launch steps complete</p>
          </div>
          <Progress value={completionPercentage} className="h-2 sm:w-48" />
        </div>
      </CardHeader>

      <CardContent className="pt-2 pb-4">
        <div className="grid gap-2 md:grid-cols-2">
          {checklistItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
              >
                <Link
                  to={item.link}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-xl border transition-colors h-full',
                    item.isComplete
                      ? 'bg-primary/5 border-primary/15'
                      : 'bg-background/80 border-border/60 hover:bg-background hover:border-primary/25'
                  )}
                >
                  <div className={cn('flex-shrink-0', item.isComplete ? 'text-primary' : 'text-muted-foreground')}>
                    {item.isComplete ? <CheckCircle2 className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-primary" />
                      <p className={cn('font-medium text-sm truncate', item.isComplete && 'text-muted-foreground')}>
                        {item.label}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{item.description}</p>
                  </div>

                  <Button type="button" variant="ghost" size="sm" className="rounded-lg shrink-0 text-xs">
                    {item.id === 'submit' && item.count !== undefined ? item.count : item.action}
                  </Button>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
