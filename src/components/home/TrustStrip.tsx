import { motion } from 'framer-motion';
import { MapPin, Wrench, Shield, Users } from 'lucide-react';

const stats = [
  {
    icon: MapPin,
    value: '34',
    label: 'Cities Covered',
  },
  {
    icon: Wrench,
    value: '9',
    label: 'Free Tools',
  },
  {
    icon: Shield,
    value: '100%',
    label: 'Independent',
  },
  {
    icon: Users,
    value: 'Built by',
    label: 'Internationals',
  },
];

export function TrustStrip() {
  return (
    <section className="py-12 md:py-16 border-y border-border bg-muted/20">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4"
        >
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="text-center"
            >
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary mb-3">
                <stat.icon className="w-5 h-5" />
              </div>
              <div className="text-2xl md:text-3xl font-bold text-foreground">
                {stat.value}
              </div>
              <div className="text-sm text-muted-foreground">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
