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
import EditProperty from "./pages/agent/EditProperty";
import AgencyRegister from "./pages/agency/AgencyRegister";
import AgencyDashboard from "./pages/agency/AgencyDashboard";
import AgencyAnalytics from "./pages/agency/AgencyAnalytics";
import Developers from "./pages/Developers";
import DeveloperDetail from "./pages/DeveloperDetail";
import Projects from "./pages/Projects";
import ProjectDetail from "./pages/ProjectDetail";
import { AdminLayout } from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminProperties from "./pages/admin/AdminProperties";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminBlog from "./pages/admin/AdminBlog";
import AdminAccuracyAudit from "./pages/admin/AdminAccuracyAudit";
import AdminListingReview from "./pages/admin/AdminListingReview";
import AdminAgents from "./pages/admin/AdminAgents";
import AdminAgencies from "./pages/admin/AdminAgencies";
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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <PreferencesProvider>
        <CompareProvider>
          <TooltipProvider>
            <ErrorBoundary>
              <Toaster />
              <Sonner />
            <BrowserRouter>
              <ScrollToTop />
              <Routes>
              <Route path="/" element={<Index />} />
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
                <EditProperty />
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
            {/* Dev tools - temporarily public for hero image generation */}
            <Route path="/admin/hero-images" element={<HeroImageGenerator />} />
            <Route path="/admin/hero-preview" element={<HeroPreview />} />
            
            <Route path="/admin" element={
              <ProtectedRoute requiredRole="admin">
                <AdminLayout />
              </ProtectedRoute>
            }>
              <Route index element={<AdminDashboard />} />
              <Route path="review" element={<AdminListingReview />} />
              <Route path="agents" element={<AdminAgents />} />
              <Route path="agencies" element={<AdminAgencies />} />
              <Route path="properties" element={<AdminProperties />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="blog" element={<AdminBlog />} />
              <Route path="accuracy-audit" element={<AdminAccuracyAudit />} />
            </Route>
              <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </ErrorBoundary>
        </TooltipProvider>
      </CompareProvider>
    </PreferencesProvider>
  </AuthProvider>
</QueryClientProvider>
);

export default App;