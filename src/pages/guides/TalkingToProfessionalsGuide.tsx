import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { DualNavigation } from '@/components/shared/DualNavigation';
import { 
  Users, 
  Clock, 
  BookOpen, 
  MessageSquare,
  Wallet,
  TrendingUp,
  CreditCard,
  Scale,
  FileText,
  Landmark,
  HelpCircle,
  CheckCircle2,
  Calculator,
  Lightbulb,
  ArrowLeft
} from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useTrackContentVisit } from '@/hooks/useTrackContentVisit';

const navSections = [
  { id: 'overview', label: 'Overview' },
  { id: 'why-pressured', label: 'Why It Feels Different' },
  { id: 'roles', label: 'The Roles' },
  { id: 'misinterpretations', label: 'Common Misreads' },
];

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
};

const pressureReasons = [
  {
    icon: Clock,
    title: 'Compressed deal timelines',
    description: 'Once a verbal agreement is reached, there is cultural momentum to formalize it quickly. Negotiations and signing happen within days rather than weeks.'
  },
  {
    icon: Wallet,
    title: 'Commission timing',
    description: 'Agents are paid when the contract is signed, not at closing. This means they have an incentive to move the process quickly from offer to signing.'
  },
  {
    icon: TrendingUp,
    title: 'Fast market pace',
    description: 'Limited housing supply and high demand mean desirable properties can attract multiple buyers simultaneously. Agents emphasize speed to prevent losing a deal.'
  },
  {
    icon: MessageSquare,
    title: 'Verbal commitments carry weight',
    description: 'Verbal or informal agreements can be treated seriously, so conversations may feel like they have legal implications even before anything is signed.'
  },
  {
    icon: CreditCard,
    title: 'No financing contingency',
    description: 'Mortgages are typically approved after the contract is signed. Without a financing escape clause, buyers face pressure to commit before final loan terms are known.'
  },
  {
    icon: Users,
    title: 'Agent dual representation',
    description: 'Agents may work with both buyer and seller, creating a sense of divided loyalty and urgency, though this is common practice and not necessarily deceptive.'
  }
];

const agentDetails = {
  whatTheyDo: [
    'Locate properties and schedule viewings',
    'Facilitate negotiations between parties',
    'Maintain private networks and local advertising',
    'Focus on property desirability and market demand'
  ],
  howRepresentation: [
    'Agents often represent the seller and may also assist the buyer',
    'Each side usually pays its own agent a commission',
    'Dual representation is permitted',
    'No standard buyer-agent contract like in some markets'
  ],
  compensation: [
    'Commission is typically a percentage of the purchase price',
    'Paid by each party when the contract is signed',
    'Payment tied to signing rather than closing'
  ],
  whySalesOriented: [
    'Agents are motivated to close deals quickly',
    'May emphasize positive features and urgency',
    'Cannot draft contracts or conduct legal checks',
    'Rely on lawyers to handle legal details'
  ]
};

const lawyerDetails = {
  responsible: [
    'Due diligence on property ownership, liens and permits',
    'Draft and negotiate contracts',
    'File purchase tax declarations',
    'Handle registration at the land registry',
    'Represent the buyer\'s legal interests',
    'Verify the property has proper building permits (Heter B\'nia) and occupancy permits (Tofes 4)',
    'Hold funds in escrow until seller produces tax clearance certificates and municipal approvals'
  ],
  notResponsible: [
    'Search for properties',
    'Negotiate price (beyond legal terms)',
    'Arrange financing',
    'Inspect physical conditions',
    'Guarantee mortgage approval or market value'
  ]
};

const mortgageDetails = {
  timeline: [
    'Mortgage discussions often begin after the contract is signed',
    'Banks require a signed contract and property appraisal before issuing final approval',
    'Pre-approval letters exist, but are indicative rather than binding',
    'Mortgage approval for foreigners takes about 4–6 weeks'
  ],
  whyLater: [
    'No financing contingency in typical Israeli contracts',
    'Buyers commit to the purchase, then secure their loan',
    'Banks assess the property and buyer concurrently'
  ]
};

const misinterpretations = [
  {
    title: 'Taking statements at face value',
    description: 'Professionals may speak decisively or cite "standard practice," but timelines, approvals, and norms vary by city, property type, and bank. Confidence doesn\'t guarantee certainty.'
  },
  {
    title: 'Assuming verbal statements are informal',
    description: 'In Israel, verbal or WhatsApp agreements can carry weight and create expectations.'
  },
  {
    title: 'Expecting professionals to coordinate',
    description: 'Agents, lawyers, and banks operate in parallel with different incentives. They don\'t automatically share information or align on advice—you may need to relay details between them.'
  },
  {
    title: 'Expecting financing to be secured first',
    description: 'Unlike some countries, mortgage approval generally follows contract signing.'
  },
  {
    title: 'Believing agents represent only you',
    description: 'Dual or multiple representation is common and legal; agents may show the same property to several buyers.'
  },
  {
    title: 'Assuming the lawyer\'s role is limited to closing',
    description: 'Lawyers are involved from the outset to conduct due diligence and draft the contract.'
  },
  {
    title: 'Confusing directness with rudeness',
    description: 'Direct communication and urgent tone are cultural norms, not hostility. Costs and taxes may not be mentioned by agents—those are handled by lawyers and banks.'
  }
];

export default function TalkingToProfessionalsGuide() {
  useTrackContentVisit('guide');
  const [showNav, setShowNav] = useState(false);
  const [activeSection, setActiveSection] = useState('overview');

  useEffect(() => {
    const handleScroll = () => {
      setShowNav(window.scrollY > 300);
      
      const sections = navSections.map(s => document.getElementById(s.id));
      const scrollPos = window.scrollY + 150;
      
      for (let i = sections.length - 1; i >= 0; i--) {
        const section = sections[i];
        if (section && section.offsetTop <= scrollPos) {
          setActiveSection(navSections[i].id);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 100;
      const top = element.offsetTop - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  };

  return (
    <Layout>
      {/* Sticky Navigation */}
      <motion.div
        initial={{ y: -100 }}
        animate={{ y: showNav ? 0 : -100 }}
        className="fixed top-16 left-0 right-0 z-40 bg-background/95 backdrop-blur-sm border-b shadow-sm"
      >
        <div className="container py-3">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
            {navSections.map((section) => (
              <button
                key={section.id}
                onClick={() => scrollToSection(section.id)}
                className={cn(
                  "px-3 py-1.5 text-sm font-medium rounded-full whitespace-nowrap transition-colors",
                  activeSection === section.id
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                {section.label}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-primary/3 to-transparent" />
        <div className="container relative py-12 md:py-16">
          <DualNavigation
            parentLabel="All Guides"
            parentPath="/guides"
            className="mb-4"
          />
          <motion.div {...fadeInUp} className="max-w-3xl mx-auto text-center">
            <Badge variant="secondary" className="mb-4">
              <Users className="h-3 w-3 mr-1" />
              Essential Guide
            </Badge>
            
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-3">
              What to Know Before Talking to an Agent, Lawyer, or Broker
            </h1>
            
            <p className="text-muted-foreground text-lg mb-6">
              Understand roles, incentives, and timing before your first conversation
            </p>
            
            <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <BookOpen className="h-4 w-4" />
                4 sections
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                ~15 min read
              </span>
              <span>Updated 2026</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Overview */}
      <section id="overview" className="container py-16">
        <motion.div {...fadeInUp} className="max-w-3xl mx-auto">
          <p className="text-lg text-muted-foreground leading-relaxed">
            Israeli real estate professionals—agents, lawyers, and mortgage advisors—operate on different incentives and timelines than what international buyers expect. Agents are paid at contract signing, not closing. Lawyers are involved from day one, not just at the end. And mortgage approval typically comes <em>after</em> you've already committed to the purchase. None of this is adversarial—it's just how the system works. This guide maps those differences so you're not caught off guard.
          </p>
        </motion.div>
      </section>

      {/* Why Conversations Can Feel Pressured */}
      <section id="why-pressured" className="container pb-16">
        <motion.div {...fadeInUp} className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-foreground mb-2 text-center">
            Why Conversations in Israel Can Feel Pressured
          </h2>
          <p className="text-muted-foreground text-center mb-8 max-w-2xl mx-auto">
            Understanding these factors helps you interpret the pace and tone of professional interactions
          </p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pressureReasons.map((reason, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="p-5 rounded-xl bg-card border hover:border-primary/20 transition-colors"
              >
                <reason.icon className="h-5 w-5 text-primary mb-3" />
                <h3 className="font-semibold text-foreground mb-2 text-sm">{reason.title}</h3>
                <p className="text-sm text-muted-foreground">{reason.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* The Roles */}
      <section id="roles" className="container pb-16">
        <motion.div {...fadeInUp} className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-foreground mb-2 text-center">
            The Roles, Clearly Explained
          </h2>
          <p className="text-muted-foreground text-center mb-8 max-w-2xl mx-auto">
            What each professional does—and doesn't do—in an Israeli transaction
          </p>
          
          {/* Real Estate Agents */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground">Real Estate Agents</h3>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-5 rounded-xl bg-muted/30 border">
                <h4 className="font-medium text-foreground mb-3 text-sm">What They Typically Do</h4>
                <ul className="space-y-2">
                  {agentDetails.whatTheyDo.map((item, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="p-5 rounded-xl bg-muted/30 border">
                <h4 className="font-medium text-foreground mb-3 text-sm">How Representation Works</h4>
                <ul className="space-y-2">
                  {agentDetails.howRepresentation.map((item, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="p-5 rounded-xl bg-muted/30 border">
                <h4 className="font-medium text-foreground mb-3 text-sm">How & When Compensated</h4>
                <ul className="space-y-2">
                  {agentDetails.compensation.map((item, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="p-5 rounded-xl bg-muted/30 border">
                <h4 className="font-medium text-foreground mb-3 text-sm">Why Conversations Feel Sales-Oriented</h4>
                <ul className="space-y-2">
                  {agentDetails.whySalesOriented.map((item, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-4 p-5 rounded-xl bg-muted/30 border">
              <h4 className="font-medium text-foreground mb-3 text-sm">What a Good Agent Brings to the Table</h4>
              <ul className="space-y-2">
                <li className="text-sm text-muted-foreground flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                  Cross-references comparable sales from the tax authority, local MLS systems, and their own recent transactions in the area
                </li>
                <li className="text-sm text-muted-foreground flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                  Can explain why two similar properties sold for different prices — contextual insight that data alone won't reveal
                </li>
                <li className="text-sm text-muted-foreground flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                  Finds the balance between showing you "enough but not too many" properties — an experienced agent narrows the field efficiently
                </li>
              </ul>
            </div>
          </div>

          {/* Lawyers */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-primary/10">
                <Scale className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground">Lawyers (Attorneys)</h3>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-5 rounded-xl bg-muted/30 border">
                <h4 className="font-medium text-foreground mb-3 text-sm">What They ARE Responsible For</h4>
                <ul className="space-y-2">
                  {lawyerDetails.responsible.map((item, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="p-5 rounded-xl bg-muted/30 border">
                <h4 className="font-medium text-foreground mb-3 text-sm">What They Are NOT Responsible For</h4>
                <ul className="space-y-2">
                  {lawyerDetails.notResponsible.map((item, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                      <HelpCircle className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            
            <div className="mt-4 p-5 rounded-xl bg-primary/5 border border-primary/10">
              <div className="flex gap-3">
                <Lightbulb className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-foreground mb-1 text-sm">Why Their Role Is Critical Early On</h4>
                  <p className="text-sm text-muted-foreground">
                    Because verbal agreements can create pressure and preliminary documents may be binding, involving a lawyer before signing anything helps avoid unintended commitments. The lawyer's early title and permit checks ensure the property can legally be sold.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 p-5 rounded-xl bg-muted/30 border">
              <h4 className="font-medium text-foreground mb-3 text-sm">How to Choose the Right Attorney</h4>
              <ul className="space-y-2">
                <li className="text-sm text-muted-foreground flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                  <span><strong>Specialization:</strong> Real estate law is not general law — tax rules and contract requirements change frequently and require dedicated expertise</span>
                </li>
                <li className="text-sm text-muted-foreground flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                  <span><strong>Local knowledge:</strong> A locally-based attorney can expedite due diligence by knowing the right municipal contacts and understanding local registration types like church leases</span>
                </li>
                <li className="text-sm text-muted-foreground flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                  <span><strong>Foreign buyer experience:</strong> Critical for opening escrow accounts, transferring money internationally, and navigating tax regulations for non-residents</span>
                </li>
                <li className="text-sm text-muted-foreground flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                  <span><strong>English-speaking ability:</strong> Essential for international buyers to fully understand contract terms and legal implications</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Mortgage Brokers / Banks */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-primary/10">
                <Landmark className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground">Mortgage Brokers / Banks</h3>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-5 rounded-xl bg-muted/30 border">
                <h4 className="font-medium text-foreground mb-3 text-sm">Where They Fit in the Timeline</h4>
                <ul className="space-y-2">
                  {mortgageDetails.timeline.map((item, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="p-5 rounded-xl bg-muted/30 border">
                <h4 className="font-medium text-foreground mb-3 text-sm">Why Mortgage Clarity Comes Later</h4>
                <ul className="space-y-2">
                  {mortgageDetails.whyLater.map((item, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-4 p-4 rounded-xl bg-primary/5 border border-primary/10">
              <div className="flex gap-3 items-center">
                <Lightbulb className="h-5 w-5 text-primary flex-shrink-0" />
                <p className="text-sm text-muted-foreground">
                  Eligibility rules, required documents, and terms vary significantly by residency status and bank.{' '}
                  <Link to="/guides/mortgages" className="text-primary font-medium hover:underline">
                    See our Mortgage Guide for full details →
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Where Buyers Misinterpret */}
      <section id="misinterpretations" className="container pb-16">
        <motion.div {...fadeInUp} className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-foreground mb-2 text-center">
            Common Misreads by International Buyers
          </h2>
          <p className="text-muted-foreground text-center mb-8 max-w-2xl mx-auto">
            Assumptions that lead to confusion or frustration
          </p>
          
          <div className="grid md:grid-cols-2 gap-4">
            {misinterpretations.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.03 }}
                className="p-5 rounded-xl bg-muted/30 border"
              >
                <div className="flex items-start gap-3">
                  <div className="p-1.5 rounded-full bg-primary/10 flex-shrink-0">
                    <span className="text-xs font-bold text-primary w-5 h-5 flex items-center justify-center">
                      {index + 1}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground mb-1 text-sm">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Bottom CTAs */}
      <section className="container pb-16">
        <motion.div {...fadeInUp} className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-3 gap-4">
            <Link 
              to="/tools"
              className="p-6 rounded-xl bg-card border hover:border-primary/30 transition-colors group"
            >
              <Calculator className="h-6 w-6 text-primary mb-3" />
              <h3 className="font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                Run the Numbers
              </h3>
              <p className="text-sm text-muted-foreground">
                Use our calculators to estimate your true costs before speaking to professionals.
              </p>
            </Link>
            
            <Link 
              to="/guides"
              className="p-6 rounded-xl bg-card border hover:border-primary/30 transition-colors group"
            >
              <BookOpen className="h-6 w-6 text-primary mb-3" />
              <h3 className="font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                Explore More Guides
              </h3>
              <p className="text-sm text-muted-foreground">
                Deep-dive into purchase tax, listings terminology, and more.
              </p>
            </Link>
            
            <Link 
              to="/glossary"
              className="p-6 rounded-xl bg-card border hover:border-primary/30 transition-colors group"
            >
              <FileText className="h-6 w-6 text-primary mb-3" />
              <h3 className="font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                Hebrew Terms Glossary
              </h3>
              <p className="text-sm text-muted-foreground">
                Learn the terms you'll encounter in conversations with professionals.
              </p>
            </Link>
          </div>
        </motion.div>
      </section>
    </Layout>
  );
}
