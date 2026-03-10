import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const JOINING_FAQS = [
  {
    question: "Is BuyWise Israel free to join?",
    answer:
      "Yes! Creating a professional profile is free, and every account includes 1 free listing so you can try the platform. To publish additional listings, add team members, and access advanced features, upgrade to a paid plan. Registration and approval are always free of charge.",
  },
  {
    question: "What types of professionals can join?",
    answer:
      "We welcome individual real estate agents, real estate agencies and teams, and property developers. Each professional type has a tailored profile, feature set, and billing plan designed for their specific needs.",
  },
  {
    question: "How does the verification process work?",
    answer:
      "After you submit your registration, our team reviews your credentials within 1–2 business days. Verified professionals receive a badge on their profile and get priority placement in search results.",
  },
  {
    question: "What makes BuyWise different from other platforms?",
    answer:
      "We specialize exclusively in the Anglo market — English-speaking buyers from North America, the UK, South Africa, and Australia. Our entire platform is in English, and every tool is designed for the international buyer journey.",
  },
  {
    question: "Can I manage multiple agents under one agency account?",
    answer:
      "Absolutely. Agency accounts include team management, invite codes for agents, consolidated analytics, and a branded agency page that showcases all your team members.",
  },
];

const BILLING_FAQS = [
  {
    question: "Can I cancel my plan anytime?",
    answer:
      "Yes. You can cancel your subscription at any time from your billing settings. Your plan remains active until the end of the current billing period — no penalties, no lock-in.",
  },
  {
    question: "What's the difference between monthly and annual billing?",
    answer:
      "Annual plans are billed as a single upfront payment for the full year, giving you a 20% discount versus paying month-to-month. The plan auto-renews after 12 months. Monthly plans give you maximum flexibility.",
  },
  {
    question: "What happens if I hit my listing limit?",
    answer:
      "You can upgrade to a higher plan at any time to increase your limits. Existing listings remain active, but you won't be able to publish new ones until you upgrade or remove some.",
  },
  {
    question: "Can I switch plans after I sign up?",
    answer:
      "Absolutely. You can upgrade or downgrade your plan at any time from your billing dashboard. Upgrades are prorated for the remainder of your billing cycle. Downgrades take effect at the next renewal.",
  },
  {
    question: "What payment methods do you accept?",
    answer:
      "We accept all major credit and debit cards through our secure payment processor. All prices are in ILS (₪).",
  },
];

const faqItems = [
  { section: "About Joining", items: JOINING_FAQS },
  { section: "Plans & Billing", items: BILLING_FAQS },
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
            Everything you need to know about joining and billing — answered.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="max-w-3xl mx-auto space-y-8"
        >
          {faqItems.map((group, gIndex) => (
            <div key={gIndex}>
              <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-4 px-1">
                {group.section}
              </p>
              <Accordion type="single" collapsible className="space-y-3">
                {group.items.map((item, index) => (
                  <AccordionItem
                    key={index}
                    value={`g${gIndex}-item-${index}`}
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
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
