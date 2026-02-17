import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Eye, Pencil, Trash2, Send, Clock, CheckCircle, 
  AlertCircle, FileText, MoreHorizontal, ExternalLink, Info
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
import { ProfessionalBlogPost, BlogVerificationStatus } from '@/hooks/useProfessionalBlog';
import { format } from 'date-fns';
import { useState } from 'react';

interface BlogArticleTableProps {
  posts: ProfessionalBlogPost[];
  isLoading: boolean;
  editBasePath: string; // e.g., '/agent/blog' or '/developer/blog'
  onSubmitForReview: (postId: string) => void;
  onDelete: (postId: string) => void;
  isSubmitting?: boolean;
  isDeleting?: boolean;
  quotaUsed?: number;
  quotaLimit?: number | null;
  canSubmitQuota?: boolean;
}

const statusConfig: Record<BlogVerificationStatus, { label: string; icon: typeof FileText; className: string }> = {
  draft: { 
    label: 'Draft', 
    icon: FileText, 
    className: 'bg-muted text-muted-foreground' 
  },
  pending_review: { 
    label: 'Pending Review', 
    icon: Clock, 
    className: 'bg-primary/10 text-primary' 
  },
  approved: { 
    label: 'Published', 
    icon: CheckCircle, 
    className: 'bg-primary/10 text-primary' 
  },
  changes_requested: { 
    label: 'Changes Requested', 
    icon: AlertCircle, 
    className: 'bg-primary/10 text-primary' 
  },
  rejected: { 
    label: 'Rejected', 
    icon: AlertCircle, 
    className: 'bg-muted text-muted-foreground' 
  },
};

export function BlogArticleTable({
  posts,
  isLoading,
  editBasePath,
  onSubmitForReview,
  onDelete,
  isSubmitting,
  isDeleting,
  quotaUsed,
  quotaLimit,
  canSubmitQuota = true,
}: BlogArticleTableProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);

  const handleDeleteClick = (postId: string) => {
    setSelectedPostId(postId);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (selectedPostId) {
      onDelete(selectedPostId);
      setDeleteDialogOpen(false);
      setSelectedPostId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-6 bg-muted rounded w-1/3 mb-2" />
              <div className="h-4 bg-muted rounded w-1/4" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-12 text-center">
          <FileText className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
          <h3 className="font-medium mb-1">No articles yet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Start sharing your expertise by writing your first article
          </p>
          <Button asChild>
            <Link to={`${editBasePath}/new`}>Write Article</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <TooltipProvider>
      {quotaLimit !== null && quotaLimit !== undefined && (
        <div className="flex items-center gap-2 mb-4 p-3 rounded-xl bg-muted/50 border border-border/50">
          <Info className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <span className="text-sm text-muted-foreground">
            {quotaUsed ?? 0}/{quotaLimit} blog posts used this month
          </span>
          {!canSubmitQuota && (
            <Badge variant="outline" className="ml-auto text-xs">Limit reached</Badge>
          )}
        </div>
      )}
      <div className="space-y-3">
        {posts.map((post, index) => {
          const status = post.verification_status || 'draft';
          const config = statusConfig[status];
          const StatusIcon = config.icon;
          const canEdit = status === 'draft' || status === 'changes_requested';
          const canSubmit = (status === 'draft' || status === 'changes_requested') && canSubmitQuota;
          const canDelete = status === 'draft';

          return (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="hover:border-primary/20 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={`${config.className} rounded-full text-xs gap-1`}>
                          <StatusIcon className="h-3 w-3" />
                          {config.label}
                        </Badge>
                        {post.category && (
                          <Badge variant="outline" className="text-xs rounded-full">
                            {post.category.name}
                          </Badge>
                        )}
                      </div>
                      
                      <h3 className="font-medium text-foreground truncate mb-1">
                        {post.title}
                      </h3>
                      
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>
                          {format(new Date(post.created_at), 'MMM d, yyyy')}
                        </span>
                        {post.reading_time_minutes && (
                          <span>{post.reading_time_minutes} min read</span>
                        )}
                        {status === 'approved' && post.views_count > 0 && (
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {post.views_count} views
                          </span>
                        )}
                      </div>

                      {status === 'changes_requested' && post.rejection_reason && (
                        <div className="mt-2 p-2 bg-primary/5 rounded-lg text-sm text-primary">
                          <strong>Feedback:</strong> {post.rejection_reason}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {canSubmit && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onSubmitForReview(post.id)}
                          disabled={isSubmitting}
                          className="hidden sm:flex"
                        >
                          <Send className="h-3.5 w-3.5 mr-1.5" />
                          Submit
                        </Button>
                      )}
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {canEdit && (
                            <DropdownMenuItem asChild>
                              <Link to={`${editBasePath}/${post.id}/edit`}>
                                <Pencil className="h-4 w-4 mr-2" />
                                Edit
                              </Link>
                            </DropdownMenuItem>
                          )}
                          
                          {status === 'approved' && (
                            <DropdownMenuItem asChild>
                              <Link to={`/blog/${post.slug}`} target="_blank">
                                <ExternalLink className="h-4 w-4 mr-2" />
                                View Live
                              </Link>
                            </DropdownMenuItem>
                          )}
                          
                          {canSubmit && (
                            <DropdownMenuItem 
                              onClick={() => onSubmitForReview(post.id)}
                              className="sm:hidden"
                            >
                              <Send className="h-4 w-4 mr-2" />
                              Submit for Review
                            </DropdownMenuItem>
                          )}
                          
                          {canDelete && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => handleDeleteClick(post.id)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Draft</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this draft? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TooltipProvider>
  );
}
