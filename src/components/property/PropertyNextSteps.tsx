import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { TrendingUp, Calculator, FileText, PiggyBank } from 'lucide-react';
import { motion } from 'framer-motion';

interface PropertyNextStepsProps {
  cityName: string;
  citySlug: string;
  propertyPrice?: number;
}

export function PropertyNextSteps({ cityName, citySlug, propertyPrice }: PropertyNextStepsProps) {
  const priceParam = propertyPrice ? `?price=${propertyPrice}` : '';

  const steps = [
    {
      to: `/areas/${citySlug}`,
      icon: TrendingUp,
      title: `Explore ${cityName} Market`,
      description: 'Price trends, neighborhoods & insights',
    },
    {
      to: `/tools${priceParam}`,
      icon: Calculator,
      title: 'Mortgage Calculator',
      description: 'Estimate your monthly payments',
    },
    {
      to: `/tools${priceParam}`,
      icon: PiggyBank,
      title: 'Affordability Check',
      description: 'See if this fits your budget',
    },
    {
      to: '/tools',
      icon: FileText,
      title: 'Document Checklist',
      description: "What you'll need to buy in Israel",
    },
  ];

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      className="py-6"
    >
      <h3 className="text-lg font-semibold mb-4">Next Steps</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {steps.map((step) => (
          <Link key={step.title} to={step.to}>
            <Card className="p-4 hover:border-primary hover:bg-muted/30 transition-all duration-200 cursor-pointer h-full">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                  <step.icon className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-foreground">{step.title}</p>
                  <p className="text-sm text-muted-foreground truncate">{step.description}</p>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </motion.section>
  );
}
