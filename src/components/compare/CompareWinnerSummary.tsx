import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trophy, Calculator, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Property } from '@/types/database';

interface WinnerCount {
  propertyId: string;
  title: string;
  wins: number;
}

interface CompareWinnerSummaryProps {
  properties: Property[];
  winnerCounts: WinnerCount[];
}

export function CompareWinnerSummary({ properties, winnerCounts }: CompareWinnerSummaryProps) {
  if (properties.length < 2 || winnerCounts.length === 0) return null;

  // Sort by wins
  const sorted = [...winnerCounts].sort((a, b) => b.wins - a.wins);
  const leader = sorted[0];
  const hasCompetition = sorted.length > 1 && sorted[1].wins > 0;
  const isTie = hasCompetition && sorted[0].wins === sorted[1].wins;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="bg-gradient-to-br from-primary/5 via-background to-primary/5 rounded-xl border border-border p-6 space-y-5"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <Trophy className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-lg">Comparison Summary</h3>
          <p className="text-sm text-muted-foreground">Based on the metrics above</p>
        </div>
      </div>

      {/* Summary Text */}
      <div className="space-y-3">
        {isTie ? (
          <p className="text-muted-foreground">
            It's a close call! Both <span className="font-medium text-foreground">{sorted[0].title}</span> and{' '}
            <span className="font-medium text-foreground">{sorted[1].title}</span> lead in {sorted[0].wins} categories each.
          </p>
        ) : (
          <p className="text-muted-foreground">
            <span className="font-medium text-foreground">{leader.title}</span> leads in the most categories ({leader.wins}
            {hasCompetition ? ` vs ${sorted[1].wins}` : ''}).
          </p>
        )}

        {/* Win breakdown */}
        <div className="flex flex-wrap gap-2">
          {sorted.map((winner, index) => (
            <div 
              key={winner.propertyId}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${
                index === 0 
                  ? 'bg-primary/10 text-primary font-medium' 
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              <span className="truncate max-w-[150px]">{winner.title}</span>
              <span className="font-semibold">{winner.wins}</span>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <Button asChild variant="default" className="flex-1">
          <Link to="/tools/true-cost-calculator">
            <Calculator className="h-4 w-4 mr-2" />
            Calculate True Costs
          </Link>
        </Button>
        <Button asChild variant="outline" className="flex-1">
          <Link to="/tools/mortgage-calculator">
            Run Mortgage Numbers
            <ArrowRight className="h-4 w-4 ml-2" />
          </Link>
        </Button>
      </div>
    </motion.div>
  );
}
