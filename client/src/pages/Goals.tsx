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
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Target, Users, DollarSign, Megaphone, Trash2 } from "lucide-react";

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
    geoArea: "",
    sector: "",
    preferredChannels: [] as string[]
  });

  const [allocations, setAllocations] = useState<Array<{ category: string; amount: string; notes: string }>>([]);

  // Check existing goals
  const { data: existingGoals, isLoading: goalsLoading } = useQuery({
    queryKey: ["/api/goals"],
    enabled: !!currentOrg?.id && isAuthenticated,
    retry: false,
  });

  // Delete goal mutation
  const deleteGoalMutation = useMutation({
    mutationFn: async (goalId: string) => {
      return await apiRequest("DELETE", `/api/goals/${goalId}`, null);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/goals/active"] });
      
      // Reset form state
      setForm({
        objectives: "",
        periodicity: "",
        totalBudget: "",
        salesPipeline: "",
        fairs: "",
        digitalChannels: "",
        adInvestments: "",
        geoArea: "",
        sector: "",
        preferredChannels: []
      });
      setAllocations([]);
      
      toast({
        title: "Obiettivo cancellato",
        description: "Ora puoi crearne uno nuovo.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error?.message || "Impossibile cancellare l'obiettivo.",
        variant: "destructive",
      });
    },
  });

  // Create goals mutation
  const createGoalsMutation = useMutation({
    mutationFn: async (goalsData: any) => {
      const response = await apiRequest("POST", "/api/goals", goalsData);
      return await response.json();
    },
    onSuccess: async (data) => {
      console.log("✅ Goal created successfully, full response:", JSON.stringify(data, null, 2));
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
      
      toast({
        title: "Obiettivi salvati!",
        description: "Generazione automatica delle attività in corso...",
      });

      // Automatic task generation
      const goalId = (data as any)?.goalId;
      console.log("🎯 Extracted goalId from response:", goalId);
      console.log("🎯 Response data type:", typeof data, "keys:", Object.keys(data || {}));
      
      if (goalId) {
        try {
          console.log("🚀 Starting task generation for goalId:", goalId);
          const response = await apiRequest("POST", `/api/goals/${goalId}/generate-tasks`, {});
          const result = await response.json();
          console.log("✅ Task generation completed:", result);
          
          // Invalidate after successful task generation - use correct query key!
          queryClient.invalidateQueries({ queryKey: ["/api/goals/active"] });
          if (currentOrg?.id) {
            queryClient.invalidateQueries({ queryKey: ["/api/organizations", currentOrg.id, "tasks"] });
          }
          
          toast({
            title: "Attività generate!",
            description: "Attività generate con successo. Le trovi in Marketing/Commerciale → Attività",
          });
        } catch (error) {
          console.error("❌ Error generating tasks:", error);
          toast({
            title: "Errore generazione attività",
            description: "Obiettivi salvati ma errore nella generazione automatica delle attività.",
            variant: "destructive",
          });
        }
      } else {
        console.error("❌ No goalId in response!");
        // No goalId in response, show warning
        toast({
          title: "Attenzione",
          description: "Obiettivi salvati ma impossibile generare attività automaticamente.",
          variant: "destructive",
        });
      }
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

    // Validate required fields
    if (!form.objectives || !form.periodicity || !form.totalBudget) {
      toast({
        title: "Campi obbligatori mancanti",
        description: "Compila obiettivi, periodicità e budget totale",
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
      sector: form.sector || null,
      preferredChannels: form.preferredChannels.length > 0 ? form.preferredChannels : null,
      allocations: allocations
        .filter(a => a.category && a.amount)
        .map(a => ({
          category: a.category,
          amount: parseFloat(a.amount) || 0,
          notes: a.notes || null,
        })),
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
                <div className="flex items-center gap-2">
                  <Badge className="bg-green-500">Attivi</Badge>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteGoalMutation.mutate(goal.id)}
                    disabled={deleteGoalMutation.isPending}
                    data-testid="button-delete-goal"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Cancella e ricrea
                  </Button>
                </div>
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

              {goal.sector && (
                <div>
                  <h3 className="font-semibold mb-2">Settore di Attività</h3>
                  <p className="text-muted-foreground">{goal.sector}</p>
                </div>
              )}

              {goal.preferredChannels && goal.preferredChannels.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Canali Preferiti per Marketing</h3>
                  <div className="flex flex-wrap gap-2">
                    {goal.preferredChannels.map((channel: string) => (
                      <Badge key={channel} variant="secondary">{channel}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {goal.allocations && goal.allocations.length > 0 && (
                <div className="pt-4 border-t">
                  <h3 className="font-semibold mb-3">Allocazioni Budget Pubblicitario</h3>
                  <div className="space-y-2">
                    {goal.allocations.map((allocation: any) => (
                      <div key={allocation.id} className="flex justify-between items-center p-3 bg-muted/50 rounded">
                        <div className="flex-1">
                          <span className="font-medium">
                            {allocation.category === 'SOCIAL_ADS' && 'Social Ads'}
                            {allocation.category === 'FIERE' && 'Fiere'}
                            {allocation.category === 'COMMERCIALE' && 'Commerciale'}
                            {allocation.category === 'ALTRO' && 'Altro'}
                          </span>
                          {allocation.notes && (
                            <span className="text-sm text-muted-foreground ml-2">- {allocation.notes}</span>
                          )}
                        </div>
                        <span className="font-semibold">€ {allocation.amount?.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
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

              {/* Settore */}
              <div className="space-y-2">
                <Label htmlFor="sector">Settore di attività</Label>
                <Input
                  id="sector"
                  placeholder="Es: Tecnologia, E-commerce, Servizi, Manifatturiero..."
                  value={form.sector}
                  onChange={(e) => setForm(prev => ({ ...prev, sector: e.target.value }))}
                  data-testid="sector-input"
                />
              </div>

              {/* Canali Preferiti */}
              <div className="space-y-3">
                <Label>Canali preferiti per marketing</Label>
                <div className="space-y-2">
                  {[
                    { value: "Social Media", label: "Social Media (Facebook, Instagram, LinkedIn)" },
                    { value: "Email Marketing", label: "Email Marketing" },
                    { value: "Google Ads", label: "Google Ads" },
                    { value: "SEO", label: "SEO / Posizionamento organico" },
                    { value: "Content Marketing", label: "Content Marketing / Blog" },
                    { value: "Eventi e Fiere", label: "Eventi e Fiere" }
                  ].map((channel) => (
                    <div key={channel.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`channel-${channel.value}`}
                        checked={form.preferredChannels.includes(channel.value)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setForm(prev => ({
                              ...prev,
                              preferredChannels: [...prev.preferredChannels, channel.value]
                            }));
                          } else {
                            setForm(prev => ({
                              ...prev,
                              preferredChannels: prev.preferredChannels.filter(c => c !== channel.value)
                            }));
                          }
                        }}
                        data-testid={`channel-checkbox-${channel.value}`}
                      />
                      <label
                        htmlFor={`channel-${channel.value}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {channel.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Allocazioni Budget */}
              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <Label className="text-base">Allocazione Budget Pubblicitario</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setAllocations([...allocations, { category: "", amount: "", notes: "" }])}
                    data-testid="add-allocation-button"
                  >
                    + Aggiungi Allocazione
                  </Button>
                </div>

                {allocations.map((allocation, index) => (
                  <div key={index} className="grid grid-cols-12 gap-3 p-4 border rounded-lg bg-muted/50">
                    <div className="col-span-4">
                      <Select
                        value={allocation.category}
                        onValueChange={(value) => {
                          const newAllocations = [...allocations];
                          newAllocations[index].category = value;
                          setAllocations(newAllocations);
                        }}
                      >
                        <SelectTrigger data-testid={`allocation-category-${index}`}>
                          <SelectValue placeholder="Categoria" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="SOCIAL_ADS">Social Ads</SelectItem>
                          <SelectItem value="FIERE">Fiere</SelectItem>
                          <SelectItem value="COMMERCIALE">Commerciale</SelectItem>
                          <SelectItem value="ALTRO">Altro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-3">
                      <Input
                        type="number"
                        placeholder="Importo €"
                        value={allocation.amount}
                        onChange={(e) => {
                          const newAllocations = [...allocations];
                          newAllocations[index].amount = e.target.value;
                          setAllocations(newAllocations);
                        }}
                        data-testid={`allocation-amount-${index}`}
                        min="0"
                        step="100"
                      />
                    </div>
                    <div className="col-span-4">
                      <Input
                        placeholder="Note (opzionale)"
                        value={allocation.notes}
                        onChange={(e) => {
                          const newAllocations = [...allocations];
                          newAllocations[index].notes = e.target.value;
                          setAllocations(newAllocations);
                        }}
                        data-testid={`allocation-notes-${index}`}
                      />
                    </div>
                    <div className="col-span-1 flex items-center">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setAllocations(allocations.filter((_, i) => i !== index))}
                        data-testid={`remove-allocation-${index}`}
                      >
                        ✕
                      </Button>
                    </div>
                  </div>
                ))}
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
