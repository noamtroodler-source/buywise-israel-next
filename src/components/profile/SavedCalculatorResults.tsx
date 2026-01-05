import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calculator, Trash2, ExternalLink, Home, TrendingUp, DollarSign, Scale, PiggyBank } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useSavedCalculatorResults, useDeleteCalculatorResult, CalculatorType } from '@/hooks/useSavedCalculatorResults';
import { formatDistanceToNow } from 'date-fns';

const calculatorConfig: Record<CalculatorType, { label: string; icon: React.ReactNode; path: string; resultKey: string }> = {
  mortgage: {
    label: 'Mortgage Calculator',
    icon: <Home className="h-4 w-4" />,
    path: '/tools#mortgage',
    resultKey: 'monthlyPayment',
  },
  affordability: {
    label: 'Affordability Calculator',
    icon: <DollarSign className="h-4 w-4" />,
    path: '/tools#affordability',
    resultKey: 'maxPropertyPrice',
  },
  truecost: {
    label: 'True Cost Calculator',
    icon: <Calculator className="h-4 w-4" />,
    path: '/tools#truecost',
    resultKey: 'totalCost',
  },
  rentvsbuy: {
    label: 'Rent vs Buy',
    icon: <Scale className="h-4 w-4" />,
    path: '/tools#rentvsbuy',
    resultKey: 'breakEvenYear',
  },
  investment: {
    label: 'Investment Calculator',
    icon: <TrendingUp className="h-4 w-4" />,
    path: '/tools#investment',
    resultKey: 'netYield',
  },
};

function formatResult(type: CalculatorType, results: Record<string, unknown>): string {
  const config = calculatorConfig[type];
  const value = results[config.resultKey];
  
  if (value === undefined || value === null) return 'View results';
  
  if (typeof value === 'number') {
    if (type === 'rentvsbuy') return `Break-even: Year ${value}`;
    if (type === 'investment') return `Net yield: ${value.toFixed(1)}%`;
    return `₪${value.toLocaleString()}`;
  }
  
  return String(value);
}

export function SavedCalculatorResults() {
  const navigate = useNavigate();
  const { data: savedResults = [], isLoading } = useSavedCalculatorResults();
  const deleteResult = useDeleteCalculatorResult();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PiggyBank className="h-5 w-5" />
            Saved Calculator Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-16 bg-muted rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PiggyBank className="h-5 w-5" />
          Saved Calculator Results
        </CardTitle>
      </CardHeader>
      <CardContent>
        {savedResults.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Calculator className="h-10 w-10 mx-auto mb-3 opacity-50" />
            <p className="mb-3">No saved calculator results yet</p>
            <Button variant="outline" size="sm" onClick={() => navigate('/tools')}>
              Try Our Calculators
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {savedResults.slice(0, 5).map((result, index) => {
              const config = calculatorConfig[result.calculator_type as CalculatorType];
              return (
                <motion.div
                  key={result.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between p-3 rounded-lg border border-border hover:border-primary/30 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-primary/10 text-primary">
                      {config.icon}
                    </div>
                    <div>
                      <p className="font-medium text-sm">
                        {result.name || config.label}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatResult(result.calculator_type as CalculatorType, result.results as Record<string, unknown>)}
                        {' · '}
                        {formatDistanceToNow(new Date(result.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => navigate(config.path)}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => deleteResult.mutate(result.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </motion.div>
              );
            })}
            {savedResults.length > 5 && (
              <Button variant="link" className="w-full" onClick={() => navigate('/tools')}>
                View all {savedResults.length} saved results
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
