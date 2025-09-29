"use client"

import { useState } from "react";
import { ShoppingCart, Star, Package, Tag, X, Check, CreditCard, Clock, User } from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  Button,
  Badge,
  Input,
  Label,
  Textarea,
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  useToast
} from "./components";

// Mock services data
const mockServices = [
  {
    id: '1',
    name: 'Brand Identity Design',
    description: 'Creazione completa della tua identità aziendale: logo, colori, tipografia e linee guida.',
    category: 'branding',
    basePrice: 1500,
    isActive: true,
    deliveryTime: '5-7 giorni',
    revisions: 2,
    rating: 4.8,
    reviews: 142
  },
  {
    id: '2',
    name: 'Servizio Fotografico Prodotti',
    description: 'Servizio fotografico professionale per i tuoi prodotti, con ritocco e post-produzione.',
    category: 'foto',
    basePrice: 800,
    isActive: true,
    deliveryTime: '3-5 giorni',
    revisions: 3,
    rating: 4.9,
    reviews: 89
  },
  {
    id: '3',
    name: 'Video Promozionale',
    description: 'Realizzazione di video promozionali per social media e campagne advertising.',
    category: 'video',
    basePrice: 2000,
    isActive: true,
    deliveryTime: '7-10 giorni',
    revisions: 2,
    rating: 4.7,
    reviews: 67
  },
  {
    id: '4',
    name: 'Stampa Materiale Marketing',
    description: 'Stampa professionale di brochure, volantini, biglietti da visita e materiale promozionale.',
    category: 'stampa',
    basePrice: 300,
    isActive: true,
    deliveryTime: '2-3 giorni',
    revisions: 1,
    rating: 4.6,
    reviews: 234
  },
  {
    id: '5',
    name: 'Consulenza Marketing Digitale',
    description: 'Strategia e consulenza per ottimizzare le tue campagne di marketing digitale.',
    category: 'marketing',
    basePrice: 1200,
    isActive: true,
    deliveryTime: '1-2 settimane',
    revisions: 1,
    rating: 4.9,
    reviews: 156
  },
  {
    id: '6',
    name: 'Design Sito Web',
    description: 'Progettazione e sviluppo di siti web responsive e ottimizzati per la conversione.',
    category: 'design',
    basePrice: 3000,
    isActive: true,
    deliveryTime: '2-3 settimane',
    revisions: 3,
    rating: 4.8,
    reviews: 98
  }
];

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
  const { toast } = useToast();

  // Mock order creation state
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);

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

  const priorityOptions = {
    standard: { label: "Standard", extra: 0, description: "Consegna nei tempi normali" },
    express: { label: "Express", extra: 200, description: "Consegna in metà tempo" },
    urgent: { label: "Urgente", extra: 500, description: "Consegna prioritaria" }
  };

  const calculateTotal = () => {
    const baseTotal = service.basePrice * quantity;
    const priorityExtra = priorityOptions[priority as keyof typeof priorityOptions].extra;
    return baseTotal + priorityExtra;
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

        <form onSubmit={handleSubmit} className="space-y-6">
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
                      <span>{service.deliveryTime}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span>{service.rating} ({service.reviews} recensioni)</span>
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
                        <div>
                          <div className="flex items-center justify-between w-full">
                            <span>{option.label}</span>
                            {option.extra > 0 && (
                              <span className="text-sm text-muted-foreground ml-2">
                                +€{option.extra}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {option.description}
                          </div>
                        </div>
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

export default function MarketplacePage() {
  const [selectedService, setSelectedService] = useState<any>(null);
  const [isQuickBuyOpen, setIsQuickBuyOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'branding': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'design': return 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300';
      case 'video': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'foto': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'stampa': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      case 'marketing': return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const filteredServices = mockServices.filter(service => {
    const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || service.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleQuickBuy = (service: any) => {
    setSelectedService(service);
    setIsQuickBuyOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Package className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Marketplace Servizi</h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Scopri e ordina servizi professionali per far crescere il tuo business
          </p>
        </div>

        {/* Filters */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Cerca servizi..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                  data-testid="input-search-services"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full md:w-48" data-testid="select-category-filter">
                  <SelectValue placeholder="Categoria" />
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
            </div>
          </CardContent>
        </Card>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12" data-testid="services-grid">
          {filteredServices.map((service) => (
            <Card key={service.id} className="hover:shadow-lg transition-all duration-200 hover:scale-[1.02]" data-testid={`service-card-${service.id}`}>
              <CardHeader>
                <div className="flex justify-between items-start mb-2">
                  <CardTitle className="text-lg leading-tight">
                    {service.name}
                  </CardTitle>
                  <Badge className={getCategoryColor(service.category)}>
                    {service.category}
                  </Badge>
                </div>
                <p className="text-muted-foreground text-sm line-clamp-3">
                  {service.description}
                </p>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-4">
                  {/* Rating */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star 
                          key={star} 
                          className={`w-4 h-4 ${
                            star <= Math.floor(service.rating) 
                              ? 'fill-yellow-400 text-yellow-400' 
                              : 'text-gray-300'
                          }`} 
                        />
                      ))}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {service.rating} ({service.reviews})
                    </span>
                  </div>

                  {/* Details */}
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Consegna:</span>
                      <span>{service.deliveryTime}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Revisioni:</span>
                      <span>{service.revisions} incluse</span>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="flex items-center justify-between pt-2 border-t">
                    <div>
                      <div className="text-xs text-muted-foreground">A partire da</div>
                      <div className="flex items-center gap-1">
                        <Tag className="w-4 h-4 text-primary" />
                        <span className="text-xl font-bold text-primary">
                          €{service.basePrice.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-4">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      data-testid={`button-details-${service.id}`}
                    >
                      Dettagli
                    </Button>
                    <Button 
                      size="sm" 
                      className="flex-1 bg-primary hover:bg-primary/90"
                      onClick={() => handleQuickBuy(service)}
                      data-testid={`button-quick-buy-${service.id}`}
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

        {/* Quick Buy Modal */}
        <QuickBuyModal
          service={selectedService}
          open={isQuickBuyOpen}
          onOpenChange={setIsQuickBuyOpen}
        />

        {/* No Results */}
        {filteredServices.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nessun servizio trovato</h3>
              <p className="text-muted-foreground">
                Prova a modificare i filtri di ricerca o le categorie selezionate.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}