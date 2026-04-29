import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Plus, Wrench, Send } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface ImportWelcomeBannerProps {
  listingsCount: number;
  toReviewCount: number;
  readyToSubmitCount: number;
}

const STORAGE_KEY = 'agency_import_banner_dismissed';

export function ImportWelcomeBanner({ listingsCount, toReviewCount, readyToSubmitCount }: ImportWelcomeBannerProps) {
  const [isDismissed, setIsDismissed] = useState(true); // default hidden to avoid flash

  useEffect(() => {
    const dismissed = localStorage.getItem(STORAGE_KEY);
    setIsDismissed(dismissed === 'true');
  }, []);

  const hasNoListings = listingsCount === 0;
  const hasListingsToReview = toReviewCount > 0;
  const hasListingsReadyToSubmit = readyToSubmitCount > 0;
  const shouldShow = hasNoListings || hasListingsToReview || hasListingsReadyToSubmit;

  if (isDismissed || !shouldShow) return null;

  const banner = hasNoListings
    ? {
        title: 'Get started quickly',
        description: "Import your existing listings from your website in minutes. You'll review and complete each listing before publishing.",
        href: '/agency/import',
        action: 'Import Listings',
        Icon: Download,
      }
    : hasListingsToReview
      ? {
          title: 'Review imported listings',
          description: `We added ${toReviewCount} listing${toReviewCount === 1 ? '' : 's'} that need required details checked before BuyWise review.`,
          href: '/agency/listings?status=to_review',
          action: 'Review listings',
          Icon: Wrench,
        }
      : {
          title: 'Submit reviewed listings',
          description: `${readyToSubmitCount} listing${readyToSubmitCount === 1 ? ' is' : 's are'} ready to send to BuyWise for final review.`,
          href: '/agency/listings?status=ready_to_submit',
          action: 'Submit listings',
          Icon: Send,
        };

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
                    {banner.title}
                  </h3>
                   <p className="text-sm text-muted-foreground">
                    {banner.description}
                  </p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <Button asChild className="rounded-xl">
                    <Link to={banner.href}>
                      <banner.Icon className="h-4 w-4 mr-2" />
                      {banner.action}
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
