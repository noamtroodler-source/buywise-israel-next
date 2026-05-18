import { useState } from 'react';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { AlertTriangle, Home, Clock, ShieldCheck, MoreVertical, Crown, Mail, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectSeparator,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  useUpdateAgentStatus,
  useRemoveAgentFromAgency,
  useSetAgentAdmin,
} from '@/hooks/useAgencyManagement';

interface Agent {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  is_verified: boolean | null;
  status: string;
  created_at: string;
  last_active_at?: string | null;
  agency_role?: string;
  listing_count?: number;
  user_id?: string | null;
  agency_member_role?: 'owner' | 'admin' | null;
  invite_accepted?: boolean;
}

interface SeatManagementPanelProps {
  agents: Agent[];
  agencyId?: string;
  isOwner?: boolean;
  currentUserId?: string | null;
}

function isDeadSeat(agent: Agent): boolean {
  if ((agent.listing_count ?? 0) > 0) return false;
  if (!agent.last_active_at) return true;
  const daysSinceActive = (Date.now() - new Date(agent.last_active_at).getTime()) / (1000 * 60 * 60 * 24);
  return daysSinceActive > 30;
}

const REMOVE_VALUE = '__remove__';

export function SeatManagementPanel({ agents, agencyId, isOwner, currentUserId }: SeatManagementPanelProps) {
  const updateStatus = useUpdateAgentStatus();
  const removeAgent = useRemoveAgentFromAgency();
  const setAdmin = useSetAgentAdmin();
  const [removeTarget, setRemoveTarget] = useState<Agent | null>(null);

  if (agents.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <div className="h-16 w-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
          <ShieldCheck className="h-8 w-8 text-muted-foreground/50" />
        </div>
        <p className="font-medium text-foreground mb-1">No team members yet</p>
        <p className="text-sm">Use the "Invite Agent" button above to add agents to your agency</p>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-3">
        {agents.map((agent, index) => {
          const dead = isDeadSeat(agent);
          const isSuspended = agent.status === 'suspended';
          const inviteAccepted = agent.invite_accepted ?? !!agent.user_id;
          const memberRole = agent.agency_member_role ?? null;
          const isAgentOwner = memberRole === 'owner';
          const isAgentAdmin = memberRole === 'admin';
          const isSelf = !!currentUserId && agent.user_id === currentUserId;
          // Status dropdown: pending is auto-derived, hide it from manual choices.
          // If the row's current status is 'pending', show Active as displayed value.
          const displayStatus = agent.status === 'pending' ? 'active' : agent.status;

          return (
            <motion.div
              key={agent.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.04 }}
              className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-xl border transition-colors ${
                isSuspended
                  ? 'bg-muted/20 border-border/30 opacity-70'
                  : dead
                  ? 'bg-destructive/5 border-destructive/15'
                  : 'bg-muted/30 border-border/50 hover:bg-muted/50'
              }`}
            >
              {/* Left: Identity */}
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-semibold text-primary">
                    {agent.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium truncate">{agent.name}</p>
                    {isAgentOwner && (
                      <Badge variant="outline" className="text-xs border-amber-500/40 text-amber-600 gap-1">
                        <Crown className="h-3 w-3" />
                        Owner
                      </Badge>
                    )}
                    {isAgentAdmin && (
                      <Badge variant="outline" className="text-xs border-primary/40 text-primary">
                        Admin
                      </Badge>
                    )}
                    {agent.is_verified && (
                      <Badge variant="outline" className="text-xs border-primary/30 text-primary">Verified</Badge>
                    )}
                    {!inviteAccepted && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge variant="outline" className="text-xs border-amber-500/30 text-amber-600 gap-1 cursor-default">
                            <Mail className="h-3 w-3" />
                            Invite not accepted
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                          Agent hasn't completed signup yet. Resend the invite link if needed.
                        </TooltipContent>
                      </Tooltip>
                    )}
                    {dead && inviteAccepted && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge variant="outline" className="text-xs border-destructive/30 text-destructive gap-1 cursor-default">
                            <AlertTriangle className="h-3 w-3" />
                            Dead seat
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                          No listings and inactive for 30+ days. Consider removing this seat.
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{agent.email}</p>
                  <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground flex-wrap">
                    <span className="flex items-center gap-1">
                      <Home className="h-3 w-3" />
                      {agent.listing_count ?? 0} listing{(agent.listing_count ?? 0) !== 1 ? 's' : ''}
                    </span>
                    {agent.last_active_at ? (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Active {formatDistanceToNow(new Date(agent.last_active_at), { addSuffix: true })}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-muted-foreground/60">
                        <Clock className="h-3 w-3" />
                        Never active
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Right: Controls */}
              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap flex-shrink-0">
                {/* Status / actions dropdown */}
                <Select
                  value={displayStatus}
                  onValueChange={(value) => {
                    if (value === REMOVE_VALUE) {
                      setRemoveTarget(agent);
                      return;
                    }
                    updateStatus.mutate({ agentId: agent.id, status: value as 'active' | 'suspended' });
                  }}
                  disabled={isAgentOwner && !isOwner}
                >
                  <SelectTrigger className="w-[160px] h-8 rounded-lg text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                    {!isAgentOwner && (
                      <>
                        <SelectSeparator />
                        <SelectItem value={REMOVE_VALUE} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                          Remove from agency…
                        </SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>

                {/* Owner-only: admin promotion menu */}
                {isOwner && !isSelf && !isAgentOwner && inviteAccepted && agent.user_id && agencyId && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" disabled={setAdmin.isPending}>
                        {setAdmin.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreVertical className="h-4 w-4" />}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {isAgentAdmin ? (
                        <DropdownMenuItem
                          onClick={() => setAdmin.mutate({ agencyId, userId: agent.user_id!, action: 'demote' })}
                        >
                          Demote from Admin
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem
                          onClick={() => setAdmin.mutate({ agencyId, userId: agent.user_id!, action: 'promote' })}
                        >
                          Promote to Admin
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Remove confirmation */}
      <AlertDialog open={!!removeTarget} onOpenChange={(o) => !o && setRemoveTarget(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove agent from agency?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p>
                  Are you sure you want to remove <strong>{removeTarget?.name}</strong> from your agency?
                </p>
                <ul className="text-sm list-disc list-inside space-y-1 text-muted-foreground">
                  <li>The agent will become an independent agent</li>
                  <li>Their listings remain but get unlinked from your agency</li>
                  <li>They can request to rejoin or join another agency</li>
                </ul>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!removeTarget) return;
                removeAgent.mutate(
                  { agentId: removeTarget.id },
                  { onSuccess: () => setRemoveTarget(null) }
                );
              }}
              disabled={removeAgent.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl"
            >
              {removeAgent.isPending ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Removing…</>
              ) : (
                'Remove Agent'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TooltipProvider>
  );
}
