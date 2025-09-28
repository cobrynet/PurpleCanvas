import { MessageCircle, Users, Search, Send, Paperclip, Smile } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MainLayout } from "@/components/layout/MainLayout";

export default function Chat() {
  return (
    <MainLayout title="Chat" icon={MessageCircle}>
      <div data-testid="chat-content" className="h-[calc(100vh-8rem)]">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full">
          {/* Conversazioni */}
          <div className="lg:col-span-1">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="w-5 h-5" />
                  <span>Conversazioni</span>
                </CardTitle>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Cerca conversazioni..." 
                    className="pl-10"
                    data-testid="search-conversations"
                  />
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="space-y-2">
                  {[
                    { name: "Team Marketing", lastMessage: "Come procede la campagna?", time: "2 min", unread: 3, active: true },
                    { name: "Cliente Rossi SRL", lastMessage: "Perfetto, grazie!", time: "1h", unread: 0, active: false },
                    { name: "Fornitore XYZ", lastMessage: "Invio preventivo...", time: "3h", unread: 1, active: false },
                  ].map((conv, i) => (
                    <div 
                      key={i}
                      className={`p-3 hover:bg-gray-50 cursor-pointer border-r-2 ${
                        conv.active ? 'bg-purple-50 border-r-purple-500' : 'border-r-transparent'
                      }`}
                      data-testid={`conversation-${i}`}
                    >
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-purple-100 text-purple-600">
                            {conv.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {conv.name}
                            </p>
                            <div className="flex items-center space-x-1">
                              <span className="text-xs text-gray-500">{conv.time}</span>
                              {conv.unread > 0 && (
                                <Badge variant="destructive" className="h-5 w-5 p-0 flex items-center justify-center text-xs">
                                  {conv.unread}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <p className="text-sm text-gray-500 truncate">{conv.lastMessage}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Area Chat */}
          <div className="lg:col-span-3">
            <Card className="h-full flex flex-col">
              {/* Header Chat */}
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-purple-100 text-purple-600">TM</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold">Team Marketing</h3>
                      <p className="text-sm text-muted-foreground">3 membri attivi</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" data-testid="video-call">
                      📹 Video
                    </Button>
                    <Button variant="outline" size="sm" data-testid="voice-call">
                      📞 Chiama
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {/* Messaggi */}
              <CardContent className="flex-1 p-4 overflow-y-auto" data-testid="chat-messages">
                <div className="space-y-4">
                  {[
                    { sender: "Marco", message: "Come procede la nuova campagna Facebook?", time: "10:30", own: false },
                    { sender: "Tu", message: "Ottimo! I risultati sono sopra le aspettative. CTR al 3.2%", time: "10:32", own: true },
                    { sender: "Anna", message: "Fantastico! Possiamo scalare il budget?", time: "10:35", own: false },
                    { sender: "Tu", message: "Assolutamente sì. Propongo di aumentare del 50%", time: "10:37", own: true },
                  ].map((msg, i) => (
                    <div 
                      key={i} 
                      className={`flex ${msg.own ? 'justify-end' : 'justify-start'}`}
                      data-testid={`message-${i}`}
                    >
                      <div className={`max-w-[70%] rounded-lg px-4 py-2 ${
                        msg.own 
                          ? 'bg-purple-600 text-white' 
                          : 'bg-gray-100 text-gray-900'
                      }`}>
                        {!msg.own && (
                          <p className="text-xs font-medium mb-1 opacity-70">{msg.sender}</p>
                        )}
                        <p className="text-sm">{msg.message}</p>
                        <p className={`text-xs mt-1 ${msg.own ? 'text-purple-200' : 'text-gray-500'}`}>
                          {msg.time}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>

              {/* Input Messaggio */}
              <div className="border-t p-4">
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm" data-testid="attach-file">
                    <Paperclip className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" data-testid="emoji-picker">
                    <Smile className="w-4 h-4" />
                  </Button>
                  <Input 
                    placeholder="Scrivi un messaggio..." 
                    className="flex-1"
                    data-testid="message-input"
                  />
                  <Button className="bg-purple-600 hover:bg-purple-700" data-testid="send-message">
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}