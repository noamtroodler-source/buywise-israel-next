import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { DualNavigation } from '@/components/shared/DualNavigation';
import { 
  Clock, BookOpen, Users, FileText, AlertTriangle, 
  CheckCircle2, ArrowRight, Building2, 
  Landmark, Home, Banknote, Key, Calculator,
  Globe, Gavel, FileWarning, Calendar,
  DollarSign
} from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTrackContentVisit } from '@/hooks/useTrackContentVisit';

// Navigation sections
const navSections = [
  { id: 'overview', label: 'Overview' },
  { id: 'big-picture', label: 'Big Picture' },
  { id: 'buyer-status', label: 'Buyer Status' },
  { id: 'glossary', label: 'Glossary' },
  { id: 'timeline', label: 'Timeline' },
  { id: 'checklist', label: 'Checklist' },
];

// Animation variants
const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
};

// Data: Big Picture insights
const bigPictureInsights = [
   { icon: Home, text: "Israeli listings count total rooms (bedrooms + living room), not bedrooms alone. A '4-room' listing typically has 3 bedrooms." },
   { icon: Building2, text: "Gross square meters can include shared areas like stairwells." },
   { icon: Gavel, text: "Lawyers draft contracts — agents do not." },
   { icon: FileWarning, text: "Verbal agreements can be legally binding." },
   { icon: Banknote, text: "Mortgages finalize after you sign the contract, not before." },
   { icon: Landmark, text: "Legal ownership registration can take months after closing." },
   { icon: DollarSign, text: "International wire transfers take days and incur fees." },
   { icon: Users, text: "Agents may represent both buyer and seller." },
];

// Data: Glossary terms (top 8 most essential for this guide)
const glossaryTerms = [
  { hebrew: "טאבו", english: "Tabu", definition: "Israel's Land Registry; registering here provides the strongest ownership right. About 7% of Israeli land is privately owned and registered in Tabu." },
  { hebrew: "מנהל / רמ״י", english: "Minhal / ILA", definition: "Israel Land Authority, managing ~93% of state-owned land. Most homes are on long-term leases (49+49 years), renewable and transferable." },
  { hebrew: "הערת אזהרה", english: "He'arat Azhara", definition: "A warning note registered on title to protect buyer's rights before final registration. Register immediately after contract signing." },
  { hebrew: "זיכרון דברים", english: "Zichron Devarim", definition: "A memorandum of understanding — can be legally binding if it contains essential terms. Courts have enforced these as contracts. Never sign without lawyer review." },
  { hebrew: "מס רכישה", english: "Mas Rechisha", definition: "Purchase tax due within 60 days of signing. Rates vary by buyer status: 0-10% for residents, 8-10% for investors/foreign buyers." },
  { hebrew: "משכנתא", english: "Mashkanta", definition: "Mortgage. Banks approve after contract signing, not before. No financing contingency exists in Israel." },
  { hebrew: "נטו / ברוטו", english: "Net vs Gross", definition: "Net square meters are actual living space; gross includes common areas. Difference can be 10-20%." },
  { hebrew: "ערבות בנקאית", english: "Bank Guarantee", definition: "In new projects, banks must guarantee all payments exceeding 7% of purchase price. Your protection if developer fails." },
];

// Data: Timeline stages (14 stages)
const timelineStages = [
  {
    number: 1,
    title: "Discovery and Narrowing",
    whatHappens: "On BuyWise Israel, compare cities, neighborhoods, and properties using real market data — price per sqm, rental yields, and price trends. Filter verified listings with English details and transparent pricing. Use affordability and true cost calculators to understand your real budget before you start viewing.",
    whoInvolved: ["Buyer", "Possibly renting first"],
    documents: "None",
    risks: ["Hebrew-only listings with auto-translated descriptions that miss critical details like land tenure or building age", "No context on whether a price is fair or what the final price would actually end up being — local portals don't show price per sqm or area averages", "Unvetted listings — duplicate posts, outdated prices, and properties already under contract", "Agency sites that only show their own inventory, with advice shaped by commission and pressure to move fast"],
  },
  {
    number: 2,
    title: "Renting as a Learning Step",
    whatHappens: "International users often sign a rental contract to test neighborhoods, commute times, and building types before buying.",
    whoInvolved: ["Renter", "Landlord", "Sometimes an agent"],
    documents: "Rental lease, guarantor forms, deposit",
    risks: ["Assuming rental practices mirror buying", "Misunderstanding that furnished/unfurnished distinctions, security deposits, and rental rights differ from purchase norms"],
  },
  {
    number: 3,
    title: "Engaging Agents (Optional)",
    whatHappens: "You may work with one or more agents. There is no exclusive MLS; agents often represent both sides or multiple buyers.",
    whoInvolved: ["Buyer/Renter", "Seller/Landlord", "Agent(s)"],
    documents: "Brokerage agreement (sometimes signed); potential letters of intent",
    risks: ["Assuming the agent represents only you", "Not realizing you owe commission at signing, not at closing"],
  },
  {
    number: 4,
    title: "Attorney Engagement & Title Checks",
    whatHappens: "A lawyer conducts due diligence: verifies ownership in Tabu or Minhal, checks liens, mortgages, building permits, and land lease terms.",
    whoInvolved: ["Buyer's lawyer (essential)", "Sometimes seller's lawyer"],
    documents: "Power of attorney; identity documents",
    risks: ["Involving a lawyer too late", "Assuming 'standard contracts' exist", "Not verifying land type (freehold vs leasehold)"],
  },
  {
    number: 5,
    title: "Negotiation & Informal Pressure",
    whatHappens: "Price and terms are discussed verbally, often via WhatsApp. Pressure may arise to 'lock it in' quickly.",
    whoInvolved: ["Buyer/Renter", "Seller/Landlord", "Agent(s)"],
    documents: "Texts, emails, possibly a Zichron Devarim summarizing price and possession date",
    risks: ["Signing or sending something 'temporary' that courts treat as binding", "Paying deposits before due diligence"],
    pressurePoint: true
  },
  {
    number: 6,
    title: "Preliminary Documents & Reservations",
    whatHappens: "In new construction, developers request a Tofes Harshama (reservation form) and a deposit check to reserve your unit. In resale, some sellers push for a Zichron Devarim.",
    whoInvolved: ["Buyer", "Developer or seller", "Lawyers"],
    documents: "Reservation form, cheque, Zichron Devarim",
    risks: ["Assuming these are non-binding", "Essential terms may make them enforceable", "Backing out can lead to damages"],
  },
  {
    number: 7,
    title: "Offer → Contract",
    whatHappens: "Lawyers draft and negotiate the binding purchase contract (and technical specification in new projects). Negotiations may be fast.",
    whoInvolved: ["Buyer's and seller's lawyers", "Buyer", "Seller"],
    documents: "Hebrew purchase contract, Mifrat (specification)",
    risks: ["Not understanding timing dependencies", "Mortgage approval may still be pending", "Failing to confirm what is included (parking, storage, upgrades)"],
  },
  {
    number: 8,
    title: "Payment Schedule Mechanics",
    whatHappens: "Payments are split over several stages; typical down payment at contract is 10–20%, with remaining payments scheduled by milestones.",
    whoInvolved: ["Buyer", "Seller", "Bank (if financed)", "Lawyers"],
    documents: "Payment schedule in contract; bank guarantee for new projects after 7% payment",
    risks: ["Currency timing risk: international transfers take 3–5 days and incur fees", "Missing deadlines due to bank delays or exchange-rate swings", "Confusing net vs gross price when index-linked (Madad) in projects"],
  },
  {
    number: 9,
    title: "Money Movement & Timing Friction",
    whatHappens: "Buyers must transfer large sums from abroad to Israeli banks. Banks require documentation and may hold funds for compliance checks.",
    whoInvolved: ["Buyer", "Sending bank", "Receiving bank", "Currency exchange provider"],
    documents: "Source-of-funds declarations; bank forms",
    risks: ["Underestimating transfer time", "Paying exchange markups of 1.5–3% and multiple wire fees", "Encountering regulatory delays"],
  },
  {
    number: 10,
    title: "Mortgage Path (If Applicable)",
    whatHappens: "After contract signing, banks appraise the property and issue final mortgage approval.",
    whoInvolved: ["Bank", "Appraiser", "Buyer", "Lawyer"],
    documents: "Mortgage approval; lien registration; insurance",
    risks: ["Approval delays vs fixed payment dates", "Bank-specific conditions or rate fluctuations"],
  },
  {
    number: 11,
    title: "Inspections & Engineer Checks",
    whatHappens: "Buyers hire a structural engineer to inspect the property. In resale deals, homes are sold 'As Is' and sellers rarely provide inspections.",
    whoInvolved: ["Engineer", "Buyer"],
    documents: "Inspection report",
    risks: ["Skipping inspection", "Discovering issues after signing because no contingencies exist"],
  },
  {
    number: 12,
    title: "Closing & Key Handover",
    whatHappens: "Final payment is made; keys and possession are delivered.",
    whoInvolved: ["Buyer", "Seller", "Lawyers", "Sometimes agents"],
    documents: "Closing confirmations",
    risks: ["Assuming ownership is finalized at key handover", "Overlooking outstanding taxes or liens"],
  },
  {
    number: 13,
    title: "Registration",
    whatHappens: "Your lawyer files to register ownership in Tabu, Minhal, or a housing company; this can take months. Until registration, a He'arat Azhara protects your rights.",
    whoInvolved: ["Lawyer", "Land registry officials"],
    documents: "Registration application; tax receipts",
    risks: ["Long delays", "Missing documents", "Misunderstanding that keys = ownership"],
  },
  {
    number: 14,
    title: "Post-Purchase Basics",
    whatHappens: "You transfer Arnona and utilities into your name, join the Va'ad Bayit and begin paying monthly fees, and set up homeowners insurance.",
    whoInvolved: ["Municipality", "Utility providers", "Building committee"],
    documents: "Arnona transfer forms; Va'ad Bayit agreement; insurance policy",
    risks: ["Missing deadlines for Arnona discounts", "Not budgeting for Va'ad Bayit fees", "Under-insuring property"],
  },
];

// Data: Readiness checklist (trimmed to 2 groups, actionable items only)
const readinessChecklist = {
  "Legal & Representation": [
    "I understand who represents whom in the transaction",
    "I know what proves ownership (Tabu, Minhal, housing company)",
    "I know the Hebrew contract controls, even if English exists",
    "I understand land type differences (freehold vs leasehold)",
  ],
  "Financial & Timing": [
    "I know mortgage approval happens after contract signing",
    "I understand staged payment schedules and currency transfer timelines",
    "I know which taxes and costs apply to my buyer status",
    "I understand what Zichron Devarim is and why not to sign it casually",
  ],
};

// Participant badge component
const ParticipantBadge = ({ participant }: { participant: string }) => (
  <Badge variant="secondary" className="text-xs">
    {participant}
  </Badge>
);

// Navigation component - used in hero
const GuideNavigation = () => (
  <DualNavigation
    parentLabel="All Guides"
    parentPath="/guides"
    className="mb-4"
  />
);

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
    
    <Card className={cn(
      "p-6 border-border/50 hover:border-primary/30 transition-colors",
      stage.pressurePoint && "border-l-4 border-l-primary"
    )}>
      <div className="flex items-start gap-4">
        {/* Stage number */}
        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg">
          {stage.number}
        </div>
        
        <div className="flex-1 space-y-4">
          {/* Title */}
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-semibold text-foreground">{stage.title}</h3>
            {stage.pressurePoint && (
              <Badge variant="outline" className="text-xs border-primary text-primary">
                Common Pressure Point
              </Badge>
            )}
          </div>
          
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
                <span className="text-sm font-medium text-foreground">
                  {stage.number === 1 ? 'What can go wrong on other platforms' : 'What can go wrong'}
                </span>
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
        </div>
      </div>
    </Card>
  </motion.div>
);

export default function BuyingPropertyGuide() {
  useTrackContentVisit('guide');
  const [activeSection, setActiveSection] = useState('overview');
  const [isNavVisible, setIsNavVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show nav after scrolling past hero
      setIsNavVisible(window.scrollY > 300);

      // Find active section
      const sectionElements = navSections.map(section => ({
        id: section.id,
        element: document.getElementById(section.id),
      }));

      for (let i = sectionElements.length - 1; i >= 0; i--) {
        const { id, element } = sectionElements[i];
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top <= 150) {
            setActiveSection(id);
            break;
          }
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
      const top = element.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-background">
        {/* Sticky Section Navigation */}
        <motion.nav
          initial={{ y: -100 }}
          animate={{ y: isNavVisible ? 0 : -100 }}
          className="fixed top-16 left-0 right-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border shadow-sm"
        >
          <div className="container">
            <div className="flex items-center justify-center gap-1 py-2 overflow-x-auto scrollbar-hide">
              {navSections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => scrollToSection(section.id)}
                  className={cn(
                    "px-3 py-1.5 text-sm font-medium rounded-full transition-colors whitespace-nowrap",
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
        </motion.nav>

        {/* Hero Section */}
        <section id="overview" className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
          <div className="container relative py-16 md:py-24">
            {/* Dual Navigation */}
            <GuideNavigation />
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center max-w-3xl mx-auto"
            >
              <Badge variant="secondary" className="mb-4">
                Complete Guide
              </Badge>
              <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
                Buying a Property in <span className="text-primary">Israel</span>
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
                  14 stages
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  30 min read
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  Updated 2026
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
            <div className="p-6 rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20">
              <p className="text-foreground text-center mb-4">
                For international buyers and renters, Israeli property listings can feel like a puzzle. 
                There is no single source of truth.
              </p>
              <p className="text-muted-foreground text-sm text-center">
                This guide does not give personal advice or tell you what to do. Instead, it maps the sequence 
                of discovery, negotiation, and purchase in Israel, explains how renting fits into early exploration, 
                and flags where pressure and confusion typically arise. 
                <span className="font-medium text-foreground"> Use it to build clarity before you engage agents, lawyers, or banks.</span>
              </p>
            </div>
          </motion.div>
        </section>

        {/* Big Picture Section */}
        <section id="big-picture" className="py-16 bg-muted/30">
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
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-w-6xl mx-auto">
              {bigPictureInsights.map((insight, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.03 }}
                >
                  <Card className="p-4 h-full border-border/50 hover:border-primary/30 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
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

        {/* Buyer Status Reality Check Section */}
        <section id="buyer-status" className="container py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto"
          >
            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                Buyer Status Reality Check
              </h2>
              <p className="text-muted-foreground">The sequence is the same — the details differ</p>
            </div>
            
            <Card className="p-6 border-primary/20 bg-primary/5">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-primary/10 flex-shrink-0">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div className="space-y-3">
                  <p className="text-foreground">
                    Whether you are an <span className="font-medium">Israeli resident</span>, a <span className="font-medium">new oleh</span>, 
                    a <span className="font-medium">foreign buyer living abroad</span>, or an <span className="font-medium">investor</span>, 
                    the sequence described here is broadly similar.
                  </p>
                  <p className="text-muted-foreground">
                    The differences usually appear in <span className="font-medium text-foreground">purchase tax rates</span>, 
                    <span className="font-medium text-foreground"> mortgage eligibility</span>, 
                    <span className="font-medium text-foreground"> bank documentation</span>, and 
                    <span className="font-medium text-foreground"> bureaucratic friction</span> — not in the order of steps.
                  </p>
                  <div className="pt-2">
                    <Badge variant="outline" className="text-xs">
                      Always verify current rules for your specific status
                    </Badge>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        </section>

        {/* Glossary Section */}
        <section id="glossary" className="py-16 bg-muted/30">
          <div className="container">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-10"
            >
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                Glossary of Essential Terms
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
          </div>
        </section>

        {/* Timeline Section */}
        <section id="timeline" className="container py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              The Step-by-Step Timeline
            </h2>
            <p className="text-muted-foreground">From first search to post-purchase — 14 stages</p>
          </motion.div>
          
          <div className="max-w-3xl mx-auto space-y-8">
            {timelineStages.map((stage, index) => (
              <StageCard key={stage.number} stage={stage} index={index} />
            ))}
          </div>
        </section>

        {/* Readiness Checklist Section */}
        <section id="checklist" className="container py-16">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-10"
            >
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                Readiness Checklist
              </h2>
              <p className="text-muted-foreground">Before reaching out to professionals, ask yourself...</p>
            </motion.div>
            
            <div className="grid md:grid-cols-2 gap-6">
              {Object.entries(readinessChecklist).map(([category, items], categoryIndex) => (
                <motion.div
                  key={category}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: categoryIndex * 0.1 }}
                >
                  <Card className="p-5 h-full border-border/50">
                    <h3 className="font-semibold text-foreground mb-4 text-sm uppercase tracking-wide">
                      {category}
                    </h3>
                    <div className="space-y-3">
                      {items.map((item, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-2"
                        >
                          <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-muted-foreground">{item}</span>
                        </div>
                      ))}
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
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
                    <h3 className="font-semibold text-foreground mb-2">Explore Cities</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Market data and neighborhood insights
                    </p>
                    <Button asChild variant="outline" size="sm">
                      <Link to="/cities">
                        Browse Cities <ArrowRight className="ml-2 h-4 w-4" />
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