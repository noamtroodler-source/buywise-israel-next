import { ArrowRight, BookOpen, MapPin, Calculator, Heart, BarChart3, Eye, FileCheck, Shield, Users, Home, PartyPopper, ClipboardList, TrendingUp, Banknote, Scale, Landmark, Building2, Search, Compass, Globe, Percent } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { JourneyStage } from '@/hooks/useBuyerJourneyStage';

interface ResourceCard {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
  emphasis?: boolean;
  tag?: string;
}

const STAGE_RESOURCES: Record<JourneyStage, ResourceCard[]> = {
  researching: [
    { icon: <BookOpen className="h-5 w-5" />, title: 'Buying in Israel Guide', description: 'The complete walkthrough from start to finish', href: '/guides/buying-in-israel', emphasis: true },
    { icon: <MapPin className="h-5 w-5" />, title: 'Explore Areas', description: 'Discover cities, neighborhoods & market data', href: '/areas' },
    { icon: <Calculator className="h-5 w-5" />, title: 'Affordability Calculator', description: 'Find out what you can realistically afford', href: '/tools?tool=affordability' },
    { icon: <Percent className="h-5 w-5" />, title: 'Purchase Tax Guide', description: 'Understand Mas Rechisha before you budget', href: '/guides/purchase-tax' },
    { icon: <TrendingUp className="h-5 w-5" />, title: 'Market Price Trends', description: 'See how prices have moved across cities', href: '/areas', tag: 'Data' },
    { icon: <Banknote className="h-5 w-5" />, title: 'Mortgage Calculator', description: 'Estimate monthly payments and see what banks offer', href: '/tools?tool=mortgage' },
    { icon: <Globe className="h-5 w-5" />, title: 'Hebrew Glossary', description: 'Key real estate terms you\'ll encounter', href: '/glossary' },
    { icon: <BookOpen className="h-5 w-5" />, title: 'Oleh Buyer Guide', description: 'Special benefits and tax breaks for Olim', href: '/guides/oleh-buyer', tag: 'Olim' },
  ],
  shortlisting: [
    { icon: <Heart className="h-5 w-5" />, title: 'Saved Properties', description: 'Review and compare your favorites', href: '/favorites', emphasis: true },
    { icon: <BarChart3 className="h-5 w-5" />, title: 'Compare Properties', description: 'Side-by-side comparison of shortlisted options', href: '/compare' },
    { icon: <Calculator className="h-5 w-5" />, title: 'True Cost Calculator', description: 'See the full cost beyond the listing price', href: '/tools?tool=totalcost' },
    { icon: <MapPin className="h-5 w-5" />, title: 'Neighborhood Guides', description: 'Deep-dive into your target neighborhoods', href: '/areas' },
    { icon: <Search className="h-5 w-5" />, title: 'Map Search', description: 'Find properties by location & commute times', href: '/map' },
    { icon: <Building2 className="h-5 w-5" />, title: 'New Construction Projects', description: 'Explore 76+ new developments across Israel', href: '/projects' },
    { icon: <BookOpen className="h-5 w-5" />, title: 'New vs. Resale Guide', description: 'Understand the tradeoffs before you decide', href: '/guides/new-vs-resale' },
    { icon: <Banknote className="h-5 w-5" />, title: 'Rent vs. Buy Calculator', description: 'Should you buy now or keep renting?', href: '/tools?tool=rentvsbuy' },
  ],
  viewing: [
    { icon: <ClipboardList className="h-5 w-5" />, title: 'Questions to Ask at Viewings', description: 'Don\'t forget to check these critical details', href: '/guides/buying-in-israel', emphasis: true },
    { icon: <MapPin className="h-5 w-5" />, title: 'Map Search', description: 'Check commute times and surroundings', href: '/map' },
    { icon: <BookOpen className="h-5 w-5" />, title: 'Understanding Listings', description: 'Decode listing details like a local', href: '/guides/understanding-listings' },
    { icon: <Calculator className="h-5 w-5" />, title: 'True Cost Calculator', description: 'Run numbers on properties you\'re viewing', href: '/tools?tool=totalcost' },
    { icon: <BookOpen className="h-5 w-5" />, title: 'New vs. Resale Guide', description: 'Key differences to watch for during viewings', href: '/guides/new-vs-resale' },
    { icon: <Heart className="h-5 w-5" />, title: 'Your Saved Properties', description: 'Compare after each viewing', href: '/favorites' },
  ],
  offer: [
    { icon: <FileCheck className="h-5 w-5" />, title: 'Pre-Signing Checklist', description: 'Everything to verify before you commit', href: '/tools?tool=documents', emphasis: true },
    { icon: <Calculator className="h-5 w-5" />, title: 'True Cost Calculator', description: 'Final numbers check — taxes, fees, everything', href: '/tools?tool=totalcost' },
    { icon: <Shield className="h-5 w-5" />, title: 'Readiness Check', description: 'Are you really ready? A quick self-assessment', href: '/tools?tool=workshop' },
    { icon: <BookOpen className="h-5 w-5" />, title: 'Mortgage Guide', description: 'Lock down your financing before the offer', href: '/guides/mortgages' },
    { icon: <Users className="h-5 w-5" />, title: 'Find a Lawyer', description: 'Don\'t sign anything without legal counsel', href: '/professionals' },
    { icon: <BookOpen className="h-5 w-5" />, title: 'Working with Professionals', description: 'What to expect from agents and lawyers', href: '/guides/talking-to-professionals' },
  ],
  legal: [
    { icon: <Users className="h-5 w-5" />, title: 'Find a Lawyer', description: 'Vetted professionals who work with international buyers', href: '/professionals', emphasis: true },
    { icon: <FileCheck className="h-5 w-5" />, title: 'Legal Document Checklist', description: 'Track every document needed for closing', href: '/tools?tool=documents' },
    { icon: <BookOpen className="h-5 w-5" />, title: 'Working with Professionals', description: 'What to expect from your lawyer & advisors', href: '/guides/talking-to-professionals' },
    { icon: <Calculator className="h-5 w-5" />, title: 'Mortgage Calculator', description: 'Finalize your monthly payment estimates', href: '/tools?tool=mortgage' },
    { icon: <Percent className="h-5 w-5" />, title: 'Purchase Tax Guide', description: 'Confirm your tax obligations before closing', href: '/guides/purchase-tax' },
    { icon: <BookOpen className="h-5 w-5" />, title: 'True Cost Guide', description: 'Understand every fee in the process', href: '/guides/true-cost' },
  ],
  completing: [
    { icon: <PartyPopper className="h-5 w-5" />, title: 'Congratulations!', description: 'You\'re almost a homeowner. Here\'s what\'s next.', href: '/guides/buying-in-israel', emphasis: true },
    { icon: <FileCheck className="h-5 w-5" />, title: 'Post-Purchase Documents', description: 'Registration, utilities, arnona setup', href: '/tools?tool=documents' },
    { icon: <MapPin className="h-5 w-5" />, title: 'Your Area Guide', description: 'Get to know your new neighborhood', href: '/areas' },
    { icon: <Home className="h-5 w-5" />, title: 'Renovation Estimator', description: 'Planning changes to your new home?', href: '/tools?tool=renovation' },
    { icon: <Globe className="h-5 w-5" />, title: 'Hebrew Glossary', description: 'Terms you\'ll need for daily life', href: '/glossary' },
    { icon: <BookOpen className="h-5 w-5" />, title: 'Investment Property Guide', description: 'Thinking about your next purchase?', href: '/guides/investment-property' },
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
          <div className={cn(
            'h-full rounded-2xl border border-border/50 bg-card p-4 flex gap-3 transition-all',
            'hover:shadow-[0_4px_24px_-4px_rgba(0,0,0,0.08),0_2px_8px_-2px_rgba(0,0,0,0.04)] hover:border-primary/30',
            resource.emphasis && 'border-primary/20 bg-primary/[0.03] shadow-[0_2px_12px_-2px_rgba(0,0,0,0.06)]'
          )}>
            <div className={cn(
              'flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center',
              resource.emphasis ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'
            )}>
              {resource.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="font-medium text-sm text-foreground">{resource.title}</p>
                {resource.tag && (
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">{resource.tag}</span>
                )}
                <ArrowRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all flex-shrink-0 ml-auto" />
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{resource.description}</p>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
