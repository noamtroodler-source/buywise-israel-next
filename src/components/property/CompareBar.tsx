import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { GitCompare, X, Building } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCompare } from '@/contexts/CompareContext';
import { supabase } from '@/integrations/supabase/client';
import { Property } from '@/types/database';
import { PropertyThumbnail } from '@/components/shared/PropertyThumbnail';

interface ProjectData {
  id: string;
  name: string;
  city: string;
  images: string[] | null;
  price_from: number | null;
  slug: string;
}

export function CompareBar() {
  const { compareIds, compareCategory, removeFromCompare, clearCompare } = useCompare();
  const [properties, setProperties] = useState<Property[]>([]);
  const [projects, setProjects] = useState<ProjectData[]>([]);

  useEffect(() => {
    async function fetchItems() {
      if (compareIds.length === 0) {
        setProperties([]);
        setProjects([]);
        return;
      }

      if (compareCategory === 'projects') {
        const { data } = await supabase
          .from('projects')
          .select('id, name, city, images, price_from, slug')
          .in('id', compareIds);

        if (data) {
          const ordered = compareIds
            .map(id => data.find(p => p.id === id))
            .filter(Boolean) as ProjectData[];
          setProjects(ordered);
        }
      } else {
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
    }

    fetchItems();
  }, [compareIds, compareCategory]);

  if (compareIds.length === 0) return null;

  const formatPrice = (price: number, currency: string = 'ILS') => {
    if (currency === 'ILS') return `₪${price.toLocaleString()}`;
    return `$${price.toLocaleString()}`;
  };

  const getCategoryLabel = () => {
    switch (compareCategory) {
      case 'buy': return 'properties for sale';
      case 'rent': return 'rentals';
      case 'projects': return 'projects';
      default: return 'items';
    }
  };

  const getCompareLink = () => {
    return compareCategory === 'projects' ? '/compare-projects' : '/compare';
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border shadow-lg"
      >
        <div className="container py-3 flex items-center justify-between gap-4">
          {/* Left side - icon + items */}
          <div className="flex items-center gap-4 overflow-hidden">
            <div className="flex items-center gap-2 text-sm font-medium shrink-0">
              {compareCategory === 'projects' ? (
                <Building className="h-4 w-4 text-primary" />
              ) : (
                <GitCompare className="h-4 w-4 text-primary" />
              )}
              <span className="hidden sm:inline">{compareIds.length} {getCategoryLabel()}</span>
            </div>

            {/* Item chips */}
            <div className="flex items-center gap-2 overflow-x-auto">
              {compareCategory === 'projects' ? (
                projects.map((project) => (
                  <div 
                    key={project.id}
                    className="flex items-center gap-2 bg-muted/50 rounded-lg px-2 py-1.5 shrink-0"
                  >
                    <PropertyThumbnail
                      src={project.images?.[0]}
                      alt={project.name}
                      className="w-8 h-8 rounded"
                      type="project"
                    />
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-medium truncate max-w-[120px]">{project.name}</span>
                      <span className="text-xs text-primary font-medium">
                        {project.price_from ? formatPrice(project.price_from) : 'TBD'}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 text-muted-foreground hover:text-foreground shrink-0"
                      onClick={() => removeFromCompare(project.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))
              ) : (
                properties.map((property) => (
                  <div 
                    key={property.id}
                    className="flex items-center gap-2 bg-muted/50 rounded-lg px-2 py-1.5 shrink-0"
                  >
                    <PropertyThumbnail
                      src={property.images?.[0]}
                      alt={property.title}
                      className="w-8 h-8 rounded"
                    />
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-medium truncate max-w-[120px]">{property.title}</span>
                      <span className="text-xs text-primary font-medium">
                        {formatPrice(property.price, property.currency)}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 text-muted-foreground hover:text-foreground shrink-0"
                      onClick={() => removeFromCompare(property.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right side - actions */}
          <div className="flex items-center gap-2 shrink-0">
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
              <Link to={getCompareLink()}>
                Compare Now
              </Link>
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
