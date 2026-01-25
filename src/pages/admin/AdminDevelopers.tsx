import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  UserCheck, Clock, Ban, RefreshCw, Trash2,
  Mail, Phone, Globe, Building2, Calendar 
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
import { DeleteConfirmModal } from '@/components/admin/DeleteConfirmModal';
import { 
  useAdminDevelopers, 
  useDeveloperStats, 
  useApproveDeveloper, 
  useSuspendDeveloper, 
  useReinstateDeveloper,
  DeveloperStatus 
} from '@/hooks/useAdminDevelopers';
import { useDeleteDeveloper } from '@/hooks/useAdminUsers';
import { format } from 'date-fns';

const statusConfig: Record<DeveloperStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: typeof Clock }> = {
  pending: { label: 'Pending', variant: 'secondary', icon: Clock },
  active: { label: 'Active', variant: 'default', icon: UserCheck },
  suspended: { label: 'Suspended', variant: 'destructive', icon: Ban },
};

export default function AdminDevelopers() {
  const [activeTab, setActiveTab] = useState<DeveloperStatus | 'all'>('pending');
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    action: 'approve' | 'suspend' | 'reinstate';
    developerId: string;
    developerName: string;
  } | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    developerId: string;
    userId: string | null;
    developerName: string;
  } | null>(null);

  const { data: stats, isLoading: statsLoading } = useDeveloperStats();
  const { data: developers, isLoading: developersLoading } = useAdminDevelopers(
    activeTab === 'all' ? undefined : activeTab
  );

  const approveDeveloper = useApproveDeveloper();
  const suspendDeveloper = useSuspendDeveloper();
  const reinstateDeveloper = useReinstateDeveloper();
  const deleteDeveloper = useDeleteDeveloper();

  const handleAction = () => {
    if (!confirmDialog) return;

    const { action, developerId } = confirmDialog;
    switch (action) {
      case 'approve':
        approveDeveloper.mutate(developerId);
        break;
      case 'suspend':
        suspendDeveloper.mutate(developerId);
        break;
      case 'reinstate':
        reinstateDeveloper.mutate(developerId);
        break;
    }
    setConfirmDialog(null);
  };

  const handleDelete = () => {
    if (!deleteDialog) return;
    deleteDeveloper.mutate({ 
      developerId: deleteDialog.developerId, 
      userId: deleteDialog.userId 
    });
    setDeleteDialog(null);
  };

  const actionLabels = {
    approve: { title: 'Approve Developer', description: 'This will allow the developer to list projects on the platform.' },
    suspend: { title: 'Suspend Developer', description: 'This will prevent the developer from accessing their dashboard and hide their projects.' },
    reinstate: { title: 'Reinstate Developer', description: 'This will restore the developer\'s access to the platform.' },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-2xl font-bold text-foreground">Developer Management</h2>
        <p className="text-muted-foreground">Review and manage developer applications</p>
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

      {/* Developers List */}
      <Card>
        <CardHeader>
          <CardTitle>Developers</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as DeveloperStatus | 'all')}>
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
              {developersLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-32" />
                ))
              ) : developers?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No developers found
                </div>
              ) : (
                developers?.map((developer) => {
                  const status = (developer.status || 'pending') as DeveloperStatus;
                  const statusInfo = statusConfig[status] || statusConfig.pending;
                  const StatusIcon = statusInfo.icon;

                  return (
                    <Card key={developer.id} className="overflow-hidden">
                      <CardContent className="p-4">
                        <div className="flex flex-col sm:flex-row gap-4">
                          {/* Logo */}
                          <Avatar className="h-16 w-16">
                            <AvatarImage src={developer.logo_url || undefined} />
                            <AvatarFallback>
                              <Building2 className="h-8 w-8 text-muted-foreground" />
                            </AvatarFallback>
                          </Avatar>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h3 className="font-semibold text-foreground">{developer.name}</h3>
                                <Badge variant={statusInfo.variant} className="mt-1">
                                  <StatusIcon className="h-3 w-3 mr-1" />
                                  {statusInfo.label}
                                </Badge>
                              </div>
                              <div className="text-right text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {format(new Date(developer.created_at), 'MMM d, yyyy')}
                                </div>
                              </div>
                            </div>

                            <div className="mt-3 grid gap-2 text-sm">
                              {developer.email && (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <Mail className="h-4 w-4" />
                                  <span className="truncate">{developer.email}</span>
                                </div>
                              )}
                              {developer.phone && (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <Phone className="h-4 w-4" />
                                  <span>{developer.phone}</span>
                                </div>
                              )}
                              {developer.website && (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <Globe className="h-4 w-4" />
                                  <a href={developer.website} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                    {developer.website}
                                  </a>
                                </div>
                              )}
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Building2 className="h-4 w-4" />
                                <span>{developer.projects_count || 0} projects</span>
                                {developer.founded_year && (
                                  <span>• Founded {developer.founded_year}</span>
                                )}
                              </div>
                            </div>

                            {developer.description && (
                              <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                                {developer.description}
                              </p>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex sm:flex-col gap-2 sm:w-32">
                            {status === 'pending' && (
                              <Button
                                size="sm"
                                className="flex-1"
                                onClick={() => setConfirmDialog({
                                  open: true,
                                  action: 'approve',
                                  developerId: developer.id,
                                  developerName: developer.name,
                                })}
                              >
                                <UserCheck className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                            )}
                            {status === 'active' && (
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => setConfirmDialog({
                                  open: true,
                                  action: 'suspend',
                                  developerId: developer.id,
                                  developerName: developer.name,
                                })}
                              >
                                <Ban className="h-4 w-4 mr-1" />
                                Suspend
                              </Button>
                            )}
                            {status === 'suspended' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setConfirmDialog({
                                  open: true,
                                  action: 'reinstate',
                                  developerId: developer.id,
                                  developerName: developer.name,
                                })}
                              >
                                <RefreshCw className="h-4 w-4 mr-1" />
                                Reinstate
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => setDeleteDialog({
                                open: true,
                                developerId: developer.id,
                                userId: developer.user_id,
                                developerName: developer.name,
                              })}
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete
                            </Button>
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
                  Are you sure you want to {confirmDialog.action} <strong>{confirmDialog.developerName}</strong>?
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

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        open={deleteDialog?.open || false}
        onOpenChange={(open) => !open && setDeleteDialog(null)}
        entityName={deleteDialog?.developerName || ''}
        entityType="developer"
        onConfirm={handleDelete}
        isLoading={deleteDeveloper.isPending}
      />
    </motion.div>
  );
}
