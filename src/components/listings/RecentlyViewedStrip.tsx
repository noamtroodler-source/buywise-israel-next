import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { X, Clock, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { useFormatPrice } from '@/contexts/PreferencesContext';
import { Property } from '@/types/database';
import { Project } from '@/types/projects';

interface RecentlyViewedStripProps {
  items: (Property | Project)[];
  type: 'property' | 'project';
  onClear: () => void;
  maxItems?: number;
}

function isProject(item: Property | Project): item is Project {
  return 'name' in item && !('bedrooms' in item);
}

export function RecentlyViewedStrip({ 
  items, 
  type, 
  onClear, 
  maxItems = 6 
}: RecentlyViewedStripProps) {
  const formatPrice = useFormatPrice();
  const displayItems = items.slice(0, maxItems);

  if (displayItems.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6 rounded-lg border border-border bg-card p-4"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span>Recently Viewed</span>
          <span className="text-muted-foreground">({items.length})</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="h-8 text-xs text-muted-foreground hover:text-foreground"
        >
          <X className="h-3 w-3 mr-1" />
          Clear
        </Button>
      </div>

      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex gap-3">
          {displayItems.map((item) => {
            const isProjectItem = isProject(item);
            const link = isProjectItem 
              ? `/projects/${item.slug}` 
              : `/property/${item.id}`;
            const title = isProjectItem ? item.name : item.title;
            const image = isProjectItem 
              ? (item.images?.[0] || '/placeholder.svg')
              : (item.images?.[0] || '/placeholder.svg');
            const price = isProjectItem ? item.price_from : item.price;
            const location = isProjectItem 
              ? `${item.neighborhood || ''} ${item.city}`.trim()
              : `${item.neighborhood || ''} ${item.city}`.trim();

            return (
              <Link
                key={item.id}
                to={link}
                className="group flex-shrink-0 w-48 rounded-lg border border-border bg-background hover:border-primary/50 transition-colors overflow-hidden"
              >
                <div className="relative h-24 overflow-hidden">
                  <img
                    src={image}
                    alt={title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-2">
                  <p className="text-sm font-semibold text-primary truncate">
                    {formatPrice(price || 0, 'ILS')}
                  </p>
                  <p className="text-xs text-foreground truncate">{title}</p>
                  <p className="text-xs text-muted-foreground truncate">{location}</p>
                </div>
              </Link>
            );
          })}

          {items.length > maxItems && (
            <Link
              to={type === 'property' ? '/profile?tab=recent' : '/profile?tab=recent'}
              className="flex-shrink-0 w-24 rounded-lg border border-dashed border-border bg-muted/50 hover:bg-muted transition-colors flex flex-col items-center justify-center gap-1"
            >
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                +{items.length - maxItems} more
              </span>
            </Link>
          )}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </motion.div>
  );
}
