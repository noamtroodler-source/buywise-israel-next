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
import AgentRegister from "./pages/agent/AgentRegister";
import AgentDashboard from "./pages/agent/AgentDashboard";
import AgentProperties from "./pages/agent/AgentProperties";
import NewProperty from "./pages/agent/NewProperty";
import EditProperty from "./pages/agent/EditProperty";
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
import HeroImageGenerator from "./pages/admin/HeroImageGenerator";
import HeroPreview from "./pages/admin/HeroPreview";
import Glossary from "./pages/Glossary";
// Guides
import Guides from "./pages/Guides";
import BuyingPropertyGuide from "./pages/guides/BuyingPropertyGuide";
// Individual guide pages - commented out for launch
// import OlehBuyerGuide from "./pages/guides/OlehBuyerGuide";
// import InvestmentPropertyGuide from "./pages/guides/InvestmentPropertyGuide";
// import NewVsResaleGuide from "./pages/guides/NewVsResaleGuide";
// import NewConstructionGuide from "./pages/guides/NewConstructionGuide";
import Contact from "./pages/Contact";
import Principles from "./pages/Principles";
import NotFound from "./pages/NotFound";
import AgentDetail from "./pages/AgentDetail";
import Agencies from "./pages/Agencies";
import AgencyDetail from "./pages/AgencyDetail";

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
            {/* Individual guide pages - commented out for launch
            <Route path="/guides/oleh-first-time" element={<OlehBuyerGuide />} />
            <Route path="/guides/investment-property" element={<InvestmentPropertyGuide />} />
            <Route path="/guides/new-vs-resale" element={<NewVsResaleGuide />} />
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
                <AgentRegister />
              </ProtectedRoute>
            } />
            <Route path="/agent" element={
              <ProtectedRoute requiredRole="agent">
                <AgentDashboard />
              </ProtectedRoute>
            } />
            <Route path="/agent/properties" element={
              <ProtectedRoute requiredRole="agent">
                <AgentProperties />
              </ProtectedRoute>
            } />
            <Route path="/agent/properties/new" element={
              <ProtectedRoute requiredRole="agent">
                <NewProperty />
              </ProtectedRoute>
            } />
            <Route path="/agent/properties/:id/edit" element={
              <ProtectedRoute requiredRole="agent">
                <EditProperty />
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