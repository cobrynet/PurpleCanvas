import { useEffect } from "react";
import { useLocation } from "wouter";
import { useOrganization } from "@/hooks/useOrganization";

interface OrganizationGuardProps {
  children: React.ReactNode;
}

export function OrganizationGuard({ children }: OrganizationGuardProps) {
  const { selectedOrganization, hasOrganizations, isLoading } = useOrganization();
  const [location, setLocation] = useLocation();

  useEffect(() => {
    // Don't redirect while loading
    if (isLoading) return;

    // Don't redirect if we're already on the organization selector page
    if (location === "/select-organization") return;

    // Redirect to organization selector if no organization is available or selected
    if (!hasOrganizations || !selectedOrganization) {
      setLocation("/select-organization");
    }
  }, [isLoading, hasOrganizations, selectedOrganization, location, setLocation]);

  // Show loading state while auth is loading
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Show organization selector if no organization is available or selected
  if (!hasOrganizations || !selectedOrganization) {
    return null; // Redirection will be handled by useEffect
  }

  // Organization is selected, render protected content
  return <>{children}</>;
}