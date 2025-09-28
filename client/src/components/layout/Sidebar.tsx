import { Link, useLocation } from "wouter";
import { 
  Building2, 
  ChevronDown, 
  LayoutDashboard, 
  Target, 
  Megaphone, 
  Users, 
  Folder, 
  BarChart3,
  UserPlus,
  TrendingUp,
  Container,
  CheckSquare,
  ShoppingCart,
  MessageCircle,
  User,
  Settings
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface SidebarProps {
  currentOrg?: {
    id: string;
    name: string;
  };
  userRole?: string;
}

export function Sidebar({ currentOrg, userRole }: SidebarProps) {
  const [location] = useLocation();
  const { user } = useAuth();

  const isActive = (path: string) => location === path;

  const menuItems = [
    {
      path: "/",
      icon: LayoutDashboard,
      label: "Dashboard",
      roles: ["ORG_ADMIN", "MARKETER", "SALES", "VIEWER"]
    },
    {
      path: "/business-goals",
      icon: Target,
      label: "Obiettivi Aziendali",
      roles: ["ORG_ADMIN", "MARKETER", "SALES", "VIEWER"]
    }
  ];

  const marketingItems = [
    {
      path: "/marketing/campaigns",
      icon: Megaphone,
      label: "Campagne",
      roles: ["ORG_ADMIN", "MARKETER"]
    },
    {
      path: "/marketing/audiences",
      icon: Users,
      label: "Audience",
      roles: ["ORG_ADMIN", "MARKETER"]
    },
    {
      path: "/marketing/assets",
      icon: Folder,
      label: "Asset",
      roles: ["ORG_ADMIN", "MARKETER"]
    },
    {
      path: "/marketing/analytics",
      icon: BarChart3,
      label: "Analytics",
      roles: ["ORG_ADMIN", "MARKETER", "VIEWER"]
    }
  ];

  const crmItems = [
    {
      path: "/crm/leads",
      icon: UserPlus,
      label: "Lead",
      roles: ["ORG_ADMIN", "SALES"]
    },
    {
      path: "/crm/opportunities",
      icon: TrendingUp,
      label: "Opportunità",
      roles: ["ORG_ADMIN", "SALES"]
    },
    {
      path: "/crm/pipeline",
      icon: Container,
      label: "Container",
      roles: ["ORG_ADMIN", "SALES", "VIEWER"]
    }
  ];

  const globalItems = [
    {
      path: "/tasks",
      icon: CheckSquare,
      label: "Attività",
      roles: ["ORG_ADMIN", "MARKETER", "SALES", "VIEWER"]
    },
    {
      path: "/marketplace",
      icon: ShoppingCart,
      label: "Marketplace",
      roles: ["ORG_ADMIN", "MARKETER", "SALES"]
    },
    {
      path: "/chat",
      icon: MessageCircle,
      label: "Chat",
      badge: 3,
      roles: ["ORG_ADMIN", "MARKETER", "SALES", "VIEWER"]
    }
  ];

  const hasRole = (roles: string[]) => {
    return !userRole || roles.includes(userRole);
  };

  return (
    <div className="w-64 bg-card border-r border-border flex flex-col" data-testid="sidebar">
      {/* Organization Switcher */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Building2 className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <p className="font-semibold text-sm" data-testid="org-name">
                {currentOrg?.name || "Select Organization"}
              </p>
              <p className="text-xs text-muted-foreground" data-testid="user-role">
                {userRole || "No Role"}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="p-1">
            <ChevronDown className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4" data-testid="navigation">
        <div className="space-y-2">
          {/* Main Items */}
          {menuItems.map((item) => (
            hasRole(item.roles) && (
              <Link
                key={item.path}
                href={item.path}
                className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                  isActive(item.path)
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                }`}
                data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            )
          ))}

          {/* Marketing Section */}
          {marketingItems.some(item => hasRole(item.roles)) && (
            <div className="pt-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                Marketing
              </p>
              <div className="space-y-1">
                {marketingItems.map((item) => (
                  hasRole(item.roles) && (
                    <Link
                      key={item.path}
                      href={item.path}
                      className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                        isActive(item.path)
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-muted"
                      }`}
                      data-testid={`nav-marketing-${item.label.toLowerCase()}`}
                    >
                      <item.icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </Link>
                  )
                ))}
              </div>
            </div>
          )}

          {/* CRM Section */}
          {crmItems.some(item => hasRole(item.roles)) && (
            <div className="pt-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                CRM
              </p>
              <div className="space-y-1">
                {crmItems.map((item) => (
                  hasRole(item.roles) && (
                    <Link
                      key={item.path}
                      href={item.path}
                      className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                        isActive(item.path)
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-muted"
                      }`}
                      data-testid={`nav-crm-${item.label.toLowerCase()}`}
                    >
                      <item.icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </Link>
                  )
                ))}
              </div>
            </div>
          )}

          {/* Global Sections */}
          <div className="pt-2">
            {globalItems.map((item) => (
              hasRole(item.roles) && (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                    isActive(item.path)
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  }`}
                  data-testid={`nav-${item.label.toLowerCase()}`}
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.label}</span>
                  {item.badge && (
                    <Badge variant="destructive" className="ml-auto text-xs">
                      {item.badge}
                    </Badge>
                  )}
                </Link>
              )
            ))}
          </div>
        </div>
      </nav>

      {/* User Menu */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center">
            {user?.profileImageUrl ? (
              <img 
                src={user.profileImageUrl} 
                alt="Profile" 
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <User className="w-4 h-4 text-secondary-foreground" />
            )}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium" data-testid="user-name">
              {user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user?.email}
            </p>
            <p className="text-xs text-muted-foreground" data-testid="user-email">
              {user?.email}
            </p>
          </div>
          <Button variant="ghost" size="sm" className="p-1" data-testid="user-settings">
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
