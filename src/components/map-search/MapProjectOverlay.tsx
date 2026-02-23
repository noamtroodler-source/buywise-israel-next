import { memo, useCallback, useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Building2 } from 'lucide-react';
import { Project } from '@/types/projects';
import { ProjectFavoriteButton } from '@/components/project/ProjectFavoriteButton';
import { Badge } from '@/components/ui/badge';
import { useFormatPrice } from '@/contexts/PreferencesContext';
import { cn } from '@/lib/utils';
import { PROJECT_STATUS_LABELS } from '@/lib/seo/constants';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&auto=format&fit=crop&q=60';

interface MapProjectOverlayProps {
  project: Project;
  map: google.maps.Map;
  onClose: () => void;
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

export const MapProjectOverlay = memo(function MapProjectOverlay({
  project,
  map,
  onClose,
}: MapProjectOverlayProps) {
  const formatPrice = useFormatPrice();
  const overlayRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);

  const computePos = useCallback(() => {
    if (!project.latitude || !project.longitude) return;
    const p = latLngToPixel(map, project.latitude, project.longitude);
    if (p) setPos(p);
  }, [map, project.latitude, project.longitude]);

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

  const images = project.images?.length ? project.images : [null];
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

  const priceDisplay = project.price_from
    ? project.price_to && project.price_to !== project.price_from
      ? `${formatPrice(project.price_from, project.currency)} – ${formatPrice(project.price_to, project.currency)}`
      : `From ${formatPrice(project.price_from, project.currency)}`
    : 'Contact for pricing';

  const bedroomRange = project.min_bedrooms != null && project.max_bedrooms != null
    ? project.min_bedrooms === project.max_bedrooms
      ? `${project.min_bedrooms} bed`
      : `${project.min_bedrooms}–${project.max_bedrooms} bed`
    : null;

  const stats = [
    bedroomRange,
    project.available_units > 0 ? `${project.available_units} units` : null,
  ].filter(Boolean).join(' · ');

  const completionYear = project.completion_date
    ? new Date(project.completion_date).getFullYear()
    : null;

  const stageLabel = PROJECT_STATUS_LABELS[project.status] || null;

  const locationParts = [
    ...[project.neighborhood, project.city].filter(Boolean),
    stageLabel,
    completionYear ? `Est. ${completionYear}` : null,
  ].filter(Boolean).join(' · ');

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
        to={`/projects/${project.slug}`}
        className="map-overlay-card block w-[260px] no-underline text-foreground group rounded-xl overflow-hidden bg-background border border-border shadow-[0_4px_14px_rgba(0,0,0,0.18)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative w-full h-[140px] overflow-hidden bg-muted">
          {images.map((img, i) => (
            <img
              key={i}
              ref={(el) => { imgRefs.current[i] = el; }}
              src={img || FALLBACK_IMAGE}
              alt={`${project.name} ${i + 1}`}
              loading="eager"
              decoding="async"
              onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMAGE; }}
              className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ease-in-out"
              style={{ opacity: i === 0 ? 1 : 0 }}
            />
          ))}

          <div className="absolute top-2 right-2 z-10">
            <ProjectFavoriteButton projectId={project.id} />
          </div>

          <div className="absolute top-2 left-2 z-10">
            <Badge className="text-xs gap-1 bg-emerald-500/90 text-white border-emerald-500/90 backdrop-blur-sm">
              <Building2 className="h-3 w-3" />
              New Development
            </Badge>
          </div>

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
        </div>

        <div className="p-2.5 space-y-0.5">
          <span className="text-base font-bold text-foreground leading-tight">
            {priceDisplay}
          </span>
          {project.developer?.name && project.developer?.slug && (
            <Link
              to={`/developers/${project.developer.slug}`}
              className="inline-flex items-center gap-0.5 text-xs text-muted-foreground hover:text-primary transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <span className="truncate">by {project.developer.name}</span>
              <ChevronRight className="h-3 w-3 shrink-0" />
            </Link>
          )}
          <p className="text-sm font-medium text-foreground truncate">{project.name}</p>
          {stats && (
            <p className="text-sm text-muted-foreground">{stats}</p>
          )}
          <p className="text-sm text-muted-foreground truncate">{locationParts}</p>
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
