import { useState } from "react";
import { Check, Plus } from "lucide-react";
import { FaFacebook, FaInstagram, FaLinkedin, FaTwitter, FaTiktok } from "react-icons/fa";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

// Mock social providers
const socialProviders = [
  {
    id: "facebook",
    name: "Facebook",
    icon: FaFacebook,
    color: "text-blue-600",
    bgColor: "bg-blue-50 hover:bg-blue-100"
  },
  {
    id: "instagram", 
    name: "Instagram",
    icon: FaInstagram,
    color: "text-pink-600",
    bgColor: "bg-pink-50 hover:bg-pink-100"
  },
  {
    id: "linkedin",
    name: "LinkedIn", 
    icon: FaLinkedin,
    color: "text-blue-700",
    bgColor: "bg-blue-50 hover:bg-blue-100"
  },
  {
    id: "twitter",
    name: "Twitter",
    icon: FaTwitter,
    color: "text-sky-500", 
    bgColor: "bg-sky-50 hover:bg-sky-100"
  },
  {
    id: "tiktok",
    name: "TikTok",
    icon: FaTiktok,
    color: "text-black",
    bgColor: "bg-gray-50 hover:bg-gray-100"
  }
];

export default function MarketingDataPage() {
  const { toast } = useToast();
  const [connectedProviders, setConnectedProviders] = useState<string[]>([]);

  const handleConnectProvider = (providerId: string, providerName: string) => {
    setConnectedProviders(prev => prev.includes(providerId) ? prev : [...prev, providerId]);
    
    toast({
      title: "Connesso: " + providerName,
      description: `${providerName} è stato connesso con successo`,
    });
  };

  const isConnected = (providerId: string) => connectedProviders.includes(providerId);

  return (
    <div className="p-6">
      <Card data-testid="social-providers-card">
        <CardHeader>
          <CardTitle>Collega i tuoi social</CardTitle>
          <p className="text-sm text-muted-foreground">
            Connetti le tue piattaforme social per pubblicare contenuti
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {socialProviders.map((provider) => {
              const IconComponent = provider.icon;
              const connected = isConnected(provider.id);
              
              return (
                <Card 
                  key={provider.id} 
                  className={`cursor-pointer transition-all border-2 ${
                    connected 
                      ? 'border-green-200 bg-green-50' 
                      : 'border-border hover:border-primary/50'
                  } ${provider.bgColor}`}
                  data-testid={`provider-${provider.id}`}
                  onClick={() => !connected && handleConnectProvider(provider.id, provider.name)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if ((e.key === 'Enter' || e.key === ' ') && !connected) {
                      e.preventDefault();
                      handleConnectProvider(provider.id, provider.name);
                    }
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <IconComponent className={`w-8 h-8 ${provider.color}`} />
                        <div>
                          <h3 className="font-semibold">{provider.name}</h3>
                          {connected && (
                            <Badge 
                              variant="outline" 
                              className="text-green-600 border-green-200"
                              data-testid={`connected-badge-${provider.id}`}
                            >
                              Connesso: {provider.name}
                            </Badge>
                          )}
                        </div>
                      </div>
                      {connected && (
                        <Check className="w-5 h-5 text-green-600" />
                      )}
                    </div>
                    
                    {!connected && (
                      <Button 
                        className="w-full"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleConnectProvider(provider.id, provider.name);
                        }}
                        data-testid={`connect-${provider.id}`}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Connetti {provider.name}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}