import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Layout } from '@/components/layout/Layout';
import { 
  Shield, 
  Clock, 
  Heart, 
  Eye,
  XCircle,
  CheckCircle2,
  ArrowRight,
  Languages,
  ShieldCheck,
  Lightbulb,
  Compass,
  Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const familiarFeelings = [
  {
    feeling: "You've found properties you love but have no idea if the price is fair",
  },
  {
    feeling: "You're worried about making an irreversible mistake in a system you don't fully understand",
  },
  {
    feeling: "Every time you consider calling an agent, you wonder if you're ready",
  },
];

const whatWeAre = [
  {
    icon: Languages,
    title: 'A Translator',
    description: 'We translate the Israeli real estate system into decisions you can understand.',
  },
  {
    icon: ShieldCheck,
    title: 'A Buffer',
    description: 'We stand between you and premature pressure — so you can think clearly.',
  },
  {
    icon: Lightbulb,
    title: 'A Confidence Builder',
    description: "We help you feel ready, not rush you to feel ready.",
  },
  {
    icon: Compass,
    title: 'A Neutral Guide',
    description: "We're not selling properties. We're helping you understand them.",
  },
];

const principles = [
  {
    icon: Shield,
    title: 'Trust Before Conversion',
    description: 'We believe you should feel confident before you ever speak to anyone. Our job is to educate, not pressure.',
  },
  {
    icon: Clock,
    title: 'Your Timeline, Not Ours',
    description: "We'd rather you take 6 months to feel ready than rush into a decision you'll regret. There's no urgency here except yours.",
  },
  {
    icon: Heart,
    title: 'Honest Ranges, Not False Precision',
    description: 'Real estate is messy. We show you ranges and explain why they vary — because fake certainty causes regret later.',
  },
  {
    icon: Eye,
    title: 'Transparency as a Feature',
    description: 'We tell you where our data comes from, what we estimate vs. know, and what we intentionally exclude.',
  },
];

const whatWeDo = [
  'Curate listings for quality and accuracy',
  'Provide Israel-specific calculations, not generic estimates',
  'Show you the full picture, including the uncomfortable parts',
  'Build tools that save you money and reduce anxiety',
  'Educate before we sell',
];

const whatWeDontDo = [
  'No paid ranking of listings',
  'No hidden agent incentives',
  'No pressure tactics or countdown timers',
  'No fake precision — we show ranges when appropriate',
  "No rushing you toward a decision you're not ready for",
];

export default function Principles() {
  return (
    <Layout>
      <div className="min-h-screen">
        {/* Hero Section - The Anchor Definition */}
        <section className="bg-gradient-to-b from-primary/5 to-background py-20 md:py-28">
          <div className="container">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-3xl mx-auto text-center"
            >
              <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-6 leading-tight">
                Clarity Before Commitment.
                <span className="text-primary block mt-2">Trust Before Action.</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                BuyWise Israel is the operating system for buying confidence in Israeli real estate — 
                designed for international buyers who need clarity before commitment, and trust before action.
              </p>
            </motion.div>
          </div>
        </section>

        {/* "We See You" Section - Emotional Acknowledgment */}
        <section className="py-16 md:py-20">
          <div className="container">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="max-w-4xl mx-auto"
            >
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-10 text-center">
                If This Sounds Familiar...
              </h2>
              
              <div className="grid md:grid-cols-3 gap-6 mb-10">
                {familiarFeelings.map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="h-full border-border/50 bg-muted/30">
                      <CardContent className="p-6">
                        <p className="text-muted-foreground text-center leading-relaxed italic">
                          "{item.feeling}"
                        </p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 rounded-xl p-6 md:p-8 border border-primary/20">
                  <p className="text-lg md:text-xl text-foreground font-medium leading-relaxed">
                    You're not behind. You're not stupid for feeling unsure.
                    <span className="block mt-2 text-primary">You're doing this right.</span>
                  </p>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* "What We Actually Are" Section */}
        <section className="py-16 bg-muted/30">
          <div className="container">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
                What BuyWise Actually Is
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                We're not a listings site. We're not a brokerage. We're not a lead-generation machine disguised as education.
              </p>
            </motion.div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
              {whatWeAre.map((item, index) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="h-full border-border/50 hover:border-primary/30 transition-colors text-center">
                    <CardContent className="p-6">
                      <div className="inline-flex p-3 rounded-xl bg-primary/10 mb-4">
                        <item.icon className="h-6 w-6 text-primary" />
                      </div>
                      <h3 className="font-semibold text-foreground mb-2">
                        {item.title}
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {item.description}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Core Principles */}
        <section className="py-16 md:py-20">
          <div className="container">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
                What We Believe
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                These aren't marketing slogans. They're constraints we build into every feature.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {principles.map((principle, index) => (
                <motion.div
                  key={principle.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="h-full border-border/50 hover:border-primary/30 transition-colors">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="p-2.5 rounded-lg bg-primary/10 shrink-0">
                          <principle.icon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground mb-2">
                            {principle.title}
                          </h3>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {principle.description}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* What We Do / Don't Do */}
        <section className="py-16 bg-muted/30">
          <div className="container">
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {/* What We Do */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <Card className="h-full">
                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      What We Do
                    </h3>
                    <ul className="space-y-3">
                      {whatWeDo.map((item) => (
                        <li key={item} className="flex items-start gap-3 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                          <span className="text-muted-foreground">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>

              {/* What We Don't Do */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <Card className="h-full">
                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                      <XCircle className="h-5 w-5 text-destructive" />
                      What We Don't Do
                    </h3>
                    <ul className="space-y-3">
                      {whatWeDontDo.map((item) => (
                        <li key={item} className="flex items-start gap-3 text-sm">
                          <XCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                          <span className="text-muted-foreground">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Our Relationship With Agents */}
        <section className="py-16 md:py-20">
          <div className="container">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="max-w-3xl mx-auto text-center"
            >
              <div className="inline-flex p-3 rounded-xl bg-primary/10 mb-6">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                We're Pro-Agent, Anti-Pressure
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                Agents are valuable. They're necessary. They're helpful — at the right moment.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                But our job is to delay that conversation until it reduces your anxiety, not increases it. 
                When you do talk to an agent through BuyWise, you'll be informed, calm, and ready — 
                which makes their job easier and your experience better.
              </p>
            </motion.div>
          </div>
        </section>

        {/* The Constraint */}
        <section className="py-16 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent">
          <div className="container">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="max-w-3xl mx-auto text-center"
            >
              <p className="text-xl md:text-2xl text-foreground font-medium leading-relaxed mb-6 italic">
                "We'd rather you take 6 months to feel ready than rush into a decision 
                you'll regret. There's no urgency here except yours."
              </p>
              <p className="text-muted-foreground leading-relaxed">
                This isn't just a promise — it's built into how the platform works. 
                You won't see countdown timers, fake scarcity, or pressure tactics. 
                We earn your trust first. Everything else comes later.
              </p>
            </motion.div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 md:py-20">
          <div className="container">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <h2 className="text-2xl font-bold text-foreground mb-4">
                Ready to explore at your own pace?
              </h2>
              <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
                Start with our tools, read some guides, or browse areas. 
                No account required, no pressure applied.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Button asChild size="lg">
                  <Link to="/tools" className="gap-2">
                    Explore Tools
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link to="/guides">Read Guides</Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>
      </div>
    </Layout>
  );
}
