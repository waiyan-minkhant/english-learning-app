"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { SubmitEvent, useState } from "react";
import type { UseMutationResult } from "@tanstack/react-query";
import { Button, Card, CardContent, Input, Text } from "@/components/ui";
import { RedirectIfAuthenticated } from "@/features/auth/components/RedirectIfAuthenticated";
import { useAuth } from "@/features/auth/hooks/useAuth";
import {
  loginRequestSchema,
  type AuthMeResponse,
  type LoginRequest
} from "@/features/auth/lib/auth";

export default function LoginPage() {
  const { login, isLoading, isAuthenticated } = useAuth();

  return (
    <RedirectIfAuthenticated
      isLoading={isLoading}
      isAuthenticated={isAuthenticated}
      fallback={<main className="p-6">Loading...</main>}
    >
      <LoginForm login={login} />
    </RedirectIfAuthenticated>
  );
}

type LoginFormProps = {
  login: UseMutationResult<AuthMeResponse, Error, LoginRequest, unknown>;
};

function LoginForm({ login }: LoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const payload: LoginRequest = { email, password };
    const parsed = loginRequestSchema.safeParse(payload);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }

    try {
      await login.mutateAsync(parsed.data);
      router.push("/dashboard");
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Login failed"
      );
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-6">
      <Card className="w-full">
        <CardContent className="space-y-4">
          <form onSubmit={onSubmit} className="space-y-4">
            <Text variant="heading" as="h1">
              Login
            </Text>
            <div className="space-y-2">
              <Text variant="label" htmlFor="email">
                Email
              </Text>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Text variant="label" htmlFor="password">
                Password
              </Text>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                minLength={8}
              />
            </div>
            {error ? (
              <Text variant="body" tone="danger">
                {error}
              </Text>
            ) : null}
            <Button type="submit" disabled={login.isPending}>
              {login.isPending ? "Signing in..." : "Login"}
            </Button>
            <Text variant="body">
              No account yet?{" "}
              <Link href="/register" className="text-primary underline">
                Register
              </Link>
            </Text>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
