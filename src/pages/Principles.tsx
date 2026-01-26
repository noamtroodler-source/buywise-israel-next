import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Layout } from '@/components/layout/Layout';
import { 
  Shield, 
  Clock, 
  Heart, 
  Eye,
  ArrowRight,
  Layers,
  Scale,
  Compass,
  Lightbulb,
  Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

// Updated to reflect decision clarity, not fear
const familiarFeelings = [
  {
    feeling: "You've found properties you like — but you're not sure what they really cost or whether the price makes sense.",
  },
  {
    feeling: "You're worried about making an expensive mistake in a system that works differently than what you're used to.",
  },
  {
    feeling: "You keep wondering whether you're actually ready to reach out — or if there's more you should understand first.",
  },
];

// Updated to match homepage value props
const whatWeAre = [
  {
    icon: Compass,
    title: 'Discovery, Made Clear',
    description: 'An English-first platform for internationals buying or renting in Israel. Clean, intuitive browsing across verified resale homes, rentals, and new projects.',
  },
  {
    icon: Layers,
    title: 'Context Built Into Every Listing',
    description: 'Real cost context and market insight — so you understand what a property actually costs and how it fits the market, not just its listing price.',
  },
  {
    icon: Lightbulb,
    title: 'Confidence Before Contact',
    description: 'Prepare for conversations with agents, brokers, or lawyers. Know what matters, what to ask, and where tradeoffs exist.',
  },
  {
    icon: Scale,
    title: 'Independent & Unbiased',
    description: "BuyWise is not a brokerage or commission-based platform. We don't profit from transactions — we focus on clarity, transparency, and helping users move forward on their own terms.",
  },
];

// Refined principles with small tweaks
const principles = [
  {
    icon: Heart,
    title: 'Trust Before Conversion',
    description: 'You should understand the market before you speak to anyone. Our role is to educate and clarify.',
  },
  {
    icon: Clock,
    title: 'Your Timeline, Not Ours',
    description: "We'd rather you take six months to feel ready than rush into a decision you'll regret. The only urgency that matters is yours.",
  },
  {
    icon: Shield,
    title: 'Honest Ranges, Not False Precision',
    description: 'Real estate is messy. We show ranges and explain why they vary — because false certainty often leads to regret later.',
  },
  {
    icon: Eye,
    title: 'Transparency as a Feature',
    description: "We tell you what we know, what we estimate, where data comes from — and what we intentionally don't claim to know.",
  },
];

export default function Principles() {
  return (
    <Layout>
      <div className="min-h-screen">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-primary/5 to-background py-20 md:py-28">
          <div className="container">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-3xl mx-auto text-center"
            >
              <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-6 leading-tight">
                Clarity Before Commitment.
                <span className="text-primary block mt-2">Confidence Before Action.</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                BuyWise Israel is an English-first real estate discovery and decision platform for internationals buying or renting in Israel — built to help you understand the market, compare options intelligently, and move forward with confidence.
              </p>
            </motion.div>
          </div>
        </section>

        {/* "We See You" Section */}
        <section className="py-6 md:py-8">
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
                    Taking time to understand is not a delay.
                    <span className="block mt-2 text-primary">It's how confident decisions are made.</span>
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
                BuyWise is an English-first discovery and decision platform for internationals buying or renting in Israel — designed to help you understand your options clearly and move forward with confidence.
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
                These aren't marketing slogans. They're principles we build into every feature.
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

        {/* Pro-Agent Section */}
        <section className="py-16 md:py-20 bg-muted/30">
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
                We're Pro-Agent. Pro-Professional. Anti-Pressure.
              </h2>
              <div className="space-y-4">
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Agents and professionals are valuable — and at the right moment, they're essential.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Our role isn't to replace them — it's to <span className="text-foreground font-medium">prepare you for them</span>.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  BuyWise helps you reach out when you feel ready — with better questions, clearer expectations, and less anxiety. That leads to better conversations and better outcomes for everyone involved.
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* The Promise */}
        <section className="py-16 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent">
          <div className="container">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="max-w-3xl mx-auto text-center"
            >
              <p className="text-xl md:text-2xl text-foreground font-medium leading-relaxed mb-6 italic">
                "We'd rather you take six months to feel ready than rush into a decision 
                you'll regret. There's no urgency here except yours."
              </p>
              <div className="space-y-2 text-muted-foreground leading-relaxed">
                <p>This isn't just a promise — it's built into how BuyWise works.</p>
                <p>You won't see fake scarcity, countdown timers, or pressure tactics.</p>
                <p className="text-foreground font-medium">We earn trust first. Everything else comes later.</p>
              </div>
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
                Explore at your own pace.
              </h2>
              <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
                Start with our tools, browse areas, or explore listings.
                <br />
                No account required. No pressure applied.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Button asChild size="lg">
                  <Link to="/tools" className="gap-2">
                    Explore Tools
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link to="/areas" className="gap-2">
                    Browse Areas
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>
      </div>
    </Layout>
  );
}