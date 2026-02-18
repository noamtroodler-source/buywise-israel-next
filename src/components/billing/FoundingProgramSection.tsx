import { Sparkles, Calendar, Percent, Zap, BookOpen } from 'lucide-react';

const BENEFITS = [
  {
    icon: Calendar,
    title: '60-Day Free Trial',
    description: 'Try any plan completely risk-free. No charge for 60 days, cancel anytime.',
  },
  {
    icon: Percent,
    title: '25% Off for 10 Months',
    description: 'After your trial, save 25% on your plan price for the next 10 months.',
  },
  {
    icon: Zap,
    title: 'Priority Credits',
    description: 'Receive 150 visibility credits/month for your first 2 months, then 50/month for 10 months. ~₪16,000 in free platform value.',
  },
  {
    icon: BookOpen,
    title: 'Case Study Feature',
    description: 'Get featured on our blog and social channels as a launch partner — free exposure to our buyer and investor audience.',
  },
];

// credit_schedule: [150, 150, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50]
const CREDIT_TIMELINE = [
  { label: 'Trial M1', credits: 150 },
  { label: 'Trial M2', credits: 150 },
  { label: 'M 1', credits: 50 },
  { label: 'M 2', credits: 50 },
  { label: 'M 3', credits: 50 },
  { label: 'M 4', credits: 50 },
  { label: 'M 5', credits: 50 },
  { label: 'M 6', credits: 50 },
  { label: 'M 7', credits: 50 },
  { label: 'M 8', credits: 50 },
  { label: 'M 9', credits: 50 },
  { label: 'M 10', credits: 50 },
];

export function FoundingProgramSection() {
  return (
    <div id="founding" className="max-w-5xl mx-auto scroll-mt-20">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 mb-3">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">Founding Program</h2>
        </div>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Be an early adopter and unlock exclusive benefits that reward your commitment.
        </p>
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

      {/* Credit timeline */}
      <div className="mt-8 rounded-2xl border border-primary/20 bg-primary/5 p-6">
        <p className="text-center text-sm font-semibold text-foreground mb-4">
          Your Credit Grant Timeline <span className="text-muted-foreground font-normal">(800 credits total · ~₪16,000 value)</span>
        </p>
        <div className="overflow-x-auto">
          <div className="flex gap-1.5 min-w-max mx-auto justify-center">
            {CREDIT_TIMELINE.map((item, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <div
                  className={`rounded-lg px-2 py-2 text-center min-w-[52px] ${
                    i < 2
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-primary/20 text-primary'
                  }`}
                >
                  <div className="text-xs font-bold">{item.credits}</div>
                  <div className="text-[10px] opacity-80">credits</div>
                </div>
                <div className="text-[10px] text-muted-foreground whitespace-nowrap">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
        <p className="text-center text-xs text-muted-foreground mt-3">
          Months 1–2 during trial · Months 1–10 after trial starts
        </p>
      </div>

      <p className="text-center text-sm text-muted-foreground mt-4">
        Use code <strong className="text-primary">FOUNDING2026</strong> at checkout to activate
      </p>
    </div>
  );
}

