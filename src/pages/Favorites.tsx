import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import { Layout } from '@/components/layout/Layout';
import { PropertyCard } from '@/components/property/PropertyCard';
import { Button } from '@/components/ui/button';
import { useFavorites } from '@/hooks/useFavorites';
import { Loader2 } from 'lucide-react';

export default function Favorites() {
  const { favoriteProperties, isLoading } = useFavorites();

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="flex items-center gap-3">
            <Heart className="h-8 w-8 text-destructive" />
            <h1 className="text-3xl font-bold text-foreground">Saved Properties</h1>
          </div>

          {favoriteProperties.length === 0 ? (
            <div className="text-center py-16">
              <Heart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-foreground mb-2">
                No saved properties yet
              </h2>
              <p className="text-muted-foreground mb-6">
                Start exploring and save properties you love!
              </p>
              <Button asChild>
                <Link to="/listings">Browse Properties</Link>
              </Button>
            </div>
          ) : (
            <>
              <p className="text-muted-foreground">
                {favoriteProperties.length} saved {favoriteProperties.length === 1 ? 'property' : 'properties'}
              </p>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {favoriteProperties.map((property) => (
                  <PropertyCard key={property.id} property={property} />
                ))}
              </div>
            </>
          )}
        </motion.div>
      </div>
    </Layout>
  );
}
