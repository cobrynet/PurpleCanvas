import { useState, useEffect } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Target, Lightbulb, Users, DollarSign, Megaphone, Upload } from "lucide-react";
import { ObjectUploader } from "@/components/ObjectUploader";
import type { UploadResult } from "@uppy/core";

export default function Goals() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { selectedOrganization } = useOrganization();
  const { toast } = useToast();
  const [uploadedAssets, setUploadedAssets] = useState<string[]>([]);
  
  const currentOrg = selectedOrganization;
  
  const [goalForm, setGoalForm] = useState({
    salesPipeline: "",
    fairs: "",
    digitalChannels: "",
    adInvestments: "",
    geoArea: "",
    periodicity: "" as "ANNUALE" | "SEMESTRALE" | "QUADRIMESTRALE" | "",
    objectives: "",
    totalBudget: "",
    budgetAllocations: [] as { category: "SOCIAL_ADS" | "FIERE" | "COMMERCIALE" | "ALTRO"; amount: string; notes: string }[]
  });

  const periodicityOptions = [
    { value: "ANNUALE", label: "Annuale" },
    { value: "SEMESTRALE", label: "Semestrale" },
    { value: "QUADRIMESTRALE", label: "Quadrimestrale" }
  ];

  const budgetCategories = [
    { value: "SOCIAL_ADS", label: "Social Ads" },
    { value: "FIERE", label: "Fiere" },
    { value: "COMMERCIALE", label: "Commerciale" },
    { value: "ALTRO", label: "Altro" }
  ];

  // Check existing goals
  const { 
    data: existingGoals, 
    isLoading: goalsLoading 
  } = useQuery({
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
      
      // Reset form
      setGoalForm({
        salesPipeline: "",
        fairs: "",
        digitalChannels: "",
        adInvestments: "",
        geoArea: "",
        periodicity: "" as const,
        objectives: "",
        totalBudget: "",
        budgetAllocations: []
      });
      setUploadedAssets([]);
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error?.message || "Errore durante il salvataggio degli obiettivi",
        variant: "destructive",
      });
    },
  });

  // Handle file upload
  const handleGetUploadParameters = async (file: any) => {
    const response = await apiRequest("/api/upload/init", "POST", {
      filename: `business-goals_${file.name}`,
      fileType: file.type,
      fileSize: file.size
    }) as any;
    return {
      method: "PUT" as const,
      url: response.uploadUrl,
      headers: response.headers || {},
      objectPath: response.objectPath,
    };
  };

  const handleUploadComplete = async (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
    const uploadedFiles = result.successful || [];
    
    for (const file of uploadedFiles) {
      try {
        // Complete the upload process and save asset
        const response = await apiRequest("/api/upload/complete", "POST", {
          objectPath: file.meta?.objectPath,
          mimeType: file.type,
          sizeBytes: file.size,
          filename: file.name,
          title: file.name,
          tags: ["business-goal", "document"],
          folder: "business-goals"
        }) as any;

        if (response.success && response.asset) {
          setUploadedAssets(prev => [...prev, response.asset.id]);
          toast({
            title: "File caricato!",
            description: `Il documento "${file.name}" è stato caricato con successo.`,
          });
        }
      } catch (error) {
        console.error("Error completing upload:", error);
        toast({
          title: "Errore upload",
          description: `Errore durante il caricamento di "${file.name}".`,
          variant: "destructive",
        });
      }
    }
  };

  const addBudgetAllocation = () => {
    setGoalForm(prev => ({
      ...prev,
      budgetAllocations: [...prev.budgetAllocations, { category: "ALTRO" as const, amount: "", notes: "" }]
    }));
  };

  const updateBudgetAllocation = (index: number, field: string, value: string) => {
    setGoalForm(prev => ({
      ...prev,
      budgetAllocations: prev.budgetAllocations.map((allocation, i) => 
        i === index ? { ...allocation, [field]: value } : allocation
      )
    }));
  };

  const removeBudgetAllocation = (index: number) => {
    setGoalForm(prev => ({
      ...prev,
      budgetAllocations: prev.budgetAllocations.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!goalForm.objectives.trim()) {
      toast({
        title: "Campo obbligatorio",
        description: "Gli obiettivi sono obbligatori.",
        variant: "destructive",
      });
      return;
    }

    if (!goalForm.periodicity) {
      toast({
        title: "Campo obbligatorio",
        description: "La periodicità è obbligatoria.",
        variant: "destructive",
      });
      return;
    }

    if (!goalForm.totalBudget || parseFloat(goalForm.totalBudget) <= 0) {
      toast({
        title: "Campo obbligatorio",
        description: "Il budget totale è obbligatorio e deve essere maggiore di 0.",
        variant: "destructive",
      });
      return;
    }

    const goalsData = {
      salesPipeline: goalForm.salesPipeline || null,
      fairs: goalForm.fairs || null,
      digitalChannels: goalForm.digitalChannels || null,
      adInvestments: goalForm.adInvestments || null,
      geoArea: goalForm.geoArea || null,
      periodicity: goalForm.periodicity,
      objectives: goalForm.objectives,
      totalBudget: Math.round(parseFloat(goalForm.totalBudget) * 100), // Convert to centesimi
      organizationId: currentOrg?.id,
      assetIds: uploadedAssets.length > 0 ? uploadedAssets : null,
      budgetAllocations: goalForm.budgetAllocations.filter(a => a.amount && parseFloat(a.amount) > 0).map(a => ({
        category: a.category,
        amount: Math.round(parseFloat(a.amount) * 100), // Convert to centesimi
        notes: a.notes || null
      }))
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
                  <h3 className="font-semibold mb-2">Periodicità</h3>
                  <p className="text-muted-foreground">{goal.periodicity}</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Budget Totale</h3>
                  <p className="text-muted-foreground">
                    {goal.totalBudget ? `€${(goal.totalBudget / 100).toLocaleString()}` : "Non specificato"}
                  </p>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Obiettivi</h3>
                <p className="text-muted-foreground whitespace-pre-wrap">{goal.objectives}</p>
              </div>
              
              {goal.salesPipeline && (
                <div>
                  <h3 className="font-semibold mb-2">Pipeline Vendite</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap">{goal.salesPipeline}</p>
                </div>
              )}
              
              {goal.fairs && (
                <div>
                  <h3 className="font-semibold mb-2">Fiere</h3>
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
              {/* Obiettivi - Campo obbligatorio */}
              <div className="space-y-2">
                <Label htmlFor="objectives" className="flex items-center space-x-2">
                  <Target className="w-4 h-4" />
                  <span>Obiettivi aziendali *</span>
                </Label>
                <Textarea
                  id="objectives"
                  placeholder="Descrivi i principali obiettivi che vuoi raggiungere (es: aumentare fatturato del 30%, acquisire 100 nuovi clienti, espandere in nuovi mercati...)"
                  value={goalForm.objectives}
                  onChange={(e) => setGoalForm(prev => ({ ...prev, objectives: e.target.value }))}
                  onKeyDown={(e) => e.stopPropagation()}
                  onKeyUp={(e) => e.stopPropagation()}
                  data-testid="objectives-input"
                  rows={4}
                  required
                />
              </div>

              {/* Periodicità - Campo obbligatorio */}
              <div className="space-y-2">
                <Label htmlFor="periodicity" className="flex items-center space-x-2">
                  <Target className="w-4 h-4" />
                  <span>Periodicità *</span>
                </Label>
                <Select value={goalForm.periodicity} onValueChange={(value) => setGoalForm(prev => ({ ...prev, periodicity: value as any }))}>
                  <SelectTrigger data-testid="periodicity-select">
                    <SelectValue placeholder="Seleziona la periodicità" />
                  </SelectTrigger>
                  <SelectContent>
                    {periodicityOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Budget Totale - Campo obbligatorio */}
              <div className="space-y-2">
                <Label htmlFor="total-budget" className="flex items-center space-x-2">
                  <DollarSign className="w-4 h-4" />
                  <span>Budget totale (€) *</span>
                </Label>
                <Input
                  id="total-budget"
                  type="number"
                  placeholder="50000"
                  value={goalForm.totalBudget}
                  onChange={(e) => setGoalForm(prev => ({ ...prev, totalBudget: e.target.value }))}
                  data-testid="total-budget-input"
                  min="0"
                  step="100"
                  required
                />
              </div>

              {/* Pipeline Vendite */}
              <div className="space-y-2">
                <Label htmlFor="sales-pipeline" className="flex items-center space-x-2">
                  <Users className="w-4 h-4" />
                  <span>Pipeline vendite</span>
                </Label>
                <Textarea
                  id="sales-pipeline"
                  placeholder="Descrivi la tua pipeline vendite, processi di acquisizione clienti, cicli di vendita..."
                  value={goalForm.salesPipeline}
                  onChange={(e) => setGoalForm(prev => ({ ...prev, salesPipeline: e.target.value }))}
                  data-testid="sales-pipeline-input"
                  rows={3}
                />
              </div>

              {/* Fiere */}
              <div className="space-y-2">
                <Label htmlFor="fairs" className="flex items-center space-x-2">
                  <Megaphone className="w-4 h-4" />
                  <span>Fiere e eventi</span>
                </Label>
                <Textarea
                  id="fairs"
                  placeholder="Descrivi le fiere, eventi, conferenze a cui partecipi o vorresti partecipare..."
                  value={goalForm.fairs}
                  onChange={(e) => setGoalForm(prev => ({ ...prev, fairs: e.target.value }))}
                  data-testid="fairs-input"
                  rows={3}
                />
              </div>

              {/* Canali Digitali */}
              <div className="space-y-2">
                <Label htmlFor="digital-channels">Canali digitali</Label>
                <Textarea
                  id="digital-channels"
                  placeholder="Descrivi i canali digitali che utilizzi o vorresti utilizzare (social media, email, sito web, blog...)"  
                  value={goalForm.digitalChannels}
                  onChange={(e) => setGoalForm(prev => ({ ...prev, digitalChannels: e.target.value }))}
                  data-testid="digital-channels-input"
                  rows={3}
                />
              </div>

              {/* Investimenti Pubblicitari */}
              <div className="space-y-2">
                <Label htmlFor="ad-investments">Investimenti pubblicitari</Label>
                <Textarea
                  id="ad-investments"
                  placeholder="Descrivi gli investimenti pubblicitari attuali o pianificati (Google Ads, Facebook Ads, LinkedIn...)"  
                  value={goalForm.adInvestments}
                  onChange={(e) => setGoalForm(prev => ({ ...prev, adInvestments: e.target.value }))}
                  data-testid="ad-investments-input"
                  rows={3}
                />
              </div>

              {/* Area Geografica */}
              <div className="space-y-2">
                <Label htmlFor="geo-area">Area geografica</Label>
                <Textarea
                  id="geo-area"
                  placeholder="Descrivi le aree geografiche target per il tuo business (locale, nazionale, internazionale...)"  
                  value={goalForm.geoArea}
                  onChange={(e) => setGoalForm(prev => ({ ...prev, geoArea: e.target.value }))}
                  data-testid="geo-area-input"
                  rows={2}
                />
              </div>

              {/* File Upload */}
              <div className="space-y-2">
                <Label className="flex items-center space-x-2">
                  <Upload className="w-4 h-4" />
                  <span>Documenti PDF (opzionale)</span>
                </Label>
                <div className="text-sm text-gray-600 mb-2">
                  Carica documenti PDF di supporto: business plan, piani strategici, analisi di mercato, presentazioni aziendali
                </div>
                <ObjectUploader
                  maxNumberOfFiles={3}
                  maxFileSize={25 * 1024 * 1024} // 25MB
                  allowedFileTypes={['application/pdf']}
                  onGetUploadParameters={handleGetUploadParameters}
                  onComplete={handleUploadComplete}
                  buttonClassName="w-full"
                >
                  <div className="flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    <span>Carica documenti PDF</span>
                    {uploadedAssets.length > 0 && (
                      <Badge variant="secondary">{uploadedAssets.length} documento{uploadedAssets.length > 1 ? 'i' : ''} caricato{uploadedAssets.length > 1 ? 'i' : ''}</Badge>
                    )}
                  </div>
                </ObjectUploader>
              </div>

              {/* Budget Allocations */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center space-x-2">
                    <DollarSign className="w-4 h-4" />
                    <span>Allocazioni budget (opzionale)</span>
                  </Label>
                  <Button type="button" variant="outline" size="sm" onClick={addBudgetAllocation} data-testid="add-budget-allocation">
                    Aggiungi allocazione
                  </Button>
                </div>
                {goalForm.budgetAllocations.map((allocation, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg">
                    <div>
                      <Label htmlFor={`allocation-category-${index}`}>Categoria</Label>
                      <Select value={allocation.category} onValueChange={(value) => updateBudgetAllocation(index, 'category', value)}>
                        <SelectTrigger data-testid={`allocation-category-${index}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {budgetCategories.map(cat => (
                            <SelectItem key={cat.value} value={cat.value}>
                              {cat.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor={`allocation-amount-${index}`}>Importo (€)</Label>
                      <Input
                        id={`allocation-amount-${index}`}
                        type="number"
                        placeholder="5000"
                        value={allocation.amount}
                        onChange={(e) => updateBudgetAllocation(index, 'amount', e.target.value)}
                        data-testid={`allocation-amount-${index}`}
                        min="0"
                        step="100"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`allocation-notes-${index}`}>Note</Label>
                      <Input
                        id={`allocation-notes-${index}`}
                        placeholder="Note..."
                        value={allocation.notes}
                        onChange={(e) => updateBudgetAllocation(index, 'notes', e.target.value)}
                        data-testid={`allocation-notes-${index}`}
                      />
                    </div>
                    <div className="flex items-end">
                      <Button 
                        type="button" 
                        variant="destructive" 
                        size="sm" 
                        onClick={() => removeBudgetAllocation(index)}
                        data-testid={`remove-allocation-${index}`}
                      >
                        Rimuovi
                      </Button>
                    </div>
                  </div>
                ))}
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