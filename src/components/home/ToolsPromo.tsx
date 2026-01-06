import { Link } from 'react-router-dom';
import { Calculator, Home, TrendingUp, Compass, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

const tools = [
  { id: 'mortgage', icon: Calculator, label: 'Mortgage Calculator' },
  { id: 'rentvsbuy', icon: Home, label: 'Rent vs Buy' },
  { id: 'investment', icon: TrendingUp, label: 'Investment Returns' },
  { id: 'neighborhood', icon: Compass, label: 'Neighborhood Match' },
];

export const ToolsPromo = () => {
  return (
    <section className="py-16 md:py-20 bg-background">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto"
        >
          <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 rounded-2xl p-8 md:p-10 border border-primary/20">
            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                Plan Your Move with Our Free Tools
              </h2>
              <p className="text-muted-foreground">
                Calculators to help you make smarter decisions
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {tools.map((tool, index) => (
                <motion.div
                  key={tool.id}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link
                    to={`/tools?tool=${tool.id}`}
                    className="flex flex-col items-center gap-3 p-4 bg-background rounded-xl border border-border/50 hover:border-primary/40 hover:shadow-md transition-all duration-300 group"
                  >
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                      <tool.icon className="h-5 w-5 text-primary group-hover:text-primary-foreground" />
                    </div>
                    <span className="text-sm font-medium text-foreground text-center">
                      {tool.label}
                    </span>
                  </Link>
                </motion.div>
              ))}
            </div>

            <div className="text-center">
              <Button asChild size="lg" className="px-8">
                <Link to="/tools" className="gap-2">
                  Explore All Tools
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
