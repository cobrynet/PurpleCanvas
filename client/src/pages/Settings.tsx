import { Settings, User, Bell, Shield, Palette, Database, Globe, CreditCard } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { MainLayout } from "@/components/layout/MainLayout";

export default function SettingsPage() {
  return (
    <MainLayout title="Impostazioni" icon={Settings}>
      <div data-testid="settings-content">
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4" data-testid="settings-tabs">
            <TabsTrigger value="profile" data-testid="tab-profile">
              <User className="w-4 h-4 mr-2" />
              Profilo
            </TabsTrigger>
            <TabsTrigger value="notifications" data-testid="tab-notifications">
              <Bell className="w-4 h-4 mr-2" />
              Notifiche
            </TabsTrigger>
            <TabsTrigger value="security" data-testid="tab-security">
              <Shield className="w-4 h-4 mr-2" />
              Sicurezza
            </TabsTrigger>
            <TabsTrigger value="preferences" data-testid="tab-preferences">
              <Palette className="w-4 h-4 mr-2" />
              Preferenze
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <Card data-testid="profile-settings">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="w-5 h-5" />
                  <span>Informazioni Profilo</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="first-name">Nome</Label>
                    <Input 
                      id="first-name" 
                      placeholder="Mario" 
                      data-testid="input-first-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last-name">Cognome</Label>
                    <Input 
                      id="last-name" 
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
                <Button className="bg-purple-600 hover:bg-purple-700" data-testid="save-profile">
                  Salva Modifiche
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <Card data-testid="notification-settings">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Bell className="w-5 h-5" />
                  <span>Preferenze Notifiche</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {[
                  { id: "email-campaigns", label: "Notifiche Campagne", description: "Ricevi aggiornamenti sulle tue campagne marketing" },
                  { id: "email-tasks", label: "Notifiche Attività", description: "Ricevi promemoria per le scadenze dei task" },
                  { id: "email-leads", label: "Nuovi Lead", description: "Notifica quando arriva un nuovo lead" },
                  { id: "browser-notifications", label: "Notifiche Browser", description: "Ricevi notifiche push nel browser" },
                  { id: "sms-alerts", label: "SMS di Emergenza", description: "Ricevi SMS per eventi critici" }
                ].map((setting) => (
                  <div key={setting.id} className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor={setting.id} className="text-base font-medium">
                        {setting.label}
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        {setting.description}
                      </p>
                    </div>
                    <Switch id={setting.id} data-testid={`switch-${setting.id}`} />
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <Card data-testid="security-settings">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="w-5 h-5" />
                  <span>Sicurezza Account</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Autenticazione a Due Fattori</p>
                      <p className="text-sm text-muted-foreground">
                        Aggiungi un layer extra di sicurezza al tuo account
                      </p>
                    </div>
                    <Button variant="outline" data-testid="setup-2fa">
                      Configura
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Sessioni Attive</p>
                      <p className="text-sm text-muted-foreground">
                        Gestisci i dispositivi connessi al tuo account
                      </p>
                    </div>
                    <Button variant="outline" data-testid="manage-sessions">
                      Gestisci
                    </Button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Cambia Password</p>
                      <p className="text-sm text-muted-foreground">
                        Aggiorna la tua password per mantenere l'account sicuro
                      </p>
                    </div>
                    <Button variant="outline" data-testid="change-password">
                      Cambia
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preferences" className="space-y-6">
            <Card data-testid="preference-settings">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Palette className="w-5 h-5" />
                  <span>Preferenze Applicazione</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="theme">Tema</Label>
                    <Select data-testid="select-theme">
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona tema" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Chiaro</SelectItem>
                        <SelectItem value="dark">Scuro</SelectItem>
                        <SelectItem value="system">Sistema</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
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

                  <div className="space-y-2">
                    <Label htmlFor="currency">Valuta</Label>
                    <Select data-testid="select-currency">
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona valuta" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="eur">EUR (€)</SelectItem>
                        <SelectItem value="usd">USD ($)</SelectItem>
                        <SelectItem value="gbp">GBP (£)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button className="bg-purple-600 hover:bg-purple-700" data-testid="save-preferences">
                  Salva Preferenze
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}