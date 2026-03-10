import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { PenLine, Plus, Eye, Clock, CheckCircle2, XCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useMyBlogPosts, type BlogVerificationStatus } from '@/hooks/useProfessionalBlog';
import { useMyAgency } from '@/hooks/useAgencyManagement';
import { useBlogQuotaCheck } from '@/hooks/useBlogQuota';
import { Loader2 } from 'lucide-react';

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: typeof Clock }> = {
  draft: { label: 'Draft', variant: 'secondary', icon: Clock },
  pending_review: { label: 'Pending Review', variant: 'outline', icon: AlertCircle },
  approved: { label: 'Published', variant: 'default', icon: CheckCircle2 },
  changes_requested: { label: 'Changes Requested', variant: 'destructive', icon: XCircle },
  rejected: { label: 'Rejected', variant: 'destructive', icon: XCircle },
};

export default function AgencyBlogManagement() {
  const { data: agency, isLoading: agencyLoading } = useMyAgency();
  const { data: blogPosts = [], isLoading: postsLoading } = useMyBlogPosts('agency', agency?.id);
  const { canSubmit } = useBlogQuotaCheck('agency', agency?.id);

  if (agencyLoading || postsLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-8 max-w-3xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" asChild className="rounded-xl hover:bg-primary/10">
                <Link to="/agency"><ArrowLeft className="h-4 w-4" /></Link>
              </Button>
              <div>
                <h1 className="text-xl font-bold text-foreground">Blog Articles</h1>
                <p className="text-sm text-muted-foreground">{blogPosts.length} article{blogPosts.length !== 1 ? 's' : ''}</p>
              </div>
            </div>
            {canSubmit && (
              <Button asChild className="rounded-xl">
                <Link to="/agency/blog/new">
                  <Plus className="h-4 w-4 mr-2" />
                  New Article
                </Link>
              </Button>
            )}
          </div>

          {/* Posts List */}
          {blogPosts.length === 0 ? (
            <Card className="rounded-2xl border-border/50">
              <CardContent className="py-12 text-center">
                <PenLine className="h-8 w-8 mx-auto mb-3 text-muted-foreground/50" />
                <p className="text-sm font-medium mb-1">No articles yet</p>
                <p className="text-xs text-muted-foreground mb-4">Write your first article to share expertise with buyers</p>
                {canSubmit && (
                  <Button asChild size="sm" className="rounded-xl">
                    <Link to="/agency/blog/new">
                      <Plus className="h-4 w-4 mr-2" />
                      Write Article
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {blogPosts.map((post, index) => {
                const status = STATUS_CONFIG[post.verification_status || 'draft'] || STATUS_CONFIG.draft;
                const StatusIcon = status.icon;

                return (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.04 }}
                  >
                    <Card className="rounded-2xl border-border/50 hover:border-primary/20 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-medium line-clamp-1 mb-1">{post.title || 'Untitled'}</h3>
                            {post.excerpt && (
                              <p className="text-xs text-muted-foreground line-clamp-1 mb-2">{post.excerpt}</p>
                            )}
                            <div className="flex items-center gap-3 flex-wrap">
                              <Badge variant={status.variant} className="text-xs gap-1">
                                <StatusIcon className="h-3 w-3" />
                                {status.label}
                              </Badge>
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Eye className="h-3 w-3" />
                                {post.views_count || 0} views
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(post.created_at), 'MMM d, yyyy')}
                              </span>
                            </div>
                          </div>
                          <Button variant="outline" size="sm" asChild className="rounded-xl text-xs shrink-0">
                            <Link to={`/agency/blog/${post.id}/edit`}>Edit</Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>
    </Layout>
  );
}
