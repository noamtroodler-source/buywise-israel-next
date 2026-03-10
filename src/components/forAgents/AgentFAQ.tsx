import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { motion } from "framer-motion";

const faqs = [
  {
    question: "Is BuyWise free to use?",
    answer: "Creating a profile is completely free, and every account includes 1 free listing so you can experience the platform. To publish additional listings and unlock advanced features, you can upgrade to one of our paid plans starting at ₪750/month."
  },
  {
    question: "How long does verification take?",
    answer: "Our team reviews agent applications within 24-48 business hours. Once verified, you'll receive a trust badge on your profile that helps build credibility with buyers. Make sure to provide your valid Israeli real estate license number."
  },
  {
    question: "Do I need a license to register?",
    answer: "Yes, we require a valid Israeli real estate license (תיווך נדל\"ן) to register as an agent. This ensures buyers are working with qualified professionals and maintains the quality of our platform."
  },
  {
    question: "Can I bring my team or agency?",
    answer: "Absolutely! We offer agency accounts that let you manage multiple agents under one brand. You'll get team dashboards, invite codes, and aggregated performance stats. Register as an agency to get started."
  },
  {
    question: "How do leads work?",
    answer: "When buyers are interested in your listings, they can contact you via WhatsApp, phone call, or email—all tracked in your dashboard. You receive 100% of the leads; we don't take a cut or charge per lead."
  },
  {
    question: "What makes BuyWise different from Yad2 or Madlan?",
    answer: "BuyWise is specifically built for English-speaking buyers—olim, foreign investors, and expats. Our entire platform is in English, with neighborhood guides, market insights, and tools designed for this audience. This focused approach means you're reaching a motivated, underserved market."
  },
  {
    question: "Can I list rental properties?",
    answer: "Yes, you can list both sales and rental properties. Our platform supports apartments, houses, penthouses, and more across all major Israeli cities."
  },
  {
    question: "How do I get homepage exposure?",
    answer: "BuyWise Israel periodically highlights a limited number of listings on the homepage. Listings rotate weekly and are curated for quality. Availability, fit, and pricing are reviewed per listing. Contact hello@buywiseisrael.com to inquire about homepage exposure for your properties."
  }
];

export function AgentFAQ() {
  return (
    <section className="py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Everything you need to know about joining BuyWise.
          </p>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto"
        >
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="bg-card border rounded-xl px-6 data-[state=open]:border-primary/30"
              >
                <AccordionTrigger className="text-left hover:no-underline py-5">
                  <span className="font-semibold">{faq.question}</span>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-5 leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
}
