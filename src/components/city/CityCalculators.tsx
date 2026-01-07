import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Calculator, TrendingUp, Wallet, Home, ArrowRight } from 'lucide-react';

interface CityCalculatorsProps {
  cityName: string;
  averagePrice?: number;
}

export function CityCalculators({ cityName, averagePrice }: CityCalculatorsProps) {
  const calculators = [
    {
      title: 'Mortgage Calculator',
      description: `Calculate monthly payments for a ${cityName} property`,
      icon: Calculator,
      link: '/tools',
      color: 'bg-primary/10 text-primary',
    },
    {
      title: 'Investment Calculator',
      description: `Analyze potential returns in ${cityName}'s market`,
      icon: TrendingUp,
      link: '/tools',
      color: 'bg-accent/20 text-accent-foreground',
    },
    {
      title: 'Affordability Calculator',
      description: `See what you can afford in ${cityName}`,
      icon: Wallet,
      link: '/tools',
      color: 'bg-success/10 text-success',
    },
    {
      title: 'Rent vs Buy Calculator',
      description: `Should you rent or buy in ${cityName}?`,
      icon: Home,
      link: '/tools',
      color: 'bg-primary/10 text-primary',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="space-y-4"
    >
      <h2 className="text-xl font-semibold text-foreground">Run the Numbers</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {calculators.map((calc) => (
          <Link key={calc.title} to={calc.link}>
            <Card className="h-full hover:shadow-md transition-shadow border-border/50 group cursor-pointer">
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg ${calc.color}`}>
                    <calc.icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                      {calc.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {calc.description}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </motion.div>
  );
}
