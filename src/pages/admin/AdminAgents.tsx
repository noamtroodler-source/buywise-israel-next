import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  UserCheck, Clock, Ban, RefreshCw, 
  Mail, Phone, Building2, Award, Calendar 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import { Skeleton } from '@/components/ui/skeleton';
import { 
  useAdminAgents, 
  useAgentStats, 
  useApproveAgent, 
  useSuspendAgent, 
  useReinstateAgent,
  AgentStatus 
} from '@/hooks/useAdminAgents';
import { format } from 'date-fns';

const statusConfig: Record<AgentStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: typeof Clock }> = {
  pending: { label: 'Pending', variant: 'secondary', icon: Clock },
  active: { label: 'Active', variant: 'default', icon: UserCheck },
  suspended: { label: 'Suspended', variant: 'destructive', icon: Ban },
};

export default function AdminAgents() {
  const [activeTab, setActiveTab] = useState<AgentStatus | 'all'>('pending');
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    action: 'approve' | 'suspend' | 'reinstate';
    agentId: string;
    agentName: string;
  } | null>(null);

  const { data: stats, isLoading: statsLoading } = useAgentStats();
  const { data: agents, isLoading: agentsLoading } = useAdminAgents(
    activeTab === 'all' ? undefined : activeTab
  );

  const approveAgent = useApproveAgent();
  const suspendAgent = useSuspendAgent();
  const reinstateAgent = useReinstateAgent();

  const handleAction = () => {
    if (!confirmDialog) return;

    const { action, agentId } = confirmDialog;
    switch (action) {
      case 'approve':
        approveAgent.mutate(agentId);
        break;
      case 'suspend':
        suspendAgent.mutate(agentId);
        break;
      case 'reinstate':
        reinstateAgent.mutate(agentId);
        break;
    }
    setConfirmDialog(null);
  };

  const actionLabels = {
    approve: { title: 'Approve Agent', description: 'This will allow the agent to list properties on the platform.' },
    suspend: { title: 'Suspend Agent', description: 'This will prevent the agent from accessing their dashboard and hide their listings.' },
    reinstate: { title: 'Reinstate Agent', description: 'This will restore the agent\'s access to the platform.' },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-2xl font-bold text-foreground">Agent Management</h2>
        <p className="text-muted-foreground">Review and manage agent applications</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {statsLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))
        ) : (
          <>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Pending</p>
                    <p className="text-2xl font-bold text-yellow-600">{stats?.pending || 0}</p>
                  </div>
                  <Clock className="h-8 w-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Active</p>
                    <p className="text-2xl font-bold text-green-600">{stats?.active || 0}</p>
                  </div>
                  <UserCheck className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Suspended</p>
                    <p className="text-2xl font-bold text-red-600">{stats?.suspended || 0}</p>
                  </div>
                  <Ban className="h-8 w-8 text-red-600" />
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Agents List */}
      <Card>
        <CardHeader>
          <CardTitle>Agents</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as AgentStatus | 'all')}>
            <TabsList className="mb-4">
              <TabsTrigger value="pending" className="gap-2">
                Pending
                {stats?.pending ? (
                  <Badge variant="secondary" className="ml-1">{stats.pending}</Badge>
                ) : null}
              </TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="suspended">Suspended</TabsTrigger>
              <TabsTrigger value="all">All</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="space-y-4">
              {agentsLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-32" />
                ))
              ) : agents?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No agents found
                </div>
              ) : (
                agents?.map((agent) => {
                  const statusInfo = statusConfig[agent.status];
                  const StatusIcon = statusInfo.icon;

                  return (
                    <Card key={agent.id} className="overflow-hidden">
                      <CardContent className="p-4">
                        <div className="flex flex-col sm:flex-row gap-4">
                          {/* Avatar */}
                          <Avatar className="h-16 w-16">
                            <AvatarImage src={agent.avatar_url || undefined} />
                            <AvatarFallback>
                              {agent.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </AvatarFallback>
                          </Avatar>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h3 className="font-semibold text-foreground">{agent.name}</h3>
                                <Badge variant={statusInfo.variant} className="mt-1">
                                  <StatusIcon className="h-3 w-3 mr-1" />
                                  {statusInfo.label}
                                </Badge>
                              </div>
                              <div className="text-right text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {format(new Date(agent.created_at), 'MMM d, yyyy')}
                                </div>
                              </div>
                            </div>

                            <div className="mt-3 grid gap-2 text-sm">
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Mail className="h-4 w-4" />
                                <span className="truncate">{agent.email}</span>
                              </div>
                              {agent.phone && (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <Phone className="h-4 w-4" />
                                  <span>{agent.phone}</span>
                                </div>
                              )}
                              {agent.agency && (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <Building2 className="h-4 w-4" />
                                  <span>{agent.agency.name}</span>
                                </div>
                              )}
                              {agent.license_number && (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <Award className="h-4 w-4" />
                                  <span>License: {agent.license_number}</span>
                                </div>
                              )}
                            </div>

                            {agent.specializations && agent.specializations.length > 0 && (
                              <div className="mt-3 flex flex-wrap gap-1">
                                {agent.specializations.slice(0, 3).map((spec) => (
                                  <Badge key={spec} variant="outline" className="text-xs">
                                    {spec}
                                  </Badge>
                                ))}
                                {agent.specializations.length > 3 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{agent.specializations.length - 3}
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex sm:flex-col gap-2 sm:w-32">
                            {agent.status === 'pending' && (
                              <Button
                                size="sm"
                                className="flex-1"
                                onClick={() => setConfirmDialog({
                                  open: true,
                                  action: 'approve',
                                  agentId: agent.id,
                                  agentName: agent.name,
                                })}
                              >
                                <UserCheck className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                            )}
                            {agent.status === 'active' && (
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => setConfirmDialog({
                                  open: true,
                                  action: 'suspend',
                                  agentId: agent.id,
                                  agentName: agent.name,
                                })}
                              >
                                <Ban className="h-4 w-4 mr-1" />
                                Suspend
                              </Button>
                            )}
                            {agent.status === 'suspended' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setConfirmDialog({
                                  open: true,
                                  action: 'reinstate',
                                  agentId: agent.id,
                                  agentName: agent.name,
                                })}
                              >
                                <RefreshCw className="h-4 w-4 mr-1" />
                                Reinstate
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <AlertDialog 
        open={confirmDialog?.open} 
        onOpenChange={(open) => !open && setConfirmDialog(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmDialog && actionLabels[confirmDialog.action].title}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog && (
                <>
                  Are you sure you want to {confirmDialog.action} <strong>{confirmDialog.agentName}</strong>?
                  <br /><br />
                  {actionLabels[confirmDialog.action].description}
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleAction}>
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
