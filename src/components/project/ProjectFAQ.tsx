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
    question: 'What is a Tofes 4 and when can I actually move in?',
    answer: `Tofes 4 is the municipality's confirmation that the building meets approved plans and safety standards. Without it, you cannot legally occupy the apartment or connect utilities. You also need Tofes 5 (completion certificate) and fire department approval. Never accept keys or make final payment until both certificates are issued — some developers pressure buyers to take possession prematurely.`,
  },
  {
    question: 'Is the price I\'m quoted the final price?',
    answer: `Usually not. Most new construction contracts link payments to the Construction Cost Index (Madad Tasumin). This means your final price rises with inflation during construction. On a 2-3 year build, expect 5-15% increase over the quoted price. Always ask if the price is "סופי" (final) or "צמוד למדד" (index-linked), and budget accordingly.`,
  },
  {
    question: 'What if I need to sell before construction completes?',
    answer: `You can transfer your contract rights (hasavat zchuyot), but developers must provide written consent and typically charge 1-2% of the purchase price as a transfer fee. Capital gains tax applies to any profit. The process requires legal coordination, and some developers restrict or delay transfers — clarify the policy before signing.`,
  },
  {
    question: 'What warranty do I get on a new apartment?',
    answer: `Israeli law provides two protection periods. Tekufat Bedek (inspection period) runs 1-7 years depending on the component: 1 year for general defects, 2 years for plumbing/electrical, 5 years for cracks and damp, 7 years for cladding and waterproofing. Tekufat Achrayut (warranty period) adds 3 years of structural coverage. Document and report all defects in writing immediately — verbal complaints don't count.`,
  },
  {
    question: 'How are my payments protected if the developer fails?',
    answer: `The Sale Law (Hok Mechira) requires developers to provide bank guarantees for all payments exceeding 7% of the purchase price. This guarantee ensures your money is returned if the project collapses. Keep all guarantee documents in a safe place — they are your insurance. Verify the issuing bank is reputable and that guarantees are issued within 14 days of each payment.`,
  },
  {
    question: 'What\'s in the technical specification (mifrat techni)?',
    answer: `The mifrat techni is a detailed document listing every finish, material, and fixture included in your apartment — flooring type, tile brand, electrical outlets, kitchen countertops, door handles, everything. Anything not explicitly listed costs extra. Before final payment, hire an engineer to compare the delivered apartment against this specification. Discrepancies should be documented and resolved before signing the protocol.`,
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
