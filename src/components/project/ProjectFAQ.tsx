import { motion } from 'framer-motion';
import { HelpCircle } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Link } from 'react-router-dom';

const faqs = [
  {
    question: 'How do payment schedules work for new construction in Israel?',
    answer: `Payments are typically structured in stages tied to construction milestones. A common schedule is 20-30% at signing, with remaining payments spread across foundation completion, structural work, finishing stages, and final handover. Each developer may have slightly different schedules - ask for the specific payment plan before signing.`,
  },
  {
    question: 'What happens if the developer delays completion?',
    answer: `Israeli law (Hok Mecher) protects buyers with mandatory bank guarantees that secure your payments. If the developer fails to deliver, you can claim a refund. Minor delays (up to a few months) are common and usually don't trigger compensation. For major delays, your purchase contract should specify compensation terms or exit rights.`,
  },
  {
    question: 'Can I get a mortgage for an off-plan property?',
    answer: `Yes, but it works differently than resale. Banks typically approve mortgages for new construction, but funds are released in stages matching your payment schedule. You'll start paying mortgage interest only on released amounts. Some buyers use a combination of savings for early payments and mortgage for later stages.`,
  },
  {
    question: 'What is the typical completion timeline variance?',
    answer: `Plan for 6-12 months beyond the stated completion date. Israeli construction projects frequently experience delays due to permit issues, material shortages, or labor availability. Pre-sale projects (not yet started) have higher variance than those already under construction. Always ask about current construction progress.`,
  },
  {
    question: 'What legal protections do buyers have?',
    answer: `The Sale Law (Hok Mecher) mandates that developers provide bank guarantees for all payments, ensuring your money is protected if the project fails. You also get a 1-year warranty on construction defects. However, you'll need to pay for the developer's lawyer (1.5% + VAT) in addition to your own legal representation.`,
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

      <p className="text-sm text-muted-foreground pt-2">
        For a comprehensive guide,{' '}
        <Link to="/guides/new-construction" className="text-primary hover:underline">
          read our New Construction Buyer's Guide →
        </Link>
      </p>
    </motion.div>
  );
}
