"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { meRequest } from "@/lib/api";
import type { SessionUser } from "@/lib/auth";
import {
  clearStoredUser,
  getStoredUser,
  saveStoredUser
} from "@/lib/auth-storage";

type RequireAuthProps = {
  children: (user: SessionUser) => ReactNode;
  fallback?: ReactNode;
};

export function RequireAuth({ children, fallback = null }: RequireAuthProps) {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(() => getStoredUser());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    meRequest()
      .then((data) => {
        if (!active) return;
        saveStoredUser(data.user);
        setUser(data.user);
      })
      .catch(() => {
        if (!active) return;
        clearStoredUser();
        setUser(null);
        router.replace("/login");
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [router]);

  if (loading) {
    return fallback;
  }

  if (!user) {
    return null;
  }

  return <>{children(user)}</>;
}
