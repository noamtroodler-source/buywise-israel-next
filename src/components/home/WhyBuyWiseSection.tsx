import { motion } from 'framer-motion';
import { Compass, Layers, Lightbulb, Scale } from 'lucide-react';

const valueProps = [
  {
    icon: Compass,
    title: 'Discovery, Made Clear',
    description: 'BuyWise is an english-first platform built specifically for internationals buying or renting in Israel. Browse projects, resale homes, and long-term rentals through a clean, intuitive experience that makes discovery feel calm and manageable.',
  },
  {
    icon: Layers,
    title: 'Context Built Into Every Listing',
    description: 'Properties on BuyWise are never shown in isolation. Each listing includes real cost context, market insight, and plain-English explanations — so you understand what a property actually means, not just its price.',
  },
  {
    icon: Lightbulb,
    title: 'Clarity Before You Speak to Anyone',
    description: 'BuyWise helps you prepare before contacting agents, brokers, or lawyers. You understand what matters, what to ask, and where tradeoffs exist — so you engage confidently instead of guessing.',
  },
  {
    icon: Scale,
    title: 'Independent & Unbiased',
    description: "BuyWise is not a brokerage or a sales-driven portal. We don't push listings or rush decisions — we help you get clarity and move forward on your own terms.",
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