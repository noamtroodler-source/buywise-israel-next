import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home, Building2, Key, ArrowRight } from 'lucide-react';

interface CityExploreListingsProps {
  cityName: string;
  propertiesCount?: number;
}

export function CityExploreListings({ cityName, propertiesCount }: CityExploreListingsProps) {
  return (
    <section className="py-16 bg-background border-y border-border/50">
      <div className="container max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-8"
        >
          {/* Header */}
          <div className="space-y-3">
            <h2 className="text-2xl sm:text-3xl font-semibold text-foreground">
              Explore {cityName} Listings
            </h2>
            {propertiesCount && propertiesCount > 0 && (
              <p className="text-muted-foreground">
                {propertiesCount} properties currently available
              </p>
            )}
          </div>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button size="lg" className="w-full sm:w-auto group" asChild>
              <Link to={`/listings?city=${encodeURIComponent(cityName)}`}>
                <Home className="h-4 w-4 mr-2" />
                Homes for Sale
                <ArrowRight className="h-4 w-4 ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="w-full sm:w-auto" asChild>
              <Link to={`/projects?city=${encodeURIComponent(cityName)}`}>
                <Building2 className="h-4 w-4 mr-2" />
                New Projects
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="w-full sm:w-auto" asChild>
              <Link to={`/listings?city=${encodeURIComponent(cityName)}&status=for_rent`}>
                <Key className="h-4 w-4 mr-2" />
                Rentals
              </Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
