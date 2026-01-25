import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Home, MapPin, BookOpen, Calculator, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center max-w-lg px-6">
        <h1 className="mb-4 text-6xl md:text-7xl font-bold">
          <span className="text-primary">4</span>0<span className="text-primary">4</span>
        </h1>
        <p className="mb-2 text-xl text-muted-foreground">
          Oops! This page <span className="text-primary font-medium">doesn't exist</span>.
        </p>
        <p className="mb-8 text-sm text-muted-foreground">
          The page you're looking for may have been moved or no longer exists.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-10">
          <Button asChild size="lg">
            <Link to="/" className="gap-2">
              <Home className="h-4 w-4" />
              Return Home
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link to="/listings" className="gap-2">
              <Search className="h-4 w-4" />
              Browse Listings
            </Link>
          </Button>
        </div>

        <div className="pt-8 border-t border-border">
          <p className="text-sm text-muted-foreground mb-4">Or explore these helpful sections:</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link 
              to="/areas" 
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <MapPin className="h-4 w-4" />
              Explore Areas
            </Link>
            <span className="text-muted-foreground/30">•</span>
            <Link 
              to="/guides" 
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <BookOpen className="h-4 w-4" />
              Buyer's Guides
            </Link>
            <span className="text-muted-foreground/30">•</span>
            <Link 
              to="/tools" 
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <Calculator className="h-4 w-4" />
              Calculators
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
