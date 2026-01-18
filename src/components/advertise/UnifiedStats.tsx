import { motion } from "framer-motion";
import { Users, MapPin, Globe, Clock } from "lucide-react";

const stats = [
  {
    icon: Users,
    value: "1,000+",
    label: "Active Buyers Monthly",
  },
  {
    icon: MapPin,
    value: "50+",
    label: "Cities Covered",
  },
  {
    icon: Globe,
    value: "100%",
    label: "English Platform",
  },
  {
    icon: Clock,
    value: "24hr",
    label: "Average Response Time",
  },
];

export function UnifiedStats() {
  return (
    <section className="py-16 bg-muted/30">
      <div className="container">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
            The Platform Built for Anglo Buyers
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Join a growing network of professionals reaching English-speaking buyers
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="text-center p-6 rounded-xl bg-background border border-border/50"
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <stat.icon className="h-6 w-6 text-primary" />
              </div>
              <div className="text-3xl font-bold text-foreground mb-1">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
