import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Building2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useProvisioningAgencies, useProvisioningAgency, useCreateAgency } from '@/hooks/useAgencyProvisioning';
import { AgencyProvisioningSidebar } from '@/components/admin/agency-provisioning/AgencyProvisioningSidebar';
import { AgencyProfileSection } from '@/components/admin/agency-provisioning/AgencyProfileSection';
import { AgentRosterSection } from '@/components/admin/agency-provisioning/AgentRosterSection';
import { ListingsQualitySection } from '@/components/admin/agency-provisioning/ListingsQualitySection';

export default function AdminAgencyProvisioning() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedId = searchParams.get('agency');

  const { data: agencies = [], isLoading } = useProvisioningAgencies();
  const { data: selectedAgency } = useProvisioningAgency(selectedId);
  const create = useCreateAgency();

  const [createOpen, setCreateOpen] = useState(false);
  const [newAgency, setNewAgency] = useState({ name: '', slug: '', email: '' });

  // Auto-select first agency if none chosen
  useEffect(() => {
    if (!selectedId && agencies.length > 0) {
      setSearchParams({ agency: agencies[0].id }, { replace: true });
    }
  }, [agencies, selectedId, setSearchParams]);

  function selectAgency(id: string) {
    setSearchParams({ agency: id });
  }

  async function handleCreate() {
    if (!newAgency.name || !newAgency.slug) {
      toast.error('Name and slug required');
      return;
    }
    try {
      const id = await create.mutateAsync({
        name: newAgency.name,
        slug: newAgency.slug,
        email: newAgency.email || undefined,
      });
      toast.success('Agency draft created');
      setNewAgency({ name: '', slug: '', email: '' });
      setCreateOpen(false);
      selectAgency(id);
    } catch (e: any) {
      toast.error(e?.message || 'Failed to create');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Building2 className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Agency Provisioning</h1>
          <p className="text-sm text-muted-foreground">
            White-glove setup: build the agency, roster the agents, and prepare for handover.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
        <AgencyProvisioningSidebar
          agencies={agencies}
          selectedId={selectedId}
          onSelect={selectAgency}
          onCreate={() => setCreateOpen(true)}
        />

        <div className="min-w-0 space-y-6">
          {isLoading ? (
            <div className="border rounded-lg p-12 text-center">
              <Loader2 className="h-6 w-6 animate-spin mx-auto" />
            </div>
          ) : !selectedAgency ? (
            <div className="border rounded-lg p-12 text-center text-muted-foreground">
              <Building2 className="h-10 w-10 mx-auto mb-3 opacity-40" />
              Select an agency from the sidebar, or create a new draft.
              <div className="mt-4">
                <Button onClick={() => setCreateOpen(true)}>Create new agency</Button>
              </div>
            </div>
          ) : (
            <>
              <AgencyProfileSection agency={selectedAgency} />
              <AgentRosterSection agencyId={selectedAgency.id} />
              <ListingsQualitySection agencyId={selectedAgency.id} />
            </>
          )}
        </div>
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create agency draft</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Agency name *</Label>
              <Input
                value={newAgency.name}
                onChange={e => {
                  const name = e.target.value;
                  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
                  setNewAgency({ ...newAgency, name, slug: newAgency.slug || slug });
                }}
              />
            </div>
            <div>
              <Label>Slug *</Label>
              <Input value={newAgency.slug} onChange={e => setNewAgency({ ...newAgency, slug: e.target.value })} />
            </div>
            <div>
              <Label>Owner email (optional now)</Label>
              <Input
                type="email"
                value={newAgency.email}
                onChange={e => setNewAgency({ ...newAgency, email: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={create.isPending}>
              {create.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
