import { motion } from "framer-motion";
import { Target, Wrench, Globe } from "lucide-react";

const pillars = [
  {
    icon: Target,
    title: "High-Intent Buyers",
    description:
      "Connect with English-speaking buyers actively searching for Israeli property—not just browsing. Our audience is motivated and ready to act.",
    metric: "5x",
    metricLabel: "Higher conversion rate",
  },
  {
    icon: Wrench,
    title: "Powerful Tools",
    description:
      "Access professional dashboards, analytics, and lead management tools designed specifically for the Israeli market.",
    metric: "100%",
    metricLabel: "English platform",
  },
  {
    icon: Globe,
    title: "Anglo Market Focus",
    description:
      "We specialize in the Anglo market—North American, UK, South African, and Australian buyers looking for property in Israel.",
    metric: "35+",
    metricLabel: "Countries reached",
  },
];

export function AdvertiseValuePillars() {
  return (
    <section className="py-20 bg-background">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Why Professionals Choose <span className="text-foreground">BuyWise</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Built by real estate professionals, for professionals. Everything you need to grow your business in the Israeli market.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {pillars.map((pillar, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="group bg-card border border-border rounded-2xl p-8 hover:shadow-lg hover:border-primary/30 transition-all"
            >
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                <pillar.icon className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">
                {pillar.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                {pillar.description}
              </p>
              <div className="pt-4 border-t border-border">
                <p className="text-3xl font-bold text-primary">{pillar.metric}</p>
                <p className="text-sm text-muted-foreground">{pillar.metricLabel}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
