import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Target, Lightbulb, Users, DollarSign, Megaphone } from "lucide-react";

export default function Goals() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const currentOrg = user?.organizations?.[0];
  
  const [goalForm, setGoalForm] = useState({
    sector: "",
    annualObjectives: "",
    targetClients: "",
    marketingBudget: "",
    preferredChannels: [] as string[],
    additionalNotes: ""
  });

  const availableChannels = [
    "Social Media (Facebook, Instagram, LinkedIn)",
    "Google Ads",
    "Email Marketing",
    "Content Marketing",
    "SEO/SEM",
    "Influencer Marketing",
    "Events & Webinar",
    "PR & Media Relations",
    "Direct Mail",
    "Partnerships"
  ];

  const sectors = [
    "Tecnologia e Software",
    "E-commerce",
    "Servizi Professionali",
    "Manifatturiero",
    "Retail",
    "Sanità",
    "Fintech",
    "Immobiliare",
    "Food & Beverage",
    "Automotive",
    "Turismo e Hospitality",
    "Altro"
  ];

  // Check existing goals
  const { 
    data: existingGoals, 
    isLoading: goalsLoading 
  } = useQuery({
    queryKey: ["/api/organizations", currentOrg?.id, "goals"],
    enabled: !!currentOrg?.id && isAuthenticated,
    retry: false,
  });

  // Create goals mutation
  const createGoalsMutation = useMutation({
    mutationFn: async (goalsData: any) => {
      return await apiRequest("/api/goals", "POST", goalsData);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/organizations", currentOrg?.id, "goals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/organizations", currentOrg?.id, "tasks"] });
      
      toast({
        title: "Obiettivi salvati!",
        description: `Obiettivi aziendali definiti con successo. ${(data as any)?.generatedTasks || 0} task iniziali creati automaticamente.`,
      });
      
      // Reset form
      setGoalForm({
        sector: "",
        annualObjectives: "",
        targetClients: "",
        marketingBudget: "",
        preferredChannels: [],
        additionalNotes: ""
      });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error?.message || "Errore durante il salvataggio degli obiettivi",
        variant: "destructive",
      });
    },
  });

  const handleChannelChange = (channel: string, checked: boolean) => {
    setGoalForm(prev => ({
      ...prev,
      preferredChannels: checked 
        ? [...prev.preferredChannels, channel]
        : prev.preferredChannels.filter(c => c !== channel)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!goalForm.annualObjectives.trim()) {
      toast({
        title: "Campo obbligatorio",
        description: "Gli obiettivi annuali sono obbligatori.",
        variant: "destructive",
      });
      return;
    }

    const goalsData = {
      ...goalForm,
      marketingBudget: goalForm.marketingBudget ? parseFloat(goalForm.marketingBudget) : null,
      organizationId: currentOrg?.id
    };

    createGoalsMutation.mutate(goalsData);
  };

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Accesso richiesto",
        description: "Effettua il login per definire gli obiettivi aziendali",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, authLoading, toast]);

  if (authLoading || goalsLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading"/>
      </div>
    );
  }

  // Show existing goals if they exist
  if (existingGoals && Array.isArray(existingGoals) && existingGoals.length > 0) {
    const goal = existingGoals[0];
    return (
      <MainLayout title="Obiettivi Aziendali" icon={Target}>
        <div data-testid="goals-content">
          <Card className="max-w-4xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="w-6 h-6 text-primary" />
                <span>Obiettivi Aziendali Definiti</span>
              </CardTitle>
              <p className="text-muted-foreground">
                I tuoi obiettivi sono stati salvati. I task iniziali sono stati generati automaticamente.
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-2">Settore</h3>
                  <p className="text-muted-foreground">{goal.sector || "Non specificato"}</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Budget Marketing</h3>
                  <p className="text-muted-foreground">
                    {goal.marketingBudget ? `€${goal.marketingBudget.toLocaleString()}` : "Non specificato"}
                  </p>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Obiettivi Annuali</h3>
                <p className="text-muted-foreground whitespace-pre-wrap">{goal.annualObjectives}</p>
              </div>
              
              {goal.targetClients && (
                <div>
                  <h3 className="font-semibold mb-2">Target Clienti</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap">{goal.targetClients}</p>
                </div>
              )}
              
              {goal.preferredChannels && goal.preferredChannels.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Canali Preferiti</h3>
                  <div className="flex flex-wrap gap-2">
                    {goal.preferredChannels.map((channel: string) => (
                      <span key={channel} className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                        {channel}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {goal.additionalNotes && (
                <div>
                  <h3 className="font-semibold mb-2">Note Aggiuntive</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap">{goal.additionalNotes}</p>
                </div>
              )}
              
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Obiettivi definiti il {new Date(goal.createdAt).toLocaleDateString('it-IT')}
                </p>
              </div>
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
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Settore */}
              <div className="space-y-2">
                <Label htmlFor="sector" className="flex items-center space-x-2">
                  <Lightbulb className="w-4 h-4" />
                  <span>Settore di attività</span>
                </Label>
                <Select value={goalForm.sector} onValueChange={(value) => setGoalForm(prev => ({ ...prev, sector: value }))}>
                  <SelectTrigger data-testid="sector-select">
                    <SelectValue placeholder="Seleziona il tuo settore" />
                  </SelectTrigger>
                  <SelectContent>
                    {sectors.map(sector => (
                      <SelectItem key={sector} value={sector}>
                        {sector}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Obiettivi Annuali */}
              <div className="space-y-2">
                <Label htmlFor="annual-objectives" className="flex items-center space-x-2">
                  <Target className="w-4 h-4" />
                  <span>Obiettivi annuali *</span>
                </Label>
                <Textarea
                  id="annual-objectives"
                  placeholder="Descrivi i principali obiettivi che vuoi raggiungere quest'anno (es: aumentare fatturato del 30%, acquisire 100 nuovi clienti, espandere in nuovi mercati...)"
                  value={goalForm.annualObjectives}
                  onChange={(e) => setGoalForm(prev => ({ ...prev, annualObjectives: e.target.value }))}
                  data-testid="annual-objectives-input"
                  rows={4}
                  required
                />
              </div>

              {/* Target Clienti */}
              <div className="space-y-2">
                <Label htmlFor="target-clients" className="flex items-center space-x-2">
                  <Users className="w-4 h-4" />
                  <span>Target clienti</span>
                </Label>
                <Textarea
                  id="target-clients"
                  placeholder="Descrivi il tuo cliente ideale (dimensione azienda, settore, budget, geografia, pain points...)"
                  value={goalForm.targetClients}
                  onChange={(e) => setGoalForm(prev => ({ ...prev, targetClients: e.target.value }))}
                  data-testid="target-clients-input"
                  rows={3}
                />
              </div>

              {/* Budget Marketing */}
              <div className="space-y-2">
                <Label htmlFor="marketing-budget" className="flex items-center space-x-2">
                  <DollarSign className="w-4 h-4" />
                  <span>Budget marketing annuale (€)</span>
                </Label>
                <Input
                  id="marketing-budget"
                  type="number"
                  placeholder="50000"
                  value={goalForm.marketingBudget}
                  onChange={(e) => setGoalForm(prev => ({ ...prev, marketingBudget: e.target.value }))}
                  data-testid="marketing-budget-input"
                  min="0"
                  step="100"
                />
              </div>

              {/* Canali Preferiti */}
              <div className="space-y-4">
                <Label className="flex items-center space-x-2">
                  <Megaphone className="w-4 h-4" />
                  <span>Canali marketing preferiti</span>
                </Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {availableChannels.map(channel => (
                    <div key={channel} className="flex items-center space-x-2">
                      <Checkbox
                        id={`channel-${channel}`}
                        checked={goalForm.preferredChannels.includes(channel)}
                        onCheckedChange={(checked) => handleChannelChange(channel, checked as boolean)}
                        data-testid={`channel-${channel.toLowerCase().replace(/\s+/g, '-')}`}
                      />
                      <label htmlFor={`channel-${channel}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        {channel}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Note Aggiuntive */}
              <div className="space-y-2">
                <Label htmlFor="additional-notes">Note aggiuntive</Label>
                <Textarea
                  id="additional-notes"
                  placeholder="Aggiungi qualsiasi informazione utile per personalizzare i task iniziali..."
                  value={goalForm.additionalNotes}
                  onChange={(e) => setGoalForm(prev => ({ ...prev, additionalNotes: e.target.value }))}
                  data-testid="additional-notes-input"
                  rows={3}
                />
              </div>

              <div className="flex justify-end">
                <Button 
                  type="submit" 
                  disabled={createGoalsMutation.isPending}
                  data-testid="save-goals-button"
                  size="lg"
                  className="px-8"
                >
                  {createGoalsMutation.isPending ? "Salvando..." : "Salva Obiettivi e Genera Task"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}