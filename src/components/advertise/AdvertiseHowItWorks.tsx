import { motion } from "framer-motion";
import { UserPlus, ShieldCheck, FileText, TrendingUp } from "lucide-react";

const steps = [
  {
    icon: UserPlus,
    number: "01",
    title: "Create Your Profile",
    description:
      "Sign up and build your professional profile. Add your credentials, experience, and specializations.",
  },
  {
    icon: ShieldCheck,
    number: "02",
    title: "Get Verified",
    description:
      "Our team reviews your application to ensure quality. Verified professionals get priority placement.",
  },
  {
    icon: FileText,
    number: "03",
    title: "Add Listings",
    description:
      "Upload your properties or development projects. Our easy wizard guides you through the process.",
  },
  {
    icon: TrendingUp,
    number: "04",
    title: "Grow Your Business",
    description:
      "Start receiving inquiries from qualified buyers. Track performance with our analytics dashboard.",
  },
];

export function AdvertiseHowItWorks() {
  return (
    <section id="how-it-works" className="py-20 bg-muted/30 scroll-mt-20">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            How It Works
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Get started in four simple steps. No complicated setup, no hidden fees.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="relative text-center"
            >
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-10 left-[60%] w-[80%] h-[2px] bg-border" />
              )}

              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-card border-2 border-primary/20 flex items-center justify-center mx-auto mb-4">
                  <step.icon className="h-8 w-8 text-primary" />
                </div>
                <span className="absolute -top-2 -right-2 text-5xl font-bold text-muted/50 select-none">
                  {step.number}
                </span>
              </div>

              <h3 className="text-lg font-semibold text-foreground mb-2">
                {step.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
