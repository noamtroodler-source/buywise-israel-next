import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Calculator, PiggyBank, TrendingUp, Receipt } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface CityCalculatorsCompactProps {
  cityName: string;
  averagePrice?: number;
}

export function CityCalculatorsCompact({ cityName, averagePrice }: CityCalculatorsCompactProps) {
  const calculators = [
    {
      icon: Calculator,
      title: 'Mortgage',
      href: '/tools?tool=mortgage',
    },
    {
      icon: PiggyBank,
      title: 'True Cost',
      href: '/tools?tool=true-cost',
    },
    {
      icon: TrendingUp,
      title: 'Rent vs Buy',
      href: '/tools?tool=rent-vs-buy',
    },
    {
      icon: Receipt,
      title: 'Purchase Tax',
      href: '/tools?tool=purchase-tax',
    },
  ];

  return (
    <section className="py-12 bg-background">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Section Header */}
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Calculator className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-2xl font-semibold text-foreground">Run the Numbers</h2>
          </div>

          {/* Calculator Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {calculators.map((calc, index) => (
              <motion.div
                key={calc.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link to={calc.href}>
                  <Card className="border-border/50 hover:shadow-md hover:border-primary/30 transition-all group cursor-pointer h-full">
                    <CardContent className="p-4 flex flex-col items-center text-center">
                      <div className="p-3 rounded-lg bg-primary/10 mb-3 group-hover:bg-primary/15 transition-colors">
                        <calc.icon className="h-5 w-5 text-primary" />
                      </div>
                      <span className="font-medium text-foreground group-hover:text-primary transition-colors">
                        {calc.title}
                      </span>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
