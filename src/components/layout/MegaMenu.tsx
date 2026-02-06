import { Link } from "react-router-dom";
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
import type { NavSection } from "@/lib/navigationConfig";

interface MegaMenuProps {
  config: NavSection;
  className?: string;
}

export function MegaMenu({ config, className }: MegaMenuProps) {
  const { isVisited } = useContentVisits();
  const columnCount = config.columns.length;
  
  return (
    <NavigationMenu className={cn("!z-50", className)}>
      <NavigationMenuList className="space-x-0">
        <NavigationMenuItem className="relative after:content-[''] after:absolute after:left-0 after:right-0 after:top-full after:h-4 after:bg-transparent">
          <NavigationMenuTrigger
            className="bg-transparent px-2 py-2 h-auto text-base font-medium text-muted-foreground hover:text-foreground hover:bg-transparent focus:bg-transparent data-[state=open]:bg-transparent"
          >
            {config.label}
          </NavigationMenuTrigger>
          <NavigationMenuContent>
            <div 
              className={cn(
                "rounded-xl border bg-popover text-popover-foreground shadow-xl overflow-hidden",
                columnCount === 2 ? "w-[420px]" : "w-[580px]"
              )}
            >
              {/* Columns */}
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
              
              {/* CTA Footer */}
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
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}
