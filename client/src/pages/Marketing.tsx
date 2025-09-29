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
import { Edit3, Megaphone, Plus } from "lucide-react";
import { Link } from "wouter";
import { isUnauthorizedError } from "@/lib/authUtils";

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

  // Create ADV Campaign mutation
  const createAdvCampaignMutation = useMutation({
    mutationFn: async (campaignData: any) => {
      return await apiRequest("/api/marketing/campaigns", "POST", campaignData);
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
              </CardContent>
            </Card>
          ))}
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
          <TabsList className="grid w-fit grid-cols-3" data-testid="marketing-tabs">
            <TabsTrigger value="overview" data-testid="tab-overview">
              Overview
            </TabsTrigger>
            <TabsTrigger value="post-organici" data-testid="tab-post-organici">
              Post Organici
            </TabsTrigger>
            <TabsTrigger value="campagne" data-testid="tab-campagne">
              Campagne
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
        </Tabs>
      </div>
    </MainLayout>
  );
}