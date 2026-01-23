import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Calculator, Wallet, Scale, TrendingUp, Receipt, Compass, 
  MapPinned, Hammer, ClipboardList, ArrowRight, ArrowLeft
} from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { ToolPlaceholder } from '@/components/tools/ToolPlaceholder';
import { MortgageCalculator } from '@/components/tools/MortgageCalculator';
import AffordabilityCalculator from '@/components/tools/AffordabilityCalculator';
import { TrueCostCalculator } from '@/components/tools/TrueCostCalculator';
import { RentVsBuyCalculator } from '@/components/tools/RentVsBuyCalculator';
import { InvestmentReturnCalculator } from '@/components/tools/InvestmentReturnCalculator';
import { RenovationCostEstimator } from '@/components/tools/RenovationCostEstimator';
import { DocumentChecklistTool } from '@/components/tools/DocumentChecklistTool';
import { NeighborhoodMatch } from '@/components/tools/NeighborhoodMatch';

interface Tool {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  category?: 'calculator' | 'tutorial' | 'discovery';
}

const tools: Tool[] = [
  { id: 'mortgage', label: 'Mortgage Calculator', description: 'Understand real monthly payments under Israeli mortgage rules — before speaking to a bank or broker.', icon: Calculator, category: 'calculator' },
  { id: 'totalcost', label: 'Total Cost Calculator', description: 'See the true cost of buying in Israel — taxes, fees, closing costs, and surprises most buyers miss.', icon: Receipt, category: 'calculator' },
  { id: 'affordability', label: 'Affordability Calculator', description: 'Know what you can realistically buy in Israel — based on income, savings, and local lending limits.', icon: Wallet, category: 'calculator' },
  { id: 'investment', label: 'Investment Return Calculator', description: 'Evaluate returns, cash flow, and long-term value — using Israeli market assumptions.', icon: TrendingUp, category: 'calculator' },
  { id: 'rentvsbuy', label: 'Rent vs Buy Calculator', description: 'Compare renting versus buying in Israel — and when ownership makes sense.', icon: Scale, category: 'calculator' },
  { id: 'renovation', label: 'Renovation Cost Estimator', description: 'Estimate renovation costs in Israel — beyond how a property looks.', icon: Hammer, category: 'calculator' },
  { id: 'neighborhood', label: 'Where Should I Buy?', description: 'Take a quick quiz to discover which Israeli cities match your lifestyle, budget, and priorities.', icon: MapPinned, category: 'discovery' },
  { id: 'workshop', label: 'Find Your Place Workshop', description: 'Clarify what truly matters — so you search with confidence, not overwhelm.', icon: Compass, category: 'discovery' },
  { id: 'documents', label: 'Document Checklist', description: "Stay organized through the Israeli buying process — and know what's needed at every step.", icon: ClipboardList, category: 'discovery' },
];

const toolComponents: Record<string, React.ComponentType> = {
  mortgage: MortgageCalculator,
  totalcost: TrueCostCalculator,
  affordability: AffordabilityCalculator,
  investment: InvestmentReturnCalculator,
  rentvsbuy: RentVsBuyCalculator,
  renovation: RenovationCostEstimator,
  neighborhood: NeighborhoodMatch,
  workshop: () => <ToolPlaceholder toolName="Find Your Place Workshop" />,
  documents: DocumentChecklistTool,
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
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTool, setActiveTool] = useState<string | null>(null);

  useEffect(() => {
    const toolParam = searchParams.get('tool');
    if (toolParam && toolComponents[toolParam]) {
      setActiveTool(toolParam);
    } else {
      setActiveTool(null);
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
              <Button
                variant="ghost"
                onClick={() => setSearchParams({})}
                className="gap-2 -ml-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to all tools
              </Button>
              {ActiveComponent && <ActiveComponent />}
            </motion.div>
          </div>
        ) : (
          <>
            {/* Page Header */}
            <div className="bg-gradient-to-b from-muted/60 to-background border-b border-border/50">
              <div className="container py-8 md:py-10 text-center">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
                    Property Tools & Calculators
                  </h1>
                  <p className="text-muted-foreground">
                    Clarity-first tools for buying and renting in Israel — so you can move forward confident and prepared.
                  </p>
                </motion.div>
              </div>
            </div>

            <div className="container py-8">

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
                    onClick={() => setSearchParams({ tool: tool.id })}
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
          </>
        )}
      </div>
    </Layout>
  );
}
