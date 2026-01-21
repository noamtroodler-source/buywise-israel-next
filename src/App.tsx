import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { CompareProvider } from "@/contexts/CompareContext";
import { PreferencesProvider } from "@/contexts/PreferencesContext";
import { ProtectedRoute } from "@/components/shared/ProtectedRoute";
import { ScrollToTop } from "@/components/shared/ScrollToTop";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { GoogleMapsProvider } from "@/components/maps/GoogleMapsProvider";
import { WhatsAppFallbackModal } from "@/components/ui/WhatsAppFallbackModal";
import Index from "./pages/Index";
import Listings from "./pages/Listings";
import PropertyDetail from "./pages/PropertyDetail";
import Compare from "./pages/Compare";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import Favorites from "./pages/Favorites";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import Areas from "./pages/Areas";
import AreaDetail from "./pages/AreaDetail";
import Tools from "./pages/Tools";
import AgentRegisterWizard from "./pages/agent/AgentRegisterWizard";
import AgentDashboard from "./pages/agent/AgentDashboard";
import AgentProperties from "./pages/agent/AgentProperties";
import NewPropertyWizard from "./pages/agent/NewPropertyWizard";
import AgentAnalytics from "./pages/agent/AgentAnalytics";
import AgentSettings from "./pages/agent/AgentSettings";
import AgentLeads from "./pages/agent/AgentLeads";
import EditPropertyWizard from "./pages/agent/EditPropertyWizard";
import AgencyRegister from "./pages/agency/AgencyRegister";
import AgencyDashboard from "./pages/agency/AgencyDashboard";
import AgencyAnalytics from "./pages/agency/AgencyAnalytics";
import AgencySettings from "./pages/agency/AgencySettings";
import AgencyLeadsPage from "./pages/agency/AgencyLeads";
import AgencyListingsPage from "./pages/agency/AgencyListings";
import Developers from "./pages/Developers";
import DeveloperDetail from "./pages/DeveloperDetail";
import Projects from "./pages/Projects";
import ProjectDetail from "./pages/ProjectDetail";
import { AdminLayout } from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import { AdminSettings } from "./pages/admin/AdminSettings";
import { AdminCitiesPage } from "./pages/admin/AdminCitiesPage";
import { AdminMarketDataPage } from "./pages/admin/AdminMarketDataPage";
import { AdminContactSubmissions } from "./pages/admin/AdminContactSubmissions";
import { AdminFeatureFlags } from "./pages/admin/AdminFeatureFlags";
import { AdminGlossary } from "./pages/admin/AdminGlossary";
import { AdminAnnouncements } from "./pages/admin/AdminAnnouncements";
import AdminProperties from "./pages/admin/AdminProperties";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminBlog from "./pages/admin/AdminBlog";
import AdminAccuracyAudit from "./pages/admin/AdminAccuracyAudit";
import AdminListingReview from "./pages/admin/AdminListingReview";
import AdminAgents from "./pages/admin/AdminAgents";
import AdminAgencies from "./pages/admin/AdminAgencies";
import AdminDevelopers from "./pages/admin/AdminDevelopers";
import AdminProjects from "./pages/admin/AdminProjects";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import HeroImageGenerator from "./pages/admin/HeroImageGenerator";
import HeroPreview from "./pages/admin/HeroPreview";
import Glossary from "./pages/Glossary";
// Guides
import Guides from "./pages/Guides";
import BuyingPropertyGuide from "./pages/guides/BuyingPropertyGuide";
import ListingsGuide from "./pages/guides/ListingsGuide";
import PurchaseTaxGuide from "./pages/guides/PurchaseTaxGuide";
import TrueCostGuide from "./pages/guides/TrueCostGuide";
import TalkingToProfessionalsGuide from "./pages/guides/TalkingToProfessionalsGuide";
import MortgagesGuide from "./pages/guides/MortgagesGuide";
import NewVsResaleGuide from "./pages/guides/NewVsResaleGuide";
import RentVsBuyGuide from "./pages/guides/RentVsBuyGuide";
// Individual guide pages - commented out for launch
// import OlehBuyerGuide from "./pages/guides/OlehBuyerGuide";
// import InvestmentPropertyGuide from "./pages/guides/InvestmentPropertyGuide";
// import NewConstructionGuide from "./pages/guides/NewConstructionGuide";
import Contact from "./pages/Contact";
import Principles from "./pages/Principles";
import NotFound from "./pages/NotFound";
import AgentDetail from "./pages/AgentDetail";
import Agencies from "./pages/Agencies";
import AgencyDetail from "./pages/AgencyDetail";
import ForAgents from "./pages/ForAgents";
import ForDevelopers from "./pages/ForDevelopers";
import Advertise from "./pages/Advertise";
import DeveloperRegister from "./pages/developer/DeveloperRegister";
import DeveloperDashboard from "./pages/developer/DeveloperDashboard";
import DeveloperProjects from "./pages/developer/DeveloperProjects";
import DeveloperAnalytics from "./pages/developer/DeveloperAnalytics";
import DeveloperSettings from "./pages/developer/DeveloperSettings";
import DeveloperLeads from "./pages/developer/DeveloperLeads";
import NewProjectWizard from "./pages/developer/NewProjectWizard";
import GetStarted from "./pages/GetStarted";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <GoogleMapsProvider>
        <PreferencesProvider>
          <CompareProvider>
            <TooltipProvider>
              <ErrorBoundary>
                <Toaster />
                <Sonner />
                <WhatsAppFallbackModal>
                  <BrowserRouter>
                    <ScrollToTop />
              <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/get-started" element={<GetStarted />} />
              <Route path="/listings" element={<Listings />} />
              <Route path="/property/:id" element={<PropertyDetail />} />
              <Route path="/compare" element={<Compare />} />
              <Route path="/auth" element={<Auth />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:slug" element={<BlogPost />} />
            <Route path="/areas" element={<Areas />} />
            <Route path="/areas/:slug" element={<AreaDetail />} />
            <Route path="/tools" element={<Tools />} />
            <Route path="/glossary" element={<Glossary />} />
<Route path="/guides" element={<Guides />} />
            <Route path="/guides/buying-in-israel" element={<BuyingPropertyGuide />} />
            <Route path="/guides/understanding-listings" element={<ListingsGuide />} />
            <Route path="/guides/purchase-tax" element={<PurchaseTaxGuide />} />
            <Route path="/guides/true-cost" element={<TrueCostGuide />} />
            <Route path="/guides/talking-to-professionals" element={<TalkingToProfessionalsGuide />} />
            <Route path="/guides/mortgages" element={<MortgagesGuide />} />
            <Route path="/guides/new-vs-resale" element={<NewVsResaleGuide />} />
            <Route path="/guides/rent-vs-buy" element={<RentVsBuyGuide />} />
            {/* Individual guide pages - commented out for launch
            <Route path="/guides/oleh-first-time" element={<OlehBuyerGuide />} />
            <Route path="/guides/investment-property" element={<InvestmentPropertyGuide />} />
            <Route path="/guides/new-construction" element={<NewConstructionGuide />} />
            */}
            <Route path="/developers" element={<Developers />} />
            <Route path="/developers/:slug" element={<DeveloperDetail />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/projects/:slug" element={<ProjectDetail />} />
            <Route path="/agents/:id" element={<AgentDetail />} />
            <Route path="/agencies" element={<Agencies />} />
            <Route path="/agencies/:slug" element={<AgencyDetail />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/about" element={<Principles />} />
            <Route path="/for-agents" element={<ForAgents />} />
            <Route path="/for-developers" element={<ForDevelopers />} />
            <Route path="/advertise" element={<Advertise />} />
            
            <Route path="/profile" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />
            <Route path="/favorites" element={
              <ProtectedRoute>
                <Favorites />
              </ProtectedRoute>
            } />
            <Route path="/agent/register" element={
              <ProtectedRoute>
                <AgentRegisterWizard />
              </ProtectedRoute>
            } />
            <Route path="/agent" element={
              <ProtectedRoute requiredRole="agent">
                <AgentDashboard />
              </ProtectedRoute>
            } />
            <Route path="/agent/analytics" element={
              <ProtectedRoute requiredRole="agent">
                <AgentAnalytics />
              </ProtectedRoute>
            } />
            <Route path="/agent/settings" element={
              <ProtectedRoute requiredRole="agent">
                <AgentSettings />
              </ProtectedRoute>
            } />
            <Route path="/agent/leads" element={
              <ProtectedRoute requiredRole="agent">
                <AgentLeads />
              </ProtectedRoute>
            } />
            <Route path="/agent/properties" element={
              <ProtectedRoute requiredRole="agent">
                <AgentProperties />
              </ProtectedRoute>
            } />
            <Route path="/agent/properties/new" element={
              <ProtectedRoute requiredRole="agent">
                <NewPropertyWizard />
              </ProtectedRoute>
            } />
            <Route path="/agent/properties/:id/edit" element={
              <ProtectedRoute requiredRole="agent">
                <EditPropertyWizard />
              </ProtectedRoute>
            } />
            {/* Agency Routes */}
            <Route path="/agency/register" element={
              <ProtectedRoute>
                <AgencyRegister />
              </ProtectedRoute>
            } />
            <Route path="/agency" element={
              <ProtectedRoute>
                <AgencyDashboard />
              </ProtectedRoute>
            } />
            <Route path="/agency/analytics" element={
              <ProtectedRoute>
                <AgencyAnalytics />
              </ProtectedRoute>
            } />
            <Route path="/agency/settings" element={
              <ProtectedRoute>
                <AgencySettings />
              </ProtectedRoute>
            } />
            <Route path="/agency/leads" element={
              <ProtectedRoute>
                <AgencyLeadsPage />
              </ProtectedRoute>
            } />
            <Route path="/agency/listings" element={
              <ProtectedRoute>
                <AgencyListingsPage />
              </ProtectedRoute>
            } />
            {/* Developer Routes */}
            <Route path="/developer/register" element={
              <ProtectedRoute>
                <DeveloperRegister />
              </ProtectedRoute>
            } />
            <Route path="/developer" element={
              <ProtectedRoute requiredRole="developer">
                <DeveloperDashboard />
              </ProtectedRoute>
            } />
            <Route path="/developer/projects" element={
              <ProtectedRoute requiredRole="developer">
                <DeveloperProjects />
              </ProtectedRoute>
            } />
            <Route path="/developer/projects/new" element={
              <ProtectedRoute requiredRole="developer">
                <NewProjectWizard />
              </ProtectedRoute>
            } />
            <Route path="/developer/analytics" element={
              <ProtectedRoute requiredRole="developer">
                <DeveloperAnalytics />
              </ProtectedRoute>
            } />
            <Route path="/developer/leads" element={
              <ProtectedRoute requiredRole="developer">
                <DeveloperLeads />
              </ProtectedRoute>
            } />
            <Route path="/developer/settings" element={
              <ProtectedRoute requiredRole="developer">
                <DeveloperSettings />
              </ProtectedRoute>
            } />
            {/* Dev tools - temporarily public for hero image generation */}
            <Route path="/admin/hero-images" element={<HeroImageGenerator />} />
            <Route path="/admin/hero-preview" element={<HeroPreview />} />
            
            <Route path="/admin" element={
              <ProtectedRoute requiredRole="admin">
                <AdminLayout />
              </ProtectedRoute>
            }>
              <Route index element={<AdminDashboard />} />
              <Route path="settings" element={<AdminSettings />} />
              <Route path="analytics" element={<AdminAnalytics />} />
              <Route path="review" element={<AdminListingReview />} />
              <Route path="agents" element={<AdminAgents />} />
              <Route path="agencies" element={<AdminAgencies />} />
              <Route path="properties" element={<AdminProperties />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="blog" element={<AdminBlog />} />
              <Route path="developers" element={<AdminDevelopers />} />
              <Route path="projects" element={<AdminProjects />} />
              <Route path="cities" element={<AdminCitiesPage />} />
              <Route path="market-data" element={<AdminMarketDataPage />} />
              <Route path="glossary" element={<AdminGlossary />} />
              <Route path="contact" element={<AdminContactSubmissions />} />
              <Route path="feature-flags" element={<AdminFeatureFlags />} />
              <Route path="announcements" element={<AdminAnnouncements />} />
              <Route path="accuracy-audit" element={<AdminAccuracyAudit />} />
            </Route>
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </BrowserRouter>
              </WhatsAppFallbackModal>
            </ErrorBoundary>
          </TooltipProvider>
        </CompareProvider>
      </PreferencesProvider>
    </GoogleMapsProvider>
  </AuthProvider>
</QueryClientProvider>
);

export default App;