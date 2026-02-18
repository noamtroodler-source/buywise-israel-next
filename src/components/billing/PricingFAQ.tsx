import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const FAQ_ITEMS = [
  {
    q: 'Can I cancel anytime?',
    a: 'Yes! You can cancel your subscription at any time from your billing settings. Your plan will remain active until the end of your current billing period.',
  },
  {
    q: 'How do credits work?',
    a: 'Credits power visibility boosts — homepage features, city-level priority, search ranking, and more. Credits from monthly plan grants expire at the end of the month they\'re issued. Purchased credit packages also expire at end of the month of purchase. Spend them before month-end to get full value — your balance is always visible in your billing hub.',
  },
  {
    q: 'What happens when I hit my listing limit?',
    a: 'You\'ll need to upgrade to a higher plan to publish additional listings. Existing listings remain active, but you won\'t be able to add new ones until you upgrade or remove some.',
  },
  {
    q: 'What\'s the Founding Program?',
    a: 'Our Founding Program rewards early adopters with a 60-day free trial, 25% off for 10 months after the trial, and monthly visibility credits. Use code FOUNDING2026 at checkout to activate it.',
  },
  {
    q: 'Can I switch plans later?',
    a: 'Absolutely. You can upgrade or downgrade your plan at any time. When upgrading, you\'ll be prorated for the remainder of your billing cycle. Downgrades take effect at the next renewal.',
  },
  {
    q: 'What payment methods do you accept?',
    a: 'We accept all major credit and debit cards (Visa, Mastercard, Amex) through our secure Stripe payment processor. All prices are in ILS (₪).',
  },
];

export function PricingFAQ() {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
          Frequently Asked Questions
        </h2>
        <p className="text-muted-foreground">
          Everything you need to know about our plans and billing
        </p>
      </div>

      <Accordion type="single" collapsible className="w-full">
        {FAQ_ITEMS.map((item, i) => (
          <AccordionItem key={i} value={`faq-${i}`}>
            <AccordionTrigger className="text-left text-foreground">
              {item.q}
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              {item.a}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
