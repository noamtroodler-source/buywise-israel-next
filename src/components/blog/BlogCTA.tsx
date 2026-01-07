import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calculator, BookOpen, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function BlogCTA() {
  return (
    <section className="py-12 bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-2xl mx-auto text-center space-y-6"
        >
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">
            Can't find what you're looking for?
          </h2>
          <p className="text-muted-foreground">
            Our tools can help you run the numbers, and our guides cover every step of buying in Israel.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="rounded-xl gap-2">
              <Link to="/tools">
                <Calculator className="h-4 w-4" />
                Explore Tools
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-xl gap-2">
              <Link to="/guides">
                <BookOpen className="h-4 w-4" />
                Browse Guides
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
