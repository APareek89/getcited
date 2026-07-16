import { getActiveConfig } from "@/lib/db/configs";
import { ConfigureForm } from "@/components/configure/configure-form";
import { ConfigurePlatform } from "@/components/configure/configure-platform";

export const metadata = { title: "Configure · GetCited" };

export default async function ConfigurePage() {
  const initial = await getActiveConfig();
  return (
    <div>
      <ConfigureForm initial={initial} />
      <div className="mx-auto max-w-3xl px-6 pb-10 md:px-10">
        <ConfigurePlatform initialMode={initial?.mode ?? "we_serve"} />
      </div>
    </div>
  );
}
