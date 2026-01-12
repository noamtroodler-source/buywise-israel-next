import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export type Audience = 'all' | 'olim' | 'investors' | 'first-time' | 'families';

interface AudienceFilterProps {
  selected: Audience;
  onChange: (audience: Audience) => void;
}

const audiences: { value: Audience; label: string }[] = [
  { value: 'all', label: 'All Guides' },
  { value: 'olim', label: 'Olim' },
  { value: 'investors', label: 'Investors' },
  { value: 'first-time', label: 'First-Time Buyers' },
  { value: 'families', label: 'Families' },
];

export function AudienceFilter({ selected, onChange }: AudienceFilterProps) {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {audiences.map((audience) => (
        <button
          key={audience.value}
          onClick={() => onChange(audience.value)}
          className={cn(
            "relative px-4 py-2 rounded-full text-sm font-medium transition-colors",
            selected === audience.value
              ? "text-primary-foreground"
              : "text-muted-foreground hover:text-foreground bg-muted/50 hover:bg-muted"
          )}
        >
          {selected === audience.value && (
            <motion.div
              layoutId="audience-filter-active"
              className="absolute inset-0 bg-primary rounded-full"
              transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
            />
          )}
          <span className="relative z-10">{audience.label}</span>
        </button>
      ))}
    </div>
  );
}
