import { Layout } from "@/components/layout/Layout";
import {
  AdvertiseHero,
  AdvertisePlatformStats,
  AdvertiseValuePillars,
  AdvertiseHowItWorks,
  AdvertiseTestimonials,
  AdvertiseFAQ,
  AdvertiseCTA,
} from "@/components/advertise";
import { AdvertisePricingSection } from "@/components/advertise/AdvertisePricingSection";

export default function Advertise() {
  return (
    <Layout>
      <AdvertiseHero />
      <AdvertisePlatformStats />
      <AdvertiseValuePillars />
      <AdvertiseHowItWorks />
      <AdvertisePricingSection />
      <AdvertiseTestimonials />
      <AdvertiseFAQ />
      <AdvertiseCTA />
    </Layout>
  );
}
