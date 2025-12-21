import { motion } from 'framer-motion';
import { Eye, Train, Landmark, Building2, MapPinned, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export interface MarketFactor {
  title: string;
  description: string;
  icon: 'transit' | 'policy' | 'development' | 'infrastructure' | 'zoning';
}

interface WorthWatchingGridProps {
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

export function WorthWatchingGrid({ factors, cityName }: WorthWatchingGridProps) {
  if (factors.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 }}
    >
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Eye className="h-5 w-5 text-primary" />
            Worth Watching in {cityName}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {factors.map((factor, index) => {
              const IconComponent = iconMap[factor.icon];
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 + index * 0.05 }}
                  className="p-4 rounded-lg bg-muted/50 hover:bg-muted border border-transparent hover:border-border/50 transition-all cursor-pointer group"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-md bg-primary/10 text-primary shrink-0">
                      <IconComponent className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                        {factor.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {factor.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
