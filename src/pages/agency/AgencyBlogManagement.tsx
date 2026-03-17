import { useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { PenLine, Plus, Eye, Clock, CheckCircle2, XCircle, AlertCircle, ArrowLeft, Lightbulb, X, UserCircle, Sparkles } from 'lucide-react';
import { EnhancedEmptyState } from '@/components/shared/EnhancedEmptyState';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useMyBlogPosts, type BlogVerificationStatus } from '@/hooks/useProfessionalBlog';
import { useMyAgency } from '@/hooks/useAgencyManagement';
import { useBlogQuotaCheck } from '@/hooks/useBlogQuota';
import { AgencyBlogSkeleton } from '@/components/agency/skeletons/AgencyPageSkeletons';

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: typeof Clock }> = {
  draft: { label: 'Draft', variant: 'secondary', icon: Clock },
  pending_review: { label: 'Pending Review', variant: 'outline', icon: AlertCircle },
  approved: { label: 'Published', variant: 'default', icon: CheckCircle2 },
  changes_requested: { label: 'Changes Requested', variant: 'destructive', icon: XCircle },
  rejected: { label: 'Rejected', variant: 'destructive', icon: XCircle },
};

const BANNER_KEY = 'blog_growth_banner_dismissed';

const contentPrompts = [
  "What's the #1 mistake buyers make in your area?",
  "What should buyers know before purchasing in your city?",
  "Explain a process you wish every client understood",
  "What makes your neighborhood a hidden gem?",
];

export default function AgencyBlogManagement() {
  const { data: agency, isLoading: agencyLoading } = useMyAgency();
  const { data: blogPosts = [], isLoading: postsLoading } = useMyBlogPosts('agency', agency?.id);
  const { canSubmit } = useBlogQuotaCheck('agency', agency?.id);
  const [bannerDismissed, setBannerDismissed] = useState(() => localStorage.getItem(BANNER_KEY) === 'true');

  const totalViews = blogPosts.reduce((sum, p) => sum + (p.views_count || 0), 0);
  const publishedCount = blogPosts.filter(p => p.verification_status === 'approved').length;

  if (agencyLoading || postsLoading) {
    return <AgencyBlogSkeleton />;
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
                    Articles you publish appear on BuyWise Israel's blog — seen by buyers actively researching. Share what you know about your market, and let your knowledge do the marketing.
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

          {/* Real Stats (only if they have published content) */}
          {publishedCount > 0 && totalViews > 0 && (
            <div className="flex items-center gap-4 px-1">
              <span className="text-xs text-muted-foreground">
                <strong className="text-foreground">{publishedCount}</strong> published
              </span>
              <span className="text-xs text-muted-foreground">
                <strong className="text-foreground">{totalViews.toLocaleString()}</strong> total views
              </span>
            </div>
          )}

          {/* Posts List */}
          {blogPosts.length === 0 ? (
            <div className="space-y-6">
              <EnhancedEmptyState
                icon={PenLine}
                title="No articles yet"
                description="Write your first article to share expertise with buyers and boost your agency's visibility."
                variant="compact"
                primaryAction={canSubmit ? { label: 'Write Article', href: '/agency/blog/new', icon: Plus } : undefined}
                suggestions={[
                  { icon: Lightbulb, text: 'Share market insights or neighborhood guides' },
                  { icon: Eye, text: 'Published articles appear on your agency profile' },
                ]}
              />

              {/* Content Prompts */}
              <Card className="rounded-2xl border-primary/10">
                <CardContent className="p-4 space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Not sure what to write?</p>
                  <div className="grid gap-2">
                    {contentPrompts.map((prompt) => (
                      <Link
                        key={prompt}
                        to="/agency/blog/new"
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

              {/* Content Prompts (collapsed, below articles) */}
              {canSubmit && (
                <Card className="rounded-2xl border-dashed border-primary/15 bg-primary/[0.02]">
                  <CardContent className="p-3">
                    <p className="text-xs text-muted-foreground mb-2">Ideas for your next article:</p>
                    <div className="flex flex-wrap gap-2">
                      {contentPrompts.slice(0, 2).map((prompt) => (
                        <Link
                          key={prompt}
                          to="/agency/blog/new"
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
