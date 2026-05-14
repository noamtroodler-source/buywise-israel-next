import { useState } from 'react';
import { motion } from 'framer-motion';
import { Crown, Shield, MoreVertical, Loader2, UserCog, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  useAgencyMembers, usePromoteToAdmin, useDemoteAdmin, useSetPrimaryContact, useTransferOwnership,
} from '@/hooks/useAgencyMembers';
import { useAgencyPermissions } from '@/hooks/useAgencyPermissions';
import { useAgencyTeam } from '@/hooks/useAgencyManagement';

interface Props { agencyId: string; }

export function AgencyAdminsPanel({ agencyId }: Props) {
  const { data: members = [], isLoading } = useAgencyMembers(agencyId);
  const { data: team = [] } = useAgencyTeam(agencyId);
  const perms = useAgencyPermissions(agencyId);
  const promote = usePromoteToAdmin();
  const demote = useDemoteAdmin();
  const setPrimary = useSetPrimaryContact();
  const transfer = useTransferOwnership();

  const [transferTarget, setTransferTarget] = useState<{ userId: string; name: string } | null>(null);

  // Owner row + admin rows
  const owner = members.find((m) => m.role === 'owner');
  const admins = members.filter((m) => m.role === 'admin' && m.user_id !== owner?.user_id);

  // Sales agents not yet admin (eligible for promotion)
  const adminUserIds = new Set(members.map((m) => m.user_id));
  const promotableAgents = team.filter((a: any) => a.user_id && !adminUserIds.has(a.user_id));

  if (isLoading) {
    return (
      <Card className="rounded-2xl border-primary/10">
        <CardContent className="py-12 flex justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const renderMember = (m: typeof members[number]) => {
    const isOwnerRow = m.role === 'owner';
    return (
      <motion.div
        key={`${m.role}-${m.user_id}`}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border/50 hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <Avatar className="h-10 w-10">
            <AvatarImage src={m.avatar_url ?? undefined} />
            <AvatarFallback>{(m.display_name || m.email || '?').slice(0, 1).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-foreground truncate">
                {m.display_name || m.email || 'Unknown user'}
              </span>
              <Badge variant="secondary" className="gap-1">
                <Shield className="h-3 w-3" /> Admin
              </Badge>
              {isOwnerRow && (
                <Badge
                  className="bg-amber-500/15 text-amber-700 hover:bg-amber-500/15 gap-1"
                  title="Original registrant. Same permissions as any Admin."
                >
                  <Crown className="h-3 w-3" /> Founder
                </Badge>
              )}
              {m.is_primary_contact && (
                <Badge className="bg-primary/15 text-primary hover:bg-primary/15 gap-1">
                  <Star className="h-3 w-3" /> Primary contact
                </Badge>
              )}
            </div>
            {m.email && <p className="text-xs text-muted-foreground truncate">{m.email}</p>}
          </div>
        </div>

        {perms.canManageTeam && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-lg">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {!m.is_primary_contact && (
                <DropdownMenuItem onClick={() => setPrimary.mutate({ agencyId, userId: m.user_id })}>
                  <Star className="h-4 w-4 mr-2" /> Make primary contact
                </DropdownMenuItem>
              )}
              {!isOwnerRow && perms.canTransferOwnership && (
                <DropdownMenuItem onClick={() => setTransferTarget({ userId: m.user_id, name: m.display_name || m.email || 'this admin' })}>
                  <Crown className="h-4 w-4 mr-2" /> Make founder
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => demote.mutate({ agencyId, userId: m.user_id })}
              >
                Demote to agent
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </motion.div>
    );
  };

  return (
    <div className="space-y-4">
      <Card className="rounded-2xl border-primary/10">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent rounded-t-2xl">
          <CardTitle className="flex items-center gap-2">
            <UserCog className="h-5 w-5 text-primary" /> Owner &amp; Admins
            <Badge variant="secondary" className="ml-2">{members.length}</Badge>
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            All Admins have full power — billing, team, listings, settings, and deletion. The Founder badge is a display-only marker for the original registrant.
          </p>
        </CardHeader>
        <CardContent className="pt-4 space-y-3">
          {!owner && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-sm">
              <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
              <span>No Owner assigned yet. Admins can run the agency, but ownership transfer and deletion are blocked until an Owner is set. Contact BuyWise to claim ownership.</span>
            </div>
          )}
          {owner && renderMember(owner)}
          {admins.map(renderMember)}
        </CardContent>
      </Card>

      {perms.canPromoteAdmins && promotableAgents.length > 0 && (
        <Card className="rounded-2xl border-border/50">
          <CardHeader>
            <CardTitle className="text-base">Promote a teammate to Admin</CardTitle>
            <p className="text-sm text-muted-foreground">
              Give an existing agent full admin powers (billing, team, settings).
            </p>
          </CardHeader>
          <CardContent className="space-y-2">
            {promotableAgents.slice(0, 8).map((a: any) => (
              <div key={a.id} className="flex items-center justify-between p-3 rounded-xl border border-border/50">
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={a.avatar_url ?? undefined} />
                    <AvatarFallback>{(a.name || '?').slice(0, 1).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{a.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{a.email}</p>
                  </div>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="outline" className="rounded-lg">
                      <Shield className="h-3.5 w-3.5 mr-1" /> Promote to Admin
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Promote {a.name} to Admin?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Admins have full power: billing, sources, featured listings, team roster, agency profile, transferring the founder badge, and deleting the agency. You can demote them at any time.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => promote.mutate({ agencyId, userId: a.user_id })}>
                        Promote to Admin
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <AlertDialog open={!!transferTarget} onOpenChange={(o) => !o && setTransferTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-amber-500" /> Move founder badge to {transferTarget?.name}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              The founder marker will move to {transferTarget?.name}. Permissions don't change — both of you keep full Admin powers (billing, team, settings, deletion).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (transferTarget) {
                  transfer.mutate({ agencyId, newOwnerUserId: transferTarget.userId });
                  setTransferTarget(null);
                }
              }}
            >
              Transfer ownership
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
