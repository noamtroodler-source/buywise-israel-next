import { motion } from 'framer-motion';
import { Globe, Calculator, TrendingUp, Scale } from 'lucide-react';

const valueProps = [
  {
    icon: Globe,
    title: 'Purpose-Built for Internationals',
    description: "Every feature is designed for English speakers navigating Israel's market — from neighborhood guides to cost calculators, mortgage info, and plain-language explanations of Israeli terms.",
  },
  {
    icon: Calculator,
    title: 'True Cost Transparency',
    description: 'Every listing includes comprehensive cost calculators showing purchase tax, legal fees, agent commissions, and ongoing expenses — so you understand the true cost before you commit.',
  },
  {
    icon: TrendingUp,
    title: 'Market Context Built In',
    description: 'Each property includes neighborhood data, price trends, comparable sales, and location insights — giving you the context to evaluate properties intelligently, not emotionally.',
  },
  {
    icon: Scale,
    title: 'Independent & Unbiased',
    description: "BuyWise doesn't sell properties or push specific listings. We're a platform designed to help you understand the market and make confident decisions — on your timeline, with zero pressure.",
  },
];

export const WhyBuyWiseSection = () => {
  return (
    <section className="py-16 md:py-20 bg-background">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8 md:mb-10"
        >
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            Why BuyWise Israel?
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Built to reduce confusion, not just show you options
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {valueProps.map((prop, index) => (
            <motion.div
              key={prop.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="group text-center p-6 rounded-xl bg-muted/30 border border-border/50 hover:border-primary/30 hover:shadow-lg transition-all duration-300"
            >
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 text-primary mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                <prop.icon className="h-7 w-7" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {prop.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {prop.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};