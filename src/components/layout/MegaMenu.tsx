import { Link } from "react-router-dom";
import { ChevronRight, Search } from "lucide-react";
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
                "rounded-xl border border-border/50 border-t-2 border-t-primary bg-popover text-popover-foreground shadow-[0_4px_24px_-4px_rgba(0,0,0,0.08),0_2px_8px_-2px_rgba(0,0,0,0.04)] overflow-hidden",
                columnCount === 2 ? "w-[480px]" : "w-[680px]"
              )}
            >
              <div className={cn(
                "grid gap-0",
                columnCount === 2 ? "grid-cols-2" : "grid-cols-3"
              )}>
                {config.columns.map((column) => (
                  <div key={column.title} className="p-6">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                      {column.title}
                    </h4>
                    <ul className="space-y-0.5">
                      {column.items.map((item) => (
                        <li key={item.href}>
                          <NavigationMenuLink asChild>
                            <Link
                              to={item.href}
                              className="group flex flex-col rounded-lg px-3 py-2.5 -mx-1 hover:bg-muted/50 transition-colors"
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
                <div className="border-t border-border bg-muted/20 px-6 py-3.5">
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
