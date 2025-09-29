import React, { useState } from "react";
import { Play, Pause, Plus, Search, MoreHorizontal, Mail, Phone, MessageSquare, Calendar, Users, TrendingUp, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../client/src/components/ui/card";
import { Button } from "../../client/src/components/ui/button";
import { Badge } from "../../client/src/components/ui/badge";
import { Input } from "../../client/src/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../client/src/components/ui/select";
import { Progress } from "../../client/src/components/ui/progress";
import { Separator } from "../../client/src/components/ui/separator";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../../client/src/components/ui/dropdown-menu";

// Mock data for cadences
const mockCadences = [
  {
    id: "cadence-1",
    name: "Onboarding Nuovi Clienti B2B",
    description: "Sequenza di benvenuto per nuovi clienti enterprise con follow-up personalizzati",
    status: "active",
    totalSteps: 7,
    enrolledContacts: 143,
    completedContacts: 89,
    responseRate: 34.2,
    openRate: 67.8,
    createdAt: "2024-01-05T09:00:00Z",
    lastModified: "2024-01-12T14:30:00Z",
    steps: [
      { type: "email", subject: "Benvenuto in Stratikey!", delay: 0 },
      { type: "email", subject: "Come iniziare con la tua dashboard", delay: 2 },
      { type: "phone", subject: "Chiamata di check-in", delay: 5 },
      { type: "email", subject: "Tips per ottimizzare il tuo workflow", delay: 7 },
      { type: "email", subject: "Invito webinar best practices", delay: 10 },
      { type: "sms", subject: "Reminder webinar di domani", delay: 13 },
      { type: "email", subject: "Follow-up post webinar", delay: 15 }
    ]
  },
  {
    id: "cadence-2", 
    name: "Lead Nurturing E-commerce",
    description: "Coltivazione lead interessati a soluzioni e-commerce con contenuti educativi",
    status: "active",
    totalSteps: 5,
    enrolledContacts: 87,
    completedContacts: 52,
    responseRate: 28.7,
    openRate: 72.1,
    createdAt: "2024-01-08T11:20:00Z",
    lastModified: "2024-01-14T16:45:00Z",
    steps: [
      { type: "email", subject: "Guida: 10 errori da evitare nel tuo e-commerce", delay: 0 },
      { type: "email", subject: "Case study: Come abbiamo aumentato le vendite del 40%", delay: 3 },
      { type: "phone", subject: "Consulenza gratuita 30 min", delay: 7 },
      { type: "email", subject: "Checklist per un e-commerce di successo", delay: 10 },
      { type: "email", subject: "Offerta speciale: Sconto 20% implementazione", delay: 14 }
    ]
  },
  {
    id: "cadence-3",
    name: "Recupero Clienti Inattivi",
    description: "Riattivazione clienti che non utilizzano la piattaforma da oltre 30 giorni",
    status: "paused",
    totalSteps: 4,
    enrolledContacts: 34,
    completedContacts: 19,
    responseRate: 15.4,
    openRate: 41.2,
    createdAt: "2023-12-15T08:30:00Z",
    lastModified: "2024-01-10T12:15:00Z",
    steps: [
      { type: "email", subject: "Ti manca qualcosa? Riprendiamo da dove avevamo lasciato", delay: 0 },
      { type: "email", subject: "Nuove funzionalità che potrebbero interessarti", delay: 5 },
      { type: "phone", subject: "Chiamata per feedback e supporto", delay: 8 },
      { type: "email", subject: "Ultima opportunità: Offerta personalizzata", delay: 12 }
    ]
  },
  {
    id: "cadence-4",
    name: "Follow-up Post Demo",
    description: "Sequenza per prospect che hanno partecipato a una demo del prodotto",
    status: "active",
    totalSteps: 6,
    enrolledContacts: 56,
    completedContacts: 31,
    responseRate: 42.1,
    openRate: 78.9,
    createdAt: "2024-01-03T15:45:00Z",
    lastModified: "2024-01-13T10:20:00Z",
    steps: [
      { type: "email", subject: "Grazie per aver partecipato alla demo!", delay: 0 },
      { type: "email", subject: "Materiali di approfondimento dalla demo", delay: 1 },
      { type: "phone", subject: "Q&A personalizzato 15 min", delay: 3 },
      { type: "email", subject: "Proposta commerciale personalizzata", delay: 5 },
      { type: "email", subject: "Reference clienti del tuo settore", delay: 8 },
      { type: "email", subject: "Scadenza offerta speciale", delay: 12 }
    ]
  },
  {
    id: "cadence-5",
    name: "Upselling Clienti Esistenti",
    description: "Promozione servizi aggiuntivi per clienti con buon engagement",
    status: "draft",
    totalSteps: 3,
    enrolledContacts: 12,
    completedContacts: 7,
    responseRate: 58.3,
    openRate: 91.7,
    createdAt: "2024-01-11T13:10:00Z",
    lastModified: "2024-01-14T09:30:00Z",
    steps: [
      { type: "email", subject: "Nuovi servizi per ottimizzare i tuoi risultati", delay: 0 },
      { type: "phone", subject: "Consulenza strategica gratuita", delay: 4 },
      { type: "email", subject: "Proposta upgrade personalizzata", delay: 7 }
    ]
  }
];

const statusColors = {
  active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  paused: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  draft: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
};

const statusLabels = {
  active: "Attiva",
  paused: "In Pausa", 
  draft: "Bozza"
};

const stepTypeIcons = {
  email: Mail,
  phone: Phone,
  sms: MessageSquare
};

export default function CadencesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredCadences = mockCadences.filter(cadence => {
    const matchesSearch = 
      cadence.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cadence.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || cadence.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric'
    });
  };

  const getCompletionRate = (completed: number, enrolled: number) => {
    return enrolled > 0 ? (completed / enrolled * 100) : 0;
  };

  const activeCadences = mockCadences.filter(c => c.status === 'active').length;
  const totalEnrolled = mockCadences.reduce((sum, c) => sum + c.enrolledContacts, 0);
  const avgResponseRate = mockCadences.reduce((sum, c) => sum + c.responseRate, 0) / mockCadences.length;
  const avgOpenRate = mockCadences.reduce((sum, c) => sum + c.openRate, 0) / mockCadences.length;

  return (
    <div className="p-6 space-y-6" data-testid="cadences-page">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white" data-testid="page-title">
            Sequenze di Vendita
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Crea e gestisci sequenze automatizzate per nurturing e follow-up
          </p>
        </div>
        <Button data-testid="button-add-cadence">
          <Plus className="h-4 w-4 mr-2" />
          Nuova Sequenza
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Sequenze Attive</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="stat-active-cadences">
                  {activeCadences}
                </p>
              </div>
              <Play className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Contatti Iscritti</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="stat-total-enrolled">
                  {totalEnrolled}
                </p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Tasso Risposta Medio</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="stat-avg-response-rate">
                  {avgResponseRate.toFixed(1)}%
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Tasso Apertura Medio</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="stat-avg-open-rate">
                  {avgOpenRate.toFixed(1)}%
                </p>
              </div>
              <Mail className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Cerca sequenze per nome o descrizione..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-cadences"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40" data-testid="select-status-filter">
                  <SelectValue placeholder="Stato" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutti gli stati</SelectItem>
                  <SelectItem value="active">Attiva</SelectItem>
                  <SelectItem value="paused">In Pausa</SelectItem>
                  <SelectItem value="draft">Bozza</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cadences List */}
      <div className="space-y-4">
        {filteredCadences.map((cadence) => (
          <Card key={cadence.id} data-testid={`cadence-card-${cadence.id}`}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {cadence.name}
                    </h3>
                    <Badge className={statusColors[cadence.status as keyof typeof statusColors]}>
                      {statusLabels[cadence.status as keyof typeof statusLabels]}
                    </Badge>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    {cadence.description}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {cadence.status === 'active' ? (
                    <Button variant="outline" size="sm" data-testid={`button-pause-${cadence.id}`}>
                      <Pause className="h-4 w-4 mr-2" />
                      Pausa
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" data-testid={`button-play-${cadence.id}`}>
                      <Play className="h-4 w-4 mr-2" />
                      Avvia
                    </Button>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" data-testid={`button-actions-${cadence.id}`}>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>Visualizza Analytics</DropdownMenuItem>
                      <DropdownMenuItem>Modifica Sequenza</DropdownMenuItem>
                      <DropdownMenuItem>Duplica</DropdownMenuItem>
                      <DropdownMenuItem>Esporta Dati</DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600">Elimina</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Statistics */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900 dark:text-white">Statistiche</h4>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Contatti iscritti</span>
                      <span className="font-medium text-gray-900 dark:text-white">{cadence.enrolledContacts}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Completati</span>
                      <span className="font-medium text-gray-900 dark:text-white">{cadence.completedContacts}</span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Progresso</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {getCompletionRate(cadence.completedContacts, cadence.enrolledContacts).toFixed(1)}%
                        </span>
                      </div>
                      <Progress 
                        value={getCompletionRate(cadence.completedContacts, cadence.enrolledContacts)}
                        className="h-2"
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Tasso risposta</span>
                      <span className="font-medium text-green-600">{cadence.responseRate}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Tasso apertura</span>
                      <span className="font-medium text-blue-600">{cadence.openRate}%</span>
                    </div>
                  </div>
                </div>

                {/* Steps Preview */}
                <div className="lg:col-span-2 space-y-4">
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    Anteprima Steps ({cadence.steps.length})
                  </h4>
                  
                  <div className="space-y-3 max-h-48 overflow-y-auto">
                    {cadence.steps.map((step, index) => {
                      const Icon = stepTypeIcons[step.type as keyof typeof stepTypeIcons];
                      return (
                        <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <div className="flex items-center justify-center w-8 h-8 bg-white dark:bg-gray-700 rounded-full border">
                            <Icon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                Step {index + 1}
                              </span>
                              <Badge variant="secondary" className="text-xs">
                                {step.type.toUpperCase()}
                              </Badge>
                              <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                                <Clock className="h-3 w-3 mr-1" />
                                {step.delay === 0 ? 'Immediato' : `+${step.delay} giorni`}
                              </div>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-300 truncate">
                              {step.subject}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <Separator className="my-4" />

              <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400">
                <span>Creata il {formatDate(cadence.createdAt)}</span>
                <span>Ultima modifica il {formatDate(cadence.lastModified)}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredCadences.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-gray-400 dark:text-gray-600 mb-4">
              <MessageSquare className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Nessuna sequenza trovata
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {searchTerm || statusFilter !== 'all' 
                ? 'Prova a modificare i filtri di ricerca'
                : 'Inizia creando la tua prima sequenza di vendita'
              }
            </p>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Crea Nuova Sequenza
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}