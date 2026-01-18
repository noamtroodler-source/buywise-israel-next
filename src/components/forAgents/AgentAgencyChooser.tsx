import { Button } from "@/components/ui/button";
import { User, Building2, ArrowRight, Check } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const options = [
  {
    type: "agent",
    icon: User,
    title: "Individual Agent",
    description: "Perfect for independent agents looking to expand their reach and connect with international buyers.",
    features: [
      "Free professional profile page",
      "Unlimited property listings",
      "Analytics dashboard",
      "Lead tracking & management",
      "WhatsApp & call integration"
    ],
    cta: "Register as Agent",
    link: "/agent/register",
    highlight: false
  },
  {
    type: "agency",
    icon: Building2,
    title: "Agency / Team",
    description: "Ideal for agencies wanting to manage multiple agents, aggregate stats, and grow their brand presence.",
    features: [
      "Everything in Individual, plus:",
      "Team management dashboard",
      "Agency branding & profile",
      "Invite codes for agents",
      "Aggregated performance stats",
      "Priority placement (coming soon)"
    ],
    cta: "Register Agency",
    link: "/agency/register",
    highlight: true
  }
];

export function AgentAgencyChooser() {
  return (
    <section className="py-24">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Choose Your Path
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Whether you're an independent agent or running an agency, we have the right solution for you.
          </p>
        </motion.div>
        
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {options.map((option, index) => (
            <motion.div
              key={option.type}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.15 }}
              className={`relative rounded-2xl p-8 border-2 transition-all duration-300 hover:shadow-xl ${
                option.highlight
                  ? "border-primary bg-gradient-to-b from-primary/5 to-background"
                  : "border-border bg-card hover:border-primary/50"
              }`}
            >
              {option.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium">
                  Most Popular
                </div>
              )}
              
              <div className="flex items-center gap-4 mb-6">
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                  option.highlight ? "bg-primary text-primary-foreground" : "bg-primary/10"
                }`}>
                  <option.icon className={`w-7 h-7 ${option.highlight ? "" : "text-primary"}`} />
                </div>
                <div>
                  <h3 className="text-2xl font-bold">{option.title}</h3>
                </div>
              </div>
              
              <p className="text-muted-foreground mb-6 leading-relaxed">
                {option.description}
              </p>
              
              <ul className="space-y-3 mb-8">
                {option.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <Button
                size="lg"
                className="w-full gap-2"
                variant={option.highlight ? "default" : "outline"}
                asChild
              >
                <Link to={option.link}>
                  {option.cta}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
