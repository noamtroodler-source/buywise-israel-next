import { Link } from "react-router-dom";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";

export function LearnNav() {
  return (
    <NavigationMenu className="!z-50">
      <NavigationMenuList className="space-x-0">
        <NavigationMenuItem className="relative after:content-[''] after:absolute after:left-0 after:right-0 after:top-full after:h-4 after:bg-transparent">
          <NavigationMenuTrigger
            className="bg-transparent px-2 py-2 h-auto text-base font-medium text-muted-foreground hover:text-foreground hover:bg-transparent focus:bg-transparent data-[state=open]:bg-transparent"
          >
            Learn
          </NavigationMenuTrigger>
          <NavigationMenuContent className="md:left-auto md:right-0">
            <div className="rounded-xl border bg-popover text-popover-foreground shadow-xl overflow-hidden w-[180px]">
              <div className="p-3">
                <ul className="space-y-1">
                  <li>
                    <NavigationMenuLink asChild>
                      <Link
                        to="/blog"
                        className="group flex flex-col rounded-md px-2 py-1.5 hover:bg-accent transition-colors"
                      >
                        <span className="text-sm font-medium text-foreground group-hover:text-accent-foreground">
                          Blog
                        </span>
                        <span className="text-xs text-muted-foreground group-hover:text-accent-foreground/70">
                          Latest articles & insights
                        </span>
                      </Link>
                    </NavigationMenuLink>
                  </li>
                  <li>
                    <NavigationMenuLink asChild>
                      <Link
                        to="/guides"
                        className="group flex flex-col rounded-md px-2 py-1.5 hover:bg-accent transition-colors"
                      >
                        <span className="text-sm font-medium text-foreground group-hover:text-accent-foreground">
                          All Guides
                        </span>
                        <span className="text-xs text-muted-foreground group-hover:text-accent-foreground/70">
                          Step-by-step buying guides
                        </span>
                      </Link>
                    </NavigationMenuLink>
                  </li>
                  <li>
                    <NavigationMenuLink asChild>
                      <Link
                        to="/tools"
                        className="group flex flex-col rounded-md px-2 py-1.5 hover:bg-accent transition-colors"
                      >
                        <span className="text-sm font-medium text-foreground group-hover:text-accent-foreground">
                          All Tools
                        </span>
                        <span className="text-xs text-muted-foreground group-hover:text-accent-foreground/70">
                          Calculators & checklists
                        </span>
                      </Link>
                    </NavigationMenuLink>
                  </li>
                  <li>
                    <NavigationMenuLink asChild>
                      <Link
                        to="/glossary"
                        className="group flex flex-col rounded-md px-2 py-1.5 hover:bg-accent transition-colors"
                      >
                        <span className="text-sm font-medium text-foreground group-hover:text-accent-foreground">
                          Hebrew Glossary
                        </span>
                        <span className="text-xs text-muted-foreground group-hover:text-accent-foreground/70">
                          Key terms explained
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
