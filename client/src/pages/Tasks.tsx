import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { CheckSquare, Plus, Filter, Calendar, List, Kanban, MoreHorizontal, Clock, User, Eye, Edit, Save, X, Loader2 } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertMarketingTaskSchema, updateMarketingTaskSchema } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";
import { useOrganization } from "@/hooks/useOrganization";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { z } from "zod";

const taskFormSchema = insertMarketingTaskSchema.extend({
  title: z.string().min(1, "Titolo richiesto"),
  type: z.string().min(1, "Tipo richiesto"),
});

type ViewMode = 'list' | 'kanban' | 'calendar';

export default function Tasks() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { selectedOrganization } = useOrganization();
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  
  const currentOrg = selectedOrganization;
  const currentMembership = currentOrg?.membership;

  // All roles can view tasks
  const hasTaskAccess = !!currentMembership;

  // Read query params for initial filters
  const urlParams = new URLSearchParams(window.location.search);
  const goalIdParam = urlParams.get('goalId');
  const moduleParam = urlParams.get('module');

  // State for filters
  const [goalIdFilter, setGoalIdFilter] = useState<string | null>(goalIdParam);
  const [moduleFilter, setModuleFilter] = useState<string | null>(moduleParam);

  // State for task detail dialog
  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

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

  // Fetch tasks
  const { 
    data: tasks = [], 
    isLoading: tasksLoading,
    error: tasksError 
  } = useQuery({
    queryKey: ["/api/tasks"],
    enabled: !!currentOrg?.id && isAuthenticated && hasTaskAccess,
    retry: false,
  });

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: async (taskData: z.infer<typeof taskFormSchema>) => {
      return apiRequest("POST", `/api/organizations/${currentOrg?.id}/tasks`, taskData);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Attività creata con successo",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      taskForm.reset();
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
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
      toast({
        title: "Error",
        description: "Errore nella creazione dell'attività",
        variant: "destructive",
      });
    },
  });

  // Fetch single task mutation
  const fetchTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const response = await apiRequest("GET", `/api/tasks/${taskId}`, null);
      return await response.json();
    },
    onSuccess: (data) => {
      setSelectedTask(data);
      setIsDetailDialogOpen(true);
      setIsEditMode(false);
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Impossibile caricare i dettagli dell'attività",
        variant: "destructive",
      });
    },
  });

  // Update task mutation
  const updateTaskMutation = useMutation({
    mutationFn: async ({ taskId, updates }: { taskId: string; updates: z.infer<typeof updateMarketingTaskSchema> }) => {
      const response = await apiRequest("PATCH", `/api/tasks/${taskId}`, updates);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Successo",
        description: "Attività aggiornata con successo",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      setIsEditMode(false);
      setIsDetailDialogOpen(false);
      setSelectedTask(null);
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Impossibile aggiornare l'attività",
        variant: "destructive",
      });
    },
  });

  // Form
  const taskForm = useForm<z.infer<typeof taskFormSchema>>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: "",
      type: "general",
      subtype: "",
      status: "BACKLOG",
      priority: "P2",
      dueAt: null
    },
  });

  // Handle errors
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

  if (authLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading"/>
      </div>
    );
  }

  if (!hasTaskAccess) {
    return (
      <MainLayout title="Attività" icon={CheckSquare}>
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            Non hai i permessi per accedere alla sezione Attività.
          </p>
        </div>
      </MainLayout>
    );
  }

  const onCreateTask = async (data: z.infer<typeof taskFormSchema>) => {
    await createTaskMutation.mutateAsync(data);
  };

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
    switch (status) {
      case 'BACKLOG': return 'bg-gray-100 text-gray-800';
      case 'IN_PROGRESS': return 'bg-yellow-100 text-yellow-800';
      case 'IN_REVIEW': return 'bg-blue-100 text-blue-800';
      case 'APPROVED': return 'bg-purple-100 text-purple-800';
      case 'DONE': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'BACKLOG': return 'Backlog';
      case 'IN_PROGRESS': return 'In Corso';
      case 'IN_REVIEW': return 'In Review';
      case 'APPROVED': return 'Approvato';
      case 'DONE': return 'Fatto';
      default: return status;
    }
  };

  // Apply filters to tasks
  const filteredTasks = (tasks as any[]).filter((task: any) => {
    if (goalIdFilter && task.goalId !== goalIdFilter) return false;
    if (moduleFilter && task.module !== moduleFilter) return false;
    return true;
  });

  const renderListView = () => (
    <div className="space-y-4" data-testid="tasks-list-view">
      {filteredTasks.length === 0 ? (
        <Card data-testid="no-tasks">
          <CardContent className="text-center py-12">
            <CheckSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nessuna attività</h3>
            <p className="text-muted-foreground mb-6">
              Inizia creando la tua prima attività
            </p>
          </CardContent>
        </Card>
      ) : (
        filteredTasks.map((task: any) => (
          <Card 
            key={task.id} 
            className="hover:shadow-md transition-shadow" 
            data-testid={`task-${task.id}`}
          >
            <CardContent className="p-4">
              <div className="flex items-center space-x-4">
                <Checkbox 
                  checked={task.status === 'DONE'}
                  className="w-4 h-4"
                  data-testid={`task-checkbox-${task.id}`}
                />
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span 
                      className={`font-medium ${task.status === 'DONE' ? 'line-through text-muted-foreground' : ''}`}
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
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <span data-testid={`task-type-${task.id}`}>
                      {task.type}
                    </span>
                    {task.assigneeId && (
                      <>
                        <span>•</span>
                        <div className="flex items-center space-x-1">
                          <User className="w-3 h-3" />
                          <span data-testid={`task-assignee-${task.id}`}>Assegnato</span>
                        </div>
                      </>
                    )}
                    {task.dueAt && (
                      <>
                        <span>•</span>
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span 
                            className={new Date(task.dueAt) < new Date() ? 'text-red-600' : ''}
                            data-testid={`task-due-date-${task.id}`}
                          >
                            Scadenza: {new Date(task.dueAt).toLocaleDateString('it-IT')}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge
                    className={getStatusColor(task.status)}
                    data-testid={`task-status-${task.id}`}
                  >
                    {getStatusText(task.status)}
                  </Badge>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="p-1" 
                    onClick={() => fetchTaskMutation.mutate(task.id)}
                    data-testid={`task-menu-${task.id}`}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );

  const renderKanbanView = () => {
    const statusColumns = [
      { key: 'BACKLOG', title: 'Backlog', color: 'bg-gray-50 border-gray-200' },
      { key: 'IN_PROGRESS', title: 'In Corso', color: 'bg-yellow-50 border-yellow-200' },
      { key: 'IN_REVIEW', title: 'In Review', color: 'bg-blue-50 border-blue-200' },
      { key: 'APPROVED', title: 'Approvato', color: 'bg-purple-50 border-purple-200' },
      { key: 'DONE', title: 'Fatto', color: 'bg-green-50 border-green-200' }
    ];

    const tasksByStatus = filteredTasks.reduce((acc: any, task: any) => {
      if (!acc[task.status]) acc[task.status] = [];
      acc[task.status].push(task);
      return acc;
    }, {});

    return (
      <div className="grid grid-cols-5 gap-4" data-testid="tasks-kanban-view">
        {statusColumns.map((column) => (
          <Card key={column.key} className={`${column.color} border-2`}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">
                {column.title}
                <Badge variant="secondary" className="ml-2">
                  {tasksByStatus[column.key]?.length || 0}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {(tasksByStatus[column.key] || []).map((task: any) => (
                <Card 
                  key={task.id} 
                  className="bg-white shadow-sm cursor-pointer hover:shadow-md transition-shadow" 
                  onClick={() => fetchTaskMutation.mutate(task.id)}
                  data-testid={`kanban-task-${task.id}`}
                >
                  <CardContent className="p-3">
                    <p className="font-medium text-sm mb-2" data-testid={`kanban-task-title-${task.id}`}>
                      {task.title}
                    </p>
                    <div className="flex items-center justify-between">
                      <Badge
                        className={`text-xs ${getPriorityColor(task.priority)}`}
                        data-testid={`kanban-task-priority-${task.id}`}
                      >
                        {task.priority}
                      </Badge>
                      {task.dueAt && (
                        <span className="text-xs text-muted-foreground">
                          {new Date(task.dueAt).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' })}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  const renderCalendarView = () => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    // Generate calendar days for current month
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDay = firstDay.getDay(); // 0 = Sunday
    
    const calendar = [];
    
    // Add empty cells for days before month starts
    for (let i = 0; i < startDay; i++) {
      calendar.push(null);
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      calendar.push(day);
    }
    
    // Get tasks for each day (timezone-safe local date comparison)
    const toLocalYMD = (date: Date) => 
      `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    
    const getTasksForDay = (day: number) => {
      if (!day) return [];
      const dayDate = new Date(currentYear, currentMonth, day);
      const targetDateStr = toLocalYMD(dayDate);
      
      return filteredTasks.filter((task: any) => {
        if (!task.dueAt) return false;
        const taskDate = new Date(task.dueAt);
        const taskDateStr = toLocalYMD(taskDate);
        return taskDateStr === targetDateStr;
      });
    };
    
    const monthNames = [
      "Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
      "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"
    ];
    
    return (
      <div data-testid="tasks-calendar-view" className="bg-white rounded-lg border">
        {/* Calendar Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">
            {monthNames[currentMonth]} {currentYear}
          </h3>
          <div className="text-sm text-muted-foreground">
            Attività programmate
          </div>
        </div>
        
        {/* Calendar Grid */}
        <div className="p-4">
          {/* Days of week header */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'].map((day) => (
              <div key={day} className="text-center text-sm font-medium text-muted-foreground p-2">
                {day}
              </div>
            ))}
          </div>
          
          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-1">
            {calendar.map((day, index) => {
              const dayTasks = day ? getTasksForDay(day) : [];
              const isToday = day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();
              
              return (
                <div
                  key={index}
                  className={`min-h-[80px] p-1 border rounded ${
                    day ? 'bg-white hover:bg-gray-50' : 'bg-gray-50'
                  } ${isToday ? 'ring-2 ring-primary' : ''}`}
                  data-testid={day ? `calendar-day-${day}` : `calendar-empty-${index}`}
                >
                  {day && (
                    <>
                      <div className={`text-sm font-medium mb-1 ${isToday ? 'text-primary' : ''}`}>
                        {day}
                      </div>
                      <div className="space-y-1">
                        {dayTasks.slice(0, 3).map((task: any) => (
                          <div
                            key={task.id}
                            className={`text-xs p-1 rounded truncate ${getPriorityColor(task.priority)}`}
                            data-testid={`calendar-task-${task.id}`}
                            title={task.title}
                          >
                            {task.title}
                          </div>
                        ))}
                        {dayTasks.length > 3 && (
                          <div className="text-xs text-muted-foreground">
                            +{dayTasks.length - 3} altri
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
          
          {/* Legend */}
          <div className="mt-4 flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-red-100 border border-red-200 rounded"></div>
              <span>P0 - Critica</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-orange-100 border border-orange-200 rounded"></div>
              <span>P1 - Alta</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-gray-100 border border-gray-200 rounded"></div>
              <span>P2 - Media</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-blue-100 border border-blue-200 rounded"></div>
              <span>P3 - Bassa</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <MainLayout title="Task Manager" icon={CheckSquare}>
      <div data-testid="tasks-content">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold">Gestione Attività</h2>
            <p className="text-muted-foreground">
              Organizza e monitora le tue attività con viste multiple
            </p>
          </div>
          <div className="flex items-center space-x-4">
            {/* View Toggle */}
            <div className="flex bg-muted rounded-lg p-1" data-testid="view-toggle">
              <Button
                variant="ghost"
                size="sm"
                className={`px-3 py-1 text-sm rounded font-medium ${
                  viewMode === 'list'
                    ? 'bg-background shadow-sm'
                    : 'hover:bg-background/50'
                }`}
                onClick={() => setViewMode('list')}
                data-testid="view-list"
              >
                <List className="w-4 h-4 mr-1" />
                Lista
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={`px-3 py-1 text-sm rounded font-medium ${
                  viewMode === 'kanban'
                    ? 'bg-background shadow-sm'
                    : 'hover:bg-background/50'
                }`}
                onClick={() => setViewMode('kanban')}
                data-testid="view-kanban"
              >
                <Kanban className="w-4 h-4 mr-1" />
                Kanban
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={`px-3 py-1 text-sm rounded font-medium ${
                  viewMode === 'calendar'
                    ? 'bg-background shadow-sm'
                    : 'hover:bg-background/50'
                }`}
                onClick={() => setViewMode('calendar')}
                data-testid="view-calendar"
              >
                <Calendar className="w-4 h-4 mr-1" />
                Calendario
              </Button>
            </div>

            <Button variant="ghost" size="sm" className="p-2" data-testid="filter-button">
              <Filter className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Active Filters */}
        {(goalIdFilter || moduleFilter) && (
          <div className="flex gap-2 items-center flex-wrap">
            <span className="text-sm text-muted-foreground">Filtri attivi:</span>
            {goalIdFilter && (
              <Badge variant="secondary" className="gap-1" data-testid="filter-chip-goalid">
                Goal ID: {goalIdFilter.substring(0, 8)}...
                <button 
                  onClick={() => setGoalIdFilter(null)}
                  className="ml-1 hover:text-destructive"
                  data-testid="remove-goalid-filter"
                >
                  ×
                </button>
              </Badge>
            )}
            {moduleFilter && (
              <Badge variant="secondary" className="gap-1" data-testid="filter-chip-module">
                Modulo: {moduleFilter}
                <button 
                  onClick={() => setModuleFilter(null)}
                  className="ml-1 hover:text-destructive"
                  data-testid="remove-module-filter"
                >
                  ×
                </button>
              </Badge>
            )}
          </div>
        )}

        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button className="flex items-center space-x-2" data-testid="new-task-button">
                  <Plus className="w-4 h-4" />
                  <span>Nuova Attività</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Crea Nuova Attività</DialogTitle>
                </DialogHeader>
                <Form {...taskForm}>
                  <form onSubmit={taskForm.handleSubmit(onCreateTask)} className="space-y-4" onKeyDown={(e) => e.stopPropagation()} onKeyUp={(e) => e.stopPropagation()}>
                    <FormField
                      control={taskForm.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Titolo</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="task-title-input" onKeyDown={(e) => e.stopPropagation()} onKeyUp={(e) => e.stopPropagation()} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={taskForm.control}
                        name="type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tipo</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="task-type-select">
                                  <SelectValue placeholder="Seleziona tipo" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="general">Generale</SelectItem>
                                <SelectItem value="marketing">Marketing</SelectItem>
                                <SelectItem value="sales">Commerciale</SelectItem>
                                <SelectItem value="content">Contenuto</SelectItem>
                                <SelectItem value="design">Design</SelectItem>
                                <SelectItem value="development">Sviluppo</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={taskForm.control}
                        name="priority"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Priorità</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
                              <FormControl>
                                <SelectTrigger data-testid="task-priority-select">
                                  <SelectValue placeholder="Seleziona priorità" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="P0">P0 - Critica</SelectItem>
                                <SelectItem value="P1">P1 - Alta</SelectItem>
                                <SelectItem value="P2">P2 - Media</SelectItem>
                                <SelectItem value="P3">P3 - Bassa</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={taskForm.control}
                      name="subtype"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sottotipo (opzionale)</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ""} data-testid="task-subtype-input" onKeyDown={(e) => e.stopPropagation()} onKeyUp={(e) => e.stopPropagation()} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={taskForm.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Stato</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
                            <FormControl>
                              <SelectTrigger data-testid="task-status-select">
                                <SelectValue placeholder="Seleziona stato" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="BACKLOG">Backlog</SelectItem>
                              <SelectItem value="IN_PROGRESS">In Corso</SelectItem>
                              <SelectItem value="IN_REVIEW">In Review</SelectItem>
                              <SelectItem value="APPROVED">Approvato</SelectItem>
                              <SelectItem value="DONE">Fatto</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button 
                      type="submit" 
                      disabled={createTaskMutation.isPending}
                      className="w-full"
                      data-testid="create-task-submit"
                    >
                      {createTaskMutation.isPending ? "Creazione..." : "Crea Attività"}
                    </Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Task Detail Dialog */}
        <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle>Dettagli Attività</DialogTitle>
                {!isEditMode ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditMode(true)}
                    data-testid="edit-task-button"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Modifica
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditMode(false)}
                    data-testid="cancel-edit-button"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Annulla
                  </Button>
                )}
              </div>
            </DialogHeader>
            
            {selectedTask && (
              <div className="space-y-4">
                {!isEditMode ? (
                  <>
                    {/* View Mode */}
                    <div>
                      <h3 className="text-sm font-semibold text-muted-foreground mb-1">Titolo</h3>
                      <p className="text-base" data-testid="view-task-title">{selectedTask.title}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h3 className="text-sm font-semibold text-muted-foreground mb-1">Tipo</h3>
                        <p data-testid="view-task-type">{selectedTask.type}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-muted-foreground mb-1">Priorità</h3>
                        <Badge className={getPriorityColor(selectedTask.priority)} data-testid="view-task-priority">
                          {selectedTask.priority}
                        </Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h3 className="text-sm font-semibold text-muted-foreground mb-1">Stato</h3>
                        <Badge className={getStatusColor(selectedTask.status)} data-testid="view-task-status">
                          {getStatusText(selectedTask.status)}
                        </Badge>
                      </div>
                      {selectedTask.dueAt && (
                        <div>
                          <h3 className="text-sm font-semibold text-muted-foreground mb-1">Scadenza</h3>
                          <p data-testid="view-task-duedate">
                            {new Date(selectedTask.dueAt).toLocaleDateString('it-IT')}
                          </p>
                        </div>
                      )}
                    </div>

                    {selectedTask.description && (
                      <div>
                        <h3 className="text-sm font-semibold text-muted-foreground mb-1">Descrizione</h3>
                        <p className="whitespace-pre-wrap text-sm" data-testid="view-task-description">
                          {selectedTask.description}
                        </p>
                      </div>
                    )}

                    {selectedTask.caption && (
                      <div>
                        <h3 className="text-sm font-semibold text-muted-foreground mb-1">Caption Social</h3>
                        <p className="whitespace-pre-wrap text-sm" data-testid="view-task-caption">
                          {selectedTask.caption}
                        </p>
                      </div>
                    )}

                    {selectedTask.postType && (
                      <div>
                        <h3 className="text-sm font-semibold text-muted-foreground mb-1">Tipo Post</h3>
                        <Badge variant="secondary" data-testid="view-task-posttype">
                          {selectedTask.postType}
                        </Badge>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {/* Edit Mode */}
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-semibold mb-1 block">Titolo</label>
                        <Input
                          value={selectedTask.title || ""}
                          onChange={(e) => setSelectedTask({ ...selectedTask, title: e.target.value })}
                          data-testid="edit-task-title"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-semibold mb-1 block">Tipo</label>
                          <Select
                            value={selectedTask.type || ""}
                            onValueChange={(value) => setSelectedTask({ ...selectedTask, type: value })}
                          >
                            <SelectTrigger data-testid="edit-task-type">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="general">Generale</SelectItem>
                              <SelectItem value="marketing">Marketing</SelectItem>
                              <SelectItem value="sales">Commerciale</SelectItem>
                              <SelectItem value="content">Contenuto</SelectItem>
                              <SelectItem value="design">Design</SelectItem>
                              <SelectItem value="development">Sviluppo</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="text-sm font-semibold mb-1 block">Priorità</label>
                          <Select
                            value={selectedTask.priority || ""}
                            onValueChange={(value) => setSelectedTask({ ...selectedTask, priority: value })}
                          >
                            <SelectTrigger data-testid="edit-task-priority">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="P0">P0 - Critica</SelectItem>
                              <SelectItem value="P1">P1 - Alta</SelectItem>
                              <SelectItem value="P2">P2 - Media</SelectItem>
                              <SelectItem value="P3">P3 - Bassa</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-semibold mb-1 block">Stato</label>
                        <Select
                          value={selectedTask.status || ""}
                          onValueChange={(value) => setSelectedTask({ ...selectedTask, status: value })}
                        >
                          <SelectTrigger data-testid="edit-task-status">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="BACKLOG">Backlog</SelectItem>
                            <SelectItem value="IN_PROGRESS">In Corso</SelectItem>
                            <SelectItem value="IN_REVIEW">In Review</SelectItem>
                            <SelectItem value="APPROVED">Approvato</SelectItem>
                            <SelectItem value="DONE">Fatto</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="text-sm font-semibold mb-1 block">Descrizione</label>
                        <Textarea
                          value={selectedTask.description || ""}
                          onChange={(e) => setSelectedTask({ ...selectedTask, description: e.target.value })}
                          rows={4}
                          data-testid="edit-task-description"
                        />
                      </div>

                      <div>
                        <label className="text-sm font-semibold mb-1 block">Caption Social (opzionale)</label>
                        <Textarea
                          value={selectedTask.caption || ""}
                          onChange={(e) => setSelectedTask({ ...selectedTask, caption: e.target.value })}
                          rows={3}
                          placeholder="Caption per post social..."
                          data-testid="edit-task-caption"
                        />
                      </div>

                      <div>
                        <label className="text-sm font-semibold mb-1 block">Tipo Post (opzionale)</label>
                        <Select
                          value={selectedTask.postType || ""}
                          onValueChange={(value) => setSelectedTask({ ...selectedTask, postType: value })}
                        >
                          <SelectTrigger data-testid="edit-task-posttype">
                            <SelectValue placeholder="Seleziona tipo post" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="foto">Foto</SelectItem>
                            <SelectItem value="video">Video</SelectItem>
                            <SelectItem value="carosello">Carosello</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <Button
                        onClick={() => {
                          updateTaskMutation.mutate({
                            taskId: selectedTask.id,
                            updates: {
                              title: selectedTask.title,
                              type: selectedTask.type,
                              priority: selectedTask.priority,
                              status: selectedTask.status,
                              description: selectedTask.description,
                              caption: selectedTask.caption,
                              postType: selectedTask.postType,
                            }
                          });
                        }}
                        disabled={updateTaskMutation.isPending}
                        className="w-full"
                        data-testid="save-task-button"
                      >
                        {updateTaskMutation.isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Salvataggio...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4 mr-2" />
                            Salva Modifiche
                          </>
                        )}
                      </Button>
                    </div>
                  </>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Tasks Content */}
        {tasksLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="h-16 bg-muted rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <>
            {viewMode === 'list' && renderListView()}
            {viewMode === 'kanban' && renderKanbanView()}
            {viewMode === 'calendar' && renderCalendarView()}
          </>
        )}
      </div>
    </MainLayout>
  );
}
