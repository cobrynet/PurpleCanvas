import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { ChatWidget } from "@/components/ChatWidget";
import { useAuth } from "@/hooks/useAuth";
import { AppLayout } from "@/app/layout";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/Landing";
import Dashboard from "@/pages/Dashboard";
import Marketing from "@/pages/Marketing";
import MarketingOverview from "@/pages/MarketingOverview";
import CRM from "@/pages/CRM";
import Tasks from "@/pages/Tasks";
import Marketplace from "@/pages/Marketplace";
import Notifications from "@/pages/Notifications";
import Chat from "@/pages/Chat";
import ConsoleOperatori from "@/pages/ConsoleOperatori";
import Settings from "@/pages/Settings";
import Goals from "@/pages/Goals";
import OfflineActivities from "@/pages/OfflineActivities";
import SignIn from "@/pages/SignIn";
import SignUp from "@/pages/SignUp";
import OrganizationSelectorPage from "@/pages/OrganizationSelector";
import { OrganizationProvider } from "@/hooks/useOrganization";
import { OrganizationGuard } from "@/components/OrganizationGuard";
import { NotificationManager } from "@/components/NotificationManager";
import { NotificationTestButton } from "@/components/NotificationTestButton";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <Switch>
          <Route path="/sign-in" component={SignIn} />
          <Route path="/sign-up" component={SignUp} />
          <Route path="/" component={Landing} />
          <Route component={Landing} />
        </Switch>
      ) : (
        <>
          <Switch>
            {/* Organization selector page (no guard needed) */}
            <Route path="/select-organization" component={OrganizationSelectorPage} />
            
            {/* Protected routes with organization guard */}
            <Route>
              <OrganizationGuard>
                <AppLayout>
                  <Switch>
                    <Route path="/" component={Dashboard} />
                    <Route path="/goals" component={Goals} />
                    <Route path="/marketing/overview" component={MarketingOverview} />
                    <Route path="/marketing/offline" component={OfflineActivities} />
                    <Route path="/marketing" component={Marketing} />
                    <Route path="/crm/leads" component={CRM} />
                    <Route path="/crm/opportunities" component={CRM} />
                    <Route path="/crm/pipeline" component={CRM} />
                    <Route path="/crm/cadences" component={CRM} />
                    <Route path="/tasks" component={Tasks} />
                    <Route path="/marketplace" component={Marketplace} />
                    <Route path="/notifications" component={Notifications} />
                    <Route path="/chat" component={Chat} />
                    <Route path="/console" component={ConsoleOperatori} />
                    <Route path="/settings" component={Settings} />
                    <Route component={NotFound} />
                  </Switch>
                </AppLayout>
                {/* Chat widget appears on all authenticated pages */}
                <ChatWidget />
              </OrganizationGuard>
            </Route>
          </Switch>
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="stratikey-ui-theme">
        <OrganizationProvider>
          <TooltipProvider>
            <Toaster />
            <NotificationManager />
            <NotificationTestButton />
            <Router />
          </TooltipProvider>
        </OrganizationProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
