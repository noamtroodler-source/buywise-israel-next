import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { CheckCircle2, KeyRound, Loader2, Copy, Send } from 'lucide-react';
import { toast } from 'sonner';
import {
  ProvisioningAgency,
  useUpdateAgency,
  useProvisionAgencyAccount,
  useRevealCredentials,
  useResendSetupLink,
} from '@/hooks/useAgencyProvisioning';
import { RevealCredentialsModal } from './RevealCredentialsModal';

interface Props {
  agency: ProvisioningAgency;
}

export function AgencyProfileSection({ agency }: Props) {
  const update = useUpdateAgency(agency.id);
  const provision = useProvisionAgencyAccount();
  const reveal = useRevealCredentials();
  const resend = useResendSetupLink();
  const [secureRevealOpen, setSecureRevealOpen] = useState(false);

  const [form, setForm] = useState({
    name: agency.name || '',
    slug: agency.slug || '',
    email: agency.email || '',
    phone: agency.phone || '',
    description: agency.description || '',
    website: agency.website || '',
    office_address: agency.office_address || '',
    cities_covered: (agency.cities_covered || []).join(', '),
    logo_url: agency.logo_url || '',
  });
  const [strategy, setStrategy] = useState(agency.agent_email_strategy);
  const [ownerName, setOwnerName] = useState('');
  const [provisionOpen, setProvisionOpen] = useState(false);
  const [credModal, setCredModal] = useState<{ email: string; password: string } | null>(null);

  const isProvisioned = !!agency.admin_user_id;

  async function handleSaveProfile() {
    await update.mutateAsync({
      name: form.name,
      slug: form.slug,
      email: form.email,
      phone: form.phone,
      description: form.description,
      website: form.website,
      office_address: form.office_address,
      logo_url: form.logo_url,
      cities_covered: form.cities_covered.split(',').map(s => s.trim()).filter(Boolean) as any,
    });
  }

  async function handleStrategyChange(value: string) {
    setStrategy(value as any);
    await update.mutateAsync({ agent_email_strategy: value as any });
  }

  async function handleProvision() {
    if (!form.email || !ownerName) {
      toast.error('Owner email and name required');
      return;
    }
    const result = await provision.mutateAsync({
      agencyId: agency.id,
      ownerEmail: form.email,
      ownerName,
      ownerPhone: form.phone || undefined,
    });
    setProvisionOpen(false);
    // Auto-reveal credentials immediately after provisioning
    if (result?.userId) {
      const cred = await reveal.mutateAsync({ userId: result.userId });
      setCredModal({ email: cred.email || form.email, password: cred.password });
    }
  }

  async function handleReveal() {
    if (!agency.admin_user_id) return;
    const cred = await reveal.mutateAsync({ userId: agency.admin_user_id });
    setCredModal({ email: cred.email || form.email, password: cred.password });
  }

  function copyToClipboard(text: string, label: string) {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied`);
  }

  return (
    <Card className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Agency Profile</h2>
          <p className="text-sm text-muted-foreground">Public-facing details and the owner account.</p>
        </div>
        {isProvisioned ? (
          <Badge variant="secondary" className="gap-1">
            <CheckCircle2 className="h-3 w-3" /> Owner provisioned
          </Badge>
        ) : (
          <Badge variant="outline">Draft</Badge>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Agency name</Label>
          <Input id="name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
        </div>
        <div>
          <Label htmlFor="slug">Slug</Label>
          <Input id="slug" value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} />
        </div>
        <div>
          <Label htmlFor="email">Owner email</Label>
          <Input id="email" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
        </div>
        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
        </div>
        <div>
          <Label htmlFor="website">Website</Label>
          <Input id="website" value={form.website} onChange={e => setForm({ ...form, website: e.target.value })} />
        </div>
        <div>
          <Label htmlFor="logo">Logo URL</Label>
          <Input id="logo" value={form.logo_url} onChange={e => setForm({ ...form, logo_url: e.target.value })} />
        </div>
        <div className="md:col-span-2">
          <Label htmlFor="address">Office address</Label>
          <Input id="address" value={form.office_address} onChange={e => setForm({ ...form, office_address: e.target.value })} />
        </div>
        <div className="md:col-span-2">
          <Label htmlFor="cities">Cities covered (comma-separated)</Label>
          <Input id="cities" value={form.cities_covered} onChange={e => setForm({ ...form, cities_covered: e.target.value })} />
        </div>
        <div className="md:col-span-2">
          <Label htmlFor="bio">Description / bio</Label>
          <Textarea id="bio" rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button onClick={handleSaveProfile} disabled={update.isPending}>
          {update.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Save profile
        </Button>
        {!isProvisioned ? (
          <Button variant="default" onClick={() => setProvisionOpen(true)}>
            <KeyRound className="h-4 w-4 mr-2" /> Provision owner account
          </Button>
        ) : (
          <Button variant="outline" onClick={handleReveal} disabled={reveal.isPending}>
            <KeyRound className="h-4 w-4 mr-2" /> Reveal credentials
          </Button>
        )}
      </div>

      <div className="border-t pt-4">
        <Label>Agent email strategy</Label>
        <p className="text-xs text-muted-foreground mb-2">
          When you hand the agency over, when should agent welcome emails go out?
        </p>
        <Select value={strategy} onValueChange={handleStrategyChange}>
          <SelectTrigger className="max-w-md">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="send_all_now">Send to all agents immediately</SelectItem>
            <SelectItem value="send_after_owner">Wait — owner triggers from their dashboard</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Dialog open={provisionOpen} onOpenChange={setProvisionOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Provision owner account</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Owner full name</Label>
              <Input value={ownerName} onChange={e => setOwnerName(e.target.value)} placeholder="e.g. David Cohen" />
            </div>
            <div>
              <Label>Email (from profile)</Label>
              <Input value={form.email} disabled />
            </div>
            <p className="text-xs text-muted-foreground">
              A login will be created with a strong temporary password. You'll see it next so you can share it.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProvisionOpen(false)}>Cancel</Button>
            <Button onClick={handleProvision} disabled={provision.isPending}>
              {provision.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Provision
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!credModal} onOpenChange={(o) => !o && setCredModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Owner credentials</DialogTitle>
          </DialogHeader>
          {credModal && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Input value={credModal.email} readOnly />
                <Button size="icon" variant="outline" onClick={() => copyToClipboard(credModal.email, 'Email')}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Input value={credModal.password} readOnly className="font-mono" />
                <Button size="icon" variant="outline" onClick={() => copyToClipboard(credModal.password, 'Password')}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Share these securely. The owner can change their password after first login.
              </p>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setCredModal(null)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
