import { Link, Outlet, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, Users, Home, Building, Building2,
  FileText, MapPin, BarChart3, Settings, ClipboardCheck, Sliders,
  Mail, ToggleLeft, BookOpen, Megaphone, Star, Package, Globe,
  Wrench, ChevronRight, PenLine, Bug, Zap, TrendingUp, Flame, Shield,
  History, Gavel, Combine, Flag, Activity
} from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { usePendingReviewCount } from '@/hooks/useListingReview';
import { usePendingBlogCount } from '@/hooks/useBlogReview';
import { AdminNavSection, AdminNavItem } from '@/components/admin/AdminNavSection';
import { usePlatformStats } from '@/hooks/useAdminAnalytics';
import { AlertsBadge } from '@/components/admin/AdminAlertsPanel';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function AdminLayout() {
  const location = useLocation();
  const { data: pendingCount } = usePendingReviewCount();
  const { data: pendingBlogCount } = usePendingBlogCount();
  const { data: stats } = usePlatformStats();

  const { data: newEnterpriseCount = 0 } = useQuery({
    queryKey: ['enterprise-inquiries-new-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('enterprise_inquiries' as any)
        .select('*', { count: 'exact', head: true })
        .eq('status', 'new');
      if (error) throw error;
      return count ?? 0;
    },
    refetchInterval: 60_000,
  });

  // Calculate totals for section badges
  const totalReviewPending = 
    (pendingCount || 0) + 
    (stats?.pendingAgents || 0) + 
    (stats?.pendingAgencies || 0) + 
    (stats?.pendingDevelopers || 0) + 
    (stats?.pendingProjects || 0) +
    (pendingBlogCount || 0);

  const overviewItems = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
    { href: '/admin/accuracy-audit', label: 'Accuracy Audit', icon: BarChart3 },
    { href: '/admin/import-analytics', label: 'Import Health', icon: BarChart3 },
    { href: '/admin/data-governance', label: 'Data Governance', icon: Shield },
  ];

  const homepageItems = [
    { href: '/admin/featured', label: 'Featured', icon: Star },
    { href: '/admin/announcements', label: 'Announcements', icon: Megaphone },
    { href: '/admin/boosts', label: 'Boosts', icon: Zap },
  ];

  const reviewItems = [
    { href: '/admin/review', label: 'Listings', icon: ClipboardCheck, badge: pendingCount || 0 },
    { href: '/admin/agents', label: 'Agents', icon: Building2, badge: stats?.pendingAgents || 0 },
    { href: '/admin/agencies', label: 'Agencies', icon: Building, badge: stats?.pendingAgencies || 0 },
    { href: '/admin/developers', label: 'Developers', icon: Building, badge: stats?.pendingDevelopers || 0 },
    { href: '/admin/projects', label: 'Projects', icon: Building, badge: stats?.pendingProjects || 0 },
    { href: '/admin/blog-review', label: 'Blog Posts', icon: PenLine, badge: pendingBlogCount || 0 },
  ];

  const { data: pendingDuplicateCount = 0 } = useQuery({
    queryKey: ['duplicate-pairs-pending-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('duplicate_pairs')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');
      if (error) throw error;
      return count ?? 0;
    },
    refetchInterval: 60_000,
  });

  const { data: pendingClaimsCount = 0 } = useQuery({
    queryKey: ['claim-requests-pending-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('listing_claim_requests' as any)
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');
      if (error) return 0;
      return count ?? 0;
    },
    refetchInterval: 60_000,
  });

  const { data: pendingDisputesCount = 0 } = useQuery({
    queryKey: ['primary-disputes-pending-count'],
    queryFn: async () => {
      const { count, error } = await (supabase as any)
        .from('primary_disputes')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');
      if (error) return 0;
      return count ?? 0;
    },
    refetchInterval: 60_000,
  });

  const { data: pendingColistingReportsCount = 0 } = useQuery({
    queryKey: ['colisting-reports-pending-count'],
    queryFn: async () => {
      const { count, error } = await (supabase as any)
        .from('colisting_reports')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');
      if (error) return 0;
      return count ?? 0;
    },
    refetchInterval: 60_000,
  });

  const contentItems = [
    { href: '/admin/properties', label: 'Properties', icon: Home },
    { href: '/admin/agency-provisioning', label: 'Agency Provisioning', icon: Building2 },
    { href: '/admin/agency-import', label: 'Agency Import', icon: Globe },
    { href: '/admin/scraping-sources', label: 'Scraping Sources', icon: Globe, badge: pendingClaimsCount },
    { href: '/admin/duplicates', label: 'Duplicates', icon: Building, badge: pendingDuplicateCount },
    { href: '/admin/blog', label: 'Blog Posts', icon: FileText },
    { href: '/admin/glossary', label: 'Glossary', icon: BookOpen },
  ];

  const coListingItems = [
    { href: '/admin/colisting-telemetry', label: 'Telemetry', icon: Activity },
    { href: '/admin/primary-disputes', label: 'Disputes', icon: Gavel, badge: pendingDisputesCount },
    { href: '/admin/colisting-reports', label: 'Cluster Reports', icon: Flag, badge: pendingColistingReportsCount },
    { href: '/admin/primary-history', label: 'Primary History', icon: History },
    { href: '/admin/merge-reversals', label: 'Merge Reversals', icon: Combine },
  ];

  const marketItems = [
    { href: '/admin/cities', label: 'Cities', icon: MapPin },
    { href: '/admin/market-data', label: 'Market Data', icon: BarChart3 },
  ];

  const systemItems = [
    { href: '/admin/settings', label: 'Site Settings', icon: Sliders },
    { href: '/admin/feature-flags', label: 'Feature Flags', icon: ToggleLeft },
    { href: '/admin/users', label: 'Users', icon: Users },
    { href: '/admin/contact', label: 'Contact Forms', icon: Mail },
    { href: '/admin/enterprise-inquiries', label: 'Enterprise Leads', icon: Building2, badge: newEnterpriseCount },
    { href: '/admin/overages', label: 'Overage Billing', icon: TrendingUp },
    { href: '/admin/errors', label: 'Client Errors', icon: Bug },
    { href: '/admin/warm-leads', label: 'Warm Leads', icon: Flame },
  ];

  return (
    <Layout>
      <div className="container py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Settings className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
                <p className="text-sm text-muted-foreground">Manage your platform</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <AlertsBadge />
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar */}
            <aside className="lg:w-64 flex-shrink-0">
              <div className="sticky top-24">
                <ScrollArea className="h-[calc(100vh-12rem)]">
                  <nav className="space-y-1 pr-4">
                    {/* Overview Section */}
                    <AdminNavSection
                      title="Overview"
                      icon={LayoutDashboard}
                      items={overviewItems}
                      defaultOpen={true}
                    />

                    {/* Homepage Section */}
                    <AdminNavSection
                      title="Homepage"
                      icon={Globe}
                      items={homepageItems}
                    />

                    {/* Review Queue Section */}
                    <AdminNavSection
                      title="Review Queue"
                      icon={ClipboardCheck}
                      items={reviewItems}
                      totalBadge={totalReviewPending}
                    />

                    {/* Content Section */}
                    <AdminNavSection
                      title="Content"
                      icon={Package}
                      items={contentItems}
                    />

                    {/* Co-Listing Section */}
                    <AdminNavSection
                      title="Co-Listing"
                      icon={Building2}
                      items={coListingItems}
                      totalBadge={pendingDisputesCount + pendingColistingReportsCount}
                    />

                    {/* Market Data Section */}
                    <AdminNavSection
                      title="Market Data"
                      icon={MapPin}
                      items={marketItems}
                    />

                    {/* System Section */}
                    <AdminNavSection
                      title="System"
                      icon={Wrench}
                      items={systemItems}
                    />
                  </nav>
                </ScrollArea>
              </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 min-w-0">
              <Outlet />
            </main>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
}
