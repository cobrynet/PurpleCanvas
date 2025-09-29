import { useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { UserPlus, TrendingUp, Plus, MoreHorizontal, Phone, Mail, Play, Pause, Search, Filter, Calendar, Users, Clock, MessageSquare } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertLeadSchema, insertOpportunitySchema } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { z } from "zod";

const leadFormSchema = insertLeadSchema.extend({
  firstName: z.string().min(1, "Nome richiesto"),
  lastName: z.string().min(1, "Cognome richiesto"),
  email: z.string().email("Email non valida").optional().or(z.literal("")),
  company: z.string().min(1, "Azienda richiesta"),
});

const opportunityFormSchema = insertOpportunitySchema.extend({
  title: z.string().min(1, "Titolo richiesto"),
  stage: z.string().min(1, "Fase richiesta"),
  amount: z.number().min(0, "Importo deve essere positivo").optional(),
});

export default function CRM() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [location] = useLocation();
  
  const currentOrg = user?.organizations?.[0];
  const currentMembership = currentOrg?.membership;

  // Check if user has CRM access
  const hasCRMAccess = currentMembership && 
    ['ORG_ADMIN', 'SALES'].includes(currentMembership.role);

  // Determine current view based on URL
  const currentView = location.includes('/opportunities') ? 'opportunities' : 
                     location.includes('/pipeline') ? 'pipeline' :
                     location.includes('/cadences') ? 'cadences' : 'leads';

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

  // Fetch leads
  const { 
    data: leads = [], 
    isLoading: leadsLoading,
    error: leadsError 
  } = useQuery({
    queryKey: ["/api/organizations", currentOrg?.id, "leads"],
    enabled: !!currentOrg?.id && isAuthenticated && hasCRMAccess,
    retry: false,
  });

  // Fetch opportunities
  const { 
    data: opportunities = [], 
    isLoading: opportunitiesLoading,
    error: opportunitiesError 
  } = useQuery({
    queryKey: ["/api/organizations", currentOrg?.id, "opportunities"],
    enabled: !!currentOrg?.id && isAuthenticated && hasCRMAccess,
    retry: false,
  });

  // Create lead mutation
  const createLeadMutation = useMutation({
    mutationFn: async (leadData: z.infer<typeof leadFormSchema>) => {
      return apiRequest("POST", `/api/organizations/${currentOrg?.id}/leads`, leadData);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Lead creato con successo",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/organizations", currentOrg?.id, "leads"] });
      leadForm.reset();
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
        description: "Errore nella creazione del lead",
        variant: "destructive",
      });
    },
  });

  // Create opportunity mutation
  const createOpportunityMutation = useMutation({
    mutationFn: async (opportunityData: z.infer<typeof opportunityFormSchema>) => {
      return apiRequest("POST", `/api/organizations/${currentOrg?.id}/opportunities`, opportunityData);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Opportunità creata con successo",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/organizations", currentOrg?.id, "opportunities"] });
      opportunityForm.reset();
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
        description: "Errore nella creazione dell'opportunità",
        variant: "destructive",
      });
    },
  });

  // Forms
  const leadForm = useForm<z.infer<typeof leadFormSchema>>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      company: "",
      source: "website",
      status: "new",
      priority: "P2"
    },
  });

  const opportunityForm = useForm<z.infer<typeof opportunityFormSchema>>({
    resolver: zodResolver(opportunityFormSchema),
    defaultValues: {
      title: "",
      stage: "qualification",
      amount: 0,
      currency: "EUR",
      probability: 25,
      priority: "P2"
    },
  });

  // Handle errors
  useEffect(() => {
    if (leadsError && isUnauthorizedError(leadsError as Error)) {
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
  }, [leadsError, toast]);

  if (authLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading"/>
      </div>
    );
  }

  if (!hasCRMAccess) {
    return (
      <MainLayout title="CRM" icon={UserPlus}>
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            Non hai i permessi per accedere alla sezione CRM.
          </p>
        </div>
      </MainLayout>
    );
  }

  const onCreateLead = async (data: z.infer<typeof leadFormSchema>) => {
    await createLeadMutation.mutateAsync(data);
  };

  const onCreateOpportunity = async (data: z.infer<typeof opportunityFormSchema>) => {
    await createOpportunityMutation.mutateAsync(data);
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
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'contacted': return 'bg-yellow-100 text-yellow-800';
      case 'qualified': return 'bg-green-100 text-green-800';
      case 'converted': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const renderLeadsView = () => (
    <div data-testid="leads-view">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">Gestione Lead</h2>
          <p className="text-muted-foreground">
            Gestisci i tuoi contatti commerciali e le loro conversioni
          </p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="flex items-center space-x-2" data-testid="new-lead-button">
              <Plus className="w-4 h-4" />
              <span>Nuovo Lead</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Crea Nuovo Lead</DialogTitle>
            </DialogHeader>
            <Form {...leadForm}>
              <form onSubmit={leadForm.handleSubmit(onCreateLead)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={leadForm.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="lead-first-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={leadForm.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cognome</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="lead-last-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={leadForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} data-testid="lead-email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={leadForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefono</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} data-testid="lead-phone" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={leadForm.control}
                  name="company"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Azienda</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="lead-company" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={leadForm.control}
                    name="source"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fonte</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="lead-source">
                              <SelectValue placeholder="Seleziona fonte" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="website">Sito Web</SelectItem>
                            <SelectItem value="social">Social Media</SelectItem>
                            <SelectItem value="email">Email Marketing</SelectItem>
                            <SelectItem value="referral">Referral</SelectItem>
                            <SelectItem value="other">Altro</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={leadForm.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Priorità</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || "P2"}>
                          <FormControl>
                            <SelectTrigger data-testid="lead-priority">
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
                <Button 
                  type="submit" 
                  disabled={createLeadMutation.isPending}
                  className="w-full"
                  data-testid="create-lead-submit"
                >
                  {createLeadMutation.isPending ? "Creazione..." : "Crea Lead"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Leads Grid */}
      {leadsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-muted rounded w-3/4"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded"></div>
                  <div className="h-4 bg-muted rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : leads.length === 0 ? (
        <Card data-testid="no-leads">
          <CardContent className="text-center py-12">
            <UserPlus className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nessun lead</h3>
            <p className="text-muted-foreground mb-6">
              Inizia aggiungendo il tuo primo contatto commerciale
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="leads-grid">
          {leads.map((lead: any) => (
            <Card key={lead.id} className="hover:shadow-md transition-shadow" data-testid={`lead-${lead.id}`}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg" data-testid={`lead-name-${lead.id}`}>
                    {lead.firstName} {lead.lastName}
                  </CardTitle>
                  <Badge 
                    className={getPriorityColor(lead.priority)}
                    data-testid={`lead-priority-${lead.id}`}
                  >
                    {lead.priority}
                  </Badge>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge 
                    className={getStatusColor(lead.status)}
                    data-testid={`lead-status-${lead.id}`}
                  >
                    {lead.status}
                  </Badge>
                  {lead.source && (
                    <Badge variant="outline" data-testid={`lead-source-${lead.id}`}>
                      {lead.source}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="font-medium text-sm" data-testid={`lead-company-${lead.id}`}>
                      {lead.company}
                    </p>
                  </div>
                  <div className="space-y-2">
                    {lead.email && (
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <Mail className="w-4 h-4" />
                        <span data-testid={`lead-email-${lead.id}`}>{lead.email}</span>
                      </div>
                    )}
                    {lead.phone && (
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <Phone className="w-4 h-4" />
                        <span data-testid={`lead-phone-${lead.id}`}>{lead.phone}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex justify-between items-center pt-2 text-sm text-muted-foreground">
                    <span data-testid={`lead-created-${lead.id}`}>
                      Creato: {new Date(lead.createdAt).toLocaleDateString('it-IT')}
                    </span>
                    <Button variant="ghost" size="sm" data-testid={`lead-menu-${lead.id}`}>
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  const renderOpportunitiesView = () => (
    <div data-testid="opportunities-view">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">Gestione Opportunità</h2>
          <p className="text-muted-foreground">
            Monitora e gestisci le tue opportunità di vendita
          </p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="flex items-center space-x-2" data-testid="new-opportunity-button">
              <Plus className="w-4 h-4" />
              <span>Nuova Opportunità</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Crea Nuova Opportunità</DialogTitle>
            </DialogHeader>
            <Form {...opportunityForm}>
              <form onSubmit={opportunityForm.handleSubmit(onCreateOpportunity)} className="space-y-4">
                <FormField
                  control={opportunityForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Titolo</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="opportunity-title" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={opportunityForm.control}
                    name="stage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fase</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="opportunity-stage">
                              <SelectValue placeholder="Seleziona fase" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="qualification">Qualificazione</SelectItem>
                            <SelectItem value="proposal">Proposta</SelectItem>
                            <SelectItem value="negotiation">Negoziazione</SelectItem>
                            <SelectItem value="closed_won">Vinta</SelectItem>
                            <SelectItem value="closed_lost">Persa</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={opportunityForm.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Priorità</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || "P2"}>
                          <FormControl>
                            <SelectTrigger data-testid="opportunity-priority">
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
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={opportunityForm.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valore (€)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            {...field}
                            value={field.value || ""}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : 0)}
                            data-testid="opportunity-amount"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={opportunityForm.control}
                    name="probability"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Probabilità (%)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="0" 
                            max="100"
                            {...field}
                            value={field.value || ""}
                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : 0)}
                            data-testid="opportunity-probability"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <Button 
                  type="submit" 
                  disabled={createOpportunityMutation.isPending}
                  className="w-full"
                  data-testid="create-opportunity-submit"
                >
                  {createOpportunityMutation.isPending ? "Creazione..." : "Crea Opportunità"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Opportunities Grid */}
      {opportunitiesLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-muted rounded w-3/4"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded"></div>
                  <div className="h-4 bg-muted rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : opportunities.length === 0 ? (
        <Card data-testid="no-opportunities">
          <CardContent className="text-center py-12">
            <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nessuna opportunità</h3>
            <p className="text-muted-foreground mb-6">
              Inizia creando la tua prima opportunità di vendita
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="opportunities-grid">
          {opportunities.map((opportunity: any) => (
            <Card key={opportunity.id} className="hover:shadow-md transition-shadow" data-testid={`opportunity-${opportunity.id}`}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg" data-testid={`opportunity-title-${opportunity.id}`}>
                    {opportunity.title}
                  </CardTitle>
                  <Badge 
                    className={getPriorityColor(opportunity.priority)}
                    data-testid={`opportunity-priority-${opportunity.id}`}
                  >
                    {opportunity.priority}
                  </Badge>
                </div>
                <Badge 
                  variant="outline"
                  data-testid={`opportunity-stage-${opportunity.id}`}
                >
                  {opportunity.stage}
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Valore:</span>
                    <span className="font-semibold" data-testid={`opportunity-amount-${opportunity.id}`}>
                      €{opportunity.amount ? opportunity.amount.toLocaleString() : '0'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Probabilità:</span>
                    <span data-testid={`opportunity-probability-${opportunity.id}`}>
                      {opportunity.probability || 0}%
                    </span>
                  </div>
                  {opportunity.closeDate && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Chiusura prevista:</span>
                      <span data-testid={`opportunity-close-date-${opportunity.id}`}>
                        {new Date(opportunity.closeDate).toLocaleDateString('it-IT')}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-2 text-sm text-muted-foreground">
                    <span data-testid={`opportunity-created-${opportunity.id}`}>
                      Creata: {new Date(opportunity.createdAt).toLocaleDateString('it-IT')}
                    </span>
                    <Button variant="ghost" size="sm" data-testid={`opportunity-menu-${opportunity.id}`}>
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  const renderPipelineView = () => (
    <div data-testid="pipeline-view">
      <div className="text-center py-8">
        <h2 className="text-2xl font-bold mb-4">Pipeline Commerciale</h2>
        <p className="text-muted-foreground">
          Vista pipeline sarà disponibile prossimamente
        </p>
      </div>
    </div>
  );

  // Mock data for cadences
  const mockCadences = [
    {
      id: "cadence-1",
      name: "Onboarding Nuovi Clienti B2B",
      description: "Sequenza di benvenuto per nuovi clienti enterprise con follow-up personalizzati",
      status: "active",
      totalSteps: 7,
      enrolledContacts: 143,
      completedContacts: 89,
      responseRate: 34.2,
      openRate: 67.8,
      createdAt: "2024-01-05T09:00:00Z",
      lastModified: "2024-01-12T14:30:00Z",
      steps: [
        { type: "email", subject: "Benvenuto in Stratikey!", delay: 0 },
        { type: "email", subject: "Come iniziare con la tua dashboard", delay: 2 },
        { type: "phone", subject: "Chiamata di check-in", delay: 5 },
        { type: "email", subject: "Tips per ottimizzare il tuo workflow", delay: 7 },
        { type: "email", subject: "Invito webinar best practices", delay: 10 },
        { type: "sms", subject: "Reminder webinar di domani", delay: 13 },
        { type: "email", subject: "Follow-up post webinar", delay: 15 }
      ]
    },
    {
      id: "cadence-2", 
      name: "Lead Nurturing E-commerce",
      description: "Coltivazione lead interessati a soluzioni e-commerce con contenuti educativi",
      status: "active",
      totalSteps: 5,
      enrolledContacts: 87,
      completedContacts: 52,
      responseRate: 28.7,
      openRate: 72.1,
      createdAt: "2024-01-08T11:20:00Z",
      lastModified: "2024-01-14T16:45:00Z",
      steps: [
        { type: "email", subject: "Guida: 10 errori da evitare nel tuo e-commerce", delay: 0 },
        { type: "email", subject: "Case study: Come abbiamo aumentato le vendite del 40%", delay: 3 },
        { type: "phone", subject: "Consulenza gratuita 30 min", delay: 7 },
        { type: "email", subject: "Checklist per un e-commerce di successo", delay: 10 },
        { type: "email", subject: "Offerta speciale: Sconto 20% implementazione", delay: 14 }
      ]
    },
    {
      id: "cadence-3",
      name: "Recupero Clienti Inattivi",
      description: "Riattivazione clienti che non utilizzano la piattaforma da oltre 30 giorni",
      status: "paused",
      totalSteps: 4,
      enrolledContacts: 34,
      completedContacts: 19,
      responseRate: 15.4,
      openRate: 41.2,
      createdAt: "2023-12-15T08:30:00Z",
      lastModified: "2024-01-10T12:15:00Z",
      steps: [
        { type: "email", subject: "Ti manca qualcosa? Riprendiamo da dove avevamo lasciato", delay: 0 },
        { type: "email", subject: "Nuove funzionalità che potrebbero interessarti", delay: 5 },
        { type: "phone", subject: "Chiamata per feedback e supporto", delay: 8 },
        { type: "email", subject: "Ultima opportunità: Offerta personalizzata", delay: 12 }
      ]
    }
  ];

  const statusColors = {
    active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    paused: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
    draft: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
  };

  const statusLabels = {
    active: "Attiva",
    paused: "In Pausa", 
    draft: "Bozza"
  };

  const stepTypeIcons = {
    email: Mail,
    phone: Phone,
    sms: MessageSquare
  };

  const renderCadencesView = () => {
    const activeCadences = mockCadences.filter(c => c.status === 'active').length;
    const totalEnrolled = mockCadences.reduce((sum, c) => sum + c.enrolledContacts, 0);
    const avgResponseRate = mockCadences.reduce((sum, c) => sum + c.responseRate, 0) / mockCadences.length;
    const avgOpenRate = mockCadences.reduce((sum, c) => sum + c.openRate, 0) / mockCadences.length;

    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString('it-IT', {
        day: '2-digit',
        month: '2-digit', 
        year: 'numeric'
      });
    };

    const getCompletionRate = (completed: number, enrolled: number) => {
      return enrolled > 0 ? (completed / enrolled * 100) : 0;
    };

    return (
      <div className="space-y-6" data-testid="cadences-view">
        {/* Header Actions */}
        <div className="flex justify-between items-center">
          <Button data-testid="button-add-cadence">
            <Plus className="h-4 w-4 mr-2" />
            Nuova Sequenza
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Sequenze Attive</p>
                  <p className="text-2xl font-bold" data-testid="stat-active-cadences">
                    {activeCadences}
                  </p>
                </div>
                <Play className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Contatti Iscritti</p>
                  <p className="text-2xl font-bold" data-testid="stat-total-enrolled">
                    {totalEnrolled}
                  </p>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Tasso Risposta Medio</p>
                  <p className="text-2xl font-bold" data-testid="stat-avg-response-rate">
                    {avgResponseRate.toFixed(1)}%
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Tasso Apertura Medio</p>
                  <p className="text-2xl font-bold" data-testid="stat-avg-open-rate">
                    {avgOpenRate.toFixed(1)}%
                  </p>
                </div>
                <Mail className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Cerca sequenze per nome o descrizione..."
                    className="pl-10"
                    data-testid="input-search-cadences"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Select defaultValue="all">
                  <SelectTrigger className="w-40" data-testid="select-status-filter">
                    <SelectValue placeholder="Stato" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tutti gli stati</SelectItem>
                    <SelectItem value="active">Attiva</SelectItem>
                    <SelectItem value="paused">In Pausa</SelectItem>
                    <SelectItem value="draft">Bozza</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cadences List */}
        <div className="space-y-4">
          {mockCadences.map((cadence) => (
            <Card key={cadence.id} data-testid={`cadence-card-${cadence.id}`}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">
                        {cadence.name}
                      </h3>
                      <Badge className={statusColors[cadence.status as keyof typeof statusColors]}>
                        {statusLabels[cadence.status as keyof typeof statusLabels]}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {cadence.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {cadence.status === 'active' ? (
                      <Button variant="outline" size="sm" data-testid={`button-pause-${cadence.id}`}>
                        <Pause className="h-4 w-4 mr-2" />
                        Pausa
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm" data-testid={`button-play-${cadence.id}`}>
                        <Play className="h-4 w-4 mr-2" />
                        Avvia
                      </Button>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" data-testid={`button-actions-${cadence.id}`}>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>Visualizza Analytics</DropdownMenuItem>
                        <DropdownMenuItem>Modifica Sequenza</DropdownMenuItem>
                        <DropdownMenuItem>Duplica</DropdownMenuItem>
                        <DropdownMenuItem>Esporta Dati</DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">Elimina</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Statistics */}
                  <div className="space-y-4">
                    <h4 className="font-medium">Statistiche</h4>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Contatti iscritti</span>
                        <span className="font-medium">{cadence.enrolledContacts}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Completati</span>
                        <span className="font-medium">{cadence.completedContacts}</span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Progresso</span>
                          <span className="text-sm font-medium">
                            {getCompletionRate(cadence.completedContacts, cadence.enrolledContacts).toFixed(1)}%
                          </span>
                        </div>
                        <Progress 
                          value={getCompletionRate(cadence.completedContacts, cadence.enrolledContacts)}
                          className="h-2"
                        />
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Tasso risposta</span>
                        <span className="font-medium text-green-600">{cadence.responseRate}%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Tasso apertura</span>
                        <span className="font-medium text-blue-600">{cadence.openRate}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Steps Preview */}
                  <div className="lg:col-span-2 space-y-4">
                    <h4 className="font-medium">
                      Anteprima Steps ({cadence.steps.length})
                    </h4>
                    
                    <div className="space-y-3 max-h-48 overflow-y-auto">
                      {cadence.steps.map((step, index) => {
                        const Icon = stepTypeIcons[step.type as keyof typeof stepTypeIcons];
                        return (
                          <div key={index} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                            <div className="flex items-center justify-center w-8 h-8 bg-background rounded-full border">
                              <Icon className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-medium">
                                  Step {index + 1}
                                </span>
                                <Badge variant="secondary" className="text-xs">
                                  {step.type.toUpperCase()}
                                </Badge>
                                <div className="flex items-center text-xs text-muted-foreground">
                                  <Clock className="h-3 w-3 mr-1" />
                                  {step.delay === 0 ? 'Immediato' : `+${step.delay} giorni`}
                                </div>
                              </div>
                              <p className="text-sm text-muted-foreground truncate">
                                {step.subject}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="flex justify-between items-center text-sm text-muted-foreground">
                  <span>Creata il {formatDate(cadence.createdAt)}</span>
                  <span>Ultima modifica il {formatDate(cadence.lastModified)}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  return (
    <MainLayout 
      title={currentView === 'opportunities' ? 'Opportunità' : currentView === 'pipeline' ? 'Pipeline' : currentView === 'cadences' ? 'Sequenze di Vendita' : 'Lead'} 
      icon={currentView === 'opportunities' ? TrendingUp : currentView === 'cadences' ? Mail : UserPlus}
    >
      <div data-testid="crm-content">
        {currentView === 'leads' && renderLeadsView()}
        {currentView === 'opportunities' && renderOpportunitiesView()}
        {currentView === 'pipeline' && renderPipelineView()}
        {currentView === 'cadences' && renderCadencesView()}
      </div>
    </MainLayout>
  );
}
