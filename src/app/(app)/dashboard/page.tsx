import { LayoutDashboard } from "lucide-react";
import { ComingSoon } from "@/components/coming-soon";

export const metadata = { title: "Dashboard · GetCited" };

export default function DashboardPage() {
  return (
    <ComingSoon icon={LayoutDashboard} title="Dashboard" phase="Phase 5">
      KPI cards, share-of-voice trend, competitor leaderboard, your active plan and its
      progress, and recent reports will appear here once you run your first benchmark.
    </ComingSoon>
  );
}
