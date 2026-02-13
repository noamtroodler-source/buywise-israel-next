import { Search } from 'lucide-react';

interface SearchThisAreaButtonProps {
  onClick: () => void;
}

export function SearchThisAreaButton({ onClick }: SearchThisAreaButtonProps) {
  return (
    <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[40]">
      <button
        onClick={onClick}
        className="flex items-center gap-2 px-4 py-2 bg-background/95 backdrop-blur-sm rounded-full border border-border shadow-lg text-sm font-medium hover:bg-accent transition-colors"
      >
        <Search className="h-4 w-4" />
        Search this area
      </button>
    </div>
  );
}
