import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/shared/ProtectedRoute";
import Index from "./pages/Index";
import Listings from "./pages/Listings";
import PropertyDetail from "./pages/PropertyDetail";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import Favorites from "./pages/Favorites";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import Cities from "./pages/Cities";
import CityDetail from "./pages/CityDetail";
import Tools from "./pages/Tools";
import AgentRegister from "./pages/agent/AgentRegister";
import AgentDashboard from "./pages/agent/AgentDashboard";
import AgentProperties from "./pages/agent/AgentProperties";
import NewProperty from "./pages/agent/NewProperty";
import EditProperty from "./pages/agent/EditProperty";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/listings" element={<Listings />} />
            <Route path="/property/:id" element={<PropertyDetail />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:slug" element={<BlogPost />} />
            <Route path="/cities" element={<Cities />} />
            <Route path="/cities/:slug" element={<CityDetail />} />
            <Route path="/tools" element={<Tools />} />
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
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;