import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { toast } from 'sonner';
import { Plus, RefreshCw, Edit, Trash2, Megaphone, AlertTriangle, Info, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';

interface Announcement {
  id: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
  updated_at: string;
}

const ANNOUNCEMENT_TYPES = [
  { value: 'info', label: 'Info', icon: Info, color: 'bg-blue-100 text-blue-800' },
  { value: 'warning', label: 'Warning', icon: AlertTriangle, color: 'bg-yellow-100 text-yellow-800' },
  { value: 'success', label: 'Success', icon: CheckCircle, color: 'bg-green-100 text-green-800' },
  { value: 'error', label: 'Error', icon: XCircle, color: 'bg-red-100 text-red-800' },
];

const emptyAnnouncement: Partial<Announcement> = {
  message: '',
  type: 'info',
  is_active: false,
  starts_at: null,
  ends_at: null,
};

export function AdminAnnouncements() {
  const queryClient = useQueryClient();
  const [editingAnnouncement, setEditingAnnouncement] = useState<Partial<Announcement> | null>(null);
  const [deletingAnnouncement, setDeletingAnnouncement] = useState<Announcement | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const { data: announcements, isLoading } = useQuery({
    queryKey: ['admin-announcements'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_announcements')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Announcement[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (announcement: Partial<Announcement>) => {
      const { error } = await supabase.from('site_announcements').insert([{
        message: announcement.message!,
        type: announcement.type || 'info',
        is_active: announcement.is_active || false,
        starts_at: announcement.starts_at,
        ends_at: announcement.ends_at,
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-announcements'] });
      toast.success('Announcement created');
      setEditingAnnouncement(null);
      setIsCreating(false);
    },
    onError: (error) => {
      toast.error('Failed to create: ' + error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (announcement: Partial<Announcement>) => {
      const { error } = await supabase
        .from('site_announcements')
        .update(announcement)
        .eq('id', announcement.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-announcements'] });
      toast.success('Announcement updated');
      setEditingAnnouncement(null);
    },
    onError: (error) => {
      toast.error('Failed to update: ' + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('site_announcements')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-announcements'] });
      // No toast - row disappears from table visually
      setDeletingAnnouncement(null);
    },
    onError: (error) => {
      toast.error('Failed to delete: ' + error.message);
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('site_announcements')
        .update({ is_active, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-announcements'] });
      // No toast - toggle updates inline
    },
    onError: (error) => {
      toast.error('Failed to update: ' + error.message);
    },
  });

  const handleSave = () => {
    if (!editingAnnouncement) return;
    if (!editingAnnouncement.message) {
      toast.error('Message is required');
      return;
    }

    if (isCreating) {
      createMutation.mutate(editingAnnouncement);
    } else {
      updateMutation.mutate(editingAnnouncement);
    }
  };

  const getTypeConfig = (type: string) => {
    return ANNOUNCEMENT_TYPES.find((t) => t.value === type) || ANNOUNCEMENT_TYPES[0];
  };

  const activeAnnouncement = announcements?.find((a) => a.is_active);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Site Announcements</h2>
          <p className="text-muted-foreground">
            Display banners and messages to all users across the site.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingAnnouncement(emptyAnnouncement);
            setIsCreating(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          New Announcement
        </Button>
      </div>

      {/* Active Banner Preview */}
      {activeAnnouncement && (
        <Card className="border-primary">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Megaphone className="h-4 w-4" />
              Currently Active
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`p-4 rounded-lg ${getTypeConfig(activeAnnouncement.type).color}`}>
              {activeAnnouncement.message}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Announcements List */}
      <div className="space-y-4">
        {announcements?.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No announcements yet. Create one to display a banner to users.
            </CardContent>
          </Card>
        ) : (
          announcements?.map((announcement) => {
            const typeConfig = getTypeConfig(announcement.type);
            const TypeIcon = typeConfig.icon;
            return (
              <Card key={announcement.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${typeConfig.color}`}>
                        <TypeIcon className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge variant={announcement.is_active ? 'default' : 'secondary'}>
                            {announcement.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                          <Badge variant="outline" className="capitalize">
                            {announcement.type}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Created {format(new Date(announcement.created_at), 'MMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={announcement.is_active}
                        onCheckedChange={(checked) =>
                          toggleActiveMutation.mutate({ id: announcement.id, is_active: checked })
                        }
                        disabled={toggleActiveMutation.isPending}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingAnnouncement(announcement);
                          setIsCreating(false);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeletingAnnouncement(announcement)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{announcement.message}</p>
                  {(announcement.starts_at || announcement.ends_at) && (
                    <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                      {announcement.starts_at && (
                        <span>Starts: {format(new Date(announcement.starts_at), 'MMM d, yyyy h:mm a')}</span>
                      )}
                      {announcement.ends_at && (
                        <span>Ends: {format(new Date(announcement.ends_at), 'MMM d, yyyy h:mm a')}</span>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Edit/Create Dialog */}
      <Dialog open={!!editingAnnouncement} onOpenChange={() => setEditingAnnouncement(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isCreating ? 'Create Announcement' : 'Edit Announcement'}</DialogTitle>
            <DialogDescription>
              This message will be displayed as a banner across the site when active.
            </DialogDescription>
          </DialogHeader>
          {editingAnnouncement && (
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="message">Message *</Label>
                <Textarea
                  id="message"
                  value={editingAnnouncement.message || ''}
                  onChange={(e) =>
                    setEditingAnnouncement({ ...editingAnnouncement, message: e.target.value })
                  }
                  placeholder="Enter your announcement message..."
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select
                  value={editingAnnouncement.type || 'info'}
                  onValueChange={(value: 'info' | 'warning' | 'success' | 'error') =>
                    setEditingAnnouncement({ ...editingAnnouncement, type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ANNOUNCEMENT_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <type.icon className="h-4 w-4" />
                          {type.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="starts_at">Starts At (optional)</Label>
                  <Input
                    id="starts_at"
                    type="datetime-local"
                    value={editingAnnouncement.starts_at ? editingAnnouncement.starts_at.slice(0, 16) : ''}
                    onChange={(e) =>
                      setEditingAnnouncement({
                        ...editingAnnouncement,
                        starts_at: e.target.value ? new Date(e.target.value).toISOString() : null,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ends_at">Ends At (optional)</Label>
                  <Input
                    id="ends_at"
                    type="datetime-local"
                    value={editingAnnouncement.ends_at ? editingAnnouncement.ends_at.slice(0, 16) : ''}
                    onChange={(e) =>
                      setEditingAnnouncement({
                        ...editingAnnouncement,
                        ends_at: e.target.value ? new Date(e.target.value).toISOString() : null,
                      })
                    }
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="is_active"
                  checked={editingAnnouncement.is_active || false}
                  onCheckedChange={(checked) =>
                    setEditingAnnouncement({ ...editingAnnouncement, is_active: checked })
                  }
                />
                <Label htmlFor="is_active">Active immediately</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingAnnouncement(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {isCreating ? 'Create' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingAnnouncement} onOpenChange={() => setDeletingAnnouncement(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Announcement</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this announcement? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingAnnouncement && deleteMutation.mutate(deletingAnnouncement.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}