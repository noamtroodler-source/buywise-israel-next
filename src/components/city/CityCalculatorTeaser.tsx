import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calculator, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CityCalculatorTeaserProps {
  cityName: string;
  medianPrice?: number | null;
  grossYield?: number | null;
}

export function CityCalculatorTeaser({ cityName, medianPrice, grossYield }: CityCalculatorTeaserProps) {
  // Calculate teaser numbers based on median price
  const calculateTeaser = () => {
    if (!medianPrice) return null;
    
    // Assume 75% LTV, 5% interest, 25 year term
    const loanAmount = medianPrice * 0.75;
    const monthlyRate = 0.05 / 12;
    const numPayments = 25 * 12;
    const monthlyPayment = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / (Math.pow(1 + monthlyRate, numPayments) - 1);
    
    // Estimate purchase costs (roughly 8% of price)
    const purchaseCosts = medianPrice * 0.08;
    
    return {
      monthlyPayment: Math.round(monthlyPayment),
      purchaseCosts: Math.round(purchaseCosts),
      downPayment: Math.round(medianPrice * 0.25),
    };
  };

  const teaser = calculateTeaser();

  const formatPrice = (value: number) => {
    if (value >= 1000000) return `₪${(value / 1000000).toFixed(1)}M`;
    return `₪${(value / 1000).toFixed(0)}K`;
  };

  return (
    <section className="py-14 bg-muted/40">
      <div className="container max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Header */}
          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-semibold text-foreground">
              Run the Numbers
            </h2>
            <p className="text-muted-foreground">
              See what buying in {cityName} actually costs
            </p>
          </div>

          {/* Teaser Card */}
          {teaser && medianPrice && (
            <div className="p-6 rounded-xl bg-background border border-border/50">
              <p className="text-sm text-muted-foreground mb-4">
                At the median price of <span className="font-semibold text-foreground">{formatPrice(medianPrice)}</span>:
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    ~₪{teaser.monthlyPayment.toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground">monthly payment (75% LTV)</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    ~{formatPrice(teaser.purchaseCosts)}
                  </p>
                  <p className="text-sm text-muted-foreground">in taxes + fees</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {formatPrice(teaser.downPayment)}
                  </p>
                  <p className="text-sm text-muted-foreground">minimum down payment</p>
                </div>
              </div>

              {grossYield && (
                <p className="text-sm text-muted-foreground mb-6">
                  Expected gross yield: <span className="font-medium text-foreground">{grossYield.toFixed(1)}%</span> annually
                </p>
              )}

              <div className="flex flex-wrap gap-3">
                <Button asChild>
                  <Link to="/tools?tool=mortgage">
                    <Calculator className="h-4 w-4 mr-2" />
                    Mortgage Calculator
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/tools?tool=true-cost">
                    Full Cost Breakdown
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              </div>
            </div>
          )}

          {/* Fallback when no median price */}
          {!teaser && (
            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <Link to="/tools?tool=mortgage">
                  <Calculator className="h-4 w-4 mr-2" />
                  Mortgage Calculator
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/tools?tool=true-cost">
                  True Cost Calculator
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/tools?tool=rent-vs-buy">
                  Rent vs Buy
                </Link>
              </Button>
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
}
