import { describe, it, expect } from "vitest";
import { InProcessPanelRunner } from "./runner";
import { MemoryGeoStore } from "./memory-store";
import { buildReport } from "./report";

describe("InProcessPanelRunner (mock mode, no keys)", () => {
  it("runs a panel end-to-end with no API keys and costs $0", async () => {
    const store = new MemoryGeoStore();
    const runner = new InProcessPanelRunner(store, {
      costCapUsd: 1.0,
      keys: {}, // no keys → mock panelists + deterministic parser
    });

    const out = await runner.run({
      brand: "PixelBin",
      competitors: ["Cloudinary", "ImageKit"],
      prompt_set_id: "demo",
      panel: ["haiku"],
    });

    expect(out.status).toBe("completed");
    expect(out.cost_usd).toBe(0);
    expect(out.answer_count).toBe(4); // demo has 4 prompts × 1 run × 1 panelist
    const total = out.share_of_voice.reduce((a, b) => a + b.sov, 0);
    // SoV sums to 1 (something was mentioned by the mock) or 0.
    expect(total === 0 || Math.abs(total - 1) < 1e-6).toBe(true);

    const report = await buildReport(store, out.report_id);
    expect(report).not.toBeNull();
    expect(report!.answers.length).toBe(4);
  });

  it("rejects an unknown panelist with a clear error", async () => {
    const store = new MemoryGeoStore();
    const runner = new InProcessPanelRunner(store, { costCapUsd: 1.0, keys: {} });
    await expect(
      runner.run({
        brand: "X",
        competitors: ["Y"],
        prompts: ["a?"],
        // @ts-expect-error intentionally invalid panelist id
        panel: ["not-a-model"],
      }),
    ).rejects.toThrow(/Unknown panelist/);
  });

  it("enforces the workload ceiling", async () => {
    const store = new MemoryGeoStore();
    const runner = new InProcessPanelRunner(store, { costCapUsd: 1.0, keys: {} });
    const prompts = Array.from({ length: 50 }, (_, i) => `q${i}?`);
    await expect(
      runner.run({ brand: "X", competitors: ["Y"], prompts, panel: ["haiku"], runs: 5 }),
    ).rejects.toThrow(/Workload too large/);
  });
});
