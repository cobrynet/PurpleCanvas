import { useQuery } from "@tanstack/react-query";
import type { User, Organization, Membership } from "@shared/schema";

type AuthUser = User & {
  organizations?: (Organization & { membership: Membership })[];
};

export function useAuth() {
  const { data: user, isLoading } = useQuery<AuthUser>({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
  };
}
