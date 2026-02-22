import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { CompareProvider } from "@/contexts/CompareContext";
import { PreferencesProvider } from "@/contexts/PreferencesContext";
import { FavoritesProvider } from "@/contexts/FavoritesContext";
import { ProtectedRoute } from "@/components/shared/ProtectedRoute";
import { ScrollToTop } from "@/components/shared/ScrollToTop";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { WhatsAppFallbackModal } from "@/components/ui/WhatsAppFallbackModal";
import { PageLoader } from "@/components/shared/PageLoader";
import { PageTracker } from "@/hooks/usePageTracking";

// Critical path - keep as static imports (homepage, listings, auth)
import Index from "./pages/Index";
import Listings from "./pages/Listings";
import PropertyDetail from "./pages/PropertyDetail";
import Projects from "./pages/Projects";
import ProjectDetail from "./pages/ProjectDetail";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

// Lazy load everything else for smaller initial bundle
const Compare = lazy(() => import("./pages/Compare"));
const CompareProjects = lazy(() => import("./pages/CompareProjects"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const Areas = lazy(() => import("./pages/Areas"));
const AreaDetail = lazy(() => import("./pages/AreaDetail"));
const Tools = lazy(() => import("./pages/Tools"));
const Glossary = lazy(() => import("./pages/Glossary"));
const Developers = lazy(() => import("./pages/Developers"));
const DeveloperDetail = lazy(() => import("./pages/DeveloperDetail"));
const AgentDetail = lazy(() => import("./pages/AgentDetail"));
const Agencies = lazy(() => import("./pages/Agencies"));
const AgencyDetail = lazy(() => import("./pages/AgencyDetail"));
const Professionals = lazy(() => import("./pages/Professionals"));
const ProfessionalDetail = lazy(() => import("./pages/ProfessionalDetail"));
const Contact = lazy(() => import("./pages/Contact"));
const Principles = lazy(() => import("./pages/Principles"));
const ForAgents = lazy(() => import("./pages/ForAgents"));

const Advertise = lazy(() => import("./pages/Advertise"));
const GetStarted = lazy(() => import("./pages/GetStarted"));
const Pricing = lazy(() => import("./pages/Pricing"));
const CheckoutSuccess = lazy(() => import("./pages/CheckoutSuccess"));
const CheckoutCancel = lazy(() => import("./pages/CheckoutCancel"));
const Profile = lazy(() => import("./pages/Profile"));
const Favorites = lazy(() => import("./pages/Favorites"));
const MapSearch = lazy(() => import("./pages/MapSearch"));

// Legal pages
const PrivacyPolicy = lazy(() => import("./pages/legal/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/legal/TermsOfService"));

// Auth pages
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));

// Guides - lazy load
const Guides = lazy(() => import("./pages/Guides"));
const BuyingPropertyGuide = lazy(() => import("./pages/guides/BuyingPropertyGuide"));
const ListingsGuide = lazy(() => import("./pages/guides/ListingsGuide"));
const PurchaseTaxGuide = lazy(() => import("./pages/guides/PurchaseTaxGuide"));
const TrueCostGuide = lazy(() => import("./pages/guides/TrueCostGuide"));
const TalkingToProfessionalsGuide = lazy(() => import("./pages/guides/TalkingToProfessionalsGuide"));
const MortgagesGuide = lazy(() => import("./pages/guides/MortgagesGuide"));
const NewVsResaleGuide = lazy(() => import("./pages/guides/NewVsResaleGuide"));
const RentVsBuyGuide = lazy(() => import("./pages/guides/RentVsBuyGuide"));
const NewConstructionGuide = lazy(() => import("./pages/guides/NewConstructionGuide"));
const OlehBuyerGuide = lazy(() => import("./pages/guides/OlehBuyerGuide"));
const InvestmentPropertyGuide = lazy(() => import("./pages/guides/InvestmentPropertyGuide"));
// Agent dashboard - lazy load
const AgentRegisterWizard = lazy(() => import("./pages/agent/AgentRegisterWizard"));
const AgentDashboard = lazy(() => import("./pages/agent/AgentDashboard"));
const AgentProperties = lazy(() => import("./pages/agent/AgentProperties"));
const NewPropertyWizard = lazy(() => import("./pages/agent/NewPropertyWizard"));
const AgentAnalytics = lazy(() => import("./pages/agent/AgentAnalytics"));
const AgentSettings = lazy(() => import("./pages/agent/AgentSettings"));
const AgentLeads = lazy(() => import("./pages/agent/AgentLeads"));
const EditPropertyWizard = lazy(() => import("./pages/agent/EditPropertyWizard"));
const AgentBlog = lazy(() => import("./pages/agent/AgentBlog"));
const AgentBlogWizard = lazy(() => import("./pages/agent/AgentBlogWizard"));

// Agency dashboard - lazy load
const AgencyRegister = lazy(() => import("./pages/agency/AgencyRegister"));
const AgencyDashboard = lazy(() => import("./pages/agency/AgencyDashboard"));
const AgencyAnalytics = lazy(() => import("./pages/agency/AgencyAnalytics"));
const AgencySettings = lazy(() => import("./pages/agency/AgencySettings"));
const AgencyListingsPage = lazy(() => import("./pages/agency/AgencyListings"));
const AgencyNewPropertyWizard = lazy(() => import("./pages/agency/AgencyNewPropertyWizard"));
const AgencyEditPropertyWizard = lazy(() => import("./pages/agency/AgencyEditPropertyWizard"));
const AgencyBlogWizard = lazy(() => import("./pages/agency/AgencyBlogWizard"));
const AgencyBilling = lazy(() => import("./pages/agency/AgencyBilling"));
const AgencyFeatured = lazy(() => import("./pages/agency/AgencyFeatured"));

// Developer dashboard - lazy load
const DeveloperRegister = lazy(() => import("./pages/developer/DeveloperRegister"));
const DeveloperDashboard = lazy(() => import("./pages/developer/DeveloperDashboard"));
const DeveloperProjects = lazy(() => import("./pages/developer/DeveloperProjects"));
const DeveloperAnalytics = lazy(() => import("./pages/developer/DeveloperAnalytics"));
const DeveloperSettings = lazy(() => import("./pages/developer/DeveloperSettings"));
const DeveloperLeads = lazy(() => import("./pages/developer/DeveloperLeads"));
const NewProjectWizard = lazy(() => import("./pages/developer/NewProjectWizard"));
const EditProjectWizard = lazy(() => import("./pages/developer/EditProjectWizard"));
const DeveloperBlog = lazy(() => import("./pages/developer/DeveloperBlog"));
const DeveloperBlogWizard = lazy(() => import("./pages/developer/DeveloperBlogWizard"));
const DeveloperBillingPage = lazy(() => import("./pages/developer/DeveloperBilling"));

// Admin - lazy load (rarely visited by regular users)
const AdminLayout = lazy(() => import("./pages/admin/AdminLayout").then(m => ({ default: m.AdminLayout })));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings").then(m => ({ default: m.AdminSettings })));
const AdminCitiesPage = lazy(() => import("./pages/admin/AdminCitiesPage").then(m => ({ default: m.AdminCitiesPage })));
const AdminMarketDataPage = lazy(() => import("./pages/admin/AdminMarketDataPage").then(m => ({ default: m.AdminMarketDataPage })));
const AdminContactSubmissions = lazy(() => import("./pages/admin/AdminContactSubmissions").then(m => ({ default: m.AdminContactSubmissions })));
const AdminFeatured = lazy(() => import("./pages/admin/AdminFeatured"));
const AdminFeatureFlags = lazy(() => import("./pages/admin/AdminFeatureFlags").then(m => ({ default: m.AdminFeatureFlags })));
const AdminGlossary = lazy(() => import("./pages/admin/AdminGlossary").then(m => ({ default: m.AdminGlossary })));
const AdminAnnouncements = lazy(() => import("./pages/admin/AdminAnnouncements").then(m => ({ default: m.AdminAnnouncements })));
const AdminProperties = lazy(() => import("./pages/admin/AdminProperties"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminBlog = lazy(() => import("./pages/admin/AdminBlog"));
const AdminAccuracyAudit = lazy(() => import("./pages/admin/AdminAccuracyAudit"));
const AdminListingReview = lazy(() => import("./pages/admin/AdminListingReview"));
const AdminBlogReview = lazy(() => import("./pages/admin/AdminBlogReview"));
const AdminAgents = lazy(() => import("./pages/admin/AdminAgents"));
const AdminAgencies = lazy(() => import("./pages/admin/AdminAgencies"));
const AdminDevelopers = lazy(() => import("./pages/admin/AdminDevelopers"));
const AdminProjects = lazy(() => import("./pages/admin/AdminProjects"));
const AdminAnalytics = lazy(() => import("./pages/admin/AdminAnalytics"));
const AdminSoldTransactions = lazy(() => import("./pages/admin/SoldTransactionsAdmin"));
const HeroImageGenerator = lazy(() => import("./pages/admin/HeroImageGenerator"));
const HeroPreview = lazy(() => import("./pages/admin/HeroPreview"));
const ImportNeighborhoods = lazy(() => import("./pages/admin/ImportNeighborhoods"));
const AdminClientErrors = lazy(() => import("./pages/admin/AdminClientErrors"));
const AdminEnterpriseInquiries = lazy(() => import("./pages/admin/AdminEnterpriseInquiries"));
// Global query client config for optimal caching
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes - data doesn't change frequently
      gcTime: 10 * 60 * 1000,   // 10 minutes garbage collection
      refetchOnWindowFocus: false, // Prevent refetch when switching browser tabs
      retry: 1, // Only retry once on failure
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <FavoritesProvider>
        <PreferencesProvider>
          <CompareProvider>
          <TooltipProvider>
            <ErrorBoundary>
              <Toaster />
                <Sonner />
                <WhatsAppFallbackModal>
                  <BrowserRouter>
                    <PageTracker />
                    <ScrollToTop />
                    <Suspense fallback={<PageLoader />}>
                      <Routes>
                        {/* Critical path - static imports */}
                        <Route path="/" element={<Index />} />
                        <Route path="/listings" element={<Listings />} />
                        <Route path="/property/:id" element={<PropertyDetail />} />
                        <Route path="/projects" element={<Projects />} />
                        <Route path="/projects/:slug" element={<ProjectDetail />} />
                        <Route path="/auth" element={<Auth />} />
                        
                        {/* Route aliases - redirect old/intuitive URLs to /listings */}
                        <Route path="/buy" element={<Navigate to="/listings?status=for_sale" replace />} />
                        <Route path="/rent" element={<Navigate to="/listings?status=for_rent" replace />} />
                        
                        {/* Tool URL redirects for backwards compatibility */}
                        <Route path="/tools/mortgage-calculator" element={<Navigate to="/tools?tool=mortgage" replace />} />
                        <Route path="/tools/mortgage" element={<Navigate to="/tools?tool=mortgage" replace />} />
                        <Route path="/tools/total-cost-calculator" element={<Navigate to="/tools?tool=totalcost" replace />} />
                        <Route path="/tools/true-cost-calculator" element={<Navigate to="/tools?tool=totalcost" replace />} />
                        <Route path="/tools/true-cost" element={<Navigate to="/tools?tool=totalcost" replace />} />
                        <Route path="/tools/affordability-calculator" element={<Navigate to="/tools?tool=affordability" replace />} />
                        <Route path="/tools/affordability" element={<Navigate to="/tools?tool=affordability" replace />} />
                        <Route path="/tools/rent-vs-buy" element={<Navigate to="/tools?tool=rentvsbuy" replace />} />
                        <Route path="/tools/renovation" element={<Navigate to="/tools?tool=renovation" replace />} />
                        <Route path="/tools/purchase-tax-calculator" element={<Navigate to="/tools?tool=purchasetax" replace />} />
                        
                        
                        {/* Lazy loaded routes */}
                        <Route path="/map" element={<MapSearch />} />
                        <Route path="/get-started" element={<GetStarted />} />
                        <Route path="/compare" element={<Compare />} />
                        <Route path="/compare-projects" element={<CompareProjects />} />
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
                        <Route path="/guides/new-construction" element={<NewConstructionGuide />} />
                        <Route path="/guides/oleh-buyer" element={<OlehBuyerGuide />} />
                        <Route path="/guides/investment-property" element={<InvestmentPropertyGuide />} />
                        <Route path="/developers" element={<Developers />} />
                        <Route path="/developers/:slug" element={<DeveloperDetail />} />
                        <Route path="/agents/:id" element={<AgentDetail />} />
                        <Route path="/agencies" element={<Agencies />} />
                        <Route path="/agencies/:slug" element={<AgencyDetail />} />
                        <Route path="/professionals" element={<Professionals />} />
                        <Route path="/professionals/:slug" element={<ProfessionalDetail />} />
                        <Route path="/contact" element={<Contact />} />
                        <Route path="/about" element={<Principles />} />
                        <Route path="/for-agents" element={<ForAgents />} />
                        
                        <Route path="/advertise" element={<Advertise />} />
                        <Route path="/pricing" element={<Pricing />} />
                        <Route path="/checkout/success" element={<CheckoutSuccess />} />
                        <Route path="/checkout/cancel" element={<CheckoutCancel />} />
                        
                        {/* Legal pages */}
                        <Route path="/privacy" element={<PrivacyPolicy />} />
                        <Route path="/terms" element={<TermsOfService />} />
                        
                        {/* Auth pages */}
                        <Route path="/forgot-password" element={<ForgotPassword />} />
                        <Route path="/reset-password" element={<ResetPassword />} />
                        
                        {/* Protected user routes */}
                        <Route path="/profile" element={
                          <ProtectedRoute>
                            <Profile />
                          </ProtectedRoute>
                        } />
                        <Route path="/favorites" element={<Favorites />} />
                        
                        {/* Agent routes */}
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
                            <Navigate to="/agent/properties" replace />
                          </ProtectedRoute>
                        } />
                        <Route path="/agent/properties/:id/edit" element={
                          <ProtectedRoute requiredRole="agent">
                            <Navigate to="/agent/properties" replace />
                          </ProtectedRoute>
                        } />
                        <Route path="/agent/blog" element={
                          <ProtectedRoute requiredRole="agent">
                            <AgentBlog />
                          </ProtectedRoute>
                        } />
                        <Route path="/agent/blog/new" element={
                          <ProtectedRoute requiredRole="agent">
                            <AgentBlogWizard />
                          </ProtectedRoute>
                        } />
                        <Route path="/agent/blog/:id/edit" element={
                          <ProtectedRoute requiredRole="agent">
                            <AgentBlogWizard />
                          </ProtectedRoute>
                        } />
                        
                        {/* Agency routes */}
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
                        <Route path="/agency/listings" element={
                          <ProtectedRoute>
                            <AgencyListingsPage />
                          </ProtectedRoute>
                        } />
                        <Route path="/agency/properties/new" element={
                          <ProtectedRoute>
                            <AgencyNewPropertyWizard />
                          </ProtectedRoute>
                        } />
                        <Route path="/agency/properties/:id/edit" element={
                          <ProtectedRoute>
                            <AgencyEditPropertyWizard />
                          </ProtectedRoute>
                        } />
                        <Route path="/agency/blog/new" element={
                          <ProtectedRoute>
                            <AgencyBlogWizard />
                          </ProtectedRoute>
                        } />
                        <Route path="/agency/blog/:id/edit" element={
                          <ProtectedRoute>
                            <AgencyBlogWizard />
                          </ProtectedRoute>
                        } />
                        <Route path="/agency/billing" element={
                          <ProtectedRoute>
                            <AgencyBilling />
                          </ProtectedRoute>
                        } />
                        <Route path="/agency/featured" element={
                          <ProtectedRoute>
                            <AgencyFeatured />
                          </ProtectedRoute>
                        } />
                        
                        {/* Developer routes */}
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
                        <Route path="/developer/projects/:id/edit" element={
                          <ProtectedRoute requiredRole="developer">
                            <EditProjectWizard />
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
                        <Route path="/developer/blog" element={
                          <ProtectedRoute requiredRole="developer">
                            <DeveloperBlog />
                          </ProtectedRoute>
                        } />
                        <Route path="/developer/blog/new" element={
                          <ProtectedRoute requiredRole="developer">
                            <DeveloperBlogWizard />
                          </ProtectedRoute>
                        } />
                        <Route path="/developer/blog/:id/edit" element={
                          <ProtectedRoute requiredRole="developer">
                            <DeveloperBlogWizard />
                          </ProtectedRoute>
                        } />
                        <Route path="/developer/settings" element={
                          <ProtectedRoute requiredRole="developer">
                            <DeveloperSettings />
                          </ProtectedRoute>
                        } />
                        <Route path="/developer/billing" element={
                          <ProtectedRoute requiredRole="developer">
                            <DeveloperBillingPage />
                          </ProtectedRoute>
                        } />
                        
                        {/* Admin routes */}
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
                          <Route path="blog-review" element={<AdminBlogReview />} />
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
                          <Route path="featured" element={<AdminFeatured />} />
                          <Route path="sold-transactions" element={<AdminSoldTransactions />} />
                          <Route path="import-neighborhoods" element={<ImportNeighborhoods />} />
                          <Route path="errors" element={<AdminClientErrors />} />
                          <Route path="enterprise-inquiries" element={<AdminEnterpriseInquiries />} />
                        </Route>
                        
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </Suspense>
                  </BrowserRouter>
                </WhatsAppFallbackModal>
            </ErrorBoundary>
          </TooltipProvider>
        </CompareProvider>
      </PreferencesProvider>
    </FavoritesProvider>
  </AuthProvider>
  </QueryClientProvider>
);

export default App;
