import { Link } from 'react-router-dom';
import { Calculator, Home, TrendingUp, Compass } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

const tools = [
  { icon: Calculator, label: 'Mortgage Calculator' },
  { icon: Home, label: 'Rent vs Buy' },
  { icon: TrendingUp, label: 'Investment Returns' },
  { icon: Compass, label: 'Neighborhood Match' },
];

export const ToolsPromo = () => {
  return (
    <section className="py-12 bg-muted/30">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col md:flex-row items-center justify-between gap-8"
        >
          <div className="text-center md:text-left">
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Plan Your Move with Our Free Tools
            </h2>
            <p className="text-muted-foreground">
              Calculators & guides to help you make smarter decisions
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            {tools.map((tool) => (
              <div
                key={tool.label}
                className="flex items-center gap-2 px-3 py-2 bg-background rounded-lg border border-border/50 text-sm text-muted-foreground"
              >
                <tool.icon className="h-4 w-4 text-primary" />
                <span>{tool.label}</span>
              </div>
            ))}
          </div>

          <Button asChild>
            <Link to="/tools">Explore All Tools</Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
};
