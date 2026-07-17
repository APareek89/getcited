import { getActiveConfig } from "@/lib/db/configs";
import { ConfigureForm } from "@/components/configure/configure-form";
import { ConfigurePlatform } from "@/components/configure/configure-platform";

export const metadata = { title: "Configure · GetCited" };

export default async function ConfigurePage() {
  const initial = await getActiveConfig();
  return (
    <div className="mx-auto max-w-6xl px-5 py-5 md:px-8">
      <div className="mb-4">
        <h1 className="text-xl font-semibold tracking-tight">Configure</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Your business on the left, how runs are powered on the right. Saved as a version
          you can revisit.
          {initial ? (
            <span className="text-muted-foreground/80"> Editing from v{initial.version}.</span>
          ) : null}
        </p>
      </div>
      <div className="grid items-start gap-4 lg:grid-cols-[3fr_2fr]">
        <ConfigureForm initial={initial} />
        <ConfigurePlatform initialMode={initial?.mode ?? "we_serve"} />
      </div>
    </div>
  );
}
