import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { LayoutDashboard } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { TaskList } from "@/components/dashboard/TaskList";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { MarketingTask } from "@shared/schema";

// Import Activity type from RecentActivity component
type Activity = {
  id: string;
  type: 'campaign' | 'lead' | 'task' | 'opportunity';
  description: string;
  timestamp: string;
  user?: string;
};

type DashboardStats = {
  activeCampaigns: number;
  totalLeads: number;
  totalOpportunities: number;
  openTasks: number;
};

type Deadline = {
  id: string;
  title: string;
  dueDate: string;
  priority: string;
};

export default function Dashboard() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const currentOrg = user?.organizations?.[0];

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, authLoading, toast]);

  // Fetch dashboard stats
  const { 
    data: stats, 
    isLoading: statsLoading,
    error: statsError 
  } = useQuery<DashboardStats>({
    queryKey: ["/api/organizations", currentOrg?.id, "dashboard-stats"],
    enabled: !!currentOrg?.id && isAuthenticated,
    retry: false,
  });

  // Fetch recent tasks
  const { 
    data: tasks = [], 
    isLoading: tasksLoading,
    error: tasksError 
  } = useQuery<MarketingTask[]>({
    queryKey: ["/api/organizations", currentOrg?.id, "tasks"],
    enabled: !!currentOrg?.id && isAuthenticated,
    retry: false,
  });

  // Fetch recent activity
  const { 
    data: recentActivity = [], 
    isLoading: activityLoading,
    error: activityError 
  } = useQuery<Activity[]>({
    queryKey: ["/api/organizations", currentOrg?.id, "recent-activity"],
    enabled: !!currentOrg?.id && isAuthenticated,
    retry: false,
  });

  // Fetch upcoming deadlines
  const { 
    data: upcomingDeadlines = [], 
    isLoading: deadlinesLoading,
    error: deadlinesError 
  } = useQuery<Deadline[]>({
    queryKey: ["/api/organizations", currentOrg?.id, "upcoming-deadlines"],
    enabled: !!currentOrg?.id && isAuthenticated,
    retry: false,
  });


  // Handle errors
  useEffect(() => {
    if (statsError && isUnauthorizedError(statsError as Error)) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [statsError, toast]);

  useEffect(() => {
    if (tasksError && isUnauthorizedError(tasksError as Error)) {
      toast({
        title: "Unauthorized", 
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [tasksError, toast]);

  useEffect(() => {
    if (activityError && isUnauthorizedError(activityError as Error)) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [activityError, toast]);

  useEffect(() => {
    if (deadlinesError && isUnauthorizedError(deadlinesError as Error)) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [deadlinesError, toast]);

  // Handle non-auth errors with toast
  useEffect(() => {
    if (activityError && !isUnauthorizedError(activityError as Error)) {
      toast({
        title: "Errore",
        description: "Impossibile caricare le attività recenti",
        variant: "destructive",
      });
    }
  }, [activityError, toast]);

  useEffect(() => {
    if (deadlinesError && !isUnauthorizedError(deadlinesError as Error)) {
      toast({
        title: "Errore",
        description: "Impossibile caricare le scadenze",
        variant: "destructive",
      });
    }
  }, [deadlinesError, toast]);

  if (authLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading"/>
      </div>
    );
  }

  if (!currentOrg) {
    return (
      <MainLayout title="Dashboard" icon={LayoutDashboard}>
        <div className="text-center py-8">
          <p className="text-muted-foreground mb-4">Nessuna organizzazione trovata.</p>
          <p className="text-sm text-muted-foreground">
            Contatta l'amministratore per essere aggiunto a un'organizzazione.
          </p>
        </div>
      </MainLayout>
    );
  }

  // Transform tasks for display
  const displayTasks = tasks.slice(0, 5).map((task) => ({
    id: task.id,
    title: task.title,
    priority: task.priority || 'P2',
    status: task.status === 'IN_PROGRESS' ? 'In Progress' : 
            task.status === 'IN_REVIEW' ? 'In Review' :
            task.status === 'DONE' ? 'Fatto' : task.status || 'BACKLOG',
    campaign: task.campaignId ? 'Campagna' : undefined,
    assignee: task.assigneeId ? 'Assegnato' : undefined,
    dueDate: task.dueAt ? new Date(task.dueAt).toLocaleDateString('it-IT') : undefined,
    completed: task.status === 'DONE'
  }));

  const defaultStats = {
    activeCampaigns: 0,
    totalLeads: 0,
    totalOpportunities: 0,
    openTasks: 0
  };

  return (
    <MainLayout title="Dashboard" icon={LayoutDashboard}>
      <div data-testid="dashboard-content">
        {/* Stats Overview */}
        <StatsCards 
          stats={stats || defaultStats} 
          isLoading={statsLoading} 
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Task Manager Preview */}
          <TaskList 
            tasks={displayTasks}
            isLoading={tasksLoading}
          />

          {/* Recent Activity & Quick Actions */}
          <div className="space-y-6">
            <QuickActions />
            <RecentActivity 
              activities={recentActivity}
              upcomingDeadlines={upcomingDeadlines}
            />
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
