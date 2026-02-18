import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { AlertTriangle, Home, Clock, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { RemoveAgentDialog } from './RemoveAgentDialog';
import { useUpdateAgentStatus, useUpdateAgentRole } from '@/hooks/useAgencyManagement';

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
}

interface SeatManagementPanelProps {
  agents: Agent[];
}

function isDeadSeat(agent: Agent): boolean {
  if ((agent.listing_count ?? 0) > 0) return false;
  if (!agent.last_active_at) return true;
  const daysSinceActive = (Date.now() - new Date(agent.last_active_at).getTime()) / (1000 * 60 * 60 * 24);
  return daysSinceActive > 30;
}

export function SeatManagementPanel({ agents }: SeatManagementPanelProps) {
  const updateStatus = useUpdateAgentStatus();
  const updateRole = useUpdateAgentRole();

  if (agents.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <div className="h-16 w-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
          <ShieldCheck className="h-8 w-8 text-muted-foreground/50" />
        </div>
        <p className="font-medium text-foreground mb-1">No team members yet</p>
        <p className="text-sm">Share your invite code to add agents to your agency</p>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-3">
        {agents.map((agent, index) => {
          const dead = isDeadSeat(agent);
          const isSuspended = agent.status === 'suspended';
          const role = agent.agency_role ?? 'member';
          const isManager = role === 'manager';

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
                    {agent.is_verified && (
                      <Badge variant="outline" className="text-xs border-primary/30 text-primary">Verified</Badge>
                    )}
                    {dead && (
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
                {/* Role toggle */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className={`rounded-lg text-xs h-8 ${isManager ? 'border-primary/40 text-primary bg-primary/5' : 'border-border/60 text-muted-foreground'}`}
                      onClick={() =>
                        updateRole.mutate({ agentId: agent.id, role: isManager ? 'member' : 'manager' })
                      }
                      disabled={updateRole.isPending}
                    >
                      {isManager ? 'Manager' : 'Member'}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    Click to toggle between Member and Manager role
                  </TooltipContent>
                </Tooltip>

                {/* Status dropdown */}
                <Select
                  value={agent.status}
                  onValueChange={(value: 'active' | 'suspended' | 'pending') =>
                    updateStatus.mutate({ agentId: agent.id, status: value })
                  }
                >
                  <SelectTrigger className="w-[120px] h-8 rounded-lg text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>

                <RemoveAgentDialog agentId={agent.id} agentName={agent.name} />
              </div>
            </motion.div>
          );
        })}
      </div>
    </TooltipProvider>
  );
}
