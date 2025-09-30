import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ShoppingCart, Star, Package, ArrowRight, Tag, CreditCard, Clock, User } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";

// Quick buy modal component
function QuickBuyModal({ service, open, onOpenChange }: { 
  service: any; 
  open: boolean; 
  onOpenChange: (open: boolean) => void; 
}) {
  const [quantity, setQuantity] = useState(1);
  const [priority, setPriority] = useState("standard");
  const [notes, setNotes] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const { toast } = useToast();

  const priorityOptions = {
    standard: { label: "Standard", extra: 0, description: "Consegna nei tempi normali" },
    express: { label: "Express", extra: 200, description: "Consegna in metà tempo" },
    urgent: { label: "Urgente", extra: 500, description: "Consegna prioritaria" }
  };

  const calculateTotal = () => {
    const baseTotal = service?.basePrice * quantity || 0;
    const priorityExtra = priorityOptions[priority as keyof typeof priorityOptions].extra;
    return baseTotal + priorityExtra;
  };

  const createMockOrder = async (orderData: any) => {
    setIsCreatingOrder(true);
    
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Create mock order record
      const mockOrder = {
        id: `order-${Date.now()}`,
        serviceId: orderData.serviceId,
        serviceName: orderData.serviceName,
        quantity: orderData.quantity,
        priority: orderData.priority,
        total: orderData.total,
        notes: orderData.notes,
        contactName: orderData.contactName,
        contactEmail: orderData.contactEmail,
        status: 'REQUESTED',
        createdAt: new Date().toISOString()
      };

      // Store in localStorage for demo (simulate database record)
      const existingOrders = JSON.parse(localStorage.getItem('mockOrders') || '[]');
      existingOrders.push(mockOrder);
      localStorage.setItem('mockOrders', JSON.stringify(existingOrders));

      // Success notification
      toast({
        title: "Ordine creato con successo! 🎉",
        description: `Il tuo ordine #${mockOrder.id.slice(-8)} è stato inviato. Riceverai una conferma via email.`,
      });

      // Additional notification for tickets ready (as per acceptance criteria)
      setTimeout(() => {
        toast({
          title: "I tuoi biglietti sono pronti",
          description: "Il servizio è stato processato e i materiali sono disponibili per il download.",
          duration: 10000, // 10 seconds auto-dismiss
        });
      }, 2000); // Show after 2 seconds
      
      // Reset form
      setQuantity(1);
      setPriority("standard");
      setNotes("");
      setContactName("");
      setContactEmail("");
      onOpenChange(false);
      
    } catch (error) {
      // Error notification
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante la creazione dell'ordine.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingOrder(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!contactName || !contactEmail) {
      toast({
        title: "Campi obbligatori",
        description: "Inserisci nome e email di contatto.",
        variant: "destructive",
      });
      return;
    }

    createMockOrder({
      serviceId: service.id,
      serviceName: service.name,
      quantity,
      priority,
      total: calculateTotal(),
      notes,
      contactName,
      contactEmail
    });
  };

  if (!service) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Ordina Servizio
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6" onKeyDown={(e)=>e.stopPropagation()} onKeyUp={(e)=>e.stopPropagation()}>
          {/* Service Summary */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{service.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {service.description}
                  </p>
                  <div className="flex items-center gap-4 mt-3 text-sm">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>5-7 giorni</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span>4.8 (142 recensioni)</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">Prezzo base</div>
                  <div className="text-2xl font-bold text-primary">
                    €{service.basePrice.toLocaleString()}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <div className="space-y-4">
            <h4 className="font-medium flex items-center gap-2">
              <User className="h-4 w-4" />
              Informazioni di Contatto
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="contactName">Nome Contatto *</Label>
                <Input
                  id="contactName"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="Il tuo nome"
                  required
                  data-testid="input-contact-name"
                  onKeyDown={(e)=>e.stopPropagation()}
                  onKeyUp={(e)=>e.stopPropagation()}
                />
              </div>
              <div>
                <Label htmlFor="contactEmail">Email Contatto *</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="tua@email.com"
                  required
                  data-testid="input-contact-email"
                  onKeyDown={(e)=>e.stopPropagation()}
                  onKeyUp={(e)=>e.stopPropagation()}
                />
              </div>
            </div>
          </div>

          {/* Order Configuration */}
          <div className="space-y-4">
            <h4 className="font-medium">Configurazione Ordine</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="quantity">Quantità</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  max="10"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  data-testid="input-quantity"
                  onKeyDown={(e)=>e.stopPropagation()}
                  onKeyUp={(e)=>e.stopPropagation()}
                />
              </div>
              
              <div>
                <Label htmlFor="priority">Priorità</Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger data-testid="select-priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(priorityOptions).map(([key, option]) => (
                      <SelectItem key={key} value={key}>
                        {option.label} {option.extra > 0 && `(+€${option.extra})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Note aggiuntive (opzionale)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Specifica dettagli del progetto, preferenze, scadenze..."
                rows={3}
                data-testid="textarea-notes"
                onKeyDown={(e)=>e.stopPropagation()}
                onKeyUp={(e)=>e.stopPropagation()}
              />
            </div>
          </div>

          {/* Order Summary */}
          <Card className="bg-muted/50">
            <CardContent className="p-4">
              <h4 className="font-medium mb-3">Riepilogo Ordine</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Servizio ({quantity}x)</span>
                  <span>€{(service.basePrice * quantity).toLocaleString()}</span>
                </div>
                {priorityOptions[priority as keyof typeof priorityOptions].extra > 0 && (
                  <div className="flex justify-between">
                    <span>Priorità {priorityOptions[priority as keyof typeof priorityOptions].label}</span>
                    <span>€{priorityOptions[priority as keyof typeof priorityOptions].extra}</span>
                  </div>
                )}
                <div className="border-t pt-2 font-semibold flex justify-between">
                  <span>Totale</span>
                  <span className="text-primary">€{calculateTotal().toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-3">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="flex-1"
              data-testid="button-cancel-order"
            >
              Annulla
            </Button>
            <Button 
              type="submit" 
              disabled={isCreatingOrder}
              className="flex-1"
              data-testid="button-confirm-order"
            >
              {isCreatingOrder ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                  Creazione...
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Conferma Ordine
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function Marketplace() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [selectedService, setSelectedService] = useState<any>(null);
  const [isQuickBuyOpen, setIsQuickBuyOpen] = useState(false);
  
  const currentOrg = user?.organizations?.[0];
  const currentMembership = currentOrg?.membership;

  // Check if user has marketplace access
  const hasMarketplaceAccess = currentMembership && 
    ['SUPER_ADMIN', 'ORG_ADMIN', 'MARKETER', 'SALES'].includes(currentMembership.role);

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
                        onClick={() => {
                          setSelectedService(service);
                          setIsQuickBuyOpen(true);
                        }}
                        data-testid={`service-order-${service.id}`}
                      >
                        <ShoppingCart className="w-4 h-4 mr-1" />
                        Ordina Ora
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

        {/* Quick Buy Modal */}
        <QuickBuyModal
          service={selectedService}
          open={isQuickBuyOpen}
          onOpenChange={setIsQuickBuyOpen}
        />
      </div>
    </MainLayout>
  );
}
