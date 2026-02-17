import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Plan {
  tier: string;
  name: string;
  max_listings: number | null;
  max_seats: number | null;
  max_blogs_per_month: number | null;
}

interface FeatureComparisonTableProps {
  plans: Plan[];
}

const FEATURES = [
  {
    label: 'Active Listings',
    getValue: (p: Plan) =>
      p.max_listings === null ? 'Unlimited' : String(p.max_listings),
  },
  {
    label: 'Team Seats',
    getValue: (p: Plan) =>
      p.max_seats === null || p.max_seats >= 999 ? 'Unlimited' : String(p.max_seats),
  },
  {
    label: 'Blog Posts / Month',
    getValue: (p: Plan) =>
      p.max_blogs_per_month === null || p.max_blogs_per_month >= 999
        ? 'Unlimited'
        : String(p.max_blogs_per_month),
  },
  {
    label: 'Priority Support',
    getValue: (p: Plan) => (p.tier === 'pro' || p.tier === 'enterprise' ? true : false),
  },
  {
    label: 'Dedicated Account Manager',
    getValue: (p: Plan) => (p.tier === 'enterprise' ? true : false),
  },
  {
    label: 'API Access',
    getValue: (p: Plan) => (p.tier === 'pro' || p.tier === 'enterprise' ? true : false),
  },
];

function CellValue({ value }: { value: string | boolean }) {
  if (typeof value === 'boolean') {
    return value ? (
      <Check className="h-4 w-4 text-primary mx-auto" />
    ) : (
      <X className="h-4 w-4 text-muted-foreground/40 mx-auto" />
    );
  }
  return (
    <span className={cn('text-sm font-medium', value === 'Unlimited' ? 'text-primary' : 'text-foreground')}>
      {value}
    </span>
  );
}

export function FeatureComparisonTable({ plans }: FeatureComparisonTableProps) {
  if (!plans.length) return null;

  return (
    <div className="max-w-5xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Compare Plans</h2>
        <p className="text-muted-foreground">See what's included in each tier</p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[500px]">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground w-1/3">
                Feature
              </th>
              {plans.map((plan) => (
                <th
                  key={plan.tier}
                  className={cn(
                    'py-3 px-4 text-sm font-semibold text-center',
                    plan.tier === 'growth' ? 'bg-primary/5 text-primary' : 'text-foreground'
                  )}
                >
                  {plan.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {FEATURES.map((feature, i) => (
              <tr key={feature.label} className={cn('border-b border-border last:border-0', i % 2 === 0 && 'bg-muted/20')}>
                <td className="py-3 px-4 text-sm text-muted-foreground">{feature.label}</td>
                {plans.map((plan) => (
                  <td
                    key={plan.tier}
                    className={cn(
                      'py-3 px-4 text-center',
                      plan.tier === 'growth' && 'bg-primary/5'
                    )}
                  >
                    <CellValue value={feature.getValue(plan)} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
