import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Plus, FileText, Loader2 } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BlogArticleTable } from '@/components/blog/BlogArticleTable';
import { 
  useMyBlogPosts, 
  useSubmitForReview, 
  useDeleteBlogPost,
  BlogVerificationStatus 
} from '@/hooks/useProfessionalBlog';
import { useBlogQuotaCheck } from '@/hooks/useBlogQuota';
import { useAgentProfile } from '@/hooks/useAgentProperties';
import { useMemo, useState } from 'react';

export default function AgentBlog() {
  const { data: agentProfile, isLoading: profileLoading } = useAgentProfile();
  const { data: posts = [], isLoading: postsLoading } = useMyBlogPosts('agent', agentProfile?.id);
  const submitForReview = useSubmitForReview();
  const deleteBlogPost = useDeleteBlogPost();
  const { used: quotaUsed, limit: quotaLimit, canSubmit: canSubmitQuota } = useBlogQuotaCheck('agent', agentProfile?.id);
  const [activeTab, setActiveTab] = useState<string>('all');

  const filteredPosts = useMemo(() => {
    if (activeTab === 'all') return posts;
    return posts.filter(p => {
      const status = p.verification_status || 'draft';
      if (activeTab === 'drafts') return status === 'draft' || status === 'changes_requested';
      if (activeTab === 'pending') return status === 'pending_review';
      if (activeTab === 'published') return status === 'approved';
      return true;
    });
  }, [posts, activeTab]);

  const statusCounts = useMemo(() => ({
    all: posts.length,
    drafts: posts.filter(p => p.verification_status === 'draft' || p.verification_status === 'changes_requested').length,
    pending: posts.filter(p => p.verification_status === 'pending_review').length,
    published: posts.filter(p => p.verification_status === 'approved').length,
  }), [posts]);

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
      <div className="container py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Header */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 p-6">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,hsl(var(--primary)/0.08),transparent_50%)]" />
            <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild className="rounded-xl hover:bg-primary/10 flex-shrink-0">
                  <Link to="/agent">
                    <ArrowLeft className="h-4 w-4" />
                  </Link>
                </Button>
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">My Articles</h1>
                  <p className="text-muted-foreground">Share your expertise with buyers</p>
                </div>
              </div>
              <Button asChild>
                <Link to="/agent/blog/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Write Article
                </Link>
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
              <TabsTrigger value="all">
                All ({statusCounts.all})
              </TabsTrigger>
              <TabsTrigger value="drafts">
                Drafts ({statusCounts.drafts})
              </TabsTrigger>
              <TabsTrigger value="pending">
                Pending ({statusCounts.pending})
              </TabsTrigger>
              <TabsTrigger value="published">
                Published ({statusCounts.published})
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-6">
              <BlogArticleTable
                posts={filteredPosts}
                isLoading={false}
                editBasePath="/agent/blog"
                onSubmitForReview={(postId) => submitForReview.mutate(postId)}
                onDelete={(postId) => deleteBlogPost.mutate(postId)}
                isSubmitting={submitForReview.isPending}
                isDeleting={deleteBlogPost.isPending}
                quotaUsed={quotaUsed}
                quotaLimit={quotaLimit}
                canSubmitQuota={canSubmitQuota}
              />
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </Layout>
  );
}
