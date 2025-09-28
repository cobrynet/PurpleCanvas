import { Megaphone, UserPlus, ShoppingCart } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function QuickActions() {
  const actions = [
    {
      icon: Megaphone,
      title: "Nuova Campagna",
      description: "Crea campagna marketing",
      color: "bg-primary/10",
      iconColor: "text-primary",
      testId: "quick-action-campaign"
    },
    {
      icon: UserPlus,
      title: "Aggiungi Lead",
      description: "Nuovo contatto commerciale",
      color: "bg-secondary/10",
      iconColor: "text-secondary",
      testId: "quick-action-lead"
    },
    {
      icon: ShoppingCart,
      title: "Marketplace",
      description: "Sfoglia servizi disponibili",
      color: "bg-accent/20",
      iconColor: "text-accent-foreground",
      testId: "quick-action-marketplace"
    }
  ];

  return (
    <Card data-testid="quick-actions">
      <CardHeader>
        <h3 className="text-lg font-semibold">Azioni Rapide</h3>
      </CardHeader>
      <CardContent className="space-y-3">
        {actions.map((action) => (
          <Button
            key={action.title}
            variant="ghost"
            className="w-full flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors text-left h-auto"
            data-testid={action.testId}
          >
            <div className={`${action.color} p-2 rounded-lg`}>
              <action.icon className={`w-4 h-4 ${action.iconColor}`} />
            </div>
            <div>
              <p className="font-medium">{action.title}</p>
              <p className="text-sm text-muted-foreground">{action.description}</p>
            </div>
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}
