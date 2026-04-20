import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, KeyRound, Loader2, Copy, UserCheck, Send } from 'lucide-react';
import { toast } from 'sonner';
import {
  useAgencyAgents,
  useCreateAgent,
  useProvisionAgentAccount,
  useRevealCredentials,
  useResendSetupLink,
} from '@/hooks/useAgencyProvisioning';
import { RevealCredentialsModal } from './RevealCredentialsModal';

interface Props {
  agencyId: string;
}

const emptyForm = {
  name: '', email: '', phone: '', avatar_url: '', bio: '',
  license_number: '', specializations: '', languages: '',
};

export function AgentRosterSection({ agencyId }: Props) {
  const { data: agents = [], isLoading } = useAgencyAgents(agencyId);
  const create = useCreateAgent(agencyId);
  const provision = useProvisionAgentAccount(agencyId);
  const reveal = useRevealCredentials();
  const resend = useResendSetupLink();

  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [credModal, setCredModal] = useState<{ email: string; password: string } | null>(null);
  const [revealUser, setRevealUser] = useState<{ id: string; label: string } | null>(null);

  async function handleAdd() {
    if (!form.name || !form.email) {
      toast.error('Name and email required');
      return;
    }
    await create.mutateAsync({
      name: form.name,
      email: form.email,
      phone: form.phone || undefined,
      avatar_url: form.avatar_url || undefined,
      bio: form.bio || undefined,
      license_number: form.license_number || undefined,
      specializations: form.specializations ? form.specializations.split(',').map(s => s.trim()).filter(Boolean) : undefined,
      languages: form.languages ? form.languages.split(',').map(s => s.trim()).filter(Boolean) : undefined,
    });
    setForm(emptyForm);
    setAddOpen(false);
  }

  async function handleProvisionAgent(agentId: string, email: string) {
    const res = await provision.mutateAsync({ agentId });
    if (res?.userId) {
      const cred = await reveal.mutateAsync({ userId: res.userId });
      setCredModal({ email: cred.email || email, password: cred.password });
    }
  }

  function openSecureReveal(userId: string, label: string) {
    setRevealUser({ id: userId, label });
  }

  function copyToClipboard(text: string, label: string) {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied`);
  }

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Agent Roster</h2>
          <p className="text-sm text-muted-foreground">{agents.length} agents · accounts created on demand</p>
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> Add agent
        </Button>
      </div>

      {isLoading ? (
        <div className="py-8 text-center text-muted-foreground">Loading agents…</div>
      ) : agents.length === 0 ? (
        <div className="py-8 text-center text-muted-foreground border rounded-lg">
          No agents yet. Add one to start building the roster.
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Agent</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Profile</TableHead>
                <TableHead>Account</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {agents.map(a => (
                <TableRow key={a.id}>
                  <TableCell>
                    <div className="font-medium">{a.name}</div>
                    {a.license_number && (
                      <div className="text-xs text-muted-foreground">Lic. {a.license_number}</div>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">
                    <div>{a.email}</div>
                    {a.phone && <div className="text-muted-foreground">{a.phone}</div>}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={a.completeness_score >= 80 ? 'secondary' : a.completeness_score >= 50 ? 'outline' : 'destructive'}
                    >
                      {a.completeness_score}%
                    </Badge>
                    {a.pending_fields?.length > 0 && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Missing: {a.pending_fields.slice(0, 3).join(', ')}
                        {a.pending_fields.length > 3 && '…'}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {a.user_id ? (
                      <Badge variant="secondary" className="gap-1">
                        <UserCheck className="h-3 w-3" /> Provisioned
                      </Badge>
                    ) : (
                      <Badge variant="outline">No account</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {a.user_id ? (
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => resend.mutate({ userId: a.user_id!, purpose: 'agent_setup' })}
                          disabled={resend.isPending}
                        >
                          <Send className="h-3 w-3 mr-1" /> Resend
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openSecureReveal(a.user_id!, a.name)}
                        >
                          <KeyRound className="h-3 w-3 mr-1" /> Reveal
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleProvisionAgent(a.id, a.email)}
                        disabled={provision.isPending}
                      >
                        {provision.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Provision'}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add agent</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label>Full name *</Label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <Label>Email *</Label>
              <Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <Label>Phone</Label>
              <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div>
              <Label>License number</Label>
              <Input value={form.license_number} onChange={e => setForm({ ...form, license_number: e.target.value })} />
            </div>
            <div>
              <Label>Avatar URL</Label>
              <Input value={form.avatar_url} onChange={e => setForm({ ...form, avatar_url: e.target.value })} />
            </div>
            <div>
              <Label>Languages (comma-separated)</Label>
              <Input value={form.languages} onChange={e => setForm({ ...form, languages: e.target.value })} placeholder="English, Hebrew" />
            </div>
            <div className="md:col-span-2">
              <Label>Specializations (comma-separated)</Label>
              <Input value={form.specializations} onChange={e => setForm({ ...form, specializations: e.target.value })} placeholder="Luxury, Investment" />
            </div>
            <div className="md:col-span-2">
              <Label>Bio</Label>
              <Textarea rows={3} value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={handleAdd} disabled={create.isPending}>
              {create.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Add agent
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!credModal} onOpenChange={(o) => !o && setCredModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agent credentials</DialogTitle>
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
                Share these securely. The agent can change their password after first login.
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
