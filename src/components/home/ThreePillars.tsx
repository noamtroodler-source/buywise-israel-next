import { motion } from 'framer-motion';
import { Search, BarChart3, MessageCircle } from 'lucide-react';

const pillars = [
  {
    icon: Search,
    title: 'Discover',
    subtitle: 'Find properties your way',
    description: 'Browse Verified listings in English with filters built for international buyers. No Hebrew required.',
    gradient: 'from-primary/10 to-primary/5',
    iconBg: 'bg-primary/10',
    iconColor: 'text-primary',
  },
  {
    icon: BarChart3,
    title: 'Understand',
    subtitle: 'See the full picture',
    description: 'Every listing includes market context, true costs, and neighborhood insights — not just photos and price.',
    gradient: 'from-muted to-muted/50',
    iconBg: 'bg-primary/10',
    iconColor: 'text-primary',
  },
  {
    icon: MessageCircle,
    title: 'Decide',
    subtitle: 'Move forward with confidence',
    description: 'Use our free tools to calculate costs, compare options, and prepare before contacting agents.',
    gradient: 'from-primary/5 to-muted/50',
    iconBg: 'bg-primary/10',
    iconColor: 'text-primary',
  },
];

export function ThreePillars() {
  return (
    <section className="py-12 md:py-16">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <h2 className="text-2xl md:text-4xl font-bold text-foreground">
            A Smarter Way to Search
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-4 lg:gap-6">
          {pillars.map((pillar, index) => (
            <motion.div
              key={pillar.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`relative group rounded-xl p-6 md:p-8 bg-gradient-to-br ${pillar.gradient} border border-border/50 hover:shadow-lg transition-all duration-300`}
            >
              {/* Icon */}
              <div className={`w-12 h-12 rounded-lg ${pillar.iconBg} flex items-center justify-center mb-4`}>
                <pillar.icon className={`w-6 h-6 ${pillar.iconColor}`} />
              </div>

              {/* Content */}
              <h3 className="text-xl md:text-2xl font-bold text-foreground mb-1">
                {pillar.title}
              </h3>
              <p className="text-base font-medium text-primary mb-2">
                {pillar.subtitle}
              </p>
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                {pillar.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
