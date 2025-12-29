import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Calculator, Wallet, Scale, TrendingUp, Receipt, Compass, 
  MapPinned, Clock, Hammer, ClipboardList, ArrowRight, ArrowLeft
} from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { ToolPlaceholder } from '@/components/tools/ToolPlaceholder';
import { MortgageCalculator } from '@/components/tools/MortgageCalculator';
import { AffordabilityCalculator } from '@/components/tools/AffordabilityCalculator';

interface Tool {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  category?: 'calculator' | 'tutorial' | 'discovery';
}

const tools: Tool[] = [
  { id: 'mortgage', label: 'Mortgage Calculator', description: 'Calculate monthly payments, total interest, and view detailed amortization schedules', icon: Calculator, category: 'calculator' },
  { id: 'totalcost', label: 'Total Cost Calculator', description: 'Calculate all one-time and monthly costs for buying property in Israel including taxes, fees, and mortgage', icon: Receipt, category: 'calculator' },
  { id: 'affordability', label: 'Affordability Calculator', description: 'Calculate your maximum affordable home price based on income, savings, and Israeli mortgage rules', icon: Wallet, category: 'calculator' },
  { id: 'investment', label: 'Investment Return Calculator', description: 'Calculate potential returns, cash flow, and ROI on investment properties in Israel', icon: TrendingUp, category: 'calculator' },
  { id: 'rentvsbuy', label: 'Rent vs Buy Calculator', description: 'Compare the true cost of renting versus buying property in Israel over time', icon: Scale, category: 'calculator' },
  { id: 'timemachine', label: 'Real Estate Time Machine', description: 'Explore how Israeli real estate has historically performed by area and time', icon: Clock, category: 'calculator' },
  { id: 'renovation', label: 'Renovation Cost Estimator', description: 'Estimate renovation costs for Israeli properties including materials, labor, and permits', icon: Hammer, category: 'calculator' },
  { id: 'neighborhood', label: 'Neighborhood Match', description: 'Find the perfect Israeli neighborhood based on your lifestyle preferences', icon: MapPinned, category: 'discovery' },
  { id: 'workshop', label: 'Find Your Place Workshop', description: 'Discover what truly matters for your Israel home before you start searching', icon: Compass, category: 'discovery' },
  { id: 'documents', label: 'Document Checklist', description: 'Track all required documents for your Israel property purchase with status updates', icon: ClipboardList, category: 'discovery' },
];

const toolComponents: Record<string, React.ComponentType> = {
  mortgage: MortgageCalculator,
  totalcost: () => <ToolPlaceholder toolName="Total Cost Calculator" />,
  affordability: AffordabilityCalculator,
  investment: () => <ToolPlaceholder toolName="Investment Return Calculator" />,
  rentvsbuy: () => <ToolPlaceholder toolName="Rent vs Buy Calculator" />,
  timemachine: () => <ToolPlaceholder toolName="Real Estate Time Machine" />,
  renovation: () => <ToolPlaceholder toolName="Renovation Cost Estimator" />,
  neighborhood: () => <ToolPlaceholder toolName="Neighborhood Match" />,
  workshop: () => <ToolPlaceholder toolName="Find Your Place Workshop" />,
  documents: () => <ToolPlaceholder toolName="Document Checklist" />,
};

function ToolCard({ tool, onClick }: { tool: Tool; onClick: () => void }) {
  const Icon = tool.icon;
  
  return (
    <div 
      className="group bg-card border border-border rounded-xl p-5 hover:shadow-md hover:border-primary/40 transition-all cursor-pointer flex flex-col"
      onClick={onClick}
    >
      <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      
      <h3 className="font-semibold text-foreground mb-2">
        {tool.label}
      </h3>
      
      <p className="text-muted-foreground text-sm leading-relaxed flex-1">
        {tool.description}
      </p>
      
      <div className="flex justify-end mt-4">
        <span className="text-primary text-sm font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
          Open tool
          <ArrowRight className="h-4 w-4" />
        </span>
      </div>
    </div>
  );
}

export default function Tools() {
  const [searchParams] = useSearchParams();
  const [activeTool, setActiveTool] = useState<string | null>(null);

  useEffect(() => {
    const toolParam = searchParams.get('tool');
    if (toolParam && toolComponents[toolParam]) {
      setActiveTool(toolParam);
    }
  }, [searchParams]);

  const ActiveComponent = activeTool ? toolComponents[activeTool] : null;

  return (
    <Layout>
      <div className="min-h-screen bg-background">
        {activeTool ? (
          <div className="container py-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-4xl mx-auto space-y-4"
            >
              <Button variant="ghost" onClick={() => setActiveTool(null)} className="gap-2 -ml-2">
                <ArrowLeft className="h-4 w-4" />
                Back to all tools
              </Button>
              {ActiveComponent && <ActiveComponent />}
            </motion.div>
          </div>
        ) : (
          <div className="container py-10 md:py-16">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center max-w-2xl mx-auto mb-12"
            >
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
                Property Tools & Calculators
              </h1>
              <p className="text-muted-foreground">
                Powerful tools to help you make informed decisions about your property purchase in Israel
              </p>
            </motion.div>

            {/* Tools Grid */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5"
            >
              {tools.map((tool, index) => (
                <motion.div
                  key={tool.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * index }}
                >
                  <ToolCard 
                    tool={tool} 
                    onClick={() => setActiveTool(tool.id)} 
                  />
                </motion.div>
              ))}
            </motion.div>

            {/* Disclaimer */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-12 max-w-2xl mx-auto"
            >
              <div className="p-4 rounded-xl bg-muted/50 text-center">
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium">Disclaimer:</span> These tools provide estimates for informational purposes only. 
                  Consult with a financial advisor or mortgage professional for personalized advice.
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </Layout>
  );
}
