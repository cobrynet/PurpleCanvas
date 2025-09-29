import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { UserPlus, Search, Filter, MoreHorizontal, Phone, Mail, Building2, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../client/src/components/ui/card";
import { Button } from "../../client/src/components/ui/button";
import { Badge } from "../../client/src/components/ui/badge";
import { Input } from "../../client/src/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../client/src/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../client/src/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../../client/src/components/ui/dropdown-menu";

// Mock data for leads
const mockLeads = [
  {
    id: "lead-1",
    firstName: "Marco",
    lastName: "Rossi",
    email: "marco.rossi@techcorp.it",
    phone: "+39 346 123 4567",
    company: "TechCorp Italia",
    position: "CTO",
    source: "Website",
    status: "new",
    score: 85,
    value: 45000,
    lastContact: "2024-01-15T10:30:00Z",
    createdAt: "2024-01-10T09:00:00Z"
  },
  {
    id: "lead-2", 
    firstName: "Sofia",
    lastName: "Bianchi",
    email: "sofia.bianchi@innovasrl.com",
    phone: "+39 347 987 6543",
    company: "Innova S.r.l.",
    position: "Marketing Director",
    source: "LinkedIn",
    status: "contacted",
    score: 72,
    value: 28000,
    lastContact: "2024-01-14T14:20:00Z",
    createdAt: "2024-01-08T16:45:00Z"
  },
  {
    id: "lead-3",
    firstName: "Alessandro",
    lastName: "Ferrari",
    email: "a.ferrari@digitalplus.net",
    phone: "+39 348 555 7890",
    company: "Digital Plus",
    position: "CEO",
    source: "Event",
    status: "qualified",
    score: 94,
    value: 78000,
    lastContact: "2024-01-13T11:15:00Z",
    createdAt: "2024-01-05T08:30:00Z"
  },
  {
    id: "lead-4",
    firstName: "Lucia",
    lastName: "Conti",
    email: "lucia.conti@startup.co",
    phone: "+39 349 234 5678",
    company: "Startup Co.",
    position: "COO",
    source: "Referral",
    status: "nurturing",
    score: 58,
    value: 15000,
    lastContact: "2024-01-12T09:45:00Z",
    createdAt: "2024-01-07T13:20:00Z"
  },
  {
    id: "lead-5",
    firstName: "Roberto",
    lastName: "Martini",
    email: "r.martini@globaltech.com",
    phone: "+39 345 876 5432",
    company: "GlobalTech",
    position: "IT Manager",
    source: "Google Ads",
    status: "unqualified",
    score: 31,
    value: 8000,
    lastContact: "2024-01-11T16:30:00Z",
    createdAt: "2024-01-09T10:15:00Z"
  }
];

const statusColors = {
  new: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  contacted: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  qualified: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  nurturing: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  unqualified: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
};

const statusLabels = {
  new: "Nuovo",
  contacted: "Contattato",
  qualified: "Qualificato", 
  nurturing: "In Coltivazione",
  unqualified: "Non Qualificato"
};

export default function LeadsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");

  const filteredLeads = mockLeads.filter(lead => {
    const matchesSearch = 
      lead.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.company.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || lead.status === statusFilter;
    const matchesSource = sourceFilter === "all" || lead.source === sourceFilter;
    
    return matchesSearch && matchesStatus && matchesSource;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  return (
    <div className="p-6 space-y-6" data-testid="leads-page">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white" data-testid="page-title">
            Leads
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Gestisci e monitora i tuoi potenziali clienti
          </p>
        </div>
        <Button data-testid="button-add-lead">
          <UserPlus className="h-4 w-4 mr-2" />
          Nuovo Lead
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Totale Leads</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="stat-total-leads">
                  {mockLeads.length}
                </p>
              </div>
              <UserPlus className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Qualificati</p>
                <p className="text-2xl font-bold text-green-600" data-testid="stat-qualified-leads">
                  {mockLeads.filter(l => l.status === 'qualified').length}
                </p>
              </div>
              <div className="h-8 w-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                <span className="text-green-600 text-sm font-bold">✓</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Valore Totale</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="stat-total-value">
                  {formatCurrency(mockLeads.reduce((sum, lead) => sum + lead.value, 0))}
                </p>
              </div>
              <div className="h-8 w-8 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center">
                <span className="text-yellow-600 text-sm">€</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Score Medio</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="stat-avg-score">
                  {Math.round(mockLeads.reduce((sum, lead) => sum + lead.score, 0) / mockLeads.length)}
                </p>
              </div>
              <div className="h-8 w-8 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                <span className="text-purple-600 text-sm">★</span>
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
                  placeholder="Cerca leads per nome, email o azienda..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-leads"
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
                  <SelectItem value="new">Nuovo</SelectItem>
                  <SelectItem value="contacted">Contattato</SelectItem>
                  <SelectItem value="qualified">Qualificato</SelectItem>
                  <SelectItem value="nurturing">In Coltivazione</SelectItem>
                  <SelectItem value="unqualified">Non Qualificato</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sourceFilter} onValueChange={setSourceFilter}>
                <SelectTrigger className="w-40" data-testid="select-source-filter">
                  <SelectValue placeholder="Fonte" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutte le fonti</SelectItem>
                  <SelectItem value="Website">Website</SelectItem>
                  <SelectItem value="LinkedIn">LinkedIn</SelectItem>
                  <SelectItem value="Event">Event</SelectItem>
                  <SelectItem value="Referral">Referral</SelectItem>
                  <SelectItem value="Google Ads">Google Ads</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Leads Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Leads ({filteredLeads.length})</span>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filtri Avanzati
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Azienda</TableHead>
                  <TableHead>Contatti</TableHead>
                  <TableHead>Stato</TableHead>
                  <TableHead>Fonte</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Valore</TableHead>
                  <TableHead>Ultimo Contatto</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeads.map((lead) => (
                  <TableRow key={lead.id} data-testid={`row-lead-${lead.id}`}>
                    <TableCell>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {lead.firstName} {lead.lastName}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {lead.position}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Building2 className="h-4 w-4 mr-2 text-gray-400" />
                        <span className="text-gray-900 dark:text-white">{lead.company}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center text-sm">
                          <Mail className="h-3 w-3 mr-1 text-gray-400" />
                          <span className="text-gray-600 dark:text-gray-300">{lead.email}</span>
                        </div>
                        <div className="flex items-center text-sm">
                          <Phone className="h-3 w-3 mr-1 text-gray-400" />
                          <span className="text-gray-600 dark:text-gray-300">{lead.phone}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[lead.status as keyof typeof statusColors]}>
                        {statusLabels[lead.status as keyof typeof statusLabels]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-gray-600 dark:text-gray-300">{lead.source}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <div className="w-12 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mr-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${lead.score}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">{lead.score}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {formatCurrency(lead.value)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                        <Calendar className="h-3 w-3 mr-1" />
                        {formatDate(lead.lastContact)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" data-testid={`button-actions-${lead.id}`}>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>Visualizza</DropdownMenuItem>
                          <DropdownMenuItem>Modifica</DropdownMenuItem>
                          <DropdownMenuItem>Contatta</DropdownMenuItem>
                          <DropdownMenuItem>Converti in Opportunità</DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">Elimina</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}