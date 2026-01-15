import { motion } from 'framer-motion';
import { Eye, Train, Landmark, Building2, MapPinned, FileText, Calendar, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export interface MarketFactor {
  title: string;
  description: string;
  icon: 'transit' | 'policy' | 'development' | 'infrastructure' | 'zoning' | 'community';
  timing?: string;
}

interface CityWorthWatchingNewProps {
  factors: MarketFactor[];
  cityName: string;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  transit: Train,
  policy: Landmark,
  development: Building2,
  infrastructure: MapPinned,
  zoning: FileText,
  community: Users,
};

export function CityWorthWatchingNew({ factors, cityName }: CityWorthWatchingNewProps) {
  if (factors.length === 0) return null;

  return (
    <section className="py-16 bg-background">
      <div className="container">
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
            <h2 className="text-2xl font-semibold text-foreground">
              Worth Watching in {cityName}
            </h2>
            <p className="text-muted-foreground">
              Market developments that could affect prices
            </p>
          </div>

          {/* Card Grid - Matches Tools page style */}
          <div className="grid md:grid-cols-3 gap-6">
            {factors.map((factor, index) => {
              const IconComponent = iconMap[factor.icon] || Eye;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="h-full border-border/50 hover:border-primary/30 hover:shadow-md transition-all group">
                    <CardContent className="p-6 space-y-4">
                      {/* Icon */}
                      <div className="p-3 rounded-xl bg-primary/10 w-fit group-hover:bg-primary/15 transition-colors">
                        <IconComponent className="h-6 w-6 text-primary" />
                      </div>
                      
                      {/* Content */}
                      <div className="space-y-2">
                        <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                          {factor.title}
                        </h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {factor.description}
                        </p>
                      </div>
                      
                      {/* Timing Badge */}
                      {factor.timing && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-2 border-t border-border/50">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>{factor.timing}</span>
                        </div>
                      )}
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
