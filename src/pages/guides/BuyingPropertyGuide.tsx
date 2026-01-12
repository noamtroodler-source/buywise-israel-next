import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  MapPin, Clock, BookOpen, Users, FileText, AlertTriangle, 
  Lightbulb, CheckCircle2, ArrowRight, Scale, Building2, 
  Landmark, Home, Banknote, Key, ClipboardCheck, Calculator,
  Globe, Gavel, FileWarning, Calendar, Receipt, Shield
} from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

// Animation variants
const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
};

// Data: Big Picture insights
const bigPictureInsights = [
  { icon: MapPin, text: "No single 'MLS' — listings are fragmented and inconsistent" },
  { icon: Gavel, text: "Lawyers are central to the transaction — more so than agents" },
  { icon: AlertTriangle, text: "Verbal understandings can turn into pressure quickly" },
  { icon: FileWarning, text: "Some preliminary documents feel informal but carry real risk" },
  { icon: Banknote, text: "Mortgages usually finalize after contract signing, not before" },
  { icon: Calendar, text: "Payments happen in stages, not all at closing" },
  { icon: ClipboardCheck, text: "Ownership is proven by registration, which can happen long after keys" },
  { icon: Receipt, text: "Taxes and fees are procedural gatekeepers, not side details" },
  { icon: FileText, text: "Hebrew contracts control, even if an English translation exists" },
  { icon: Clock, text: "The biggest risks are timing mismatches and assumptions from abroad" },
];

// Data: Glossary terms
const glossaryTerms = [
  { hebrew: "טאבו", english: "Tabu", definition: "Israel's Land Registry; the strongest form of ownership registration" },
  { hebrew: "מנהל", english: "Minhal / ILA", definition: "Israel Land Authority; manages most state-owned land" },
  { hebrew: "הערת אזהרה", english: "He'arat Azhara", definition: "A warning note registered to protect buyer rights before final registration" },
  { hebrew: "זיכרון דברים", english: "Zichron Devarim", definition: "A memorandum of understanding; informal in tone, sometimes risky in effect" },
  { hebrew: "משכנתא", english: "Mashkanta", definition: "Mortgage" },
  { hebrew: "מס רכישה", english: "Mas Rechisha", definition: "Purchase tax" },
  { hebrew: "ועד בית", english: "Va'ad Bayit", definition: "Building committee and shared maintenance fees" },
  { hebrew: "ארנונה", english: "Arnona", definition: "Municipal property tax" },
  { hebrew: "טופס 4", english: "Tofes 4", definition: "Occupancy permit for new construction" },
  { hebrew: "מפרט", english: "Mifrat", definition: "Technical specification attached to developer contracts" },
  { hebrew: "חברת משכן", english: "Chevrat Mishkan", definition: "Housing company that may hold registration instead of Tabu" },
  { hebrew: "היטל השבחה", english: "Hetel Hashbacha", definition: "Betterment levy tied to zoning value increases" },
];

// Data: Timeline stages
const timelineStages = [
  {
    number: 1,
    title: "Early Discovery & Narrowing",
    whatHappens: "You browse listings across multiple platforms, neighborhoods, and agents. Prices are often not standardized.",
    whoInvolved: ["Buyer"],
    documents: "None",
    risks: ["Assuming listings are complete or accurate", "Anchoring on price without understanding legal status or costs"],
    insight: null,
    insightType: null,
    buyWiseHelp: "How to interpret listings in context, not in isolation."
  },
  {
    number: 2,
    title: "Engaging an Agent (Optional)",
    whatHappens: "You may work with one or more agents. Dual representation is common.",
    whoInvolved: ["Buyer", "Seller", "Agent(s)"],
    documents: "Brokerage agreement (sometimes)",
    risks: ["Assuming the agent represents only you", "Not realizing commissions may be embedded in price"],
    insight: "Unlike the US, buyer representation is not standard or exclusive.",
    insightType: "comparison"
  },
  {
    number: 3,
    title: "Attorney Engagement (Early)",
    whatHappens: "A lawyer begins checking ownership, liens, permits, and land status.",
    whoInvolved: ["Buyer's Lawyer"],
    documents: "Power of attorney, ID copies",
    risks: ["Involving a lawyer too late", "Assuming 'it's standard' means 'it's safe'"],
    insight: "In Israel, legal due diligence is the backbone of the deal.",
    insightType: "reality"
  },
  {
    number: 4,
    title: "Negotiation & Informal Commitments",
    whatHappens: "Price and terms are discussed. Pressure to 'lock it in' may appear.",
    whoInvolved: ["Buyer", "Seller", "Agent(s)"],
    documents: "Texts, emails, sometimes a Zichron Devarim",
    risks: ["Signing something 'temporary'", "Paying deposits before clarity"],
    insight: "Treating early documents as harmless placeholders.",
    insightType: "mistake"
  },
  {
    number: 5,
    title: "Offer → Contract",
    whatHappens: "Lawyers negotiate the binding purchase contract.",
    whoInvolved: ["Both Lawyers", "Buyer", "Seller"],
    documents: "Purchase contract (Hebrew)",
    risks: ["Not understanding timing dependencies", "Assuming mortgage approval is guaranteed"],
    insight: null,
    insightType: null
  },
  {
    number: 6,
    title: "Mortgage Path (If Applicable)",
    whatHappens: "Banks issue approvals after contract, based on property and buyer profile.",
    whoInvolved: ["Bank", "Appraiser", "Buyer"],
    documents: "Mortgage approval, appraiser report",
    risks: ["Approval delays vs payment deadlines", "Bank-specific conditions"],
    insight: "Approval timing varies significantly by bank.",
    insightType: "reality"
  },
  {
    number: 7,
    title: "Inspections & Engineer Checks",
    whatHappens: "A building engineer inspects condition and compliance.",
    whoInvolved: ["Engineer", "Buyer"],
    documents: "Inspection report",
    risks: ["Skipping inspection", "Discovering issues after contract"],
    insight: null,
    insightType: null
  },
  {
    number: 8,
    title: "Payment Schedule",
    whatHappens: "Payments are made in tranches over time.",
    whoInvolved: ["Buyer", "Seller", "Bank", "Lawyer"],
    documents: "Bank guarantees (new builds), receipts",
    risks: ["Currency timing risk", "Missing a procedural step that blocks registration"],
    insight: null,
    insightType: null
  },
  {
    number: 9,
    title: "Closing & Key Handover",
    whatHappens: "Final payment is made; keys are delivered.",
    whoInvolved: ["Buyer", "Seller", "Lawyers"],
    documents: "Closing confirmations",
    risks: ["Assuming ownership is finalized at keys"],
    insight: null,
    insightType: null
  },
  {
    number: 10,
    title: "Registration (Often After)",
    whatHappens: "Ownership is registered in Tabu, Minhal, or a housing company.",
    whoInvolved: ["Lawyer", "Registries"],
    documents: "Registration filings",
    risks: ["Long delays", "Not tracking registration status"],
    insight: null,
    insightType: null
  },
  {
    number: 11,
    title: "Post-Purchase Basics",
    whatHappens: "Transfer Arnona, join Va'ad Bayit, set up utilities, obtain insurance.",
    whoInvolved: ["Buyer"],
    documents: "Various applications",
    risks: ["Missing deadlines", "Not understanding ongoing obligations"],
    insight: null,
    insightType: null
  },
];

// Data: Surprises
const surprises = [
  "No centralized listing system",
  "Lawyers drive the deal, not escrow companies",
  "Early documents can create pressure",
  "Hebrew governs legally",
  "Mortgages finalize late",
  "Registration ≠ keys",
  "Taxes block registration",
  "State land is normal",
  "Timelines are non-linear",
  "'Standard' varies by city",
];

// Data: Decision points
const decisionPoints = [
  { title: "Agent vs no agent", description: "Agents can access more listings but remember dual representation is common" },
  { title: "One agent vs many", description: "Working with multiple agents is acceptable in Israel, unlike other markets" },
  { title: "When to involve a lawyer", description: "Earlier is almost always better — ideally before any written commitments" },
  { title: "Whether to sign early documents", description: "Even informal documents can create obligations; understand before signing" },
  { title: "Fixed vs flexible payment schedules", description: "Payment timing affects your cash flow and currency risk" },
  { title: "Mortgage vs cash timing", description: "Cash buyers have negotiating leverage; mortgages add complexity" },
  { title: "New build vs resale", description: "Different payment structures, timelines, and risk profiles" },
  { title: "Registration type tolerance", description: "Tabu is strongest; understand alternatives before accepting them" },
];

// Data: Readiness checklist
const readinessChecklist = [
  "I understand who represents whom",
  "I know what proves ownership",
  "I know when mortgage approval happens",
  "I understand payment staging",
  "I know which costs block registration",
  "I know what Zichron Devarim is",
  "I know which version of the contract controls",
  "I understand land type differences",
  "I know what happens after keys",
  "I know where timing mismatches occur",
  "I can explain the sequence start to finish",
];

// Participant badge component
const ParticipantBadge = ({ participant }: { participant: string }) => (
  <Badge variant="secondary" className="text-xs">
    {participant}
  </Badge>
);

// Stage card component
const StageCard = ({ stage, index }: { stage: typeof timelineStages[0]; index: number }) => (
  <motion.div
    initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
    whileInView={{ opacity: 1, x: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5, delay: 0.1 }}
    className="relative"
  >
    {/* Connector line */}
    {index < timelineStages.length - 1 && (
      <div className="absolute left-6 top-16 bottom-0 w-px border-l-2 border-dashed border-border hidden md:block" style={{ height: 'calc(100% + 2rem)' }} />
    )}
    
    <Card className="p-6 border-border/50 hover:border-primary/30 transition-colors">
      <div className="flex items-start gap-4">
        {/* Stage number */}
        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg">
          {stage.number}
        </div>
        
        <div className="flex-1 space-y-4">
          {/* Title */}
          <h3 className="text-xl font-semibold text-foreground">{stage.title}</h3>
          
          {/* What happens */}
          <p className="text-muted-foreground">{stage.whatHappens}</p>
          
          {/* Who's involved */}
          <div className="flex flex-wrap gap-2">
            <span className="text-sm font-medium text-foreground mr-2">Who's involved:</span>
            {stage.whoInvolved.map((participant) => (
              <ParticipantBadge key={participant} participant={participant} />
            ))}
          </div>
          
          {/* Documents */}
          {stage.documents && stage.documents !== "None" && (
            <div className="flex items-start gap-2 text-sm">
              <FileText className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <span className="text-muted-foreground">{stage.documents}</span>
            </div>
          )}
          
          {/* Risks */}
          {stage.risks.length > 0 && (
            <div className="p-4 rounded-lg bg-muted/50 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-foreground">What can go wrong</span>
              </div>
              <ul className="space-y-1">
                {stage.risks.map((risk, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-primary">•</span>
                    {risk}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Insight */}
          {stage.insight && (
            <div className={`p-4 rounded-lg border ${
              stage.insightType === 'comparison' ? 'bg-primary/5 border-primary/20' :
              stage.insightType === 'mistake' ? 'bg-muted border-border' :
              'bg-primary/5 border-primary/20'
            }`}>
              <div className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-primary flex-shrink-0" />
                <span className="text-sm font-medium text-foreground">
                  {stage.insightType === 'comparison' ? 'Israel vs Back Home' :
                   stage.insightType === 'mistake' ? 'Common Mistake' :
                   'BuyWise Reality Check'}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">{stage.insight}</p>
            </div>
          )}
          
          {/* BuyWise help */}
          {stage.buyWiseHelp && (
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
              <p className="text-sm text-primary font-medium">
                What BuyWise helps you understand here: {stage.buyWiseHelp}
              </p>
            </div>
          )}
        </div>
      </div>
    </Card>
  </motion.div>
);

export default function BuyingPropertyGuide() {
  return (
    <Layout>
      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
          <div className="container relative py-16 md:py-24">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center max-w-3xl mx-auto"
            >
              <Badge variant="secondary" className="mb-4">
                Complete Guide
              </Badge>
              <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
                Buying a Property in Israel
              </h1>
              <p className="text-xl text-muted-foreground mb-2">
                A Start-to-Finish Map for International Buyers
              </p>
              <p className="text-lg text-primary font-medium mb-6">
                Clarity Before Commitment
              </p>
              <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <BookOpen className="h-4 w-4" />
                  11 stages
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  25 min read
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  Updated 2025
                </span>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Opener Section */}
        <section className="container py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto"
          >
            <div className="grid md:grid-cols-3 gap-4 mb-8">
              {[
                "The system uses unfamiliar terms",
                "Moves faster in some moments than others",
                "Often assumes local knowledge you don't have"
              ].map((pain, index) => (
                <Card key={index} className="p-4 border-border/50 bg-muted/30">
                  <p className="text-sm text-muted-foreground text-center">{pain}</p>
                </Card>
              ))}
            </div>
            
            <div className="p-6 rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 text-center">
              <p className="text-foreground">
                This guide maps the full process from early discovery to post-purchase realities, 
                <span className="font-medium text-primary"> in plain English</span>, so you can understand 
                the sequence, the pressure points, and where people commonly get trapped — 
                <span className="font-medium"> before you speak to agents, lawyers, or banks</span>.
              </p>
            </div>
          </motion.div>
        </section>

        {/* Big Picture Section */}
        <section className="py-16 bg-muted/30">
          <div className="container">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-10"
            >
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                The Big Picture in 60 Seconds
              </h2>
              <p className="text-muted-foreground">What every international buyer should know upfront</p>
            </motion.div>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4 max-w-6xl mx-auto">
              {bigPictureInsights.map((insight, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="p-4 h-full border-border/50 hover:border-primary/30 transition-colors">
                    <div className="flex flex-col items-center text-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <insight.icon className="h-5 w-5 text-primary" />
                      </div>
                      <p className="text-sm text-muted-foreground">{insight.text}</p>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Glossary Section */}
        <section className="container py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              Essential Israeli Terms
            </h2>
            <p className="text-muted-foreground">
              Words you'll hear throughout the process
            </p>
          </motion.div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-w-6xl mx-auto">
            {glossaryTerms.map((term, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.03 }}
              >
                <Card className="p-4 h-full border-border/50 hover:border-primary/30 transition-colors">
                  <div className="space-y-2">
                    <div className="flex items-baseline gap-2">
                      <span className="text-lg font-semibold text-foreground">{term.english}</span>
                      <span className="text-sm text-muted-foreground" dir="rtl">{term.hebrew}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{term.definition}</p>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
          
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mt-8"
          >
            <Link to="/glossary" className="text-sm font-medium text-primary hover:underline">
              View Full Glossary →
            </Link>
          </motion.div>
        </section>

        {/* Timeline Section */}
        <section className="py-16 bg-muted/30">
          <div className="container">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                The Step-by-Step Timeline
              </h2>
              <p className="text-muted-foreground">From first search to final registration</p>
            </motion.div>
            
            <div className="max-w-3xl mx-auto space-y-8">
              {timelineStages.map((stage, index) => (
                <StageCard key={stage.number} stage={stage} index={index} />
              ))}
            </div>
          </div>
        </section>

        {/* Surprises Section */}
        <section className="container py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              Where International Buyers Get Surprised
            </h2>
            <p className="text-muted-foreground">Expectations that don't match Israeli reality</p>
          </motion.div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4 max-w-5xl mx-auto">
            {surprises.map((surprise, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="p-4 text-center border-border/50 hover:border-primary/30 transition-colors h-full flex items-center justify-center">
                  <p className="text-sm font-medium text-foreground">{surprise}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Decision Points Section */}
        <section className="py-16 bg-muted/30">
          <div className="container">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-10"
            >
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                Key Decision Points
              </h2>
              <p className="text-muted-foreground">Tradeoffs to consider, not advice to follow</p>
            </motion.div>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
              {decisionPoints.map((point, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="p-5 h-full border-border/50 hover:border-primary/30 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
                        <Scale className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-medium text-foreground mb-1">{point.title}</h4>
                        <p className="text-sm text-muted-foreground">{point.description}</p>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Readiness Checklist Section */}
        <section className="container py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto"
          >
            <div className="text-center mb-10">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                BuyWise Readiness Checklist
              </h2>
              <p className="text-muted-foreground">Before reaching out to professionals, ask yourself...</p>
            </div>
            
            <Card className="p-6 border-border/50">
              <div className="space-y-3">
                {readinessChecklist.map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                    <span className="text-foreground">{item}</span>
                  </motion.div>
                ))}
              </div>
            </Card>
          </motion.div>
        </section>

        {/* Bottom CTAs */}
        <section className="py-16 bg-muted/30">
          <div className="container">
            <div className="max-w-4xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-center mb-10"
              >
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  Ready for the Next Step?
                </h2>
                <p className="text-muted-foreground">
                  Continue building your understanding with these resources
                </p>
              </motion.div>
              
              <div className="grid sm:grid-cols-3 gap-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 }}
                >
                  <Card className="p-6 h-full border-border/50 hover:border-primary/30 transition-colors text-center">
                    <Calculator className="h-8 w-8 text-primary mx-auto mb-4" />
                    <h3 className="font-semibold text-foreground mb-2">Run the Numbers</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Calculate true costs, taxes, and affordability
                    </p>
                    <Button asChild variant="outline" size="sm">
                      <Link to="/tools">
                        Explore Calculators <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </Card>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 }}
                >
                  <Card className="p-6 h-full border-border/50 hover:border-primary/30 transition-colors text-center">
                    <BookOpen className="h-8 w-8 text-primary mx-auto mb-4" />
                    <h3 className="font-semibold text-foreground mb-2">More Guides</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Deep dives on specific topics and situations
                    </p>
                    <Button asChild variant="outline" size="sm">
                      <Link to="/guides">
                        Browse Guides <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </Card>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 }}
                >
                  <Card className="p-6 h-full border-border/50 hover:border-primary/30 transition-colors text-center">
                    <Globe className="h-8 w-8 text-primary mx-auto mb-4" />
                    <h3 className="font-semibold text-foreground mb-2">Full Glossary</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Every term you'll encounter, explained
                    </p>
                    <Button asChild variant="outline" size="sm">
                      <Link to="/glossary">
                        View Glossary <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </Card>
                </motion.div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}
