"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useAuthStore } from "@/features/auth/store/authStore";
import type { LoginRequest, SessionUser } from "@/features/auth/lib/auth";
import { authService } from "@/services/authService";

export const authQueryKey = ["auth", "me"] as const;

export function useAuth() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const clearUser = useAuthStore((state) => state.clearUser);

  const query = useQuery({
    queryKey: authQueryKey,
    queryFn: () => authService.me(),
    retry: false,
    staleTime: 60_000,
    refetchOnWindowFocus: false
  });

  useEffect(() => {
    if (query.data?.user) {
      setUser(query.data.user);
    }
  }, [query.data?.user, setUser]);

  useEffect(() => {
    if (query.isError) {
      clearUser();
    }
  }, [query.isError, clearUser]);

  const resolvedUser = (query.data?.user ?? user) as SessionUser | undefined;
  const isLoading = !query.isFetched && query.isPending;
  const isAuthenticated = query.isSuccess && !!query.data?.user;

  const loginMutation = useMutation({
    mutationFn: (credentials: LoginRequest) => authService.login(credentials),
    onSuccess: (data) => {
      setUser(data.user);
      queryClient.setQueryData(authQueryKey, data);
    }
  });

  const logoutMutation = useMutation({
    mutationFn: () => authService.logout(),
    onSuccess: () => {
      clearUser();
      queryClient.setQueryData(authQueryKey, null);
    }
  });

  return {
    user: resolvedUser,
    isLoading,
    isAuthenticated,
    error: query.error,
    refetch: query.refetch,
    login: loginMutation,
    logout: logoutMutation
  };
}
