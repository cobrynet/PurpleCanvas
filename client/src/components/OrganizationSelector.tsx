import { Building2, Check, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useOrganization } from "@/hooks/useOrganization";

export function OrganizationSelector() {
  const { 
    selectedOrganization, 
    availableOrganizations, 
    selectOrganization, 
    isLoading,
    hasOrganizations 
  } = useOrganization();

  if (isLoading || !hasOrganizations) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className="h-9 max-w-[200px] justify-between bg-background/50 hover:bg-background/80"
          data-testid="organization-selector"
        >
          <div className="flex items-center min-w-0">
            <Building2 className="h-4 w-4 mr-2 shrink-0" />
            <span className="truncate">
              {selectedOrganization?.name || "Seleziona Organizzazione"}
            </span>
          </div>
          <ChevronDown className="h-4 w-4 ml-2 shrink-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[250px]">
        <DropdownMenuLabel>Organizzazioni</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {availableOrganizations.map((org) => (
          <DropdownMenuItem
            key={org.id}
            onClick={() => selectOrganization(org.id)}
            className="flex items-center justify-between cursor-pointer"
            data-testid={`org-option-${org.id}`}
          >
            <div className="flex flex-col flex-1 min-w-0">
              <div className="flex items-center">
                <span className="font-medium truncate">{org.name}</span>
                {selectedOrganization?.id === org.id && (
                  <Check className="h-4 w-4 ml-2 text-primary" />
                )}
              </div>
              <div className="flex items-center mt-1">
                <Badge 
                  variant="secondary" 
                  className="text-xs"
                >
                  {org.membership.role}
                </Badge>
                {org.plan && (
                  <Badge 
                    variant="outline" 
                    className="text-xs ml-2"
                  >
                    {org.plan}
                  </Badge>
                )}
              </div>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}