import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home, Building2, Key, Calculator, PiggyBank, TrendingUp, Receipt } from 'lucide-react';

interface CityNextStepsProps {
  cityName: string;
  propertiesCount?: number;
}

export function CityNextSteps({ cityName, propertiesCount }: CityNextStepsProps) {
  const calculators = [
    { icon: Calculator, label: 'Mortgage', href: '/tools?tool=mortgage' },
    { icon: PiggyBank, label: 'True Cost', href: '/tools?tool=true-cost' },
    { icon: TrendingUp, label: 'Affordability', href: '/tools?tool=affordability' },
    { icon: Receipt, label: 'Purchase Tax', href: '/tools?tool=purchase-tax' },
  ];

  return (
    <section className="py-12 bg-background">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl mx-auto text-center space-y-8"
        >
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
              Ready to explore {cityName}?
            </h2>
            {propertiesCount && propertiesCount > 0 && (
              <p className="text-muted-foreground">
                {propertiesCount} properties currently available
              </p>
            )}
          </div>

          {/* Primary CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button size="lg" asChild>
              <Link to={`/listings?city=${encodeURIComponent(cityName)}`}>
                <Home className="h-4 w-4 mr-2" />
                Homes for Sale
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link to={`/projects?city=${encodeURIComponent(cityName)}`}>
                <Building2 className="h-4 w-4 mr-2" />
                New Projects
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link to={`/listings?city=${encodeURIComponent(cityName)}&status=for_rent`}>
                <Key className="h-4 w-4 mr-2" />
                Rentals
              </Link>
            </Button>
          </div>

          {/* Calculator Links */}
          <div className="pt-4 border-t border-border/50">
            <p className="text-sm text-muted-foreground mb-4">Run the numbers</p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {calculators.map((calc) => (
                <Button
                  key={calc.label}
                  variant="ghost"
                  size="sm"
                  asChild
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Link to={calc.href}>
                    <calc.icon className="h-4 w-4 mr-1.5" />
                    {calc.label}
                  </Link>
                </Button>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
