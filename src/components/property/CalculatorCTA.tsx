import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Calculator, PiggyBank } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

interface CalculatorCTAProps {
  propertyPrice?: number;
}

export function CalculatorCTA({ propertyPrice }: CalculatorCTAProps) {
  const priceParam = propertyPrice ? `?price=${propertyPrice}` : '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.25 }}
    >
      <Card className="bg-gradient-to-br from-primary/5 via-background to-secondary/5 border-primary/10">
        <CardContent className="p-6">
          <div className="text-center mb-4">
            <h3 className="text-lg font-semibold text-foreground">
              Planning Your Finances?
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Use our calculators to see if this property fits your budget
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button variant="outline" className="gap-2" asChild>
              <Link to={`/tools${priceParam}`}>
                <Calculator className="h-4 w-4" />
                Mortgage Calculator
              </Link>
            </Button>
            <Button variant="outline" className="gap-2" asChild>
              <Link to={`/tools${priceParam}`}>
                <PiggyBank className="h-4 w-4" />
                Can I Afford This?
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
