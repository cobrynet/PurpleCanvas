import { useState, useEffect, useContext, createContext } from "react";
import type { ReactNode } from "react";
import { useAuth } from "./useAuth";
import type { Organization, Membership } from "@shared/schema";
import { queryClient } from "@/lib/queryClient";

type OrganizationWithMembership = Organization & { membership: Membership };

interface OrganizationContextValue {
  selectedOrganization: OrganizationWithMembership | null;
  availableOrganizations: OrganizationWithMembership[];
  selectOrganization: (organizationId: string) => void;
  isLoading: boolean;
  hasOrganizations: boolean;
}

const OrganizationContext = createContext<OrganizationContextValue | null>(null);

const ORGANIZATION_COOKIE_KEY = "stratikey_selected_org";

// Helper functions for cookie management
function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift() || null;
  }
  return null;
}

function setCookie(name: string, value: string, days: number = 30): void {
  if (typeof document === "undefined") return;
  
  const expires = new Date();
  expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;samesite=lax`;
}

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const { user, isLoading: authLoading } = useAuth();
  const [selectedOrganization, setSelectedOrganization] = useState<OrganizationWithMembership | null>(null);

  const availableOrganizations = user?.organizations || [];
  const hasOrganizations = availableOrganizations.length > 0;

  // Initialize selected organization from cookie or default to first available
  useEffect(() => {
    if (authLoading || !user || !hasOrganizations) {
      setSelectedOrganization(null);
      return;
    }

    // Try to get saved organization from cookie
    const savedOrgId = getCookie(ORGANIZATION_COOKIE_KEY);
    
    if (savedOrgId) {
      // Find the saved organization in user's available organizations
      const savedOrg = availableOrganizations.find(org => org.id === savedOrgId);
      if (savedOrg) {
        setSelectedOrganization(savedOrg);
        return;
      }
    }

    // Default to first organization if no valid saved selection
    if (availableOrganizations.length > 0) {
      setSelectedOrganization(availableOrganizations[0]);
      setCookie(ORGANIZATION_COOKIE_KEY, availableOrganizations[0].id);
    }
  }, [user, authLoading, hasOrganizations, availableOrganizations]);

  const selectOrganization = (organizationId: string) => {
    const organization = availableOrganizations.find(org => org.id === organizationId);
    if (organization) {
      setSelectedOrganization(organization);
      setCookie(ORGANIZATION_COOKIE_KEY, organizationId);
      
      // Invalidate all queries to refetch data for the new organization
      queryClient.invalidateQueries();
    }
  };

  const contextValue: OrganizationContextValue = {
    selectedOrganization,
    availableOrganizations,
    selectOrganization,
    isLoading: authLoading,
    hasOrganizations,
  };

  return (
    <OrganizationContext.Provider value={contextValue}>
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganization(): OrganizationContextValue {
  const context = useContext(OrganizationContext);
  if (!context) {
    throw new Error("useOrganization must be used within an OrganizationProvider");
  }
  return context;
}

// Helper hook to get current organization ID for API calls
export function useCurrentOrganizationId(): string | null {
  const { selectedOrganization } = useOrganization();
  return selectedOrganization?.id || null;
}