import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useUpdateAgentDetails } from '@/hooks/useAgencyManagement';

interface EditAgentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agent: {
    id: string;
    name: string;
    email?: string | null;
    phone?: string | null;
    license_number?: string | null;
    bio?: string | null;
  } | null;
}

export function EditAgentDialog({ open, onOpenChange, agent }: EditAgentDialogProps) {
  const updateAgent = useUpdateAgentDetails();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [license, setLicense] = useState('');
  const [bio, setBio] = useState('');

  useEffect(() => {
    if (agent && open) {
      setName(agent.name ?? '');
      setEmail(agent.email ?? '');
      setPhone(agent.phone ?? '');
      setLicense(agent.license_number ?? '');
      setBio(agent.bio ?? '');
    }
  }, [agent, open]);

  const handleSave = () => {
    if (!agent) return;
    if (!name.trim()) return;
    updateAgent.mutate(
      {
        agentId: agent.id,
        name: name.trim(),
        email: email.trim() || null,
        phone: phone.trim() || null,
        license_number: license.trim() || null,
        bio: bio.trim() || null,
      },
      { onSuccess: () => onOpenChange(false) }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit agent details</DialogTitle>
          <DialogDescription>
            Update this agent's profile info. Changes are visible across their listings.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="agent-name">Full name</Label>
            <Input
              id="agent-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-xl"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="agent-email">Email</Label>
              <Input
                id="agent-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-xl"
                placeholder="agent@example.com"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="agent-phone">Phone</Label>
              <Input
                id="agent-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="rounded-xl"
                placeholder="+972..."
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="agent-license">License number</Label>
            <Input
              id="agent-license"
              value={license}
              onChange={(e) => setLicense(e.target.value)}
              className="rounded-xl"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="agent-bio">Bio</Label>
            <Textarea
              id="agent-bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="rounded-xl min-h-[80px]"
              placeholder="Short bio shown on the agent's public profile"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl">
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={updateAgent.isPending || !name.trim()}
            className="rounded-xl"
          >
            {updateAgent.isPending ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving…</>
            ) : (
              'Save changes'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
