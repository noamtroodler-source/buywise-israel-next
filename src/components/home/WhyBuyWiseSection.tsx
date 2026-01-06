import { motion } from 'framer-motion';
import { CheckCircle, BarChart3, Wrench, MapPin } from 'lucide-react';

const valueProps = [
  {
    icon: CheckCircle,
    title: 'Curated Listings',
    description: 'Every property is vetted for quality, value, and accuracy',
  },
  {
    icon: BarChart3,
    title: 'Real Market Data',
    description: 'Transparent pricing trends and neighborhood insights',
  },
  {
    icon: Wrench,
    title: 'Free Planning Tools',
    description: 'Calculators to help you make smarter decisions',
  },
  {
    icon: MapPin,
    title: 'Israel Expertise',
    description: 'Built specifically for the Israeli real estate market',
  },
];

export const WhyBuyWiseSection = () => {
  return (
    <section className="py-8 md:py-10 bg-muted/30">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-6 md:mb-8"
        >
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            Why BuyWise Israel?
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            We're more than listings — we're your partner in finding the right property
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
              className="group text-center p-6 rounded-xl bg-background border border-border/50 hover:border-primary/30 hover:shadow-lg transition-all duration-300"
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
