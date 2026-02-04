import { useMemo, useCallback } from 'react';
import { Marker } from 'react-leaflet';
import L from 'leaflet';
import { usePreferences } from '@/contexts/PreferencesContext';

interface Project {
  id: string;
  name: string;
  slug: string;
  city: string;
  latitude: number | null;
  longitude: number | null;
  price_from: number | null;
  status: string;
}

interface ProjectMarkerProps {
  project: Project;
  isHovered?: boolean;
  isSelected?: boolean;
  onHover?: (id: string | null) => void;
  onClick: (slug: string) => void;
}

export function ProjectMarker({
  project,
  isHovered = false,
  isSelected = false,
  onHover,
  onClick,
}: ProjectMarkerProps) {
  const { currency, exchangeRate } = usePreferences();

  // Format price for marker with currency preference
  const displayPrice = useMemo(() => {
    if (!project.price_from) return null;
    
    let price = project.price_from;
    let symbol = '₪';
    
    if (currency === 'USD') {
      price = price / exchangeRate;
      symbol = '$';
    }
    
    if (price >= 1000000) {
      return `From ${symbol}${(price / 1000000).toFixed(1)}M`;
    }
    if (price >= 1000) {
      return `From ${symbol}${Math.round(price / 1000)}K`;
    }
    return `From ${symbol}${price}`;
  }, [project.price_from, currency, exchangeRate]);

  // Create distinct project marker icon
  const icon = useMemo(() => {
    const scaleStyle = (isHovered || isSelected) ? 'transform: scale(1.08);' : '';
    const activeClass = (isHovered || isSelected) ? 'project-marker-active' : '';
    
    return L.divIcon({
      html: `
        <div 
          class="project-marker-wrapper ${activeClass}"
          style="
            position: relative;
            display: flex;
            flex-direction: column;
            align-items: center;
            ${scaleStyle}
            transition: transform 200ms ease;
          "
        >
          <div class="project-marker-pill">
            <svg class="project-marker-icon" width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 10V19H17V14H7V19H5V10L12 3L19 10ZM21 21H3V9L12 0L21 9V21ZM9 19H11V16H13V19H15V12H9V19Z"/>
            </svg>
            <span class="project-marker-name">${project.name}</span>
            ${displayPrice ? `<span class="project-marker-divider">•</span><span class="project-marker-price">${displayPrice}</span>` : ''}
          </div>
          <div class="project-marker-pointer"></div>
        </div>
      `,
      className: '',
      iconSize: L.point(0, 0),
      iconAnchor: L.point(0, 40),
    });
  }, [project.name, displayPrice, isHovered, isSelected]);

  const handleMouseEnter = useCallback(() => {
    onHover?.(project.id);
  }, [project.id, onHover]);

  const handleMouseLeave = useCallback(() => {
    onHover?.(null);
  }, [onHover]);

  const handleClick = useCallback(() => {
    onClick(project.slug);
  }, [project.slug, onClick]);

  if (!project.latitude || !project.longitude) return null;

  return (
    <Marker
      position={[project.latitude, project.longitude]}
      icon={icon}
      zIndexOffset={isHovered || isSelected ? 300 : 150}
      eventHandlers={{
        mouseover: handleMouseEnter,
        mouseout: handleMouseLeave,
        click: handleClick,
      }}
    />
  );
}
