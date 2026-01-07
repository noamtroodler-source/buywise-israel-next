import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Search, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function FinalCTA() {
  return (
    <section className="py-20 md:py-28 relative overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-primary/5 to-accent/5" />
      
      {/* Decorative elements */}
      <div className="absolute top-0 left-1/4 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />

      <div className="container relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-2xl mx-auto text-center space-y-6"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground">
            Ready to start exploring?
          </h2>
          <p className="text-lg text-muted-foreground">
            Find properties, understand costs, and move forward with confidence.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Button size="lg" asChild className="gap-2 px-8">
              <Link to="/listings">
                <Search className="h-5 w-5" />
                Browse Properties
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="gap-2 px-8">
              <Link to="/tools">
                <Wrench className="h-5 w-5" />
                Try Our Tools
              </Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
