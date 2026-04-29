import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Rocket, Loader2, CheckCircle2, Mail, Users, Home } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { ProvisioningAgency } from '@/hooks/useAgencyProvisioning';

interface Props {
  agency: ProvisioningAgency;
  agentCount: number;
  listingCount: number;
}

export function HandoverSection({ agency, agentCount, listingCount }: Props) {
  const qc = useQueryClient();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handover = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('handover-agency', {
        body: { agencyId: agency.id },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      return data as { agentsEmailed: number; agentsTotal: number; strategy: string };
    },
    onSuccess: (data) => {
      toast.success(`Handover complete — owner + ${data.agentsEmailed} agent emails sent`);
      qc.invalidateQueries({ queryKey: ['provisioning-agency'] });
      qc.invalidateQueries({ queryKey: ['provisioning-agencies'] });
      setConfirmOpen(false);
    },
    onError: (e: any) => {
      toast.error(e?.message || 'Handover failed');
    },
  });

  const status = agency.management_status;
  const isHandedOver = status === 'handed_over' || status === 'claimed';
  const ownerProvisioned = !!agency.admin_user_id && !!agency.email;
  const canHandover = ownerProvisioned && !isHandedOver;

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Rocket className="h-5 w-5 text-primary" />
            Handover
          </h2>
          <p className="text-sm text-muted-foreground">
            Send welcome emails and pass the agency to its owner.
          </p>
        </div>
        {isHandedOver ? (
          <Badge variant="secondary" className="gap-1">
            <CheckCircle2 className="h-3 w-3" /> Handed over
          </Badge>
        ) : (
          <Badge variant="outline">{status.replace(/_/g, ' ')}</Badge>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3 text-sm">
        <div className="border rounded-lg p-3">
          <div className="flex items-center gap-2 text-muted-foreground text-xs">
            <Users className="h-3 w-3" /> Agents
          </div>
          <div className="text-lg font-semibold mt-1">{agentCount}</div>
        </div>
        <div className="border rounded-lg p-3">
          <div className="flex items-center gap-2 text-muted-foreground text-xs">
            <Home className="h-3 w-3" /> Listings
          </div>
          <div className="text-lg font-semibold mt-1">{listingCount}</div>
        </div>
        <div className="border rounded-lg p-3">
          <div className="flex items-center gap-2 text-muted-foreground text-xs">
            <Mail className="h-3 w-3" /> Strategy
          </div>
          <div className="text-xs font-medium mt-1">Owner + agents</div>
        </div>
      </div>

      {!ownerProvisioned && (
        <p className="text-xs text-muted-foreground">
          Provision the owner account and add an email above before handing over.
        </p>
      )}

      <div className="flex gap-2">
        <Button
          onClick={() => setConfirmOpen(true)}
          disabled={!canHandover}
          className="gap-2"
        >
          <Rocket className="h-4 w-4" />
          {isHandedOver ? 'Already handed over' : 'Hand over agency'}
        </Button>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hand over {agency.name}?</DialogTitle>
            <DialogDescription className="pt-2 space-y-2">
              <span className="block">
                The owner ({agency.email}) will receive a welcome email with a
                link to set their password.
              </span>
              <span className="block">
                All <strong>{agentCount}</strong> agents will also receive
                welcome emails immediately.
              </span>
              <span className="block text-xs">
                Status will move to <code>handed_over</code>.
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => handover.mutate()} disabled={handover.isPending}>
              {handover.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Confirm handover
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
