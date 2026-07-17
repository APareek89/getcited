import { NextResponse, type NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { getPlanById } from "@/lib/db/plans";
import { getActiveConfig } from "@/lib/db/configs";
import { buildPlanHtml, buildPlanWorkbook } from "@/lib/report/plan-report";
import { createServerSupabase } from "@/lib/supabase/server";

export const maxDuration = 60;

/**
 * Download a plan report. ?format=html|xlsx|pdf|docx (default html). RLS scopes the plan to
 * the signed-in user. Records a `reports` row (best-effort) for the dashboard.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ planId: string }> },
) {
  const user = await requireUser();
  const { planId } = await params;
  const format = (req.nextUrl.searchParams.get("format") ?? "html").toLowerCase();

  const plan = await getPlanById(planId); // RLS → only the user's own plan
  if (!plan) return NextResponse.json({ error: "Plan not found" }, { status: 404 });
  const cfg = await getActiveConfig();

  // best-effort audit row
  try {
    const supabase = await createServerSupabase();
    await supabase.from("reports").insert({
      user_id: user.id,
      plan_id: plan.id,
      kind: "plan",
      format,
      title: `Plan report (${format})`,
    });
  } catch {
    // non-fatal
  }

  const filenameBase = `getcited-plan-${plan.id.slice(0, 8)}`;

  if (format === "xlsx") {
    const buf = await buildPlanWorkbook(plan, cfg);
    return new NextResponse(new Uint8Array(buf), {
      headers: {
        "content-type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "content-disposition": `attachment; filename="${filenameBase}.xlsx"`,
      },
    });
  }

  if (format === "docx") {
    const { buildPlanDocx } = await import("@/lib/report/plan-docx");
    const buf = await buildPlanDocx(plan, cfg);
    return new NextResponse(new Uint8Array(buf), {
      headers: {
        "content-type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "content-disposition": `attachment; filename="${filenameBase}.docx"`,
      },
    });
  }

  if (format === "pdf") {
    const { buildPlanPdf } = await import("@/lib/report/plan-pdf");
    const buf = await buildPlanPdf(plan, cfg);
    return new NextResponse(new Uint8Array(buf), {
      headers: {
        "content-type": "application/pdf",
        "content-disposition": `attachment; filename="${filenameBase}.pdf"`,
      },
    });
  }

  const html = buildPlanHtml(plan, cfg);
  return new NextResponse(html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "content-disposition": `inline; filename="${filenameBase}.html"`,
    },
  });
}
