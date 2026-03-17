import { GuideCTACard } from '@/components/tools/shared/GuideCTACard';
import { Link } from 'react-router-dom';
import { Calculator, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CityResourcesCTAProps {
  cityName: string;
}

export function CityResourcesCTA({ cityName }: CityResourcesCTAProps) {
  return (
    <section className="py-16 bg-background border-t border-border/50">
      <div className="container">
        <div className="space-y-2 mb-8">
          <h2 className="text-2xl sm:text-3xl font-semibold text-foreground">
            Helpful Resources for Buying in {cityName}
          </h2>
          <p className="text-muted-foreground">
            Guides and tools to help you make an informed decision.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <GuideCTACard
            guideSlug="buying-property-in-israel"
            title="Buying in Israel Guide"
            description="Step-by-step process from search to signing, tailored for English speakers."
          />
          <GuideCTACard
            guideSlug="true-cost-of-buying"
            title="True Cost of Buying"
            description="Purchase tax, lawyer fees, mortgage costs — know the real number before you commit."
          />
          <Link
            to="/tools"
            className={cn(
              "group p-5 rounded-xl border border-border bg-card hover:border-primary/30 hover:shadow-md transition-all"
            )}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Calculator className="h-5 w-5" />
              </div>
              <p className="font-semibold group-hover:text-primary transition-colors">Calculators & Tools</p>
            </div>
            <p className="text-sm text-muted-foreground">
              Mortgage calculator, purchase tax estimator, and more.
            </p>
          </Link>
        </div>
      </div>
    </section>
  );
}
