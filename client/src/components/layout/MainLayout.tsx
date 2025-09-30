import { ReactNode, useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Header } from "./Header";
import { useQuery } from "@tanstack/react-query";

interface MainLayoutProps {
  children: ReactNode;
  title: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export function MainLayout({ children, title, icon }: MainLayoutProps) {
  const { user } = useAuth();
  const [currentOrgId, setCurrentOrgId] = useState<string>("");
  
  // Get current organization from user's organizations
  const currentOrg = user?.organizations?.[0]; // Default to first org for now
  const currentMembership = currentOrg?.membership;

  useEffect(() => {
    if (currentOrg?.id) {
      setCurrentOrgId(currentOrg.id);
    }
  }, [currentOrg]);

  return (
    <div className="w-full" data-testid="main-layout">
      <Header title={title} icon={icon} />
      <main className="container mx-auto px-6 py-8" data-testid="main-content">
        {children}
      </main>
    </div>
  );
}
