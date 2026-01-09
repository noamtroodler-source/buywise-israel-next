import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { GitCompareArrows, ArrowRight, Lightbulb, TrendingUp, Home, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useProperties } from '@/hooks/useProperties';

export function CompareEmptyState() {
  // Fetch a few properties to suggest
  const { data: featuredProperties } = useProperties({ 
    listing_status: 'for_sale',
  });

  const suggestedProperties = featuredProperties?.slice(0, 3) || [];

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto text-center space-y-8 px-4"
      >
        {/* Icon */}
        <div className="relative mx-auto w-28 h-28">
          <div className="absolute inset-0 bg-primary/10 rounded-full animate-pulse" />
          <div className="absolute inset-2 bg-primary/20 rounded-full" />
          <div className="absolute inset-0 flex items-center justify-center">
            <GitCompareArrows className="h-12 w-12 text-primary" />
          </div>
        </div>

        {/* Content */}
        <div className="space-y-3">
          <h1 className="text-3xl font-bold tracking-tight">
            Ready to Compare?
          </h1>
          <p className="text-muted-foreground text-lg leading-relaxed max-w-lg mx-auto">
            Select up to 3 properties to see them side by side. Compare prices, sizes, locations, and investment metrics all in one view.
          </p>
        </div>

        {/* How it works */}
        <div className="bg-muted/50 rounded-xl p-5 text-left space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Lightbulb className="h-4 w-4 text-primary" />
            How to compare properties
          </div>
          <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
            <li>Browse properties on the listings page</li>
            <li>Click the compare icon on any property card</li>
            <li>Add up to 3 properties to your comparison</li>
            <li>Click "Compare Now" to see them side by side</li>
          </ol>
        </div>

        {/* Suggested Properties */}
        {suggestedProperties.length > 0 && (
          <div className="space-y-4">
            <p className="text-sm font-medium text-muted-foreground">
              Properties you might want to compare:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {suggestedProperties.map((property) => (
                <Link
                  key={property.id}
                  to={`/property/${property.id}`}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border bg-background hover:border-primary/50 transition-colors text-left"
                >
                  <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {property.images?.[0] ? (
                      <img src={property.images[0]} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Home className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{property.city}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {property.bedrooms} rooms · ₪{(property.price / 1000000).toFixed(1)}M
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* What you can compare */}
        <div className="grid grid-cols-3 gap-4 pt-2">
          <div className="text-center p-3 rounded-lg bg-muted/30">
            <TrendingUp className="h-5 w-5 text-primary mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">Price & Value</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/30">
            <Home className="h-5 w-5 text-primary mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">Size & Layout</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/30">
            <Building2 className="h-5 w-5 text-primary mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">Location</p>
          </div>
        </div>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild size="lg">
            <Link to="/listings?status=for_sale">
              Browse Properties
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link to="/projects">
              Explore New Projects
            </Link>
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
