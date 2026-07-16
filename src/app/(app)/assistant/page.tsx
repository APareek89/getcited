import { Bot } from "lucide-react";
import { ComingSoon } from "@/components/coming-soon";

export const metadata = { title: "GEO Assistant · GetCited" };

export default function AssistantPage() {
  return (
    <ComingSoon icon={Bot} title="GEO Assistant" phase="Phase 2">
      A Claude-Code-style streaming chat with tool-call cards and the four starter
      cards — Benchmark, Diagnose, Plan, Track — lands here next.
    </ComingSoon>
  );
}
