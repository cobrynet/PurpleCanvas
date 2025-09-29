import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Bot, User, AlertTriangle, Phone, Mail, Headphones } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'francesca' | 'system';
  timestamp: string;
  isEscalated?: boolean;
}

interface Conversation {
  id: string;
  messages: Message[];
  status: 'active' | 'escalated' | 'closed';
  escalatedAt?: string;
}

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isEscalating, setIsEscalating] = useState(false);
  const escalatingRef = useRef(false);
  const escalationTimerRef = useRef<number | undefined>();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const GREETING_MESSAGE: Message = {
    id: "greeting",
    text: "Ciao, piacere sono Francesca. Come posso aiutarti?",
    sender: 'francesca',
    timestamp: new Date().toISOString()
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
      const response = await apiRequest("POST", "/api/conversations", { type: "chat_start" });
      
      const newConversation = await response.json() as Conversation;
      setConversation(newConversation);
      setMessages([GREETING_MESSAGE]);
    } catch (error) {
      console.error("Failed to initialize conversation:", error);
      // Fallback to local conversation
      setMessages([GREETING_MESSAGE]);
      setConversation({
        id: `local-${Date.now()}`,
        messages: [GREETING_MESSAGE],
        status: 'active'
      });
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      text: newMessage.trim(),
      sender: 'user',
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setNewMessage("");
    setIsLoading(true);

    try {
      // Send message to API
      const response = await apiRequest("POST", `/api/conversations/${conversation?.id || 'local'}/messages`, { 
        text: userMessage.text,
        sender: 'user'
      });

      // Mock response from Francesca
      setTimeout(() => {
        const francescaResponse = generateFrancescaResponse(userMessage.text);
        setMessages(prev => [...prev, francescaResponse]);
        setIsLoading(false);
        
        // Check if escalation should happen
        if (shouldTriggerEscalation(userMessage.text) && !escalatingRef.current) {
          // Clear any existing escalation timer
          if (escalationTimerRef.current) {
            clearTimeout(escalationTimerRef.current);
          }
          // Schedule new escalation
          escalationTimerRef.current = window.setTimeout(() => {
            triggerEscalation();
          }, 1000);
        }
      }, 1000 + Math.random() * 2000); // Random delay between 1-3 seconds

    } catch (error) {
      console.error("Failed to send message:", error);
      // Fallback to local response
      setTimeout(() => {
        const francescaResponse = generateFrancescaResponse(userMessage.text);
        setMessages(prev => [...prev, francescaResponse]);
        setIsLoading(false);
      }, 1500);
    }
  };

  const generateFrancescaResponse = (userText: string): Message => {
    const lowerText = userText.toLowerCase();
    
    let responseText = "";
    
    if (lowerText.includes("problema") || lowerText.includes("errore") || lowerText.includes("bug")) {
      responseText = "Mi dispiace per il problema che stai riscontrando. Potresti descrivermi più nel dettaglio cosa sta succedendo?";
    } else if (lowerText.includes("aiuto") || lowerText.includes("supporto")) {
      responseText = "Sono qui per aiutarti! Di che tipo di supporto hai bisogno? Posso assisterti con ordini, fatturazione, funzionalità o problemi tecnici.";
    } else if (lowerText.includes("ordine") || lowerText.includes("marketplace")) {
      responseText = "Riguardo al marketplace e agli ordini, posso aiutarti con lo stato degli ordini, modifiche, o problemi di pagamento. Cosa ti serve?";
    } else if (lowerText.includes("urgente") || lowerText.includes("critico") || lowerText.includes("manager")) {
      responseText = "Capisco che sia urgente. Sto escalando la tua richiesta a un nostro specialist che ti contatterà a breve.";
    } else if (lowerText.includes("ciao") || lowerText.includes("salve")) {
      responseText = "Ciao! Sono felice di poterti aiutare oggi. Su cosa posso assisterti?";
    } else if (lowerText.includes("grazie")) {
      responseText = "Prego! È stato un piacere aiutarti. Se hai altre domande, non esitare a scrivermi!";
    } else {
      const responses = [
        "Interessante! Potresti dirmi di più su questo argomento?",
        "Capisco. Lasciami vedere come posso aiutarti al meglio.",
        "Perfetto! Dimmi pure come posso assisterti.",
        "Ho preso nota. C'è qualcos'altro di specifico di cui vuoi parlare?",
        "Ottimo! Sono qui per supportarti in tutto quello di cui hai bisogno."
      ];
      responseText = responses[Math.floor(Math.random() * responses.length)];
    }

    return {
      id: `francesca-${Date.now()}`,
      text: responseText,
      sender: 'francesca',
      timestamp: new Date().toISOString()
    };
  };

  // Count user messages to trigger automatic escalation after N turns
  const getUserMessageCount = (): number => {
    return messages.filter(msg => msg.sender === 'user').length;
  };

  const shouldTriggerEscalation = (userText: string): boolean => {
    // Prevent duplicate escalations - return false if already escalated
    if (conversation?.status === 'escalated') {
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
    if (escalatingRef.current || conversation?.status === 'escalated') {
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

      const escalationMessage: Message = {
        id: `escalation-${Date.now()}`,
        text: "🚨 La tua conversazione è stata escalata al nostro team specializzato. Un manager ti contatterà entro 15 minuti al numero associato al tuo account.",
        sender: 'system',
        timestamp: new Date().toISOString(),
        isEscalated: true
      };

      setMessages(prev => [...prev, escalationMessage]);
      
      if (conversation) {
        setConversation(prev => prev ? {
          ...prev,
          status: 'escalated',
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
                  {conversation?.status === 'escalated' && (
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
                      message.sender === 'user' ? 'flex-row-reverse' : ''
                    }`}
                    data-testid={`message-${message.id}`}
                  >
                    {/* Avatar */}
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-xs ${
                      message.sender === 'user' 
                        ? 'bg-blue-500' 
                        : message.sender === 'system'
                        ? 'bg-orange-500'
                        : 'bg-gradient-to-r from-[#390035] to-[#901d6b]'
                    }`}>
                      {message.sender === 'user' ? (
                        <User className="h-4 w-4" />
                      ) : message.sender === 'system' ? (
                        <AlertTriangle className="h-4 w-4" />
                      ) : (
                        <Bot className="h-4 w-4" />
                      )}
                    </div>

                    {/* Message Bubble */}
                    <div className={`max-w-[70%] ${
                      message.sender === 'user' ? 'items-end' : 'items-start'
                    } flex flex-col`}>
                      <div className={`px-3 py-2 rounded-lg text-sm ${
                        message.sender === 'user'
                          ? 'bg-blue-500 text-white'
                          : message.sender === 'system'
                          ? 'bg-orange-100 text-orange-800 border border-orange-200'
                          : 'bg-white text-gray-800 border'
                      } ${message.isEscalated ? 'border-orange-300 bg-orange-50' : ''}`}>
                        {message.text}
                        {message.isEscalated && (
                          <div className="flex items-center gap-1 mt-2 text-xs text-orange-600">
                            <Phone className="h-3 w-3" />
                            <span>Escalated to specialist</span>
                          </div>
                        )}
                      </div>
                      <span className="text-xs text-gray-500 mt-1">
                        {formatTime(message.timestamp)}
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
                {getUserMessageCount() >= 4 && conversation?.status !== 'escalated' && (
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
                {conversation?.status === 'escalated' && (
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