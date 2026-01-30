import { useRef } from 'react';
import { motion } from 'framer-motion';
import { Search, BarChart3, MessageCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

const pillars = [
  {
    icon: Search,
    title: 'Discover',
    subtitle: 'Find properties your way',
    description: 'Browse verified listings in English, designed for international buyers — without needing local knowledge or fast decisions.',
    gradient: 'from-primary/10 to-primary/5',
    iconBg: 'bg-primary/10',
    iconColor: 'text-primary',
  },
  {
    icon: BarChart3,
    title: 'Understand',
    subtitle: 'See the full picture',
    description: 'See true costs, market context, and location trade-offs — so there are no surprises later.',
    gradient: 'from-muted to-muted/50',
    iconBg: 'bg-primary/10',
    iconColor: 'text-primary',
  },
  {
    icon: MessageCircle,
    title: 'Decide',
    subtitle: 'Move forward with confidence',
    description: 'Use clarity tools to compare scenarios, slow down decisions, and move forward — or wait — with confidence.',
    gradient: 'from-primary/5 to-muted/50',
    iconBg: 'bg-primary/10',
    iconColor: 'text-primary',
  },
];

export function ThreePillars() {
  const isMobile = useIsMobile();
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = scrollRef.current.offsetWidth * 0.85;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  return (
    <section className="py-12 md:py-16">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <h2 className="text-2xl md:text-4xl font-bold text-foreground">
            A Smarter Way to Search
          </h2>
        </motion.div>

        {/* Mobile: Horizontal scrollable carousel */}
        {isMobile ? (
          <div className="relative -mx-4">
            {/* Scroll container */}
            <div
              ref={scrollRef}
              className="flex gap-3 px-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory"
            >
              {pillars.map((pillar, index) => (
                <motion.div
                  key={pillar.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className={cn(
                    "flex-shrink-0 w-[85%] snap-center rounded-xl p-5 bg-gradient-to-br border border-border/50",
                    pillar.gradient
                  )}
                >
                  <div className={`w-11 h-11 rounded-lg ${pillar.iconBg} flex items-center justify-center mb-3`}>
                    <pillar.icon className={`w-5 h-5 ${pillar.iconColor}`} />
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-0.5">
                    {pillar.title}
                  </h3>
                  <p className="text-sm font-medium text-primary mb-1.5">
                    {pillar.subtitle}
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {pillar.description}
                  </p>
                </motion.div>
              ))}
            </div>
            
            {/* Scroll indicators */}
            <div className="flex justify-center gap-2 mt-4">
              <button
                onClick={() => scroll('left')}
                className="w-8 h-8 rounded-full bg-muted flex items-center justify-center active:bg-muted/70"
                aria-label="Previous"
              >
                <ChevronLeft className="h-4 w-4 text-muted-foreground" />
              </button>
              <button
                onClick={() => scroll('right')}
                className="w-8 h-8 rounded-full bg-muted flex items-center justify-center active:bg-muted/70"
                aria-label="Next"
              >
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
          </div>
        ) : (
          /* Desktop: Grid layout */
          <div className="grid md:grid-cols-3 gap-4 lg:gap-6">
            {pillars.map((pillar, index) => (
              <motion.div
                key={pillar.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`relative group rounded-xl p-6 md:p-8 bg-gradient-to-br ${pillar.gradient} border border-border/50 hover:shadow-lg transition-all duration-300`}
              >
                <div className={`w-12 h-12 rounded-lg ${pillar.iconBg} flex items-center justify-center mb-4`}>
                  <pillar.icon className={`w-6 h-6 ${pillar.iconColor}`} />
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-foreground mb-1">
                  {pillar.title}
                </h3>
                <p className="text-base font-medium text-primary mb-2">
                  {pillar.subtitle}
                </p>
                <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                  {pillar.description}
                </p>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
