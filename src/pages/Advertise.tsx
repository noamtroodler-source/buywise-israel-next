import { useState, useRef } from "react";
import { Layout } from "@/components/layout/Layout";
import {
  AdvertiseHero,
  ProfessionalTypeChooser,
  AgentSection,
  AgencySection,
  DeveloperSection,
  UnifiedStats,
  AdvertiseFAQ,
  AdvertiseCTA,
} from "@/components/advertise";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Building2, Landmark } from "lucide-react";

type ProfessionalType = "agent" | "agency" | "developer";

export default function Advertise() {
  const [selectedType, setSelectedType] = useState<ProfessionalType>("agent");
  const detailsRef = useRef<HTMLDivElement>(null);

  const handleTypeSelect = (type: ProfessionalType) => {
    setSelectedType(type);
    // Smooth scroll to details section
    setTimeout(() => {
      detailsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  return (
    <Layout>
      <AdvertiseHero />
      <ProfessionalTypeChooser onSelect={handleTypeSelect} selectedType={selectedType} />

      {/* Tabbed Details Section */}
      <section ref={detailsRef} className="py-16 bg-background scroll-mt-8">
        <div className="container">
          <Tabs value={selectedType} onValueChange={(v) => setSelectedType(v as ProfessionalType)}>
            <div className="flex justify-center mb-10">
              <TabsList className="grid grid-cols-3 w-full max-w-md">
                <TabsTrigger value="agent" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">Agent</span>
                </TabsTrigger>
                <TabsTrigger value="agency" className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Agency</span>
                </TabsTrigger>
                <TabsTrigger value="developer" className="flex items-center gap-2">
                  <Landmark className="h-4 w-4" />
                  <span className="hidden sm:inline">Developer</span>
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="max-w-4xl mx-auto">
              <TabsContent value="agent">
                <AgentSection />
              </TabsContent>
              <TabsContent value="agency">
                <AgencySection />
              </TabsContent>
              <TabsContent value="developer">
                <DeveloperSection />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </section>

      <UnifiedStats />
      <AdvertiseFAQ />
      <AdvertiseCTA />
    </Layout>
  );
}
