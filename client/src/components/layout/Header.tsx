import { useState, useRef, useEffect } from "react";
import { Search, Bell, Plus, FileText, Users, Target, CheckSquare, MessageSquare, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useUnreadNotificationsCount } from "@/hooks/useNotifications";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";

interface HeaderProps {
  title: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export function Header({ title, icon: Icon }: HeaderProps) {
  const unreadCount = useUnreadNotificationsCount();
  const [searchQuery, setSearchQuery] = useState("");
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Search query
  const { data: searchResults, isLoading: isSearching } = useQuery<{
    query: string;
    totalResults: number;
    results: {
      assets: any[];
      campaigns: any[];
      leads: any[];
      opportunities: any[];
      tasks: any[];
      conversations: any[];
    };
  }>({
    queryKey: ["/api/search", { q: searchQuery }],
    enabled: searchQuery.length >= 2,
    retry: false,
  });

  // Close results when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Show results when query is entered
  useEffect(() => {
    if (searchQuery.length >= 2) {
      setShowResults(true);
    } else {
      setShowResults(false);
    }
  }, [searchQuery]);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'assets': return Image;
      case 'campaigns': return Target;
      case 'leads': return Users;
      case 'opportunities': return Target;
      case 'tasks': return CheckSquare;
      case 'conversations': return MessageSquare;
      default: return FileText;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'assets': return 'Asset';
      case 'campaigns': return 'Campagne';
      case 'leads': return 'Lead';
      case 'opportunities': return 'Opportunità';
      case 'tasks': return 'Task';
      case 'conversations': return 'Conversazioni';
      default: return category;
    }
  };

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
        <div className="relative" ref={searchRef}>
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Cerca..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 bg-muted border-0 rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-ring"
            data-testid="search-input"
          />
          
          {/* Search Results Dropdown */}
          {showResults && searchQuery.length >= 2 && (
            <Card className="absolute top-12 left-0 w-96 max-h-96 overflow-y-auto z-50 shadow-lg" data-testid="search-results">
              <CardContent className="p-4">
                {isSearching ? (
                  <div className="text-sm text-muted-foreground">Ricerca in corso...</div>
                ) : searchResults && searchResults.totalResults > 0 ? (
                  <div className="space-y-4">
                    <div className="text-xs text-muted-foreground">
                      {searchResults.totalResults} risultati trovati
                    </div>
                    {searchResults.results && Object.entries(searchResults.results).map(([category, items]: [string, any]) => {
                      if (!items || items.length === 0) return null;
                      const CategoryIcon = getCategoryIcon(category);
                      return (
                        <div key={category} className="space-y-2">
                          <div className="flex items-center space-x-2 text-sm font-semibold">
                            <CategoryIcon className="w-4 h-4" />
                            <span>{getCategoryLabel(category)}</span>
                            <Badge variant="secondary" className="text-xs">{items.length}</Badge>
                          </div>
                          <div className="space-y-1">
                            {items.map((item: any) => (
                              <div
                                key={item.id}
                                className="p-2 hover:bg-muted rounded-lg cursor-pointer text-sm"
                                data-testid={`search-result-${category}-${item.id}`}
                              >
                                <div className="font-medium text-foreground">
                                  {item.title || item.name || item.customerName || 'N/A'}
                                </div>
                                {(item.description || item.email || item.company) && (
                                  <div className="text-xs text-muted-foreground truncate">
                                    {item.description || item.email || item.company}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">Nessun risultato trovato</div>
                )}
              </CardContent>
            </Card>
          )}
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
