import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

export function AdvertiseHero() {
  return (
    <section className="relative bg-gradient-to-br from-primary/5 via-background to-primary/10 py-20 lg:py-28">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl mx-auto text-center"
        >
          <Badge variant="secondary" className="mb-4">
            For Real Estate Professionals
          </Badge>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6">
            Partner with{" "}
            <span className="text-primary">BuyWise Israel</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Reach motivated Anglo buyers actively searching for Israeli real estate. 
            Join the platform built specifically for English-speaking buyers.
          </p>
        </motion.div>
      </div>
      
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/4 -right-1/4 w-1/2 h-1/2 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-1/4 -left-1/4 w-1/2 h-1/2 bg-primary/5 rounded-full blur-3xl" />
      </div>
    </section>
  );
}
