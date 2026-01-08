import { motion } from 'framer-motion';

interface CityInsightBreakProps {
  cityName: string;
  pricePerSqm?: number | null;
}

const NATIONAL_AVG = 22800;

// Generate an insight quote based on city characteristics
const getInsightQuote = (cityName: string, pricePerSqm: number | null): string => {
  if (!pricePerSqm) {
    return `Understanding ${cityName}'s market dynamics helps you make smarter real estate decisions in Israel.`;
  }
  
  const percentAbove = ((pricePerSqm - NATIONAL_AVG) / NATIONAL_AVG) * 100;
  
  if (percentAbove > 100) {
    return `${cityName} isn't just expensive — it's where Israel's market trends start. Understanding it helps you understand the whole country.`;
  }
  
  if (percentAbove > 50) {
    return `${cityName} commands a premium for good reasons. The key is knowing whether those reasons align with your investment timeline.`;
  }
  
  if (percentAbove > 20) {
    return `${cityName} offers the sweet spot many buyers look for — established infrastructure without peak-market pricing.`;
  }
  
  if (percentAbove > 0) {
    return `${cityName} represents solid value with room for growth — a combination that appeals to both residents and investors.`;
  }
  
  if (percentAbove > -20) {
    return `${cityName} offers below-average prices in an above-average location — the kind of gap smart buyers look for.`;
  }
  
  return `${cityName}'s affordability means your capital goes further. The question is matching lifestyle needs to the savings.`;
};

export function CityInsightBreak({ cityName, pricePerSqm }: CityInsightBreakProps) {
  const quote = getInsightQuote(cityName, pricePerSqm);

  return (
    <section className="py-12 bg-primary/5">
      <div className="container max-w-3xl">
        <motion.blockquote
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center"
        >
          <p className="text-lg sm:text-xl text-foreground/90 italic leading-relaxed">
            "{quote}"
          </p>
        </motion.blockquote>
      </div>
    </section>
  );
}
