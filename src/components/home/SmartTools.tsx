import { Link } from 'react-router-dom';
import { TrendingUp, Calculator, Wallet, Scale, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const tools = [
  { 
    id: 'investment', 
    label: 'Investment Calculator', 
    description: 'Analyze rental returns', 
    icon: TrendingUp 
  },
  { 
    id: 'mortgage', 
    label: 'Mortgage Calculator', 
    description: 'Understand your payments', 
    icon: Calculator 
  },
  { 
    id: 'affordability', 
    label: 'Affordability Calculator', 
    description: 'Know what you can buy', 
    icon: Wallet 
  },
  { 
    id: 'rentvsbuy', 
    label: 'Rent vs Buy', 
    description: 'Compare your options', 
    icon: Scale 
  },
];

export function SmartTools() {
  return (
    <section className="py-12 md:py-16">
      <div className="container">
        {/* Header */}
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            Smart Tools for Smarter Decisions
          </h2>
          <p className="text-muted-foreground">
            Free calculators and guides built for international buyers
          </p>
        </div>

        {/* Tools Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 max-w-4xl mx-auto">
          {tools.map((tool) => {
            const Icon = tool.icon;
            return (
              <Link
                key={tool.id}
                to={`/tools?tool=${tool.id}`}
                className="group bg-card border border-border rounded-xl p-5 md:p-6 text-center hover:shadow-lg hover:border-primary/40 transition-all"
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground text-sm md:text-base mb-1">
                  {tool.label}
                </h3>
                <p className="text-muted-foreground text-xs md:text-sm">
                  {tool.description}
                </p>
              </Link>
            );
          })}
        </div>

        {/* CTA Button */}
        <div className="flex justify-center mt-8">
          <Button variant="outline" asChild className="gap-2">
            <Link to="/tools">
              See All Tools
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
