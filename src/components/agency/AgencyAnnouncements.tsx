import { useState } from 'react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Megaphone, Pin, Plus, Trash2, Edit2, Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
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
import { cn } from '@/lib/utils';
import { 
  useAgencyAnnouncements, 
  useCreateAnnouncement, 
  useUpdateAnnouncement, 
  useDeleteAnnouncement,
  Announcement 
} from '@/hooks/useAgencyAnnouncements';

interface AgencyAnnouncementsProps {
  agencyId: string;
  compact?: boolean;
}

export function AgencyAnnouncements({ agencyId, compact = false }: AgencyAnnouncementsProps) {
  const { data: announcements = [] } = useAgencyAnnouncements(agencyId);
  const createAnnouncement = useCreateAnnouncement();
  const updateAnnouncement = useUpdateAnnouncement();
  const deleteAnnouncement = useDeleteAnnouncement();

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPinned, setIsPinned] = useState(false);

  const resetForm = () => {
    setTitle('');
    setContent('');
    setIsPinned(false);
  };

  const handleCreate = () => {
    if (!title.trim() || !content.trim()) return;
    createAnnouncement.mutate({ 
      agencyId, 
      title: title.trim(), 
      content: content.trim(), 
      is_pinned: isPinned 
    }, {
      onSuccess: () => {
        resetForm();
        setCreateDialogOpen(false);
      },
    });
  };

  const handleEdit = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    setTitle(announcement.title);
    setContent(announcement.content);
    setIsPinned(announcement.is_pinned);
    setEditDialogOpen(true);
  };

  const handleUpdate = () => {
    if (!selectedAnnouncement || !title.trim() || !content.trim()) return;
    updateAnnouncement.mutate({
      id: selectedAnnouncement.id,
      title: title.trim(),
      content: content.trim(),
      is_pinned: isPinned,
    }, {
      onSuccess: () => {
        resetForm();
        setSelectedAnnouncement(null);
        setEditDialogOpen(false);
      },
    });
  };

  const handleDelete = () => {
    if (!selectedAnnouncement) return;
    deleteAnnouncement.mutate(selectedAnnouncement.id, {
      onSuccess: () => {
        setSelectedAnnouncement(null);
        setDeleteDialogOpen(false);
      },
    });
  };

  const sortedAnnouncements = [...announcements].sort((a, b) => {
    // Pinned first, then by date
    if (a.is_pinned && !b.is_pinned) return -1;
    if (!a.is_pinned && b.is_pinned) return 1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const displayAnnouncements = compact ? sortedAnnouncements.slice(0, 3) : sortedAnnouncements;

  if (compact) {
    return (
      <>
        {displayAnnouncements.length === 0 ? (
          <p className="text-xs text-muted-foreground py-2">No team announcements yet</p>
        ) : (
          <div className="space-y-2">
            {displayAnnouncements.map((a) => (
              <div key={a.id} className={cn("p-2 rounded-lg text-xs border", a.is_pinned ? "bg-primary/5 border-primary/20" : "bg-muted/30 border-border/50")}>
                <p className="font-medium line-clamp-1">{a.title}</p>
                <p className="text-muted-foreground line-clamp-1">{a.content}</p>
              </div>
            ))}
            {sortedAnnouncements.length > 3 && (
              <p className="text-xs text-muted-foreground">+{sortedAnnouncements.length - 3} more</p>
            )}
          </div>
        )}
        <Button size="sm" variant="outline" className="rounded-xl w-full mt-2 text-xs" onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-3 w-3 mr-1" /> New Announcement
        </Button>

        {/* Dialogs still need to render */}
        {renderDialogs()}
      </>
    );
  }

  return (
    <Card className="rounded-2xl border-primary/10">
      <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent rounded-t-2xl flex flex-row items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Megaphone className="h-4 w-4 text-primary" />
          </div>
          <CardTitle>Team Announcements</CardTitle>
        </div>
        <Button 
          size="sm" 
          className="rounded-xl"
          onClick={() => setCreateDialogOpen(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          New
        </Button>
      </CardHeader>
      <CardContent className="pt-4">
        {sortedAnnouncements.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Megaphone className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No team announcements yet</p>
            <p className="text-xs mt-1">Post updates visible to all agents in your agency</p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {sortedAnnouncements.map((announcement, index) => (
                <motion.div
                  key={announcement.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ delay: index * 0.05 }}
                  className={cn(
                    "p-4 rounded-xl border transition-colors",
                    announcement.is_pinned 
                      ? "bg-primary/5 border-primary/20" 
                      : "bg-muted/30 border-border/50"
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {announcement.is_pinned && (
                          <Pin className="h-3 w-3 text-primary" />
                        )}
                        <h4 className="font-medium text-sm">{announcement.title}</h4>
                      </div>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {announcement.content}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {format(new Date(announcement.created_at), 'MMM d, yyyy')}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(announcement)}
                        className="h-8 w-8 p-0 rounded-lg"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedAnnouncement(announcement);
                          setDeleteDialogOpen(true);
                        }}
                        className="h-8 w-8 p-0 rounded-lg text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </CardContent>

      {renderDialogs()}
    </Card>
  );

  function renderDialogs() {
    return (
      <>
        {/* Create Dialog */}
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogContent className="rounded-2xl sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Create Announcement</DialogTitle>
              <DialogDescription>
                Post an announcement visible to all agents in your agency
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="create-title">Title</Label>
                <Input
                  id="create-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Announcement title"
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-content">Message</Label>
                <Textarea
                  id="create-content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write your announcement..."
                  rows={4}
                  className="rounded-xl resize-none"
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Pin Announcement</Label>
                  <p className="text-xs text-muted-foreground">
                    Pinned announcements appear at the top
                  </p>
                </div>
                <Switch checked={isPinned} onCheckedChange={setIsPinned} />
              </div>
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => {
                  resetForm();
                  setCreateDialogOpen(false);
                }}
                className="rounded-xl"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleCreate}
                disabled={!title.trim() || !content.trim() || createAnnouncement.isPending}
                className="rounded-xl"
              >
                {createAnnouncement.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="rounded-2xl sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Edit Announcement</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-title">Title</Label>
                <Input
                  id="edit-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-content">Message</Label>
                <Textarea
                  id="edit-content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={4}
                  className="rounded-xl resize-none"
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Pin Announcement</Label>
                <Switch checked={isPinned} onCheckedChange={setIsPinned} />
              </div>
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => {
                  resetForm();
                  setSelectedAnnouncement(null);
                  setEditDialogOpen(false);
                }}
                className="rounded-xl"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleUpdate}
                disabled={!title.trim() || !content.trim() || updateAnnouncement.isPending}
                className="rounded-xl"
              >
                {updateAnnouncement.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent className="rounded-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Announcement?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. The announcement will be permanently deleted.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={deleteAnnouncement.isPending}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl"
              >
                {deleteAnnouncement.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }
}
