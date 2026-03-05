import { ArrowRight, BookOpen, MapPin, Calculator, Heart, BarChart3, Eye, FileCheck, Shield, Users, Home, PartyPopper, ClipboardList } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { JourneyStage } from '@/hooks/useBuyerJourneyStage';

interface ResourceCard {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
  emphasis?: boolean;
}

const STAGE_RESOURCES: Record<JourneyStage, ResourceCard[]> = {
  researching: [
    { icon: <BookOpen className="h-5 w-5" />, title: 'Buying in Israel Guide', description: 'The complete walkthrough from start to finish', href: '/guides/buying-in-israel', emphasis: true },
    { icon: <MapPin className="h-5 w-5" />, title: 'Explore Areas', description: 'Discover cities, neighborhoods & market data', href: '/areas' },
    { icon: <Calculator className="h-5 w-5" />, title: 'Affordability Calculator', description: 'Find out what you can realistically afford', href: '/tools?tool=affordability' },
    { icon: <BookOpen className="h-5 w-5" />, title: 'Purchase Tax Guide', description: 'Understand Mas Rechisha before you budget', href: '/guides/purchase-tax' },
  ],
  shortlisting: [
    { icon: <Heart className="h-5 w-5" />, title: 'Saved Properties', description: 'Review and compare your favorites', href: '/favorites', emphasis: true },
    { icon: <BarChart3 className="h-5 w-5" />, title: 'Compare Properties', description: 'Side-by-side comparison of shortlisted options', href: '/compare' },
    { icon: <Calculator className="h-5 w-5" />, title: 'True Cost Calculator', description: 'See the full cost beyond the listing price', href: '/tools?tool=totalcost' },
    { icon: <MapPin className="h-5 w-5" />, title: 'Neighborhood Guides', description: 'Deep-dive into your target neighborhoods', href: '/areas' },
  ],
  viewing: [
    { icon: <ClipboardList className="h-5 w-5" />, title: 'Questions to Ask at Viewings', description: 'Don\'t forget to check these critical details', href: '/guides/buying-in-israel', emphasis: true },
    { icon: <MapPin className="h-5 w-5" />, title: 'Map Search', description: 'Check commute times and surroundings', href: '/map' },
    { icon: <BookOpen className="h-5 w-5" />, title: 'New vs. Resale Guide', description: 'Understand what you\'re looking at', href: '/guides/new-vs-resale' },
    { icon: <Heart className="h-5 w-5" />, title: 'Your Saved Locations', description: 'Review neighborhoods you\'re targeting', href: '/profile' },
  ],
  offer: [
    { icon: <FileCheck className="h-5 w-5" />, title: 'Pre-Signing Checklist', description: 'Everything to verify before you commit', href: '/tools?tool=documents', emphasis: true },
    { icon: <Calculator className="h-5 w-5" />, title: 'True Cost Calculator', description: 'Final numbers check — taxes, fees, everything', href: '/tools?tool=totalcost' },
    { icon: <Shield className="h-5 w-5" />, title: 'Readiness Check', description: 'Are you really ready? A quick self-assessment', href: '/tools?tool=workshop' },
    { icon: <BookOpen className="h-5 w-5" />, title: 'Mortgage Guide', description: 'Lock down your financing before the offer', href: '/guides/mortgages' },
  ],
  legal: [
    { icon: <Users className="h-5 w-5" />, title: 'Find a Lawyer', description: 'Vetted professionals who work with international buyers', href: '/professionals', emphasis: true },
    { icon: <FileCheck className="h-5 w-5" />, title: 'Legal Document Checklist', description: 'Track every document needed for closing', href: '/tools?tool=documents' },
    { icon: <BookOpen className="h-5 w-5" />, title: 'Working with Professionals', description: 'What to expect from your lawyer & advisors', href: '/guides/talking-to-professionals' },
    { icon: <Calculator className="h-5 w-5" />, title: 'Mortgage Calculator', description: 'Finalize your monthly payment estimates', href: '/tools?tool=mortgage' },
  ],
  completing: [
    { icon: <PartyPopper className="h-5 w-5" />, title: 'Congratulations!', description: 'You\'re almost a homeowner. Here\'s what\'s next.', href: '/guides/buying-in-israel', emphasis: true },
    { icon: <FileCheck className="h-5 w-5" />, title: 'Post-Purchase Documents', description: 'Registration, utilities, arnona setup', href: '/tools?tool=documents' },
    { icon: <MapPin className="h-5 w-5" />, title: 'Your Area Guide', description: 'Get to know your new neighborhood', href: '/areas' },
    { icon: <Home className="h-5 w-5" />, title: 'Renovation Estimator', description: 'Planning changes to your new home?', href: '/tools?tool=renovation' },
  ],
};

interface StageContentProps {
  stage: JourneyStage;
}

export function StageContent({ stage }: StageContentProps) {
  const navigate = useNavigate();
  const resources = STAGE_RESOURCES[stage];

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {resources.map((resource) => (
        <button
          key={resource.title}
          onClick={() => navigate(resource.href)}
          className="text-left group"
        >
          <Card className={cn(
            'h-full transition-all hover:shadow-md hover:border-primary/30',
            resource.emphasis && 'border-primary/20 bg-primary/[0.03]'
          )}>
            <CardContent className="p-4 flex gap-3">
              <div className={cn(
                'flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center',
                resource.emphasis ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'
              )}>
                {resource.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <p className="font-medium text-sm text-foreground">{resource.title}</p>
                  <ArrowRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{resource.description}</p>
              </div>
            </CardContent>
          </Card>
        </button>
      ))}
    </div>
  );
}
