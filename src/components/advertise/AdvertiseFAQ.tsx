import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "How much does it cost to list on BuyWise Israel?",
    answer: "We're currently in our growth phase and offering free listings for verified professionals. Future pricing will be competitive and designed to provide excellent ROI for your listings.",
  },
  {
    question: "How long does the verification process take?",
    answer: "Most verifications are completed within 24-48 hours. We review your credentials to ensure quality and trust on our platform.",
  },
  {
    question: "Can I list properties if I'm part of an agency?",
    answer: "Yes! You can either register as an individual agent or have your agency admin invite you using their agency's invite code. Both options give you full listing capabilities.",
  },
  {
    question: "What types of properties can I list?",
    answer: "Agents can list apartments, houses, penthouses, duplexes, and more. Developers can showcase new construction projects with multiple unit types. Rentals and sales are both supported.",
  },
  {
    question: "How do buyers contact me?",
    answer: "Buyers can reach you directly via WhatsApp, phone call, or email inquiry form. All contact methods appear on your listings—you control which methods are available.",
  },
  {
    question: "Do you provide analytics?",
    answer: "Yes! All professionals get access to a dashboard showing listing views, inquiry counts, and engagement metrics. Agencies get aggregated team analytics.",
  },
  {
    question: "Can I transfer my agency to a new admin?",
    answer: "Yes, agency ownership can be transferred. Contact our support team and we'll assist with the transition.",
  },
  {
    question: "What makes BuyWise Israel different?",
    answer: "We're the only platform built specifically for English-speaking buyers looking at Israeli real estate. Our tools, guides, and interface are designed to bridge the language and knowledge gap.",
  },
];

export function AdvertiseFAQ() {
  return (
    <section className="py-16 bg-background">
      <div className="container">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground text-center mb-10">
            Frequently Asked Questions
          </h2>

          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left text-foreground hover:text-primary">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
