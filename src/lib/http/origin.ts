/**
 * Public origin of THIS deployment. Render's proxy rewrites the Host header to
 * the app's internal bind address (localhost:$PORT) and carries the real host
 * only in x-forwarded-host — so ANY absolute URL built from request.url /
 * req.nextUrl is wrong behind the proxy (it leaks localhost:8080 into OAuth and
 * login redirects). Always build absolute same-origin URLs from this helper.
 * Dependency-free on purpose: safe to import from middleware/proxy.
 */
export function publicOrigin(req: { headers: Headers; url: string }): string {
  // x-forwarded-* can be comma-separated hop lists — first entry is the client edge.
  const fwdHost = req.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const fwdProto = req.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() || "https";
  if (fwdHost) return `${fwdProto}://${fwdHost}`.replace(/\/+$/, "");
  return new URL(req.url).origin.replace(/\/+$/, "");
}
