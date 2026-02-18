import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Home, Building2, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { VisibilityProduct } from '@/hooks/useBoosts';
import { useAgencyListingsManagement } from '@/hooks/useAgencyListings';
import { useDeveloperProjects } from '@/hooks/useDeveloperProjects';

interface ListingPickerSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: VisibilityProduct | null;
  entityType: 'agency' | 'developer';
  entityId: string | undefined;
  creditBalance: number;
  onConfirm: (product: VisibilityProduct, targetType: 'property' | 'project', targetId: string) => void;
  isActivating?: boolean;
}

export function ListingPickerSheet({
  open,
  onOpenChange,
  product,
  entityType,
  entityId,
  creditBalance,
  onConfirm,
  isActivating,
}: ListingPickerSheetProps) {
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data: agencyListings = [], isLoading: listingsLoading } = useAgencyListingsManagement(
    entityType === 'agency' ? entityId : undefined
  );
  const { data: developerProjects = [], isLoading: projectsLoading } = useDeveloperProjects();

  const isLoading = entityType === 'agency' ? listingsLoading : projectsLoading;

  const items = entityType === 'agency'
    ? agencyListings
        .filter(l => l.verification_status === 'approved')
        .map(l => ({ id: l.id, title: l.title, subtitle: `${l.city} · ${l.property_type}`, targetType: 'property' as const }))
    : developerProjects
        .filter(p => p.verification_status === 'approved')
        .map(p => ({ id: p.id, title: p.name, subtitle: `${p.city}`, targetType: 'project' as const }));

  const filtered = items.filter(item =>
    item.title.toLowerCase().includes(search.toLowerCase()) ||
    item.subtitle.toLowerCase().includes(search.toLowerCase())
  );

  const selected = filtered.find(i => i.id === selectedId);
  const canAfford = product ? creditBalance >= product.credit_cost : false;

  const handleConfirm = () => {
    if (!product || !selected) return;
    onConfirm(product, selected.targetType, selected.id);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md flex flex-col gap-0 p-0">
        <SheetHeader className="p-6 pb-4 border-b border-border">
          <SheetTitle className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            {product?.name}
          </SheetTitle>
          <SheetDescription>
            Select a {entityType === 'agency' ? 'listing' : 'project'} to boost.{' '}
            Costs <strong>{product?.credit_cost} credits</strong> · {product?.duration_days} days.
          </SheetDescription>
        </SheetHeader>

        {/* Search */}
        <div className="px-6 py-3 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={`Search ${entityType === 'agency' ? 'listings' : 'projects'}…`}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 rounded-xl"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-14 rounded-xl" />
            ))
          ) : filtered.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-sm">
              No approved {entityType === 'agency' ? 'listings' : 'projects'} found.
            </div>
          ) : (
            filtered.map(item => (
              <button
                key={item.id}
                onClick={() => setSelectedId(item.id === selectedId ? null : item.id)}
                className={cn(
                  'w-full text-left p-3 rounded-xl border transition-all flex items-center gap-3',
                  selectedId === item.id
                    ? 'border-primary/40 bg-primary/5 shadow-sm'
                    : 'border-border hover:border-primary/20 hover:bg-muted/30'
                )}
              >
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  {item.targetType === 'property'
                    ? <Home className="h-4 w-4 text-primary" />
                    : <Building2 className="h-4 w-4 text-primary" />
                  }
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm truncate">{item.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{item.subtitle}</p>
                </div>
                {selectedId === item.id && (
                  <Badge className="bg-primary/10 text-primary border-primary/20 text-xs shrink-0">Selected</Badge>
                )}
              </button>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-6 pt-4 border-t border-border space-y-3">
          {!canAfford && (
            <p className="text-xs text-destructive text-center">
              Insufficient credits. You need {product?.credit_cost} but have {creditBalance}.
            </p>
          )}
          <Button
            className="w-full rounded-xl"
            disabled={!selectedId || !canAfford || isActivating}
            onClick={handleConfirm}
          >
            {isActivating ? 'Activating…' : `Confirm — ${product?.credit_cost} credits`}
          </Button>
          <Button variant="ghost" className="w-full rounded-xl" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
