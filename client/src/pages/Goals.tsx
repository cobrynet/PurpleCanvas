import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useOrganization } from "@/hooks/useOrganization";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { MainLayout } from "@/components/layout/MainLayout";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Target, Users, DollarSign, Megaphone } from "lucide-react";

export default function Goals() {
  const { user, isAuthenticated } = useAuth();
  const { selectedOrganization } = useOrganization();
  const { toast } = useToast();
  
  const currentOrg = selectedOrganization;
  
  const [form, setForm] = useState({
    objectives: "",
    periodicity: "",
    totalBudget: "",
    salesPipeline: "",
    fairs: "",
    digitalChannels: "",
    adInvestments: "",
    geoArea: ""
  });

  // Check existing goals
  const { data: existingGoals, isLoading: goalsLoading } = useQuery({
    queryKey: ["/api/goals"],
    enabled: !!currentOrg?.id && isAuthenticated,
    retry: false,
  });

  // Create goals mutation
  const createGoalsMutation = useMutation({
    mutationFn: async (goalsData: any) => {
      return await apiRequest("/api/goals", "POST", goalsData);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      
      toast({
        title: "Obiettivi salvati!",
        description: `Obiettivi aziendali definiti con successo. ${(data as any)?.generatedTasks || 0} task iniziali creati automaticamente.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error?.message || "Impossibile salvare gli obiettivi. Riprova.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentOrg?.id) {
      toast({
        title: "Errore",
        description: "Nessuna organizzazione selezionata",
        variant: "destructive",
      });
      return;
    }

    const goalsData = {
      organizationId: currentOrg.id,
      objectives: form.objectives,
      periodicity: form.periodicity,
      totalBudget: parseFloat(form.totalBudget) || 0,
      salesPipeline: form.salesPipeline || null,
      fairs: form.fairs || null,
      digitalChannels: form.digitalChannels || null,
      adInvestments: form.adInvestments || null,
      geoArea: form.geoArea || null,
    };

    createGoalsMutation.mutate(goalsData);
  };

  if (goalsLoading) {
    return (
      <MainLayout title="Obiettivi Aziendali" icon={Target}>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Caricamento...</p>
        </div>
      </MainLayout>
    );
  }

  const goal = Array.isArray(existingGoals) ? existingGoals[0] : null;

  if (goal) {
    return (
      <MainLayout title="Obiettivi Aziendali" icon={Target}>
        <div data-testid="goals-display">
          <Card className="max-w-4xl mx-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <Target className="w-6 h-6 text-primary" />
                  <span>Obiettivi Aziendali Definiti</span>
                </CardTitle>
                <Badge className="bg-green-500">Attivi</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2">Obiettivi</h3>
                <p className="text-muted-foreground whitespace-pre-wrap">{goal.objectives}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-2">Periodicità</h3>
                  <p className="text-muted-foreground">{goal.periodicity}</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Budget Totale</h3>
                  <p className="text-muted-foreground">€ {goal.totalBudget?.toLocaleString()}</p>
                </div>
              </div>
              
              {goal.salesPipeline && (
                <div>
                  <h3 className="font-semibold mb-2">Pipeline Vendite</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap">{goal.salesPipeline}</p>
                </div>
              )}
              
              {goal.fairs && (
                <div>
                  <h3 className="font-semibold mb-2">Fiere e Eventi</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap">{goal.fairs}</p>
                </div>
              )}
              
              {goal.digitalChannels && (
                <div>
                  <h3 className="font-semibold mb-2">Canali Digitali</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap">{goal.digitalChannels}</p>
                </div>
              )}
              
              {goal.adInvestments && (
                <div>
                  <h3 className="font-semibold mb-2">Investimenti Pubblicitari</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap">{goal.adInvestments}</p>
                </div>
              )}
              
              {goal.geoArea && (
                <div>
                  <h3 className="font-semibold mb-2">Area Geografica</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap">{goal.geoArea}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Obiettivi Aziendali" icon={Target}>
      <div data-testid="goals-content">
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="w-6 h-6 text-primary" />
              <span>Definisci i tuoi Obiettivi Aziendali</span>
            </CardTitle>
            <p className="text-muted-foreground">
              Iniziamo definendo i tuoi obiettivi di business. Il sistema genererà automaticamente i primi task per iniziare.
            </p>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Obiettivi */}
              <div className="space-y-2">
                <Label htmlFor="objectives">
                  <Target className="inline w-4 h-4 mr-2" />
                  Obiettivi aziendali *
                </Label>
                <Textarea
                  id="objectives"
                  placeholder="Descrivi i principali obiettivi (es: aumentare fatturato del 30%, acquisire 100 nuovi clienti...)"
                  value={form.objectives}
                  onChange={(e) => setForm(prev => ({ ...prev, objectives: e.target.value }))}
                  data-testid="objectives-input"
                  rows={4}
                  required
                />
              </div>

              {/* Periodicità */}
              <div className="space-y-2">
                <Label htmlFor="periodicity">Periodicità *</Label>
                <Select 
                  value={form.periodicity} 
                  onValueChange={(value) => setForm(prev => ({ ...prev, periodicity: value }))}
                >
                  <SelectTrigger data-testid="periodicity-select">
                    <SelectValue placeholder="Seleziona la periodicità" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ANNUALE">Annuale</SelectItem>
                    <SelectItem value="SEMESTRALE">Semestrale</SelectItem>
                    <SelectItem value="QUADRIMESTRALE">Quadrimestrale</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Budget Totale */}
              <div className="space-y-2">
                <Label htmlFor="total-budget">
                  <DollarSign className="inline w-4 h-4 mr-2" />
                  Budget totale (€) *
                </Label>
                <Input
                  id="total-budget"
                  type="number"
                  placeholder="50000"
                  value={form.totalBudget}
                  onChange={(e) => setForm(prev => ({ ...prev, totalBudget: e.target.value }))}
                  data-testid="total-budget-input"
                  min="0"
                  step="100"
                  required
                />
              </div>

              {/* Pipeline Vendite */}
              <div className="space-y-2">
                <Label htmlFor="sales-pipeline">
                  <Users className="inline w-4 h-4 mr-2" />
                  Pipeline vendite
                </Label>
                <Textarea
                  id="sales-pipeline"
                  placeholder="Descrivi la tua pipeline vendite, processi di acquisizione clienti..."
                  value={form.salesPipeline}
                  onChange={(e) => setForm(prev => ({ ...prev, salesPipeline: e.target.value }))}
                  data-testid="sales-pipeline-input"
                  rows={3}
                />
              </div>

              {/* Fiere */}
              <div className="space-y-2">
                <Label htmlFor="fairs">
                  <Megaphone className="inline w-4 h-4 mr-2" />
                  Fiere e eventi
                </Label>
                <Textarea
                  id="fairs"
                  placeholder="Descrivi le fiere, eventi, conferenze a cui partecipi..."
                  value={form.fairs}
                  onChange={(e) => setForm(prev => ({ ...prev, fairs: e.target.value }))}
                  data-testid="fairs-input"
                  rows={3}
                />
              </div>

              {/* Canali Digitali */}
              <div className="space-y-2">
                <Label htmlFor="digital-channels">Canali digitali</Label>
                <Textarea
                  id="digital-channels"
                  placeholder="Descrivi i canali digitali che utilizzi (social media, email, sito web...)"
                  value={form.digitalChannels}
                  onChange={(e) => setForm(prev => ({ ...prev, digitalChannels: e.target.value }))}
                  data-testid="digital-channels-input"
                  rows={3}
                />
              </div>

              {/* Investimenti Pubblicitari */}
              <div className="space-y-2">
                <Label htmlFor="ad-investments">Investimenti pubblicitari</Label>
                <Textarea
                  id="ad-investments"
                  placeholder="Descrivi gli investimenti pubblicitari (Google Ads, Facebook Ads...)"
                  value={form.adInvestments}
                  onChange={(e) => setForm(prev => ({ ...prev, adInvestments: e.target.value }))}
                  data-testid="ad-investments-input"
                  rows={3}
                />
              </div>

              {/* Area Geografica */}
              <div className="space-y-2">
                <Label htmlFor="geo-area">Area geografica</Label>
                <Textarea
                  id="geo-area"
                  placeholder="Descrivi le aree geografiche target (locale, nazionale, internazionale...)"
                  value={form.geoArea}
                  onChange={(e) => setForm(prev => ({ ...prev, geoArea: e.target.value }))}
                  data-testid="geo-area-input"
                  rows={3}
                />
              </div>

              {/* Submit Button */}
              <div className="flex justify-end pt-4">
                <Button 
                  type="submit" 
                  disabled={createGoalsMutation.isPending}
                  data-testid="submit-goals-button"
                >
                  {createGoalsMutation.isPending ? "Salvataggio..." : "Salva Obiettivi"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
