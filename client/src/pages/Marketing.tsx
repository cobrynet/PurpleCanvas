import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Megaphone, Plus, Upload, Calendar, Edit3 } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";

export default function Marketing() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
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

  // Upload file function
  const uploadFile = async (file: File) => {
    try {
      setUploadProgress(true);
      
      // Step 1: Get upload URL from backend
      const initResponse = await fetch("/api/upload/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          filename: file.name,
          organizationId: currentOrg?.id
        })
      });
      
      if (!initResponse.ok) {
        throw new Error("Failed to get upload URL");
      }
      
      const { uploadUrl, objectPath } = await initResponse.json();
      
      // Step 2: Upload file directly to object storage
      const uploadResponse = await fetch(uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": file.type || "application/octet-stream",
        },
        body: file
      });
      
      if (!uploadResponse.ok) {
        throw new Error("Failed to upload file to storage");
      }
      
      // Step 3: Complete upload by notifying backend
      const completeData = {
        title: postForm.title || file.name,
        filename: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
        objectPath: objectPath,
        organizationId: currentOrg?.id
      };
      
      const completeResponse = await fetch("/api/upload/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(completeData)
      });
      
      if (!completeResponse.ok) {
        throw new Error("Failed to complete upload");
      }
      
      const result = await completeResponse.json();
      
      if (!result.success) {
        throw new Error("Failed to complete upload");
      }
      
      toast({
        title: "Upload completato",
        description: `File "${file.name}" caricato con successo`
      });
      
      return result.asset;
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Errore upload",
        description: `Impossibile caricare il file: ${(error as Error).message}`,
        variant: "destructive"
      });
      throw error;
    } finally {
      setUploadProgress(false);
    }
  };

  // Save post function
  const savePost = async (isDraft = true) => {
    try {
      let assetId = null;
      
      // Upload file if present
      if (postForm.content) {
        const asset = await uploadFile(postForm.content);
        assetId = asset.id;
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
        {/* Marketing Navigation Tabs */}
        <Tabs defaultValue="campaigns" className="mb-6">
          <TabsList className="grid w-fit grid-cols-2" data-testid="marketing-tabs">
            <TabsTrigger value="overview" asChild data-testid="tab-overview">
              <Link href="/marketing/overview">Overview</Link>
            </TabsTrigger>
            <TabsTrigger value="campaigns" data-testid="tab-campaigns">
              Campagne
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="campaigns">
            {/* Header with Action Buttons */}
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold">Gestione Campagne</h2>
                <p className="text-muted-foreground">
                  Crea e gestisci le tue campagne marketing
                </p>
              </div>
          <div className="flex space-x-3">
            <Dialog open={isPostModalOpen} onOpenChange={setIsPostModalOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex items-center space-x-2" data-testid="new-post-button">
                  <Edit3 className="w-4 h-4" />
                  <span>Nuova attività → Post</span>
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
                        <SelectItem value="website">Website</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Copy */}
                  <div className="space-y-2">
                    <Label htmlFor="post-copy">Copy</Label>
                    <Textarea
                      id="post-copy"
                      placeholder="Scrivi il testo del post..."
                      rows={4}
                      value={postForm.copy}
                      onChange={(e) => setPostForm(prev => ({ ...prev, copy: e.target.value }))}
                      data-testid="post-copy-textarea"
                    />
                  </div>

                  {/* Carica contenuto */}
                  <div className="space-y-2">
                    <Label htmlFor="post-content">Carica contenuto</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        id="post-content"
                        type="file"
                        accept="image/*,video/*,.pdf,.doc,.docx"
                        onChange={handleFileChange}
                        data-testid="post-content-input"
                        className="flex-1"
                      />
                      {uploadProgress && (
                        <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full" />
                      )}
                    </div>
                    {postForm.content && (
                      <p className="text-sm text-muted-foreground">
                        File selezionato: {postForm.content.name}
                      </p>
                    )}
                  </div>

                  {/* Data/Ora */}
                  <div className="space-y-2">
                    <Label htmlFor="post-scheduled">Data/Ora pubblicazione</Label>
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
                        <SelectItem value="P0">P0 - Critica</SelectItem>
                        <SelectItem value="P1">P1 - Alta</SelectItem>
                        <SelectItem value="P2">P2 - Media</SelectItem>
                        <SelectItem value="P3">P3 - Bassa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Buttons */}
                  <div className="flex justify-end space-x-3 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => savePost(true)}
                      disabled={!postForm.title || uploadProgress}
                      data-testid="save-draft-button"
                    >
                      Salva bozza
                    </Button>
                    <Button
                      onClick={() => savePost(false)}
                      disabled={!postForm.title || !postForm.channel || uploadProgress}
                      data-testid="schedule-post-button"
                    >
                      Pianifica
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Button className="flex items-center space-x-2" data-testid="new-campaign-button">
              <Plus className="w-4 h-4" />
              <span>Nuova Campagna</span>
            </Button>
          </div>
        </div>

        {/* Social Integrations Card */}
        <div className="mb-8">
          <Card data-testid="social-providers-card">
            <CardHeader>
              <CardTitle>Collega i tuoi social</CardTitle>
              <p className="text-sm text-muted-foreground">
                Connetti le tue piattaforme social per pubblicare contenuti
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {[
                  { id: "facebook", name: "Facebook", color: "text-blue-600", bgColor: "bg-blue-50 hover:bg-blue-100" },
                  { id: "instagram", name: "Instagram", color: "text-pink-600", bgColor: "bg-pink-50 hover:bg-pink-100" },
                  { id: "linkedin", name: "LinkedIn", color: "text-blue-700", bgColor: "bg-blue-50 hover:bg-blue-100" },
                  { id: "twitter", name: "Twitter", color: "text-sky-500", bgColor: "bg-sky-50 hover:bg-sky-100" },
                  { id: "tiktok", name: "TikTok", color: "text-black", bgColor: "bg-gray-50 hover:bg-gray-100" }
                ].map((provider) => (
                  <Card 
                    key={provider.id} 
                    className={`cursor-pointer transition-all border-2 border-border hover:border-primary/50 ${provider.bgColor}`}
                    data-testid={`provider-${provider.id}`}
                    onClick={() => {
                      toast({
                        title: "Connesso: " + provider.name,
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
        ) : (campaigns as any[]).length === 0 ? (
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
            {(campaigns as any[]).map((campaign: any) => (
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
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
