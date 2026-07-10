"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import type { SessionUser } from "@/features/auth/lib/auth";

type RequireAuthProps = {
  children: (user: SessionUser) => ReactNode;
  fallback?: ReactNode;
};

export function RequireAuth({ children, fallback = null }: RequireAuthProps) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return fallback;
  }

  if (!user) {
    return null;
  }

  return <>{children(user)}</>;
}
