import { Megaphone, UserCheck, Check } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Activity {
  id: string;
  type: 'campaign' | 'lead' | 'task';
  description: string;
  timestamp: string;
  user?: string;
}

interface RecentActivityProps {
  activities?: Activity[];
  upcomingDeadlines?: Array<{
    id: string;
    title: string;
    dueDate: string;
    priority: string;
  }>;
}

export function RecentActivity({ activities = [], upcomingDeadlines = [] }: RecentActivityProps) {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'campaign': return Megaphone;
      case 'lead': return UserCheck;
      case 'task': return Check;
      default: return Check;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'campaign': return 'bg-primary/10 text-primary';
      case 'lead': return 'bg-secondary/10 text-secondary';
      case 'task': return 'bg-green-100 text-green-600';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  // Default activities for empty state
  const defaultActivities = [
    {
      id: '1',
      type: 'campaign' as const,
      description: 'Sara ha creato la campagna "Black Friday 2024"',
      timestamp: '2 ore fa'
    },
    {
      id: '2',
      type: 'lead' as const,
      description: 'Marco ha convertito un lead in opportunità',
      timestamp: '4 ore fa'
    },
    {
      id: '3',
      type: 'task' as const,
      description: 'Luca ha completato "Setup Google Analytics"',
      timestamp: '1 giorno fa'
    }
  ];

  const defaultDeadlines = [
    {
      id: '1',
      title: 'Follow-up Tecnomec',
      dueDate: 'Scade oggi',
      priority: 'P0'
    },
    {
      id: '2',
      title: 'Banner Black Friday',
      dueDate: 'Scade domani',
      priority: 'P1'
    }
  ];

  const displayActivities = activities.length > 0 ? activities : defaultActivities;
  const displayDeadlines = upcomingDeadlines.length > 0 ? upcomingDeadlines : defaultDeadlines;

  return (
    <div className="space-y-6">
      {/* Recent Activity */}
      <Card data-testid="recent-activity">
        <CardHeader>
          <h3 className="text-lg font-semibold">Attività Recente</h3>
        </CardHeader>
        <CardContent className="space-y-4">
          {displayActivities.map((activity) => {
            const Icon = getActivityIcon(activity.type);
            return (
              <div key={activity.id} className="flex items-start space-x-3" data-testid={`activity-${activity.id}`}>
                <div className={`p-2 rounded-full mt-1 ${getActivityColor(activity.type)}`}>
                  <Icon className="w-3 h-3" />
                </div>
                <div className="flex-1">
                  <p className="text-sm" data-testid={`activity-description-${activity.id}`}>
                    {activity.description}
                  </p>
                  <p className="text-xs text-muted-foreground" data-testid={`activity-timestamp-${activity.id}`}>
                    {activity.timestamp}
                  </p>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Upcoming Deadlines */}
      <Card data-testid="upcoming-deadlines">
        <CardHeader>
          <h3 className="text-lg font-semibold">Scadenze Imminenti</h3>
        </CardHeader>
        <CardContent className="space-y-3">
          {displayDeadlines.map((deadline) => {
            const isUrgent = deadline.dueDate.includes('oggi');
            const isImportant = deadline.dueDate.includes('domani');
            
            return (
              <div
                key={deadline.id}
                className={`flex items-center justify-between p-3 border rounded-lg ${
                  isUrgent 
                    ? 'bg-red-50 border-red-200' 
                    : isImportant 
                    ? 'bg-orange-50 border-orange-200'
                    : 'bg-muted border-border'
                }`}
                data-testid={`deadline-${deadline.id}`}
              >
                <div>
                  <p 
                    className={`text-sm font-medium ${
                      isUrgent 
                        ? 'text-red-900' 
                        : isImportant 
                        ? 'text-orange-900'
                        : 'text-foreground'
                    }`}
                    data-testid={`deadline-title-${deadline.id}`}
                  >
                    {deadline.title}
                  </p>
                  <p 
                    className={`text-xs ${
                      isUrgent 
                        ? 'text-red-700' 
                        : isImportant 
                        ? 'text-orange-700'
                        : 'text-muted-foreground'
                    }`}
                    data-testid={`deadline-date-${deadline.id}`}
                  >
                    {deadline.dueDate}
                  </p>
                </div>
                <Badge
                  className={
                    deadline.priority === 'P0' 
                      ? 'bg-red-100 text-red-800'
                      : deadline.priority === 'P1'
                      ? 'bg-orange-100 text-orange-800'
                      : 'bg-gray-100 text-gray-800'
                  }
                  data-testid={`deadline-priority-${deadline.id}`}
                >
                  {deadline.priority}
                </Badge>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
