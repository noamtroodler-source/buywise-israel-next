import { Target, BarChart3, Globe } from "lucide-react";
import { motion } from "framer-motion";

const pillars = [
  {
    icon: Target,
    title: "High-Intent Leads",
    description: "Reach buyers who are 5x more likely to transact. Our platform attracts serious international investors actively searching for Israeli property.",
    stat: "5x",
    statLabel: "Higher conversion rate"
  },
  {
    icon: BarChart3,
    title: "Powerful Tools",
    description: "Get comprehensive analytics, streamlined listing management, and team dashboards. Everything you need to grow your business in one place.",
    stat: "100%",
    statLabel: "Free to use"
  },
  {
    icon: Globe,
    title: "Anglo Market Focus",
    description: "The only platform specifically built for English-speaking buyers. Tap into the underserved market of olim and international investors.",
    stat: "35+",
    statLabel: "Cities covered"
  }
];

export function ValuePillars() {
  return (
    <section className="py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Why Agents Choose <span className="text-primary">BuyWise</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Built by agents, for agents. We understand what you need to succeed.
          </p>
        </motion.div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {pillars.map((pillar, index) => (
            <motion.div
              key={pillar.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.15 }}
              className="group"
            >
              <div className="bg-card rounded-2xl p-8 border h-full hover:shadow-lg hover:border-primary/30 transition-all duration-300">
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                  <pillar.icon className="w-7 h-7 text-primary" />
                </div>
                
                <h3 className="text-xl font-semibold mb-3">{pillar.title}</h3>
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  {pillar.description}
                </p>
                
                <div className="pt-4 border-t">
                  <p className="text-3xl font-bold text-primary">{pillar.stat}</p>
                  <p className="text-sm text-muted-foreground">{pillar.statLabel}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
