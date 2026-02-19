import { Layout } from "@/components/layout/Layout";
import {
  AdvertiseHero,
  AdvertisePlatformStats,
  ProfessionalTypeChooser,
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
      <ProfessionalTypeChooser />
      <AdvertisePricingSection />
      <AdvertiseTestimonials />
      <AdvertiseFAQ />
      <AdvertiseCTA />
    </Layout>
  );
}
