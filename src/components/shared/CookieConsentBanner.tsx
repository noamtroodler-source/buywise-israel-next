import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Cookie, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

const CONSENT_KEY = 'cookie_consent';

type ConsentValue = 'accepted' | 'declined' | null;

export function CookieConsentBanner() {
  const [consent, setConsent] = useState<ConsentValue>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check localStorage for existing consent
    const storedConsent = localStorage.getItem(CONSENT_KEY) as ConsentValue;
    if (storedConsent) {
      setConsent(storedConsent);
    } else {
      // Show banner after a short delay for better UX
      const timer = setTimeout(() => setIsVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(CONSENT_KEY, 'accepted');
    setConsent('accepted');
    setIsVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem(CONSENT_KEY, 'declined');
    setConsent('declined');
    setIsVisible(false);
  };

  // Don't render if consent already given
  if (consent) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6 pointer-events-none md:bottom-4 md:left-4 md:right-auto md:max-w-md"
        >
          <div className="pointer-events-auto bg-card border border-border rounded-xl shadow-lg p-5 md:p-6">
            <div className="flex items-start gap-4">
              <div className="hidden md:flex w-10 h-10 rounded-lg bg-primary/10 items-center justify-center shrink-0">
                <Cookie className="h-5 w-5 text-primary" />
              </div>
              
              <div className="flex-1 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-foreground">
                    🍪 We use cookies
                  </h3>
                  <button
                    onClick={handleDecline}
                    className="md:hidden text-muted-foreground hover:text-foreground p-1 -m-1"
                    aria-label="Dismiss"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                
                <p className="text-sm text-muted-foreground leading-relaxed">
                  We use cookies to save your preferences, remember your favorites, and understand 
                  how you use our site. By continuing, you agree to our use of cookies.
                </p>
                
                <p className="text-xs text-muted-foreground">
                  Learn more in our{' '}
                  <Link to="/privacy#cookies" className="text-primary hover:underline">
                    Privacy Policy
                  </Link>
                </p>
                
                <div className="flex flex-col sm:flex-row gap-2 pt-1">
                  <Button 
                    onClick={handleAccept}
                    size="sm"
                    className="flex-1"
                  >
                    Accept
                  </Button>
                  <Button 
                    onClick={handleDecline}
                    variant="outline"
                    size="sm"
                    className="flex-1"
                  >
                    Decline
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
