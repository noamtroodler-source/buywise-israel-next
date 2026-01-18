import { User, Building2, Landmark, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ProfessionalType {
  id: "agent" | "agency" | "developer";
  icon: React.ElementType;
  title: string;
  description: string;
  color: string;
}

const professionalTypes: ProfessionalType[] = [
  {
    id: "agent",
    icon: User,
    title: "Individual Agent",
    description: "Independent agents looking to list properties and connect with international buyers",
    color: "from-primary/10 to-primary/5",
  },
  {
    id: "agency",
    icon: Building2,
    title: "Agency / Team",
    description: "Real estate firms managing multiple agents with unified brand presence",
    color: "from-primary/10 to-primary/5",
  },
  {
    id: "developer",
    icon: Landmark,
    title: "Property Developer",
    description: "Construction companies showcasing new development projects to Anglo buyers",
    color: "from-primary/10 to-primary/5",
  },
];

interface ProfessionalTypeChooserProps {
  onSelect: (type: "agent" | "agency" | "developer") => void;
  selectedType?: "agent" | "agency" | "developer";
}

export function ProfessionalTypeChooser({ onSelect, selectedType }: ProfessionalTypeChooserProps) {
  return (
    <section className="py-16 bg-background">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
            Choose Your Professional Type
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Select your role to see tailored benefits and registration options
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {professionalTypes.map((type, index) => (
            <motion.button
              key={type.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              onClick={() => onSelect(type.id)}
              className={cn(
                "group relative p-8 rounded-2xl border-2 transition-all duration-300 text-left",
                "hover:shadow-lg hover:border-primary/50 hover:-translate-y-1",
                selectedType === type.id
                  ? "border-primary bg-primary/5 shadow-md"
                  : "border-border bg-card"
              )}
            >
              <div
                className={cn(
                  "w-14 h-14 rounded-xl flex items-center justify-center mb-5",
                  "bg-gradient-to-br",
                  type.color,
                  selectedType === type.id && "bg-primary/20"
                )}
              >
                <type.icon
                  className={cn(
                    "h-7 w-7",
                    selectedType === type.id ? "text-primary" : "text-primary/70"
                  )}
                />
              </div>

              <h3 className="text-xl font-semibold text-foreground mb-2">
                {type.title}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {type.description}
              </p>

              <div
                className={cn(
                  "inline-flex items-center text-sm font-medium transition-colors",
                  selectedType === type.id
                    ? "text-primary"
                    : "text-muted-foreground group-hover:text-primary"
                )}
              >
                Learn more
                <ArrowRight className="ml-1.5 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </div>

              {selectedType === type.id && (
                <motion.div
                  layoutId="selected-indicator"
                  className="absolute inset-0 rounded-2xl border-2 border-primary pointer-events-none"
                />
              )}
            </motion.button>
          ))}
        </div>
      </div>
    </section>
  );
}
