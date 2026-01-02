import { Link } from 'react-router-dom';
import { Lightbulb, ChevronRight, Shield, Calendar, Banknote, FileCheck } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface ProjectEducationBannerProps {
  variant?: 'full' | 'compact';
}

const buyingTips = [
  {
    icon: Shield,
    title: 'Bank Guarantee',
    description: 'Your payments are protected by law until property delivery',
  },
  {
    icon: Calendar,
    title: 'Payment Schedule',
    description: 'Pay in stages tied to construction milestones',
  },
  {
    icon: Banknote,
    title: 'Developer Lawyer Fee',
    description: 'Buyers typically pay ~1.5% for developer\'s legal costs',
  },
  {
    icon: FileCheck,
    title: '5-Year Warranty',
    description: 'New builds include structural warranty by law',
  },
];

export function ProjectEducationBanner({ variant = 'full' }: ProjectEducationBannerProps) {
  if (variant === 'compact') {
    return (
      <Card className="bg-accent/10 border-accent/20">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-accent/20 rounded-lg">
              <Lightbulb className="h-5 w-5 text-accent-foreground" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-sm">New to Buying New Construction?</h4>
              <p className="text-xs text-muted-foreground mt-1">
                Learn about payment schedules, bank guarantees, and what to expect.
              </p>
              <Link to="/guides/new-vs-resale">
                <Button variant="link" size="sm" className="px-0 h-7 mt-1">
                  Read the Guide <ChevronRight className="h-3 w-3 ml-1" />
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-accent/5 to-primary/5 border-accent/20">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-accent/20 rounded-lg">
            <Lightbulb className="h-5 w-5 text-accent-foreground" />
          </div>
          <div>
            <h3 className="font-semibold">Buying New Construction in Israel</h3>
            <p className="text-sm text-muted-foreground">What you need to know</p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {buyingTips.map((tip, index) => (
            <div key={index} className="flex items-start gap-2.5 p-3 bg-background/50 rounded-lg">
              <tip.icon className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium">{tip.title}</p>
                <p className="text-xs text-muted-foreground">{tip.description}</p>
              </div>
            </div>
          ))}
        </div>

        <Link to="/guides/new-vs-resale">
          <Button variant="outline" className="w-full justify-between">
            <span>Complete New Construction Guide</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}