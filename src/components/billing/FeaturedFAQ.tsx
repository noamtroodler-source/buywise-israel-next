import { HelpCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const FAQ_ITEMS = [
  {
    question: 'How does featured placement work?',
    answer:
      'Your listing receives a "Featured" badge and priority positioning across search results, city pages, and the homepage carousel. We use session-based rotation so every featured property gets equal exposure — no fixed slots, no favoritism.',
  },
  {
    question: 'How is rotation fair across agencies?',
    answer:
      'We use session-based rotation, meaning each visitor sees a different mix of featured listings. There are no permanent "top slots" that one agency can monopolize — every featured listing gets roughly equal screen time.',
  },
  {
    question: 'How much more visibility will my listing get?',
    answer:
      'Featured listings appear above standard results and are highlighted with a visual badge that catches the eye. Early data shows featured listings receive significantly more views and inquiry clicks compared to non-featured ones.',
  },
  {
    question: 'Is there a limit on how many listings I can feature?',
    answer:
      'No limit at all. You can feature as many of your published listings as you'd like. Each featured listing costs ₪299/month.',
  },
  {
    question: 'Can I turn it on and off anytime?',
    answer:
      'Absolutely. You can activate or deactivate featured status instantly with the toggle below — no long-term commitment, no cancellation fees.',
  },
  {
    question: 'When does billing start?',
    answer:
      'Billing begins the moment you activate a featured listing and recurs monthly. You can cancel anytime and the listing will immediately revert to standard placement.',
  },
];

export function FeaturedFAQ() {
  return (
    <Card className="rounded-2xl border-primary/10">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <HelpCircle className="h-5 w-5 text-primary" />
          Frequently Asked Questions
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <Accordion type="single" collapsible className="w-full">
          {FAQ_ITEMS.map((item, i) => (
            <AccordionItem key={i} value={`faq-${i}`} className="border-border/50">
              <AccordionTrigger className="text-sm hover:no-underline hover:text-primary">
                {item.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-sm leading-relaxed">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
}
