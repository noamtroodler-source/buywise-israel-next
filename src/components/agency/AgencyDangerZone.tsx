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

  if (!perms.isOwner) {
    return (
      <Card className="rounded-2xl border-destructive/20 bg-destructive/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <ShieldAlert className="h-5 w-5" /> Danger Zone
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Only the Owner can transfer ownership or delete the agency. Ask the Owner to perform these actions, or have them transfer ownership to you first.
          </p>
        </CardContent>
      </Card>
    );
  }

  const transferCandidates = members.filter((m) => m.role === 'admin');

  return (
    <Card className="rounded-2xl border-destructive/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-destructive">
          <ShieldAlert className="h-5 w-5" /> Danger Zone
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Owner-only actions. These cannot be undone.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 p-4 rounded-xl border border-border/50 bg-muted/20">
          <div>
            <p className="font-medium flex items-center gap-2">
              <Crown className="h-4 w-4 text-amber-500" /> Transfer ownership
            </p>
            <p className="text-sm text-muted-foreground">
              Hand the agency to another Admin. You will be demoted to Admin.
            </p>
          </div>
          <Button
            variant="outline"
            className="rounded-xl border-amber-500/30 text-amber-700 hover:bg-amber-500/10"
            onClick={() => setTransferOpen(true)}
            disabled={transferCandidates.length === 0}
          >
            Transfer ownership
          </Button>
        </div>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 p-4 rounded-xl border border-destructive/30 bg-destructive/5">
          <div>
            <p className="font-medium text-destructive flex items-center gap-2">
              <Trash2 className="h-4 w-4" /> Delete agency
            </p>
            <p className="text-sm text-muted-foreground">
              Permanently removes the agency and all its data. Listings will be unassigned.
            </p>
          </div>
          <Button variant="destructive" className="rounded-xl" onClick={() => setDeleteOpen(true)}>
            Delete agency
          </Button>
        </div>
      </CardContent>

      {/* Transfer dialog */}
      <AlertDialog open={transferOpen} onOpenChange={setTransferOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Transfer ownership of {agencyName}</AlertDialogTitle>
            <AlertDialogDescription>
              Pick the Admin who will become the new Owner. You will keep Admin powers afterward.
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
