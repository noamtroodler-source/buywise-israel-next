import { Link } from "react-router-dom";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";

export function MoreNav() {
  return (
    <NavigationMenu className="!z-50">
      <NavigationMenuList className="space-x-0">
        <NavigationMenuItem className="relative after:content-[''] after:absolute after:left-0 after:right-0 after:top-full after:h-4 after:bg-transparent">
          <NavigationMenuTrigger
            className="bg-transparent px-2 py-2 h-auto text-base font-medium text-muted-foreground hover:text-foreground hover:bg-transparent focus:bg-transparent data-[state=open]:bg-transparent"
          >
            More
          </NavigationMenuTrigger>
          <NavigationMenuContent className="md:left-auto md:right-0">
            <div className="w-40 rounded-md border bg-popover text-popover-foreground shadow-lg overflow-hidden">
              <NavigationMenuLink asChild>
                <Link
                  to="/blog"
                  className="block px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                >
                  Blog
                </Link>
              </NavigationMenuLink>
              <NavigationMenuLink asChild>
                <Link
                  to="/about"
                  className="block px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                >
                  About
                </Link>
              </NavigationMenuLink>
              <NavigationMenuLink asChild>
                <Link
                  to="/contact"
                  className="block px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                >
                  Contact
                </Link>
              </NavigationMenuLink>
            </div>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}
