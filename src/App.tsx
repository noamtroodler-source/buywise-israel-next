import { Suspense, lazy, type ComponentType } from "react";
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

type LazyPageModule = { default: ComponentType<any> };

const lazyWithRetry = (loadPage: () => Promise<LazyPageModule>, routeName: string) =>
  lazy(async () => {
    let lastError: unknown;

    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const page = await loadPage();
        sessionStorage.removeItem(`lazy-reload:${routeName}`);
        return page;
      } catch (error) {
        lastError = error;
        await new Promise((resolve) => window.setTimeout(resolve, 250 * (attempt + 1)));
      }
    }

    const message = lastError instanceof Error ? lastError.message : String(lastError);
    const isModuleFetchFailure = message.includes("Failed to fetch dynamically imported module");
    const reloadKey = `lazy-reload:${routeName}`;

    if (isModuleFetchFailure && !sessionStorage.getItem(reloadKey)) {
      sessionStorage.setItem(reloadKey, String(Date.now()));
      window.location.reload();
      return { default: PageLoader };
    }

    throw lastError;
  });

function Index() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="container flex min-h-screen flex-col justify-center gap-8 py-16">
        <div className="max-w-3xl space-y-6">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">BuyWise Israel</p>
          <h1 className="text-4xl font-bold leading-tight md:text-6xl">
            Navigate Israel real estate with clarity.
          </h1>
          <p className="max-w-2xl text-lg text-muted-foreground">
            Search listings, compare markets, calculate costs, and connect with verified professionals — built for international buyers.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link to="/listings?status=for_sale" className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground hover:bg-primary/90">
              Browse Listings
            </Link>
            <Link to="/projects" className="inline-flex h-11 items-center justify-center rounded-md border border-border bg-background px-5 text-sm font-medium hover:bg-muted">
              View Projects
            </Link>
            <Link to="/agency/listings" className="inline-flex h-11 items-center justify-center rounded-md border border-border bg-background px-5 text-sm font-medium hover:bg-muted">
              Agency Portal
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

// Keep the startup bundle route-agnostic. Every heavy page loads only when matched,
// so one broken/heavy page module cannot blank the entire preview.
const Listings = lazyWithRetry(() => import("./pages/Listings"), "Listings");
const PropertyDetail = lazyWithRetry(() => import("./pages/PropertyDetail"), "PropertyDetail");
const Projects = lazyWithRetry(() => import("./pages/Projects"), "Projects");
const ProjectDetail = lazyWithRetry(() => import("./pages/ProjectDetail"), "ProjectDetail");
const Auth = lazyWithRetry(() => import("./pages/Auth"), "Auth");
const SetupPassword = lazyWithRetry(() => import("./pages/auth/SetupPassword"), "SetupPassword");
const NotFound = lazyWithRetry(() => import("./pages/NotFound"), "NotFound");

// Lazy load secondary routes for smaller initial bundle
const Compare = lazyWithRetry(() => import("./pages/Compare"), "Compare");
const CompareProjects = lazyWithRetry(() => import("./pages/CompareProjects"), "CompareProjects");
const Blog = lazyWithRetry(() => import("./pages/Blog"), "Blog");
const BlogPost = lazyWithRetry(() => import("./pages/BlogPost"), "BlogPost");
const Areas = lazyWithRetry(() => import("./pages/Areas"), "Areas");
const AreaDetail = lazyWithRetry(() => import("./pages/AreaDetail"), "AreaDetail");
const Tools = lazyWithRetry(() => import("./pages/Tools"), "Tools");
const Glossary = lazyWithRetry(() => import("./pages/Glossary"), "Glossary");
const Developers = lazyWithRetry(() => import("./pages/Developers"), "Developers");
const DeveloperDetail = lazyWithRetry(() => import("./pages/DeveloperDetail"), "DeveloperDetail");
const AgentDetail = lazyWithRetry(() => import("./pages/AgentDetail"), "AgentDetail");
const Agencies = lazyWithRetry(() => import("./pages/Agencies"), "Agencies");
const AgencyDetail = lazyWithRetry(() => import("./pages/AgencyDetail"), "AgencyDetail");
const Professionals = lazyWithRetry(() => import("./pages/Professionals"), "Professionals");
const ProfessionalDetail = lazyWithRetry(() => import("./pages/ProfessionalDetail"), "ProfessionalDetail");
const Contact = lazyWithRetry(() => import("./pages/Contact"), "Contact");
const Principles = lazyWithRetry(() => import("./pages/Principles"), "Principles");
const ForAgents = lazyWithRetry(() => import("./pages/ForAgents"), "ForAgents");

const Advertise = lazyWithRetry(() => import("./pages/Advertise"), "Advertise");
const GetStarted = lazyWithRetry(() => import("./pages/GetStarted"), "GetStarted");
const Pricing = lazyWithRetry(() => import("./pages/Pricing"), "Pricing");
const CheckoutSuccess = lazyWithRetry(() => import("./pages/CheckoutSuccess"), "CheckoutSuccess");
const CheckoutCancel = lazyWithRetry(() => import("./pages/CheckoutCancel"), "CheckoutCancel");
const Profile = lazyWithRetry(() => import("./pages/Profile"), "Profile");
const MyJourney = lazyWithRetry(() => import("./pages/MyJourney"), "MyJourney");
const Favorites = lazyWithRetry(() => import("./pages/Favorites"), "Favorites");
const MapSearch = lazyWithRetry(() => import("./pages/MapSearch"), "MapSearch");

// Legal pages
const PrivacyPolicy = lazyWithRetry(() => import("./pages/legal/PrivacyPolicy"), "PrivacyPolicy");
const TermsOfService = lazyWithRetry(() => import("./pages/legal/TermsOfService"), "TermsOfService");

// Auth pages
const ForgotPassword = lazyWithRetry(() => import("./pages/ForgotPassword"), "ForgotPassword");
const ResetPassword = lazyWithRetry(() => import("./pages/ResetPassword"), "ResetPassword");

// Guides - lazy load
const Guides = lazyWithRetry(() => import("./pages/Guides"), "Guides");
const BuyingPropertyGuide = lazyWithRetry(() => import("./pages/guides/BuyingPropertyGuide"), "BuyingPropertyGuide");
const ListingsGuide = lazyWithRetry(() => import("./pages/guides/ListingsGuide"), "ListingsGuide");
const PurchaseTaxGuide = lazyWithRetry(() => import("./pages/guides/PurchaseTaxGuide"), "PurchaseTaxGuide");
const TrueCostGuide = lazyWithRetry(() => import("./pages/guides/TrueCostGuide"), "TrueCostGuide");
const TalkingToProfessionalsGuide = lazyWithRetry(() => import("./pages/guides/TalkingToProfessionalsGuide"), "TalkingToProfessionalsGuide");
const MortgagesGuide = lazyWithRetry(() => import("./pages/guides/MortgagesGuide"), "MortgagesGuide");
const NewVsResaleGuide = lazyWithRetry(() => import("./pages/guides/NewVsResaleGuide"), "NewVsResaleGuide");
const RentVsBuyGuide = lazyWithRetry(() => import("./pages/guides/RentVsBuyGuide"), "RentVsBuyGuide");
const NewConstructionGuide = lazyWithRetry(() => import("./pages/guides/NewConstructionGuide"), "NewConstructionGuide");
const OlehBuyerGuide = lazyWithRetry(() => import("./pages/guides/OlehBuyerGuide"), "OlehBuyerGuide");
const InvestmentPropertyGuide = lazyWithRetry(() => import("./pages/guides/InvestmentPropertyGuide"), "InvestmentPropertyGuide");
// Agent dashboard - lazy load
const AgentRegisterWizard = lazyWithRetry(() => import("./pages/agent/AgentRegisterWizard"), "AgentRegisterWizard");
const AgentDashboard = lazyWithRetry(() => import("./pages/agent/AgentDashboard"), "AgentDashboard");
const AgentProperties = lazyWithRetry(() => import("./pages/agent/AgentProperties"), "AgentProperties");
const NewPropertyWizard = lazyWithRetry(() => import("./pages/agent/NewPropertyWizard"), "NewPropertyWizard");
const AgentAnalytics = lazyWithRetry(() => import("./pages/agent/AgentAnalytics"), "AgentAnalytics");
const AgentSettings = lazyWithRetry(() => import("./pages/agent/AgentSettings"), "AgentSettings");
const AgentLeads = lazyWithRetry(() => import("./pages/agent/AgentLeads"), "AgentLeads");
const EditPropertyWizard = lazyWithRetry(() => import("./pages/agent/EditPropertyWizard"), "EditPropertyWizard");
const AgentBlog = lazyWithRetry(() => import("./pages/agent/AgentBlog"), "AgentBlog");
const AgentBlogWizard = lazyWithRetry(() => import("./pages/agent/AgentBlogWizard"), "AgentBlogWizard");

// Agency dashboard - lazy load
const AgencyRegister = lazyWithRetry(() => import("./pages/agency/AgencyRegister"), "AgencyRegister");
const AgencyDashboard = lazyWithRetry(() => import("./pages/agency/AgencyDashboard"), "AgencyDashboard");
const AgencyAnalytics = lazyWithRetry(() => import("./pages/agency/AgencyAnalytics"), "AgencyAnalytics");
const AgencySettings = lazyWithRetry(() => import("./pages/agency/AgencySettings"), "AgencySettings");
const AgencyListingsPage = lazyWithRetry(() => import("./pages/agency/AgencyListings"), "AgencyListingsPage");
const AgencyNewPropertyWizard = lazyWithRetry(() => import("./pages/agency/AgencyNewPropertyWizard"), "AgencyNewPropertyWizard");
const AgencyEditPropertyWizard = lazyWithRetry(() => import("./pages/agency/AgencyEditPropertyWizard"), "AgencyEditPropertyWizard");
const AgencyNewProjectWizard = lazyWithRetry(() => import("./pages/agency/AgencyNewProjectWizard"), "AgencyNewProjectWizard");
const AgencyBlogManagement = lazyWithRetry(() => import("./pages/agency/AgencyBlogManagement"), "AgencyBlogManagement");
const AgencyBlogWizard = lazyWithRetry(() => import("./pages/agency/AgencyBlogWizard"), "AgencyBlogWizard");
const AgencyBilling = lazyWithRetry(() => import("./pages/agency/AgencyBilling"), "AgencyBilling");
const AgencyFeatured = lazyWithRetry(() => import("./pages/agency/AgencyFeatured"), "AgencyFeatured");
const AgencyImport = lazyWithRetry(() => import("./pages/agency/AgencyImport"), "AgencyImport");
const AgencyImportReview = lazyWithRetry(() => import("./pages/agency/AgencyImportReview"), "AgencyImportReview");
const AgencyConflicts = lazyWithRetry(() => import("./pages/agency/AgencyConflicts"), "AgencyConflicts");
const AgencySources = lazyWithRetry(() => import("./pages/agency/AgencySources"), "AgencySources");
const AgencyTeam = lazyWithRetry(() => import("./pages/agency/AgencyTeam"), "AgencyTeam");

// Developer dashboard - lazy load
const DeveloperRegister = lazyWithRetry(() => import("./pages/developer/DeveloperRegister"), "DeveloperRegister");
const DeveloperDashboard = lazyWithRetry(() => import("./pages/developer/DeveloperDashboard"), "DeveloperDashboard");
const DeveloperProjects = lazyWithRetry(() => import("./pages/developer/DeveloperProjects"), "DeveloperProjects");
const DeveloperAnalytics = lazyWithRetry(() => import("./pages/developer/DeveloperAnalytics"), "DeveloperAnalytics");
const DeveloperSettings = lazyWithRetry(() => import("./pages/developer/DeveloperSettings"), "DeveloperSettings");
const DeveloperLeads = lazyWithRetry(() => import("./pages/developer/DeveloperLeads"), "DeveloperLeads");
const NewProjectWizard = lazyWithRetry(() => import("./pages/developer/NewProjectWizard"), "NewProjectWizard");
const EditProjectWizard = lazyWithRetry(() => import("./pages/developer/EditProjectWizard"), "EditProjectWizard");
const DeveloperBlog = lazyWithRetry(() => import("./pages/developer/DeveloperBlog"), "DeveloperBlog");
const DeveloperBlogWizard = lazyWithRetry(() => import("./pages/developer/DeveloperBlogWizard"), "DeveloperBlogWizard");
const DeveloperBillingPage = lazyWithRetry(() => import("./pages/developer/DeveloperBilling"), "DeveloperBillingPage");

// Admin - lazy load (rarely visited by regular users)
const AdminLayout = lazyWithRetry(() => import("./pages/admin/AdminLayout").then(m => ({ default: m.AdminLayout })), "AdminLayout");
const AdminDashboard = lazyWithRetry(() => import("./pages/admin/AdminDashboard"), "AdminDashboard");
const AdminSettings = lazyWithRetry(() => import("./pages/admin/AdminSettings").then(m => ({ default: m.AdminSettings })), "AdminSettings");
const AdminCitiesPage = lazyWithRetry(() => import("./pages/admin/AdminCitiesPage").then(m => ({ default: m.AdminCitiesPage })), "AdminCitiesPage");
const AdminMarketDataPage = lazyWithRetry(() => import("./pages/admin/AdminMarketDataPage").then(m => ({ default: m.AdminMarketDataPage })), "AdminMarketDataPage");
const AdminContactSubmissions = lazyWithRetry(() => import("./pages/admin/AdminContactSubmissions").then(m => ({ default: m.AdminContactSubmissions })), "AdminContactSubmissions");
const AdminFeatured = lazyWithRetry(() => import("./pages/admin/AdminFeatured"), "AdminFeatured");
const AdminFeatureFlags = lazyWithRetry(() => import("./pages/admin/AdminFeatureFlags").then(m => ({ default: m.AdminFeatureFlags })), "AdminFeatureFlags");
const AdminGlossary = lazyWithRetry(() => import("./pages/admin/AdminGlossary").then(m => ({ default: m.AdminGlossary })), "AdminGlossary");
const AdminAnnouncements = lazyWithRetry(() => import("./pages/admin/AdminAnnouncements").then(m => ({ default: m.AdminAnnouncements })), "AdminAnnouncements");
const AdminProperties = lazyWithRetry(() => import("./pages/admin/AdminProperties"), "AdminProperties");
const AdminUsers = lazyWithRetry(() => import("./pages/admin/AdminUsers"), "AdminUsers");
const AdminBlog = lazyWithRetry(() => import("./pages/admin/AdminBlog"), "AdminBlog");
const AdminAccuracyAudit = lazyWithRetry(() => import("./pages/admin/AdminAccuracyAudit"), "AdminAccuracyAudit");
const AdminListingReview = lazyWithRetry(() => import("./pages/admin/AdminListingReview"), "AdminListingReview");
const AdminBlogReview = lazyWithRetry(() => import("./pages/admin/AdminBlogReview"), "AdminBlogReview");
const AdminAgents = lazyWithRetry(() => import("./pages/admin/AdminAgents"), "AdminAgents");
const AdminAgencies = lazyWithRetry(() => import("./pages/admin/AdminAgencies"), "AdminAgencies");
const AdminDevelopers = lazyWithRetry(() => import("./pages/admin/AdminDevelopers"), "AdminDevelopers");
const AdminProjects = lazyWithRetry(() => import("./pages/admin/AdminProjects"), "AdminProjects");
const AdminAnalytics = lazyWithRetry(() => import("./pages/admin/AdminAnalytics"), "AdminAnalytics");
const AdminSoldTransactions = lazyWithRetry(() => import("./pages/admin/SoldTransactionsAdmin"), "AdminSoldTransactions");
const HeroImageGenerator = lazyWithRetry(() => import("./pages/admin/HeroImageGenerator"), "HeroImageGenerator");
const HeroPreview = lazyWithRetry(() => import("./pages/admin/HeroPreview"), "HeroPreview");
const ImportNeighborhoods = lazyWithRetry(() => import("./pages/admin/ImportNeighborhoods"), "ImportNeighborhoods");
const ImportCBSData = lazyWithRetry(() => import("./pages/admin/ImportCBSData"), "ImportCBSData");
const ImportGovMapData = lazyWithRetry(() => import("./pages/admin/ImportGovMapData"), "ImportGovMapData");
const MapNeighborhoods = lazyWithRetry(() => import("./pages/admin/MapNeighborhoods"), "MapNeighborhoods");
const AdminClientErrors = lazyWithRetry(() => import("./pages/admin/AdminClientErrors"), "AdminClientErrors");
const AdminEnterpriseInquiries = lazyWithRetry(() => import("./pages/admin/AdminEnterpriseInquiries"), "AdminEnterpriseInquiries");
const AdminWarmLeads = lazyWithRetry(() => import("./pages/admin/AdminWarmLeads"), "AdminWarmLeads");
const AdminDuplicates = lazyWithRetry(() => import("./pages/admin/AdminDuplicates"), "AdminDuplicates");
const AdminImportAnalytics = lazyWithRetry(() => import("./pages/admin/AdminImportAnalytics"), "AdminImportAnalytics");
const ImportNeighborhoodProfiles = lazyWithRetry(() => import("./pages/admin/ImportNeighborhoodProfiles"), "ImportNeighborhoodProfiles");
const AdminDataGovernance = lazyWithRetry(() => import("./pages/admin/AdminDataGovernance"), "AdminDataGovernance");
const AdminAgencyImport = lazyWithRetry(() => import("./pages/admin/AdminAgencyImport"), "AdminAgencyImport");
const AdminScrapingSources = lazyWithRetry(() => import("./pages/admin/AdminScrapingSources"), "AdminScrapingSources");
const AdminCrossAgencyConflicts = lazyWithRetry(() => import("./pages/admin/AdminCrossAgencyConflicts"), "AdminCrossAgencyConflicts");
const AdminAgencyProvisioning = lazyWithRetry(() => import("./pages/admin/AdminAgencyProvisioning"), "AdminAgencyProvisioning");
const AdminAgencyLifecycleIndex = lazyWithRetry(() => import("./pages/admin/AdminAgencyLifecycleIndex"), "AdminAgencyLifecycleIndex");
const AdminAgencyLifecycleDetail = lazyWithRetry(() => import("./pages/admin/AdminAgencyLifecycleDetail"), "AdminAgencyLifecycleDetail");
const AdminConflictAnalytics = lazyWithRetry(() => import("./pages/admin/AdminConflictAnalytics"), "AdminConflictAnalytics");
const AdminPrimaryHistory = lazyWithRetry(() => import("./pages/admin/AdminPrimaryHistory"), "AdminPrimaryHistory");
const AdminPrimaryDisputes = lazyWithRetry(() => import("./pages/admin/AdminPrimaryDisputes"), "AdminPrimaryDisputes");
const AdminMergeReversals = lazyWithRetry(() => import("./pages/admin/AdminMergeReversals"), "AdminMergeReversals");
const AdminColistingReports = lazyWithRetry(() => import("./pages/admin/AdminColistingReports"), "AdminColistingReports");
const AdminColistingTelemetry = lazyWithRetry(() => import("./pages/admin/AdminColistingTelemetry"), "AdminColistingTelemetry");
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
                </WhatsAppFallbackModal>
            </ErrorBoundary>
        </CompareProvider>
      </PreferencesProvider>
    </FavoritesProvider>
  </AuthProvider>
  </QueryClientProvider>
);

export default App;
