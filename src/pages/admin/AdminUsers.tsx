import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Loader2, User as UserIcon, Users, Ban, UserCheck, Trash2, 
  ShieldOff, Clock
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  useAdminUsers, 
  useUserStats, 
  useBanUser, 
  useUnbanUser, 
  useDeleteUser,
  UserFilter 
} from '@/hooks/useAdminUsers';
import { BanDurationModal } from '@/components/admin/BanDurationModal';
import { DeleteConfirmModal } from '@/components/admin/DeleteConfirmModal';
import { formatDistanceToNow } from 'date-fns';

export default function AdminUsers() {
  const [activeTab, setActiveTab] = useState<UserFilter>('all');
  const [banModal, setBanModal] = useState<{
    open: boolean;
    userId: string;
    userName: string;
  } | null>(null);
  const [deleteModal, setDeleteModal] = useState<{
    open: boolean;
    userId: string;
    userName: string;
  } | null>(null);

  const { data: stats, isLoading: statsLoading } = useUserStats();
  const { data: users = [], isLoading: usersLoading } = useAdminUsers(activeTab);

  const banUser = useBanUser();
  const unbanUser = useUnbanUser();
  const deleteUser = useDeleteUser();

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300';
      case 'agent': return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
      case 'developer': return 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const handleBan = (duration: '1d' | '1w' | '1m' | 'permanent', reason?: string) => {
    if (!banModal) return;
    banUser.mutate({ userId: banModal.userId, banDuration: duration, reason });
    setBanModal(null);
  };

  const handleDelete = () => {
    if (!deleteModal) return;
    deleteUser.mutate(deleteModal.userId);
    setDeleteModal(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-2xl font-bold text-foreground">User Management</h2>
        <p className="text-muted-foreground">Manage user accounts, bans, and permissions</p>
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
                    <p className="text-sm text-muted-foreground">Total Users</p>
                    <p className="text-2xl font-bold">{stats?.total || 0}</p>
                  </div>
                  <Users className="h-8 w-8 text-muted-foreground" />
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
                    <p className="text-sm text-muted-foreground">Banned</p>
                    <p className="text-2xl font-bold text-red-600">{stats?.banned || 0}</p>
                  </div>
                  <Ban className="h-8 w-8 text-red-600" />
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as UserFilter)}>
            <TabsList className="mb-4">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="banned" className="gap-2">
                Banned
                {stats?.banned ? (
                  <Badge variant="destructive" className="ml-1">{stats.banned}</Badge>
                ) : null}
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab}>
              {usersLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : users.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No users found
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left p-4 font-medium">User</th>
                        <th className="text-left p-4 font-medium">Email</th>
                        <th className="text-left p-4 font-medium">Roles</th>
                        <th className="text-left p-4 font-medium">Status</th>
                        <th className="text-left p-4 font-medium">Joined</th>
                        <th className="text-right p-4 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr key={user.id} className="border-t border-border">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <UserIcon className="h-5 w-5 text-primary" />
                              </div>
                              <span className="font-medium">{user.full_name || 'No name'}</span>
                            </div>
                          </td>
                          <td className="p-4 text-sm">{user.email}</td>
                          <td className="p-4">
                            <div className="flex flex-wrap gap-1">
                              {user.roles.map((role) => (
                                <Badge key={role} className={getRoleBadgeColor(role)}>
                                  {role}
                                </Badge>
                              ))}
                            </div>
                          </td>
                          <td className="p-4">
                            {user.is_banned ? (
                              <div className="space-y-1">
                                <Badge variant="destructive" className="gap-1">
                                  <Ban className="h-3 w-3" />
                                  Banned
                                </Badge>
                                {user.banned_until && (
                                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {formatDistanceToNow(new Date(user.banned_until), { addSuffix: true })}
                                  </p>
                                )}
                                {!user.banned_until && user.banned_at && (
                                  <p className="text-xs text-destructive">Permanent</p>
                                )}
                              </div>
                            ) : (
                              <Badge variant="outline" className="text-green-600 border-green-600">
                                Active
                              </Badge>
                            )}
                          </td>
                          <td className="p-4 text-sm text-muted-foreground">
                            {new Date(user.created_at).toLocaleDateString()}
                          </td>
                          <td className="p-4">
                            <div className="flex justify-end gap-2">
                              {user.is_banned ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => unbanUser.mutate(user.id)}
                                  disabled={unbanUser.isPending}
                                >
                                  <ShieldOff className="h-4 w-4 mr-1" />
                                  Unban
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-orange-600 border-orange-600 hover:bg-orange-50"
                                  onClick={() => setBanModal({
                                    open: true,
                                    userId: user.id,
                                    userName: user.full_name || user.email || 'User',
                                  })}
                                >
                                  <Ban className="h-4 w-4 mr-1" />
                                  Ban
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => setDeleteModal({
                                  open: true,
                                  userId: user.id,
                                  userName: user.full_name || user.email || 'User',
                                })}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Ban Duration Modal */}
      <BanDurationModal
        open={banModal?.open || false}
        onOpenChange={(open) => !open && setBanModal(null)}
        userName={banModal?.userName || ''}
        onConfirm={handleBan}
        isLoading={banUser.isPending}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        open={deleteModal?.open || false}
        onOpenChange={(open) => !open && setDeleteModal(null)}
        entityName={deleteModal?.userName || ''}
        entityType="user"
        onConfirm={handleDelete}
        isLoading={deleteUser.isPending}
      />
    </motion.div>
  );
}
