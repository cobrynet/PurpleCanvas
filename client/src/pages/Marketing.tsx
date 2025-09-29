import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
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
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Edit3, Megaphone, Plus, MapPin, CalendarIcon, Euro, Edit, Trash2, CheckSquare } from "lucide-react";
import { Link } from "wouter";
import { isUnauthorizedError } from "@/lib/authUtils";
import { format } from "date-fns";
import { it } from "date-fns/locale";

// Post Organici Section Component
function PostOrganiciSection() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [postForm, setPostForm] = useState({
    title: "",
    channel: "",
    copy: "",
    content: null as File | null,
    scheduledAt: "",
    priority: "P2"
  });
  const [uploadProgress, setUploadProgress] = useState(false);
  
  const currentOrg = user?.organizations?.[0];

  const socialProviders = [
    { name: "Facebook", color: "text-blue-600" },
    { name: "Instagram", color: "text-pink-600" },
    { name: "LinkedIn", color: "text-blue-700" },
    { name: "Twitter", color: "text-blue-400" }
  ];

  // Upload file function
  const uploadFile = async (file: File) => {
    try {
      setUploadProgress(true);
      
      // Step 1: Get upload URL from backend
      const response = await fetch("/api/upload/url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
          organizationId: currentOrg?.id
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get upload URL");
      }

      const { uploadUrl, assetId } = await response.json();

      // Step 2: Upload file directly to cloud storage
      const uploadResponse = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload file");
      }

      setUploadProgress(false);
      return assetId;

    } catch (error) {
      console.error("Upload error:", error);
      setUploadProgress(false);
      toast({
        title: "Errore upload",
        description: "Impossibile caricare il file",
        variant: "destructive"
      });
      return null;
    }
  };

  const handleSubmit = async (isDraft = false) => {
    try {
      // Upload file if present
      let assetId = null;
      if (postForm.content) {
        assetId = await uploadFile(postForm.content);
        if (!assetId) return; // Upload failed
      }

      const postData = {
        title: postForm.title,
        channel: postForm.channel,
        content: postForm.copy,
        assetIds: assetId ? [assetId] : [],
        scheduledAt: postForm.scheduledAt ? new Date(postForm.scheduledAt).toISOString() : null,
        priority: postForm.priority,
        status: isDraft ? "draft" : "scheduled",
        organizationId: currentOrg?.id
      };
      
      // Create asset link if asset was uploaded
      if (assetId) {
        try {
          const linkResponse = await fetch(`/api/assets/${assetId}/link`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              relatedType: 'social_post',
              relatedId: `temp-${Date.now()}`, // Temporary ID until social post API is implemented
              organizationId: currentOrg?.id
            })
          });
          
          if (linkResponse.ok) {
            const linkResult = await linkResponse.json();
            console.log('Asset linked successfully:', linkResult.assetLink);
          }
        } catch (linkError) {
          console.error('Failed to link asset:', linkError);
          // Don't fail the entire save operation if linking fails
        }
      }
      
      // For now, just show success message (you can add API endpoint later)
      toast({
        title: isDraft ? "Bozza salvata" : "Post pianificato", 
        description: `Post "${postForm.title}" ${isDraft ? "salvato come bozza" : "pianificato con successo"}${assetId ? " con asset collegato" : ""}`
      });
      
      // Reset form and close modal
      setPostForm({
        title: "",
        channel: "",
        copy: "",
        content: null,
        scheduledAt: "",
        priority: "P2"
      });
      setIsPostModalOpen(false);
      
    } catch (error) {
      console.error("Save error:", error);
      toast({
        title: "Errore",
        description: "Impossibile salvare il post",
        variant: "destructive"
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPostForm(prev => ({ ...prev, content: file }));
    }
  };

  return (
    <>
      {/* Header with Action Buttons */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">Post Organici</h2>
          <p className="text-muted-foreground">
            Crea e gestisci i tuoi contenuti organici per i social media
          </p>
        </div>
        <div className="flex space-x-3">
          <Dialog open={isPostModalOpen} onOpenChange={setIsPostModalOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center space-x-2" data-testid="new-post-button">
                <Edit3 className="w-4 h-4" />
                <span>Nuovo Post</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Crea Nuovo Post</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6 py-4">
                {/* Titolo */}
                <div className="space-y-2">
                  <Label htmlFor="post-title">Titolo</Label>
                  <Input
                    id="post-title"
                    placeholder="Inserisci il titolo del post"
                    value={postForm.title}
                    onChange={(e) => setPostForm(prev => ({ ...prev, title: e.target.value }))}
                    data-testid="post-title-input"
                  />
                </div>

                {/* Canale */}
                <div className="space-y-2">
                  <Label htmlFor="post-channel">Canale</Label>
                  <Select value={postForm.channel} onValueChange={(value) => setPostForm(prev => ({ ...prev, channel: value }))}>
                    <SelectTrigger data-testid="post-channel-select">
                      <SelectValue placeholder="Seleziona canale" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="facebook">Facebook</SelectItem>
                      <SelectItem value="instagram">Instagram</SelectItem>
                      <SelectItem value="linkedin">LinkedIn</SelectItem>
                      <SelectItem value="twitter">Twitter</SelectItem>
                      <SelectItem value="tiktok">TikTok</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Copy */}
                <div className="space-y-2">
                  <Label htmlFor="post-copy">Testo del post</Label>
                  <Textarea
                    id="post-copy"
                    placeholder="Scrivi il contenuto del tuo post..."
                    value={postForm.copy}
                    onChange={(e) => setPostForm(prev => ({ ...prev, copy: e.target.value }))}
                    data-testid="post-copy-input"
                    rows={4}
                  />
                </div>

                {/* File Upload */}
                <div className="space-y-2">
                  <Label htmlFor="post-file">Allegato (immagine/video)</Label>
                  <Input
                    id="post-file"
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleFileChange}
                    data-testid="post-file-input"
                  />
                  {postForm.content && (
                    <p className="text-sm text-muted-foreground">
                      File selezionato: {postForm.content.name}
                    </p>
                  )}
                </div>

                {/* Pianificazione */}
                <div className="space-y-2">
                  <Label htmlFor="post-scheduled">Pianifica pubblicazione</Label>
                  <Input
                    id="post-scheduled"
                    type="datetime-local"
                    value={postForm.scheduledAt}
                    onChange={(e) => setPostForm(prev => ({ ...prev, scheduledAt: e.target.value }))}
                    data-testid="post-scheduled-input"
                  />
                </div>

                {/* Priorità */}
                <div className="space-y-2">
                  <Label htmlFor="post-priority">Priorità</Label>
                  <Select value={postForm.priority} onValueChange={(value) => setPostForm(prev => ({ ...prev, priority: value }))}>
                    <SelectTrigger data-testid="post-priority-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="P0">P0 - Urgente</SelectItem>
                      <SelectItem value="P1">P1 - Alta</SelectItem>
                      <SelectItem value="P2">P2 - Media</SelectItem>
                      <SelectItem value="P3">P3 - Bassa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end space-x-3">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => handleSubmit(true)}
                    disabled={uploadProgress}
                    data-testid="save-draft-button"
                  >
                    {uploadProgress ? "Caricamento..." : "Salva Bozza"}
                  </Button>
                  <Button 
                    type="button" 
                    onClick={() => handleSubmit(false)}
                    disabled={uploadProgress}
                    data-testid="schedule-post-button"
                  >
                    {uploadProgress ? "Caricamento..." : "Pianifica Post"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Social Media Integrations */}
      <div className="mb-8">
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Integrazioni Social Media</h3>
            <p className="text-sm text-muted-foreground">
              Connetti i tuoi account social per pubblicare direttamente
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {socialProviders.map((provider) => (
                <Card
                  key={provider.name}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  data-testid={`social-${provider.name.toLowerCase()}`}
                  onClick={() => {
                    toast({
                      title: "Integrazione",
                      description: `${provider.name} è stato connesso con successo`,
                    });
                  }}
                  role="button"
                  tabIndex={0}
                >
                  <CardContent className="p-3 text-center">
                    <div className={`w-8 h-8 mx-auto mb-2 rounded-full flex items-center justify-center ${provider.color} bg-white`}>
                      <span className="text-lg font-bold">{provider.name[0]}</span>
                    </div>
                    <h3 className="font-semibold text-sm">{provider.name}</h3>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Posts List Placeholder */}
      <Card data-testid="posts-list">
        <CardContent className="text-center py-12">
          <Edit3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">I tuoi post organici</h3>
          <p className="text-muted-foreground mb-6">
            Qui vedrai tutti i post organici creati e pianificati
          </p>
        </CardContent>
      </Card>
    </>
  );
}

// Campagne Section Component  
function CampagneSection() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [isAdvCampaignModalOpen, setIsAdvCampaignModalOpen] = useState(false);
  const [isEditCampaignModalOpen, setIsEditCampaignModalOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<any>(null);
  const [advCampaignForm, setAdvCampaignForm] = useState({
    name: "",
    objective: "",
    channel: "",
    budget: "",
    startAt: "",
    endAt: "",
    assetIds: [],
    createTask: true
  });
  const [editCampaignForm, setEditCampaignForm] = useState({
    name: "",
    objective: "",
    budget: "",
    startAt: "",
    endAt: "",
    status: ""
  });
  
  const currentOrg = user?.organizations?.[0];
  const currentMembership = currentOrg?.membership;

  // Check if user has marketing access
  const hasMarketingAccess = currentMembership && 
    ['SUPER_ADMIN', 'ORG_ADMIN', 'MARKETER'].includes(currentMembership.role);

  // Fetch regular campaigns
  const { 
    data: campaigns = [], 
    isLoading: campaignsLoading,
    error: campaignsError 
  } = useQuery({
    queryKey: ["/api/organizations", currentOrg?.id, "campaigns"],
    enabled: !!currentOrg?.id && isAuthenticated && hasMarketingAccess,
    retry: false,
  });

  // Fetch ADV campaigns
  const { 
    data: advCampaigns = [], 
    isLoading: advCampaignsLoading,
    error: advCampaignsError 
  } = useQuery({
    queryKey: ["/api/marketing/campaigns"],
    enabled: isAuthenticated && hasMarketingAccess,
    retry: false,
  });

  // Fetch marketing tasks for campaigns
  const { 
    data: marketingTasks = [], 
    isLoading: tasksLoading 
  } = useQuery({
    queryKey: ["/api/organizations", currentOrg?.id, "tasks"],
    enabled: !!currentOrg?.id && isAuthenticated && hasMarketingAccess,
    retry: false,
  });

  // Create ADV Campaign mutation
  const createAdvCampaignMutation = useMutation({
    mutationFn: async (campaignData: any) => {
      return await apiRequest("POST", "/api/marketing/campaigns", campaignData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/marketing/campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["/api/organizations", currentOrg?.id, "tasks"] });
      toast({
        title: "Campagna ADV creata!",
        description: "La campagna pubblicitaria è stata creata con successo.",
      });
      setIsAdvCampaignModalOpen(false);
      setAdvCampaignForm({
        name: "",
        objective: "",
        channel: "",
        budget: "",
        startAt: "",
        endAt: "",
        assetIds: [],
        createTask: true
      });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error?.message || "Errore durante la creazione della campagna ADV",
        variant: "destructive",
      });
    },
  });

  // Update ADV Campaign mutation
  const updateAdvCampaignMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      return await apiRequest("PATCH", `/api/marketing/campaigns/${id}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/marketing/campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["/api/organizations", currentOrg?.id, "tasks"] });
      toast({
        title: "Campagna aggiornata!",
        description: "La campagna pubblicitaria è stata aggiornata con successo.",
      });
      setIsEditCampaignModalOpen(false);
      setEditingCampaign(null);
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error?.message || "Errore durante l'aggiornamento della campagna",
        variant: "destructive",
      });
    },
  });

  // Handle edit campaign
  const handleEditCampaign = (campaign: any) => {
    setEditingCampaign(campaign);
    setEditCampaignForm({
      name: campaign.name || "",
      objective: campaign.objective || "",
      budget: campaign.budget ? campaign.budget.toString() : "",
      startAt: campaign.startAt ? new Date(campaign.startAt).toISOString().split('T')[0] : "",
      endAt: campaign.endAt ? new Date(campaign.endAt).toISOString().split('T')[0] : "",
      status: campaign.status || "DRAFT"
    });
    setIsEditCampaignModalOpen(true);
  };

  // Handle close edit modal
  const handleCloseEditModal = () => {
    setIsEditCampaignModalOpen(false);
    setEditingCampaign(null);
    setEditCampaignForm({
      name: "",
      objective: "",
      budget: "",
      startAt: "",
      endAt: "",
      status: ""
    });
  };

  // Handle update campaign
  const handleUpdateCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingCampaign) return;
    
    const updates = {
      name: editCampaignForm.name,
      objective: editCampaignForm.objective,
      budget: editCampaignForm.budget ? parseFloat(editCampaignForm.budget) : null,
      startAt: editCampaignForm.startAt ? new Date(editCampaignForm.startAt).toISOString() : null,
      endAt: editCampaignForm.endAt ? new Date(editCampaignForm.endAt).toISOString() : null,
      status: editCampaignForm.status
    };

    updateAdvCampaignMutation.mutate({ id: editingCampaign.id, updates });
  };

  // Get tasks for a specific campaign
  const getCampaignTasks = (campaignId: string) => {
    return marketingTasks.filter((task: any) => task.campaignId === campaignId);
  };

  const handleCreateAdvCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!advCampaignForm.name || !advCampaignForm.channel) {
      toast({
        title: "Campi obbligatori",
        description: "Nome e canale sono obbligatori.",
        variant: "destructive",
      });
      return;
    }

    const campaignData = {
      name: advCampaignForm.name,
      objective: advCampaignForm.objective,
      type: 'ADV',
      status: 'DRAFT',
      budget: advCampaignForm.budget ? parseFloat(advCampaignForm.budget) : null,
      startAt: advCampaignForm.startAt || null,
      endAt: advCampaignForm.endAt || null,
      priority: 'P2',
      channel: advCampaignForm.channel,
      createTask: advCampaignForm.createTask,
    };

    createAdvCampaignMutation.mutate(campaignData);
  };

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
      case 'EMAIL': return 'text-blue-600';
      case 'SOCIAL': return 'text-purple-600';
      case 'ADV': return 'text-red-600';
      case 'CONTENT': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  // Merge and normalize campaigns
  const allCampaigns = [
    ...(campaigns as any[]).map(c => ({ ...c, source: 'organic' })),
    ...(advCampaigns as any[]).map(c => ({ ...c, source: 'adv' }))
  ];

  const isLoading = campaignsLoading || advCampaignsLoading;

  return (
    <>
      {/* Header with Action Buttons */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">Campagne</h2>
          <p className="text-muted-foreground">
            Gestisci tutte le tue campagne marketing e pubblicitarie
          </p>
        </div>
        <Dialog open={isAdvCampaignModalOpen} onOpenChange={setIsAdvCampaignModalOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center space-x-2" data-testid="new-campaign-button">
              <Plus className="w-4 h-4" />
              <span>Nuova Campagna ADV</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Crea Nuova Campagna ADV</DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleCreateAdvCampaign} className="space-y-6 py-4">
              {/* Nome */}
              <div className="space-y-2">
                <Label htmlFor="adv-name">Nome Campagna *</Label>
                <Input
                  id="adv-name"
                  placeholder="Es: Campagna Black Friday 2024"
                  value={advCampaignForm.name}
                  onChange={(e) => setAdvCampaignForm(prev => ({ ...prev, name: e.target.value }))}
                  data-testid="adv-name-input"
                  required
                />
              </div>

              {/* Obiettivo */}
              <div className="space-y-2">
                <Label htmlFor="adv-objective">Obiettivo</Label>
                <Textarea
                  id="adv-objective"
                  placeholder="Descrivi l'obiettivo della campagna pubblicitaria..."
                  value={advCampaignForm.objective}
                  onChange={(e) => setAdvCampaignForm(prev => ({ ...prev, objective: e.target.value }))}
                  data-testid="adv-objective-input"
                  rows={3}
                />
              </div>

              {/* Canale */}
              <div className="space-y-2">
                <Label htmlFor="adv-channel">Canale *</Label>
                <Select 
                  value={advCampaignForm.channel} 
                  onValueChange={(value) => setAdvCampaignForm(prev => ({ ...prev, channel: value }))}
                >
                  <SelectTrigger data-testid="adv-channel-select">
                    <SelectValue placeholder="Seleziona canale pubblicitario" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="facebook">Facebook Ads</SelectItem>
                    <SelectItem value="instagram">Instagram Ads</SelectItem>
                    <SelectItem value="google">Google Ads</SelectItem>
                    <SelectItem value="linkedin">LinkedIn Ads</SelectItem>
                    <SelectItem value="tiktok">TikTok Ads</SelectItem>
                    <SelectItem value="youtube">YouTube Ads</SelectItem>
                    <SelectItem value="mixed">Multi-canale</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Budget */}
              <div className="space-y-2">
                <Label htmlFor="adv-budget">Budget (€)</Label>
                <Input
                  id="adv-budget"
                  type="number"
                  placeholder="1000"
                  value={advCampaignForm.budget}
                  onChange={(e) => setAdvCampaignForm(prev => ({ ...prev, budget: e.target.value }))}
                  data-testid="adv-budget-input"
                  min="0"
                  step="0.01"
                />
              </div>

              {/* Periodo */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="adv-start">Data Inizio</Label>
                  <Input
                    id="adv-start"
                    type="date"
                    value={advCampaignForm.startAt}
                    onChange={(e) => setAdvCampaignForm(prev => ({ ...prev, startAt: e.target.value }))}
                    data-testid="adv-start-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="adv-end">Data Fine</Label>
                  <Input
                    id="adv-end"
                    type="date"
                    value={advCampaignForm.endAt}
                    onChange={(e) => setAdvCampaignForm(prev => ({ ...prev, endAt: e.target.value }))}
                    data-testid="adv-end-input"
                  />
                </div>
              </div>

              {/* Asset placeholder */}
              <div className="space-y-2">
                <Label>Asset</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center text-muted-foreground">
                  Asset management sarà disponibile prossimamente
                </div>
              </div>

              {/* Crea Task collegato */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="create-task"
                  checked={advCampaignForm.createTask}
                  onChange={(e) => setAdvCampaignForm(prev => ({ ...prev, createTask: e.target.checked }))}
                  data-testid="create-task-checkbox"
                />
                <Label htmlFor="create-task">Crea task collegato nel Task Manager</Label>
              </div>

              <div className="flex justify-end space-x-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsAdvCampaignModalOpen(false)}
                  data-testid="cancel-adv-campaign"
                >
                  Annulla
                </Button>
                <Button 
                  type="submit" 
                  disabled={createAdvCampaignMutation.isPending}
                  data-testid="create-adv-campaign-submit"
                >
                  {createAdvCampaignMutation.isPending ? "Creazione..." : "Crea Campagna ADV"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Campaign Modal */}
        <Dialog open={isEditCampaignModalOpen} onOpenChange={handleCloseEditModal}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Modifica Campagna ADV</DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleUpdateCampaign} className="space-y-6 py-4">
              {/* Nome */}
              <div className="space-y-2">
                <Label htmlFor="edit-name">Nome Campagna *</Label>
                <Input
                  id="edit-name"
                  placeholder="Es: Campagna Black Friday 2024"
                  value={editCampaignForm.name}
                  onChange={(e) => setEditCampaignForm(prev => ({ ...prev, name: e.target.value }))}
                  data-testid="edit-name-input"
                  required
                />
              </div>

              {/* Obiettivo */}
              <div className="space-y-2">
                <Label htmlFor="edit-objective">Obiettivo</Label>
                <Textarea
                  id="edit-objective"
                  placeholder="Descrivi l'obiettivo della campagna pubblicitaria..."
                  value={editCampaignForm.objective}
                  onChange={(e) => setEditCampaignForm(prev => ({ ...prev, objective: e.target.value }))}
                  data-testid="edit-objective-input"
                  rows={3}
                />
              </div>


              {/* Status */}
              <div className="space-y-2">
                <Label htmlFor="edit-status">Stato</Label>
                <Select 
                  value={editCampaignForm.status} 
                  onValueChange={(value) => setEditCampaignForm(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger data-testid="edit-status-select">
                    <SelectValue placeholder="Seleziona stato campagna" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DRAFT">Bozza</SelectItem>
                    <SelectItem value="ACTIVE">Attiva</SelectItem>
                    <SelectItem value="PAUSED">In Pausa</SelectItem>
                    <SelectItem value="COMPLETED">Completata</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Budget */}
              <div className="space-y-2">
                <Label htmlFor="edit-budget">Budget (€)</Label>
                <Input
                  id="edit-budget"
                  type="number"
                  placeholder="1000"
                  value={editCampaignForm.budget}
                  onChange={(e) => setEditCampaignForm(prev => ({ ...prev, budget: e.target.value }))}
                  data-testid="edit-budget-input"
                  min="0"
                  step="0.01"
                />
              </div>

              {/* Periodo */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-start">Data Inizio</Label>
                  <Input
                    id="edit-start"
                    type="date"
                    value={editCampaignForm.startAt}
                    onChange={(e) => setEditCampaignForm(prev => ({ ...prev, startAt: e.target.value }))}
                    data-testid="edit-start-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-end">Data Fine</Label>
                  <Input
                    id="edit-end"
                    type="date"
                    value={editCampaignForm.endAt}
                    onChange={(e) => setEditCampaignForm(prev => ({ ...prev, endAt: e.target.value }))}
                    data-testid="edit-end-input"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleCloseEditModal}
                  data-testid="cancel-edit-campaign"
                >
                  Annulla
                </Button>
                <Button 
                  type="submit" 
                  disabled={updateAdvCampaignMutation.isPending}
                  data-testid="update-campaign-submit"
                >
                  {updateAdvCampaignMutation.isPending ? "Aggiornamento..." : "Aggiorna Campagna"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Unified Campaigns Grid */}
      {isLoading ? (
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
      ) : allCampaigns.length === 0 ? (
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
          {allCampaigns.map((campaign: any) => (
            <Card key={`${campaign.source}-${campaign.id}`} className="hover:shadow-md transition-shadow" data-testid={`campaign-${campaign.id}`}>
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
                    className={getTypeColor(campaign.type || 'ORGANIC')}
                    data-testid={`campaign-type-${campaign.id}`}
                  >
                    {campaign.type || 'ORGANIC'}
                  </Badge>
                  {campaign.channel && (
                    <Badge variant="outline" data-testid={`campaign-channel-${campaign.id}`}>
                      {campaign.channel}
                    </Badge>
                  )}
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
                
                {/* Task collegati */}
                {(() => {
                  const campaignTasks = getCampaignTasks(campaign.id);
                  return campaignTasks.length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-muted-foreground">Task collegati:</span>
                        <Badge variant="outline" className="text-xs">
                          {campaignTasks.length}
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        {campaignTasks.slice(0, 2).map((task: any) => (
                          <div key={task.id} className="flex items-center text-xs text-muted-foreground">
                            <CheckSquare className="w-3 h-3 mr-1" />
                            <span className="truncate">{task.title}</span>
                          </div>
                        ))}
                        {campaignTasks.length > 2 && (
                          <div className="text-xs text-muted-foreground">+{campaignTasks.length - 2} altri task...</div>
                        )}
                      </div>
                    </div>
                  );
                })()}
                
                {/* Action buttons - only for ADV campaigns */}
                {campaign.source === 'adv' && (
                  <div className="mt-4 pt-4 border-t flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditCampaign(campaign)}
                      data-testid={`edit-campaign-${campaign.id}`}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Modifica
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}

// Offline Activities Section Component
function OfflineSection() {
  const { user, isAuthenticated } = useAuth();
  const currentOrg = user?.organizations?.[0];
  const currentMembership = currentOrg?.membership;

  // Check if user has marketing access
  const hasMarketingAccess = currentMembership && 
    ['SUPER_ADMIN', 'ORG_ADMIN', 'MARKETER'].includes(currentMembership.role);

  // Fetch offline activities (limit to last 5 for overview)
  const { 
    data: activities = [], 
    isLoading: activitiesLoading,
    error: activitiesError 
  } = useQuery({
    queryKey: ["/api/organizations", currentOrg?.id, "offline-activities"],
    enabled: !!currentOrg?.id && isAuthenticated && hasMarketingAccess,
    retry: false,
  });

  const activityTypes = [
    { value: "FIERA", label: "Fiera", color: "bg-blue-100 text-blue-800" },
    { value: "EVENTO", label: "Evento", color: "bg-green-100 text-green-800" },
    { value: "STAMPA", label: "Stampa", color: "bg-purple-100 text-purple-800" },
    { value: "PR", label: "PR", color: "bg-pink-100 text-pink-800" },
    { value: "SPONSORSHIP", label: "Sponsorizzazione", color: "bg-orange-100 text-orange-800" },
    { value: "ALTRO", label: "Altro", color: "bg-slate-100 text-slate-800" }
  ];

  const getActivityTypeInfo = (type: string) => {
    return activityTypes.find(t => t.value === type) || { label: type, color: "bg-gray-100 text-gray-800" };
  };

  if (activitiesLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (activitiesError) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground">Errore nel caricamento delle attività offline</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Attività Marketing Offline</h2>
          <p className="text-sm text-gray-600">Gestisci fiere, eventi, PR e altre attività offline</p>
        </div>
        <Link href="/marketing/offline">
          <Button className="flex items-center space-x-2" data-testid="view-all-offline-activities">
            <MapPin className="w-4 h-4" />
            <span>Vedi tutte</span>
          </Button>
        </Link>
      </div>

      {(activities as any[]).length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <MapPin className="w-12 h-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Nessuna attività offline</h3>
            <p className="text-gray-600 text-center mb-4">
              Inizia creando la tua prima attività di marketing offline
            </p>
            <Link href="/marketing/offline">
              <Button data-testid="create-first-offline-activity">
                Crea prima attività
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {(activities as any[]).slice(0, 3).map((activity: any) => {
            const typeInfo = getActivityTypeInfo(activity.type);
            return (
              <Card key={activity.id} data-testid={`offline-activity-card-${activity.id}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-base">{activity.title}</CardTitle>
                      <div className="flex items-center space-x-3">
                        <Badge className={typeInfo.color}>
                          {typeInfo.label}
                        </Badge>
                        <div className="flex items-center text-xs text-gray-500">
                          <CalendarIcon className="w-3 h-3 mr-1" />
                          {format(new Date(activity.activityDate), 'dd MMM yyyy', { locale: it })}
                        </div>
                        {activity.budget && (
                          <div className="flex items-center text-xs text-gray-500">
                            <Euro className="w-3 h-3 mr-1" />
                            €{(activity.budget / 100).toLocaleString()}
                          </div>
                        )}
                      </div>
                    </div>
                    {activity.taskId && (
                      <Badge variant="outline" className="text-green-600 border-green-200 text-xs">
                        Task collegato
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                {activity.description && (
                  <CardContent className="pt-0">
                    <p className="text-sm text-gray-600 line-clamp-2">{activity.description}</p>
                  </CardContent>
                )}
              </Card>
            );
          })}
          
          {(activities as any[]).length > 3 && (
            <Card className="border-dashed">
              <CardContent className="text-center py-4">
                <Link href="/marketing/offline">
                  <Button variant="ghost" className="text-sm" data-testid="view-more-offline-activities">
                    Visualizza altre {(activities as any[]).length - 3} attività...
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </>
  );
}

export default function Marketing() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const currentOrg = user?.organizations?.[0];
  const currentMembership = currentOrg?.membership;

  // Check if user has marketing access
  const hasMarketingAccess = currentMembership && 
    ['SUPER_ADMIN', 'ORG_ADMIN', 'MARKETER'].includes(currentMembership.role);

  // Handle auth redirects
  useEffect(() => {
    if (!isAuthenticated && !authLoading) {
      toast({
        title: "Accesso richiesto",
        description: "Effettua il login per accedere alla sezione Marketing",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, authLoading, toast]);

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

  return (
    <MainLayout title="Marketing" icon={Megaphone}>
      <div data-testid="marketing-content">
        {/* Marketing Navigation Tabs */}
        <Tabs defaultValue="overview" className="mb-6">
          <TabsList className="grid w-fit grid-cols-4" data-testid="marketing-tabs">
            <TabsTrigger value="overview" data-testid="tab-overview">
              Overview
            </TabsTrigger>
            <TabsTrigger value="post-organici" data-testid="tab-post-organici">
              Post Organici
            </TabsTrigger>
            <TabsTrigger value="campagne" data-testid="tab-campagne">
              Campagne
            </TabsTrigger>
            <TabsTrigger value="offline" data-testid="tab-offline">
              Offline
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview">
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                Panoramica Marketing - Dashboard completa sarà disponibile prossimamente
              </p>
            </div>
          </TabsContent>
          
          <TabsContent value="post-organici">
            <PostOrganiciSection />
          </TabsContent>

          <TabsContent value="campagne">
            <CampagneSection />
          </TabsContent>

          <TabsContent value="offline">
            <OfflineSection />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}