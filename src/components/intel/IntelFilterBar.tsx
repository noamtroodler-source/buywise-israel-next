import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { INTEL_CATEGORIES } from '@/lib/intel/categories';
import { IntelCategory } from '@/hooks/useIntel';
import { cn } from '@/lib/utils';

interface Props {
  category: IntelCategory | 'all';
  source: string | 'all';
  sortBy: 'recent' | 'relevance';
  hasTake: boolean;
  search: string;
  sources: { name: string }[];
  onChange: (next: Partial<{
    category: IntelCategory | 'all';
    source: string | 'all';
    sortBy: 'recent' | 'relevance';
    hasTake: boolean;
    search: string;
  }>) => void;
  onReset: () => void;
}

export function IntelFilterBar(p: Props) {
  const hasActive = p.category !== 'all' || p.source !== 'all' || p.hasTake || p.search.trim().length > 0 || p.sortBy !== 'recent';

  return (
    <div className="sticky top-16 z-30 -mx-4 mb-6 border-b border-border bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:mx-0">
      {/* Search + sort + take toggle */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={p.search}
            onChange={(e) => p.onChange({ search: e.target.value })}
            placeholder="Search headlines…"
            className="pl-9"
          />
        </div>

        <Select value={p.source} onValueChange={(v) => p.onChange({ source: v as string })}>
          <SelectTrigger className="md:w-48"><SelectValue placeholder="All sources" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All sources</SelectItem>
            {p.sources.map((s) => (
              <SelectItem key={s.name} value={s.name}>{s.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={p.sortBy} onValueChange={(v) => p.onChange({ sortBy: v as 'recent' | 'relevance' })}>
          <SelectTrigger className="md:w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Most recent</SelectItem>
            <SelectItem value="relevance">Most relevant</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2">
          <Switch id="hasTake" checked={p.hasTake} onCheckedChange={(v) => p.onChange({ hasTake: v })} />
          <Label htmlFor="hasTake" className="cursor-pointer text-sm">Only with BuyWise Take</Label>
        </div>

        {hasActive && (
          <Button variant="ghost" size="sm" onClick={p.onReset} className="self-start md:self-auto">
            <X className="mr-1 h-4 w-4" /> Reset
          </Button>
        )}
      </div>

      {/* Category chips */}
      <div className="mt-3 -mx-1 flex flex-nowrap gap-2 overflow-x-auto px-1 pb-1">
        <ChipButton active={p.category === 'all'} onClick={() => p.onChange({ category: 'all' })}>All</ChipButton>
        {INTEL_CATEGORIES.filter(c => c.id !== 'general').map((c) => {
          const Icon = c.icon;
          return (
            <ChipButton key={c.id} active={p.category === c.id} onClick={() => p.onChange({ category: c.id })}>
              <Icon className="mr-1 inline h-3.5 w-3.5" />
              {c.label}
            </ChipButton>
          );
        })}
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
