import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Bot, User, AlertTriangle, Phone, Mail, Headphones } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Conversation, ConversationMessage } from "@shared/schema";

// Local message interface for chat UI - compatible with ConversationMessage
interface ChatMessage {
  id: string;
  content: string;
  senderType: 'user' | 'francesca' | 'system';
  createdAt: string;
  isEscalated?: boolean; // UI-only flag
}

// Local conversation interface for chat UI  
interface ChatConversation {
  id: string;
  status: 'OPEN' | 'PENDING' | 'CLOSED' | 'ESCALATED';
  escalatedAt?: string;
}

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversation, setConversation] = useState<ChatConversation | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isEscalating, setIsEscalating] = useState(false);
  const escalatingRef = useRef(false);
  const escalationTimerRef = useRef<number | undefined>();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const GREETING_MESSAGE: ChatMessage = {
    id: "greeting",
    content: "Ciao, piacere sono Francesca. Come posso aiutarti?",
    senderType: 'francesca',
    createdAt: new Date().toISOString()
  };

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Initialize conversation with greeting when first opened
      initializeConversation();
    }
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const initializeConversation = async () => {
    try {
      const response = await apiRequest("POST", "/api/conversations", { 
        channel: "WIDGET",
        subject: "Chat Assistenza"
      });
      
      const newConversation = await response.json() as Conversation;
      setConversation({
        id: newConversation.id,
        status: newConversation.status || 'OPEN',
        escalatedAt: newConversation.escalatedAt ? (typeof newConversation.escalatedAt === 'string' ? newConversation.escalatedAt : newConversation.escalatedAt.toISOString()) : undefined
      });
      setMessages([GREETING_MESSAGE]);
    } catch (error) {
      console.error("Failed to initialize conversation:", error);
      // Show error message in chat instead of fallback
      setMessages([{
        id: 'error-init',
        content: 'Errore nel connettersi al servizio. Riprova più tardi.',
        senderType: 'system',
        createdAt: new Date().toISOString()
      }]);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      content: newMessage.trim(),
      senderType: 'user',
      createdAt: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setNewMessage("");
    setIsLoading(true);

    try {
      // Send message to API
      if (!conversation?.id) {
        throw new Error("No conversation initialized");
      }
      
      const response = await apiRequest("POST", `/api/conversations/${conversation.id}/messages`, { 
        content: userMessage.content,
        senderType: 'user'
      });

      // Check if escalation should happen
      if (shouldTriggerEscalation(userMessage.content) && !escalatingRef.current) {
        // Clear any existing escalation timer
        if (escalationTimerRef.current) {
          clearTimeout(escalationTimerRef.current);
        }
        // Schedule new escalation
        escalationTimerRef.current = window.setTimeout(() => {
          triggerEscalation();
        }, 1000);
      }

      // Generate automatic response from Francesca
      setTimeout(async () => {
        try {
          const francescaResponse = generateFrancescaResponse(userMessage.content);
          
          // Send Francesca's response to API
          await apiRequest("POST", `/api/conversations/${conversation.id}/messages`, {
            content: francescaResponse.content,
            senderType: 'francesca'
          });
          
          // Add to local state
          setMessages(prev => [...prev, francescaResponse]);
        } catch (error) {
          console.error("Failed to send Francesca response:", error);
          // Add response anyway for UX
          const francescaResponse = generateFrancescaResponse(userMessage.content);
          setMessages(prev => [...prev, francescaResponse]);
        }
        setIsLoading(false);
      }, 1000 + Math.random() * 2000); // Random delay between 1-3 seconds

    } catch (error) {
      console.error("Failed to send message:", error);
      setIsLoading(false);
      
      // Show error message to user
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        content: 'Errore nell\'invio del messaggio. Per favore riprova.',
        senderType: 'system',
        createdAt: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const generateFrancescaResponse = (userText: string): ChatMessage => {
    const lowerText = userText.toLowerCase();
    
    let responseText = "";
    
    // Problemi tecnici
    if (lowerText.includes("problema") || lowerText.includes("errore") || lowerText.includes("bug") || lowerText.includes("non funziona")) {
      responseText = "Mi dispiace per il problema che stai riscontrando. Potresti descrivermi più nel dettaglio cosa sta succedendo? Ad esempio, quando si verifica l'errore e che tipo di messaggio vedi?";
    
    // Marketing e campagne - SPECIFICO PRIMA
    } else if (lowerText.includes("marketing") || lowerText.includes("campagna") || lowerText.includes("lead") || lowerText.includes("pubblicità")) {
      responseText = "Ottimo! Vedo che hai domande sul marketing. Posso aiutarti con:\n\n• 📊 Gestione campagne e analytics\n• 👥 Generazione e qualifica lead\n• 📈 Ottimizzazione performance\n• 🎯 Strategie pubblicitarie\n\nCosa ti interessa di più?";
    
    // Vendite e CRM - SPECIFICO PRIMA
    } else if (lowerText.includes("vendita") || lowerText.includes("cliente") || lowerText.includes("crm") || lowerText.includes("opportunità")) {
      responseText = "Perfetto! Per quanto riguarda vendite e CRM, posso supportarti con:\n\n• 🤝 Gestione opportunità di vendita\n• 📋 Organizzazione pipeline clienti\n• 📞 Follow-up e attività\n• 📊 Report e analytics\n\nSu quale aspetto vuoi concentrarti?";
    
    // Ordini e marketplace - SPECIFICO PRIMA
    } else if (lowerText.includes("ordine") || lowerText.includes("marketplace") || lowerText.includes("servizio") || lowerText.includes("acquisto")) {
      responseText = "Riguardo al marketplace e agli ordini, posso aiutarti con:\n\n• 📋 Stato e tracking ordini\n• 🔄 Modifiche e cancellazioni\n• 💳 Problemi di pagamento\n• 🛍️ Catalogo servizi disponibili\n\nCosa ti serve?";
    
    // Account e fatturazione - SPECIFICO PRIMA
    } else if (lowerText.includes("account") || lowerText.includes("fattura") || lowerText.includes("pagamento") || lowerText.includes("abbonamento")) {
      responseText = "Per questioni di account e fatturazione, posso assisterti con:\n\n• 💳 Metodi di pagamento\n• 📄 Fatture e ricevute\n• ⚙️ Impostazioni account\n• 💰 Piani e abbonamenti\n\nDi quale servizio hai bisogno?";
    
    // Richieste di aiuto generale - GENERICO DOPO
    } else if (lowerText.includes("aiuto") || lowerText.includes("supporto") || (lowerText.includes("come") && !lowerText.includes("marketing") && !lowerText.includes("vendita") && !lowerText.includes("ordine"))) {
      responseText = "Sono qui per aiutarti! Posso assisterti con: \n\n• 📦 Ordini e marketplace\n• 💳 Fatturazione e pagamenti\n• ⚙️ Funzionalità della piattaforma\n• 🔧 Problemi tecnici\n\nDi cosa hai bisogno nello specifico?";
    
    // Urgenze e escalation
    } else if (lowerText.includes("urgente") || lowerText.includes("critico") || lowerText.includes("manager") || lowerText.includes("reclamo")) {
      responseText = "Capisco che sia urgente. Sto escalando immediatamente la tua richiesta al nostro team di specialist che ti contatteranno entro 15 minuti. Nel frattempo, puoi fornirmi più dettagli sul problema?";
    
    // Saluti
    } else if (lowerText.includes("ciao") || lowerText.includes("salve") || lowerText.includes("buongiorno") || lowerText.includes("buonasera")) {
      responseText = "Ciao! Sono Francesca, la tua assistente virtuale di Stratikey 👋\n\nSono qui per aiutarti con qualsiasi cosa tu abbia bisogno. Puoi chiedermi di:\n\n• Marketing e campagne\n• Vendite e CRM\n• Ordini e servizi\n• Supporto tecnico\n\nCome posso aiutarti oggi?";
    
    // Ringraziamenti
    } else if (lowerText.includes("grazie") || lowerText.includes("perfetto") || lowerText.includes("ottimo")) {
      responseText = "Sono felice di esserti stata utile! 😊 Se hai altre domande o hai bisogno di assistenza in futuro, non esitare a scrivermi. Buona giornata!";
    
    // Richieste di informazioni generiche
    } else if (lowerText.includes("info") || lowerText.includes("sapere") || lowerText.includes("spiegare")) {
      responseText = "Certamente! Sono qui per fornirti tutte le informazioni di cui hai bisogno. Stratikey offre:\n\n• 🚀 Piattaforma marketing completa\n• 📊 CRM e gestione vendite\n• 🛍️ Marketplace servizi integrato\n• 📈 Analytics e reporting avanzati\n\nSu cosa vorresti saperne di più?";
    
    // Risposte per messaggi non specifici - molto più utili
    } else {
      const contextualResponses = [
        "Interessante! Per aiutarti al meglio, potresti dirmi se la tua domanda riguarda:\n\n• 📊 Marketing e campagne\n• 💼 Vendite e CRM\n• 🛍️ Marketplace e ordini\n• ⚙️ Supporto tecnico",
        "Capisco! Per indirizzarti correttamente, hai bisogno di supporto per:\n\n• 🎯 Gestione campagne marketing\n• 👥 Organizzazione clienti e lead\n• 📦 Servizi e ordini\n• 🔧 Problemi tecnici della piattaforma?",
        "Perfetto! Dimmi pure di cosa hai bisogno. Posso assisterti in diverse aree:\n\n• 📈 Strategie marketing\n• 🤝 Gestione vendite\n• 🛒 Marketplace servizi\n• 💡 Funzionalità piattaforma",
        "Sono qui per te! Per offrirti il miglior supporto, la tua richiesta è relativa a:\n\n• 🚀 Marketing automation\n• 📋 Pipeline vendite\n• 🛍️ Ordini e fatturazione\n• 🆘 Assistenza tecnica?"
      ];
      responseText = contextualResponses[Math.floor(Math.random() * contextualResponses.length)];
    }

    return {
      id: `francesca-${Date.now()}`,
      content: responseText,
      senderType: 'francesca',
      createdAt: new Date().toISOString()
    };
  };

  // Count user messages to trigger automatic escalation after N turns
  const getUserMessageCount = (): number => {
    return messages.filter(msg => msg.senderType === 'user').length;
  };

  const shouldTriggerEscalation = (userText: string): boolean => {
    // Prevent duplicate escalations - return false if already escalated
    if (conversation?.status === 'ESCALATED') {
      return false;
    }
    
    const escalationKeywords = [
      "urgente", "critico", "manager", "direttore", "escalation", 
      "inaccettabile", "reclamo", "disdetta", "rimborso", "legale"
    ];
    
    // Check for keywords
    const hasKeywords = escalationKeywords.some(keyword => 
      userText.toLowerCase().includes(keyword)
    );
    
    // Check for automatic escalation after 6 user messages
    const userMessageCount = getUserMessageCount();
    const shouldAutoEscalate = userMessageCount >= 6;
    
    return hasKeywords || shouldAutoEscalate;
  };

  const triggerEscalation = async () => {
    // Atomic synchronous guard to prevent race conditions
    if (escalatingRef.current || conversation?.status === 'ESCALATED') {
      return;
    }

    escalatingRef.current = true;
    setIsEscalating(true);
    
    // Clear any pending escalation timer
    if (escalationTimerRef.current) {
      clearTimeout(escalationTimerRef.current);
      escalationTimerRef.current = undefined;
    }

    try {
      // Update conversation status
      if (conversation) {
        await apiRequest("POST", `/api/conversations/${conversation.id}/escalate`);
      }

      const escalationMessage: ChatMessage = {
        id: `escalation-${Date.now()}`,
        content: "🚨 La tua conversazione è stata escalata al nostro team specializzato. Un manager ti contatterà entro 15 minuti al numero associato al tuo account.",
        senderType: 'system',
        createdAt: new Date().toISOString(),
        isEscalated: true
      };

      setMessages(prev => [...prev, escalationMessage]);
      
      if (conversation) {
        setConversation(prev => prev ? {
          ...prev,
          status: 'ESCALATED',
          escalatedAt: new Date().toISOString()
        } : null);
      }

      toast({
        title: "Conversazione Escalata",
        description: "Un nostro specialist ti contatterà a breve",
        duration: 5000,
      });

    } catch (error) {
      console.error("Failed to escalate conversation:", error);
    } finally {
      escalatingRef.current = false;
      setIsEscalating(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('it-IT', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setUnreadCount(0);
    }
  };

  return (
    <>
      {/* Chat Widget Button */}
      <div className="fixed bottom-4 right-4 z-50">
        {!isOpen && (
          <Button
            onClick={toggleChat}
            className="h-14 w-14 rounded-full bg-gradient-to-r from-[#390035] to-[#901d6b] hover:from-[#4a0043] hover:to-[#a5206b] shadow-lg transition-all duration-200 hover:scale-105"
            data-testid="chat-widget-button"
          >
            <MessageCircle className="h-6 w-6 text-white" />
            {unreadCount > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 flex items-center justify-center text-xs"
              >
                {unreadCount}
              </Badge>
            )}
          </Button>
        )}

        {/* Chat Window */}
        {isOpen && (
          <Card className="w-80 h-96 shadow-xl border-2 border-primary/20 animate-in slide-in-from-bottom-2 duration-200">
            <CardHeader className="pb-3 bg-gradient-to-r from-[#390035] to-[#901d6b] text-white rounded-t-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bot className="h-5 w-5" />
                  <div>
                    <CardTitle className="text-sm font-medium text-white">Francesca</CardTitle>
                    <p className="text-xs text-white/80">Assistente Virtuale</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {conversation?.status === 'ESCALATED' && (
                    <AlertTriangle className="h-4 w-4 text-yellow-300" />
                  )}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={toggleChat}
                    className="h-8 w-8 p-0 text-white hover:bg-white/20"
                    data-testid="chat-close-button"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0 flex flex-col h-80">
              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex items-start gap-2 ${
                      message.senderType === 'user' ? 'flex-row-reverse' : ''
                    }`}
                    data-testid={`message-${message.id}`}
                  >
                    {/* Avatar */}
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-xs ${
                      message.senderType === 'user' 
                        ? 'bg-blue-500' 
                        : message.senderType === 'system'
                        ? 'bg-orange-500'
                        : 'bg-gradient-to-r from-[#390035] to-[#901d6b]'
                    }`}>
                      {message.senderType === 'user' ? (
                        <User className="h-4 w-4" />
                      ) : message.senderType === 'system' ? (
                        <AlertTriangle className="h-4 w-4" />
                      ) : (
                        <Bot className="h-4 w-4" />
                      )}
                    </div>

                    {/* Message Bubble */}
                    <div className={`max-w-[70%] ${
                      message.senderType === 'user' ? 'items-end' : 'items-start'
                    } flex flex-col`}>
                      <div className={`px-3 py-2 rounded-lg text-sm whitespace-pre-wrap ${
                        message.senderType === 'user'
                          ? 'bg-blue-500 text-white'
                          : message.senderType === 'system'
                          ? 'bg-orange-100 text-orange-800 border border-orange-200'
                          : 'bg-white text-gray-800 border'
                      } ${message.isEscalated ? 'border-orange-300 bg-orange-50' : ''}`}>
                        {message.content}
                        {message.isEscalated && (
                          <div className="flex items-center gap-1 mt-2 text-xs text-orange-600">
                            <Phone className="h-3 w-3" />
                            <span>Escalated to specialist</span>
                          </div>
                        )}
                      </div>
                      <span className="text-xs text-gray-500 mt-1">
                        {formatTime(message.createdAt)}
                      </span>
                    </div>
                  </div>
                ))}

                {/* Loading indicator */}
                {isLoading && (
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#390035] to-[#901d6b] flex items-center justify-center">
                      <Bot className="h-4 w-4 text-white" />
                    </div>
                    <div className="bg-white border rounded-lg px-3 py-2">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Escalation Buttons - Show after 4+ user messages if not escalated */}
                {getUserMessageCount() >= 4 && conversation?.status !== 'ESCALATED' && (
                  <div className="sticky bottom-0 bg-white border-t border-gray-200 p-3 mx-4 mb-2 rounded-lg shadow-sm">
                    <p className="text-xs text-gray-600 mb-2 text-center">
                      Hai bisogno di ulteriore assistenza?
                    </p>
                    <div className="flex gap-2 justify-center">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => triggerEscalation()}
                        disabled={isEscalating}
                        className="flex items-center gap-1 text-xs"
                        data-testid="escalate-to-operator"
                      >
                        <Headphones className="h-3 w-3" />
                        Parla con operatore
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => triggerEscalation()}
                        disabled={isEscalating}
                        className="flex items-center gap-1 text-xs"
                        data-testid="escalate-to-email"
                      >
                        <Mail className="h-3 w-3" />
                        Richiedi email
                      </Button>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="p-3 border-t bg-white">
                <div className="flex gap-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Scrivi un messaggio..."
                    disabled={isLoading}
                    className="flex-1"
                    data-testid="chat-message-input"
                  />
                  <Button 
                    onClick={sendMessage}
                    disabled={!newMessage.trim() || isLoading}
                    size="sm"
                    className="bg-gradient-to-r from-[#390035] to-[#901d6b] hover:from-[#4a0043] hover:to-[#a5206b]"
                    data-testid="chat-send-button"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                {conversation?.status === 'ESCALATED' && (
                  <p className="text-xs text-orange-600 mt-2 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Conversazione escalata - Sarai contattato a breve
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}