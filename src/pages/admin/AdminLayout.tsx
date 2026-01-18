import { Link, Outlet, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, Users, Home, Building, Building2, 
  FileText, MapPin, BarChart3, Settings, ClipboardCheck 
} from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { usePendingReviewCount } from '@/hooks/useListingReview';

const adminNavItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/admin/review', label: 'Listing Review', icon: ClipboardCheck, showBadge: true },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/properties', label: 'Properties', icon: Home },
  { href: '/admin/agents', label: 'Agents', icon: Building2 },
  { href: '/admin/agencies', label: 'Agencies', icon: Building },
  { href: '/admin/projects', label: 'Projects', icon: Building },
  { href: '/admin/developers', label: 'Developers', icon: Building },
  { href: '/admin/blog', label: 'Blog Posts', icon: FileText },
  { href: '/admin/cities', label: 'Cities', icon: MapPin },
  { href: '/admin/market-data', label: 'Market Data', icon: BarChart3 },
  { href: '/admin/accuracy-audit', label: 'Accuracy Audit', icon: BarChart3 },
];

export function AdminLayout() {
  const location = useLocation();
  const { data: pendingCount } = usePendingReviewCount();

  return (
    <Layout>
      <div className="container py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-2 mb-8">
            <Settings className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar */}
            <aside className="lg:w-64 flex-shrink-0">
              <nav className="space-y-1">
                {adminNavItems.map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      to={item.href}
                      className={cn(
                        "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors",
                        isActive 
                          ? "bg-primary text-primary-foreground" 
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                      {item.label}
                      {item.showBadge && pendingCount && pendingCount > 0 && (
                        <Badge 
                          className={cn(
                            "ml-auto",
                            isActive 
                              ? "bg-primary-foreground text-primary" 
                              : "bg-yellow-100 text-yellow-800"
                          )}
                        >
                          {pendingCount}
                        </Badge>
                      )}
                    </Link>
                  );
                })}
              </nav>
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
