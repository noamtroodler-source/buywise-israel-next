import { useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { PenLine, Plus, Eye, Clock, CheckCircle2, XCircle, AlertCircle, ArrowLeft, Lightbulb, X, UserCircle, Sparkles, ChevronDown, Loader2 } from 'lucide-react';
import { EnhancedEmptyState } from '@/components/shared/EnhancedEmptyState';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useMyBlogPosts, type ProfessionalBlogPost } from '@/hooks/useProfessionalBlog';
import { useBlogQuotaCheck } from '@/hooks/useBlogQuota';
import { useAgentProfile } from '@/hooks/useAgentProperties';

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: typeof Clock }> = {
  draft: { label: 'Draft', variant: 'secondary', icon: Clock },
  pending_review: { label: 'Pending Review', variant: 'outline', icon: AlertCircle },
  approved: { label: 'Published', variant: 'default', icon: CheckCircle2 },
  changes_requested: { label: 'Changes Requested', variant: 'destructive', icon: XCircle },
  rejected: { label: 'Rejected', variant: 'destructive', icon: XCircle },
};

const BANNER_KEY = 'agent_blog_growth_banner_dismissed';

const contentPrompts = [
  "What's the #1 mistake buyers make in your area?",
  "What should buyers know before purchasing in your city?",
  "Explain a process you wish every client understood",
  "What makes your neighborhood a hidden gem?",
];

function PostCard({ post, editBasePath, showEdit = true }: { post: ProfessionalBlogPost; editBasePath: string; showEdit?: boolean }) {
  const status = STATUS_CONFIG[post.verification_status || 'draft'] || STATUS_CONFIG.draft;
  const StatusIcon = status.icon;

  return (
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
          {showEdit ? (
            <Button variant="outline" size="sm" asChild className="rounded-xl text-xs shrink-0">
              <Link to={`${editBasePath}/${post.id}/edit`}>Edit</Link>
            </Button>
          ) : (
            post.verification_status === 'approved' && post.slug && (
              <Button variant="ghost" size="sm" asChild className="rounded-xl text-xs shrink-0 text-muted-foreground">
                <Link to={`/blog/${post.slug}`}>View</Link>
              </Button>
            )
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function PublishedSection({ posts, editBasePath }: { posts: ProfessionalBlogPost[]; editBasePath: string }) {
  const [open, setOpen] = useState(false);
  const totalViews = posts.reduce((sum, p) => sum + (p.views_count || 0), 0);
  const showCollapsible = posts.length > 3;
  const visiblePosts = showCollapsible && !open ? posts.slice(0, 3) : posts;

  if (posts.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 px-1">
        <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
        <span className="text-xs font-medium text-foreground">Published</span>
        <span className="text-xs text-muted-foreground">· {posts.length} article{posts.length !== 1 ? 's' : ''}</span>
        {totalViews > 0 && (
          <span className="text-xs text-muted-foreground">· {totalViews.toLocaleString()} views</span>
        )}
      </div>
      <Collapsible open={open} onOpenChange={setOpen}>
        <div className="space-y-2">
          {visiblePosts.map((post) => (
            <motion.div key={post.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <PostCard post={post} editBasePath={editBasePath} showEdit={false} />
            </motion.div>
          ))}
        </div>
        {showCollapsible && (
          <CollapsibleTrigger asChild>
            <button className="flex items-center gap-1 mt-2 text-xs text-primary hover:text-primary/80 transition-colors mx-1">
              <ChevronDown className={`h-3 w-3 transition-transform ${open ? 'rotate-180' : ''}`} />
              {open ? 'Show less' : `Show all ${posts.length} articles`}
            </button>
          </CollapsibleTrigger>
        )}
      </Collapsible>
    </div>
  );
}

export default function AgentBlog() {
  const { data: agentProfile, isLoading: profileLoading } = useAgentProfile();
  const { data: posts = [], isLoading: postsLoading } = useMyBlogPosts('agent', agentProfile?.id);
  const { used: quotaUsed, limit: quotaLimit, canSubmit } = useBlogQuotaCheck('agent', agentProfile?.id);
  const [bannerDismissed, setBannerDismissed] = useState(() => localStorage.getItem(BANNER_KEY) === 'true');

  const activePosts = posts.filter(p => p.verification_status !== 'approved');
  const publishedPosts = posts.filter(p => p.verification_status === 'approved');

  const isLoading = profileLoading || postsLoading;

  if (isLoading) {
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
                <Link to="/agent"><ArrowLeft className="h-4 w-4" /></Link>
              </Button>
              <div>
                <h1 className="text-xl font-bold text-foreground">My Articles</h1>
                <p className="text-sm text-muted-foreground">{posts.length} article{posts.length !== 1 ? 's' : ''}</p>
              </div>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <Button asChild={canSubmit} disabled={!canSubmit} className="rounded-xl">
                      {canSubmit ? (
                        <Link to="/agent/blog/new">
                          <Plus className="h-4 w-4 mr-2" />
                          Write Article
                        </Link>
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-2" />
                          Write Article
                        </>
                      )}
                    </Button>
                  </span>
                </TooltipTrigger>
                {!canSubmit && (
                  <TooltipContent>
                    Monthly blog limit reached ({quotaUsed}/{quotaLimit}). Resets on the 1st.
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Growth Banner */}
          {!bannerDismissed && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative p-4 rounded-2xl bg-primary/5 border border-primary/15"
            >
              <button
                onClick={() => {
                  localStorage.setItem(BANNER_KEY, 'true');
                  setBannerDismissed(true);
                }}
                className="absolute top-3 right-3 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="flex items-start gap-3 pr-6">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <PenLine className="h-4 w-4 text-primary" />
                </div>
                <div className="space-y-1.5">
                  <p className="text-sm font-medium text-foreground">Your expertise, their trust.</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Writing builds credibility. Buyers who read your articles are more likely to reach out. Share what you know about your market, and let your knowledge do the marketing.
                  </p>
                  <div className="flex items-center gap-3 pt-1">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <UserCircle className="h-3 w-3" />
                      Published articles link to your profile
                    </span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Sparkles className="h-3 w-3" />
                      AI formatting included
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Content */}
          {posts.length === 0 ? (
            <div className="space-y-6">
              <EnhancedEmptyState
                icon={PenLine}
                title="No articles yet"
                description="Write your first article to share your expertise with buyers and boost your visibility."
                variant="compact"
                primaryAction={canSubmit ? { label: 'Write Article', href: '/agent/blog/new', icon: Plus } : undefined}
                suggestions={[
                  { icon: Lightbulb, text: 'Share market insights or neighborhood guides' },
                  { icon: Eye, text: 'Published articles appear on your agent profile' },
                ]}
              />
              <Card className="rounded-2xl border-primary/10">
                <CardContent className="p-4 space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Not sure what to write?</p>
                  <div className="grid gap-2">
                    {contentPrompts.map((prompt) => (
                      <Link
                        key={prompt}
                        to="/agent/blog/new"
                        className="flex items-center gap-2 p-2.5 rounded-xl text-sm text-foreground hover:bg-muted/50 transition-colors border border-border/50"
                      >
                        <Lightbulb className="h-3.5 w-3.5 text-primary shrink-0" />
                        {prompt}
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Active section */}
              {activePosts.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 px-1">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs font-medium text-foreground">In Progress</span>
                    <span className="text-xs text-muted-foreground">· {activePosts.length}</span>
                  </div>
                  {activePosts.map((post, index) => (
                    <motion.div
                      key={post.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.04 }}
                    >
                      <PostCard post={post} editBasePath="/agent/blog" showEdit />
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Published section */}
              <PublishedSection posts={publishedPosts} editBasePath="/agent/blog" />

              {/* Content Prompts */}
              {canSubmit && (
                <Card className="rounded-2xl border-dashed border-primary/15 bg-primary/[0.02]">
                  <CardContent className="p-3">
                    <p className="text-xs text-muted-foreground mb-2">Ideas for your next article:</p>
                    <div className="flex flex-wrap gap-2">
                      {contentPrompts.slice(0, 2).map((prompt) => (
                        <Link
                          key={prompt}
                          to="/agent/blog/new"
                          className="text-xs text-primary hover:text-primary/80 hover:underline"
                        >
                          "{prompt}"
                        </Link>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </Layout>
  );
}
