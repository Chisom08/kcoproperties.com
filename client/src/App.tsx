import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
import { useEffect } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import About from "./pages/About";
import Properties from "./pages/Properties";
import PropertyDetail from "./pages/PropertyDetail";
import Vacancies from "./pages/Vacancies";
import Contact from "./pages/Contact";
import Apply from "./pages/Apply";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import ScheduleTour from "./pages/ScheduleTour";
import AdminDashboard from "./pages/AdminDashboard";
import Amenities from "./pages/Amenities";
import CorporateLease from "./pages/CorporateLease";

// Rental app feature module pages
import RentalIntroduction from "@/features/rental/pages/Introduction";
import RentalSignUp from "@/features/rental/pages/SignUp";
import RentalPersonalInfo from "@/features/rental/pages/PersonalInfo";
import RentalEmployment from "@/features/rental/pages/Employment";
import RentalEmergencyContacts from "@/features/rental/pages/EmergencyContacts";
import RentalGeneralInfo from "@/features/rental/pages/GeneralInfo";
import RentalAgreement from "@/features/rental/pages/RentalAgreement";
import RentalConfirmation from "@/features/rental/pages/Confirmation";
import RentalResumeApplication from "@/features/rental/pages/ResumeApplication";
import { OmiaChatWidget } from "@/features/rental/components/OmiaChatWidget";

// Redirect component for legacy /apply/agreement route
function RedirectToRentalAgreement() {
  const [, navigate] = useLocation();
  useEffect(() => {
    // Preserve query parameters when redirecting
    const search = window.location.search;
    navigate(`/rental/apply/agreement${search}`);
  }, [navigate]);
  return null;
}

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/about"} component={About} />
      <Route path={"/properties"} component={Properties} />
      <Route path={"/properties/:id"} component={PropertyDetail} />
      <Route path={"/vacancies"} component={Vacancies} />
      <Route path={"amenities"} component={Amenities} />
      <Route path={"corporate-lease"} component={CorporateLease} />
      <Route path={"/contact"} component={Contact} />
      <Route path={"/apply"} component={Apply} />
      {/* Redirect legacy /apply/agreement to /rental/apply/agreement */}
      <Route path={"/apply/agreement"} component={RedirectToRentalAgreement} />
      <Route path={"/privacy"} component={PrivacyPolicy} />
      <Route path={"/terms"} component={TermsOfService} />
      <Route path={"/properties/:id/schedule-tour"} component={ScheduleTour} />
      <Route path={"/admin"} component={AdminDashboard} />
      
      {/* Rental app feature module routes */}
      <Route path={"/rental"} component={RentalIntroduction} />
      <Route path={"/rental/signup"} component={RentalSignUp} />
      <Route path={"/rental/apply/personal"} component={RentalPersonalInfo} />
      <Route path={"/rental/apply/employment"} component={RentalEmployment} />
      <Route path={"/rental/apply/emergency"} component={RentalEmergencyContacts} />
      <Route path={"/rental/apply/general-info"} component={RentalGeneralInfo} />
      <Route path={"/rental/apply/agreement"} component={RentalAgreement} />
      <Route path={"/rental/apply/confirmation"} component={RentalConfirmation} />
      <Route path={"/rental/resume/:token"} component={RentalResumeApplication} />
      
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function ChatWidgetWrapper() {
  const [location] = useLocation();
  // Don't show on confirmation page
  if (location === "/rental/apply/confirmation") return null;

  const contextMap: Record<string, string> = {
    "/rental": "User is on the introduction page",
    "/rental/signup": "User is creating an account or logging in",
    "/rental/apply/personal": "User is filling out personal information",
    "/rental/apply/employment": "User is filling out employment and income information",
    "/rental/apply/emergency": "User is filling out emergency contact information",
    "/rental/apply/general-info": "User is answering general background questions about rental history and finances",
    "/rental/apply/agreement": "User is reviewing the rental agreement and signing",
  };

  // Only show on rental app routes
  if (!location.startsWith("/rental")) return null;

  return <OmiaChatWidget context={contextMap[location] || "User is completing a rental application"} />;
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
          <ChatWidgetWrapper />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
