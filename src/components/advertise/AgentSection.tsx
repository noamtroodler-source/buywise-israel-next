import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, TrendingUp, Globe, Users, Shield, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const benefits = [
  {
    icon: Globe,
    title: "Access Anglo Buyers",
    description: "Connect with English-speaking buyers from the US, UK, and beyond actively searching for properties",
  },
  {
    icon: Shield,
    title: "Verified Profile",
    description: "Build trust with a verified agent badge and professional profile showcasing your expertise",
  },
  {
    icon: BarChart3,
    title: "Performance Analytics",
    description: "Track views, inquiries, and engagement metrics for all your listings in real-time",
  },
  {
    icon: Users,
    title: "Direct Leads",
    description: "Receive inquiries directly via WhatsApp, phone, or email—no intermediaries",
  },
];

const steps = [
  { step: 1, title: "Create Your Profile", description: "Sign up and complete your professional profile with credentials" },
  { step: 2, title: "Get Verified", description: "Our team reviews and verifies your agent status" },
  { step: 3, title: "List Properties", description: "Add your listings with our easy property wizard" },
  { step: 4, title: "Connect with Buyers", description: "Receive inquiries and close deals" },
];

export function AgentSection() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-12"
    >
      {/* Benefits Grid */}
      <div>
        <h3 className="text-xl font-semibold text-foreground mb-6">Why List as an Agent?</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {benefits.map((benefit, index) => (
            <Card key={index} className="border-border/50">
              <CardContent className="p-6">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <benefit.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">{benefit.title}</h4>
                    <p className="text-sm text-muted-foreground">{benefit.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* How It Works */}
      <div>
        <h3 className="text-xl font-semibold text-foreground mb-6">How It Works</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {steps.map((item) => (
            <div
              key={item.step}
              className="relative p-5 rounded-xl bg-muted/30 border border-border/50"
            >
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold mb-3">
                {item.step}
              </div>
              <h4 className="font-medium text-foreground mb-1">{item.title}</h4>
              <p className="text-sm text-muted-foreground">{item.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="flex flex-col sm:flex-row gap-4 pt-4">
        <Button asChild size="lg">
          <Link to="/agent/register">Register as Agent</Link>
        </Button>
        <Button variant="outline" size="lg" asChild>
          <Link to="/for-agents">Learn More</Link>
        </Button>
      </div>
    </motion.div>
  );
}
