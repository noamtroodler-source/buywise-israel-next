import { useState } from 'react';
import { formatDistanceToNow, format } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Check, X, MessageSquare, ChevronDown, ChevronUp, 
  Eye, Clock, MapPin, User, FileText, AlertCircle
} from 'lucide-react';
import { BlogPostForReview, BlogVerificationStatus, AuthorType } from '@/hooks/useBlogReview';
import { BlogPreviewModal } from './BlogPreviewModal';
import DOMPurify from 'dompurify';

interface BlogReviewCardProps {
  post: BlogPostForReview;
  onApprove: (id: string, authorType?: AuthorType, authorProfileId?: string, postTitle?: string) => void;
  onRequestChanges: (id: string, feedback: string, authorType?: AuthorType, authorProfileId?: string, postTitle?: string) => void;
  onReject: (id: string, reason: string, authorType?: AuthorType, authorProfileId?: string, postTitle?: string) => void;
}

export function BlogReviewCard({ post, onApprove, onRequestChanges, onReject }: BlogReviewCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showChangesDialog, setShowChangesDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [reason, setReason] = useState('');

  const getStatusBadge = (status: BlogVerificationStatus) => {
    const config = {
      draft: { label: 'Draft', className: 'bg-muted text-muted-foreground' },
      pending_review: { label: 'Pending Review', className: 'bg-yellow-100 text-yellow-800' },
      changes_requested: { label: 'Changes Requested', className: 'bg-orange-100 text-orange-800' },
      approved: { label: 'Approved', className: 'bg-green-100 text-green-800' },
      rejected: { label: 'Rejected', className: 'bg-red-100 text-red-800' },
    };
    const { label, className } = config[status] || config.draft;
    return <Badge className={className}>{label}</Badge>;
  };

  const getAuthorTypeBadge = (type: AuthorType | null) => {
    switch (type) {
      case 'agent':
        return <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50 text-xs">Agent</Badge>;
      case 'agency':
        return <Badge variant="outline" className="text-purple-600 border-purple-200 bg-purple-50 text-xs">Agency</Badge>;
      case 'developer':
        return <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50 text-xs">Developer</Badge>;
      default:
        return null;
    }
  };

  const handleApprove = () => {
    onApprove(post.id, post.author_type || undefined, post.author_profile_id || undefined, post.title);
  };

  const handleRequestChanges = () => {
    if (feedback.trim()) {
      onRequestChanges(post.id, feedback, post.author_type || undefined, post.author_profile_id || undefined, post.title);
      setShowChangesDialog(false);
      setFeedback('');
    }
  };

  const handleReject = () => {
    if (reason.trim()) {
      onReject(post.id, reason, post.author_type || undefined, post.author_profile_id || undefined, post.title);
      setShowRejectDialog(false);
      setReason('');
    }
  };

  const canTakeAction = post.verification_status === 'pending_review' || post.verification_status === 'changes_requested';

  const truncateContent = (content: string, maxLength: number = 200) => {
    const stripped = content.replace(/[#*\-_\[\]]/g, '').replace(/\n+/g, ' ');
    if (stripped.length <= maxLength) return stripped;
    return stripped.substring(0, maxLength) + '...';
  };

  const wordCount = post.content.split(/\s+/).length;

  return (
    <>
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="flex flex-col md:flex-row">
            {/* Cover Image */}
            <div className="md:w-48 h-40 md:h-auto flex-shrink-0">
              {post.cover_image ? (
                <img
                  src={post.cover_image}
                  alt={post.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center">
                  <FileText className="h-12 w-12 text-muted-foreground" />
                </div>
              )}
            </div>
            
            {/* Content */}
            <div className="flex-1 p-4 space-y-3">
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg line-clamp-2">{post.title}</h3>
                  <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-muted-foreground">
                    {getStatusBadge(post.verification_status)}
                    {post.submitted_at && (
                      <span>Submitted {formatDistanceToNow(new Date(post.submitted_at), { addSuffix: true })}</span>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Categories & Meta */}
              <div className="flex flex-wrap items-center gap-2 text-sm">
                {post.categories && post.categories.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {post.categories.slice(0, 3).map((cat) => (
                      <Badge key={cat.id} variant="secondary" className="text-xs">
                        {cat.name}
                      </Badge>
                    ))}
                  </div>
                )}
                {post.city && (
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    <span>{post.city}</span>
                  </div>
                )}
                {post.reading_time_minutes && (
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{post.reading_time_minutes} min</span>
                  </div>
                )}
                <span className="text-muted-foreground">{wordCount} words</span>
              </div>
              
              {/* Author Info */}
              {post.author && (
                <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={post.author.avatar || undefined} />
                    <AvatarFallback>
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm truncate">{post.author.name}</span>
                      {getAuthorTypeBadge(post.author.type)}
                    </div>
                    {post.author.organization_name && (
                      <p className="text-xs text-muted-foreground truncate">{post.author.organization_name}</p>
                    )}
                  </div>
                </div>
              )}
              
              {/* Previous Feedback Warning */}
              {post.verification_status === 'changes_requested' && post.rejection_reason && (
                <div className="flex items-start gap-2 p-2 bg-orange-50 border border-orange-200 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-orange-800">Previous Feedback:</p>
                    <p className="text-orange-700">{post.rejection_reason}</p>
                  </div>
                </div>
              )}
              
              {/* Expandable Content Preview */}
              <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground">
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    {isExpanded ? 'Show Less' : 'Show More'}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-3 pt-2">
                  {post.excerpt && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Excerpt:</p>
                      <p className="text-sm italic">{post.excerpt}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Content Preview:</p>
                    <p className="text-sm text-muted-foreground">{truncateContent(post.content, 400)}</p>
                  </div>
                  {post.audiences && post.audiences.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Target Audiences:</p>
                      <div className="flex flex-wrap gap-1">
                        {post.audiences.map((audience) => (
                          <Badge key={audience} variant="outline" className="text-xs capitalize">
                            {audience.replace('-', ' ')}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CollapsibleContent>
              </Collapsible>
              
              {/* Actions */}
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t">
                {canTakeAction && (
                  <>
                    <Button size="sm" onClick={handleApprove} className="gap-1">
                      <Check className="h-4 w-4" />
                      Approve
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setShowChangesDialog(true)} className="gap-1">
                      <MessageSquare className="h-4 w-4" />
                      Request Changes
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => setShowRejectDialog(true)} className="gap-1">
                      <X className="h-4 w-4" />
                      Reject
                    </Button>
                  </>
                )}
                <Button size="sm" variant="ghost" onClick={() => setShowPreviewModal(true)} className="gap-1 ml-auto">
                  <Eye className="h-4 w-4" />
                  Preview
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Request Changes Dialog */}
      <Dialog open={showChangesDialog} onOpenChange={setShowChangesDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Changes</DialogTitle>
            <DialogDescription>
              Provide feedback for the author to improve their blog post.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="feedback">Feedback</Label>
              <Textarea
                id="feedback"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Describe what changes are needed..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowChangesDialog(false)}>Cancel</Button>
            <Button onClick={handleRequestChanges} disabled={!feedback.trim()}>Send Feedback</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Blog Post</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting this blog post. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Rejection</Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Explain why this blog post is being rejected..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleReject} disabled={!reason.trim()}>
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Modal */}
      <BlogPreviewModal
        post={post}
        open={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
      />
    </>
  );
}
