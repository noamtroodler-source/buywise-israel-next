import { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, ArrowRight, CalendarClock, Sparkles, Star } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import confetti from 'canvas-confetti';

export default function CheckoutSuccess() {
  const [searchParams] = useSearchParams();
  const isAnnual = searchParams.get('cycle') === 'annual';
  const isFounding = searchParams.get('founding') === 'true';
  const trialEnd = searchParams.get('trial_end');

  useEffect(() => {
    const duration = 2000;
    const end = Date.now() + duration;
    const frame = () => {
      confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0 } });
      confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1 } });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
  }, []);

  const formattedTrialEnd = trialEnd
    ? new Date(trialEnd).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : null;

  if (isFounding) {
    return (
      <Layout>
        <div className="min-h-[70vh] flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center max-w-md mx-auto px-4"
          >
            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <Sparkles className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-3">
              Welcome, Founding Partner!
            </h1>
            <p className="text-muted-foreground mb-6">
              Your 60-day free trial is now active. You're one of our first partner agencies — thank you for believing in us early.
            </p>

            <div className="space-y-3 mb-6">
              {formattedTrialEnd && (
                <div className="flex items-start gap-2 rounded-xl bg-primary/5 border border-primary/20 px-4 py-3 text-left">
                  <CalendarClock className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <p className="text-sm text-muted-foreground">
                    Your trial runs until <span className="font-medium text-foreground">{formattedTrialEnd}</span>
                  </p>
                </div>
              )}
              <div className="flex items-start gap-2 rounded-xl bg-primary/5 border border-primary/20 px-4 py-3 text-left">
                <Star className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">3 free featured listings</span> are available now — go feature your best properties!
                </p>
              </div>
            </div>

            <Button asChild className="rounded-xl">
              <Link to="/">
                Go to Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-[70vh] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md mx-auto px-4"
        >
          <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-3">
            Subscription Active!
          </h1>
          <p className="text-muted-foreground mb-4">
            Welcome aboard! Your subscription is now active and you can start using all the features of your plan.
          </p>
          {isAnnual && (
            <div className="flex items-start gap-2 rounded-xl bg-primary/5 border border-primary/20 px-4 py-3 mb-6 text-left">
              <CalendarClock className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <p className="text-sm text-muted-foreground">
                You're on an <span className="font-medium text-foreground">annual plan</span> — your next renewal is in 12 months.
              </p>
            </div>
          )}
          <Button asChild className="rounded-xl">
            <Link to="/">
              Go to Dashboard
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </motion.div>
      </div>
    </Layout>
  );
}
