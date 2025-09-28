import { useState } from "react";
import { MoreHorizontal, Filter } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";

interface Task {
  id: string;
  title: string;
  priority: 'P0' | 'P1' | 'P2' | 'P3';
  status: string;
  campaign?: string;
  assignee?: string;
  dueDate?: string;
  completed?: boolean;
}

interface TaskListProps {
  tasks: Task[];
  isLoading?: boolean;
}

export function TaskList({ tasks, isLoading }: TaskListProps) {
  const [viewMode, setViewMode] = useState<'lista' | 'kanban' | 'calendario'>('lista');

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'P0': return 'bg-red-100 text-red-800';
      case 'P1': return 'bg-orange-100 text-orange-800';
      case 'P2': return 'bg-gray-100 text-gray-800';
      case 'P3': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'in progress': return 'bg-yellow-100 text-yellow-800';
      case 'in review': return 'bg-blue-100 text-blue-800';
      case 'done': case 'fatto': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const viewButtons = [
    { key: 'lista', label: 'Lista' },
    { key: 'kanban', label: 'Kanban' },
    { key: 'calendario', label: 'Calendario' }
  ];

  if (isLoading) {
    return (
      <Card className="lg:col-span-2">
        <CardHeader>
          <div className="animate-pulse">
            <div className="h-6 bg-muted rounded w-32 mb-4"></div>
            <div className="h-10 bg-muted rounded"></div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-muted rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="lg:col-span-2" data-testid="task-list">
      <CardHeader className="border-b border-border">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Attività Recenti</h3>
          <div className="flex items-center space-x-2">
            {/* View Toggle */}
            <div className="flex bg-muted rounded-lg p-1" data-testid="view-toggle">
              {viewButtons.map((view) => (
                <Button
                  key={view.key}
                  variant="ghost"
                  size="sm"
                  className={`px-3 py-1 text-sm rounded font-medium ${
                    viewMode === view.key
                      ? 'bg-background shadow-sm'
                      : 'hover:bg-background/50'
                  }`}
                  onClick={() => setViewMode(view.key as any)}
                  data-testid={`view-${view.key}`}
                >
                  {view.label}
                </Button>
              ))}
            </div>
            <Button variant="ghost" size="sm" className="p-2 hover:bg-muted rounded-lg" data-testid="filter-button">
              <Filter className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {tasks.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground" data-testid="no-tasks">
            Nessuna attività disponibile
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center space-x-4 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                data-testid={`task-${task.id}`}
              >
                <Checkbox
                  checked={task.completed}
                  className="w-4 h-4"
                  data-testid={`task-checkbox-${task.id}`}
                />
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span 
                      className={`font-medium ${task.completed ? 'line-through text-muted-foreground' : ''}`}
                      data-testid={`task-title-${task.id}`}
                    >
                      {task.title}
                    </span>
                    <Badge
                      className={getPriorityColor(task.priority)}
                      data-testid={`task-priority-${task.id}`}
                    >
                      {task.priority}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-4 mt-1 text-sm text-muted-foreground">
                    {task.campaign && (
                      <>
                        <span data-testid={`task-campaign-${task.id}`}>{task.campaign}</span>
                        <span>•</span>
                      </>
                    )}
                    {task.assignee && (
                      <>
                        <span data-testid={`task-assignee-${task.id}`}>{task.assignee}</span>
                        <span>•</span>
                      </>
                    )}
                    {task.dueDate && (
                      <span 
                        className={task.dueDate.includes('Oggi') ? 'text-red-600' : ''}
                        data-testid={`task-due-date-${task.id}`}
                      >
                        {task.dueDate}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge
                    className={getStatusColor(task.status)}
                    data-testid={`task-status-${task.id}`}
                  >
                    {task.status}
                  </Badge>
                  <Button variant="ghost" size="sm" className="p-1 hover:bg-muted rounded" data-testid={`task-menu-${task.id}`}>
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 text-center">
          <Button variant="link" className="text-primary hover:underline text-sm" data-testid="view-all-tasks">
            Visualizza tutte le attività →
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
