import { Link, useLocation } from "react-router-dom";
import { ChevronRight, Check } from "lucide-react";
import { useContentVisits } from "@/hooks/useContentVisits";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";
import { NAV_CONFIG, type NavSection } from "@/lib/navigationConfig";

// Route patterns that map to each nav item
const ROUTE_MAP: Record<string, string[]> = {
  Buy: ['/listings'],
  Projects: ['/projects', '/developers'],
  Rent: ['/listings'],
  Learn: ['/blog', '/guides', '/tools', '/glossary'],
  Company: ['/about', '/professionals', '/contact'],
};

function isActiveNav(label: string, pathname: string, search: string): boolean {
  const routes = ROUTE_MAP[label] || [];

  // Special handling for Buy vs Rent — both use /listings
  if (label === 'Buy') {
    return pathname === '/listings' && (search.includes('for_sale') || !search.includes('for_rent'));
  }
  if (label === 'Rent') {
    return pathname === '/listings' && search.includes('for_rent');
  }

  return routes.some(r => pathname.startsWith(r));
}

function MegaMenuContent({ config }: { config: NavSection }) {
  const { isVisited } = useContentVisits();
  const columnCount = config.columns.length;

  return (
    <div
      className={cn(
        "rounded-xl border bg-popover text-popover-foreground shadow-xl overflow-hidden",
        columnCount === 2 ? "w-[420px]" : "w-[580px]"
      )}
    >
      <div className={cn(
        "grid gap-0 divide-x divide-border",
        columnCount === 2 ? "grid-cols-2" : "grid-cols-3"
      )}>
        {config.columns.map((column) => (
          <div key={column.title} className="p-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              {column.title}
            </h4>
            <ul className="space-y-1">
              {column.items.map((item) => (
                <li key={item.href}>
                  <NavigationMenuLink asChild>
                    <Link
                      to={item.href}
                      className="group flex flex-col rounded-md px-2 py-1.5 hover:bg-accent transition-colors"
                    >
                      <span className="text-sm font-medium text-foreground group-hover:text-accent-foreground flex items-center gap-1.5">
                        {isVisited(item.href) && (
                          <Check className="h-3 w-3 text-primary flex-shrink-0" />
                        )}
                        {item.label}
                      </span>
                      {item.description && (
                        <span className="text-xs text-muted-foreground group-hover:text-accent-foreground/70">
                          {item.description}
                        </span>
                      )}
                    </Link>
                  </NavigationMenuLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {config.cta && (
        <div className="border-t border-border bg-muted/30 px-4 py-3">
          <NavigationMenuLink asChild>
            <Link
              to={config.cta.href}
              className="group flex items-center justify-between text-sm font-medium text-primary hover:text-primary/80 transition-colors"
            >
              {config.cta.label}
              <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </NavigationMenuLink>
        </div>
      )}
    </div>
  );
}

function SimpleMenuContent({ items }: { items: { label: string; href: string; description: string }[] }) {
  const { isVisited } = useContentVisits();

  return (
    <div className="rounded-xl border bg-popover text-popover-foreground shadow-xl overflow-hidden w-[180px]">
      <div className="p-3">
        <ul className="space-y-1">
          {items.map((item) => (
            <li key={item.href}>
              <NavigationMenuLink asChild>
                <Link
                  to={item.href}
                  className="group flex flex-col rounded-md px-2 py-1.5 hover:bg-accent transition-colors"
                >
                  <span className="text-sm font-medium text-foreground group-hover:text-accent-foreground flex items-center gap-1.5">
                    {isVisited(item.href) && (
                      <Check className="h-3 w-3 text-primary flex-shrink-0" />
                    )}
                    {item.label}
                  </span>
                  <span className="text-xs text-muted-foreground group-hover:text-accent-foreground/70">
                    {item.description}
                  </span>
                </Link>
              </NavigationMenuLink>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

const LEARN_ITEMS = [
  { label: 'Blog', href: '/blog', description: 'Latest articles & insights' },
  { label: 'All Guides', href: '/guides', description: 'Step-by-step buying guides' },
  { label: 'All Tools', href: '/tools', description: 'Calculators & checklists' },
  { label: 'Hebrew Glossary', href: '/glossary', description: 'Key terms explained' },
];

const COMPANY_ITEMS = [
  { label: 'About', href: '/about', description: 'Our story' },
  { label: 'Professionals', href: '/professionals', description: 'Vetted experts' },
  { label: 'Contact', href: '/contact', description: 'Get in touch' },
];

const triggerBase = "bg-transparent px-2 py-2 h-auto text-base font-medium hover:bg-transparent focus:bg-transparent data-[state=open]:bg-transparent";

export function UnifiedNav() {
  const location = useLocation();
  const { pathname, search } = location;

  const navItems: { label: string; content: React.ReactNode; alignRight?: boolean }[] = [
    { label: 'Buy', content: <MegaMenuContent config={NAV_CONFIG.buy} /> },
    { label: 'Projects', content: <MegaMenuContent config={NAV_CONFIG.projects} /> },
    { label: 'Rent', content: <MegaMenuContent config={NAV_CONFIG.rent} /> },
    { label: 'Learn', content: <SimpleMenuContent items={LEARN_ITEMS} />, alignRight: true },
    { label: 'Company', content: <SimpleMenuContent items={COMPANY_ITEMS} />, alignRight: true },
  ];

  return (
    <NavigationMenu className="!z-50">
      <NavigationMenuList className="space-x-1">
        {navItems.map((item) => {
          const active = isActiveNav(item.label, pathname, search);
          return (
            <NavigationMenuItem
              key={item.label}
              className="relative after:content-[''] after:absolute after:left-0 after:right-0 after:top-full after:h-4 after:bg-transparent"
            >
              <NavigationMenuTrigger
                className={cn(
                  triggerBase,
                  active
                    ? "text-foreground after:absolute after:bottom-0 after:left-2 after:right-2 after:h-0.5 after:bg-primary after:rounded-full"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {item.label}
              </NavigationMenuTrigger>
              <NavigationMenuContent className={item.alignRight ? "md:left-auto md:right-0" : ""}>
                {item.content}
              </NavigationMenuContent>
            </NavigationMenuItem>
          );
        })}
      </NavigationMenuList>
    </NavigationMenu>
  );
}
