import { useMemo } from 'react';
import { Popup } from 'react-leaflet';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useFormatPrice } from '@/contexts/PreferencesContext';
import { Building2, X } from 'lucide-react';

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

interface MapProjectPopupProps {
  project: Project;
  onClose: () => void;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  'pre_sale': { label: 'Pre-Sale', color: 'bg-amber-500/15 text-amber-700 border-amber-200' },
  'under_construction': { label: 'Under Construction', color: 'bg-blue-500/15 text-blue-700 border-blue-200' },
  'ready': { label: 'Ready to Move', color: 'bg-emerald-500/15 text-emerald-700 border-emerald-200' },
  'planning': { label: 'Planning', color: 'bg-slate-500/15 text-slate-700 border-slate-200' },
};

export function MapProjectPopup({ project, onClose }: MapProjectPopupProps) {
  const formatPrice = useFormatPrice();

  const statusInfo = useMemo(() => {
    return STATUS_LABELS[project.status] || { label: project.status, color: 'bg-muted text-muted-foreground' };
  }, [project.status]);

  if (!project.latitude || !project.longitude) return null;

  return (
    <Popup
      position={[project.latitude, project.longitude]}
      closeButton={false}
      className="property-popup"
      maxWidth={240}
      minWidth={240}
      autoPan={false}
      offset={[0, -8]}
    >
      <div className="bg-card text-card-foreground rounded-xl overflow-hidden shadow-lg">
        {/* Colored header bar */}
        <div className="relative h-14 bg-gradient-to-r from-primary/80 to-primary flex items-center justify-center">
          <Building2 className="h-6 w-6 text-primary-foreground/80" />
          <button
            onClick={onClose}
            className="absolute top-1.5 right-1.5 z-10 w-6 h-6 rounded-full bg-background/90 hover:bg-background flex items-center justify-center shadow-sm transition-colors"
            aria-label="Close popup"
          >
            <X className="h-3.5 w-3.5 text-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="p-2.5 space-y-1.5">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-sm leading-tight line-clamp-2">{project.name}</h3>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 border ${statusInfo.color}`}>
              {statusInfo.label}
            </Badge>
            <span className="text-xs text-muted-foreground">{project.city}</span>
          </div>

          {project.price_from && (
            <p className="font-bold text-sm text-foreground">
              From {formatPrice(project.price_from, 'ILS')}
            </p>
          )}

          <Button asChild className="w-full h-8 text-xs" size="sm">
            <Link to={`/projects/${project.slug}`}>
              View Project
            </Link>
          </Button>
        </div>
      </div>
    </Popup>
  );
}
