"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

type RedirectIfAuthenticatedProps = {
  children: ReactNode;
  isLoading: boolean;
  isAuthenticated: boolean;
  redirectTo?: string;
  fallback?: ReactNode;
};

export function RedirectIfAuthenticated({
  children,
  isLoading,
  isAuthenticated,
  redirectTo = "/dashboard",
  fallback = null
}: RedirectIfAuthenticatedProps) {
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace(redirectTo);
    }
  }, [isLoading, isAuthenticated, redirectTo, router]);

  if (isLoading) {
    return fallback;
  }

  if (isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
