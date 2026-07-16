import { type LucideIcon } from "lucide-react";

export function ComingSoon({
  icon: Icon,
  title,
  phase,
  children,
}: {
  icon: LucideIcon;
  title: string;
  phase: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[70vh] flex-1 items-center justify-center p-6">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-card">
          <Icon className="h-6 w-6 text-primary" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{children}</p>
        <p className="mt-6 text-xs uppercase tracking-widest text-muted-foreground/60">
          {phase}
        </p>
      </div>
    </div>
  );
}
