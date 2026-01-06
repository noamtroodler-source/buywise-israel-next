import { motion } from 'framer-motion';

export const StatementPanel = () => {
  return (
    <section className="py-16 md:py-20 bg-background">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl mx-auto"
        >
          <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 rounded-2xl p-8 md:p-10 border border-primary/20 text-center">
            <p className="text-xl md:text-2xl text-foreground font-medium leading-relaxed">
              "We'd rather help you understand the market deeply than push you toward a quick decision."
            </p>
            <p className="mt-4 text-muted-foreground">
              Every tool, calculator, and guide is built to reduce confusion — not create pressure.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
