import { motion } from 'framer-motion';
import { Search, BarChart3, MessageCircle } from 'lucide-react';

const pillars = [
  {
    icon: Search,
    title: 'Discover',
    subtitle: 'Find properties your way',
    description: 'Browse listings in English with filters built for international buyers. No Hebrew required.',
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
    <section className="py-20 md:py-28">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            A Smarter Way to Search
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {pillars.map((pillar, index) => (
            <motion.div
              key={pillar.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`relative group rounded-2xl p-8 md:p-10 bg-gradient-to-br ${pillar.gradient} border border-border/50 hover:shadow-lg transition-all duration-300`}
            >
              {/* Icon */}
              <div className={`w-14 h-14 rounded-xl ${pillar.iconBg} flex items-center justify-center mb-6`}>
                <pillar.icon className={`w-7 h-7 ${pillar.iconColor}`} />
              </div>

              {/* Content */}
              <h3 className="text-2xl font-bold text-foreground mb-2">
                {pillar.title}
              </h3>
              <p className="text-sm font-medium text-primary mb-3">
                {pillar.subtitle}
              </p>
              <p className="text-muted-foreground leading-relaxed">
                {pillar.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
