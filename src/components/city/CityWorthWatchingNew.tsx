import { motion } from 'framer-motion';
import { Eye, Train, Landmark, Building2, MapPinned, FileText, Calendar } from 'lucide-react';

export interface MarketFactor {
  title: string;
  description: string;
  icon: 'transit' | 'policy' | 'development' | 'infrastructure' | 'zoning';
  timing?: string;
}

interface CityWorthWatchingNewProps {
  factors: MarketFactor[];
  cityName: string;
}

const iconMap = {
  transit: Train,
  policy: Landmark,
  development: Building2,
  infrastructure: MapPinned,
  zoning: FileText,
};

export function CityWorthWatchingNew({ factors, cityName }: CityWorthWatchingNewProps) {
  if (factors.length === 0) return null;

  return (
    <section className="py-14 bg-background">
      <div className="container max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Header */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-primary">
              <Eye className="h-5 w-5" />
              <span className="text-sm font-medium uppercase tracking-wide">Insider Knowledge</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-semibold text-foreground">
              Worth Watching in {cityName}
            </h2>
            <p className="text-muted-foreground">
              Market developments that could affect prices
            </p>
          </div>

          {/* Factors as Timeline-style Cards */}
          <div className="grid gap-4 sm:grid-cols-3">
            {factors.map((factor, index) => {
              const IconComponent = iconMap[factor.icon];
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="group relative"
                >
                  <div className="h-full p-5 rounded-xl bg-muted/50 border border-border/50 hover:border-primary/30 hover:bg-muted transition-all">
                    {/* Icon */}
                    <div className="p-2.5 rounded-lg bg-primary/10 w-fit mb-4 group-hover:bg-primary/15 transition-colors">
                      <IconComponent className="h-5 w-5 text-primary" />
                    </div>
                    
                    {/* Content */}
                    <h3 className="font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                      {factor.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {factor.description}
                    </p>
                    
                    {/* Timing Badge (if available) */}
                    {factor.timing && (
                      <div className="flex items-center gap-1.5 mt-3 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>{factor.timing}</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
