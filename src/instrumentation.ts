import { registerOTel } from "@vercel/otel";
import { LangfuseExporter } from "langfuse-vercel";

/**
 * Langfuse observability for every AI SDK call (panelists, parser, agent, roadmap,
 * content). Each streamText/generateText/generateObject call opts in via
 * `experimental_telemetry`. No-op unless LANGFUSE_PUBLIC_KEY + LANGFUSE_SECRET_KEY
 * are set (LANGFUSE_BASEURL optional, defaults to cloud.langfuse.com).
 */
export function register() {
  if (!process.env.LANGFUSE_PUBLIC_KEY || !process.env.LANGFUSE_SECRET_KEY) return;
  registerOTel({
    serviceName: "getcited",
    traceExporter: new LangfuseExporter(),
  });
}
