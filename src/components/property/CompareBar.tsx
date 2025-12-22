import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { GitCompare, X, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCompare } from '@/contexts/CompareContext';
import { supabase } from '@/integrations/supabase/client';
import { Property } from '@/types/database';

export function CompareBar() {
  const { compareIds, removeFromCompare, clearCompare } = useCompare();
  const [properties, setProperties] = useState<Property[]>([]);

  useEffect(() => {
    async function fetchProperties() {
      if (compareIds.length === 0) {
        setProperties([]);
        return;
      }

      const { data } = await supabase
        .from('properties')
        .select('id, title, city, images, price, currency')
        .in('id', compareIds);

      if (data) {
        const ordered = compareIds
          .map(id => data.find(p => p.id === id))
          .filter(Boolean) as Property[];
        setProperties(ordered);
      }
    }

    fetchProperties();
  }, [compareIds]);

  if (compareIds.length === 0) return null;

  const formatPrice = (price: number, currency: string = 'ILS') => {
    if (currency === 'ILS') return `₪${price.toLocaleString()}`;
    return `$${price.toLocaleString()}`;
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border shadow-lg"
      >
        <div className="container py-4 space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium">
              <GitCompare className="h-4 w-4 text-primary" />
              <span>{compareIds.length} {compareIds.length === 1 ? 'property' : 'properties'} selected for comparison</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={clearCompare}
                className="text-muted-foreground"
              >
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>
              <Button asChild size="sm" disabled={compareIds.length < 2}>
                <Link to="/compare">
                  Compare Now
                </Link>
              </Button>
            </div>
          </div>

          {/* Property List */}
          <div className="flex flex-wrap gap-2">
            {properties.map((property) => (
              <div 
                key={property.id}
                className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2 pr-2"
              >
                <img
                  src={property.images?.[0] || '/placeholder.svg'}
                  alt={property.title}
                  className="w-10 h-10 rounded object-cover"
                />
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-medium truncate max-w-[150px]">{property.title}</span>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    <span>{property.city}</span>
                    <span className="text-primary font-medium ml-1">
                      {formatPrice(property.price, property.currency)}
                    </span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 ml-1 text-muted-foreground hover:text-destructive"
                  onClick={() => removeFromCompare(property.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
