import { useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { TrendingUp, Users, Eye, MousePointer, Calendar as CalendarIcon, DollarSign } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

// Mock data for KPIs
const mockKPIs = [
  {
    title: "Impressioni Totali",
    value: "124,563",
    change: "+12.5%",
    icon: Eye,
    trend: "up"
  },
  {
    title: "Click Totali", 
    value: "8,234",
    change: "+8.2%",
    icon: MousePointer,
    trend: "up"
  },
  {
    title: "Costo per Click",
    value: "€1.45",
    change: "-5.3%",
    icon: DollarSign,
    trend: "down"
  },
  {
    title: "Nuovi Lead",
    value: "156",
    change: "+18.7%",
    icon: Users,
    trend: "up"
  }
];

// Mock data for charts
const mockChartData = [
  { name: 'Lun', impressions: 12000, clicks: 800, conversions: 45 },
  { name: 'Mar', impressions: 15000, clicks: 950, conversions: 52 },
  { name: 'Mer', impressions: 18000, clicks: 1200, conversions: 68 },
  { name: 'Gio', impressions: 14000, clicks: 890, conversions: 41 },
  { name: 'Ven', impressions: 20000, clicks: 1400, conversions: 89 },
  { name: 'Sab', impressions: 16000, clicks: 1050, conversions: 63 },
  { name: 'Dom', impressions: 13000, clicks: 720, conversions: 38 }
];

const mockLineData = [
  { name: 'Gen', value: 2400 },
  { name: 'Feb', value: 1398 },
  { name: 'Mar', value: 9800 },
  { name: 'Apr', value: 3908 },
  { name: 'Mag', value: 4800 },
  { name: 'Giu', value: 3800 },
  { name: 'Lug', value: 4300 }
];

export default function MarketingOverview() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const currentOrg = user?.organizations?.[0];
  const currentMembership = currentOrg?.membership;

  // Check if user has marketing access
  const hasMarketingAccess = currentMembership && 
    ['ORG_ADMIN', 'MARKETER'].includes(currentMembership.role);

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

  if (authLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading"/>
      </div>
    );
  }

  if (!hasMarketingAccess) {
    return (
      <MainLayout title="Marketing Overview" icon={TrendingUp}>
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            Non hai i permessi per accedere alla sezione Marketing.
          </p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Marketing Overview" icon={TrendingUp}>
      <div data-testid="marketing-overview-content">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold" data-testid="page-title">Panoramica Marketing</h2>
          <p className="text-muted-foreground" data-testid="page-subtitle">
            Dashboard completa delle performance marketing
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8" data-testid="kpi-cards">
          {mockKPIs.map((kpi, index) => {
            const IconComponent = kpi.icon;
            return (
              <Card key={index} data-testid={`kpi-card-${index}`}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {kpi.title}
                  </CardTitle>
                  <IconComponent className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid={`kpi-value-${index}`}>
                    {kpi.value}
                  </div>
                  <p className={`text-xs ${
                    kpi.trend === 'up' ? 'text-green-600' : 'text-red-600'
                  }`} data-testid={`kpi-change-${index}`}>
                    {kpi.change} dall'ultimo mese
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Charts and Calendar Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Performance Chart */}
          <Card className="lg:col-span-2" data-testid="performance-chart">
            <CardHeader>
              <CardTitle>Performance Settimanale</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={mockChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="impressions" fill="#8884d8" name="Impressioni" />
                  <Bar dataKey="clicks" fill="#82ca9d" name="Click" />
                  <Bar dataKey="conversions" fill="#ffc658" name="Conversioni" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Calendar */}
          <Card data-testid="marketing-calendar">
            <CardHeader>
              <CardTitle className="flex items-center">
                <CalendarIcon className="w-4 h-4 mr-2" />
                Calendario Campagne
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                disabled={() => true}
                onSelect={() => {}}
                className="rounded-md border"
                data-testid="readonly-calendar"
              />
              <div className="mt-4 space-y-2">
                <div className="text-sm">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span data-testid="legend-active">Campagne Attive</span>
                  </div>
                </div>
                <div className="text-sm">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span data-testid="legend-scheduled">Post Programmati</span>
                  </div>
                </div>
                <div className="text-sm">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                    <span data-testid="legend-deadlines">Scadenze</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Trend Chart */}
        <Card className="mt-6" data-testid="trend-chart">
          <CardHeader>
            <CardTitle>Trend Mensile Conversioni</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={mockLineData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#8884d8" 
                  strokeWidth={2}
                  name="Conversioni"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}