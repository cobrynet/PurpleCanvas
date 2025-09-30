import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { 
  Target,
  Megaphone,
  Users,
  CheckSquare,
  ShoppingBag,
  MessageCircle,
  Settings,
  User,
  Bell,
  MessageSquare,
  HelpCircle,
  Share2,
  LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { OrganizationSelector } from "@/components/OrganizationSelector";

interface AppLayoutProps {
  children: ReactNode;
}

const sidebarItems = [
  { id: "obiettivi", label: "Obiettivi", icon: Target, href: "/goals" },
  { id: "marketing", label: "Marketing", icon: Megaphone, href: "/marketing" },
  { id: "social", label: "Collega Social", icon: Share2, href: "/social-connections" },
  { id: "commerciale", label: "Commerciale", icon: Users, href: "/crm/leads" },
  { id: "attivita", label: "Attività", icon: CheckSquare, href: "/tasks" },
  { id: "marketplace", label: "Marketplace", icon: ShoppingBag, href: "/marketplace" },
  { id: "notifiche", label: "Notifiche", icon: Bell, href: "/notifications" },
  { id: "chat", label: "Chat", icon: MessageCircle, href: "/chat" },
  { id: "impostazioni", label: "Impostazioni", icon: Settings, href: "/settings" },
];

export function AppLayout({ children }: AppLayoutProps) {
  const [location] = useLocation();

  const isActiveRoute = (href: string, itemId?: string) => {
    // Highlight "obiettivi" when on goals route
    if (location === "/goals") return itemId === "obiettivi";
    if (href !== "/" && location.startsWith(href)) return true;
    // Special case for Commerciale to highlight on any CRM route
    if (itemId === "commerciale" && location.startsWith("/crm")) return true;
    // Special case for Marketing to highlight on any marketing route
    if (itemId === "marketing" && location.startsWith("/marketing")) return true;
    return false;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar Sinistra */}
      <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-sidebar text-sidebar-foreground border-r border-sidebar-border shadow-xl">
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center border-b border-sidebar-border px-6">
            <h1 className="text-xl font-bold text-sidebar-foreground">
              Stratikey
            </h1>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 p-4">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const isActive = isActiveRoute(item.href, item.id);
              
              return (
                <Button
                  key={item.id}
                  variant="ghost"
                  className={`w-full justify-start text-left font-normal h-11 transition-all ${
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground hover:bg-sidebar-accent/80"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                  }`}
                  data-testid={`sidebar-${item.id}`}
                  asChild
                >
                  <Link href={item.href}>
                    <Icon className="mr-3 h-4 w-4" />
                    {item.label}
                  </Link>
                </Button>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="pl-64">
        {/* Topbar */}
        <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
          <div className="flex h-16 items-center justify-end px-6">
            <div className="flex items-center space-x-4">
              {/* Organization Selector */}
              <OrganizationSelector />
              
              {/* Impostazioni */}
              <Button 
                variant="ghost" 
                size="sm"
                data-testid="settings-button"
                aria-label="Impostazioni"
                asChild
              >
                <Link href="/settings">
                  <Settings className="h-4 w-4" />
                  <span className="ml-2 hidden md:inline">Impostazioni</span>
                </Link>
              </Button>

              {/* Notifiche */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="relative"
                    data-testid="notifications-button"
                    aria-label="Notifiche"
                  >
                    <Bell className="h-4 w-4" />
                    <Badge 
                      className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500 text-white text-xs"
                    >
                      3
                    </Badge>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <DropdownMenuLabel>Notifiche</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem data-testid="notification-item">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">Nuova campagna creata</p>
                      <p className="text-xs text-muted-foreground">2 ore fa</p>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem data-testid="notification-item">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">Lead convertito</p>
                      <p className="text-xs text-muted-foreground">4 ore fa</p>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem data-testid="notification-item">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">Task completato</p>
                      <p className="text-xs text-muted-foreground">1 giorno fa</p>
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Feedback */}
              <Button 
                variant="ghost" 
                size="sm"
                data-testid="feedback-button"
                aria-label="Feedback"
              >
                <MessageSquare className="h-4 w-4" />
                <span className="ml-2 hidden md:inline">Feedback</span>
              </Button>

              {/* Assistenza */}
              <Button 
                variant="ghost" 
                size="sm"
                data-testid="help-button"
                aria-label="Assistenza"
              >
                <HelpCircle className="h-4 w-4" />
                <span className="ml-2 hidden md:inline">Assistenza</span>
              </Button>

              {/* Account */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="relative h-8 w-8 rounded-full"
                    data-testid="account-button"
                    aria-label="Account"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="/avatar.jpg" alt="User" />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        U
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">Account</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        user@example.com
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem data-testid="account-settings">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profilo</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem data-testid="account-settings-general">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Impostazioni</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    data-testid="account-logout"
                    onClick={() => window.location.href = '/api/logout'}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}