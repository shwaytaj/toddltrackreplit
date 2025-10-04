import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";

export function useUser() {
  const { data: user, isLoading, error } = useQuery<User | null>({
    queryKey: ["/api/auth/me"],
    retry: false,
    // Return null if unauthorized instead of throwing
    meta: { unauthorizedBehavior: "returnNull" },
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
  };
}
