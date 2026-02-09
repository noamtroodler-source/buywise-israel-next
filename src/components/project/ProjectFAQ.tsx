import { motion } from 'framer-motion';
import { HelpCircle } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const faqs = [
  {
    question: 'How do I actually pay for a new apartment?',
    answer: `Payments are spread across construction milestones — typically 10-20% at signing, then staged payments as the building progresses (foundation, framing, finishing), with the final 10-15% at key handover. Each payment triggers a bank guarantee protecting your funds. Most contracts link payments to the Construction Cost Index (Madad), meaning your total price may rise 5-15% during a 2-3 year build. Always clarify the payment schedule and whether the price is final or index-linked before signing.`,
  },
  {
    question: 'Can I get a mortgage for something not built yet?',
    answer: `Yes. Israeli banks regularly finance new construction purchases. You'll get mortgage approval based on the purchase contract, and the bank releases funds according to the construction payment schedule. Your mortgage payments typically start small and increase as construction progresses. Bank of Israel limits financing to 75% of the purchase price for first-time buyers (50% for investors). Many buyers secure pre-approval before signing to confirm their budget.`,
  },
  {
    question: 'What happens if construction is delayed?',
    answer: `Delays are common. Israeli law (the 2022 Sale Law amendment) entitles you to compensation if delivery exceeds 60 days past the contracted date: rent equivalent for the first year of delay, then 125-150% of rent thereafter. However, many contracts include developer-friendly force majeure clauses. Get the delivery date in writing, understand what counts as a valid delay, and factor 6-12 months of potential delay into your timeline.`,
  },
  {
    question: 'What if the developer goes bankrupt?',
    answer: `Israeli law requires developers to secure bank guarantees for every payment you make above 7% of the purchase price. If the project collapses, your bank returns your money. This makes new construction in Israel generally safer than resale (where you pay in full before receiving keys). Keep all guarantee letters in a safe place and verify they're issued within 14 days of each payment.`,
  },
  {
    question: 'What\'s included in the price — and what costs extra?',
    answer: `The "technical specification" (mifrat techni) lists exactly what's included: flooring, tiles, fixtures, outlets, kitchen finishes, etc. Anything not listed is an upgrade you'll pay for. Common add-ons include air conditioning, upgraded kitchens, storage units, and parking spots beyond the first. Always review this document carefully — the showroom apartment often has upgrades not included in the base price.`,
  },
  {
    question: 'What are my rights if something is wrong with the apartment?',
    answer: `New apartments come with mandatory warranty periods. The "inspection period" (Tekufat Bedek) covers defects for 1-7 years depending on the issue: 1 year for general items, 2 years for plumbing and electrical, 5 years for cracks and dampness, 7 years for external cladding. Beyond that, a 3-year structural warranty applies. Document any issues in writing immediately — verbal complaints aren't legally valid. Most buyers hire a private engineer for a pre-handover inspection.`,
  },
  {
    question: 'What legal protections exist for off-plan buyers?',
    answer: `Israeli law requires developers to provide one of five legal safeguards before collecting more than 7% of the purchase price: a bank guarantee, insurance policy, first mortgage on the property, a warning notice (He'arat Azhara) in the land registry, or transfer of property rights to the buyer. The developer must issue a declaration within 7 days of signing confirming which safeguard is in place. These protections ensure that if the developer defaults or goes bankrupt, your payments are recoverable. Keep all guarantee letters and declarations in a safe place and verify they're issued promptly after each payment.`,
  },
];

export function ProjectFAQ() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="space-y-4"
    >
      <div className="flex items-center gap-2">
        <HelpCircle className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-semibold">Buying New Construction in Israel</h2>
      </div>
      
      <Accordion type="single" collapsible className="w-full">
        {faqs.map((faq, index) => (
          <AccordionItem key={index} value={`item-${index}`}>
            <AccordionTrigger className="text-left text-foreground hover:no-underline">
              {faq.question}
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground leading-relaxed">
              {faq.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </motion.div>
  );
}
