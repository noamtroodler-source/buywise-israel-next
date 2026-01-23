import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { TrendingUp, Calculator, PiggyBank, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';
import { ListingStatus } from '@/types/database';

interface PropertyNextStepsProps {
  cityName: string;
  citySlug: string;
  propertyPrice?: number;
  listingStatus?: ListingStatus;
}

export function PropertyNextSteps({ cityName, citySlug, propertyPrice, listingStatus }: PropertyNextStepsProps) {
  // Determine which guide to show based on listing type
  const guideStep = listingStatus === 'for_rent'
    ? {
        to: '/guides/understanding-listings',
        icon: BookOpen,
        title: 'Understanding Listings',
        description: 'Decode Israeli listing terminology',
      }
    : {
        to: '/guides/buying-in-israel',
        icon: BookOpen,
        title: "Complete Buyer's Guide",
        description: 'Everything you need to know',
      };

  const steps = [
    {
      to: `/areas/${citySlug}`,
      icon: TrendingUp,
      title: `Explore ${cityName} Market`,
      description: 'Price trends, neighborhoods & insights',
    },
    {
      to: propertyPrice ? `/tools?tool=mortgage&price=${propertyPrice}` : '/tools?tool=mortgage',
      icon: Calculator,
      title: 'Mortgage Calculator',
      description: 'Estimate your monthly payments',
    },
    {
      to: propertyPrice ? `/tools?tool=affordability&price=${propertyPrice}` : '/tools?tool=affordability',
      icon: PiggyBank,
      title: 'Affordability Check',
      description: 'See if this fits your budget',
    },
    guideStep,
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
