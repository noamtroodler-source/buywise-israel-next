import { useState } from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, FileText, Clock, CheckCircle, XCircle, AlertCircle, Edit3 } from 'lucide-react';
import { BlogReviewCard } from '@/components/admin/BlogReviewCard';
import {
  useBlogPostsForReview,
  useBlogReviewStats,
  useApproveBlogPost,
  useRequestBlogChanges,
  useRejectBlogPost,
  BlogVerificationStatus,
  AuthorType,
} from '@/hooks/useBlogReview';

export default function AdminBlogReview() {
  const [activeTab, setActiveTab] = useState<BlogVerificationStatus | 'all'>('pending_review');
  
  const { data: stats, isLoading: statsLoading } = useBlogReviewStats();
  const { data: posts, isLoading: postsLoading } = useBlogPostsForReview(
    activeTab === 'all' ? undefined : activeTab
  );
  
  const approveMutation = useApproveBlogPost();
  const requestChangesMutation = useRequestBlogChanges();
  const rejectMutation = useRejectBlogPost();

  const handleApprove = (id: string, authorType?: AuthorType, authorProfileId?: string, postTitle?: string) => {
    approveMutation.mutate({ id, authorType, authorProfileId, postTitle });
  };

  const handleRequestChanges = (id: string, feedback: string, authorType?: AuthorType, authorProfileId?: string, postTitle?: string) => {
    requestChangesMutation.mutate({ id, feedback, authorType, authorProfileId, postTitle });
  };

  const handleReject = (id: string, reason: string, authorType?: AuthorType, authorProfileId?: string, postTitle?: string) => {
    rejectMutation.mutate({ id, reason, authorType, authorProfileId, postTitle });
  };

  const isLoading = postsLoading || approveMutation.isPending || requestChangesMutation.isPending || rejectMutation.isPending;

  const statCards = [
    {
      label: 'Pending',
      value: stats?.pending_review || 0,
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      tab: 'pending_review' as BlogVerificationStatus,
    },
    {
      label: 'Changes Requested',
      value: stats?.changes_requested || 0,
      icon: Edit3,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      tab: 'changes_requested' as BlogVerificationStatus,
    },
    {
      label: 'Approved',
      value: stats?.approved || 0,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      tab: 'approved' as BlogVerificationStatus,
    },
    {
      label: 'Rejected',
      value: stats?.rejected || 0,
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      tab: 'rejected' as BlogVerificationStatus,
    },
    {
      label: 'Drafts',
      value: stats?.draft || 0,
      icon: FileText,
      color: 'text-muted-foreground',
      bgColor: 'bg-muted',
      tab: 'draft' as BlogVerificationStatus,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <FileText className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Blog Review Queue</h1>
          <p className="text-sm text-muted-foreground">
            Review and manage blog posts from agents, agencies, and developers
          </p>
        </div>
        {stats?.pending_review ? (
          <Badge variant="destructive" className="ml-auto">
            {stats.pending_review} pending
          </Badge>
        ) : null}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {statCards.map((stat) => (
          <Card
            key={stat.label}
            className={`cursor-pointer transition-all hover:shadow-md ${
              activeTab === stat.tab ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => setActiveTab(stat.tab)}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{statsLoading ? '-' : stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs & Content */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as BlogVerificationStatus | 'all')}>
        <TabsList>
          <TabsTrigger value="pending_review">Pending Review</TabsTrigger>
          <TabsTrigger value="changes_requested">Changes Requested</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
          <TabsTrigger value="draft">Drafts</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}

          {!isLoading && posts && posts.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <CheckCircle className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-lg">All caught up!</h3>
              <p className="text-sm text-muted-foreground">
                No blog posts in this category right now.
              </p>
            </div>
          )}

          {!isLoading && posts && posts.length > 0 && (
            <div className="space-y-4">
              {posts.map((post) => (
                <BlogReviewCard
                  key={post.id}
                  post={post}
                  onApprove={handleApprove}
                  onRequestChanges={handleRequestChanges}
                  onReject={handleReject}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
