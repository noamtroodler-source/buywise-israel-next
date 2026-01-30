import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import useEmblaCarousel from 'embla-carousel-react';
import { 
  Calculator, Wallet, Scale, TrendingUp, Receipt, 
  Hammer, ClipboardList, ArrowRight, ArrowLeft
} from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { SEOHead } from '@/components/seo/SEOHead';
import { GuestSignupNudge } from '@/components/shared/GuestSignupNudge';
import { SupportFooter } from '@/components/shared/SupportFooter';
import { CarouselDots } from '@/components/shared/CarouselDots';
import { Button } from '@/components/ui/button';
import { MortgageCalculator } from '@/components/tools/MortgageCalculator';
import AffordabilityCalculator from '@/components/tools/AffordabilityCalculator';
import { TrueCostCalculator } from '@/components/tools/TrueCostCalculator';
import { RentVsBuyCalculator } from '@/components/tools/RentVsBuyCalculator';
import { InvestmentReturnCalculator } from '@/components/tools/InvestmentReturnCalculator';
import { RenovationCostEstimator } from '@/components/tools/RenovationCostEstimator';
import { DocumentChecklistTool } from '@/components/tools/DocumentChecklistTool';
import { TOOLS_BY_PHASE } from '@/lib/navigationConfig';
import { useIsMobile } from '@/hooks/use-mobile';


interface Tool {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  /** Warm, professional hint to guide users */
  guidanceHint?: string;
}

// All tools with their metadata and contextual guidance hints
const allTools: Record<string, Tool> = {
  mortgage: { 
    id: 'mortgage', 
    label: 'Mortgage Calculator', 
    description: 'Understand real monthly payments under Israeli mortgage rules — before speaking to a bank or broker.', 
    icon: Calculator,
    guidanceHint: 'Most buyers start here',
  },
  totalcost: { 
    id: 'totalcost', 
    label: 'Total Cost Calculator', 
    description: 'See the true cost of buying in Israel — taxes, fees, closing costs, and surprises most buyers miss.', 
    icon: Receipt,
    guidanceHint: 'Avoid surprises later',
  },
  affordability: { 
    id: 'affordability', 
    label: 'Affordability Calculator', 
    description: 'Know what you can realistically buy in Israel — based on income, savings, and local lending limits.', 
    icon: Wallet,
    guidanceHint: 'Great first step',
  },
  investment: { 
    id: 'investment', 
    label: 'Investment Return Calculator', 
    description: 'Evaluate returns, cash flow, and long-term value — using Israeli market assumptions.', 
    icon: TrendingUp,
  },
  rentvsbuy: { 
    id: 'rentvsbuy', 
    label: 'Rent vs Buy Calculator', 
    description: 'Compare renting versus buying in Israel — and when ownership makes sense.', 
    icon: Scale,
  },
  renovation: { 
    id: 'renovation', 
    label: 'Renovation Cost Estimator', 
    description: 'Estimate renovation costs in Israel — beyond how a property looks.', 
    icon: Hammer,
  },
  documents: { 
    id: 'documents', 
    label: 'Document Checklist', 
    description: "Stay organized through the Israeli buying process — and know what's needed at every step.", 
    icon: ClipboardList,
    guidanceHint: 'Keep this open during the process',
  },
};

const toolComponents: Record<string, React.ComponentType> = {
  mortgage: MortgageCalculator,
  totalcost: TrueCostCalculator,
  affordability: AffordabilityCalculator,
  investment: InvestmentReturnCalculator,
  rentvsbuy: RentVsBuyCalculator,
  renovation: RenovationCostEstimator,
  documents: DocumentChecklistTool,
};

// Journey phase order
const phaseOrder = ['define', 'check', 'move_forward', 'after_deal'];

function ToolCard({ tool, onClick }: { tool: Tool; onClick: () => void }) {
  const Icon = tool.icon;
  
  return (
    <div 
      className="group bg-card border border-border rounded-xl p-5 hover:shadow-md hover:border-primary/40 transition-all cursor-pointer flex flex-col h-full"
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        {tool.guidanceHint && (
          <span className="text-xs text-primary font-medium bg-primary/8 px-2 py-1 rounded-full whitespace-nowrap">
            {tool.guidanceHint}
          </span>
        )}
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

interface ToolsCarouselProps {
  tools: Tool[];
  phaseKey: string;
  onToolClick: (toolId: string) => void;
}

function ToolsCarousel({ tools, phaseKey, onToolClick }: ToolsCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    loop: true,
    skipSnaps: false,
    containScroll: 'trimSnaps',
  });
  const [selectedIndex, setSelectedIndex] = useState(0);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    return () => {
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi, onSelect]);

  const scrollTo = useCallback((index: number) => {
    emblaApi?.scrollTo(index);
  }, [emblaApi]);

  return (
    <div>
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {tools.map((tool, index) => (
            <div 
              key={tool.id} 
              className="flex-[0_0_calc(100%-1.5rem)] min-w-0 pl-4 first:pl-0"
            >
              <ToolCard 
                tool={tool} 
                onClick={() => onToolClick(tool.id)}
              />
            </div>
          ))}
        </div>
      </div>
      <CarouselDots 
        total={tools.length} 
        current={selectedIndex} 
        onDotClick={scrollTo}
        className="mt-4"
      />
    </div>
  );
}

export default function Tools() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    const toolParam = searchParams.get('tool');
    if (toolParam && toolComponents[toolParam]) {
      setActiveTool(toolParam);
    } else {
      setActiveTool(null);
    }
  }, [searchParams]);

  const ActiveComponent = activeTool ? toolComponents[activeTool] : null;

  const handleToolClick = (toolId: string) => {
    setSearchParams({ tool: toolId });
  };

  return (
    <Layout>
      <SEOHead
        title="Property Calculators & Tools | BuyWise Israel"
        description="Free calculators for Israeli real estate: mortgage calculator, affordability check, true cost breakdown, rent vs buy analysis, and more. Built for international buyers."
        canonicalUrl="https://buywiseisrael.com/tools"
      />
      
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
                  <p className="text-muted-foreground max-w-xl mx-auto mb-4">
                    Let's figure out what you can afford, what it really costs, and where you stand — together.
                  </p>
                  <p className="text-sm text-muted-foreground/80 max-w-lg mx-auto">
                    These tools are organized by where you are in your journey. Not sure where to start? <span className="text-primary font-medium">The mortgage and affordability calculators</span> are usually the best first step.
                  </p>
                </motion.div>
              </div>
            </div>

            <div className="container py-8 space-y-10">
            
              {/* Guest Signup Nudge */}
              <GuestSignupNudge 
                message="Sign up free to save your calculations and get personalized estimates based on your buyer profile."
                intent="save_calculation"
              />

              {/* Tools by Journey Phase */}
              {phaseOrder.map((phaseKey, phaseIndex) => {
                const phase = TOOLS_BY_PHASE[phaseKey];
                if (!phase) return null;
                
                const phaseTools = phase.tools
                  .map(toolId => allTools[toolId])
                  .filter(Boolean);
                
                if (phaseTools.length === 0) return null;
                
                return (
                  <motion.section
                    key={phaseKey}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 * phaseIndex }}
                  >
                    <div className="mb-4">
                      <h2 className="text-lg font-semibold text-foreground">
                        {phase.title}
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        {phase.description}
                      </p>
                    </div>
                    
                    {/* Mobile: Carousel */}
                    {isMobile ? (
                      <ToolsCarousel 
                        tools={phaseTools} 
                        phaseKey={phaseKey}
                        onToolClick={handleToolClick}
                      />
                    ) : (
                      /* Desktop: Grid */
                      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {phaseTools.map((tool, index) => (
                          <motion.div
                            key={tool.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.05 * (phaseIndex + index) }}
                          >
                            <ToolCard 
                              tool={tool} 
                              onClick={() => handleToolClick(tool.id)}
                            />
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </motion.section>
                );
              })}

              {/* Disclaimer */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="mt-12 max-w-2xl mx-auto space-y-4"
              >
                <div className="p-4 rounded-xl bg-muted/50 text-center">
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium">Disclaimer:</span> These tools provide estimates for informational purposes only. 
                    Consult with a financial advisor or mortgage professional for personalized advice.
                  </p>
                </div>

                {/* Support Footer */}
                <SupportFooter 
                  message="Need help interpreting your results? [Reach out] — we're happy to walk through the numbers with you."
                  linkText="Reach out"
                  variant="inline"
                  className="text-center"
                />
              </motion.div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
