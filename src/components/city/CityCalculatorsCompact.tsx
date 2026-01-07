import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Calculator, PiggyBank, TrendingUp, ArrowRight } from 'lucide-react';

interface CityCalculatorsCompactProps {
  cityName: string;
  averagePrice?: number;
}

export function CityCalculatorsCompact({ cityName, averagePrice }: CityCalculatorsCompactProps) {
  const calculators = [
    {
      title: 'Mortgage Calculator',
      description: `Estimate monthly payments for ${cityName}`,
      icon: Calculator,
      link: '/tools',
    },
    {
      title: 'True Cost Calculator',
      description: 'See all buying costs including taxes & fees',
      icon: PiggyBank,
      link: '/tools',
    },
    {
      title: 'Investment Calculator',
      description: 'Analyze potential returns and rental yield',
      icon: TrendingUp,
      link: '/tools',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="space-y-4"
    >
      <div className="flex items-center gap-3">
        <Calculator className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-semibold text-foreground">Run the Numbers</h2>
      </div>
      
      <div className="grid sm:grid-cols-3 gap-4">
        {calculators.map((calc) => (
          <Link key={calc.title} to={calc.link}>
            <Card className="h-full hover:shadow-md hover:border-primary/30 transition-all border-border/50 group cursor-pointer">
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className="p-2.5 rounded-lg bg-primary/10 text-primary shrink-0">
                    <calc.icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                      {calc.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {calc.description}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0 mt-1" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </motion.div>
  );
}
