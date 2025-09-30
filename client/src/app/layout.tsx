import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { 
  Target,
  Megaphone,
  Users,
  CheckSquare,
  ShoppingBag,
  Bell,
  Settings,
  User,
  LogOut,
  Share2
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

const navItems = [
  { id: "obiettivi", label: "Obiettivi", href: "/goals" },
  { id: "marketing", label: "Marketing", href: "/marketing" },
  { id: "social", label: "Social", href: "/social-connections" },
  { id: "commerciale", label: "CRM", href: "/crm/leads" },
  { id: "attivita", label: "Tasks", href: "/tasks" },
  { id: "marketplace", label: "Marketplace", href: "/marketplace" },
];

export function AppLayout({ children }: AppLayoutProps) {
  const [location] = useLocation();

  const isActiveRoute = (href: string, itemId?: string) => {
    if (location === "/goals") return itemId === "obiettivi";
    if (href !== "/" && location.startsWith(href)) return true;
    if (itemId === "commerciale" && location.startsWith("/crm")) return true;
    if (itemId === "marketing" && location.startsWith("/marketing")) return true;
    return false;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-6">
          {/* Logo */}
          <Link href="/">
            <Button variant="ghost" className="text-xl font-bold text-foreground hover:bg-transparent" data-testid="logo">
              Stratikey
            </Button>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const isActive = isActiveRoute(item.href, item.id);
              return (
                <Button
                  key={item.id}
                  variant="ghost"
                  className={`${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-foreground/70 hover:text-foreground hover:bg-accent"
                  }`}
                  data-testid={`nav-${item.id}`}
                  asChild
                >
                  <Link href={item.href}>{item.label}</Link>
                </Button>
              );
            })}
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-2">
            {/* Organization Selector */}
            <OrganizationSelector />

            {/* Notifications */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="relative"
                  data-testid="notifications-button"
                  aria-label="Notifiche"
                >
                  <Bell className="h-5 w-5" />
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
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Settings */}
            <Button 
              variant="ghost" 
              size="icon"
              data-testid="settings-button"
              aria-label="Impostazioni"
              asChild
            >
              <Link href="/settings">
                <Settings className="h-5 w-5" />
              </Link>
            </Button>

            {/* User Account */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="relative h-9 w-9 rounded-full"
                  data-testid="account-button"
                  aria-label="Account"
                >
                  <Avatar className="h-9 w-9">
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
                <DropdownMenuItem data-testid="account-settings-general" asChild>
                  <Link href="/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Impostazioni</span>
                  </Link>
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

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
