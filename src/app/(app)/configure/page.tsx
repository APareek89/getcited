import { getActiveConfig } from "@/lib/db/configs";
import { ConfigureForm } from "@/components/configure/configure-form";

export const metadata = { title: "Configure · GetCited" };

export default async function ConfigurePage() {
  const initial = await getActiveConfig();
  return (
    // One-viewport frame: 100dvh minus the sticky h-14 (56px) app nav.
    // overflow-hidden at lg+ IS the no-page-scroll guarantee. Inside it a left
    // rail switches the Business Context / Platform panels: the query list
    // (zone B3) is the only internal scroll region on Business Context, and
    // the Platform panel may scroll internally. Below lg everything stacks and
    // the guarantee is intentionally relaxed. Full-width (no max-w/centering) so
    // the tab rail hugs the left edge and the three step columns get more width.
    <div className="flex w-full flex-col pt-3 pb-4 pl-4 pr-6 lg:h-[calc(100dvh-56px)] lg:overflow-hidden">
      <ConfigureForm initial={initial} />
    </div>
  );
}
