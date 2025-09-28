import { useEffect } from "react";
import { useQuery, useMutation, queryClient } from "@tanstack/react-query";
import { UserPlus, TrendingUp, Plus, MoreHorizontal, Phone, Mail } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertLeadSchema, insertOpportunitySchema } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
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
                     location.includes('/pipeline') ? 'pipeline' : 'leads';

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
                        <Input {...field} data-testid="lead-phone" />
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
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
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

  return (
    <MainLayout 
      title={currentView === 'opportunities' ? 'Opportunità' : currentView === 'pipeline' ? 'Pipeline' : 'Lead'} 
      icon={currentView === 'opportunities' ? TrendingUp : UserPlus}
    >
      <div data-testid="crm-content">
        {currentView === 'leads' && renderLeadsView()}
        {currentView === 'opportunities' && renderOpportunitiesView()}
        {currentView === 'pipeline' && renderPipelineView()}
      </div>
    </MainLayout>
  );
}
