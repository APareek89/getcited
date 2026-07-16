"use client";

import { Plug, Terminal } from "lucide-react";

const TOOLS = [
  { name: "get_active_config", desc: "Load your saved brand, competitors, queries, budget and team." },
  { name: "run_benchmark", desc: "Run an AI panel → share-of-voice, citation share, sentiment." },
  { name: "diagnose_citations", desc: "Crawl + categorize competitor citations (coming in Plan phase)." },
  { name: "build_plan", desc: "Costed action plan + modeled projection (coming in Plan phase)." },
];

const CONFIG_EXAMPLE = `{
  "mcpServers": {
    "getcited": {
      "url": "https://<your-getcited-host>/api/mcp",
      "headers": { "Authorization": "Bearer <your-token>" }
    }
  }
}`;

export function McpPanel() {
  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6 md:p-10">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15">
          <Plug className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">MCP endpoint</h1>
          <p className="text-sm text-muted-foreground">
            Optional — drive GetCited from Claude Desktop, Cursor, or any MCP client.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-warning/30 bg-warning/10 p-3 text-sm text-warning">
        The hosted MCP endpoint ships after the web app is complete. The tools below are the
        same ones the in-app GEO Assistant already calls.
      </div>

      <section>
        <h2 className="mb-2 text-sm font-medium">Tools</h2>
        <div className="space-y-2">
          {TOOLS.map((t) => (
            <div key={t.name} className="rounded-lg border border-border bg-card p-3">
              <code className="text-xs text-primary">{t.name}</code>
              <p className="mt-1 text-xs text-muted-foreground">{t.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-2 flex items-center gap-1.5 text-sm font-medium">
          <Terminal className="h-3.5 w-3.5" /> Client config (example)
        </h2>
        <pre className="overflow-auto rounded-lg border border-border bg-card p-3 text-[11px] leading-relaxed text-muted-foreground">
          {CONFIG_EXAMPLE}
        </pre>
      </section>
    </div>
  );
}
