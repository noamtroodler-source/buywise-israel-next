import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Home, Building2, Key, ArrowRight } from 'lucide-react';

interface ListingsCTAProps {
  cityName: string;
  propertiesCount: number;
}

export function ListingsCTA({ cityName, propertiesCount }: ListingsCTAProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
    >
      <Card className="bg-gradient-to-br from-primary/5 via-background to-accent/5 border-border/50 overflow-hidden">
        <CardContent className="p-6 sm:p-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Ready to Find Your Place in {cityName}?
            </h2>
            <p className="text-muted-foreground">
              {propertiesCount > 0 
                ? `Browse ${propertiesCount} available properties`
                : 'Explore available properties and new projects'
              }
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button size="lg" className="w-full sm:w-auto" asChild>
              <Link to={`/listings?city=${encodeURIComponent(cityName)}`}>
                <Home className="h-4 w-4 mr-2" />
                Homes for Sale
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="w-full sm:w-auto" asChild>
              <Link to={`/projects?city=${encodeURIComponent(cityName)}`}>
                <Building2 className="h-4 w-4 mr-2" />
                New Projects
              </Link>
            </Button>
            <Button variant="ghost" size="lg" className="w-full sm:w-auto" asChild>
              <Link to={`/listings?city=${encodeURIComponent(cityName)}&status=for_rent`}>
                <Key className="h-4 w-4 mr-2" />
                Rentals
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
