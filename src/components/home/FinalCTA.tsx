import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Search, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function FinalCTA() {
  return (
    <section className="py-12 md:py-16 relative overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-primary/5 to-accent/5" />
      
      {/* Decorative elements */}
      <div className="absolute top-0 left-1/4 w-48 h-48 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />

      <div className="container relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-2xl mx-auto text-center space-y-4"
        >
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground">
            Ready to start exploring?
          </h2>
          <p className="text-base md:text-lg text-muted-foreground">
            Find properties, understand costs, and move forward with confidence.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Button asChild className="gap-2">
              <Link to="/listings">
                <Search className="h-4 w-4" />
                Browse Properties
              </Link>
            </Button>
            <Button variant="outline" asChild className="gap-2">
              <Link to="/guides">
                <BookOpen className="h-4 w-4" />
                Browse Guides
              </Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
