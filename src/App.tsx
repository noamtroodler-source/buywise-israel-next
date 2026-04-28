import { Suspense, lazy, type ComponentType, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { CompareProvider } from "@/contexts/CompareContext";
import { PreferencesProvider } from "@/contexts/PreferencesContext";
import { FavoritesProvider } from "@/contexts/FavoritesContext";
import { ProtectedRoute } from "@/components/shared/ProtectedRoute";
import { ScrollToTop } from "@/components/shared/ScrollToTop";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { PageLoader } from "@/components/shared/PageLoader";
import { PageTracker } from "@/hooks/usePageTracking";
import Index from "./pages/Index";
import Listings from "./pages/Listings";
import PropertyDetail from "./pages/PropertyDetail";
import Projects from "./pages/Projects";
import ProjectDetail from "./pages/ProjectDetail";
import Auth from "./pages/Auth";

type LazyPageModule = { default: ComponentType<any> };

const lazyPage = (loadPage: () => Promise<LazyPageModule>) => lazy(loadPage);

const SectionFallback = ({ label = "this section" }: { label?: string }) => (
  <div className="min-h-[420px] flex items-center justify-center bg-background px-6 text-foreground">
    <div className="max-w-md text-center space-y-3">
      <h2 className="text-xl font-semibold">We couldn’t open {label}</h2>
      <p className="text-sm text-muted-foreground">Please refresh once. If it continues, the rest of the site remains available.</p>
    </div>
  </div>
);

const RouteBoundary = ({ children, label }: { children: ReactNode; label?: string }) => (
  <ErrorBoundary fallback={<SectionFallback label={label} />}>
    {children}
  </ErrorBoundary>
);

// Keep the startup bundle route-agnostic. Every heavy page loads only when matched,
// so one broken/heavy page module cannot blank the entire preview.
const SetupPassword = lazyPage(() => import("./pages/auth/SetupPassword"));
const NotFound = lazyPage(() => import("./pages/NotFound"));

// Lazy load secondary routes for smaller initial bundle
const Compare = lazyPage(() => import("./pages/Compare"));
const CompareProjects = lazyPage(() => import("./pages/CompareProjects"));
const Blog = lazyPage(() => import("./pages/Blog"));
const BlogPost = lazyPage(() => import("./pages/BlogPost"));
const Areas = lazyPage(() => import("./pages/Areas"));
const AreaDetail = lazyPage(() => import("./pages/AreaDetail"));
const Tools = lazyPage(() => import("./pages/Tools"));
const Glossary = lazyPage(() => import("./pages/Glossary"));
const Developers = lazyPage(() => import("./pages/Developers"));
const DeveloperDetail = lazyPage(() => import("./pages/DeveloperDetail"));
const AgentDetail = lazyPage(() => import("./pages/AgentDetail"));
const Agencies = lazyPage(() => import("./pages/Agencies"));
const AgencyDetail = lazyPage(() => import("./pages/AgencyDetail"));
const Professionals = lazyPage(() => import("./pages/Professionals"));
const ProfessionalDetail = lazyPage(() => import("./pages/ProfessionalDetail"));
const Contact = lazyPage(() => import("./pages/Contact"));
const Principles = lazyPage(() => import("./pages/Principles"));
const ForAgents = lazyPage(() => import("./pages/ForAgents"));

const Advertise = lazyPage(() => import("./pages/Advertise"));
const GetStarted = lazyPage(() => import("./pages/GetStarted"));
const Pricing = lazyPage(() => import("./pages/Pricing"));
const CheckoutSuccess = lazyPage(() => import("./pages/CheckoutSuccess"));
const CheckoutCancel = lazyPage(() => import("./pages/CheckoutCancel"));
const Profile = lazyPage(() => import("./pages/Profile"));
const MyJourney = lazyPage(() => import("./pages/MyJourney"));
const Favorites = lazyPage(() => import("./pages/Favorites"));
const MapSearch = lazyPage(() => import("./pages/MapSearch"));

// Legal pages
const PrivacyPolicy = lazyPage(() => import("./pages/legal/PrivacyPolicy"));
const TermsOfService = lazyPage(() => import("./pages/legal/TermsOfService"));

// Auth pages
const ForgotPassword = lazyPage(() => import("./pages/ForgotPassword"));
const ResetPassword = lazyPage(() => import("./pages/ResetPassword"));

// Guides - lazy load
const Guides = lazyPage(() => import("./pages/Guides"));
const BuyingPropertyGuide = lazyPage(() => import("./pages/guides/BuyingPropertyGuide"));
const ListingsGuide = lazyPage(() => import("./pages/guides/ListingsGuide"));
const PurchaseTaxGuide = lazyPage(() => import("./pages/guides/PurchaseTaxGuide"));
const TrueCostGuide = lazyPage(() => import("./pages/guides/TrueCostGuide"));
const TalkingToProfessionalsGuide = lazyPage(() => import("./pages/guides/TalkingToProfessionalsGuide"));
const MortgagesGuide = lazyPage(() => import("./pages/guides/MortgagesGuide"));
const NewVsResaleGuide = lazyPage(() => import("./pages/guides/NewVsResaleGuide"));
const RentVsBuyGuide = lazyPage(() => import("./pages/guides/RentVsBuyGuide"));
const NewConstructionGuide = lazyPage(() => import("./pages/guides/NewConstructionGuide"));
const OlehBuyerGuide = lazyPage(() => import("./pages/guides/OlehBuyerGuide"));
const InvestmentPropertyGuide = lazyPage(() => import("./pages/guides/InvestmentPropertyGuide"));
// Agent dashboard - lazy load
const AgentRegisterWizard = lazyPage(() => import("./pages/agent/AgentRegisterWizard"));
const AgentDashboard = lazyPage(() => import("./pages/agent/AgentDashboard"));
const AgentProperties = lazyPage(() => import("./pages/agent/AgentProperties"));
const NewPropertyWizard = lazyPage(() => import("./pages/agent/NewPropertyWizard"));
const AgentAnalytics = lazyPage(() => import("./pages/agent/AgentAnalytics"));
const AgentSettings = lazyPage(() => import("./pages/agent/AgentSettings"));
const AgentLeads = lazyPage(() => import("./pages/agent/AgentLeads"));
const EditPropertyWizard = lazyPage(() => import("./pages/agent/EditPropertyWizard"));
const AgentBlog = lazyPage(() => import("./pages/agent/AgentBlog"));
const AgentBlogWizard = lazyPage(() => import("./pages/agent/AgentBlogWizard"));

// Agency dashboard - lazy load
const AgencyRegister = lazyPage(() => import("./pages/agency/AgencyRegister"));
const AgencyDashboard = lazyPage(() => import("./pages/agency/AgencyDashboard"));
const AgencyAnalytics = lazyPage(() => import("./pages/agency/AgencyAnalytics"));
const AgencySettings = lazyPage(() => import("./pages/agency/AgencySettings"));
const AgencyListingsPage = lazyPage(() => import("./pages/agency/AgencyListings"));
const AgencyNewPropertyWizard = lazyPage(() => import("./pages/agency/AgencyNewPropertyWizard"));
const AgencyEditPropertyWizard = lazyPage(() => import("./pages/agency/AgencyEditPropertyWizard"));
const AgencyNewProjectWizard = lazyPage(() => import("./pages/agency/AgencyNewProjectWizard"));
const AgencyBlogManagement = lazyPage(() => import("./pages/agency/AgencyBlogManagement"));
const AgencyBlogWizard = lazyPage(() => import("./pages/agency/AgencyBlogWizard"));
const AgencyBilling = lazyPage(() => import("./pages/agency/AgencyBilling"));
const AgencyFeatured = lazyPage(() => import("./pages/agency/AgencyFeatured"));
const AgencyImport = lazyPage(() => import("./pages/agency/AgencyImport"));
const AgencyImportReview = lazyPage(() => import("./pages/agency/AgencyImportReview"));
const AgencyConflicts = lazyPage(() => import("./pages/agency/AgencyConflicts"));
const AgencySources = lazyPage(() => import("./pages/agency/AgencySources"));
const AgencyTeam = lazyPage(() => import("./pages/agency/AgencyTeam"));

// Developer dashboard - lazy load
const DeveloperRegister = lazyPage(() => import("./pages/developer/DeveloperRegister"));
const DeveloperDashboard = lazyPage(() => import("./pages/developer/DeveloperDashboard"));
const DeveloperProjects = lazyPage(() => import("./pages/developer/DeveloperProjects"));
const DeveloperAnalytics = lazyPage(() => import("./pages/developer/DeveloperAnalytics"));
const DeveloperSettings = lazyPage(() => import("./pages/developer/DeveloperSettings"));
const DeveloperLeads = lazyPage(() => import("./pages/developer/DeveloperLeads"));
const NewProjectWizard = lazyPage(() => import("./pages/developer/NewProjectWizard"));
const EditProjectWizard = lazyPage(() => import("./pages/developer/EditProjectWizard"));
const DeveloperBlog = lazyPage(() => import("./pages/developer/DeveloperBlog"));
const DeveloperBlogWizard = lazyPage(() => import("./pages/developer/DeveloperBlogWizard"));
const DeveloperBillingPage = lazyPage(() => import("./pages/developer/DeveloperBilling"));

// Admin - lazy load (rarely visited by regular users)
const AdminLayout = lazyPage(() => import("./pages/admin/AdminLayout").then(m => ({ default: m.AdminLayout })));
const AdminDashboard = lazyPage(() => import("./pages/admin/AdminDashboard"));
const AdminSettings = lazyPage(() => import("./pages/admin/AdminSettings").then(m => ({ default: m.AdminSettings })));
const AdminCitiesPage = lazyPage(() => import("./pages/admin/AdminCitiesPage").then(m => ({ default: m.AdminCitiesPage })));
const AdminMarketDataPage = lazyPage(() => import("./pages/admin/AdminMarketDataPage").then(m => ({ default: m.AdminMarketDataPage })));
const AdminContactSubmissions = lazyPage(() => import("./pages/admin/AdminContactSubmissions").then(m => ({ default: m.AdminContactSubmissions })));
const AdminFeatured = lazyPage(() => import("./pages/admin/AdminFeatured"));
const AdminFeatureFlags = lazyPage(() => import("./pages/admin/AdminFeatureFlags").then(m => ({ default: m.AdminFeatureFlags })));
const AdminGlossary = lazyPage(() => import("./pages/admin/AdminGlossary").then(m => ({ default: m.AdminGlossary })));
const AdminAnnouncements = lazyPage(() => import("./pages/admin/AdminAnnouncements").then(m => ({ default: m.AdminAnnouncements })));
const AdminProperties = lazyPage(() => import("./pages/admin/AdminProperties"));
const AdminUsers = lazyPage(() => import("./pages/admin/AdminUsers"));
const AdminBlog = lazyPage(() => import("./pages/admin/AdminBlog"));
const AdminAccuracyAudit = lazyPage(() => import("./pages/admin/AdminAccuracyAudit"));
const AdminListingReview = lazyPage(() => import("./pages/admin/AdminListingReview"));
const AdminBlogReview = lazyPage(() => import("./pages/admin/AdminBlogReview"));
const AdminAgents = lazyPage(() => import("./pages/admin/AdminAgents"));
const AdminAgencies = lazyPage(() => import("./pages/admin/AdminAgencies"));
const AdminDevelopers = lazyPage(() => import("./pages/admin/AdminDevelopers"));
const AdminProjects = lazyPage(() => import("./pages/admin/AdminProjects"));
const AdminAnalytics = lazyPage(() => import("./pages/admin/AdminAnalytics"));
const AdminSoldTransactions = lazyPage(() => import("./pages/admin/SoldTransactionsAdmin"));
const HeroImageGenerator = lazyPage(() => import("./pages/admin/HeroImageGenerator"));
const HeroPreview = lazyPage(() => import("./pages/admin/HeroPreview"));
const ImportNeighborhoods = lazyPage(() => import("./pages/admin/ImportNeighborhoods"));
const ImportCBSData = lazyPage(() => import("./pages/admin/ImportCBSData"));
const ImportGovMapData = lazyPage(() => import("./pages/admin/ImportGovMapData"));
const MapNeighborhoods = lazyPage(() => import("./pages/admin/MapNeighborhoods"));
const AdminClientErrors = lazyPage(() => import("./pages/admin/AdminClientErrors"));
const AdminEnterpriseInquiries = lazyPage(() => import("./pages/admin/AdminEnterpriseInquiries"));
const AdminWarmLeads = lazyPage(() => import("./pages/admin/AdminWarmLeads"));
const AdminDuplicates = lazyPage(() => import("./pages/admin/AdminDuplicates"));
const AdminImportAnalytics = lazyPage(() => import("./pages/admin/AdminImportAnalytics"));
const ImportNeighborhoodProfiles = lazyPage(() => import("./pages/admin/ImportNeighborhoodProfiles"));
const AdminDataGovernance = lazyPage(() => import("./pages/admin/AdminDataGovernance"));
const AdminAgencyImport = lazyPage(() => import("./pages/admin/AdminAgencyImport"));
const AdminScrapingSources = lazyPage(() => import("./pages/admin/AdminScrapingSources"));
const AdminCrossAgencyConflicts = lazyPage(() => import("./pages/admin/AdminCrossAgencyConflicts"));
const AdminAgencyProvisioning = lazyPage(() => import("./pages/admin/AdminAgencyProvisioning"));
const AdminAgencyLifecycleIndex = lazyPage(() => import("./pages/admin/AdminAgencyLifecycleIndex"));
const AdminAgencyLifecycleDetail = lazyPage(() => import("./pages/admin/AdminAgencyLifecycleDetail"));
const AdminConflictAnalytics = lazyPage(() => import("./pages/admin/AdminConflictAnalytics"));
const AdminPrimaryHistory = lazyPage(() => import("./pages/admin/AdminPrimaryHistory"));
const AdminPrimaryDisputes = lazyPage(() => import("./pages/admin/AdminPrimaryDisputes"));
const AdminMergeReversals = lazyPage(() => import("./pages/admin/AdminMergeReversals"));
const AdminColistingReports = lazyPage(() => import("./pages/admin/AdminColistingReports"));
const AdminColistingTelemetry = lazyPage(() => import("./pages/admin/AdminColistingTelemetry"));
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
            <ErrorBoundary>
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
                        <Route path="/auth/setup-password" element={<SetupPassword />} />
                        
                        {/* Route aliases - redirect old/intuitive URLs to /listings */}
                        <Route path="/buy" element={<Navigate to="/listings?status=for_sale" replace />} />
                        <Route path="/rent" element={<Navigate to="/listings?status=for_rent" replace />} />
                        
                        {/* Tool URL redirects for backwards compatibility */}
                        <Route path="/tools/mortgage-calculator" element={<Navigate to="/tools?tool=mortgage" replace />} />
                        <Route path="/tools/mortgage" element={<Navigate to="/tools?tool=mortgage" replace />} />
                        <Route path="/tools/total-cost-calculator" element={<Navigate to="/tools?tool=totalcost" replace />} />
                        <Route path="/tools/true-cost-calculator" element={<Navigate to="/tools?tool=totalcost" replace />} />
                        <Route path="/tools/true-cost" element={<Navigate to="/tools?tool=totalcost" replace />} />
                        <Route path="/tools/total-cost" element={<Navigate to="/tools?tool=totalcost" replace />} />
                        <Route path="/tools/affordability-calculator" element={<Navigate to="/tools?tool=affordability" replace />} />
                        <Route path="/tools/affordability" element={<Navigate to="/tools?tool=affordability" replace />} />
                        <Route path="/tools/rent-vs-buy" element={<Navigate to="/tools?tool=rentvsbuy" replace />} />
                        <Route path="/tools/renovation" element={<Navigate to="/tools?tool=renovation" replace />} />
                        <Route path="/tools/purchase-tax-calculator" element={<Navigate to="/tools?tool=totalcost" replace />} />
                        
                        
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
                        <Route path="/developers" element={<Navigate to="/" replace />} />
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
                        <Route path="/my-journey" element={
                          <ProtectedRoute>
                            <MyJourney />
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
                            <NewPropertyWizard />
                          </ProtectedRoute>
                        } />
                        <Route path="/agent/properties/:id/edit" element={
                          <ProtectedRoute requiredRole="agent">
                            <EditPropertyWizard />
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
                          <ProtectedRoute requiredRole="agent">
                            <AgencyDashboard />
                          </ProtectedRoute>
                        } />
                        <Route path="/agency/analytics" element={
                          <ProtectedRoute requiredRole="agent">
                            <AgencyAnalytics />
                          </ProtectedRoute>
                        } />
                        <Route path="/agency/settings" element={
                          <ProtectedRoute requiredRole="agent">
                            <AgencySettings />
                          </ProtectedRoute>
                        } />
                        <Route path="/agency/listings" element={
                          <ProtectedRoute requiredRole="agent">
                            <AgencyListingsPage />
                          </ProtectedRoute>
                        } />
                        <Route path="/agency/properties/new" element={
                          <ProtectedRoute requiredRole="agent">
                            <AgencyNewPropertyWizard />
                          </ProtectedRoute>
                        } />
                        <Route path="/agency/projects/new" element={
                          <ProtectedRoute requiredRole="agent">
                            <AgencyNewProjectWizard />
                          </ProtectedRoute>
                        } />
                        <Route path="/agency/properties/:id/edit" element={
                          <ProtectedRoute requiredRole="agent">
                            <AgencyEditPropertyWizard />
                          </ProtectedRoute>
                        } />
                        <Route path="/agency/blog" element={
                          <ProtectedRoute requiredRole="agent">
                            <AgencyBlogManagement />
                          </ProtectedRoute>
                        } />
                        <Route path="/agency/blog/new" element={
                          <ProtectedRoute requiredRole="agent">
                            <AgencyBlogWizard />
                          </ProtectedRoute>
                        } />
                        <Route path="/agency/blog/:id/edit" element={
                          <ProtectedRoute requiredRole="agent">
                            <AgencyBlogWizard />
                          </ProtectedRoute>
                        } />
                        <Route path="/agency/billing" element={
                          <ProtectedRoute requiredRole="agent">
                            <AgencyBilling />
                          </ProtectedRoute>
                        } />
                        <Route path="/agency/featured" element={
                          <ProtectedRoute requiredRole="agent">
                            <AgencyFeatured />
                          </ProtectedRoute>
                        } />
                        <Route path="/agency/import" element={
                          <ProtectedRoute requiredRole="agent">
                            <AgencyImport />
                          </ProtectedRoute>
                        } />
                        <Route path="/agency/import/:jobId/review" element={
                          <ProtectedRoute requiredRole="agent">
                            <AgencyImportReview />
                          </ProtectedRoute>
                        } />
                        <Route path="/agency/conflicts" element={
                          <ProtectedRoute requiredRole="agent">
                            <AgencyConflicts />
                          </ProtectedRoute>
                        } />
                        <Route path="/agency/sources" element={
                          <ProtectedRoute requiredRole="agent">
                            <AgencySources />
                          </ProtectedRoute>
                        } />
                        <Route path="/agency/team" element={
                          <ProtectedRoute requiredRole="agent">
                            <AgencyTeam />
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
                          <RouteBoundary label="the admin area">
                            <ProtectedRoute requiredRole="admin">
                              <AdminLayout />
                            </ProtectedRoute>
                          </RouteBoundary>
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
                          <Route path="import-cbs-data" element={<ImportCBSData />} />
                          <Route path="import-govmap" element={<ImportGovMapData />} />
                          <Route path="map-neighborhoods" element={<MapNeighborhoods />} />
                          <Route path="errors" element={<AdminClientErrors />} />
                          <Route path="enterprise-inquiries" element={<AdminEnterpriseInquiries />} />
                          <Route path="warm-leads" element={<AdminWarmLeads />} />
                          <Route path="duplicates" element={<AdminDuplicates />} />
                          <Route path="import-analytics" element={<AdminImportAnalytics />} />
                          <Route path="import-neighborhood-profiles" element={<ImportNeighborhoodProfiles />} />
                          <Route path="data-governance" element={<AdminDataGovernance />} />
                          <Route path="agency-import" element={<AdminAgencyImport />} />
                          <Route path="agency-provisioning" element={<AdminAgencyProvisioning />} />
                          <Route path="agencies" element={<AdminAgencyLifecycleIndex />} />
                          <Route path="agency-provisioning/:agencyId" element={<AdminAgencyLifecycleDetail />} />
                          <Route path="scraping-sources" element={<AdminScrapingSources />} />
                          <Route path="cross-agency-conflicts" element={<AdminCrossAgencyConflicts />} />
                          <Route path="cross-agency-conflicts/analytics" element={<AdminConflictAnalytics />} />
                          <Route path="primary-history" element={<AdminPrimaryHistory />} />
                          <Route path="primary-disputes" element={<AdminPrimaryDisputes />} />
                          <Route path="merge-reversals" element={<AdminMergeReversals />} />
                          <Route path="colisting-reports" element={<AdminColistingReports />} />
                          <Route path="colisting-telemetry" element={<AdminColistingTelemetry />} />
                        </Route>
                        
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </Suspense>
              </BrowserRouter>
            </ErrorBoundary>
        </CompareProvider>
      </PreferencesProvider>
    </FavoritesProvider>
  </AuthProvider>
  </QueryClientProvider>
);

export default App;
