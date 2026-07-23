"use client";

import { useRouter } from "next/navigation";
import { type ReactNode, SubmitEvent, useEffect, useRef, useState } from "react";
import type { UseMutationResult } from "@tanstack/react-query";
import { DotGrid } from "@/components/backgrounds/DotGrid";
import { CheckIcon, CopyIcon, EyeIcon, EyeOffIcon } from "@/components/icons";
import { Button, Card, CardContent, Text } from "@/components/ui";
import { colors } from "@/design/tokens/colors";
import { RedirectIfAuthenticated } from "@/features/auth/components/RedirectIfAuthenticated";
import { useAuth } from "@/features/auth/hooks/useAuth";
import {
  loginRequestSchema,
  type AuthMeResponse,
  type LoginRequest
} from "@/features/auth/lib/auth";
import { cn } from "@/utils/cn";

const DEMO_PASSWORD = "password123";

const DEMO_ACCOUNTS = [
  {
    title: "Teacher account",
    email: "teacher@demo.local",
    password: DEMO_PASSWORD
  },
  {
    title: "Student account",
    email: "student1@demo.local",
    password: DEMO_PASSWORD
  }
] as const;

const AUTH_ERROR_MESSAGE = "Email or password incorrect";
const COPY_FEEDBACK_MS = 1500;

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
  const [showPassword, setShowPassword] = useState(false);
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
    } catch {
      setError(AUTH_ERROR_MESSAGE);
    }
  }

  return (
    <main className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-white px-6 py-10">
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <DotGrid
          className="h-full w-full"
          dotSize={7}
          gap={16}
          baseColor="#E5E5E5"
          activeColor={colors.primary}
          proximity={120}
          shockRadius={250}
          shockStrength={5}
          // resistance={750}
          returnDuration={1.5}
        />
      </div>
      <Card className="relative z-10 w-full max-w-[420px] rounded-[28px] border-0 shadow-md">
        <CardContent className="space-y-5 p-7 sm:p-8">
          <form onSubmit={onSubmit} className="space-y-5">
            <Text
              variant="heading"
              as="h1"
              className="text-center text-title-24 font-bold text-foreground"
            >
              Login
            </Text>

            <div className="space-y-3">
              <StackedField
                id="email"
                label="Email"
                type="email"
                value={email}
                onChange={setEmail}
                error={Boolean(error)}
                autoComplete="email"
                required
              />

              <StackedField
                id="password"
                label="Password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={setPassword}
                error={Boolean(error)}
                autoComplete="current-password"
                required
                minLength={8}
                trailing={
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="relative z-10 shrink-0 rounded-md p-1 text-icon hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? (
                      <EyeOffIcon size={18} />
                    ) : (
                      <EyeIcon size={18} />
                    )}
                  </button>
                }
              />

              {error ? (
                <Text
                  variant="caption"
                  tone="danger"
                  className="block text-body-12 leading-tight text-danger"
                >
                  {error}
                </Text>
              ) : null}
            </div>

            <Button
              type="submit"
              size="lg"
              disabled={login.isPending}
              className="h-12 w-full rounded-xl text-body-16 font-bold text-primary-foreground"
            >
              {login.isPending ? "Signing in..." : "Login"}
            </Button>
          </form>

          <DemoCredentialsPanel />
        </CardContent>
      </Card>
    </main>
  );
}

type StackedFieldProps = {
  id: string;
  label: string;
  type: string;
  value: string;
  onChange: (value: string) => void;
  error?: boolean;
  autoComplete?: string;
  required?: boolean;
  minLength?: number;
  trailing?: ReactNode;
};

function StackedField({
  id,
  label,
  type,
  value,
  onChange,
  error = false,
  autoComplete,
  required,
  minLength,
  trailing
}: StackedFieldProps) {
  const [focused, setFocused] = useState(false);
  const isFloating = focused || value.length > 0;

  return (
    <label
      htmlFor={id}
      className={cn(
        "relative flex min-h-[58px] cursor-text items-center gap-2 rounded-xl border bg-surface px-4 transition-colors",
        error
          ? "border-danger focus-within:border-danger"
          : "border-[#D8D8D8] focus-within:border-primary"
      )}
    >
      <span className="relative min-h-[42px] min-w-0 flex-1">
        <Text
          variant="caption"
          tone="muted"
          as="span"
          className={cn(
            "pointer-events-none absolute left-0 transition-all duration-150",
            isFloating
              ? "top-1 text-body-12 leading-none"
              : "top-1/2 -translate-y-1/2 text-body-16 font-semibold leading-none"
          )}
        >
          {label}
        </Text>
        <input
          id={id}
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          autoComplete={autoComplete}
          required={required}
          minLength={minLength}
          className={cn(
            "absolute inset-x-0 bottom-1 w-full border-0 bg-transparent p-0 text-body-16 font-semibold leading-tight text-foreground outline-none placeholder:text-muted-foreground",
            !isFloating && "opacity-0"
          )}
        />
      </span>
      {trailing}
    </label>
  );
}

function DemoCredentialsPanel() {
  return (
    <div className="rounded-2xl bg-muted px-4 py-3.5">
      {DEMO_ACCOUNTS.map((account, index) => (
        <div
          key={account.email}
          className={cn(index > 0 && "mt-3 border-t border-[#E2E2E2] pt-3")}
        >
          <Text
            variant="caption"
            weight="bold"
            className="mb-1 block text-body-12 text-muted-foreground"
          >
            {account.title}
          </Text>
          <CredentialRow label="Email" value={account.email} />
          <CredentialRow label="Password" value={account.password} />
        </div>
      ))}
    </div>
  );
}

type CredentialRowProps = {
  label: string;
  value: string;
};

function CredentialRow({ label, value }: CredentialRowProps) {
  const [copied, setCopied] = useState(false);
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (resetTimerRef.current) {
        clearTimeout(resetTimerRef.current);
      }
    };
  }, []);

  async function copyValue() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      if (resetTimerRef.current) {
        clearTimeout(resetTimerRef.current);
      }
      resetTimerRef.current = setTimeout(() => {
        setCopied(false);
        resetTimerRef.current = null;
      }, COPY_FEEDBACK_MS);
    } catch {
      // Clipboard may be unavailable in insecure contexts; ignore.
    }
  }

  return (
    <div className="flex items-center gap-1.5 text-body-12 text-muted-foreground">
      <Text variant="caption" className="text-body-12">
        {label}: {value}
      </Text>
      <button
        type="button"
        onClick={() => void copyValue()}
        className="shrink-0 rounded p-0.5 hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        aria-label={copied ? "Copied" : `Copy ${label.toLowerCase()}`}
      >
        {copied ? (
          <CheckIcon size={12} className="text-success" />
        ) : (
          <CopyIcon size={12} className="text-muted-foreground" />
        )}
      </button>
    </div>
  );
}
