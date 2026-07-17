import { NextResponse } from "next/server";

// Render health check (the geo-radar service is configured with
// healthCheckPath /healthz — keeping it saves a dashboard edit at cutover).
// Deliberately no DB touch: a transient DB blip should not mark deploys dead.
export function GET() {
  return NextResponse.json({ ok: true, server: "getcited" });
}
