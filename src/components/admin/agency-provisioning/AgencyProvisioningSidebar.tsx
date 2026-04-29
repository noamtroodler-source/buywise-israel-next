import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Plus, Building2, Trash2, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ProvisioningAgency } from '@/hooks/useAgencyProvisioning';

interface Props {
  agencies: ProvisioningAgency[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onDelete: (id: string) => void;
  deletingId?: string | null;
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

export function AgencyProvisioningSidebar({ agencies, selectedId, onSelect, onCreate, onDelete, deletingId }: Props) {
  const inProgressAgencies = agencies.filter(a => a.management_status !== 'handed_over');
  const onboardingAgencies = agencies.filter(a => a.management_status === 'handed_over');

  return (
    <div className="border rounded-lg bg-card">
      <div className="p-3 border-b flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-sm">In progress</h3>
          <p className="text-xs text-muted-foreground">{inProgressAgencies.length} agencies</p>
        </div>
        <Button size="sm" variant="outline" onClick={onCreate}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <ScrollArea className="h-[calc(100vh-20rem)]">
        <div className="p-2 space-y-1">
          {inProgressAgencies.length === 0 && (
            <div className="text-center text-sm text-muted-foreground p-6">
              <Building2 className="h-8 w-8 mx-auto mb-2 opacity-40" />
              No agencies in progress.
            </div>
          )}
          {inProgressAgencies.map(a => (
            <div
              key={a.id}
              className={cn(
                'group flex items-start gap-1 rounded-md p-2 transition-colors',
                selectedId === a.id ? 'bg-primary/10 text-primary' : 'hover:bg-muted'
              )}
            >
              <button onClick={() => onSelect(a.id)} className="min-w-0 flex-1 text-left">
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
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={deletingId === a.id}
                    className="h-7 w-7 shrink-0 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100 focus-visible:opacity-100"
                    aria-label={`Delete ${a.name}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete {a.name}?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This removes the agency, agents, listings, import history, and provisioning records connected to it. This cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => onDelete(a.id)}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          ))}
          {onboardingAgencies.length > 0 && (
            <div className="pt-3 mt-3 border-t">
              <div className="px-2 pb-2">
                <h3 className="font-semibold text-sm">Pending handover / Onboarding</h3>
                <p className="text-xs text-muted-foreground">{onboardingAgencies.length} agencies</p>
              </div>
              <div className="space-y-1">
                {onboardingAgencies.map(a => (
                  <button
                    key={a.id}
                    onClick={() => onSelect(a.id)}
                    className={cn(
                      'w-full rounded-md p-2 text-left transition-colors',
                      selectedId === a.id ? 'bg-primary/10 text-primary' : 'hover:bg-muted'
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-sm truncate">{a.name}</span>
                      <Badge variant="secondary" className="text-[10px] flex-shrink-0 gap-1">
                        <Send className="h-3 w-3" /> Onboarding
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 truncate">
                      Welcome emails sent · monitor setup
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
