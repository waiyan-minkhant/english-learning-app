"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "Overview" },
  { href: "/features", label: "Features" },
  { href: "/tech-stack", label: "Tech Stack" },
  { href: "/architecture", label: "Architecture" }
] as const;

export function DocShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen lg:flex">
      <aside className="border-b border-slate-800 bg-slate-950 lg:fixed lg:inset-y-0 lg:z-30 lg:w-64 lg:border-b-0 lg:border-r">
        <div className="flex h-full flex-col px-5 py-6">
          <Link href="/" className="group mb-8 block">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500 text-sm font-bold text-white shadow-lg shadow-brand-500/30">
                EL
              </div>
              <div>
                <p className="text-sm font-semibold text-white">English Learning</p>
                <p className="text-xs text-slate-400">Project documentation</p>
              </div>
            </div>
          </Link>

          <nav className="space-y-1">
            {navItems.map((item) => (
              <NavLink key={item.href} href={item.href}>
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="mt-auto hidden rounded-xl border border-slate-800 bg-slate-900/60 p-4 lg:block">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Monorepo
            </p>
            <p className="mt-1 text-sm text-slate-300">
              pnpm workspace · Turbo · TypeScript
            </p>
          </div>
        </div>
      </aside>

      <div className="flex-1 lg:pl-64">
        <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/80 backdrop-blur-md lg:hidden">
          <div className="flex gap-1 overflow-x-auto px-4 py-3">
            {navItems.map((item) => (
              <NavLink key={item.href} href={item.href} mobile>
                {item.label}
              </NavLink>
            ))}
          </div>
        </header>

        <main className="mx-auto max-w-4xl px-6 py-10 sm:px-10 sm:py-14">
          {children}
        </main>
      </div>
    </div>
  );
}

function NavLink({
  href,
  children,
  mobile = false
}: {
  href: string;
  children: React.ReactNode;
  mobile?: boolean;
}) {
  const pathname = usePathname();
  const active = pathname === href;

  if (mobile) {
    return (
      <Link
        href={href}
        className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
          active
            ? "bg-brand-500 text-white"
            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
        }`}
      >
        {children}
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className={`block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
        active
          ? "bg-brand-500/15 text-brand-300"
          : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
      }`}
    >
      {children}
    </Link>
  );
}
