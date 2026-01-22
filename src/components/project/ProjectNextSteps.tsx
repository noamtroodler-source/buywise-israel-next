import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BarChart3, Calculator, BookOpen } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface ProjectNextStepsProps {
  cityName: string;
  citySlug: string;
  projectPrice?: number;
}

export function ProjectNextSteps({ cityName, citySlug, projectPrice }: ProjectNextStepsProps) {
  const nextSteps = [
    {
      icon: BarChart3,
      title: `Explore ${cityName} Market`,
      description: 'Trends, prices & neighborhood insights',
      to: `/areas/${citySlug}`,
    },
    {
      icon: Calculator,
      title: 'Run the Numbers',
      description: 'Mortgage calculator & cost breakdown',
      to: projectPrice ? `/tools?tool=mortgage&price=${projectPrice}` : '/tools?tool=mortgage',
    },
    {
      icon: BookOpen,
      title: 'Buying New Construction',
      description: 'Payment schedules, protections & what to ask',
      to: '/guides/new-construction',
    },
  ];

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="space-y-4"
    >
      <h2 className="text-xl font-semibold">Next Steps</h2>
      
      <div className="grid sm:grid-cols-3 gap-4">
        {nextSteps.map((step, index) => (
          <Link key={index} to={step.to}>
            <Card className="h-full hover:border-primary/50 hover:shadow-md transition-all cursor-pointer group">
              <CardContent className="p-4 flex items-start gap-4">
                <div className="p-2.5 rounded-lg bg-primary/10 group-hover:bg-primary/15 transition-colors">
                  <step.icon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium group-hover:text-primary transition-colors">
                    {step.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {step.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </motion.section>
  );
}
