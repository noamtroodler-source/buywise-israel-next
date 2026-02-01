import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Calculator, PiggyBank, Home, Compass } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useIsMobile } from '@/hooks/use-mobile';

const tools = [
  {
    id: 'readiness',
    icon: Compass,
    title: 'Readiness Check',
    description: 'Not sure where to start? Find out what to focus on.',
    link: '/tools?tool=readiness',
    color: 'bg-primary/10 text-primary',
    badge: 'Start here',
  },
  {
    id: 'mortgage',
    icon: Calculator,
    title: 'Mortgage Calculator',
    description: 'Understand monthly reality — not optimistic estimates.',
    link: '/tools?tool=mortgage',
    color: 'bg-primary/10 text-primary',
  },
  {
    id: 'totalcost',
    icon: PiggyBank,
    title: 'Total Cost Calculator',
    description: 'See the full picture before emotions get involved.',
    link: '/tools?tool=totalcost',
    color: 'bg-primary/10 text-primary',
  },
  {
    id: 'rentvsbuy',
    icon: Home,
    title: 'Rent vs Buy',
    description: 'Pressure-free comparisons for long-term thinking.',
    link: '/tools?tool=rentvsbuy',
    color: 'bg-primary/10 text-primary',
  },
];

export function ToolsSpotlight() {
  const isMobile = useIsMobile();
  
  // Show only 2 tools on mobile
  const displayTools = isMobile ? tools.slice(0, 2) : tools;

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
            <h2 className="text-2xl md:text-4xl font-bold text-foreground">
              Plan before you commit
            </h2>
            <p className="text-base text-muted-foreground mt-1">
              Tools designed to prevent costly surprises — built specifically for Israel.
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link to="/tools" className="gap-2">
              All Tools
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </motion.div>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {displayTools.map((tool, index) => (
            <motion.div
              key={tool.id}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <Link
                to={tool.link}
                className="group block h-full p-5 rounded-lg bg-card border border-border shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-11 h-11 rounded-lg ${tool.color} flex items-center justify-center`}>
                    <tool.icon className="w-5 h-5" />
                  </div>
                  {'badge' in tool && tool.badge && (
                    <Badge variant="secondary" className="text-xs bg-primary/10 text-primary">
                      {tool.badge}
                    </Badge>
                  )}
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                  {tool.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {tool.description}
                </p>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Mobile "See All" link */}
        {isMobile && (
          <div className="mt-4 text-center">
            <Button variant="ghost" size="sm" asChild className="gap-1.5 text-muted-foreground">
              <Link to="/tools">
                See all tools
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
