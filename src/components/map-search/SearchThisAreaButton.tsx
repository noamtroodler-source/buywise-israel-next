import { RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchThisAreaButtonProps {
  visible: boolean;
  onClick: () => void;
}

export function SearchThisAreaButton({ visible, onClick }: SearchThisAreaButtonProps) {
  return (
    <div
      className={cn(
        'absolute top-4 left-1/2 -translate-x-1/2 z-[40] transition-all duration-200',
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'
      )}
    >
      <button
        onClick={onClick}
        className="flex items-center gap-2 px-4 py-2 rounded-full bg-background text-primary font-medium text-sm shadow-lg border border-border hover:bg-accent transition-colors"
      >
        <RefreshCw className="h-3.5 w-3.5" />
        Search this area
      </button>
    </div>
  );
}
