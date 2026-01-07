import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home, Building2, Key } from 'lucide-react';

interface CityListingsCTA2Props {
  cityName: string;
  propertiesCount?: number;
}

export function CityListingsCTA2({ cityName, propertiesCount }: CityListingsCTA2Props) {
  return (
    <section className="py-16 bg-muted/30">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-2xl mx-auto"
        >
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
            Explore {cityName} Listings
          </h2>
          <p className="text-muted-foreground mb-8">
            {propertiesCount && propertiesCount > 0 
              ? `Browse ${propertiesCount} available properties`
              : 'Find your perfect property in this neighborhood'
            }
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button size="lg" asChild>
              <Link to={`/listings?city=${encodeURIComponent(cityName)}`}>
                <Home className="h-4 w-4 mr-2" />
                Homes for Sale
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link to={`/projects?city=${encodeURIComponent(cityName)}`}>
                <Building2 className="h-4 w-4 mr-2" />
                New Projects
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
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
