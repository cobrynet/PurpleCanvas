import { useState } from "react";
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
  EyeOff
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

export default function SettingsPage() {
  const { toast } = useToast();
  const [showApiKey, setShowApiKey] = useState(false);

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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Nome</Label>
                  <Input 
                    id="firstName" 
                    placeholder="Mario" 
                    data-testid="input-first-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Cognome</Label>
                  <Input 
                    id="lastName" 
                    placeholder="Rossi" 
                    data-testid="input-last-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="mario.rossi@example.com"
                    data-testid="input-email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefono</Label>
                  <Input 
                    id="phone" 
                    placeholder="+39 123 456 7890"
                    data-testid="input-phone"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea 
                  id="bio" 
                  placeholder="Raccontaci qualcosa di te..."
                  data-testid="textarea-bio"
                />
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-medium">Preferenze</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="language">Lingua</Label>
                    <Select data-testid="select-language">
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona lingua" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="it">Italiano</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Español</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="timezone">Fuso Orario</Label>
                    <Select data-testid="select-timezone">
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona fuso orario" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="europe/rome">Europa/Roma</SelectItem>
                        <SelectItem value="europe/london">Europa/Londra</SelectItem>
                        <SelectItem value="america/new_york">America/New York</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Button 
                onClick={() => handleSave("Account")}
                data-testid="save-account"
                className="flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Salva Account
              </Button>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="orgName">Nome Organizzazione</Label>
                  <Input 
                    id="orgName" 
                    placeholder="Stratikey S.r.l." 
                    data-testid="input-org-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="industry">Settore</Label>
                  <Select data-testid="select-industry">
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona settore" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tech">Tecnologia</SelectItem>
                      <SelectItem value="finance">Finanza</SelectItem>
                      <SelectItem value="healthcare">Sanità</SelectItem>
                      <SelectItem value="retail">Retail</SelectItem>
                      <SelectItem value="manufacturing">Manifatturiero</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="orgSize">Dimensione Azienda</Label>
                  <Select data-testid="select-org-size">
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona dimensione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1-10">1-10 dipendenti</SelectItem>
                      <SelectItem value="11-50">11-50 dipendenti</SelectItem>
                      <SelectItem value="51-200">51-200 dipendenti</SelectItem>
                      <SelectItem value="201-1000">201-1000 dipendenti</SelectItem>
                      <SelectItem value="1000+">1000+ dipendenti</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Paese</Label>
                  <Select data-testid="select-country">
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona paese" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="IT">Italia</SelectItem>
                      <SelectItem value="US">Stati Uniti</SelectItem>
                      <SelectItem value="GB">Regno Unito</SelectItem>
                      <SelectItem value="DE">Germania</SelectItem>
                      <SelectItem value="FR">Francia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="orgDescription">Descrizione</Label>
                <Textarea 
                  id="orgDescription" 
                  placeholder="Descrivi la tua organizzazione..."
                  data-testid="textarea-org-description"
                />
              </div>

              <Button 
                onClick={() => handleSave("Organizzazione")}
                data-testid="save-organization"
                className="flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Salva Organizzazione
              </Button>
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
                        <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
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
                  { role: "ORG_ADMIN", description: "Amministratore dell'organizzazione" },
                  { role: "SUPER_ADMIN", description: "Accesso completo alla piattaforma" }
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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Fatturazione e Pagamenti
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Piano Attuale</h4>
                    <p className="text-sm text-muted-foreground">Professional Plan</p>
                    <p className="text-xs text-muted-foreground">€99/mese - Fatturazione mensile</p>
                  </div>
                  <Badge variant="default">Attivo</Badge>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-medium">Metodo di Pagamento</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cardNumber">Numero Carta</Label>
                    <Input 
                      id="cardNumber" 
                      placeholder="**** **** **** 1234"
                      data-testid="input-card-number"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cardExpiry">Scadenza</Label>
                    <Input 
                      id="cardExpiry" 
                      placeholder="MM/YY"
                      data-testid="input-card-expiry"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-medium">Dati Fatturazione</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="billingName">Nome/Ragione Sociale</Label>
                    <Input 
                      id="billingName" 
                      placeholder="Stratikey S.r.l."
                      data-testid="input-billing-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="vatNumber">Partita IVA</Label>
                    <Input 
                      id="vatNumber" 
                      placeholder="IT12345678901"
                      data-testid="input-vat-number"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="billingAddress">Indirizzo</Label>
                    <Textarea 
                      id="billingAddress" 
                      placeholder="Via Roma 1, 20121 Milano (MI), Italia"
                      data-testid="textarea-billing-address"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Switch id="autoRenewal" data-testid="switch-auto-renewal" defaultChecked />
                  <Label htmlFor="autoRenewal">Rinnovo Automatico</Label>
                </div>
                <p className="text-xs text-muted-foreground">
                  Il piano si rinnoverà automaticamente alla scadenza
                </p>
              </div>

              <Button 
                onClick={() => handleSave("Fatturazione")}
                data-testid="save-billing"
                className="flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Salva Fatturazione
              </Button>
            </CardContent>
          </Card>
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