import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, Home, Building2, Building, FileText, MapPin, 
  TrendingUp, Eye, BarChart3, ArrowRight, Star, RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TodaysPriorities } from '@/components/admin/TodaysPriorities';
import { AdminStatsCard } from '@/components/admin/AdminStatsCard';
import { ViewsTrendChart } from '@/components/admin/ViewsTrendChart';
import { InquiryBreakdownChart } from '@/components/admin/InquiryBreakdownChart';
import { ActivityFeed } from '@/components/admin/ActivityFeed';
import { LiveIndicator } from '@/components/admin/LiveIndicator';
import { usePlatformStats, useViewsTrend, useInquiryBreakdown } from '@/hooks/useAdminAnalytics';
import { useRecentActivity } from '@/hooks/useRecentActivity';

export default function AdminDashboard() {
  const { data: stats, isLoading: statsLoading, dataUpdatedAt } = usePlatformStats();
  const { data: viewsTrend, isLoading: viewsLoading } = useViewsTrend(30);
  const { data: inquiryBreakdown, isLoading: inquiryLoading } = useInquiryBreakdown(30);
  const { data: recentActivity, isLoading: activityLoading } = useRecentActivity(15);

  const statCards = [
    { 
      label: 'Total Users', 
      value: stats?.totalUsers || 0, 
      icon: Users, 
      href: '/admin/users',
      subtitle: `+${stats?.newUsersThisWeek || 0} this week`
    },
    { 
      label: 'Properties', 
      value: stats?.totalProperties || 0, 
      icon: Home, 
      href: '/admin/properties',
      subtitle: `${stats?.pendingListings || 0} pending review`
    },
    { 
      label: 'Views (7d)', 
      value: stats?.totalViews7d || 0, 
      icon: Eye, 
      href: '/admin/analytics'
    },
    { 
      label: 'Inquiries (7d)', 
      value: stats?.totalInquiries7d || 0, 
      icon: TrendingUp, 
      href: '/admin/analytics'
    },
    { 
      label: 'Agents', 
      value: stats?.totalAgents || 0, 
      icon: Building2, 
      href: '/admin/agents',
      subtitle: `${stats?.pendingAgents || 0} pending`
    },
    { 
      label: 'Agencies', 
      value: stats?.totalAgencies || 0, 
      icon: Building, 
      href: '/admin/agencies',
      subtitle: `${stats?.pendingAgencies || 0} pending`
    },
    { 
      label: 'Projects', 
      value: stats?.totalProjects || 0, 
      icon: Building, 
      href: '/admin/projects',
      subtitle: `${stats?.pendingProjects || 0} pending`
    },
    { 
      label: 'Developers', 
      value: stats?.totalDevelopers || 0, 
      icon: Building, 
      href: '/admin/developers',
      subtitle: `${stats?.pendingDevelopers || 0} pending`
    },
  ];

  const quickActions = [
    { label: 'Manage Featured', icon: Star, href: '/admin/featured' },
    { label: 'Manage Properties', icon: Home, href: '/admin/properties' },
    { label: 'Review Listings', icon: Eye, href: '/admin/review' },
    { label: 'View Analytics', icon: BarChart3, href: '/admin/analytics' },
    { label: 'Manage Agents', icon: Building2, href: '/admin/agents' },
    { label: 'Update Market Data', icon: TrendingUp, href: '/admin/market-data' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Overview</h2>
          <p className="text-muted-foreground">Platform performance at a glance</p>
        </div>
        <div className="flex items-center gap-4">
          <LiveIndicator 
            lastUpdated={dataUpdatedAt ? new Date(dataUpdatedAt) : undefined}
            queryKeys={[
              ['platform-stats'],
              ['admin-recent-activity'],
              ['views-trend'],
              ['inquiry-breakdown'],
            ]}
          />
          <Button asChild variant="outline">
            <Link to="/admin/analytics" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Full Analytics
            </Link>
          </Button>
        </div>
      </div>

      {/* Today's Priorities - NEW */}
      <TodaysPriorities
        pendingAgents={stats?.pendingAgents || 0}
        pendingListings={stats?.pendingListings || 0}
        pendingProjects={stats?.pendingProjects || 0}
        pendingAgencies={stats?.pendingAgencies || 0}
        pendingDevelopers={stats?.pendingDevelopers || 0}
      />

      {/* Stats Grid */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <AdminStatsCard
            key={stat.label}
            title={stat.label}
            value={stat.value}
            icon={stat.icon}
            href={stat.href}
            subtitle={stat.subtitle}
          />
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ViewsTrendChart data={viewsTrend || []} isLoading={viewsLoading} />
        <InquiryBreakdownChart data={inquiryBreakdown || []} isLoading={inquiryLoading} />
      </div>

      {/* Activity & Quick Actions */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ActivityFeed activities={recentActivity || []} isLoading={activityLoading} />
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {quickActions.map((action) => (
                <Link
                  key={action.label}
                  to={action.href}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors group"
                >
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <action.icon className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-sm font-medium">{action.label}</span>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Status */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">System Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/10">
              <span className="text-sm text-muted-foreground">Database</span>
              <span className="text-sm font-medium text-primary">Connected</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/10">
              <span className="text-sm text-muted-foreground">Storage</span>
              <span className="text-sm font-medium text-primary">Active</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/10">
              <span className="text-sm text-muted-foreground">Authentication</span>
              <span className="text-sm font-medium text-primary">Enabled</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
