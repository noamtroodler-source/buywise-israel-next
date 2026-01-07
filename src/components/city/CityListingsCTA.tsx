import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home, Building2, Key, ArrowRight } from 'lucide-react';

interface CityListingsCTAProps {
  cityName: string;
  propertiesCount?: number;
}

export function CityListingsCTA({ cityName, propertiesCount = 0 }: CityListingsCTAProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="text-center py-8"
    >
      <h2 className="text-2xl font-bold text-foreground mb-2">
        Ready to Explore {cityName}?
      </h2>
      <p className="text-muted-foreground mb-6">
        {propertiesCount > 0 
          ? `Browse ${propertiesCount} available properties`
          : 'Discover available properties and new projects'
        }
      </p>
      
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <Button size="lg" className="w-full sm:w-auto group" asChild>
          <Link to={`/listings?city=${encodeURIComponent(cityName)}`}>
            <Home className="h-4 w-4 mr-2" />
            Homes for Sale
            <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
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
  );
}
