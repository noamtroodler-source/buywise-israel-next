import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Eye, Clock, Bookmark, Share2, ChevronRight, Loader2, Calculator } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useBlogPost, useRelatedPosts } from '@/hooks/useBlog';
import { useSavedArticles } from '@/hooks/useSavedArticles';
import { BlogCard } from '@/components/blog/BlogCard';
import { toast } from 'sonner';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

// Extract headings from HTML content for table of contents
function extractHeadings(html: string): { id: string; text: string; level: number }[] {
  const headingRegex = /<h([2-3])[^>]*>([^<]+)<\/h[2-3]>/gi;
  const headings: { id: string; text: string; level: number }[] = [];
  let match;
  
  while ((match = headingRegex.exec(html)) !== null) {
    const level = parseInt(match[1]);
    const text = match[2].trim();
    const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    headings.push({ id, text, level });
  }
  
  return headings;
}

// Add IDs to headings in content for anchor links
function addHeadingIds(html: string): string {
  return html.replace(/<h([2-3])([^>]*)>([^<]+)<\/h[2-3]>/gi, (match, level, attrs, text) => {
    const id = text.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
    return `<h${level}${attrs} id="${id}">${text}</h${level}>`;
  });
}

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const { data: post, isLoading, error } = useBlogPost(slug || '');
  const { data: relatedPosts = [] } = useRelatedPosts(post?.category_id ?? undefined, post?.id);
  const { isArticleSaved, toggleSave } = useSavedArticles();

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard');
    } catch {
      toast.error('Failed to copy link');
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (error || !post) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Article not found</h1>
          <p className="text-muted-foreground mb-6">
            The article you're looking for doesn't exist or has been removed.
          </p>
          <Button asChild>
            <Link to="/blog">Back to Blog</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  const headings = extractHeadings(post.content);
  const contentWithIds = addHeadingIds(post.content);
  const isSaved = isArticleSaved(post.id);

  return (
    <Layout>
      <article>
        {/* Hero Section with Gradient Background */}
        <div className="bg-gradient-to-b from-primary/5 to-background">
          <div className="container py-8 max-w-5xl">
            {/* Breadcrumb */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                      <Link to="/blog">Blog</Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  {post.category && (
                    <>
                      <BreadcrumbSeparator>
                        <ChevronRight className="h-4 w-4" />
                      </BreadcrumbSeparator>
                      <BreadcrumbItem>
                        <BreadcrumbLink asChild>
                          <Link to={`/blog?category=${post.category.slug}`}>
                            {post.category.name}
                          </Link>
                        </BreadcrumbLink>
                      </BreadcrumbItem>
                    </>
                  )}
                  <BreadcrumbSeparator>
                    <ChevronRight className="h-4 w-4" />
                  </BreadcrumbSeparator>
                  <BreadcrumbItem>
                    <BreadcrumbPage className="line-clamp-1 max-w-[200px]">
                      {post.title}
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </motion.div>

            {/* Header */}
            <motion.header
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-4"
            >
              {/* Category + Actions Row */}
              <div className="flex items-center justify-between gap-4">
                {post.category && (
                  <Badge variant="secondary" className="text-sm">
                    {post.category.name}
                  </Badge>
                )}
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleSave(post.id)}
                    className={isSaved ? 'text-primary border-primary' : ''}
                  >
                    <Bookmark className={`h-4 w-4 mr-2 ${isSaved ? 'fill-primary' : ''}`} />
                    {isSaved ? 'Saved' : 'Save'}
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleShare}>
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                </div>
              </div>

              {/* Title */}
              <h1 className="text-3xl md:text-4xl font-bold text-foreground leading-tight">
                {post.title}
              </h1>

              {/* Excerpt */}
              {post.excerpt && (
                <p className="text-lg text-muted-foreground">
                  {post.excerpt}
                </p>
              )}

              {/* Meta Row */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground pt-2">
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  {post.published_at
                    ? new Date(post.published_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    : new Date(post.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                </div>
                {post.reading_time_minutes && (
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4" />
                    {post.reading_time_minutes} min read
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <Eye className="h-4 w-4" />
                  {post.views_count || 0} views
                </div>
              </div>
            </motion.header>
          </div>
        </div>

        {/* Cover Image */}
        {post.cover_image && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="container max-w-5xl -mt-2"
          >
            <div className="aspect-[2/1] overflow-hidden rounded-2xl">
              <img
                src={post.cover_image}
                alt={post.title}
                className="w-full h-full object-cover"
              />
            </div>
          </motion.div>
        )}

        {/* Two-Column Layout */}
        <div className="container max-w-5xl py-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Main Content */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="lg:col-span-2"
            >
              <div 
                className="prose prose-lg max-w-none 
                  prose-headings:font-semibold prose-headings:text-foreground 
                  prose-p:text-muted-foreground prose-p:leading-relaxed
                  prose-li:text-muted-foreground
                  prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                  prose-strong:text-foreground
                  prose-blockquote:border-l-primary prose-blockquote:text-muted-foreground
                  prose-img:rounded-xl"
                dangerouslySetInnerHTML={{ __html: contentWithIds }}
              />
            </motion.div>

            {/* Sidebar */}
            <motion.aside
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-6"
            >
              <div className="lg:sticky lg:top-24 space-y-6">
                {/* Table of Contents */}
                {headings.length > 0 && (
                  <Card className="p-5">
                    <h3 className="font-semibold text-foreground mb-4">In This Article</h3>
                    <nav className="space-y-2">
                      {headings.map((heading) => (
                        <a
                          key={heading.id}
                          href={`#${heading.id}`}
                          className={`block text-sm text-muted-foreground hover:text-primary transition-colors ${
                            heading.level === 3 ? 'pl-4' : ''
                          }`}
                        >
                          {heading.text}
                        </a>
                      ))}
                    </nav>
                  </Card>
                )}

                {/* Calculator CTA */}
                <Card className="p-5 bg-primary/5 border-primary/10">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Calculator className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="font-semibold text-foreground">Run the Numbers</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Use our calculators to understand the true costs of buying in Israel.
                  </p>
                  <Button asChild variant="outline" size="sm" className="w-full">
                    <Link to="/tools">
                      Explore Tools
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Link>
                  </Button>
                </Card>
              </div>
            </motion.aside>
          </div>
        </div>

        {/* Related Articles */}
        {relatedPosts.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="border-t border-border bg-muted/30"
          >
            <div className="container max-w-5xl py-12">
              <h2 className="text-2xl font-bold text-foreground mb-8">Continue Reading</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {relatedPosts.map((relatedPost, index) => (
                  <BlogCard
                    key={relatedPost.id}
                    post={relatedPost}
                    index={index}
                    isSaved={isArticleSaved(relatedPost.id)}
                    onToggleSave={toggleSave}
                  />
                ))}
              </div>
            </div>
          </motion.section>
        )}

        {/* Back to Blog CTA */}
        <div className="container max-w-5xl py-8">
          <Button asChild variant="outline">
            <Link to="/blog">
              ← Back to All Articles
            </Link>
          </Button>
        </div>
      </article>
    </Layout>
  );
}
