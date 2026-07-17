"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, SlidersHorizontal, Bot, Plug, ListChecks, LayoutDashboard, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { LogoMark } from "@/components/logo";

const NAV = [
  { href: "/", label: "Home", icon: Home },
  { href: "/configure", label: "Configure", icon: SlidersHorizontal },
  { href: "/assistant", label: "GEO Agent", icon: Bot },
  { href: "/connector", label: "GEO MCP", icon: Plug },
  { href: "/tracker", label: "Tracker", icon: ListChecks },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
];

/** Aurora Glass top navigation bar (replaces the old left sidebar). */
export function AppShell({
  email,
  children,
}: {
  email: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="sticky top-0 z-50 glass-header">
        <div className="flex h-14 items-center gap-4 px-5">
          <Link href="/" className="flex shrink-0 items-center gap-2">
            <LogoMark className="h-7 w-7" />
            <span className="hidden font-semibold tracking-tight sm:inline">GetCited</span>
          </Link>

          <nav className="flex flex-1 items-center gap-1 pl-3">
            {NAV.map((item) => {
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : pathname === item.href || pathname.startsWith(`${item.href}/`);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm transition-colors",
                    active
                      ? "bg-aurora text-white shadow-[0_0_18px_rgba(124,58,237,0.35)]"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden md:inline">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            <span className="hidden max-w-[180px] truncate text-xs text-muted-foreground lg:inline" title={email}>
              {email}
            </span>
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                aria-label="Sign out"
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
