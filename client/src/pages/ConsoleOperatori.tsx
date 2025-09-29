import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  MessageCircle,
  Clock,
  User,
  CheckCircle,
  ArrowRight,
  X,
  AlertTriangle,
  RefreshCcw,
  Wifi,
  WifiOff,
  Moon
} from "lucide-react";
import type { Conversation, ConversationMessage, AgentPresence } from "@shared/schema";

interface ConversationWithMessages extends Conversation {
  messages: ConversationMessage[];
  customerName?: string;
  lastMessage?: string;
}

interface AgentOption {
  id: string;
  name: string;
  available: boolean;
  currentChats: number;
  maxChats: number;
}

export default function ConsoleOperatori() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [transferAgent, setTransferAgent] = useState<string>("");
  
  // Check if user is SUPER_ADMIN
  const isSuperAdmin = user?.organizations?.some(org => 
    org.membership?.role === 'SUPER_ADMIN'
  );

  if (!isSuperAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Accesso Negato
            </CardTitle>
            <CardDescription>
              Solo i Super Admin possono accedere alla Console Operatori.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Fetch pending conversations
  const { data: conversations = [], isLoading: loadingConversations, refetch } = useQuery<ConversationWithMessages[]>({
    queryKey: ['/api/console/conversations'],
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  // Fetch available agents
  const { data: agents = [] } = useQuery<AgentOption[]>({
    queryKey: ['/api/console/agents'],
  });

  // Fetch current agent presence
  const { data: agentPresence, refetch: refetchPresence } = useQuery<AgentPresence>({
    queryKey: ['/api/console/agents/presence'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Update agent presence mutation
  const updatePresenceMutation = useMutation({
    mutationFn: async (status: 'ONLINE' | 'AWAY' | 'OFFLINE') => {
      const response = await apiRequest('PUT', '/api/console/agents/presence', { status });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Status Aggiornato",
        description: "Il tuo status è stato aggiornato con successo",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/console/agents/presence'] });
      queryClient.invalidateQueries({ queryKey: ['/api/console/agents'] });
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Impossibile aggiornare lo status",
        variant: "destructive",
      });
    }
  });

  // Accept conversation mutation
  const acceptMutation = useMutation({
    mutationFn: async (conversationId: string) => {
      const response = await apiRequest('POST', `/api/console/conversations/${conversationId}/accept`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Conversazione Accettata",
        description: "Hai preso in carico la conversazione",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/console/conversations'] });
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Impossibile accettare la conversazione",
        variant: "destructive",
      });
    }
  });

  // Transfer conversation mutation
  const transferMutation = useMutation({
    mutationFn: async ({ conversationId, agentId }: { conversationId: string; agentId: string }) => {
      const response = await apiRequest('POST', `/api/console/conversations/${conversationId}/transfer`, { agentId });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Conversazione Trasferita",
        description: "La conversazione è stata trasferita con successo",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/console/conversations'] });
      setTransferAgent("");
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Impossibile trasferire la conversazione",
        variant: "destructive",
      });
    }
  });

  // Close conversation mutation
  const closeMutation = useMutation({
    mutationFn: async (conversationId: string) => {
      const response = await apiRequest('POST', `/api/console/conversations/${conversationId}/close`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Conversazione Chiusa",
        description: "La conversazione è stata chiusa",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/console/conversations'] });
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Impossibile chiudere la conversazione",
        variant: "destructive",
      });
    }
  });

  const handleAccept = (conversationId: string) => {
    acceptMutation.mutate(conversationId);
  };

  const handleTransfer = (conversationId: string) => {
    if (!transferAgent) {
      toast({
        title: "Seleziona Agente",
        description: "Seleziona un agente per trasferire la conversazione",
        variant: "destructive",
      });
      return;
    }
    transferMutation.mutate({ conversationId, agentId: transferAgent });
  };

  const handleClose = (conversationId: string) => {
    closeMutation.mutate(conversationId);
  };

  const formatTime = (timestamp: string | Date | null | undefined) => {
    if (!timestamp) return 'N/A';
    const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
    return date.toLocaleString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="destructive">Pending</Badge>;
      case 'OPEN':
        return <Badge variant="default">Aperta</Badge>;
      case 'CLOSED':
        return <Badge variant="secondary">Chiusa</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'P0': return 'text-red-600';
      case 'P1': return 'text-orange-500';
      case 'P2': return 'text-yellow-500';
      case 'P3': return 'text-green-600';
      default: return 'text-gray-500';
    }
  };

  const getPresenceIcon = (status?: string) => {
    switch (status) {
      case 'ONLINE':
        return <Wifi className="h-4 w-4 text-green-600" />;
      case 'AWAY':
        return <Moon className="h-4 w-4 text-yellow-500" />;
      case 'OFFLINE':
        return <WifiOff className="h-4 w-4 text-gray-500" />;
      default:
        return <WifiOff className="h-4 w-4 text-gray-500" />;
    }
  };

  const getPresenceLabel = (status?: string) => {
    switch (status) {
      case 'ONLINE': return 'Online';
      case 'AWAY': return 'Assente';
      case 'OFFLINE': return 'Offline';
      default: return 'Offline';
    }
  };

  const pendingConversations = conversations.filter(conv => conv.status === 'PENDING');
  const activeConversations = conversations.filter(conv => conv.status === 'OPEN');

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Console Operatori</h1>
          <p className="text-muted-foreground">
            Gestisci le conversazioni dei clienti e assegna gli agenti
          </p>
        </div>
        <div className="flex items-center gap-4">
          {/* Agent Presence Toggle */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Status:</span>
            <Select
              value={agentPresence?.status || 'OFFLINE'}
              onValueChange={(status: 'ONLINE' | 'AWAY' | 'OFFLINE') => 
                updatePresenceMutation.mutate(status)
              }
              disabled={updatePresenceMutation.isPending}
            >
              <SelectTrigger 
                className="w-32 h-8 text-xs"
                data-testid="agent-presence-select"
              >
                <div className="flex items-center gap-1">
                  {getPresenceIcon(agentPresence?.status)}
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ONLINE" data-testid="status-online">
                  <div className="flex items-center gap-2">
                    <Wifi className="h-3 w-3 text-green-600" />
                    Online
                  </div>
                </SelectItem>
                <SelectItem value="AWAY" data-testid="status-away">
                  <div className="flex items-center gap-2">
                    <Moon className="h-3 w-3 text-yellow-500" />
                    Assente
                  </div>
                </SelectItem>
                <SelectItem value="OFFLINE" data-testid="status-offline">
                  <div className="flex items-center gap-2">
                    <WifiOff className="h-3 w-3 text-gray-500" />
                    Offline
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => refetch()}
            disabled={loadingConversations}
            data-testid="refresh-conversations"
          >
            <RefreshCcw className={`h-4 w-4 mr-2 ${loadingConversations ? 'animate-spin' : ''}`} />
            Aggiorna
          </Button>
        </div>
      </div>

      <Tabs defaultValue="pending" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Conversazioni Pending ({pendingConversations.length})
          </TabsTrigger>
          <TabsTrigger value="active" className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            Conversazioni Attive ({activeConversations.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {loadingConversations ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="h-3 bg-gray-200 rounded"></div>
                      <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : pendingConversations.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <MessageCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Nessuna conversazione in attesa</h3>
                <p className="text-muted-foreground text-center">
                  Tutte le conversazioni sono state gestite o non ci sono nuove richieste.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {pendingConversations.map((conversation) => (
                <Card key={conversation.id} className="border-orange-200 bg-orange-50/50">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-sm font-medium">
                          {conversation.customerName || `Cliente ${conversation.userId?.slice(-4) || 'Unknown'}`}
                        </CardTitle>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(conversation.status || 'OPEN')}
                          <span className={`text-xs font-medium ${getPriorityColor(conversation.priority || 'P2')}`}>
                            {conversation.priority || 'P2'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <CardDescription className="text-xs">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatTime(conversation.createdAt)}
                      </div>
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {conversation.lastMessage && (
                      <div className="bg-white rounded-lg p-3 border">
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {conversation.lastMessage}
                        </p>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleAccept(conversation.id)}
                        disabled={acceptMutation.isPending}
                        className="flex-1"
                        data-testid={`accept-conversation-${conversation.id}`}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Accept
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Select 
                          value={selectedConversation === conversation.id ? transferAgent : ""}
                          onValueChange={(value) => {
                            setSelectedConversation(conversation.id);
                            setTransferAgent(value);
                          }}
                        >
                          <SelectTrigger className="flex-1" data-testid={`transfer-agent-select-${conversation.id}`}>
                            <SelectValue placeholder="Seleziona agente" />
                          </SelectTrigger>
                          <SelectContent>
                            {agents.filter(agent => agent.available).map((agent) => (
                              <SelectItem key={agent.id} value={agent.id}>
                                <div className="flex items-center justify-between w-full">
                                  <span>{agent.name}</span>
                                  <span className="text-xs text-gray-500 ml-2">
                                    {agent.currentChats}/{agent.maxChats}
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleTransfer(conversation.id)}
                          disabled={transferMutation.isPending || !transferAgent || selectedConversation !== conversation.id}
                          className="flex-1"
                          data-testid={`transfer-conversation-${conversation.id}`}
                        >
                          <ArrowRight className="h-4 w-4 mr-1" />
                          Transfer
                        </Button>

                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleClose(conversation.id)}
                          disabled={closeMutation.isPending}
                          data-testid={`close-conversation-${conversation.id}`}
                        >
                          <X className="h-4 w-4" />
                          Close
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="active" className="space-y-4">
          {activeConversations.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <MessageCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Nessuna conversazione attiva</h3>
                <p className="text-muted-foreground text-center">
                  Non ci sono conversazioni attualmente in corso.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {activeConversations.map((conversation) => (
                <Card key={conversation.id} className="border-green-200 bg-green-50/50">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-sm font-medium">
                          {conversation.customerName || `Cliente ${conversation.userId?.slice(-4) || 'Unknown'}`}
                        </CardTitle>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(conversation.status || 'OPEN')}
                          {conversation.assigneeId && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <User className="h-3 w-3" />
                              Assegnata
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <CardDescription className="text-xs">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatTime(conversation.updatedAt || conversation.createdAt)}
                      </div>
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent>
                    {conversation.lastMessage && (
                      <div className="bg-white rounded-lg p-3 border">
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {conversation.lastMessage}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}