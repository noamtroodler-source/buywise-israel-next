import { Layout } from "@/components/layout/Layout";
import {
  AgentHero,
  PlatformStats,
  ValuePillars,
  HowItWorks,
  AgentAgencyChooser,
  AgentTestimonials,
  AgentFAQ,
  FinalCTA
} from "@/components/forAgents";

export default function ForAgents() {
  return (
    <Layout>
      <AgentHero />
      <PlatformStats />
      <ValuePillars />
      <HowItWorks />
      <AgentAgencyChooser />
      <AgentTestimonials />
      <AgentFAQ />
      <FinalCTA />
    </Layout>
  );
}
