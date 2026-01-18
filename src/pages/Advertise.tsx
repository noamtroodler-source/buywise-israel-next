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

export default function Advertise() {
  return (
    <Layout>
      <AdvertiseHero />
      <AdvertisePlatformStats />
      <AdvertiseValuePillars />
      <AdvertiseHowItWorks />
      <ProfessionalTypeChooser />
      <AdvertiseTestimonials />
      <AdvertiseFAQ />
      <AdvertiseCTA />
    </Layout>
  );
}
