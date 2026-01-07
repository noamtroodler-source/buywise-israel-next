import { motion } from 'framer-motion';
import { Plane, Home, TrendingUp, Users, LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { BlogAudience } from '@/types/content';
import { cn } from '@/lib/utils';

interface QuickPath {
  id: BlogAudience;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  gradient: string;
  iconColor: string;
}

const quickPaths: QuickPath[] = [
  {
    id: 'olim',
    title: "I'm Making Aliyah",
    subtitle: "Oleh benefits, timelines & first steps",
    icon: Plane,
    gradient: "from-primary/10 to-primary/5",
    iconColor: "text-primary",
  },
  {
    id: 'first-time-buyers',
    title: "First-Time Buyer",
    subtitle: "Navigate Israel's market from scratch",
    icon: Home,
    gradient: "from-emerald-500/10 to-emerald-500/5",
    iconColor: "text-emerald-600",
  },
  {
    id: 'investors',
    title: "Investing from Abroad",
    subtitle: "ROI, taxes & remote management",
    icon: TrendingUp,
    gradient: "from-amber-500/10 to-amber-500/5",
    iconColor: "text-amber-600",
  },
  {
    id: 'families',
    title: "Relocating Family",
    subtitle: "Schools, neighborhoods & family life",
    icon: Users,
    gradient: "from-violet-500/10 to-violet-500/5",
    iconColor: "text-violet-600",
  },
];

interface QuickPathsProps {
  selectedAudience: BlogAudience | null;
  onSelectAudience: (audience: BlogAudience | null) => void;
}

export function QuickPaths({ selectedAudience, onSelectAudience }: QuickPathsProps) {
  const handleClick = (audienceId: BlogAudience) => {
    if (selectedAudience === audienceId) {
      onSelectAudience(null);
    } else {
      onSelectAudience(audienceId);
    }
  };

  return (
    <section className="py-8">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center mb-6"
        >
          <p className="text-sm font-medium text-muted-foreground">
            What brings you here?
          </p>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {quickPaths.map((path, index) => {
            const Icon = path.icon;
            const isSelected = selectedAudience === path.id;
            
            return (
              <motion.div
                key={path.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + index * 0.05 }}
              >
                <Card
                  onClick={() => handleClick(path.id)}
                  className={cn(
                    "p-5 cursor-pointer transition-all duration-300 border-2 hover:shadow-lg group",
                    "rounded-2xl bg-gradient-to-br",
                    path.gradient,
                    isSelected 
                      ? "border-primary shadow-lg scale-[1.02]" 
                      : "border-transparent hover:border-primary/30"
                  )}
                >
                  <div className="flex flex-col items-center text-center space-y-3">
                    <div className={cn(
                      "h-12 w-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110",
                      "bg-background/80 shadow-sm",
                      isSelected && "ring-2 ring-primary ring-offset-2"
                    )}>
                      <Icon className={cn("h-6 w-6", path.iconColor)} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground text-sm md:text-base leading-tight">
                        {path.title}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1 hidden sm:block">
                        {path.subtitle}
                      </p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
