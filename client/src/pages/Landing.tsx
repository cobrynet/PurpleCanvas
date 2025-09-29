import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Users, Target, BarChart3, Mail, UserPlus } from "lucide-react";
import { useLocation } from "wouter";

export default function Landing() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10" data-testid="landing-page">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center">
              <Building2 className="w-8 h-8 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent" data-testid="hero-title">
            Stratikey
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto" data-testid="hero-description">
            Piattaforma multi-tenant B2B per gestire marketing e commerciale in modo autonomo, 
            con marketplace di servizi integrato.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              size="lg" 
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 rounded-xl"
              onClick={() => setLocation("/sign-up")}
              data-testid="signup-button"
            >
              <UserPlus className="w-5 h-5 mr-2" />
              Registrati Gratis
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="px-8 py-3 rounded-xl border-2"
              onClick={() => setLocation("/sign-in")}
              data-testid="signin-button"
            >
              <Mail className="w-5 h-5 mr-2" />
              Accedi
            </Button>
          </div>
          <div className="mt-4">
            <Button 
              variant="ghost" 
              className="text-muted-foreground hover:text-foreground"
              onClick={() => window.location.href = "/api/login"}
              data-testid="oauth-login-button"
            >
              <Building2 className="w-4 h-4 mr-2" />
              Continua con Replit
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <Card className="border-2 hover:border-primary/50 transition-colors" data-testid="feature-marketing">
            <CardHeader className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Target className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Marketing</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-muted-foreground">
                Gestisci campagne, audience e analytics in un'unica piattaforma integrata.
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-secondary/50 transition-colors" data-testid="feature-crm">
            <CardHeader className="text-center">
              <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-secondary" />
              </div>
              <CardTitle>CRM</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-muted-foreground">
                Pipeline completa per lead, opportunità e gestione del processo commerciale.
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-accent/50 transition-colors" data-testid="feature-tasks">
            <CardHeader className="text-center">
              <div className="w-12 h-12 bg-accent/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-6 h-6 text-accent-foreground" />
              </div>
              <CardTitle>Task Manager</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-muted-foreground">
                Organizza attività con viste multiple: Lista, Kanban, Calendario e Timeline.
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-primary/50 transition-colors" data-testid="feature-marketplace">
            <CardHeader className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Building2 className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Marketplace</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-muted-foreground">
                Accedi a servizi specializzati: brand identity, stampa, video e foto.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Benefits Section */}
        <Card className="max-w-4xl mx-auto" data-testid="benefits-section">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Perché scegliere Stratikey?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold mb-3 text-primary">Multi-tenant B2B</h3>
                <p className="text-muted-foreground mb-6">
                  Ogni azienda ha il proprio spazio isolato e sicuro, con controllo granulare 
                  degli accessi e dei permessi.
                </p>
                <h3 className="text-lg font-semibold mb-3 text-secondary">Ruoli e Permessi</h3>
                <p className="text-muted-foreground">
                  Sistema RBAC completo con ruoli specifici: Org Admin, Marketing Manager, 
                  Sales Rep e Viewer.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-3 text-accent-foreground">Integrazione Completa</h3>
                <p className="text-muted-foreground mb-6">
                  Connettiti con Google, Meta, LinkedIn e altri servizi per una gestione 
                  unificata delle tue attività.
                </p>
                <h3 className="text-lg font-semibold mb-3 text-primary">Analytics Avanzate</h3>
                <p className="text-muted-foreground">
                  Dashboard comprehensive con metriche in tempo reale per marketing e vendite.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA Section */}
        <div className="text-center mt-16">
          <h2 className="text-2xl font-bold mb-4">Pronto per iniziare?</h2>
          <p className="text-muted-foreground mb-8">
            Accedi subito e inizia a gestire marketing e vendite in modo più efficace.
          </p>
          <Button 
            size="lg" 
            variant="outline"
            className="border-primary text-primary hover:bg-primary hover:text-primary-foreground px-8 py-3 rounded-xl"
            onClick={() => window.location.href = "/api/login"}
            data-testid="cta-login-button"
          >
            Entra in Stratikey
          </Button>
        </div>
      </div>
    </div>
  );
}
