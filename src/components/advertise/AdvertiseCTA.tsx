import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { User, Building2, Landmark, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const ctaOptions = [
  {
    icon: User,
    title: "Individual Agent",
    description: "List properties and connect with buyers",
    href: "/agent/register",
    buttonText: "Register as Agent",
  },
  {
    icon: Building2,
    title: "Real Estate Agency",
    description: "Manage your team and brand presence",
    href: "/agency/register",
    buttonText: "Register Agency",
  },
  {
    icon: Landmark,
    title: "Property Developer",
    description: "Showcase your new construction projects",
    href: "/developer/register",
    buttonText: "Register as Developer",
  },
];

export function AdvertiseCTA() {
  return (
    <section className="py-20 bg-gradient-to-br from-primary/5 via-background to-primary/10">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
            Ready to Get Started?
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Join hundreds of professionals already reaching Anglo buyers on BuyWise Israel
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {ctaOptions.map((option, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="bg-card border border-border rounded-2xl p-8 text-center hover:shadow-lg transition-shadow"
            >
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
                <option.icon className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">{option.title}</h3>
              <p className="text-sm text-muted-foreground mb-6">{option.description}</p>
              <Button asChild className="w-full">
                <Link to={option.href}>
                  {option.buttonText}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </motion.div>
          ))}
        </div>

        <div className="text-center mt-10">
          <p className="text-sm text-muted-foreground">
            Have questions?{" "}
            <Link to="/contact" className="text-primary hover:underline">
              Contact our team
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
