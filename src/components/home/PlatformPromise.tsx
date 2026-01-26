import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export function PlatformPromise() {
  return (
    <section className="relative py-10 md:py-12 overflow-hidden">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-primary/3 to-transparent" />
      
      <div className="container relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl mx-auto text-center space-y-4"
        >
          {/* Quote mark decoration */}
          <div className="text-5xl text-primary/20 font-serif leading-none">"</div>
          
          <p className="text-xl md:text-2xl lg:text-3xl font-medium text-foreground leading-relaxed -mt-6">
            Buying or renting in <span className="text-primary">Israel</span> no longer has to feel 
            overwhelming. We bring clarity and confidence — without pressure.
          </p>
          
          <Link 
            to="/about" 
            className="inline-flex items-center gap-2 text-base text-primary hover:text-primary-hover transition-colors font-medium group"
          >
            How BuyWise Israel works
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
