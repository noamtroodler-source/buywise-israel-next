import { Link } from 'react-router-dom';
import { Mail, MapPin, MessageSquare } from 'lucide-react';
import logoIcon from '@/assets/logo-icon-preview.png';

export function Footer() {
  return (
<footer className="border-t border-border bg-muted/30">
      <div className="container py-8 md:py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {/* Brand - Full width on mobile */}
          <div className="col-span-2 md:col-span-1 space-y-4">
            <Link to="/" className="flex items-center gap-0.5">
              <img src={logoIcon} alt="BuyWise Israel" className="h-[30px] w-[30px] md:h-[34px] md:w-[34px] object-contain" />
              <div className="flex items-baseline gap-1">
                <span className="text-lg md:text-[1.3rem] font-bold tracking-tight text-foreground">BuyWise</span>
                <span className="text-lg md:text-[1.3rem] font-extrabold tracking-tight text-primary">Israel</span>
              </div>
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
              <Link to="/professionals" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Trusted Professionals
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
            {/* Social Links */}
            <div className="flex items-center gap-3 mt-3">
              <a href="https://www.instagram.com/buywiseisrael" target="_blank" rel="noopener noreferrer" aria-label="Follow us on Instagram" className="text-muted-foreground hover:text-foreground transition-colors">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
              </a>
              <a href="https://www.facebook.com/buywiseisrael" target="_blank" rel="noopener noreferrer" aria-label="Follow us on Facebook" className="text-muted-foreground hover:text-foreground transition-colors">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              </a>
              <a href="https://www.linkedin.com/company/buywiseisrael" target="_blank" rel="noopener noreferrer" aria-label="Follow us on LinkedIn" className="text-muted-foreground hover:text-foreground transition-colors">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
              </a>
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
