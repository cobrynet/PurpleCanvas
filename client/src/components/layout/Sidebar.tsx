import { 
  Building2, 
  ChevronDown,
  User,
  Settings
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

interface SidebarProps {
  currentOrg?: {
    id: string;
    name: string;
  };
  userRole?: string;
}

export function Sidebar({ currentOrg, userRole }: SidebarProps) {
  const { user } = useAuth();

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

      {/* Navigation - Using main sidebar from app/layout.tsx instead */}
      <nav className="flex-1 p-4" data-testid="navigation">
        <div className="space-y-2">
          <div className="text-center text-sm text-muted-foreground py-8">
            <p>Navigation handled by main layout</p>
            <p className="text-xs mt-2">(Obiettivi, Marketing, Commerciale, Attività, Marketplace, Chat, Impostazioni)</p>
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