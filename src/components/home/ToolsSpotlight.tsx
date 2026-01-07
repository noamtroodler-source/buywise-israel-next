import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Calculator, PiggyBank, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

const tools = [
  {
    id: 'mortgage-calculator',
    icon: Calculator,
    title: 'Mortgage Calculator',
    description: 'Calculate monthly payments with Israeli bank rates and track types.',
    link: '/tools/mortgage-calculator',
    color: 'bg-primary/10 text-primary',
  },
  {
    id: 'total-cost-calculator',
    icon: PiggyBank,
    title: 'Total Cost Calculator',
    description: 'See the true cost of buying — taxes, fees, and closing costs included.',
    link: '/tools/total-cost-calculator',
    color: 'bg-primary/10 text-primary',
  },
  {
    id: 'rent-vs-buy',
    icon: Home,
    title: 'Rent vs Buy',
    description: 'Compare the long-term costs of renting versus buying in Israel.',
    link: '/tools/rent-vs-buy',
    color: 'bg-primary/10 text-primary',
  },
];

export function ToolsSpotlight() {
  return (
    <section className="py-16 md:py-24">
      <div className="container">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10"
        >
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              Plan Your Move
            </h2>
            <p className="text-muted-foreground mt-2">
              Free calculators built for the Israeli market
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link to="/tools" className="gap-2">
              Explore All Tools
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </motion.div>

        {/* Tools Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {tools.map((tool, index) => (
            <motion.div
              key={tool.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
            >
              <Link
                to={tool.link}
                className="group block h-full p-6 rounded-2xl bg-card border border-border shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300"
              >
                <div className={`w-12 h-12 rounded-xl ${tool.color} flex items-center justify-center mb-5`}>
                  <tool.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                  {tool.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                  {tool.description}
                </p>
                <span className="inline-flex items-center gap-1 text-sm font-medium text-primary">
                  Try it free
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
