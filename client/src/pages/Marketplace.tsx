import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { ShoppingCart, Star, Package, ArrowRight, Tag } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function Marketplace() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const currentOrg = user?.organizations?.[0];
  const currentMembership = currentOrg?.membership;

  // Check if user has marketplace access
  const hasMarketplaceAccess = currentMembership && 
    ['ORG_ADMIN', 'MARKETER', 'SALES'].includes(currentMembership.role);

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

  // Fetch services
  const { 
    data: services = [], 
    isLoading: servicesLoading,
    error: servicesError 
  } = useQuery({
    queryKey: ["/api/services"],
    enabled: isAuthenticated && hasMarketplaceAccess,
    retry: false,
  });

  // Handle errors
  useEffect(() => {
    if (servicesError && isUnauthorizedError(servicesError as Error)) {
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
  }, [servicesError, toast]);

  if (authLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading"/>
      </div>
    );
  }

  if (!hasMarketplaceAccess) {
    return (
      <MainLayout title="Marketplace" icon={ShoppingCart}>
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            Non hai i permessi per accedere al Marketplace.
          </p>
        </div>
      </MainLayout>
    );
  }

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'branding': return 'bg-purple-100 text-purple-800';
      case 'design': return 'bg-pink-100 text-pink-800';
      case 'video': return 'bg-blue-100 text-blue-800';
      case 'foto': return 'bg-green-100 text-green-800';
      case 'stampa': return 'bg-orange-100 text-orange-800';
      case 'marketing': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Mock services for empty state demonstration
  const mockServices = services.length === 0 ? [
    {
      id: '1',
      name: 'Brand Identity Design',
      description: 'Creazione completa della tua identità aziendale: logo, colori, tipografia e linee guida.',
      category: 'branding',
      basePrice: 1500,
      isActive: true
    },
    {
      id: '2',
      name: 'Servizio Fotografico Prodotti',
      description: 'Servizio fotografico professionale per i tuoi prodotti, con ritocco e post-produzione.',
      category: 'foto',
      basePrice: 800,
      isActive: true
    },
    {
      id: '3',
      name: 'Video Promozionale',
      description: 'Realizzazione di video promozionali per social media e campagne advertising.',
      category: 'video',
      basePrice: 2000,
      isActive: true
    },
    {
      id: '4',
      name: 'Stampa Materiale Marketing',
      description: 'Stampa professionale di brochure, volantini, biglietti da visita e materiale promozionale.',
      category: 'stampa',
      basePrice: 300,
      isActive: true
    },
    {
      id: '5',
      name: 'Consulenza Marketing Digitale',
      description: 'Strategia e consulenza per ottimizzare le tue campagne di marketing digitale.',
      category: 'marketing',
      basePrice: 1200,
      isActive: true
    },
    {
      id: '6',
      name: 'Design Sito Web',
      description: 'Progettazione e sviluppo di siti web responsive e ottimizzati per la conversione.',
      category: 'design',
      basePrice: 3000,
      isActive: true
    }
  ] : services;

  return (
    <MainLayout title="Marketplace Servizi" icon={ShoppingCart}>
      <div data-testid="marketplace-content">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold">Marketplace Servizi</h2>
              <p className="text-muted-foreground">
                Scopri e ordina servizi professionali per far crescere il tuo business
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center space-x-4 mb-6">
            <Input 
              placeholder="Cerca servizi..." 
              className="max-w-sm"
              data-testid="search-services"
            />
            <Select>
              <SelectTrigger className="w-48" data-testid="category-filter">
                <SelectValue placeholder="Tutte le categorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutte le categorie</SelectItem>
                <SelectItem value="branding">Brand Identity</SelectItem>
                <SelectItem value="design">Design</SelectItem>
                <SelectItem value="video">Video</SelectItem>
                <SelectItem value="foto">Fotografia</SelectItem>
                <SelectItem value="stampa">Stampa</SelectItem>
                <SelectItem value="marketing">Marketing</SelectItem>
              </SelectContent>
            </Select>
            <Select>
              <SelectTrigger className="w-48" data-testid="price-filter">
                <SelectValue placeholder="Fascia di prezzo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutti i prezzi</SelectItem>
                <SelectItem value="0-500">€0 - €500</SelectItem>
                <SelectItem value="500-1000">€500 - €1.000</SelectItem>
                <SelectItem value="1000-2000">€1.000 - €2.000</SelectItem>
                <SelectItem value="2000+">€2.000+</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Services Grid */}
        {servicesLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-muted rounded w-3/4"></div>
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded"></div>
                    <div className="h-4 bg-muted rounded w-2/3"></div>
                    <div className="h-8 bg-muted rounded w-1/3 mt-4"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="services-grid">
            {mockServices.map((service: any) => (
              <Card key={service.id} className="hover:shadow-lg transition-shadow border-2 hover:border-primary/20" data-testid={`service-${service.id}`}>
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <CardTitle className="text-lg" data-testid={`service-name-${service.id}`}>
                      {service.name}
                    </CardTitle>
                    <Badge 
                      className={getCategoryColor(service.category)}
                      data-testid={`service-category-${service.id}`}
                    >
                      {service.category}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground text-sm" data-testid={`service-description-${service.id}`}>
                    {service.description}
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Rating */}
                    <div className="flex items-center space-x-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      ))}
                      <span className="text-sm text-muted-foreground ml-2">(4.8)</span>
                    </div>

                    {/* Price */}
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-sm text-muted-foreground">A partire da</span>
                        <div className="flex items-center space-x-1">
                          <Tag className="w-4 h-4 text-primary" />
                          <span className="text-2xl font-bold text-primary" data-testid={`service-price-${service.id}`}>
                            €{service.basePrice.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Features */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Incluso:</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li className="flex items-center space-x-2">
                          <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                          <span>Consegna in 5-7 giorni lavorativi</span>
                        </li>
                        <li className="flex items-center space-x-2">
                          <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                          <span>2 revisioni gratuite</span>
                        </li>
                        <li className="flex items-center space-x-2">
                          <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                          <span>Supporto post-consegna</span>
                        </li>
                      </ul>
                    </div>

                    {/* Actions */}
                    <div className="flex space-x-2 pt-4">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        data-testid={`service-details-${service.id}`}
                      >
                        Dettagli
                      </Button>
                      <Button 
                        size="sm" 
                        className="flex-1 bg-primary hover:bg-primary/90"
                        data-testid={`service-order-${service.id}`}
                      >
                        <ShoppingCart className="w-4 h-4 mr-1" />
                        Ordina
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Featured Categories */}
        <div className="mt-12">
          <h3 className="text-xl font-bold mb-6">Categorie Popolari</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4" data-testid="featured-categories">
            {[
              { name: 'Brand Identity', icon: '🎨', count: 15 },
              { name: 'Fotografia', icon: '📷', count: 8 },
              { name: 'Video Production', icon: '🎬', count: 12 },
              { name: 'Web Design', icon: '💻', count: 10 },
              { name: 'Stampa', icon: '🖨️', count: 6 },
              { name: 'Marketing', icon: '📈', count: 20 }
            ].map((category) => (
              <Card 
                key={category.name} 
                className="hover:shadow-md transition-shadow cursor-pointer border-2 hover:border-primary/20"
                data-testid={`category-${category.name.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <CardContent className="p-4 text-center">
                  <div className="text-2xl mb-2">{category.icon}</div>
                  <h4 className="font-medium text-sm">{category.name}</h4>
                  <p className="text-xs text-muted-foreground">{category.count} servizi</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <Card className="mt-12 bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20" data-testid="vendor-cta">
          <CardContent className="p-8 text-center">
            <Package className="w-12 h-12 text-primary mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-4">Offri i tuoi servizi</h3>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Sei un professionista o un'agenzia? Unisciti al nostro marketplace e offri i tuoi servizi 
              a centinaia di aziende che cercano soluzioni di qualità.
            </p>
            <Button size="lg" className="bg-primary hover:bg-primary/90" data-testid="become-vendor">
              <ArrowRight className="w-4 h-4 mr-2" />
              Diventa Fornitore
            </Button>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
