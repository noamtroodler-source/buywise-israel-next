import { Link } from "react-router-dom";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { BookOpen, Calculator, FileText } from "lucide-react";

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
            <div className="rounded-xl border bg-popover text-popover-foreground shadow-xl overflow-hidden w-[200px]">
              <div className="p-3">
                <ul className="space-y-1">
                  <li>
                    <NavigationMenuLink asChild>
                      <Link
                        to="/blog"
                        className="group flex items-start gap-3 rounded-md px-2 py-2 hover:bg-accent transition-colors"
                      >
                        <FileText className="h-4 w-4 mt-0.5 text-muted-foreground group-hover:text-accent-foreground" />
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-foreground group-hover:text-accent-foreground">
                            Blog
                          </span>
                          <span className="text-xs text-muted-foreground group-hover:text-accent-foreground/70">
                            Latest articles & insights
                          </span>
                        </div>
                      </Link>
                    </NavigationMenuLink>
                  </li>
                  <li>
                    <NavigationMenuLink asChild>
                      <Link
                        to="/guides"
                        className="group flex items-start gap-3 rounded-md px-2 py-2 hover:bg-accent transition-colors"
                      >
                        <BookOpen className="h-4 w-4 mt-0.5 text-muted-foreground group-hover:text-accent-foreground" />
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-foreground group-hover:text-accent-foreground">
                            All Guides
                          </span>
                          <span className="text-xs text-muted-foreground group-hover:text-accent-foreground/70">
                            Step-by-step buying guides
                          </span>
                        </div>
                      </Link>
                    </NavigationMenuLink>
                  </li>
                  <li>
                    <NavigationMenuLink asChild>
                      <Link
                        to="/tools"
                        className="group flex items-start gap-3 rounded-md px-2 py-2 hover:bg-accent transition-colors"
                      >
                        <Calculator className="h-4 w-4 mt-0.5 text-muted-foreground group-hover:text-accent-foreground" />
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-foreground group-hover:text-accent-foreground">
                            All Tools
                          </span>
                          <span className="text-xs text-muted-foreground group-hover:text-accent-foreground/70">
                            Calculators & checklists
                          </span>
                        </div>
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
