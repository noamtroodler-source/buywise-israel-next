import { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import confetti from 'canvas-confetti';

export default function CheckoutSuccess() {
  const [searchParams] = useSearchParams();
  const isCredits = searchParams.get('type') === 'credits';

  useEffect(() => {
    // Fire confetti
    const duration = 2000;
    const end = Date.now() + duration;
    const frame = () => {
      confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0 } });
      confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1 } });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
  }, []);

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
            {isCredits ? 'Credits Purchased!' : 'Subscription Active!'}
          </h1>
          <p className="text-muted-foreground mb-8">
            {isCredits
              ? 'Your credits have been added to your account and are ready to use.'
              : 'Welcome aboard! Your subscription is now active and you can start using all the features of your plan.'}
          </p>
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
