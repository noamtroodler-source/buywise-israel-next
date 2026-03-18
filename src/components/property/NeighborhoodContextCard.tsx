import { useNeighborhoodProfile } from '@/hooks/useNeighborhoodProfile';
import { 
  Building2, Users, Coffee, Train, AlertTriangle, Target, 
  MapPin, Link as LinkIcon, ChevronDown 
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface NeighborhoodContextCardProps {
  city: string;
  neighborhood: string | null | undefined;
}

interface SectionProps {
  icon: React.ReactNode;
  label: string;
  content: string;
  variant?: 'default' | 'warning' | 'highlight';
}

function Section({ icon, label, content, variant = 'default' }: SectionProps) {
  return (
    <div className={cn(
      'flex gap-3 py-3',
      variant === 'warning' && 'bg-destructive/5 -mx-4 px-4 rounded-lg',
      variant === 'highlight' && 'bg-primary/5 -mx-4 px-4 rounded-lg',
    )}>
      <div className={cn(
        'flex-shrink-0 mt-0.5',
        variant === 'warning' ? 'text-destructive' : 
        variant === 'highlight' ? 'text-primary' : 
        'text-muted-foreground'
      )}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-0.5">{label}</p>
        <p className="text-sm text-foreground leading-relaxed">{content}</p>
      </div>
    </div>
  );
}

export function NeighborhoodContextCard({ city, neighborhood }: NeighborhoodContextCardProps) {
  const { data: profile, isLoading } = useNeighborhoodProfile(city, neighborhood);
  const [showSources, setShowSources] = useState(false);

  if (isLoading || !profile) return null;

  const sections: (SectionProps & { key: string })[] = [];

  if (profile.reputation) {
    sections.push({ key: 'reputation', icon: <MapPin className="h-4 w-4" />, label: 'Reputation & Positioning', content: profile.reputation });
  }
  if (profile.physical_character) {
    sections.push({ key: 'physical', icon: <Building2 className="h-4 w-4" />, label: 'Physical Character', content: profile.physical_character });
  }
  if (profile.proximity_anchors) {
    sections.push({ key: 'proximity', icon: <Target className="h-4 w-4" />, label: 'Proximity Anchors', content: profile.proximity_anchors });
  }
  if (profile.anglo_community) {
    sections.push({ key: 'anglo', icon: <Users className="h-4 w-4" />, label: 'Anglo & International Community', content: profile.anglo_community });
  }
  if (profile.daily_life) {
    sections.push({ key: 'daily', icon: <Coffee className="h-4 w-4" />, label: 'Daily Life Infrastructure', content: profile.daily_life });
  }
  if (profile.transit_mobility) {
    sections.push({ key: 'transit', icon: <Train className="h-4 w-4" />, label: 'Transit & Mobility', content: profile.transit_mobility });
  }
  if (profile.honest_tradeoff) {
    sections.push({ key: 'tradeoff', icon: <AlertTriangle className="h-4 w-4" />, label: 'Honest Trade-off', content: profile.honest_tradeoff, variant: 'warning' });
  }
  if (profile.best_for) {
    sections.push({ key: 'bestfor', icon: <Target className="h-4 w-4" />, label: 'Best For', content: profile.best_for, variant: 'highlight' });
  }

  if (sections.length === 0) return null;

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 mb-3">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Neighborhood Guide</p>
      </div>

      <div className="divide-y divide-border">
        {sections.map((s) => (
          <Section key={s.key} icon={s.icon} label={s.label} content={s.content} variant={s.variant as any} />
        ))}
      </div>

      {profile.sources && (
        <div className="pt-3">
          <button
            onClick={() => setShowSources(!showSources)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <LinkIcon className="h-3 w-3" />
            <span>Sources</span>
            <motion.div animate={{ rotate: showSources ? 180 : 0 }} transition={{ duration: 0.2 }}>
              <ChevronDown className="h-3 w-3" />
            </motion.div>
          </button>
          <AnimatePresence>
            {showSources && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed whitespace-pre-wrap">
                  {profile.sources}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
