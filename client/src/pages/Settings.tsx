import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { 
  Settings, 
  User, 
  Building2, 
  Users, 
  Palette, 
  Bell, 
  Plug, 
  CreditCard, 
  Code,
  Save,
  Eye,
  EyeOff,
  Loader2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { UserSettings, OrganizationSettings } from "@shared/schema";

// Form schemas
const accountFormSchema = z.object({
  language: z.string().default('it'),
  timezone: z.string().default('Europe/Rome'),
  interface: z.object({
    theme: z.enum(['light', 'dark', 'auto']).default('light'),
  }).default({
    theme: 'light'
  }),
});

const organizationFormSchema = z.object({
  organization: z.object({
    name: z.string().optional(),
    industry: z.string().optional(),
    size: z.string().optional(),
    country: z.string().optional(),
    description: z.string().optional(),
  }).default({}),
  branding: z.object({
    logoUrl: z.string().optional(),
    brandColor: z.string().default('#390035'),
    customDomain: z.string().optional(),
    subdomain: z.string().optional(),
    sslEnabled: z.boolean().default(true),
  }).default({
    brandColor: '#390035',
    sslEnabled: true
  }),
});

function BillingTab() {
  const { toast } = useToast();
  
  const { data: subscriptionData, isLoading, error } = useQuery<{
    subscription: any;
    plan: any;
  }>({
    queryKey: ['/api/billing/subscription'],
  });

  const openBillingPortal = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/billing/create-portal-session', {});
      return response.json();
    },
    onSuccess: (data: any) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Impossibile aprire il portale di fatturazione",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin" data-testid="loading-subscription" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-destructive text-center" data-testid="error-subscription">
            Errore nel caricamento delle informazioni di abbonamento
          </p>
        </CardContent>
      </Card>
    );
  }

  const plan = subscriptionData?.plan;
  const sub = subscriptionData?.subscription;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Fatturazione e Abbonamento
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h4 className="font-medium">Piano Attuale</h4>
              {plan ? (
                <>
                  <p className="text-sm text-muted-foreground" data-testid="plan-name">{plan.name}</p>
                  <p className="text-xs text-muted-foreground" data-testid="plan-price">
                    €{plan.priceMonthly}/mese - {plan.billingPeriod === 'MONTHLY' ? 'Mensile' : 'Annuale'}
                  </p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground" data-testid="no-subscription">Nessun abbonamento attivo</p>
              )}
            </div>
            {sub && <Badge variant="default" data-testid="subscription-status">{sub.status === 'ACTIVE' ? 'Attivo' : sub.status}</Badge>}
          </div>

          {plan && (
            <div className="p-4 border rounded-lg space-y-2">
              <h4 className="text-sm font-medium">Limiti del Piano</h4>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Utenti</p>
                  <p className="font-medium" data-testid="limit-users">{plan.maxUsers === -1 ? 'Illimitati' : plan.maxUsers}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Asset</p>
                  <p className="font-medium" data-testid="limit-assets">{plan.maxAssets === -1 ? 'Illimitati' : plan.maxAssets}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Post/Mese</p>
                  <p className="font-medium" data-testid="limit-posts">{plan.maxPostsPerMonth === -1 ? 'Illimitati' : plan.maxPostsPerMonth}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <Button
            onClick={() => openBillingPortal.mutate()}
            disabled={openBillingPortal.isPending || !sub}
            data-testid="open-billing-portal"
            className="flex items-center gap-2"
          >
            {openBillingPortal.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CreditCard className="w-4 h-4" />
            )}
            Gestisci Abbonamento
          </Button>
          <p className="text-xs text-muted-foreground">
            Accedi al portale Stripe per gestire metodo di pagamento, fatture e abbonamento
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function SettingsPage() {
  const { toast } = useToast();
  const [showApiKey, setShowApiKey] = useState(false);

  // Fetch user settings
  const { data: userSettings, isLoading: userSettingsLoading, error: userSettingsError } = useQuery({
    queryKey: ['/api/settings/user'],
  });

  // Fetch organization settings
  const { data: orgSettings, isLoading: orgSettingsLoading, error: orgSettingsError } = useQuery({
    queryKey: ['/api/settings/organization'],
  });

  // Update user settings mutation
  const updateUserSettings = useMutation({
    mutationFn: async (data: Partial<UserSettings>) => {
      const response = await apiRequest('PATCH', '/api/settings/user', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings/user'] });
      toast({
        title: "Impostazioni Salvate",
        description: "Le tue impostazioni personali sono state salvate con successo",
      });
    },
    onError: (error) => {
      toast({
        title: "Errore",
        description: "Si è verificato un errore nel salvare le impostazioni",
        variant: "destructive",
      });
    },
  });

  // Update organization settings mutation  
  const updateOrgSettings = useMutation({
    mutationFn: async (data: Partial<OrganizationSettings>) => {
      const response = await apiRequest('PATCH', '/api/settings/organization', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings/organization'] });
      toast({
        title: "Impostazioni Salvate",
        description: "Le impostazioni dell'organizzazione sono state salvate con successo",
      });
    },
    onError: (error) => {
      toast({
        title: "Errore",
        description: "Si è verificato un errore nel salvare le impostazioni dell'organizzazione",
        variant: "destructive",
      });
    },
  });

  // Account form
  const accountForm = useForm({
    resolver: zodResolver(accountFormSchema),
    defaultValues: {
      language: (userSettings as UserSettings)?.language || 'it',
      timezone: (userSettings as UserSettings)?.timezone || 'Europe/Rome',
      interface: {
        theme: (userSettings as UserSettings)?.interface?.theme || 'light'
      }
    },
  });

  // Organization form  
  const organizationForm = useForm({
    resolver: zodResolver(organizationFormSchema),
    defaultValues: {
      organization: (orgSettings as OrganizationSettings)?.organization || {},
      branding: (orgSettings as OrganizationSettings)?.branding || { brandColor: '#390035', sslEnabled: true }
    },
  });

  const handleAccountSave = (data: z.infer<typeof accountFormSchema>) => {
    // Merge with existing interface settings to preserve all properties
    const updateData: Partial<UserSettings> = {
      language: data.language,
      timezone: data.timezone,
      interface: {
        ...(userSettings as UserSettings)?.interface,
        theme: data.interface.theme,
      }
    };
    updateUserSettings.mutate(updateData);
  };

  const handleOrganizationSave = (data: z.infer<typeof organizationFormSchema>) => {
    updateOrgSettings.mutate(data);
  };

  // Hydrate account form with server data when it arrives
  useEffect(() => {
    if (userSettings) {
      const settings = userSettings as UserSettings;
      accountForm.reset({
        language: settings.language || 'it',
        timezone: settings.timezone || 'Europe/Rome',
        interface: {
          theme: settings.interface?.theme || 'light'
        }
      });
    }
  }, [userSettings, accountForm]);

  // Hydrate organization form with server data when it arrives
  useEffect(() => {
    if (orgSettings) {
      const settings = orgSettings as OrganizationSettings;
      organizationForm.reset({
        organization: settings.organization || {},
        branding: settings.branding || { brandColor: '#390035', sslEnabled: true }
      });
    }
  }, [orgSettings, organizationForm]);

  const handleSave = (section: string) => {
    toast({
      title: "Impostazioni Salvate",
      description: `Le impostazioni di ${section} sono state salvate con successo`,
    });
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Settings className="h-8 w-8" />
          Impostazioni
        </h1>
        <p className="text-muted-foreground">
          Gestisci le impostazioni del tuo account e dell'organizzazione
        </p>
      </div>

      <Tabs defaultValue="account" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
          <TabsTrigger value="account" className="flex items-center gap-1">
            <User className="w-4 h-4" />
            <span className="hidden sm:inline">Account</span>
          </TabsTrigger>
          <TabsTrigger value="organization" className="flex items-center gap-1">
            <Building2 className="w-4 h-4" />
            <span className="hidden sm:inline">Organizzazione</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">Utenti</span>
          </TabsTrigger>
          <TabsTrigger value="branding" className="flex items-center gap-1">
            <Palette className="w-4 h-4" />
            <span className="hidden sm:inline">Branding</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-1">
            <Bell className="w-4 h-4" />
            <span className="hidden sm:inline">Notifiche</span>
          </TabsTrigger>
          <TabsTrigger value="integrations" className="flex items-center gap-1">
            <Plug className="w-4 h-4" />
            <span className="hidden sm:inline">Integrazioni</span>
          </TabsTrigger>
          <TabsTrigger value="billing" className="flex items-center gap-1">
            <CreditCard className="w-4 h-4" />
            <span className="hidden sm:inline">Fatturazione</span>
          </TabsTrigger>
          <TabsTrigger value="developer" className="flex items-center gap-1">
            <Code className="w-4 h-4" />
            <span className="hidden sm:inline">Developer</span>
          </TabsTrigger>
        </TabsList>

        {/* Account Tab */}
        <TabsContent value="account" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Informazioni Account
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {userSettingsLoading && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span className="ml-2">Caricamento impostazioni...</span>
                </div>
              )}
              
              {userSettingsError && (
                <div className="text-red-500 text-sm">
                  Errore nel caricamento delle impostazioni account
                </div>
              )}

              {!userSettingsLoading && !userSettingsError && (
                <Form {...accountForm}>
                  <form onSubmit={accountForm.handleSubmit(handleAccountSave)} className="space-y-6">
                    <div className="space-y-4">
                      <h4 className="text-sm font-medium">Preferenze</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={accountForm.control}
                          name="language"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Lingua</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-language">
                                    <SelectValue placeholder="Seleziona lingua" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="it">Italiano</SelectItem>
                                  <SelectItem value="en">English</SelectItem>
                                  <SelectItem value="es">Español</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={accountForm.control}
                          name="timezone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Fuso Orario</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-timezone">
                                    <SelectValue placeholder="Seleziona fuso orario" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="Europe/Rome">Europa/Roma</SelectItem>
                                  <SelectItem value="Europe/London">Europa/Londra</SelectItem>
                                  <SelectItem value="America/New_York">America/New York</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-sm font-medium">Interfaccia</h4>
                      <FormField
                        control={accountForm.control}
                        name="interface.theme"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tema</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-theme">
                                  <SelectValue placeholder="Seleziona tema" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="light">Chiaro</SelectItem>
                                <SelectItem value="dark">Scuro</SelectItem>
                                <SelectItem value="auto">Automatico</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />
                    </div>

                    <Button 
                      type="submit"
                      data-testid="save-account"
                      className="flex items-center gap-2"
                      disabled={updateUserSettings.isPending}
                    >
                      {updateUserSettings.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      Salva Account
                    </Button>
                  </form>
                </Form>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Organization Tab */}
        <TabsContent value="organization" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Informazioni Organizzazione
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {orgSettingsLoading && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span className="ml-2">Caricamento impostazioni organizzazione...</span>
                </div>
              )}
              
              {orgSettingsError && (
                <div className="text-red-500 text-sm">
                  Errore nel caricamento delle impostazioni organizzazione
                </div>
              )}

              {!orgSettingsLoading && !orgSettingsError && (
                <Form {...organizationForm}>
                  <form onSubmit={organizationForm.handleSubmit(handleOrganizationSave)} className="space-y-6">
                    <div className="space-y-4">
                      <h4 className="text-sm font-medium">Informazioni Aziendali</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={organizationForm.control}
                          name="organization.name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nome Organizzazione</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Stratikey S.r.l." 
                                  data-testid="input-org-name"
                                  {...field}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={organizationForm.control}
                          name="organization.industry"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Settore</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-industry">
                                    <SelectValue placeholder="Seleziona settore" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="tech">Tecnologia</SelectItem>
                                  <SelectItem value="finance">Finanza</SelectItem>
                                  <SelectItem value="healthcare">Sanità</SelectItem>
                                  <SelectItem value="retail">Retail</SelectItem>
                                  <SelectItem value="manufacturing">Manifatturiero</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={organizationForm.control}
                          name="organization.size"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Dimensione Azienda</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-org-size">
                                    <SelectValue placeholder="Seleziona dimensione" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="1-10">1-10 dipendenti</SelectItem>
                                  <SelectItem value="11-50">11-50 dipendenti</SelectItem>
                                  <SelectItem value="51-200">51-200 dipendenti</SelectItem>
                                  <SelectItem value="201-1000">201-1000 dipendenti</SelectItem>
                                  <SelectItem value="1000+">1000+ dipendenti</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={organizationForm.control}
                          name="organization.country"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Paese</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-country">
                                    <SelectValue placeholder="Seleziona paese" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="IT">Italia</SelectItem>
                                  <SelectItem value="US">Stati Uniti</SelectItem>
                                  <SelectItem value="GB">Regno Unito</SelectItem>
                                  <SelectItem value="DE">Germania</SelectItem>
                                  <SelectItem value="FR">Francia</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={organizationForm.control}
                        name="organization.description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Descrizione</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Descrivi la tua organizzazione..."
                                data-testid="textarea-org-description"
                                {...field}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-sm font-medium">Branding</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={organizationForm.control}
                          name="branding.logoUrl"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>URL Logo</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="https://example.com/logo.png"
                                  data-testid="input-logo-url"
                                  {...field}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={organizationForm.control}
                          name="branding.brandColor"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Colore Primario</FormLabel>
                              <FormControl>
                                <Input 
                                  type="color"
                                  data-testid="input-brand-color"
                                  {...field}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <Button 
                      type="submit"
                      data-testid="save-organization"
                      className="flex items-center gap-2"
                      disabled={updateOrgSettings.isPending}
                    >
                      {updateOrgSettings.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      Salva Organizzazione
                    </Button>
                  </form>
                </Form>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Users & Permissions Tab */}
        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Gestione Utenti & Permessi
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium">Invita Nuovo Utente</h4>
                    <p className="text-sm text-muted-foreground">
                      Aggiungi un nuovo membro al team
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="inviteEmail">Email</Label>
                    <Input 
                      id="inviteEmail" 
                      type="email" 
                      placeholder="nuovo.utente@example.com"
                      data-testid="input-invite-email"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Ruolo</Label>
                    <Select data-testid="select-role">
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona ruolo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="VIEWER">Viewer</SelectItem>
                        <SelectItem value="SALES">Sales</SelectItem>
                        <SelectItem value="MARKETER">Marketer</SelectItem>
                        <SelectItem value="ORG_ADMIN">Org Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <Button 
                      onClick={() => handleSave("Invito Utente")}
                      data-testid="invite-user"
                      className="w-full"
                    >
                      Invia Invito
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-medium">Permessi Predefiniti</h4>
                {[
                  { role: "VIEWER", description: "Può visualizzare dati ma non modificare" },
                  { role: "SALES", description: "Gestisce lead, opportunità e pipeline" },
                  { role: "MARKETER", description: "Gestisce campagne e contenuti marketing" },
                  { role: "ORG_ADMIN", description: "Amministratore dell'organizzazione" }
                ].map((permission) => (
                  <div key={permission.role} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <Badge variant="outline">{permission.role}</Badge>
                      <p className="text-sm text-muted-foreground mt-1">
                        {permission.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <Button 
                onClick={() => handleSave("Utenti & Permessi")}
                data-testid="save-permissions"
                className="flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Salva Permessi
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Branding & Domains Tab */}
        <TabsContent value="branding" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5" />
                Branding & Domini
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="text-sm font-medium">Logo e Branding</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="logoUrl">URL Logo</Label>
                    <Input 
                      id="logoUrl" 
                      placeholder="https://example.com/logo.png"
                      data-testid="input-logo-url"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="brandColor">Colore Primario</Label>
                    <Input 
                      id="brandColor" 
                      type="color" 
                      defaultValue="#390035"
                      data-testid="input-brand-color"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-medium">Domini Personalizzati</h4>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="customDomain">Dominio Principale</Label>
                      <Input 
                        id="customDomain" 
                        placeholder="app.tuodominio.com"
                        data-testid="input-custom-domain"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="subdomain">Sottodominio</Label>
                      <Input 
                        id="subdomain" 
                        placeholder="tuaazienda.stratikey.app"
                        data-testid="input-subdomain"
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch id="sslEnabled" data-testid="switch-ssl" defaultChecked />
                    <Label htmlFor="sslEnabled">Abilita SSL automatico</Label>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-medium">Personalizzazione Email</h4>
                <div className="space-y-2">
                  <Label htmlFor="emailTemplate">Template Email</Label>
                  <Textarea 
                    id="emailTemplate" 
                    placeholder="Personalizza il template delle email inviate dalla piattaforma..."
                    data-testid="textarea-email-template"
                  />
                </div>
              </div>

              <Button 
                onClick={() => handleSave("Branding & Domini")}
                data-testid="save-branding"
                className="flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Salva Branding
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Impostazioni Notifiche
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-medium mb-4">Notifiche Email</h4>
                  <div className="space-y-4">
                    {[
                      { id: "email-campaigns", label: "Campagne Marketing", description: "Aggiornamenti su campagne e performance" },
                      { id: "email-leads", label: "Nuovi Lead", description: "Notifica quando arriva un nuovo lead" },
                      { id: "email-tasks", label: "Scadenze Attività", description: "Promemoria per le scadenze dei task" },
                      { id: "email-opportunities", label: "Opportunità", description: "Aggiornamenti su opportunità di vendita" }
                    ].map((setting) => (
                      <div key={setting.id} className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor={setting.id} className="text-sm font-medium">
                            {setting.label}
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            {setting.description}
                          </p>
                        </div>
                        <Switch id={setting.id} data-testid={`switch-${setting.id}`} />
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-4">Notifiche Push</h4>
                  <div className="space-y-4">
                    {[
                      { id: "push-browser", label: "Notifiche Browser", description: "Ricevi notifiche push nel browser" },
                      { id: "push-mobile", label: "Notifiche Mobile", description: "Notifiche push su dispositivi mobili" },
                      { id: "push-desktop", label: "Notifiche Desktop", description: "Notifiche desktop quando l'app è aperta" }
                    ].map((setting) => (
                      <div key={setting.id} className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor={setting.id} className="text-sm font-medium">
                            {setting.label}
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            {setting.description}
                          </p>
                        </div>
                        <Switch id={setting.id} data-testid={`switch-${setting.id}`} />
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-4">Notifiche SMS</h4>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="smsNumber">Numero di Telefono</Label>
                      <Input 
                        id="smsNumber" 
                        placeholder="+39 123 456 7890"
                        data-testid="input-sms-number"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="sms-emergency" className="text-sm font-medium">
                          SMS di Emergenza
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Ricevi SMS solo per eventi critici
                        </p>
                      </div>
                      <Switch id="sms-emergency" data-testid="switch-sms-emergency" />
                    </div>
                  </div>
                </div>
              </div>

              <Button 
                onClick={() => handleSave("Notifiche")}
                data-testid="save-notifications"
                className="flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Salva Notifiche
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Integrations Tab */}
        <TabsContent value="integrations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plug className="w-5 h-5" />
                Integrazioni
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4">
                {[
                  { 
                    name: "Stripe", 
                    description: "Gestione pagamenti e fatturazione", 
                    status: "connected",
                    category: "Pagamenti"
                  },
                  { 
                    name: "PostgreSQL", 
                    description: "Database principale per la persistenza", 
                    status: "connected",
                    category: "Database"
                  },
                  { 
                    name: "Replit Auth", 
                    description: "Sistema di autenticazione OAuth", 
                    status: "connected",
                    category: "Autenticazione"
                  },
                  { 
                    name: "Google Analytics", 
                    description: "Tracciamento e analisi del traffico", 
                    status: "available",
                    category: "Analytics"
                  },
                  { 
                    name: "Mailchimp", 
                    description: "Email marketing e automazione", 
                    status: "available",
                    category: "Marketing"
                  },
                  { 
                    name: "Slack", 
                    description: "Notifiche e comunicazioni team", 
                    status: "available",
                    category: "Comunicazione"
                  }
                ].map((integration) => (
                  <div key={integration.name} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <Plug className="w-8 h-8 text-muted-foreground" />
                      <div>
                        <div className="flex items-center gap-2">
                          <h5 className="font-medium">{integration.name}</h5>
                          <Badge variant={integration.status === 'connected' ? 'default' : 'secondary'}>
                            {integration.status === 'connected' ? 'Collegato' : 'Disponibile'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{integration.description}</p>
                        <p className="text-xs text-muted-foreground">{integration.category}</p>
                      </div>
                    </div>
                    <Button 
                      variant={integration.status === 'connected' ? 'outline' : 'default'}
                      onClick={() => handleSave(`Integrazione ${integration.name}`)}
                      data-testid={`integration-${integration.name.toLowerCase()}`}
                    >
                      {integration.status === 'connected' ? 'Configura' : 'Connetti'}
                    </Button>
                  </div>
                ))}
              </div>

              <Button 
                onClick={() => handleSave("Integrazioni")}
                data-testid="save-integrations"
                className="flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Salva Integrazioni
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Billing Tab */}
        <TabsContent value="billing" className="space-y-6">
          <BillingTab />
        </TabsContent>

        {/* Developer Tab */}
        <TabsContent value="developer" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="w-5 h-5" />
                Impostazioni Developer
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="text-sm font-medium">API Keys</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Production API Key</p>
                      <div className="flex items-center gap-2">
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {showApiKey ? 'sk_live_abc123def456...' : '••••••••••••••••••••'}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowApiKey(!showApiKey)}
                          data-testid="toggle-api-key"
                        >
                          {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleSave("Rigenera API Key")}
                      data-testid="regenerate-api-key"
                    >
                      Rigenera
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-medium">Webhook Endpoints</h4>
                <div className="space-y-2">
                  <Label htmlFor="webhookUrl">URL Webhook</Label>
                  <Input 
                    id="webhookUrl" 
                    placeholder="https://yourdomain.com/webhooks/stratikey"
                    data-testid="input-webhook-url"
                  />
                </div>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">Eventi da ascoltare:</p>
                  {[
                    { id: "lead-created", label: "Nuovo Lead Creato" },
                    { id: "campaign-completed", label: "Campagna Completata" },
                    { id: "payment-success", label: "Pagamento Riuscito" },
                    { id: "user-signup", label: "Nuovo Utente Registrato" }
                  ].map((webhook) => (
                    <div key={webhook.id} className="flex items-center space-x-2">
                      <Switch id={webhook.id} data-testid={`webhook-${webhook.id}`} />
                      <Label htmlFor={webhook.id} className="text-sm">{webhook.label}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-medium">Rate Limiting</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="rateLimit">Richieste per Minuto</Label>
                    <Select data-testid="select-rate-limit">
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona limite" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="100">100 richieste/min</SelectItem>
                        <SelectItem value="500">500 richieste/min</SelectItem>
                        <SelectItem value="1000">1000 richieste/min</SelectItem>
                        <SelectItem value="unlimited">Illimitato</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="environment">Ambiente</Label>
                    <Select data-testid="select-environment">
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona ambiente" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="development">Development</SelectItem>
                        <SelectItem value="staging">Staging</SelectItem>
                        <SelectItem value="production">Production</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Button 
                onClick={() => handleSave("Impostazioni Developer")}
                data-testid="save-developer"
                className="flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Salva Developer
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}