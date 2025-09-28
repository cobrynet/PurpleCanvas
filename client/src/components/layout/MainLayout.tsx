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
    <div className="flex h-screen" data-testid="main-layout">
      {/* Sidebar removed - using main sidebar from app/layout.tsx instead */}
      <div className="flex-1 flex flex-col">
        <Header title={title} icon={icon} />
        <main className="flex-1 p-6 overflow-auto bg-background" data-testid="main-content">
          {children}
        </main>
      </div>
    </div>
  );
}
