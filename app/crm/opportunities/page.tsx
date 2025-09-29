import React, { useState } from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { Plus, Search, Filter, MoreHorizontal, Calendar, Euro, User, Building2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../client/src/components/ui/card";
import { Button } from "../../client/src/components/ui/button";
import { Badge } from "../../client/src/components/ui/badge";
import { Input } from "../../client/src/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../client/src/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../../client/src/components/ui/dropdown-menu";
import { Avatar, AvatarContent, AvatarImage } from "../../client/src/components/ui/avatar";

// Pipeline stages
const pipelineStages = [
  { id: "prospecting", name: "Prospecting", color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200" },
  { id: "qualification", name: "Qualification", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300" },
  { id: "proposal", name: "Proposal", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300" },
  { id: "negotiation", name: "Negotiation", color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300" },
  { id: "closed-won", name: "Closed Won", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" },
  { id: "closed-lost", name: "Closed Lost", color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300" }
];

// Mock data for opportunities
const mockOpportunities = [
  {
    id: "opp-1",
    title: "Sistema CRM Enterprise",
    company: "TechCorp Italia",
    contact: "Marco Rossi",
    amount: 85000,
    probability: 75,
    stage: "proposal",
    closeDate: "2024-02-15",
    source: "Website",
    priority: "high",
    description: "Implementazione completa sistema CRM per 200+ utenti",
    lastActivity: "2024-01-14T10:30:00Z"
  },
  {
    id: "opp-2",
    title: "Consulenza Digital Marketing",
    company: "Innova S.r.l.",
    contact: "Sofia Bianchi",
    amount: 32000,
    probability: 60,
    stage: "qualification",
    closeDate: "2024-02-28",
    source: "LinkedIn",
    priority: "medium",
    description: "Strategia marketing digitale e automazione campagne",
    lastActivity: "2024-01-13T14:20:00Z"
  },
  {
    id: "opp-3",
    title: "Piattaforma E-commerce",
    company: "Digital Plus",
    contact: "Alessandro Ferrari",
    amount: 125000,
    probability: 90,
    stage: "negotiation",
    closeDate: "2024-01-30",
    source: "Event",
    priority: "high",
    description: "Sviluppo piattaforma e-commerce B2B personalizzata",
    lastActivity: "2024-01-12T11:15:00Z"
  },
  {
    id: "opp-4",
    title: "Software HR Management",
    company: "Startup Co.",
    contact: "Lucia Conti",
    amount: 18000,
    probability: 40,
    stage: "prospecting",
    closeDate: "2024-03-15",
    source: "Referral",
    priority: "low",
    description: "Sistema gestione risorse umane per startup in crescita",
    lastActivity: "2024-01-11T09:45:00Z"
  },
  {
    id: "opp-5",
    title: "Migrazione Cloud",
    company: "GlobalTech",
    contact: "Roberto Martini",
    amount: 67000,
    probability: 85,
    stage: "closed-won",
    closeDate: "2024-01-20",
    source: "Google Ads",
    priority: "high",
    description: "Migrazione infrastruttura IT su cloud AWS",
    lastActivity: "2024-01-10T16:30:00Z"
  },
  {
    id: "opp-6",
    title: "App Mobile Aziendale",
    company: "MobileTech",
    contact: "Francesca Verdi",
    amount: 28000,
    probability: 25,
    stage: "closed-lost",
    closeDate: "2024-01-25",
    source: "Cold Call",
    priority: "medium",
    description: "Sviluppo app mobile per gestione vendite mobile",
    lastActivity: "2024-01-09T12:00:00Z"
  }
];

const priorityColors = {
  high: "border-l-4 border-red-500",
  medium: "border-l-4 border-yellow-500", 
  low: "border-l-4 border-green-500"
};

export default function OpportunitiesPage() {
  const [opportunities, setOpportunities] = useState(mockOpportunities);
  const [searchTerm, setSearchTerm] = useState("");
  const [stageFilter, setStageFilter] = useState("all");

  const filteredOpportunities = opportunities.filter(opp => {
    const matchesSearch = 
      opp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      opp.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      opp.contact.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStage = stageFilter === "all" || opp.stage === stageFilter;
    
    return matchesSearch && matchesStage;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getOpportunitiesByStage = (stageId: string) => {
    return filteredOpportunities.filter(opp => opp.stage === stageId);
  };

  const calculateStageValue = (stageId: string) => {
    return getOpportunitiesByStage(stageId).reduce((sum, opp) => sum + opp.amount, 0);
  };

  const onDragEnd = (result: any) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;
    
    if (source.droppableId === destination.droppableId) return;

    const updatedOpportunities = opportunities.map(opp => 
      opp.id === draggableId 
        ? { ...opp, stage: destination.droppableId }
        : opp
    );

    setOpportunities(updatedOpportunities);
  };

  const totalValue = opportunities.reduce((sum, opp) => sum + opp.amount, 0);
  const totalOpportunities = opportunities.length;
  const averageDealSize = totalValue / totalOpportunities;
  const winRate = (opportunities.filter(opp => opp.stage === 'closed-won').length / totalOpportunities * 100).toFixed(1);

  return (
    <div className="p-6 space-y-6" data-testid="opportunities-page">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white" data-testid="page-title">
            Pipeline Opportunità
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Gestisci il tuo pipeline di vendite con vista kanban
          </p>
        </div>
        <Button data-testid="button-add-opportunity">
          <Plus className="h-4 w-4 mr-2" />
          Nuova Opportunità
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Valore Totale</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="stat-total-value">
                  {formatCurrency(totalValue)}
                </p>
              </div>
              <Euro className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Totale Opportunità</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="stat-total-opportunities">
                  {totalOpportunities}
                </p>
              </div>
              <Building2 className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Deal Size Medio</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="stat-avg-deal-size">
                  {formatCurrency(averageDealSize)}
                </p>
              </div>
              <div className="h-8 w-8 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                <span className="text-purple-600 text-sm">€</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Win Rate</p>
                <p className="text-2xl font-bold text-green-600" data-testid="stat-win-rate">
                  {winRate}%
                </p>
              </div>
              <div className="h-8 w-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                <span className="text-green-600 text-sm font-bold">%</span>
              </div>
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
                  placeholder="Cerca opportunità per titolo, azienda o contatto..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-opportunities"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={stageFilter} onValueChange={setStageFilter}>
                <SelectTrigger className="w-40" data-testid="select-stage-filter">
                  <SelectValue placeholder="Fase" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutte le fasi</SelectItem>
                  {pipelineStages.map(stage => (
                    <SelectItem key={stage.id} value={stage.id}>
                      {stage.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filtri Avanzati
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Kanban Board */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-6 gap-4 overflow-x-auto" data-testid="kanban-board">
          {pipelineStages.map((stage) => {
            const stageOpportunities = getOpportunitiesByStage(stage.id);
            const stageValue = calculateStageValue(stage.id);
            
            return (
              <Card key={stage.id} className="min-w-80 lg:min-w-0">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <Badge className={stage.color}>
                        {stage.name}
                      </Badge>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {stageOpportunities.length} opportunità
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatCurrency(stageValue)}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                  <Droppable droppableId={stage.id}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`space-y-3 min-h-32 p-2 rounded-lg transition-colors ${
                          snapshot.isDraggingOver ? 'bg-gray-100 dark:bg-gray-800' : ''
                        }`}
                      >
                        {stageOpportunities.map((opportunity, index) => (
                          <Draggable
                            key={opportunity.id}
                            draggableId={opportunity.id}
                            index={index}
                          >
                            {(provided, snapshot) => (
                              <Card
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`cursor-grab active:cursor-grabbing transition-shadow ${
                                  snapshot.isDragging ? 'shadow-lg' : ''
                                } ${priorityColors[opportunity.priority as keyof typeof priorityColors]}`}
                                data-testid={`opportunity-card-${opportunity.id}`}
                              >
                                <CardContent className="p-3">
                                  <div className="space-y-2">
                                    <div className="flex justify-between items-start">
                                      <h4 className="font-medium text-sm text-gray-900 dark:text-white line-clamp-2">
                                        {opportunity.title}
                                      </h4>
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                            <MoreHorizontal className="h-3 w-3" />
                                          </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                          <DropdownMenuItem>Visualizza</DropdownMenuItem>
                                          <DropdownMenuItem>Modifica</DropdownMenuItem>
                                          <DropdownMenuItem>Duplica</DropdownMenuItem>
                                          <DropdownMenuItem className="text-red-600">Elimina</DropdownMenuItem>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    </div>
                                    
                                    <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                                      <Building2 className="h-3 w-3 mr-1" />
                                      {opportunity.company}
                                    </div>
                                    
                                    <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                                      <User className="h-3 w-3 mr-1" />
                                      {opportunity.contact}
                                    </div>

                                    <div className="flex justify-between items-center">
                                      <span className="font-semibold text-gray-900 dark:text-white text-sm">
                                        {formatCurrency(opportunity.amount)}
                                      </span>
                                      <span className="text-xs text-gray-500 dark:text-gray-400">
                                        {opportunity.probability}%
                                      </span>
                                    </div>

                                    <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                                      <Calendar className="h-3 w-3 mr-1" />
                                      {formatDate(opportunity.closeDate)}
                                    </div>

                                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
                                      <div 
                                        className="bg-blue-600 h-1 rounded-full" 
                                        style={{ width: `${opportunity.probability}%` }}
                                      />
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                        
                        {stageOpportunities.length === 0 && (
                          <div className="text-center py-8 text-gray-400 dark:text-gray-600 text-sm">
                            Nessuna opportunità in questa fase
                          </div>
                        )}
                      </div>
                    )}
                  </Droppable>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </DragDropContext>
    </div>
  );
}