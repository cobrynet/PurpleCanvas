import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Facebook, Linkedin, AlertCircle, CheckCircle2, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import type { SocialConnection } from "@shared/schema";

const socialProviders = [
  {
    id: 'meta',
    name: 'Meta (Facebook & Instagram)',
    description: 'Collega le tue pagine Facebook e account Instagram Business per pubblicare contenuti',
    icon: Facebook,
    color: 'bg-blue-600 hover:bg-blue-700',
    textColor: 'text-blue-600',
    scopes: ['Gestione pagine', 'Pubblicazione contenuti', 'Analytics']
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    description: 'Collega il tuo profilo LinkedIn e pagine aziendali',
    icon: Linkedin,
    color: 'bg-blue-800 hover:bg-blue-900',
    textColor: 'text-blue-800',
    scopes: ['Pubblicazione contenuti', 'Gestione pagine aziendali']
  }
];

export default function SocialConnections() {
  const { toast } = useToast();
  const [location] = useLocation();
  const [isConnecting, setIsConnecting] = useState<string | null>(null);

  // Fetch existing connections
  const { data: connections = [], isLoading, refetch } = useQuery<SocialConnection[]>({
    queryKey: ['/api/social/connections'],
  });

  // Connect to social provider - MUST be before any conditional returns
  const connectMutation = useMutation({
    mutationFn: async (provider: string) => {
      const response = await apiRequest('GET', `/api/social/oauth/${provider}/auth`);
      return response.json();
    },
    onSuccess: (data) => {
      // Redirect to OAuth URL
      window.location.href = data.authUrl;
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Impossibile avviare la connessione",
        variant: "destructive",
      });
      setIsConnecting(null);
    },
  });

  // Delete connection
  const deleteMutation = useMutation({
    mutationFn: async (connectionId: string) => {
      const response = await apiRequest('DELETE', `/api/social/connections/${connectionId}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Connessione rimossa",
        description: "L'account social è stato scollegato con successo.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/social/connections'] });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Impossibile rimuovere la connessione",
        variant: "destructive",
      });
    },
  });

  // Check for OAuth success/error in URL params - MUST be before conditional returns
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('success') === 'true') {
      toast({
        title: "Connessione riuscita!",
        description: "Il tuo account social è stato collegato con successo.",
      });
      // Clean URL
      window.history.replaceState({}, '', '/social-connections');
    } else if (urlParams.get('error') === 'true') {
      toast({
        title: "Errore nella connessione",
        description: "Si è verificato un errore durante il collegamento dell'account.",
        variant: "destructive",
      });
      // Clean URL
      window.history.replaceState({}, '', '/social-connections');
    }
  }, [toast]);

  // Helper functions
  const handleConnect = (providerId: string) => {
    setIsConnecting(providerId);
    connectMutation.mutate(providerId);
  };

  const handleDisconnect = (connectionId: string) => {
    if (window.confirm('Sei sicuro di voler scollegare questo account? Non potrai più pubblicare automaticamente su questo social.')) {
      deleteMutation.mutate(connectionId);
    }
  };

  const getConnectionsForProvider = (providerId: string) => {
    return connections.filter(conn => conn.provider === providerId);
  };

  const getProviderIcon = (providerId: string) => {
    const provider = socialProviders.find(p => p.id === providerId);
    return provider?.icon || AlertCircle;
  };

  // Conditional rendering - AFTER all hooks
  if (isLoading) {
    return (
      <MainLayout
        title="Collega i tuoi Social"
        description="Connetti i tuoi account social per pubblicare automaticamente i contenuti"
        icon={Facebook}
      >
        <div className="flex items-center justify-center py-12" data-testid="loading-social-connections">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout
      title="Collega i tuoi Social"
      description="Connetti i tuoi account social per pubblicare automaticamente i contenuti"
      icon={Facebook}
    >
      <div className="space-y-6">
        {/* Header Info */}
        <Card data-testid="social-connections-header">
          <CardHeader>
            <CardTitle className="flex items-center gap-2" data-testid="social-connections-title">
              <Facebook className="w-5 h-5" />
              Connessioni Social Media
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4" data-testid="social-connections-description">
              Collega i tuoi account social per pubblicare automaticamente i contenuti direttamente dalle campagne marketing.
              Se un social non è collegato, verranno create task e promemoria per la pubblicazione manuale.
            </p>
            <Alert data-testid="security-info">
              <AlertCircle className="w-4 h-4" />
              <AlertDescription>
                <strong>Privacy & Sicurezza:</strong> Non memorizziamo le tue password. 
                Utilizziamo OAuth sicuro e puoi revocare l'accesso in qualsiasi momento.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Social Providers */}
        <div className="grid gap-6">
          {socialProviders.map((provider) => {
            const providerConnections = getConnectionsForProvider(provider.id);
            const isConnected = providerConnections.length > 0;
            const Icon = provider.icon;

            return (
              <Card key={provider.id} className="border-2" data-testid={`provider-card-${provider.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${provider.color}`} data-testid={`provider-icon-${provider.id}`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <CardTitle className="flex items-center gap-2" data-testid={`provider-name-${provider.id}`}>
                          {provider.name}
                          {isConnected && (
                            <Badge className="bg-green-100 text-green-800 border-green-200" data-testid={`connected-badge-${provider.id}`}>
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Collegato
                            </Badge>
                          )}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1" data-testid={`provider-description-${provider.id}`}>
                          {provider.description}
                        </p>
                      </div>
                    </div>
                    
                    {!isConnected ? (
                      <Button
                        onClick={() => handleConnect(provider.id)}
                        disabled={isConnecting === provider.id || connectMutation.isPending}
                        className={provider.color}
                        data-testid={`connect-${provider.id}`}
                      >
                        {isConnecting === provider.id ? 'Connessione...' : 'Connetti'}
                      </Button>
                    ) : (
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleConnect(provider.id)}
                          variant="outline"
                          size="sm"
                          disabled={isConnecting === provider.id || connectMutation.isPending}
                          data-testid={`reconnect-${provider.id}`}
                        >
                          {isConnecting === provider.id ? 'Connessione...' : 'Ricollega'}
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>

                <CardContent>
                  {/* Scopes */}
                  <div className="mb-4" data-testid={`provider-scopes-${provider.id}`}>
                    <p className="text-sm font-medium mb-2">Permessi richiesti:</p>
                    <div className="flex flex-wrap gap-1">
                      {provider.scopes.map((scope) => (
                        <Badge key={scope} variant="outline" className="text-xs" data-testid={`scope-${provider.id}-${scope.toLowerCase().replace(/\s+/g, '-')}`}>
                          {scope}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Connected Accounts */}
                  {isConnected && (
                    <div data-testid={`connected-accounts-${provider.id}`}>
                      <Separator className="my-4" />
                      <div>
                        <p className="text-sm font-medium mb-3" data-testid={`connected-accounts-label-${provider.id}`}>Account collegati:</p>
                        <div className="space-y-2">
                          {providerConnections.map((connection) => {
                            const ConnectionIcon = getProviderIcon(connection.provider);
                            return (
                              <div
                                key={connection.id}
                                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                                data-testid={`connected-account-${connection.id}`}
                              >
                                <div className="flex items-center gap-3">
                                  <ConnectionIcon className={`w-4 h-4 ${provider.textColor}`} />
                                  <div>
                                    <p className="font-medium" data-testid={`account-name-${connection.id}`}>{connection.displayName}</p>
                                    <p className="text-xs text-muted-foreground" data-testid={`account-status-${connection.id}`}>
                                      {connection.accountType} • Stato: {connection.status}
                                    </p>
                                  </div>
                                </div>
                                <Button
                                  onClick={() => handleDisconnect(connection.id)}
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  disabled={deleteMutation.isPending}
                                  data-testid={`disconnect-${connection.id}`}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Instructions */}
        <Card data-testid="instructions-card">
          <CardHeader>
            <CardTitle data-testid="instructions-title">Come funziona</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4" data-testid="instructions-grid">
              <div data-testid="instruction-step-1">
                <h4 className="font-medium mb-2">1. Collega i tuoi account</h4>
                <p className="text-sm text-muted-foreground">
                  Clicca su "Connetti" per autorizzare Stratikey ad accedere ai tuoi account social tramite OAuth sicuro.
                </p>
              </div>
              <div data-testid="instruction-step-2">
                <h4 className="font-medium mb-2">2. Pubblicazione automatica</h4>
                <p className="text-sm text-muted-foreground">
                  I contenuti delle campagne verranno pubblicati automaticamente sui social collegati.
                </p>
              </div>
              <div data-testid="instruction-step-3">
                <h4 className="font-medium mb-2">3. Fallback intelligente</h4>
                <p className="text-sm text-muted-foreground">
                  Se un social non è collegato, riceverai task e promemoria per la pubblicazione manuale.
                </p>
              </div>
              <div data-testid="instruction-step-4">
                <h4 className="font-medium mb-2">4. Controllo completo</h4>
                <p className="text-sm text-muted-foreground">
                  Puoi revocare l'accesso in qualsiasi momento e gestire le connessioni da questa pagina.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}