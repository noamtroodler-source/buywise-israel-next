import { motion } from "framer-motion";
import { Users, Home, MapPin, Calculator } from "lucide-react";

const stats = [
  {
    icon: Users,
    value: "50+",
    label: "Active Agents",
  },
  {
    icon: Home,
    value: "100",
    label: "Properties Listed",
  },
  {
    icon: MapPin,
    value: "25",
    label: "Cities Covered",
  },
  {
    icon: Calculator,
    value: "7",
    label: "Buyer Tools",
  },
];

export function AdvertisePlatformStats() {
  return (
    <section className="border-y border-border bg-card py-10">
      <div className="container">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="text-center"
            >
              <stat.icon className="h-6 w-6 text-primary mx-auto mb-3" />
              <p className="text-3xl font-bold text-primary">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
