import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertCircle, UserPlus, Home, Building, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ActionItemsStripProps {
  pendingAgents: number;
  pendingListings: number;
  pendingProjects: number;
  newUsersToday: number;
}

export function ActionItemsStrip({
  pendingAgents,
  pendingListings,
  pendingProjects,
  newUsersToday,
}: ActionItemsStripProps) {
  const items = [
    {
      label: 'Pending Agents',
      count: pendingAgents,
      href: '/admin/agents',
      icon: UserPlus,
    },
    {
      label: 'Listings to Review',
      count: pendingListings,
      href: '/admin/review',
      icon: Home,
    },
    {
      label: 'Projects Pending',
      count: pendingProjects,
      href: '/admin/projects',
      icon: Building,
    },
    {
      label: 'New Users Today',
      count: newUsersToday,
      href: '/admin/users',
      icon: UserPlus,
    },
  ];

  const hasActionItems = items.some((item) => item.count > 0);

  if (!hasActionItems) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-6"
    >
      <div className="flex items-center gap-2 mb-3">
        <AlertCircle className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium text-foreground">Action Required</span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {items.map((item) => (
          <Link
            key={item.label}
            to={item.href}
            className={cn(
              "flex items-center justify-between p-3 rounded-lg transition-colors",
              item.count > 0
                ? "bg-background hover:bg-muted border border-border"
                : "bg-muted/30 text-muted-foreground"
            )}
          >
            <div className="flex items-center gap-2">
              <item.icon className="h-4 w-4" />
              <div>
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className="text-lg font-bold">{item.count}</p>
              </div>
            </div>
            {item.count > 0 && (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </Link>
        ))}
      </div>
    </motion.div>
  );
}
