import { Sparkles } from "lucide-react";

export default function Home() {
  return (
    <main className="flex flex-1 items-center justify-center px-6">
      <div className="mx-auto max-w-2xl text-center">
        <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-card">
          <Sparkles className="h-6 w-6 text-primary" />
        </div>
        <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
          Get cited by AI.{" "}
          <span className="text-primary">Know exactly what to do.</span>
        </h1>
        <p className="mt-4 text-pretty text-base text-muted-foreground sm:text-lg">
          GetCited measures whether AI assistants recommend your brand, then turns
          it into a costed, committed action plan — grounded in how competitors are
          actually cited.
        </p>
        <p className="mt-8 text-xs uppercase tracking-widest text-muted-foreground/70">
          Phase 0 · scaffold ready
        </p>
      </div>
    </main>
  );
}
