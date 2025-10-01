import { ReactNode, useState } from "react";
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
  LogOut,
  Package,
  Menu,
  X
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
import { useOrganization } from "@/hooks/useOrganization";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNotifications, useUnreadNotificationsCount } from "@/hooks/useNotifications";

interface AppLayoutProps {
  children: ReactNode;
}

const allSidebarItems = [
  { id: "obiettivi", labelKey: "nav.goals" as const, icon: Target, href: "/goals" },
  { id: "marketing", labelKey: "nav.marketing" as const, icon: Megaphone, href: "/marketing" },
  { id: "social", labelKey: "nav.social" as const, icon: Share2, href: "/social-connections" },
  { id: "commerciale", labelKey: "nav.crm" as const, icon: Users, href: "/crm/leads" },
  { id: "attivita", labelKey: "nav.tasks" as const, icon: CheckSquare, href: "/tasks" },
  { id: "marketplace", labelKey: "nav.marketplace" as const, icon: ShoppingBag, href: "/marketplace" },
  { id: "vendor", labelKey: "nav.vendor" as const, icon: Package, href: "/vendor", vendorOnly: true },
  { id: "notifiche", labelKey: "nav.notifications" as const, icon: Bell, href: "/notifications" },
  { id: "chat", labelKey: "nav.chat" as const, icon: MessageCircle, href: "/chat" },
  { id: "impostazioni", labelKey: "nav.settings" as const, icon: Settings, href: "/settings" },
];

export function AppLayout({ children }: AppLayoutProps) {
  const [location] = useLocation();
  const { selectedOrganization } = useOrganization();
  const userRole = selectedOrganization?.membership?.role;
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { t } = useLanguage();
  const { data: notificationsData } = useNotifications();
  const unreadCount = useUnreadNotificationsCount();
  
  // Filter sidebar items based on user role
  const sidebarItems = allSidebarItems.filter(item => {
    if (item.vendorOnly) {
      return userRole === 'VENDOR';
    }
    return true;
  });

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
    <div className="min-h-screen bg-white dark:bg-black">
      {/* Skip to main content for accessibility */}
      <a href="#main-content" className="skip-to-main">
        {t('a11y.skipToMain')}
      </a>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed left-0 top-0 z-50 h-screen w-64 bg-gradient-to-b from-[#390035] to-[#901d6b] text-white border-r border-border transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label={t('a11y.mainNav')}
      >
        <div className="flex h-full flex-col">
          {/* Logo and close button */}
          <div className="flex h-16 items-center justify-between border-b border-white/20 px-6">
            <h1 className="text-xl font-bold text-white">
              Stratikey
            </h1>
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden text-white hover:bg-white/10"
              onClick={() => setSidebarOpen(false)}
              aria-label={t('a11y.closeMenu')}
              data-testid="close-sidebar"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 p-4" aria-label={t('a11y.mainNav')}>
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const isActive = isActiveRoute(item.href, item.id);
              const label = t(item.labelKey);
              
              return (
                <Button
                  key={item.id}
                  variant="ghost"
                  className={`w-full justify-start text-left font-normal h-11 ${
                    isActive
                      ? "bg-white/20 text-white hover:bg-white/30"
                      : "text-white/80 hover:bg-white/10 hover:text-white"
                  }`}
                  data-testid={`sidebar-${item.id}`}
                  aria-label={label}
                  aria-current={isActive ? "page" : undefined}
                  asChild
                >
                  <Link href={item.href} onClick={() => setSidebarOpen(false)}>
                    <Icon className="mr-3 h-4 w-4" aria-hidden="true" />
                    {label}
                  </Link>
                </Button>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="lg:pl-64">
        {/* Topbar */}
        <header className="sticky top-0 z-30 border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:bg-black/95 dark:supports-[backdrop-filter]:bg-black/60">
          <div className="flex h-16 items-center justify-between lg:justify-end px-4 lg:px-6">
            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
              aria-label={t('a11y.openMenu')}
              data-testid="open-sidebar"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex items-center space-x-4">
              {/* Organization Selector */}
              <OrganizationSelector />
              
              {/* Impostazioni */}
              <Button 
                variant="ghost" 
                size="sm"
                data-testid="settings-button"
                aria-label={t('header.settings')}
                asChild
              >
                <Link href="/settings">
                  <Settings className="h-4 w-4" />
                  <span className="ml-2 hidden md:inline">{t('header.settings')}</span>
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
                    aria-label={t('header.notifications')}
                  >
                    <Bell className="h-4 w-4" />
                    {unreadCount > 0 && (
                      <Badge 
                        className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500 text-white text-xs"
                      >
                        {unreadCount}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80 max-h-[400px] overflow-y-auto">
                  <DropdownMenuLabel>{t('header.notifications')}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {notificationsData?.notifications && notificationsData.notifications.length > 0 ? (
                    notificationsData.notifications.map((notification) => (
                      <DropdownMenuItem key={notification.id} data-testid="notification-item">
                        <div className="flex flex-col w-full">
                          <p className="text-sm font-medium">{notification.title}</p>
                          <p className="text-xs text-muted-foreground">{notification.message}</p>
                          {notification.createdAt && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(notification.createdAt).toLocaleDateString('it-IT')}
                            </p>
                          )}
                        </div>
                      </DropdownMenuItem>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-sm text-muted-foreground">
                      Nessuna notifica
                    </div>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Feedback */}
              <Button 
                variant="ghost" 
                size="sm"
                data-testid="feedback-button"
                aria-label={t('header.feedback')}
              >
                <MessageSquare className="h-4 w-4" />
                <span className="ml-2 hidden md:inline">{t('header.feedback')}</span>
              </Button>

              {/* Assistenza */}
              <Button 
                variant="ghost" 
                size="sm"
                data-testid="help-button"
                aria-label={t('header.help')}
              >
                <HelpCircle className="h-4 w-4" />
                <span className="ml-2 hidden md:inline">{t('header.help')}</span>
              </Button>

              {/* Account */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="relative h-8 w-8 rounded-full"
                    data-testid="account-button"
                    aria-label={t('header.account')}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="/avatar.jpg" alt="User" />
                      <AvatarFallback className="bg-[#390035] text-white">
                        U
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{t('header.account')}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        user@example.com
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem data-testid="account-settings">
                    <User className="mr-2 h-4 w-4" />
                    <span>{t('header.profile')}</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem data-testid="account-settings-general">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>{t('header.settings')}</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    data-testid="account-logout"
                    onClick={() => window.location.href = '/api/logout'}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>{t('header.logout')}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main id="main-content" className="flex-1" role="main">
          {children}
        </main>
      </div>
    </div>
  );
}