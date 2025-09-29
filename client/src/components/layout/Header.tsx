import { Search, Bell, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useUnreadNotificationsCount } from "@/hooks/useNotifications";

interface HeaderProps {
  title: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export function Header({ title, icon: Icon }: HeaderProps) {
  const unreadCount = useUnreadNotificationsCount();

  return (
    <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6" data-testid="header">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          {Icon && <Icon className="w-5 h-5 text-muted-foreground" />}
          <span className="text-lg font-semibold" data-testid="page-title">{title}</span>
        </div>
      </div>
      
      <div className="flex items-center space-x-4">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Cerca..."
            className="pl-10 pr-4 py-2 bg-muted border-0 rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-ring"
            data-testid="search-input"
          />
        </div>

        {/* Notifications */}
        <Button variant="ghost" size="sm" className="relative p-2 hover:bg-muted rounded-lg" data-testid="notifications-button">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge variant="destructive" className="absolute -top-1 -right-1 w-5 h-5 text-xs flex items-center justify-center">
              {unreadCount}
            </Badge>
          )}
        </Button>

        {/* Quick Actions */}
        <Button className="flex items-center space-x-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90" data-testid="new-activity-button">
          <Plus className="w-4 h-4" />
          <span>Nuova Attività</span>
        </Button>
      </div>
    </header>
  );
}
