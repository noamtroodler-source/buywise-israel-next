import { Link } from "react-router-dom";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { useContentVisits } from "@/hooks/useContentVisits";

export function MoreNav() {
  const { isVisited } = useContentVisits();
  return (
    <NavigationMenu className="!z-50">
      <NavigationMenuList className="space-x-0">
        <NavigationMenuItem className="relative after:content-[''] after:absolute after:left-0 after:right-0 after:top-full after:h-4 after:bg-transparent">
          <NavigationMenuTrigger
            className="bg-transparent px-2 py-2 h-auto text-base font-medium text-muted-foreground hover:text-foreground hover:bg-transparent focus:bg-transparent data-[state=open]:bg-transparent"
          >
            Company
          </NavigationMenuTrigger>
          <NavigationMenuContent className="md:left-auto md:right-0">
            <div className="rounded-xl border border-border/50 border-t-2 border-t-primary bg-popover text-popover-foreground shadow-[0_4px_24px_-4px_rgba(0,0,0,0.08),0_2px_8px_-2px_rgba(0,0,0,0.04)] overflow-hidden w-[220px]">
              <div className="p-4">
                <ul className="space-y-0.5">
                  <li>
                    <NavigationMenuLink asChild>
                      <Link
                        to="/about"
                        className="group flex flex-col rounded-lg px-3 py-2.5 -mx-1 hover:bg-muted/50 transition-colors"
                      >
                        <span className="text-sm font-medium text-foreground group-hover:text-accent-foreground flex items-center gap-1.5">
                          {isVisited("/about") && (
                            <span className="h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                          )}
                          About
                        </span>
                        <span className="text-xs text-muted-foreground/70 group-hover:text-accent-foreground/70">
                          Our story
                        </span>
                      </Link>
                    </NavigationMenuLink>
                  </li>
                  <li>
                    <NavigationMenuLink asChild>
                      <Link
                        to="/professionals"
                        className="group flex flex-col rounded-lg px-3 py-2.5 -mx-1 hover:bg-muted/50 transition-colors"
                      >
                        <span className="text-sm font-medium text-foreground group-hover:text-accent-foreground flex items-center gap-1.5">
                          {isVisited("/professionals") && (
                            <span className="h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                          )}
                          Professionals
                        </span>
                        <span className="text-xs text-muted-foreground/70 group-hover:text-accent-foreground/70">
                          Vetted experts
                        </span>
                      </Link>
                    </NavigationMenuLink>
                  </li>
                  <li>
                    <NavigationMenuLink asChild>
                      <Link
                        to="/agencies"
                        className="group flex flex-col rounded-lg px-3 py-2.5 -mx-1 hover:bg-muted/50 transition-colors"
                      >
                        <span className="text-sm font-medium text-foreground group-hover:text-accent-foreground flex items-center gap-1.5">
                          {isVisited("/agencies") && (
                            <span className="h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                          )}
                          Agencies
                        </span>
                        <span className="text-xs text-muted-foreground/70 group-hover:text-accent-foreground/70">
                          Browse teams
                        </span>
                      </Link>
                    </NavigationMenuLink>
                  </li>
                  <li>
                    <NavigationMenuLink asChild>
                      <Link
                        to="/contact"
                        className="group flex flex-col rounded-lg px-3 py-2.5 -mx-1 hover:bg-muted/50 transition-colors"
                      >
                        <span className="text-sm font-medium text-foreground group-hover:text-accent-foreground flex items-center gap-1.5">
                          {isVisited("/contact") && (
                            <span className="h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                          )}
                          Contact
                        </span>
                        <span className="text-xs text-muted-foreground/70 group-hover:text-accent-foreground/70">
                          Get in touch
                        </span>
                      </Link>
                    </NavigationMenuLink>
                  </li>
                </ul>
              </div>
            </div>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}
