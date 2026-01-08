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
    <section className="py-10 md:py-14">
      <div className="container">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6"
        >
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">
              Plan Your Move
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Free calculators built for Israel
            </p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link to="/tools" className="gap-2">
              All Tools
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </motion.div>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {tools.map((tool, index) => (
            <motion.div
              key={tool.id}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <Link
                to={tool.link}
                className="group block h-full p-4 rounded-lg bg-card border border-border shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-300"
              >
                <div className={`w-9 h-9 rounded-lg ${tool.color} flex items-center justify-center mb-3`}>
                  <tool.icon className="w-4 h-4" />
                </div>
                <h3 className="text-base font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                  {tool.title}
                </h3>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  {tool.description}
                </p>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
