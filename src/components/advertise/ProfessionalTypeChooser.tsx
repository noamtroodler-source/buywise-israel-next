import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { User, Building2, Landmark, Check, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const professionalTypes = [
  {
    icon: User,
    title: "Individual Agent",
    description: "Independent agents looking to list properties and connect with international buyers.",
    features: [
      "Personal agent profile page",
      "Unlimited property listings",
      "Direct buyer inquiries",
      "Performance analytics",
      "Verified agent badge",
    ],
    href: "/auth?tab=signup&role=agent",
    buttonText: "Register as Agent",
    popular: false,
  },
  {
    icon: Building2,
    title: "Agency / Team",
    description: "Real estate firms managing multiple agents with unified brand presence.",
    features: [
      "Branded agency profile",
      "Team member management",
      "Agent invite system",
      "Consolidated analytics",
      "Priority support",
      "Homepage exposure opportunities",
    ],
    href: "/auth?tab=signup&role=agency",
    buttonText: "Register Agency",
    popular: false,
  },
  {
    icon: Landmark,
    title: "Property Developer",
    description: "Construction companies and developers showcasing new development projects.",
    features: [
      "Project showcase pages",
      "Unit inventory management",
      "Construction progress updates",
      "Project inquiry tracking",
      "Developer verification",
    ],
    href: "/auth?tab=signup&role=developer",
    buttonText: "Register as Developer",
    popular: false,
  },
];

export function ProfessionalTypeChooser() {
  return (
    <section id="choose-path" className="py-20 bg-background scroll-mt-20">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Choose Your Path
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Whether you're an individual agent, running an agency, or a property developer—we have the right solution for you.
          </p>
          <p className="text-sm text-muted-foreground/80 mt-3">
            Free during our founding period
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {professionalTypes.map((type, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className={`relative bg-card border rounded-2xl p-8 ${
                type.popular
                  ? "border-primary shadow-lg scale-[1.02]"
                  : "border-border hover:border-primary/30"
              } transition-all`}
            >
              {type.popular && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                  Most Popular
                </Badge>
              )}

              <div className="flex items-center gap-3 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <type.icon className="h-7 w-7 text-primary" />
                </div>
                <Badge variant="secondary" className="text-xs">Free</Badge>
              </div>

              <h3 className="text-xl font-semibold text-foreground mb-2">
                {type.title}
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
                {type.description}
              </p>

              <ul className="space-y-3 mb-8">
                {type.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <span className="text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                asChild
                className="w-full"
                variant={type.popular ? "default" : "outline"}
              >
                <Link to={type.href}>
                  {type.buttonText}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
