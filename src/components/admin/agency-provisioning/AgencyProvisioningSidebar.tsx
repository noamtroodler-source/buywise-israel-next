import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ProvisioningAgency } from '@/hooks/useAgencyProvisioning';

interface Props {
  agencies: ProvisioningAgency[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onCreate: () => void;
}

const STATUS_LABEL: Record<string, string> = {
  draft: 'Draft',
  provisioning: 'Provisioning',
  quality_review: 'Quality review',
  ready_for_handover: 'Ready',
  handed_over: 'Handed over',
  claimed: 'Claimed',
};

const STATUS_VARIANT: Record<string, 'outline' | 'secondary' | 'default'> = {
  draft: 'outline',
  provisioning: 'secondary',
  quality_review: 'secondary',
  ready_for_handover: 'default',
};

export function AgencyProvisioningSidebar({ agencies, selectedId, onSelect, onCreate }: Props) {
  return (
    <div className="border rounded-lg bg-card">
      <div className="p-3 border-b flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-sm">In progress</h3>
          <p className="text-xs text-muted-foreground">{agencies.length} agencies</p>
        </div>
        <Button size="sm" variant="outline" onClick={onCreate}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <ScrollArea className="h-[calc(100vh-20rem)]">
        <div className="p-2 space-y-1">
          {agencies.length === 0 && (
            <div className="text-center text-sm text-muted-foreground p-6">
              <Building2 className="h-8 w-8 mx-auto mb-2 opacity-40" />
              No agencies in progress.
            </div>
          )}
          {agencies.map(a => (
            <button
              key={a.id}
              onClick={() => onSelect(a.id)}
              className={cn(
                'w-full text-left p-2 rounded-md transition-colors',
                selectedId === a.id ? 'bg-primary/10 text-primary' : 'hover:bg-muted'
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-sm truncate">{a.name}</span>
                <Badge
                  variant={STATUS_VARIANT[a.management_status] || 'outline'}
                  className="text-[10px] flex-shrink-0"
                >
                  {STATUS_LABEL[a.management_status] || a.management_status}
                </Badge>
              </div>
              {a.cities_covered && a.cities_covered.length > 0 && (
                <div className="text-xs text-muted-foreground mt-1 truncate">
                  {a.cities_covered.slice(0, 2).join(' · ')}
                </div>
              )}
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
