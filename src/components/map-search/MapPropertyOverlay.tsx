import { memo, useCallback, useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { Property } from '@/types/database';
import { FavoriteButton } from '@/components/property/FavoriteButton';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useFormatPrice, useFormatArea, useFormatPricePerArea } from '@/contexts/PreferencesContext';
import { cn } from '@/lib/utils';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&auto=format&fit=crop&q=60';

interface MapPropertyOverlayProps {
  property: Property;
  map: google.maps.Map;
  onClose: () => void;
}

function getStatusBadge(property: Property) {
  const createdAt = new Date(property.created_at);
  const now = new Date();
  const daysSinceListed = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
  const isRental = property.listing_status === 'for_rent';

  if (property.is_featured) {
    return { label: 'Featured', variant: 'default' as const, icon: Sparkles };
  }
  if (property.original_price && property.original_price > property.price) {
    const dropPct = Math.round(((property.original_price - property.price) / property.original_price) * 100);
    return { label: `Price Drop ${dropPct}%`, variant: 'destructive' as const, icon: null };
  }
  if (daysSinceListed <= 3) {
    return { label: isRental ? 'Just Available' : 'Just Listed', variant: 'default' as const, icon: null };
  }
  if (daysSinceListed <= 14) {
    return { label: 'New', variant: 'outline' as const, icon: null };
  }
  return null;
}

function latLngToPixel(map: google.maps.Map, lat: number, lng: number): { x: number; y: number } | null {
  const projection = map.getProjection();
  if (!projection) return null;
  const bounds = map.getBounds();
  if (!bounds) return null;
  const topRight = projection.fromLatLngToPoint(bounds.getNorthEast())!;
  const bottomLeft = projection.fromLatLngToPoint(bounds.getSouthWest())!;
  const scale = Math.pow(2, map.getZoom()!);
  const worldPoint = projection.fromLatLngToPoint(new google.maps.LatLng(lat, lng))!;
  const mapDiv = map.getDiv();
  const x = (worldPoint.x - bottomLeft.x) * scale;
  const y = (worldPoint.y - topRight.y) * scale;
  return { x: x * (mapDiv.offsetWidth / ((topRight.x - bottomLeft.x) * scale)), y: y * (mapDiv.offsetHeight / ((bottomLeft.y - topRight.y) * scale)) };
}

export const MapPropertyOverlay = memo(function MapPropertyOverlay({
  property,
  map,
  onClose,
}: MapPropertyOverlayProps) {
  const formatPrice = useFormatPrice();
  const formatArea = useFormatArea();
  const formatPricePerArea = useFormatPricePerArea();

  const overlayRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);

  const updatePosition = useCallback(() => {
    if (!property.latitude || !property.longitude) return;
    const mapDiv = map.getDiv();
    const overlay = new google.maps.OverlayView();
    overlay.setMap(map);
    overlay.draw = function () {};
    overlay.onAdd = function () {
      const projection = this.getProjection();
      if (!projection) return;
      const point = projection.fromLatLngToContainerPixel(
        new google.maps.LatLng(property.latitude!, property.longitude!)
      );
      if (point) {
        setPos({ x: point.x, y: point.y });
      }
      overlay.setMap(null);
    };
  }, [map, property.latitude, property.longitude]);

  // Use a simpler approach: compute position from bounds/projection
  const computePos = useCallback(() => {
    if (!property.latitude || !property.longitude) return;
    const p = latLngToPixel(map, property.latitude, property.longitude);
    if (p) setPos(p);
  }, [map, property.latitude, property.longitude]);

  useEffect(() => {
    computePos();
    const listener = map.addListener('idle', computePos);
    const moveListener = map.addListener('center_changed', computePos);
    const zoomListener = map.addListener('zoom_changed', computePos);
    return () => {
      google.maps.event.removeListener(listener);
      google.maps.event.removeListener(moveListener);
      google.maps.event.removeListener(zoomListener);
    };
  }, [map, computePos]);

  // Close on click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (overlayRef.current && !overlayRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClick);
    }, 100);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClick);
    };
  }, [onClose]);

  // Image carousel
  const images = property.images?.length ? property.images : [null];
  const totalImages = images.length;
  const indexRef = useRef(0);
  const imgRefs = useRef<(HTMLImageElement | null)[]>([]);
  const dotsRef = useRef<HTMLDivElement | null>(null);

  const goTo = useCallback((next: number) => {
    const prev = indexRef.current;
    if (prev === next) return;
    imgRefs.current[prev]?.style.setProperty('opacity', '0');
    imgRefs.current[next]?.style.setProperty('opacity', '1');
    if (dotsRef.current) {
      const dotMax = Math.min(totalImages, 5);
      const prevDot = dotsRef.current.children[prev % dotMax] as HTMLElement | undefined;
      const nextDot = dotsRef.current.children[next % dotMax] as HTMLElement | undefined;
      prevDot?.classList.remove('dot-active');
      nextDot?.classList.add('dot-active');
    }
    indexRef.current = next;
  }, [totalImages]);

  const prevImage = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    goTo((indexRef.current - 1 + totalImages) % totalImages);
  }, [totalImages, goTo]);

  const nextImage = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    goTo((indexRef.current + 1) % totalImages);
  }, [totalImages, goTo]);

  const badge = getStatusBadge(property);

  const stats = [
    property.bedrooms > 0 ? `${property.bedrooms} bd` : null,
    property.bathrooms > 0 ? `${property.bathrooms} ba` : null,
    property.size_sqm ? formatArea(property.size_sqm) : null,
  ].filter(Boolean).join(' | ');

  const location = [property.neighborhood, property.city].filter(Boolean).join(', ');

  const propertyType = property.property_type
    ? property.property_type.charAt(0).toUpperCase() + property.property_type.slice(1)
    : null;

  const listingLabel = [
    propertyType,
    property.listing_status === 'for_rent' ? 'for rent' : 'for sale',
  ].filter(Boolean).join(' ');

  const pricePerArea = property.size_sqm
    ? formatPricePerArea(property.price / property.size_sqm, property.currency)
    : null;

  const agent = property.agent;

  if (!pos) return null;

  const CARD_WIDTH = 260;
  const TIP_HEIGHT = 10;

  return (
    <div
      ref={overlayRef}
      className="absolute z-[1000] pointer-events-auto"
      style={{
        left: pos.x - CARD_WIDTH / 2,
        top: pos.y,
        transform: `translateY(calc(-100% - ${TIP_HEIGHT}px))`,
        willChange: 'left, top',
      }}
    >
      <Link
        to={`/property/${property.id}`}
        className="map-overlay-card block w-[260px] no-underline text-foreground group rounded-xl overflow-hidden bg-background border border-border shadow-[0_4px_14px_rgba(0,0,0,0.18)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative w-full h-[140px] overflow-hidden bg-muted">
          {images.map((img, i) => (
            <img
              key={i}
              ref={(el) => { imgRefs.current[i] = el; }}
              src={img || FALLBACK_IMAGE}
              alt={`${property.title} ${i + 1}`}
              loading="eager"
              decoding="async"
              onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMAGE; }}
              className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ease-in-out"
              style={{ opacity: i === 0 ? 1 : 0 }}
            />
          ))}

          <div className="absolute top-2 right-2 z-10">
            <FavoriteButton propertyId={property.id} propertyPrice={property.price} />
          </div>

          {badge && (
            <div className="absolute top-2 left-2 z-10">
              <Badge
                variant={badge.variant}
                className={cn(
                  "text-xs gap-1 backdrop-blur-sm",
                  badge.label === 'New' && "bg-emerald-500/90 text-white border-emerald-500/90"
                )}
              >
                {badge.icon && <badge.icon className="h-3 w-3" />}
                {badge.label}
              </Badge>
            </div>
          )}

          {totalImages > 1 && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-1.5 top-1/2 -translate-y-1/2 z-10 h-6 w-6 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center hover:bg-background opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                aria-label="Previous image"
              >
                <ChevronLeft className="h-3.5 w-3.5 text-foreground" />
              </button>
              <button
                onClick={nextImage}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 z-10 h-6 w-6 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center hover:bg-background opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                aria-label="Next image"
              >
                <ChevronRight className="h-3.5 w-3.5 text-foreground" />
              </button>
            </>
          )}

          {totalImages > 1 && (
            <div className="absolute bottom-2 left-0 right-0 z-10 flex justify-center gap-1" ref={dotsRef}>
              {Array.from({ length: Math.min(totalImages, 5) }).map((_, i) => (
                <span
                  key={i}
                  className={cn(
                    "w-1.5 h-1.5 rounded-full transition-colors duration-200",
                    i === 0 ? "bg-white dot-active" : "bg-white/50"
                  )}
                />
              ))}
            </div>
          )}

          {(agent?.agency?.logo_url || agent?.avatar_url) && (
            <div className="absolute bottom-2 right-2 z-10">
              <Avatar className="h-6 w-6 ring-2 ring-background">
                <AvatarImage src={agent.agency?.logo_url ?? agent.avatar_url!} alt={agent.agency?.name ?? agent.name} />
                <AvatarFallback className="text-[10px]">
                  {(agent.agency?.name ?? agent.name)?.charAt(0)}
                </AvatarFallback>
              </Avatar>
            </div>
          )}
        </div>

        <div className="p-2.5 space-y-0.5">
          <div className="flex items-baseline gap-1.5">
            <span className="text-base font-bold text-foreground leading-tight">
              {formatPrice(property.price, property.currency)}
            </span>
            {pricePerArea && (
              <span className="text-xs text-muted-foreground">
                {pricePerArea}
              </span>
            )}
          </div>
          {stats && (
            <p className="text-sm text-muted-foreground">
              {stats}
              {listingLabel ? ` — ${listingLabel}` : ''}
            </p>
          )}
          <p className="text-sm text-muted-foreground truncate">{location}</p>
        </div>
      </Link>

      <div className="flex justify-center">
        <div
          className="w-3 h-3 rotate-45 -mt-1.5 border-r border-b border-border"
          style={{ background: 'hsl(var(--background))' }}
        />
      </div>
    </div>
  );
});
