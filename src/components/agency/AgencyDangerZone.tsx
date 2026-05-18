import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, Trash2, Crown, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useAgencyPermissions } from '@/hooks/useAgencyPermissions';
import { useAgencyMembers, useDeleteAgency, useTransferOwnership } from '@/hooks/useAgencyMembers';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

interface Props { agencyId: string; agencyName: string; }

export function AgencyDangerZone({ agencyId, agencyName }: Props) {
  const navigate = useNavigate();
  const perms = useAgencyPermissions(agencyId);
  const { data: members = [] } = useAgencyMembers(agencyId);
  const deleteAgency = useDeleteAgency();
  const transfer = useTransferOwnership();

  const [confirmText, setConfirmText] = useState('');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [newOwner, setNewOwner] = useState<string>('');

  if (!perms.isAdmin) {
    return (
      <Card className="rounded-2xl border-border/60 bg-muted/30">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
            <ShieldAlert className="h-4 w-4 text-muted-foreground" /> Advanced settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Ownership transfer and agency deletion are reserved for Admins. Ask an Admin on your team to make this change.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Any other admin or the current owner can receive the founder badge
  const transferCandidates = members.filter((m) => m.user_id !== undefined && (m.role === 'admin' || m.role === 'owner'));

  return (
    <Card className="rounded-2xl border-border/60">
      <CardHeader className="pb-4 border-b border-border/40">
        <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
          <ShieldAlert className="h-4 w-4 text-muted-foreground" /> Advanced settings
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Sensitive actions for agency Admins. Please proceed carefully — these changes cannot be undone.
        </p>
      </CardHeader>
      <CardContent className="p-0 divide-y divide-border/40">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-5">
          <div className="flex gap-3">
            <div className="hidden sm:flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
              <Crown className="h-4 w-4 text-amber-600" />
            </div>
            <div className="space-y-1">
              <p className="font-medium text-sm text-foreground">Transfer founder badge</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Move the founder marker to another Admin. Permissions stay the same — both keep full Admin powers.
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="rounded-lg shrink-0"
            onClick={() => setTransferOpen(true)}
            disabled={transferCandidates.length === 0}
          >
            Transfer ownership
          </Button>
        </div>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-5 bg-destructive/[0.03]">
          <div className="flex gap-3">
            <div className="hidden sm:flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-destructive/10">
              <Trash2 className="h-4 w-4 text-destructive" />
            </div>
            <div className="space-y-1">
              <p className="font-medium text-sm text-foreground">Delete agency</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Permanently removes this agency and all of its data. Listings will be unassigned from agents.
              </p>
            </div>
          </div>
          <Button variant="destructive" size="sm" className="rounded-lg shrink-0" onClick={() => setDeleteOpen(true)}>
            Delete agency
          </Button>
        </div>
      </CardContent>

      {/* Transfer dialog */}
      <AlertDialog open={transferOpen} onOpenChange={setTransferOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Transfer founder badge for {agencyName}</AlertDialogTitle>
            <AlertDialogDescription>
              Pick the Admin who will hold the founder marker. Permissions don't change — Admins already have full power.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-3 py-2">
            <Label>New owner</Label>
            <Select value={newOwner} onValueChange={setNewOwner}>
              <SelectTrigger><SelectValue placeholder="Select an admin…" /></SelectTrigger>
              <SelectContent>
                {transferCandidates.map((m) => (
                  <SelectItem key={m.user_id} value={m.user_id}>
                    {m.display_name || m.email || m.user_id.slice(0, 8)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={!newOwner || transfer.isPending}
              onClick={() => {
                transfer.mutate({ agencyId, newOwnerUserId: newOwner });
                setTransferOpen(false);
                setNewOwner('');
              }}
            >
              {transfer.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Transfer ownership'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">Delete {agencyName}?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes the agency, its admin assignments, invites, and unassigns all listings. Type the agency name to confirm.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2 py-2">
            <Label>Agency name</Label>
            <Input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={agencyName}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmText('')}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={confirmText.trim().toLowerCase() !== agencyName.trim().toLowerCase() || deleteAgency.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                await deleteAgency.mutateAsync({ agencyId, confirmName: confirmText });
                setDeleteOpen(false);
                navigate('/');
              }}
            >
              {deleteAgency.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Delete agency'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
