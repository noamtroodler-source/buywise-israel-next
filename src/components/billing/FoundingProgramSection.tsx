import { Sparkles, Calendar, Star, Zap, BookOpen } from 'lucide-react';
import { useFoundingSpots } from '@/hooks/useFoundingSpots';

const BENEFITS = [
  {
    icon: Calendar,
    title: '2 Months Completely Free',
    description: 'Try any plan risk-free for 60 days. No payment required until your trial ends.',
  },
  {
    icon: Star,
    title: '3 Free Featured Listings/mo',
    description: 'Get 3 featured listing slots each month during your trial — your properties appear first.',
  },
  {
    icon: Zap,
    title: 'Maximum Visibility, Minimal Competition',
    description: 'With only 15 founding agencies on the platform, your brand gets premium exposure to every international buyer — not buried among hundreds of competitors.',
  },
  {
    icon: BookOpen,
    title: 'First to List, First to Represent',
    description: 'For non-exclusive properties, the first agent to list it on BuyWise becomes the representing agent for that property on the platform.',
  },
];

export function FoundingProgramSection() {
  const { data: spots } = useFoundingSpots();

  return (
    <div id="founding" className="max-w-5xl mx-auto scroll-mt-20">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 mb-3">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">Founding Partner Program</h2>
        </div>
        <p className="text-muted-foreground max-w-xl mx-auto mb-4">
          Be one of the first agencies on the platform and unlock exclusive early-adopter benefits.
        </p>
        {spots && spots.remaining > 0 && (
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-4 py-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            <span className="text-sm font-semibold text-primary">
              Limited spots remaining
            </span>
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {BENEFITS.map((benefit) => (
          <div
            key={benefit.title}
            className="rounded-2xl border border-primary/20 bg-primary/5 p-6 text-center"
          >
            <div className="mx-auto mb-3 h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <benefit.icon className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground mb-1.5">{benefit.title}</h3>
            <p className="text-sm text-muted-foreground">{benefit.description}</p>
          </div>
        ))}
      </div>

      <p className="text-center text-sm text-muted-foreground mt-6">
        Use code <strong className="text-primary">FOUNDING2026</strong> at checkout to activate your founding partner benefits.
      </p>
    </div>
  );
}
