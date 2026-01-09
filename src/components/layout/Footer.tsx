import { Link } from 'react-router-dom';
import { Home, Mail, MapPin, MessageSquare } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                <Home className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground">BuyWise</span>
              <span className="text-xl font-bold text-primary">Israel</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Your trusted partner for finding the perfect property in Israel.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-foreground">Quick Links</h4>
            <nav className="flex flex-col gap-2">
              <Link to="/listings?status=for_sale" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Buy Property
              </Link>
              <Link to="/listings?status=for_rent" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Rent Property
              </Link>
              <Link to="/tools" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Tools & Calculators
              </Link>
              <Link to="/areas" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Explore Areas
              </Link>
              <Link to="/about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Our Principles
              </Link>
            </nav>
          </div>

          {/* Resources */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-foreground">Resources</h4>
            <nav className="flex flex-col gap-2">
              <Link to="/glossary" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Hebrew Glossary
              </Link>
              <Link to="/blog" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Blog & Articles
              </Link>
            </nav>
          </div>

          {/* Property Types */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-foreground">Property Types</h4>
            <nav className="flex flex-col gap-2">
              <Link to="/listings?type=apartment" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Apartments
              </Link>
              <Link to="/listings?type=house" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Houses
              </Link>
              <Link to="/listings?type=penthouse" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Penthouses
              </Link>
              <Link to="/listings?type=commercial" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Commercial
              </Link>
            </nav>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-foreground">Contact Us</h4>
            <div className="flex flex-col gap-3">
              <Link 
                to="/contact" 
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors w-fit"
              >
                <MessageSquare className="h-4 w-4" />
                Get in Touch
              </Link>
              <a href="mailto:hello@buywiseisrael.com" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <Mail className="h-4 w-4" />
                hello@buywiseisrael.com
              </a>
              <span className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                Tel Aviv, Israel
              </span>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-border">
          <p className="text-sm text-muted-foreground text-center">
            © {new Date().getFullYear()} BuyWise Israel. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}