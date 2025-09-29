"use client"

import { useState, useEffect } from "react";
import { Bell, Clock, CheckCircle2, X, Settings, Filter } from "lucide-react";

// Mock notifications data
const mockNotifications = [
  {
    id: "notif-1",
    title: "I tuoi biglietti sono pronti",
    description: "La tua campagna marketing è stata completata con successo. Scarica i materiali dalla dashboard.",
    type: "success",
    timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
    read: false,
    category: "marketplace"
  },
  {
    id: "notif-2", 
    title: "Nuovo lead acquisito",
    description: "Un nuovo prospect ha mostrato interesse per i tuoi servizi. Controlla i dettagli nel CRM.",
    type: "info",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    read: false,
    category: "crm"
  },
  {
    id: "notif-3",
    title: "Campagna completata",
    description: "La tua campagna email ha raggiunto tutti i destinatari con un tasso di apertura del 35%.",
    type: "success", 
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
    read: true,
    category: "marketing"
  },
  {
    id: "notif-4",
    title: "Pagamento in scadenza",
    description: "Il tuo abbonamento Pro scadrà tra 7 giorni. Rinnova ora per continuare ad accedere a tutte le funzionalità.",
    type: "warning",
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    read: true,
    category: "billing"
  },
  {
    id: "notif-5",
    title: "Report settimanale disponibile",
    description: "Il tuo report settimanale delle performance è pronto. Visualizza le metriche e i trend della settimana.",
    type: "info",
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    read: true,
    category: "reports"
  }
];

// Local UI components to avoid import issues
const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`rounded-lg border bg-card text-card-foreground shadow-sm ${className}`}>
    {children}
  </div>
);

const CardContent = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`p-6 pt-0 ${className}`}>
    {children}
  </div>
);

const CardHeader = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`flex flex-col space-y-1.5 p-6 ${className}`}>
    {children}
  </div>
);

const CardTitle = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <h3 className={`text-2xl font-semibold leading-none tracking-tight ${className}`}>
    {children}
  </h3>
);

const Button = ({ children, onClick, className = "", variant = "default", size = "default", disabled = false }: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm" | "lg";
  disabled?: boolean;
}) => {
  const baseStyles = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";
  
  const variants = {
    default: "bg-primary text-primary-foreground hover:bg-primary/90",
    outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
    ghost: "hover:bg-accent hover:text-accent-foreground",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80"
  };
  
  const sizes = {
    default: "h-10 px-4 py-2",
    sm: "h-9 rounded-md px-3",
    lg: "h-11 rounded-md px-8"
  };
  
  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

const Badge = ({ children, className = "", variant = "default" }: {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "secondary" | "destructive" | "outline";
}) => {
  const variants = {
    default: "bg-primary text-primary-foreground",
    secondary: "bg-secondary text-secondary-foreground",
    destructive: "bg-destructive text-destructive-foreground",
    outline: "text-foreground"
  };
  
  return (
    <div className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${variants[variant]} ${className}`}>
      {children}
    </div>
  );
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState(mockNotifications);
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const categories = ["all", "marketplace", "crm", "marketing", "billing", "reports"];
  
  const formatTime = (timestamp: string) => {
    const now = new Date();
    const notifTime = new Date(timestamp);
    const diffMs = now.getTime() - notifTime.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) {
      return `${diffMins} min fa`;
    } else if (diffHours < 24) {
      return `${diffHours}h fa`;
    } else {
      return `${diffDays}g fa`;
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, read: true }))
    );
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  const filteredNotifications = notifications.filter(notif => {
    const matchesReadFilter = filter === "all" || 
      (filter === "read" && notif.read) || 
      (filter === "unread" && !notif.read);
    
    const matchesCategory = categoryFilter === "all" || notif.category === categoryFilter;
    
    return matchesReadFilter && matchesCategory;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case "warning":
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case "info":
      default:
        return <Bell className="h-5 w-5 text-blue-500" />;
    }
  };

  const getCategoryBadgeVariant = (category: string) => {
    switch (category) {
      case "marketplace":
        return "default";
      case "crm":
        return "secondary";
      case "marketing":
        return "outline";
      case "billing":
        return "destructive";
      default:
        return "outline";
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="h-6 w-6" />
                <div>
                  <CardTitle>Notifiche</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Gestisci le tue notifiche e avvisi
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <Badge variant="destructive">
                    {unreadCount} non lette
                  </Badge>
                )}
                <Button variant="outline" size="sm" onClick={markAllAsRead}>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Segna tutte come lette
                </Button>
                <Button variant="ghost" size="sm">
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <span className="text-sm font-medium">Filtra:</span>
              </div>
              
              {/* Read/Unread Filter */}
              <div className="flex gap-1">
                {["all", "unread", "read"].map((f) => (
                  <Button
                    key={f}
                    variant={filter === f ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setFilter(f as any)}
                  >
                    {f === "all" ? "Tutte" : f === "unread" ? "Non lette" : "Lette"}
                  </Button>
                ))}
              </div>

              {/* Category Filter */}
              <div className="flex gap-1">
                {categories.map((cat) => (
                  <Button
                    key={cat}
                    variant={categoryFilter === cat ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setCategoryFilter(cat)}
                  >
                    {cat === "all" ? "Tutte" : cat}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notifications List */}
        <div className="space-y-3">
          {filteredNotifications.length === 0 ? (
            <Card>
              <CardContent className="pt-8 pb-8 text-center">
                <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Nessuna notifica</h3>
                <p className="text-muted-foreground">
                  Non ci sono notifiche che corrispondono ai filtri selezionati.
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredNotifications.map((notification) => (
              <Card
                key={notification.id}
                className={`cursor-pointer transition-colors ${
                  !notification.read ? 'border-l-4 border-l-primary bg-accent/5' : ''
                }`}
                onClick={() => markAsRead(notification.id)}
              >
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className="mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h4 className={`font-medium text-sm ${!notification.read ? 'font-semibold' : ''}`}>
                            {notification.title}
                          </h4>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {notification.description}
                          </p>
                          <div className="flex items-center gap-3 mt-3">
                            <Badge 
                              variant={getCategoryBadgeVariant(notification.category)}
                              className="text-xs"
                            >
                              {notification.category}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {formatTime(notification.timestamp)}
                            </span>
                            {!notification.read && (
                              <Badge variant="destructive" className="text-xs">
                                Nuovo
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1">
                          {!notification.read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsRead(notification.id);
                              }}
                              className="text-xs"
                            >
                              Segna come letta
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notification.id);
                            }}
                            className="text-destructive hover:text-destructive"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Footer */}
        {filteredNotifications.length > 0 && (
          <Card className="mt-6">
            <CardContent className="pt-4 pb-4 text-center">
              <p className="text-sm text-muted-foreground">
                Mostrate {filteredNotifications.length} di {notifications.length} notifiche
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}