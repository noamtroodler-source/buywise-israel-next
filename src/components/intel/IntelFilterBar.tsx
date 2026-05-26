import { Search, SlidersHorizontal, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { INTEL_CATEGORIES } from '@/lib/intel/categories';
import { IntelCategory } from '@/hooks/useIntel';
import { cn } from '@/lib/utils';

interface Props {
  category: IntelCategory | 'all';
  source: string | 'all';
  sortBy: 'recent' | 'relevance';
  search: string;
  sources: { name: string }[];
  onChange: (next: Partial<{
    category: IntelCategory | 'all';
    source: string | 'all';
    sortBy: 'recent' | 'relevance';
    search: string;
  }>) => void;
  onReset: () => void;
}

export function IntelFilterBar(p: Props) {
  const activeCount =
    (p.source !== 'all' ? 1 : 0) +
    (p.sortBy !== 'recent' ? 1 : 0) +
    (p.search.trim() ? 1 : 0);
  const hasAny = activeCount > 0 || p.category !== 'all';

  return (
    <div className="mb-8 border-b border-border/60 pb-4">
      <div className="flex items-center gap-2 overflow-x-auto -mx-1 px-1 pb-1">
        <ChipButton active={p.category === 'all'} onClick={() => p.onChange({ category: 'all' })}>
          All
        </ChipButton>
        {INTEL_CATEGORIES.filter((c) => c.id !== 'general').map((c) => {
          const Icon = c.icon;
          return (
            <ChipButton key={c.id} active={p.category === c.id} onClick={() => p.onChange({ category: c.id })}>
              <Icon className="mr-1 inline h-3.5 w-3.5" />
              {c.label}
            </ChipButton>
          );
        })}

        <div className="ml-auto flex shrink-0 items-center gap-1.5 pl-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-1.5">
                <SlidersHorizontal className="h-3.5 w-3.5" />
                <span className="text-xs">Filter</span>
                {activeCount > 0 && (
                  <span className="ml-0.5 rounded-full bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground">
                    {activeCount}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-72 space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">Search</Label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={p.search}
                    onChange={(e) => p.onChange({ search: e.target.value })}
                    placeholder="Search headlines…"
                    className="h-9 pl-8 text-sm"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">Source</Label>
                <Select value={p.source} onValueChange={(v) => p.onChange({ source: v as string })}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All sources</SelectItem>
                    {p.sources.map((s) => (
                      <SelectItem key={s.name} value={s.name}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">Sort</Label>
                <Select value={p.sortBy} onValueChange={(v) => p.onChange({ sortBy: v as 'recent' | 'relevance' })}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recent">Most recent</SelectItem>
                    <SelectItem value="relevance">Most relevant</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </PopoverContent>
          </Popover>

          {hasAny && (
            <Button variant="ghost" size="sm" onClick={p.onReset} className="h-8 px-2">
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function ChipButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
        active
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground',
      )}
    >
      {children}
    </button>
  );
}
