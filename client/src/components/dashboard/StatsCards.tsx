import { Megaphone, UserPlus, TrendingUp, CheckSquare } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface DashboardStats {
  activeCampaigns: number;
  totalLeads: number;
  totalOpportunities: number;
  openTasks: number;
}

interface StatsCardsProps {
  stats: DashboardStats;
  isLoading?: boolean;
}

export function StatsCards({ stats, isLoading }: StatsCardsProps) {
  const statItems = [
    {
      title: "Campagne Attive",
      value: stats.activeCampaigns,
      icon: Megaphone,
      color: "text-primary",
      bgColor: "bg-primary/10",
      change: "+2.5%",
      changeType: "positive" as const,
      period: "vs mese scorso",
      testId: "stat-campaigns"
    },
    {
      title: "Lead Generate",
      value: stats.totalLeads,
      icon: UserPlus,
      color: "text-secondary",
      bgColor: "bg-secondary/10",
      change: "+18.7%",
      changeType: "positive" as const,
      period: "vs mese scorso",
      testId: "stat-leads"
    },
    {
      title: "Opportunità",
      value: stats.totalOpportunities,
      icon: TrendingUp,
      color: "text-accent-foreground",
      bgColor: "bg-accent/20",
      change: "-3.2%",
      changeType: "negative" as const,
      period: "vs mese scorso",
      testId: "stat-opportunities"
    },
    {
      title: "Attività Aperte",
      value: stats.openTasks,
      icon: CheckSquare,
      color: "text-muted-foreground",
      bgColor: "bg-muted",
      change: "-5 oggi",
      changeType: "positive" as const,
      period: "",
      testId: "stat-tasks"
    }
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-20 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8" data-testid="stats-cards">
      {statItems.map((item) => (
        <Card key={item.title} data-testid={item.testId}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{item.title}</p>
                <p className={`text-3xl font-bold ${item.color}`} data-testid={`${item.testId}-value`}>
                  {item.value}
                </p>
              </div>
              <div className={`${item.bgColor} p-3 rounded-lg`}>
                <item.icon className={`w-6 h-6 ${item.color}`} />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <span 
                className={`text-sm font-medium ${
                  item.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                }`}
                data-testid={`${item.testId}-change`}
              >
                {item.change}
              </span>
              {item.period && (
                <span className="text-sm text-muted-foreground ml-2">{item.period}</span>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
