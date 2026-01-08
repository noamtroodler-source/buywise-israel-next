import { motion } from 'framer-motion';
import { TrendingUp, Home, Key, Train, Users, Sparkles } from 'lucide-react';

interface CityQuickStatsProps {
  pricePerSqm?: number;
  medianPrice?: number;
  rentalRange?: { min: number; max: number };
  yoyChange?: number;
  highlights?: string[];
  hasTrainStation?: boolean;
  angloPresence?: string;
  nationalAvgPriceSqm?: number;
}

export function CityQuickStats({
  pricePerSqm,
  medianPrice,
  rentalRange,
  yoyChange,
  highlights = [],
  hasTrainStation,
  angloPresence,
  nationalAvgPriceSqm = 34000,
}: CityQuickStatsProps) {
  const formatPrice = (price: number) => {
    if (price >= 1000000) {
      return `₪${(price / 1000000).toFixed(2)}M`;
    }
    return `₪${(price / 1000).toFixed(0)}K`;
  };

  const formatPricePerSqm = (price: number) => `₪${(price / 1000).toFixed(0)}K/m²`;

  const vsNational = pricePerSqm && nationalAvgPriceSqm 
    ? Math.round(((pricePerSqm - nationalAvgPriceSqm) / nationalAvgPriceSqm) * 100)
    : null;

  const typicalSqm = medianPrice && pricePerSqm 
    ? Math.round(medianPrice / pricePerSqm)
    : null;

  // Build character tags
  const characterTags: string[] = [];
  if (angloPresence === 'strong' || angloPresence === 'moderate') {
    characterTags.push('Anglo community');
  }
  if (hasTrainStation) {
    characterTags.push('Train access');
  }
  // Add first 2 highlights
  highlights.slice(0, 2).forEach(h => characterTags.push(h));

  return (
    <section className="py-8 border-b border-border/50">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Primary Stats Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
            {/* Price per sqm */}
            {pricePerSqm && (
              <div className="text-center sm:text-left">
                <div className="text-2xl sm:text-3xl font-bold text-foreground">
                  {formatPricePerSqm(pricePerSqm)}
                </div>
                <div className="text-sm text-muted-foreground mt-1 flex items-center justify-center sm:justify-start gap-1.5">
                  <TrendingUp className="h-3.5 w-3.5" />
                  {vsNational !== null && (
                    <span className={vsNational > 0 ? 'text-primary' : ''}>
                      {vsNational > 0 ? '+' : ''}{vsNational}% vs national
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Median Price */}
            {medianPrice && (
              <div className="text-center sm:text-left">
                <div className="text-2xl sm:text-3xl font-bold text-foreground">
                  {formatPrice(medianPrice)}
                </div>
                <div className="text-sm text-muted-foreground mt-1 flex items-center justify-center sm:justify-start gap-1.5">
                  <Home className="h-3.5 w-3.5" />
                  <span>median apartment{typicalSqm && ` (~${typicalSqm}m²)`}</span>
                </div>
              </div>
            )}

            {/* Rental Range */}
            {rentalRange && (
              <div className="text-center sm:text-left">
                <div className="text-2xl sm:text-3xl font-bold text-foreground">
                  ₪{rentalRange.min.toLocaleString()}–{rentalRange.max.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground mt-1 flex items-center justify-center sm:justify-start gap-1.5">
                  <Key className="h-3.5 w-3.5" />
                  <span>3-room monthly rent</span>
                </div>
              </div>
            )}
          </div>

          {/* Character Tags */}
          {characterTags.length > 0 && (
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-2">
              {characterTags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted text-sm text-muted-foreground"
                >
                  {tag === 'Train access' && <Train className="h-3.5 w-3.5" />}
                  {tag === 'Anglo community' && <Users className="h-3.5 w-3.5" />}
                  {tag !== 'Train access' && tag !== 'Anglo community' && <Sparkles className="h-3.5 w-3.5" />}
                  {tag}
                </span>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
}
