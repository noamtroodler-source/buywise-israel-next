import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqItems = [
  {
    question: "Is BuyWise Israel free to join?",
    answer:
      "Yes! Creating a professional profile and listing properties is completely free. We're focused on building the best platform for Anglo buyers and professionals in Israel.",
  },
  {
    question: "What types of professionals can join?",
    answer:
      "We welcome individual real estate agents, real estate agencies/teams, and property developers. Each professional type has tailored features designed for their specific needs.",
  },
  {
    question: "How does the verification process work?",
    answer:
      "After you submit your registration, our team reviews your credentials within 1-2 business days. Verified professionals receive a badge on their profile and get priority placement in search results.",
  },
  {
    question: "What makes BuyWise different from other platforms?",
    answer:
      "We specialize exclusively in the Anglo market—English-speaking buyers from North America, UK, South Africa, and Australia. Our entire platform is in English, and we provide tools specifically designed for international buyers.",
  },
  {
    question: "Can I manage multiple agents under one agency?",
    answer:
      "Absolutely! Agency accounts include team management features, invite codes for agents, consolidated analytics, and branded agency pages that showcase all your team members.",
  },
  {
    question: "How do I receive buyer inquiries?",
    answer:
      "Buyers can contact you directly through WhatsApp, phone, or email via your listing pages. You'll receive notifications and can track all inquiries in your professional dashboard.",
  },
  {
    question: "Can developers showcase new construction projects?",
    answer:
      "Yes! Developer accounts include project showcase pages, unit inventory management, construction progress tracking, and dedicated project inquiry forms.",
  },
];

export function AdvertiseFAQ() {
  return (
    <section className="py-20 bg-muted/30">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Everything you need to know about joining BuyWise Israel as a professional.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="max-w-3xl mx-auto"
        >
          <Accordion type="single" collapsible className="space-y-3">
            {faqItems.map((item, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="bg-card border border-border rounded-xl px-6 data-[state=open]:border-primary/30"
              >
                <AccordionTrigger className="text-left font-medium hover:no-underline py-5">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-5">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
}
