import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, Users, Globe, BarChart3, CheckCircle, 
  ArrowRight, Sparkles, Shield, Eye, MessageSquare
} from 'lucide-react';

const benefits = [
  {
    icon: Globe,
    title: 'Reach Anglo Buyers',
    description: 'Connect with English-speaking buyers actively searching for new construction in Israel.',
  },
  {
    icon: Eye,
    title: 'Premium Visibility',
    description: 'Your projects featured prominently with professional presentation and verified status.',
  },
  {
    icon: BarChart3,
    title: 'Detailed Analytics',
    description: 'Track views, inquiries, and buyer interest with comprehensive performance data.',
  },
  {
    icon: MessageSquare,
    title: 'Direct Inquiries',
    description: 'Receive qualified leads directly from interested buyers through our platform.',
  },
  {
    icon: Shield,
    title: 'Verified Badge',
    description: 'Build trust with buyers through our verification process and professional profile.',
  },
  {
    icon: Users,
    title: 'Project Management',
    description: 'Easy-to-use dashboard to manage all your projects, units, and buyer communications.',
  },
];

const steps = [
  {
    number: '1',
    title: 'Register Your Company',
    description: 'Create your developer profile with company details, logo, and description.',
  },
  {
    number: '2',
    title: 'Get Verified',
    description: 'Our team reviews and verifies your company to ensure quality listings.',
  },
  {
    number: '3',
    title: 'Add Projects',
    description: 'List your new construction projects with photos, pricing, and amenities.',
  },
  {
    number: '4',
    title: 'Connect with Buyers',
    description: 'Receive inquiries and manage leads through your dedicated dashboard.',
  },
];

export default function ForDevelopers() {
  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-b from-primary/5 to-background overflow-hidden">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl mx-auto text-center space-y-6"
          >
            <Badge className="bg-primary/10 text-primary border-primary/20">
              <Sparkles className="h-3 w-3 mr-1" />
              For Developers
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground">
              Showcase Your Projects to{' '}
              <span className="text-primary">Anglo Buyers</span>
            </h1>
            <p className="text-xl text-muted-foreground">
              List your new construction projects on Israel's premier English-language 
              real estate platform. Reach motivated buyers actively searching for their 
              next home.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button size="lg" asChild>
                <Link to="/developer/register">
                  Register as Developer
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/projects">
                  View Projects
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Benefits Grid */}
      <section className="py-16">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Why List With BuyWise Israel?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Join leading developers who trust our platform to connect them with 
              qualified buyers in the Anglo community.
            </p>
          </motion.div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {benefits.map((benefit, index) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                      <benefit.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">{benefit.title}</h3>
                    <p className="text-sm text-muted-foreground">{benefit.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-muted/30">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-foreground mb-4">
              How It Works
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Getting started is simple. Register, get verified, and start receiving inquiries.
            </p>
          </motion.div>

          <div className="grid gap-8 md:grid-cols-4">
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="relative"
              >
                <div className="text-center">
                  <div className="h-14 w-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold mx-auto mb-4">
                    {step.number}
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-7 left-[60%] w-[80%] border-t-2 border-dashed border-border" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16">
        <div className="container">
          <div className="grid gap-8 md:grid-cols-3 text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
            >
              <p className="text-4xl font-bold text-primary mb-2">1000+</p>
              <p className="text-muted-foreground">Active Buyers Monthly</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              <p className="text-4xl font-bold text-primary mb-2">50+</p>
              <p className="text-muted-foreground">Cities Covered</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <p className="text-4xl font-bold text-primary mb-2">100%</p>
              <p className="text-muted-foreground">English Platform</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary/5">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-2xl mx-auto text-center space-y-6"
          >
            <Building2 className="h-12 w-12 text-primary mx-auto" />
            <h2 className="text-3xl font-bold text-foreground">
              Ready to Get Started?
            </h2>
            <p className="text-muted-foreground">
              Join our platform today and start connecting with buyers looking for 
              new construction projects in Israel.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link to="/developer/register">
                  Register Your Company
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/contact">Contact Us</Link>
              </Button>
            </div>
            <p className="text-sm text-muted-foreground pt-4">
              Already registered?{' '}
              <Link to="/auth" className="text-primary hover:underline">
                Sign in to your dashboard
              </Link>
            </p>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
}
