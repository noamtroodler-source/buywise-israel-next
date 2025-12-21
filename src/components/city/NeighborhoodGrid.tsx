import { motion } from 'framer-motion';
import { MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Neighborhood } from '@/types/content';

interface NeighborhoodGridProps {
  neighborhoods: Neighborhood[];
  cityName: string;
}

export function NeighborhoodGrid({ neighborhoods, cityName }: NeighborhoodGridProps) {
  if (neighborhoods.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 }}
    >
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <MapPin className="h-5 w-5 text-primary" />
            Neighborhoods in {cityName}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {neighborhoods.map((neighborhood, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 + index * 0.05 }}
                className="p-4 rounded-lg bg-muted/50 hover:bg-muted border border-transparent hover:border-border/50 transition-all cursor-pointer group"
              >
                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                  {neighborhood.name}
                </h3>
                {neighborhood.description && (
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {neighborhood.description}
                  </p>
                )}
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
