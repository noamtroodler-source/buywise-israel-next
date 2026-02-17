import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { XCircle, ArrowLeft } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';

export default function CheckoutCancel() {
  return (
    <Layout>
      <div className="min-h-[70vh] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md mx-auto px-4"
        >
          <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
            <XCircle className="h-10 w-10 text-muted-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-3">
            Checkout Canceled
          </h1>
          <p className="text-muted-foreground mb-8">
            No worries — your checkout was canceled and you haven't been charged. You can return to pricing anytime.
          </p>
          <Button asChild variant="outline" className="rounded-xl">
            <Link to="/pricing">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Return to Pricing
            </Link>
          </Button>
        </motion.div>
      </div>
    </Layout>
  );
}
