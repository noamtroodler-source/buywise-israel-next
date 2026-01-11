import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, BellOff, Trash2, MessageSquare, Target, Search, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { Property } from '@/types/database';
import { FavoriteCategory, FavoriteWithProperty } from '@/hooks/useFavorites';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';

interface FavoritePropertyCardProps {
  favorite: FavoriteWithProperty;
  onCategoryChange: (category: FavoriteCategory, ruledOutReason?: string) => void;
  onTogglePriceAlert: () => void;
  onRemove: () => void;
  isTogglingAlert?: boolean;
  pendingCategory?: FavoriteCategory | null;
}

const formatPrice = (price: number): string => {
  if (price >= 1000000) {
    return `₪${(price / 1000000).toFixed(1)}M`;
  }
  return `₪${price.toLocaleString()}`;
};

export function FavoritePropertyCard({
  favorite,
  onCategoryChange,
  onTogglePriceAlert,
  onRemove,
  isTogglingAlert,
  pendingCategory,
}: FavoritePropertyCardProps) {
  const property = favorite.properties;
  
  if (!property) return null;

  const alertEnabled = favorite.price_alert_enabled !== false;
  const currentCategory = pendingCategory || favorite.category || 'considering';
  const imageUrl = property.images?.[0] || '/placeholder.svg';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-card rounded-xl border border-border overflow-hidden group hover:shadow-md transition-shadow"
    >
      {/* Image */}
      <Link to={`/properties/${property.id}`} className="block relative aspect-[4/3] overflow-hidden">
        <img
          src={imageUrl}
          alt={property.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-2 left-2">
          <Badge variant="secondary" className="bg-background/90">
            {property.property_type}
          </Badge>
        </div>
        
        {/* Action buttons on image */}
        <div className="absolute top-2 right-2 flex gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-8 w-8 bg-background/80 hover:bg-background ${
                    alertEnabled ? 'text-primary' : 'text-muted-foreground'
                  }`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onTogglePriceAlert();
                  }}
                  disabled={isTogglingAlert}
                >
                  {alertEnabled ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{alertEnabled ? 'Price alerts on' : 'Price alerts off'}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 bg-background/80 hover:bg-destructive hover:text-destructive-foreground text-muted-foreground"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onRemove();
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Remove from favorites</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </Link>

      {/* Content */}
      <div className="p-4 space-y-3">
        <Link to={`/properties/${property.id}`}>
          <h3 className="font-semibold text-foreground line-clamp-1 hover:text-primary transition-colors">
            {property.title}
          </h3>
        </Link>
        
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-primary">
            {formatPrice(property.price)}
          </span>
          <span className="text-sm text-muted-foreground">
            {property.city}
          </span>
        </div>

        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          {property.bedrooms !== null && <span>{property.bedrooms} bd</span>}
          {property.bathrooms !== null && <span>{property.bathrooms} ba</span>}
          {property.size_sqm && <span>{property.size_sqm} m²</span>}
        </div>

        {/* Category selector */}
        <div className="pt-2 border-t border-border">
          <Select
            value={currentCategory}
            onValueChange={(value) => onCategoryChange(value as FavoriteCategory)}
          >
            <SelectTrigger className="w-full h-9">
              <SelectValue placeholder="Move to..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="final_list">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-green-500" />
                  <span>Final List</span>
                </div>
              </SelectItem>
              <SelectItem value="considering">
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4 text-blue-500" />
                  <span>Considering</span>
                </div>
              </SelectItem>
              <SelectItem value="ruled_out">
                <div className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-muted-foreground" />
                  <span>Ruled Out</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Ruled out reason */}
        {favorite.category === 'ruled_out' && favorite.ruled_out_reason && (
          <div className="flex items-start gap-2 p-2 rounded-lg bg-muted/50 text-sm">
            <MessageSquare className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
            <p className="text-muted-foreground italic line-clamp-2">
              "{favorite.ruled_out_reason}"
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}