import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown, LucideIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
}

interface AdminNavSectionProps {
  title: string;
  icon: LucideIcon;
  items: NavItem[];
  defaultOpen?: boolean;
  totalBadge?: number;
}

export function AdminNavSection({ 
  title, 
  icon: SectionIcon, 
  items, 
  defaultOpen = false,
  totalBadge 
}: AdminNavSectionProps) {
  const location = useLocation();
  const isActiveSection = items.some(item => location.pathname === item.href);
  const [isOpen, setIsOpen] = useState(defaultOpen || isActiveSection);

  // Auto-open section when navigating to an item within it
  useEffect(() => {
    if (isActiveSection && !isOpen) {
      setIsOpen(true);
    }
  }, [location.pathname, isActiveSection]);

  // Persist state to localStorage
  useEffect(() => {
    const stored = localStorage.getItem(`admin-nav-${title}`);
    if (stored !== null && !isActiveSection) {
      setIsOpen(stored === 'true');
    }
  }, [title]);

  const handleToggle = (open: boolean) => {
    setIsOpen(open);
    localStorage.setItem(`admin-nav-${title}`, String(open));
  };

  return (
    <Collapsible open={isOpen} onOpenChange={handleToggle}>
      <CollapsibleTrigger className="w-full">
        <div className={cn(
          "flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors",
          "hover:bg-muted/50",
          isActiveSection ? "text-foreground" : "text-muted-foreground"
        )}>
          <div className="flex items-center gap-2">
            <SectionIcon className="h-4 w-4" />
            <span>{title}</span>
            {totalBadge !== undefined && totalBadge > 0 && (
              <Badge 
                variant="secondary" 
                className="ml-1 h-5 px-1.5 text-[10px] bg-destructive text-destructive-foreground"
              >
                {totalBadge > 99 ? '99+' : totalBadge}
              </Badge>
            )}
          </div>
          <ChevronDown className={cn(
            "h-4 w-4 transition-transform duration-200",
            isOpen && "rotate-180"
          )} />
        </div>
      </CollapsibleTrigger>
      
      <CollapsibleContent>
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.15 }}
              className="ml-4 mt-1 space-y-0.5 border-l border-border pl-3"
            >
              {items.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={cn(
                      "flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors",
                      isActive 
                        ? "bg-primary text-primary-foreground font-medium" 
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <item.icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </div>
                    {item.badge !== undefined && item.badge > 0 && (
                      <Badge 
                        className={cn(
                          "h-5 px-1.5 text-[10px]",
                          isActive 
                            ? "bg-primary-foreground text-primary" 
                            : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-500"
                        )}
                      >
                        {item.badge > 99 ? '99+' : item.badge}
                      </Badge>
                    )}
                  </Link>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </CollapsibleContent>
    </Collapsible>
  );
}

// Single nav item (not in a section)
interface AdminNavItemProps {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
}

export function AdminNavItem({ href, label, icon: Icon, badge }: AdminNavItemProps) {
  const location = useLocation();
  const isActive = location.pathname === href;

  return (
    <Link
      to={href}
      className={cn(
        "flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
        isActive 
          ? "bg-primary text-primary-foreground" 
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      <div className="flex items-center gap-3">
        <Icon className="h-5 w-5" />
        <span>{label}</span>
      </div>
      {badge !== undefined && badge > 0 && (
        <Badge 
          className={cn(
            isActive 
              ? "bg-primary-foreground text-primary" 
              : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-500"
          )}
        >
          {badge > 99 ? '99+' : badge}
        </Badge>
      )}
    </Link>
  );
}
