import { useState } from "react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, Plus, MapPin, Euro, FileText, Calendar, Upload } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { ObjectUploader } from "@/components/ObjectUploader";
import { useOrganization } from "@/hooks/useOrganization";
import type { UploadResult } from "@uppy/core";

type OfflineActivity = {
  id: string;
  title: string;
  type: string;
  activityDate: string;
  budget?: number;
  description?: string;
  taskId?: string;
  createdAt: string;
};

const activityTypes = [
  { value: "FIERA", label: "Fiera" },
  { value: "EVENTO", label: "Evento" },
  { value: "STAMPA", label: "Stampa" },
  { value: "PR", label: "PR & Relazioni Pubbliche" },
  { value: "SPONSORSHIP", label: "Sponsorizzazione" },
  { value: "DIRECT_MAIL", label: "Direct Mail" },
  { value: "RADIO", label: "Radio" },
  { value: "TV", label: "Televisione" },
  { value: "OUTDOOR", label: "Outdoor/Cartellonistica" },
  { value: "ALTRO", label: "Altro" }
];

const getActivityTypeLabel = (type: string) => {
  return activityTypes.find(t => t.value === type)?.label || type;
};

const getActivityTypeColor = (type: string) => {
  const colors: Record<string, string> = {
    FIERA: "bg-blue-100 text-blue-800",
    EVENTO: "bg-green-100 text-green-800",
    STAMPA: "bg-purple-100 text-purple-800",
    PR: "bg-pink-100 text-pink-800",
    SPONSORSHIP: "bg-orange-100 text-orange-800",
    DIRECT_MAIL: "bg-yellow-100 text-yellow-800",
    RADIO: "bg-red-100 text-red-800",
    TV: "bg-indigo-100 text-indigo-800",
    OUTDOOR: "bg-gray-100 text-gray-800",
    ALTRO: "bg-slate-100 text-slate-800"
  };
  return colors[type] || "bg-gray-100 text-gray-800";
};

export default function OfflineActivities() {
  const { user, isAuthenticated } = useAuth();
  const { selectedOrganization } = useOrganization();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [uploadedAssets, setUploadedAssets] = useState<string[]>([]);
  
  const currentOrg = selectedOrganization;
  
  const [activityForm, setActivityForm] = useState({
    title: "",
    type: "",
    activityDate: "",
    budget: "",
    description: ""
  });

  // Fetch offline activities
  const { 
    data: activities = [], 
    isLoading: activitiesLoading 
  } = useQuery({
    queryKey: ["/api/marketing/offline"],
    enabled: !!currentOrg?.id && isAuthenticated,
    retry: false,
  });

  // Create offline activity mutation
  const createActivityMutation = useMutation({
    mutationFn: async (activityData: any) => {
      return await apiRequest("/api/marketing/offline", "POST", activityData);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/marketing/offline"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      
      toast({
        title: "Attività creata!",
        description: `Attività offline "${(data as any).activity.title}" creata con successo. Task collegato generato automaticamente.`,
      });
      
      // Reset form and close dialog
      setActivityForm({
        title: "",
        type: "",
        activityDate: "",
        budget: "",
        description: ""
      });
      setUploadedAssets([]);
      setIsDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error?.message || "Errore durante la creazione dell'attività",
        variant: "destructive",
      });
    },
  });

  // Handle file upload
  const handleGetUploadParameters = async (file: any) => {
    const response = await apiRequest("/api/upload/init", "POST", {
      filename: `offline-activities_${file.name}`,
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
          tags: ["offline-activity", "attachment"],
          folder: "offline-activities"
        }) as any;

        if (response.success && response.asset) {
          setUploadedAssets(prev => [...prev, response.asset.id]);
          toast({
            title: "File caricato!",
            description: `Il file "${file.name}" è stato caricato con successo.`,
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!activityForm.title.trim()) {
      toast({
        title: "Campo obbligatorio",
        description: "Il titolo dell'attività è obbligatorio.",
        variant: "destructive",
      });
      return;
    }

    if (!activityForm.type) {
      toast({
        title: "Campo obbligatorio",
        description: "Il tipo di attività è obbligatorio.",
        variant: "destructive",
      });
      return;
    }

    if (!activityForm.activityDate) {
      toast({
        title: "Campo obbligatorio",
        description: "La data dell'attività è obbligatoria.",
        variant: "destructive",
      });
      return;
    }

    const activityData = {
      title: activityForm.title,
      type: activityForm.type,
      activityDate: new Date(activityForm.activityDate).toISOString(),
      budget: activityForm.budget ? Math.round(parseFloat(activityForm.budget) * 100) : null, // Convert to centesimi
      description: activityForm.description || null,
      assetIds: uploadedAssets.length > 0 ? uploadedAssets : null
    };

    createActivityMutation.mutate(activityData);
  };

  if (activitiesLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading"/>
      </div>
    );
  }

  return (
    <MainLayout title="Marketing Offline" icon={MapPin}>
      <div data-testid="offline-activities-content">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Attività Marketing Offline</h1>
            <p className="text-gray-600">Gestisci fiere, eventi, PR e altre attività di marketing offline</p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="new-offline-activity-button" className="flex items-center space-x-2">
                <Plus className="w-4 h-4" />
                <span>Nuova attività offline</span>
              </Button>
            </DialogTrigger>
            
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Crea nuova attività offline</DialogTitle>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Titolo */}
                <div className="space-y-2">
                  <Label htmlFor="title" className="flex items-center space-x-2">
                    <FileText className="w-4 h-4" />
                    <span>Titolo attività *</span>
                  </Label>
                  <Input
                    id="title"
                    placeholder="Es: Partecipazione Fiera del Settore 2024"
                    value={activityForm.title}
                    onChange={(e) => setActivityForm(prev => ({ ...prev, title: e.target.value }))}
                    data-testid="activity-title-input"
                    required
                  />
                </div>

                {/* Tipo */}
                <div className="space-y-2">
                  <Label htmlFor="type" className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4" />
                    <span>Tipo di attività *</span>
                  </Label>
                  <Select value={activityForm.type} onValueChange={(value) => setActivityForm(prev => ({ ...prev, type: value }))}>
                    <SelectTrigger data-testid="activity-type-select">
                      <SelectValue placeholder="Seleziona il tipo di attività" />
                    </SelectTrigger>
                    <SelectContent>
                      {activityTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Data */}
                <div className="space-y-2">
                  <Label htmlFor="activityDate" className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4" />
                    <span>Data attività *</span>
                  </Label>
                  <Input
                    id="activityDate"
                    type="date"
                    value={activityForm.activityDate}
                    onChange={(e) => setActivityForm(prev => ({ ...prev, activityDate: e.target.value }))}
                    data-testid="activity-date-input"
                    required
                  />
                </div>

                {/* Budget */}
                <div className="space-y-2">
                  <Label htmlFor="budget" className="flex items-center space-x-2">
                    <Euro className="w-4 h-4" />
                    <span>Budget (€)</span>
                  </Label>
                  <Input
                    id="budget"
                    type="number"
                    placeholder="5000"
                    value={activityForm.budget}
                    onChange={(e) => setActivityForm(prev => ({ ...prev, budget: e.target.value }))}
                    data-testid="activity-budget-input"
                    min="0"
                    step="100"
                  />
                </div>

                {/* Descrizione */}
                <div className="space-y-2">
                  <Label htmlFor="description">Descrizione</Label>
                  <Textarea
                    id="description"
                    placeholder="Descrivi l'attività, obiettivi, modalità di partecipazione..."
                    value={activityForm.description}
                    onChange={(e) => setActivityForm(prev => ({ ...prev, description: e.target.value }))}
                    data-testid="activity-description-input"
                    rows={4}
                  />
                </div>

                {/* File Upload */}
                <div className="space-y-2">
                  <Label className="flex items-center space-x-2">
                    <Upload className="w-4 h-4" />
                    <span>Allegati (PDF, immagini, video)</span>
                  </Label>
                  <div className="text-sm text-gray-600 mb-2">
                    Carica documenti, brochure, immagini o video relativi all'attività offline
                  </div>
                  <ObjectUploader
                    maxNumberOfFiles={5}
                    maxFileSize={50 * 1024 * 1024} // 50MB
                    onGetUploadParameters={handleGetUploadParameters}
                    onComplete={handleUploadComplete}
                    buttonClassName="w-full"
                  >
                    <div className="flex items-center gap-2">
                      <Upload className="w-4 h-4" />
                      <span>Carica allegati</span>
                      {uploadedAssets.length > 0 && (
                        <Badge variant="secondary">{uploadedAssets.length} file caricati</Badge>
                      )}
                    </div>
                  </ObjectUploader>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Annulla
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createActivityMutation.isPending}
                    data-testid="save-activity-button"
                  >
                    {createActivityMutation.isPending ? "Salvando..." : "Crea attività"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Activities List */}
        <div className="space-y-4">
          {(activities as OfflineActivity[]).length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <MapPin className="w-12 h-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Nessuna attività offline</h3>
                <p className="text-gray-600 text-center mb-4">
                  Inizia creando la tua prima attività di marketing offline
                </p>
                <Button onClick={() => setIsDialogOpen(true)} data-testid="empty-state-create-button">
                  Crea prima attività
                </Button>
              </CardContent>
            </Card>
          ) : (
            (activities as OfflineActivity[]).map((activity: OfflineActivity) => (
              <Card key={activity.id} data-testid={`activity-card-${activity.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <CardTitle className="text-lg">{activity.title}</CardTitle>
                      <div className="flex items-center space-x-4">
                        <Badge className={getActivityTypeColor(activity.type)}>
                          {getActivityTypeLabel(activity.type)}
                        </Badge>
                        <div className="flex items-center text-sm text-gray-600">
                          <CalendarIcon className="w-4 h-4 mr-1" />
                          {format(new Date(activity.activityDate), 'dd MMMM yyyy', { locale: it })}
                        </div>
                        {activity.budget && (
                          <div className="flex items-center text-sm text-gray-600">
                            <Euro className="w-4 h-4 mr-1" />
                            €{(activity.budget / 100).toLocaleString()}
                          </div>
                        )}
                      </div>
                    </div>
                    {activity.taskId && (
                      <Badge variant="outline" className="text-green-600 border-green-200">
                        Task collegato
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                {activity.description && (
                  <CardContent>
                    <p className="text-gray-600">{activity.description}</p>
                  </CardContent>
                )}
              </Card>
            ))
          )}
        </div>
      </div>
    </MainLayout>
  );
}