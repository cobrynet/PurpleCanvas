import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ui/theme-provider";
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
import Chat from "@/pages/Chat";
import Settings from "@/pages/Settings";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <AppLayout>
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/marketing/overview" component={MarketingOverview} />
            <Route path="/marketing/campaigns" component={Marketing} />
            <Route path="/crm/leads" component={CRM} />
            <Route path="/crm/opportunities" component={CRM} />
            <Route path="/crm/pipeline" component={CRM} />
            <Route path="/crm/cadences" component={CRM} />
            <Route path="/tasks" component={Tasks} />
            <Route path="/marketplace" component={Marketplace} />
            <Route path="/chat" component={Chat} />
            <Route path="/settings" component={Settings} />
            <Route component={NotFound} />
          </Switch>
        </AppLayout>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="stratikey-ui-theme">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
