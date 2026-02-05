import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Property } from '@/types/database';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface WinnerCount {
  propertyId: string;
  title: string;
  wins: number;
}

interface CompareAISummaryProps {
  properties: Property[];
  winnerCounts: WinnerCount[];
  isRental: boolean;
}

export function CompareAISummary({ properties, winnerCounts, isRental }: CompareAISummaryProps) {
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [propertyIds, setPropertyIds] = useState<string>('');

  const generateSummary = useCallback(async () => {
    if (properties.length < 2) return;

    setLoading(true);
    setError(null);

    try {
      const payload = {
        properties: properties.map(p => ({
          title: p.title,
          price: p.price,
          size_sqm: p.size_sqm,
          bedrooms: p.bedrooms,
          bathrooms: p.bathrooms,
          city: p.city,
          neighborhood: p.neighborhood,
          condition: p.condition,
          year_built: p.year_built,
          floor: p.floor,
          parking: p.parking,
          property_type: p.property_type,
        })),
        isRental,
        winnerData: winnerCounts.map(w => ({ title: w.title, wins: w.wins })),
      };

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-comparison-summary`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        if (response.status === 429) {
          toast.error('AI is busy, please try again in a moment');
          throw new Error('Rate limited');
        }
        if (response.status === 402) {
          toast.error('AI service temporarily unavailable');
          throw new Error('Payment required');
        }
        throw new Error('Failed to generate summary');
      }

      const data = await response.json();
      if (data.summary) {
        setSummary(data.summary);
      } else {
        throw new Error('No summary in response');
      }
    } catch (err) {
      console.error('Error generating AI summary:', err);
      setError('Unable to generate AI summary');
    } finally {
      setLoading(false);
    }
  }, [properties, winnerCounts, isRental]);

  // Generate summary when properties change
  useEffect(() => {
    const newIds = properties.map(p => p.id).sort().join(',');
    if (newIds !== propertyIds && properties.length >= 2) {
      setPropertyIds(newIds);
      setSummary(null);
      generateSummary();
    }
  }, [properties, propertyIds, generateSummary]);

  if (properties.length < 2) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4 md:p-6"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/10">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Comparison AI Summary</h3>
            <p className="text-sm text-muted-foreground">
              AI-powered analysis of your selected properties
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={generateSummary}
          disabled={loading}
          className="shrink-0"
        >
          <RefreshCw className={cn("h-4 w-4 mr-1", loading && "animate-spin")} />
          <span className="hidden sm:inline">Regenerate</span>
        </Button>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-[95%]" />
            <Skeleton className="h-4 w-[90%]" />
            <Skeleton className="h-4 w-[60%]" />
          </motion.div>
        ) : error ? (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2 text-muted-foreground"
          >
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">{error}</span>
            <Button variant="link" size="sm" onClick={generateSummary} className="p-0 h-auto">
              Try again
            </Button>
          </motion.div>
        ) : summary ? (
          <motion.div
            key="summary"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <p className="text-foreground leading-relaxed">{summary}</p>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-border/50">
        <p className="text-xs text-muted-foreground">
          AI-generated · Based on listed property data
        </p>
      </div>
    </motion.div>
  );
}
