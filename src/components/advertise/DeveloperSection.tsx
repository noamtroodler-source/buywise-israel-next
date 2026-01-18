import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Landmark, Globe, BarChart3, FileText, Building, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const benefits = [
  {
    icon: Globe,
    title: "Reach Anglo Buyers",
    description: "Showcase projects to motivated English-speaking buyers from the US, UK, and worldwide",
  },
  {
    icon: Building,
    title: "Project Showcase",
    description: "Dedicated project pages with floor plans, unit availability, and construction progress",
  },
  {
    icon: BarChart3,
    title: "Detailed Analytics",
    description: "Track project views, unit interest, and buyer inquiries with real-time dashboards",
  },
  {
    icon: Users,
    title: "Lead Management",
    description: "Receive and manage buyer inquiries directly—organized by project and unit type",
  },
];

const steps = [
  { step: 1, title: "Register Your Company", description: "Complete your developer profile with company details" },
  { step: 2, title: "Get Verified", description: "Our team verifies your developer credentials" },
  { step: 3, title: "Add Projects", description: "List new developments with our project wizard" },
  { step: 4, title: "Connect with Buyers", description: "Receive inquiries and sell units" },
];

export function DeveloperSection() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-12"
    >
      {/* Benefits Grid */}
      <div>
        <h3 className="text-xl font-semibold text-foreground mb-6">Why List as a Developer?</h3>
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
          <Link to="/developer/register">Register as Developer</Link>
        </Button>
        <Button variant="outline" size="lg" asChild>
          <Link to="/for-developers">Learn More</Link>
        </Button>
      </div>
    </motion.div>
  );
}
