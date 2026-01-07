import { motion } from 'framer-motion';
import { Eye, Train, Landmark, Building2, MapPinned, FileText } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export interface MarketFactor {
  title: string;
  description: string;
  icon: 'transit' | 'policy' | 'development' | 'infrastructure' | 'zoning';
}

interface CityWorthWatchingProps {
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

export function CityWorthWatching({ factors, cityName }: CityWorthWatchingProps) {
  if (factors.length === 0) return null;

  return (
    <section className="py-12 bg-muted/40">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Section Header */}
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Eye className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-2xl font-semibold text-foreground">Worth Watching in {cityName}</h2>
          </div>

          {/* Factors Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {factors.map((factor, index) => {
              const IconComponent = iconMap[factor.icon];
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="border-border/50 bg-background hover:shadow-md hover:border-primary/20 transition-all h-full group">
                    <CardContent className="p-5">
                      <div className="flex items-start gap-4">
                        <div className="p-2.5 rounded-lg bg-primary/10 shrink-0 group-hover:bg-primary/15 transition-colors">
                          <IconComponent className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                            {factor.title}
                          </h3>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {factor.description}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
