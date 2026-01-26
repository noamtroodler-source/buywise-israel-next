import { Users, Home, MapPin, Calculator } from "lucide-react";
import { motion } from "framer-motion";
import { usePlatformStats } from "@/hooks/usePlatformStats";

export function PlatformStats() {
  const { data: stats, isLoading } = usePlatformStats();
  
  const totalListings = stats ? stats.forSaleCount + stats.rentalsCount : 0;
  
  const statItems = [
    {
      icon: Users,
      value: "50+",
      label: "Active Agents",
      description: "Growing network"
    },
    {
      icon: Home,
      value: isLoading ? "..." : totalListings.toLocaleString(),
      label: "Properties Listed",
      description: "Across Israel"
    },
    {
      icon: MapPin,
      value: isLoading ? "..." : (stats?.projectsCount || 0).toString(),
      label: "Active Projects",
      description: "New developments"
    },
    {
      icon: Calculator,
      value: "9",
      label: "Buyer Tools",
      description: "Calculators & guides"
    }
  ];

  return (
    <section className="py-12 border-y bg-card">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {statItems.map((item, index) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="text-center"
            >
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 mb-3">
                <item.icon className="w-6 h-6 text-primary" />
              </div>
              <p className="text-3xl md:text-4xl font-bold text-primary">{item.value}</p>
              <p className="font-medium">{item.label}</p>
              <p className="text-sm text-muted-foreground">{item.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
