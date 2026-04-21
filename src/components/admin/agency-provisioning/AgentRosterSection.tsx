import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, KeyRound, Loader2, Copy, UserCheck, Send, Upload, X, AlertTriangle, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import {
  useAgencyAgents,
  useCreateAgent,
  useUpdateAgent,
  useProvisionAgentAccount,
  useRevealCredentials,
  useResendSetupLink,
} from '@/hooks/useAgencyProvisioning';
import { RevealCredentialsModal } from './RevealCredentialsModal';

interface Props {
  agencyId: string;
}

const LANGUAGE_OPTIONS = [
  { id: 'english', label: 'English' },
  { id: 'hebrew', label: 'Hebrew' },
  { id: 'french', label: 'French' },
  { id: 'russian', label: 'Russian' },
  { id: 'spanish', label: 'Spanish' },
  { id: 'arabic', label: 'Arabic' },
];

const SPECIALIZATION_OPTIONS = [
  { id: 'residential', label: 'Residential' },
  { id: 'commercial', label: 'Commercial' },
  { id: 'luxury', label: 'Luxury' },
  { id: 'new_construction', label: 'New Projects' },
  { id: 'investment', label: 'Investment Properties' },
  { id: 'rentals', label: 'Rentals' },
];

const emptyForm = {
  name: '', email: '', phone: '', avatar_url: '', bio: '',
  license_number: '',
  specializations: [] as string[],
  languages: [] as string[],
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
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const isValidImage = await new Promise<boolean>((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = URL.createObjectURL(file);
    });
    if (!isValidImage) {
      toast.error('Invalid image file. Please select a PNG or JPG.');
      return;
    }

    setUploadingAvatar(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `agency-${agencyId}/agent-avatar-${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('property-images')
        .upload(fileName, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('property-images')
        .getPublicUrl(fileName);

      setForm(prev => ({ ...prev, avatar_url: publicUrl }));
      toast.success('Avatar uploaded');
    } catch (err) {
      console.error('Avatar upload error:', err);
      toast.error('Failed to upload avatar');
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

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
      specializations: form.specializations.length > 0 ? form.specializations : undefined,
      languages: form.languages.length > 0 ? form.languages : undefined,
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
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{a.name}</span>
                      {a.needs_review && (
                        <Badge
                          variant="outline"
                          className="text-[10px] border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-400 gap-1"
                          title={`AI-imported from ${a.enrichment_source || 'external source'} — please verify details`}
                        >
                          <AlertTriangle className="h-2.5 w-2.5" /> Needs review
                        </Badge>
                      )}
                    </div>
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
              <Label>Profile picture</Label>
              <div className="flex items-center gap-3 mt-1.5">
                <Avatar className="h-14 w-14 border">
                  <AvatarImage src={form.avatar_url || undefined} alt="Agent avatar" />
                  <AvatarFallback className="text-xs text-muted-foreground">
                    {form.name ? form.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() : 'A'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingAvatar}
                  >
                    {uploadingAvatar ? (
                      <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    ) : (
                      <Upload className="h-3.5 w-3.5 mr-1.5" />
                    )}
                    {form.avatar_url ? 'Replace' : 'Upload'}
                  </Button>
                  {form.avatar_url && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setForm({ ...form, avatar_url: '' })}
                    >
                      <X className="h-3.5 w-3.5 mr-1.5" /> Remove
                    </Button>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />
              </div>
            </div>
            <div className="md:col-span-2">
              <Label>Languages</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-1.5">
                {LANGUAGE_OPTIONS.map((lang) => {
                  const active = form.languages.includes(lang.id);
                  return (
                    <button
                      key={lang.id}
                      type="button"
                      onClick={() => setForm(prev => ({
                        ...prev,
                        languages: active
                          ? prev.languages.filter(l => l !== lang.id)
                          : [...prev.languages, lang.id],
                      }))}
                      className={cn(
                        "flex items-center justify-center p-2.5 rounded-lg border text-sm font-medium transition-all",
                        active
                          ? "bg-primary/10 border-primary text-primary"
                          : "border-border hover:border-primary/50 hover:bg-muted/50"
                      )}
                    >
                      {lang.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="md:col-span-2">
              <Label>Specializations</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-1.5">
                {SPECIALIZATION_OPTIONS.map((spec) => {
                  const active = form.specializations.includes(spec.id);
                  return (
                    <button
                      key={spec.id}
                      type="button"
                      onClick={() => setForm(prev => ({
                        ...prev,
                        specializations: active
                          ? prev.specializations.filter(s => s !== spec.id)
                          : [...prev.specializations, spec.id],
                      }))}
                      className={cn(
                        "flex items-center justify-center p-2.5 rounded-lg border text-sm font-medium transition-all text-center",
                        active
                          ? "bg-primary/10 border-primary text-primary"
                          : "border-border hover:border-primary/50 hover:bg-muted/50"
                      )}
                    >
                      {spec.label}
                    </button>
                  );
                })}
              </div>
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

      <RevealCredentialsModal
        open={!!revealUser}
        onOpenChange={(o) => { if (!o) setRevealUser(null); }}
        userId={revealUser?.id ?? null}
        subjectLabel={revealUser?.label}
      />
    </Card>
  );
}
