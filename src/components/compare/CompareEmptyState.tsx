import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { GitCompareArrows, ArrowRight, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function CompareEmptyState() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-lg mx-auto text-center space-y-8 px-4"
      >
        {/* Icon */}
        <div className="relative mx-auto w-28 h-28">
          <div className="absolute inset-0 bg-primary/10 rounded-full animate-pulse" />
          <div className="absolute inset-2 bg-primary/20 rounded-full" />
          <div className="absolute inset-0 flex items-center justify-center">
            <GitCompareArrows className="h-12 w-12 text-primary" />
          </div>
        </div>

        {/* Content */}
        <div className="space-y-3">
          <h1 className="text-3xl font-bold tracking-tight">
            Ready to Compare?
          </h1>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Select up to 3 properties to see them side by side. Compare prices, sizes, locations, and investment metrics all in one view.
          </p>
        </div>

        {/* How it works */}
        <div className="bg-muted/50 rounded-xl p-4 text-left space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Lightbulb className="h-4 w-4 text-primary" />
            How to compare properties
          </div>
          <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
            <li>Browse properties on the listings page</li>
            <li>Click the compare icon on any property card</li>
            <li>Add up to 3 properties to your comparison</li>
            <li>Click "Compare Now" to see them side by side</li>
          </ol>
        </div>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild size="lg">
            <Link to="/listings?status=for_sale">
              Browse Properties
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link to="/projects">
              Explore New Projects
            </Link>
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
