import Link from "next/link";
import {
  Sparkles,
  ArrowRight,
  ServerCog,
  KeyRound,
  Check,
  Search,
  Target,
  LineChart,
} from "lucide-react";
import { getUser } from "@/lib/auth";
import { ButtonLink } from "@/components/ui/button-link";
import { MockAudit } from "@/components/landing/mock-audit";

export default async function Home() {
  const user = await getUser();
  const primaryHref = user ? "/configure" : "/login";
  const primaryLabel = user ? "Go to app" : "Get started";

  return (
    <div className="flex flex-1 flex-col">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/15">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <span className="font-semibold tracking-tight">GetCited</span>
          </Link>
          <div className="flex items-center gap-2">
            {user ? (
              <ButtonLink size="sm" href="/configure">
                Go to app <ArrowRight className="h-4 w-4" />
              </ButtonLink>
            ) : (
              <>
                <ButtonLink variant="ghost" size="sm" href="/login">
                  Sign in
                </ButtonLink>
                <ButtonLink size="sm" href="/login">
                  Get started
                </ButtonLink>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto grid w-full max-w-6xl items-center gap-10 px-6 py-16 md:grid-cols-2 md:py-24">
        <div>
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-positive" />
            Measure · Diagnose · Plan · Track
          </div>
          <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
            Get cited by AI.{" "}
            <span className="text-primary">Know exactly what to do.</span>
          </h1>
          <p className="mt-4 max-w-lg text-pretty text-base text-muted-foreground sm:text-lg">
            GetCited measures whether AI assistants recommend your brand, then turns it
            into a <span className="text-foreground">costed, committed action plan</span> —
            grounded in how competitors are actually cited, not vibes.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <ButtonLink size="lg" href={primaryHref}>
              {primaryLabel} <ArrowRight className="h-4 w-4" />
            </ButtonLink>
            <span className="text-sm text-muted-foreground">
              No credit card. Try the free audit →
            </span>
          </div>

          <ul className="mt-8 grid gap-3 text-sm text-muted-foreground sm:grid-cols-3">
            <li className="flex items-center gap-2">
              <Search className="h-4 w-4 text-primary" /> Real AI panel
            </li>
            <li className="flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" /> Costed plan
            </li>
            <li className="flex items-center gap-2">
              <LineChart className="h-4 w-4 text-primary" /> Tracked impact
            </li>
          </ul>
        </div>

        <div className="md:pl-6">
          <MockAudit />
        </div>
      </section>

      {/* We Serve / Self Serve split */}
      <section className="mx-auto w-full max-w-6xl px-6 pb-20">
        <h2 className="mb-6 text-center text-lg font-medium text-muted-foreground">
          Two ways to run it
        </h2>
        <div className="grid gap-5 md:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15">
              <ServerCog className="h-5 w-5 text-primary" />
            </div>
            <h3 className="text-lg font-semibold">We Serve</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Use our infrastructure and keys. Sign in, configure, and run — nothing to set up.
            </p>
            <ul className="mt-4 space-y-2 text-sm">
              {["Our Claude + Perplexity panel", "Managed crawling & storage", "Fastest path to a plan"].map(
                (f) => (
                  <li key={f} className="flex items-center gap-2 text-muted-foreground">
                    <Check className="h-4 w-4 text-positive" /> {f}
                  </li>
                ),
              )}
            </ul>
            <ButtonLink className="mt-5" variant="outline" href={primaryHref}>
              {primaryLabel} <ArrowRight className="h-4 w-4" />
            </ButtonLink>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15">
              <KeyRound className="h-5 w-5 text-primary" />
            </div>
            <h3 className="text-lg font-semibold">Self Serve</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Bring your own keys or self-host. Session keys by default; opt in to encrypted storage.
            </p>
            <ul className="mt-4 space-y-2 text-sm">
              {["Your API keys, your control", "Session or AES-GCM encrypted keys", "One-click deploy your own instance"].map(
                (f) => (
                  <li key={f} className="flex items-center gap-2 text-muted-foreground">
                    <Check className="h-4 w-4 text-positive" /> {f}
                  </li>
                ),
              )}
            </ul>
            <ButtonLink className="mt-5" variant="outline" href={primaryHref}>
              Bring your keys <ArrowRight className="h-4 w-4" />
            </ButtonLink>
          </div>
        </div>
      </section>

      <footer className="border-t border-border/60">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6 text-xs text-muted-foreground">
          <span>© GetCited</span>
          <span>Projections are modeled estimates, not guarantees.</span>
        </div>
      </footer>
    </div>
  );
}
