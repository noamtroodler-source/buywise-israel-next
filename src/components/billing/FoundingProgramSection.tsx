import { Sparkles, Calendar, Percent, Zap } from 'lucide-react';

const BENEFITS = [
  {
    icon: Calendar,
    title: '60-Day Free Trial',
    description: 'Try any plan risk-free for a full 60 days. No charge until the trial ends.',
  },
  {
    icon: Percent,
    title: '25% Off for 10 Months',
    description: 'After your trial, enjoy 25% off your plan price for the next 10 months.',
  },
  {
    icon: Zap,
    title: 'Monthly Credits',
    description: '150 visibility credits in months 1–2, then 50 credits/mo for 10 months.',
  },
];

export function FoundingProgramSection() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 mb-3">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">Founding Program</h2>
        </div>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Be an early adopter and unlock exclusive benefits that reward your commitment.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
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

      <p className="text-center text-sm text-muted-foreground mt-4">
        Use code <strong className="text-primary">FOUNDING2026</strong> at checkout to activate
      </p>
    </div>
  );
}
