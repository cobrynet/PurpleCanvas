import { useEffect } from "react";
import { useLocation } from "wouter";
import { Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useOrganization } from "@/hooks/useOrganization";

export default function OrganizationSelectorPage() {
  const { availableOrganizations, selectOrganization, selectedOrganization } = useOrganization();
  const [, setLocation] = useLocation();

  // Redirect to dashboard if organization is selected
  useEffect(() => {
    if (selectedOrganization) {
      setLocation("/");
    }
  }, [selectedOrganization, setLocation]);

  const handleSelectOrganization = (organizationId: string) => {
    selectOrganization(organizationId);
    // Navigation handled by useEffect above
  };

  if (availableOrganizations.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-8 h-8 text-primary-foreground" />
            </div>
            <CardTitle className="text-2xl">Nessuna Organizzazione</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-6">
              Non appartieni a nessuna organizzazione. Contatta l'amministratore per essere aggiunto a un'organizzazione.
            </p>
            <Button 
              variant="outline" 
              onClick={() => window.location.href = "/api/logout"}
              data-testid="logout-button"
            >
              Logout
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl">Seleziona Organizzazione</CardTitle>
          <p className="text-muted-foreground">
            Scegli l'organizzazione con cui vuoi lavorare
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {availableOrganizations.map((org) => (
            <Card 
              key={org.id} 
              className="cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => handleSelectOrganization(org.id)}
              data-testid={`select-org-${org.id}`}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-2">{org.name}</h3>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">
                        {org.membership.role}
                      </Badge>
                      {org.plan && (
                        <Badge variant="outline">
                          {org.plan}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Button>
                    Seleziona
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}