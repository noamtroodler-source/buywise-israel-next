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
  Home
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const principles = [
  {
    icon: Shield,
    title: 'Trust Before Conversion',
    description: 'We believe you should feel confident before you ever talk to anyone. Our job is to educate, not pressure.',
  },
  {
    icon: Clock,
    title: 'Your Timeline, Not Ours',
    description: "We'd rather you take 6 months to feel ready than rush into a bad decision. There's no urgency here except yours.",
  },
  {
    icon: Heart,
    title: 'Honest Ranges, Not False Precision',
    description: 'Real estate is messy. We show you ranges and explain why they vary, because fake certainty causes regret later.',
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
  'Educate before we sell',
  'Build tools that save you money and time',
  'Show you the full picture, including the uncomfortable parts',
];

const whatWeDontDo = [
  'No paid ranking of listings',
  'No hidden agent incentives',
  'No pressure tactics or aggressive pop-ups',
  'No fake precision — we show ranges when appropriate',
  "No rushing you toward a decision you're not ready for",
];

export default function Principles() {
  return (
    <Layout>
      <div className="min-h-screen">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-primary/5 to-background py-16 md:py-24">
          <div className="container">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-3xl mx-auto text-center"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
                <Home className="h-4 w-4" />
                Our Philosophy
              </div>
              <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-6">
                How We Think About
                <span className="text-primary"> Helping You Buy</span>
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Most real estate platforms are built around converting visitors into leads as fast as possible. 
                We're building something different — a platform where you feel informed and confident 
                before you ever speak to anyone.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Core Principles */}
        <section className="py-16">
          <div className="container">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
                Our Four Principles
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

        {/* The Constraint */}
        <section className="py-16">
          <div className="container">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="max-w-2xl mx-auto text-center"
            >
              <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent rounded-2xl p-8 md:p-12 border border-primary/20">
                <h2 className="text-xl md:text-2xl font-bold text-foreground mb-4">
                  Our Constraint
                </h2>
                <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                  "We'd rather you take 6 months to feel ready than rush into a decision 
                  you'll regret. There's no urgency here except yours."
                </p>
                <p className="text-sm text-muted-foreground">
                  This isn't just a promise — it's built into how the platform works. 
                  You won't see countdown timers, fake scarcity, or pressure tactics.
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 bg-muted/30">
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
