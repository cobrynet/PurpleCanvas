import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Megaphone, Plus } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function Marketing() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const currentOrg = user?.organizations?.[0];
  const currentMembership = currentOrg?.membership;

  // Check if user has marketing access
  const hasMarketingAccess = currentMembership && 
    ['ORG_ADMIN', 'MARKETER'].includes(currentMembership.role);

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

  // Fetch campaigns
  const { 
    data: campaigns = [], 
    isLoading: campaignsLoading,
    error: campaignsError 
  } = useQuery({
    queryKey: ["/api/organizations", currentOrg?.id, "campaigns"],
    enabled: !!currentOrg?.id && isAuthenticated && hasMarketingAccess,
    retry: false,
  });

  // Handle errors
  useEffect(() => {
    if (campaignsError && isUnauthorizedError(campaignsError as Error)) {
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
  }, [campaignsError, toast]);

  if (authLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading"/>
      </div>
    );
  }

  if (!hasMarketingAccess) {
    return (
      <MainLayout title="Marketing" icon={Megaphone}>
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            Non hai i permessi per accedere alla sezione Marketing.
          </p>
        </div>
      </MainLayout>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800';
      case 'DRAFT': return 'bg-gray-100 text-gray-800';
      case 'PAUSED': return 'bg-yellow-100 text-yellow-800';
      case 'COMPLETED': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'ADV': return 'bg-purple-100 text-purple-800';
      case 'ORGANICO': return 'bg-green-100 text-green-800';
      case 'MIXED': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <MainLayout title="Marketing" icon={Megaphone}>
      <div data-testid="marketing-content">
        {/* Header with New Campaign Button */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold">Gestione Campagne</h2>
            <p className="text-muted-foreground">
              Crea e gestisci le tue campagne marketing
            </p>
          </div>
          <Button className="flex items-center space-x-2" data-testid="new-campaign-button">
            <Plus className="w-4 h-4" />
            <span>Nuova Campagna</span>
          </Button>
        </div>

        {/* Campaigns Grid */}
        {campaignsLoading ? (
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
        ) : campaigns.length === 0 ? (
          <Card data-testid="no-campaigns">
            <CardContent className="text-center py-12">
              <Megaphone className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nessuna campagna</h3>
              <p className="text-muted-foreground mb-6">
                Inizia creando la tua prima campagna marketing
              </p>
              <Button className="flex items-center space-x-2 mx-auto" data-testid="create-first-campaign">
                <Plus className="w-4 h-4" />
                <span>Crea Prima Campagna</span>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="campaigns-grid">
            {campaigns.map((campaign: any) => (
              <Card key={campaign.id} className="hover:shadow-md transition-shadow" data-testid={`campaign-${campaign.id}`}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg" data-testid={`campaign-name-${campaign.id}`}>
                      {campaign.name}
                    </CardTitle>
                    <Badge 
                      className={getStatusColor(campaign.status)}
                      data-testid={`campaign-status-${campaign.id}`}
                    >
                      {campaign.status}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge 
                      variant="outline" 
                      className={getTypeColor(campaign.type)}
                      data-testid={`campaign-type-${campaign.id}`}
                    >
                      {campaign.type}
                    </Badge>
                    {campaign.priority && (
                      <Badge variant="outline" data-testid={`campaign-priority-${campaign.id}`}>
                        {campaign.priority}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {campaign.objective && (
                    <p className="text-sm text-muted-foreground mb-4" data-testid={`campaign-objective-${campaign.id}`}>
                      {campaign.objective}
                    </p>
                  )}
                  <div className="space-y-2 text-sm">
                    {campaign.budget && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Budget:</span>
                        <span data-testid={`campaign-budget-${campaign.id}`}>
                          €{campaign.budget.toLocaleString()}
                        </span>
                      </div>
                    )}
                    {campaign.startAt && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Inizio:</span>
                        <span data-testid={`campaign-start-${campaign.id}`}>
                          {new Date(campaign.startAt).toLocaleDateString('it-IT')}
                        </span>
                      </div>
                    )}
                    {campaign.endAt && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Fine:</span>
                        <span data-testid={`campaign-end-${campaign.id}`}>
                          {new Date(campaign.endAt).toLocaleDateString('it-IT')}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Creata:</span>
                      <span data-testid={`campaign-created-${campaign.id}`}>
                        {new Date(campaign.createdAt).toLocaleDateString('it-IT')}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
