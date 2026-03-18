import { Layout } from "@/components/layout/Layout";
import {
  AdvertiseHero,
  AdvertisePlatformStats,
  AdvertiseCTA,
} from "@/components/advertise";
import { FoundingProgramSection } from "@/components/billing/FoundingProgramSection";

export default function Advertise() {
  return (
    <Layout>
      <AdvertiseHero />
      <AdvertisePlatformStats />
      <section className="py-16 bg-background">
        <div className="container">
          <FoundingProgramSection />
        </div>
      </section>
      <AdvertiseCTA />
    </Layout>
  );
}
