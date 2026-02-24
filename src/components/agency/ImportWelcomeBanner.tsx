import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Plus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface ImportWelcomeBannerProps {
  activeListings: number;
}

const STORAGE_KEY = 'agency_import_banner_dismissed';

export function ImportWelcomeBanner({ activeListings }: ImportWelcomeBannerProps) {
  const [isDismissed, setIsDismissed] = useState(true); // default hidden to avoid flash

  useEffect(() => {
    const dismissed = localStorage.getItem(STORAGE_KEY);
    setIsDismissed(dismissed === 'true');
  }, []);

  if (isDismissed || activeListings > 0) return null;

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setIsDismissed(true);
  };

  return (
    <AnimatePresence>
      {!isDismissed && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="rounded-2xl border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent overflow-hidden">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-foreground mb-1">
                    Get started quickly
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Import your existing listings from your website in minutes — no manual data entry needed.
                  </p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <Button asChild className="rounded-xl">
                    <Link to="/agency/import">
                      <Download className="h-4 w-4 mr-2" />
                      Import from Website
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    className="rounded-xl text-muted-foreground"
                    onClick={handleDismiss}
                  >
                    <Plus className="h-4 w-4 mr-2 rotate-45" />
                    Skip
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
