import { Link } from 'react-router-dom';
import { Home, Mail, MapPin, MessageSquare } from 'lucide-react';

export function Footer() {
  return (
<footer className="border-t border-border bg-muted/30">
      <div className="container py-8 md:py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {/* Brand - Full width on mobile */}
          <div className="col-span-2 md:col-span-1 space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 md:h-9 md:w-9 items-center justify-center rounded-lg bg-primary">
                <Home className="h-4 w-4 md:h-5 md:w-5 text-primary-foreground" />
              </div>
              <span className="text-lg md:text-xl font-bold text-foreground">BuyWise</span>
              <span className="text-lg md:text-xl font-bold text-primary">Israel</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Helping international buyers navigate Israeli real estate with clarity and confidence.
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
                About Us
              </Link>
            </nav>
          </div>

          {/* Resources */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-foreground">Resources</h4>
            <nav className="flex flex-col gap-2">
              <Link to="/guides" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Buyer's Guides
              </Link>
              <Link to="/glossary" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Hebrew Glossary
              </Link>
              <Link to="/blog" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Blog & Articles
              </Link>
            </nav>
            
            <h4 className="text-sm font-semibold text-foreground mt-6">For Professionals</h4>
            <nav className="flex flex-col gap-2">
              <Link to="/advertise" className="text-sm text-primary hover:text-primary/80 transition-colors font-medium">
                Advertise with Us
              </Link>
              <Link to="/for-agents" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                For Agents & Agencies
              </Link>
              <Link to="/agent/register" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Register as Agent
              </Link>
              <Link to="/developer/register" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Register as Developer
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

        <div className="mt-8 pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} BuyWise Israel. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <Link to="/privacy" className="hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
            <span className="text-border">•</span>
            <Link to="/terms" className="hover:text-foreground transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
