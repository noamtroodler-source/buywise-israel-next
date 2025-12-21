import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Calculator, Wallet, Scale, TrendingUp, Receipt, Compass, 
  MapPinned, Clock, Hammer, ClipboardList, ArrowRight, ArrowLeft 
} from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { MortgageCalculator } from '@/components/tools/MortgageCalculator';
import { AffordabilityCalculator } from '@/components/tools/AffordabilityCalculator';
import { RentVsBuyCalculator } from '@/components/tools/RentVsBuyCalculator';
import { InvestmentReturnCalculator } from '@/components/tools/InvestmentReturnCalculator';
import { TotalCostCalculator } from '@/components/tools/TotalCostCalculator';
import { FindYourPlaceWorkshop } from '@/components/tools/FindYourPlaceWorkshop';
import { NeighborhoodMatch } from '@/components/tools/NeighborhoodMatch';
import { RealEstateTimeMachine } from '@/components/tools/RealEstateTimeMachine';
import { RenovationCostEstimator } from '@/components/tools/RenovationCostEstimator';
import { DocumentChecklist } from '@/components/tools/DocumentChecklist';

interface Tool {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  category: string;
}

const tools: Tool[] = [
  { id: 'workshop', label: 'Find Your Place Workshop', description: 'Discover what truly matters for your Israel home before you start searching', icon: Compass, category: 'Discovery Tools' },
  { id: 'neighborhood', label: 'Neighborhood Match', description: 'Find the perfect Israeli neighborhood based on your lifestyle preferences', icon: MapPinned, category: 'Discovery Tools' },
  { id: 'affordability', label: 'Affordability Calculator', description: 'Calculate your maximum affordable home price based on income, savings, and Israeli mortgage rules', icon: Wallet, category: 'Financial Calculators' },
  { id: 'investment', label: 'Investment Return Calculator', description: 'Calculate potential returns, cash flow, and ROI on investment properties in Israel', icon: TrendingUp, category: 'Financial Calculators' },
  { id: 'mortgage', label: 'Mortgage Calculator', description: 'Calculate monthly payments, total interest, and view detailed amortization schedules', icon: Calculator, category: 'Financial Calculators' },
  { id: 'totalcost', label: 'Total Cost Calculator', description: 'Calculate all one-time and monthly costs for buying property in Israel including taxes, fees, and mortgage', icon: Receipt, category: 'Financial Calculators' },
  { id: 'rentvsbuy', label: 'Rent vs Buy Calculator', description: 'Compare the true cost of renting versus buying property in Israel over time', icon: Scale, category: 'Analysis Tools' },
  { id: 'timemachine', label: 'Real Estate Time Machine', description: 'Explore how Israeli real estate has historically performed by area and time', icon: Clock, category: 'Analysis Tools' },
  { id: 'renovation', label: 'Renovation Cost Estimator', description: 'Estimate renovation costs for Israeli properties including materials, labor, and permits', icon: Hammer, category: 'Analysis Tools' },
  { id: 'documents', label: 'Document Checklist & Tracker', description: 'Track all required documents for your Israel property purchase with status updates', icon: ClipboardList, category: 'Planning Tools' },
];

const toolComponents: Record<string, React.ComponentType> = {
  mortgage: MortgageCalculator,
  affordability: AffordabilityCalculator,
  rentvsbuy: RentVsBuyCalculator,
  investment: InvestmentReturnCalculator,
  totalcost: TotalCostCalculator,
  workshop: FindYourPlaceWorkshop,
  neighborhood: NeighborhoodMatch,
  timemachine: RealEstateTimeMachine,
  renovation: RenovationCostEstimator,
  documents: DocumentChecklist,
};

function ToolCard({ tool, onClick }: { tool: Tool; onClick: () => void }) {
  const Icon = tool.icon;
  
  return (
    <div 
      className="group bg-card border border-border rounded-xl p-5 hover:shadow-md hover:border-primary/40 transition-all cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground mb-1">
            {tool.label}
          </h3>
          <p className="text-muted-foreground text-sm leading-relaxed line-clamp-2">
            {tool.description}
          </p>
        </div>
      </div>
      <div className="flex justify-end mt-3">
        <span className="text-primary text-sm font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
          Open tool
          <ArrowRight className="h-4 w-4" />
        </span>
      </div>
    </div>
  );
}

export default function Tools() {
  const [activeTool, setActiveTool] = useState<string | null>(null);

  const ActiveComponent = activeTool ? toolComponents[activeTool] : null;
  const categories = [...new Set(tools.map(t => t.category))];

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
          <div className="container py-8 md:py-12">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center max-w-2xl mx-auto mb-10"
            >
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
                Property Tools & Calculators
              </h1>
              <p className="text-muted-foreground">
                Powerful tools to help you make informed decisions about your property purchase in Israel
              </p>
            </motion.div>

            {/* Tools Grid */}
            <div className="space-y-8">
              {categories.map((category, catIndex) => {
                const categoryTools = tools.filter(t => t.category === category);
                
                return (
                  <motion.section 
                    key={category}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: catIndex * 0.05 }}
                  >
                    <h2 className="text-lg font-semibold text-foreground mb-4">
                      {category}
                    </h2>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {categoryTools.map((tool) => (
                        <ToolCard 
                          key={tool.id}
                          tool={tool} 
                          onClick={() => setActiveTool(tool.id)} 
                        />
                      ))}
                    </div>
                  </motion.section>
                );
              })}
            </div>

            {/* Disclaimer */}
            <div className="mt-12 max-w-2xl mx-auto">
              <div className="p-4 rounded-xl bg-muted/50 text-center">
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium">Disclaimer:</span> These tools provide estimates for informational purposes only. 
                  Consult with a financial advisor or mortgage professional for personalized advice.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
