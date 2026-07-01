"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { meRequest } from "@/lib/api";
import {
  clearStoredUser,
  saveStoredUser
} from "@/lib/auth-storage";

type RedirectIfAuthenticatedProps = {
  children: ReactNode;
  redirectTo?: string;
  fallback?: ReactNode;
};

export function RedirectIfAuthenticated({
  children,
  redirectTo = "/dashboard",
  fallback = null
}: RedirectIfAuthenticatedProps) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let active = true;

    meRequest()
      .then((data) => {
        if (!active) return;
        saveStoredUser(data.user);
        router.replace(redirectTo);
      })
      .catch(() => {
        if (!active) return;
        clearStoredUser();
        setChecking(false);
      });

    return () => {
      active = false;
    };
  }, [redirectTo, router]);

  if (checking) {
    return fallback;
  }

  return <>{children}</>;
}
